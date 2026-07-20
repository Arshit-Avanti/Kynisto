import { getD1 } from "@/db/runtime";
import { hashPassword, randomToken } from "@/lib/crypto";
import { HttpError } from "@/lib/security";
import type { SupabaseAuthUser } from "@/lib/supabase-auth";
import { cleanText } from "@/lib/validation";
import type { UserRole } from "@/lib/rbac";

export type GoogleRole = Extract<UserRole, "customer" | "store_owner">;

export type GoogleLocalIdentity = {
  userId: string;
  id: string;
  name: string;
  email: string;
  role: GoogleRole;
  status: string;
  avatarUrl: string | null;
};

type GoogleProfile = {
  providerUserId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerifiedAt: number;
};

function metadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function googleProfile(user: SupabaseAuthUser): GoogleProfile {
  const email = user.email?.trim().toLowerCase();
  if (!email || !user.id) {
    throw new HttpError(
      401,
      "Google did not provide a verified email address.",
      "INVALID_GOOGLE_IDENTITY",
    );
  }
  const identityMetadata =
    user.identities?.find((identity) => identity.provider === "google")
      ?.identity_data ?? null;
  const rawName =
    metadataString(user.user_metadata, ["full_name", "name"]) ??
    metadataString(identityMetadata, ["full_name", "name"]) ??
    email.split("@")[0];
  const name = cleanText(rawName, "Google profile name", {
    min: 1,
    max: 80,
  });
  const rawAvatar =
    metadataString(user.user_metadata, ["avatar_url", "picture"]) ??
    metadataString(identityMetadata, ["avatar_url", "picture"]);
  let avatarUrl: string | null = null;
  if (rawAvatar) {
    try {
      const parsed = new URL(rawAvatar);
      if (parsed.protocol === "https:" && rawAvatar.length <= 2048) {
        avatarUrl = parsed.toString();
      }
    } catch {
      avatarUrl = null;
    }
  }
  const verifiedRaw = user.email_confirmed_at ?? user.confirmed_at;
  const verifiedTimestamp = verifiedRaw
    ? Math.floor(new Date(verifiedRaw).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  return {
    providerUserId: user.id,
    name,
    email,
    avatarUrl,
    emailVerifiedAt: Number.isFinite(verifiedTimestamp)
      ? verifiedTimestamp
      : Math.floor(Date.now() / 1000),
  };
}

async function findGoogleLocalIdentity(
  providerUserId: string,
  email: string,
): Promise<(GoogleLocalIdentity & { providerUserId: string | null }) | null> {
  const db = getD1();
  const byProvider = await db
    .prepare(
      `SELECT u.id AS userId, u.id AS id, u.name, u.email, u.role, u.status,
        u.avatar_url AS avatarUrl, e.provider_user_id AS providerUserId
       FROM external_auth_identities e
       JOIN users u ON u.id = e.user_id
       WHERE e.provider = 'google' AND e.provider_user_id = ?
       LIMIT 1`,
    )
    .bind(providerUserId)
    .first<
      GoogleLocalIdentity & {
        providerUserId: string | null;
        role: UserRole;
      }
    >();
  if (byProvider) {
    if (byProvider.role === "admin") {
      throw new HttpError(
        403,
        "Administrators must use the protected Admin login.",
        "ACCESS_DENIED",
      );
    }
    return byProvider as GoogleLocalIdentity & {
      providerUserId: string | null;
    };
  }

  const byEmail = await db
    .prepare(
      `SELECT u.id AS userId, u.id AS id, u.name, u.email, u.role, u.status,
        u.avatar_url AS avatarUrl, e.provider_user_id AS providerUserId
       FROM users u
       LEFT JOIN external_auth_identities e
         ON e.user_id = u.id AND e.provider = 'google'
       WHERE u.email = ?
       LIMIT 1`,
    )
    .bind(email)
    .first<
      GoogleLocalIdentity & {
        providerUserId: string | null;
        role: UserRole;
      }
    >();
  if (byEmail?.role === "admin") {
    throw new HttpError(
      403,
      "Administrators must use the protected Admin login.",
      "ACCESS_DENIED",
    );
  }
  return byEmail
    ? (byEmail as GoogleLocalIdentity & { providerUserId: string | null })
    : null;
}

async function refreshGoogleIdentity(
  identity: GoogleLocalIdentity & { providerUserId: string | null },
  profile: GoogleProfile,
  role: GoogleRole,
): Promise<GoogleLocalIdentity> {
  if (identity.status !== "active") {
    throw new HttpError(
      403,
      "This account is not currently active.",
      "ACCOUNT_INACTIVE",
    );
  }
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        "UPDATE users SET name = ?, avatar_url = ?, last_login_at = ?, updated_at = ? WHERE id = ?",
      )
      .bind(
        profile.name,
        profile.avatarUrl,
        now,
        now,
        identity.userId,
      ),
  ];
  if (identity.providerUserId) {
    statements.push(
      db
        .prepare(
          "UPDATE external_auth_identities SET provider_user_id = ?, email = ?, email_verified_at = ?, updated_at = ? WHERE user_id = ? AND provider = 'google'",
        )
        .bind(
          profile.providerUserId,
          profile.email,
          profile.emailVerifiedAt,
          now,
          identity.userId,
        ),
    );
  } else {
    statements.push(
      db
        .prepare(
          "INSERT INTO external_auth_identities (id, user_id, provider, provider_user_id, email, email_verified_at, created_at, updated_at) VALUES (?, ?, 'google', ?, ?, ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          identity.userId,
          profile.providerUserId,
          profile.email,
          profile.emailVerifiedAt,
          now,
          now,
        ),
    );
  }
  await db.batch(statements);
  return {
    userId: identity.userId,
    id: identity.userId,
    name: profile.name,
    email: profile.email,
    role: identity.role,
    status: identity.status,
    avatarUrl: profile.avatarUrl,
  };
}

async function createGoogleIdentity(
  profile: GoogleProfile,
  role: GoogleRole,
): Promise<GoogleLocalIdentity> {
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const userId = crypto.randomUUID();
  const unusablePassword = await hashPassword(randomToken(48));
  try {
    await db.batch([
      db
        .prepare(
          "INSERT INTO users (id, name, email, password_hash, password_salt, password_iterations, role, status, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)",
        )
        .bind(
          userId,
          profile.name,
          profile.email,
          unusablePassword.hash,
          unusablePassword.salt,
          unusablePassword.iterations,
          role,
          profile.avatarUrl,
          now,
          now,
        ),
      db
        .prepare(
          "INSERT INTO user_security (user_id, must_change_password, is_super_admin, updated_at) VALUES (?, 0, 0, ?)",
        )
        .bind(userId, now),
      db
        .prepare(
          "INSERT INTO user_preferences (user_id, email_notifications, order_notifications, marketing_notifications, updated_at) VALUES (?, 1, 1, 0, ?)",
        )
        .bind(userId, now),
      db
        .prepare(
          "INSERT INTO external_auth_identities (id, user_id, provider, provider_user_id, email, email_verified_at, created_at, updated_at) VALUES (?, ?, 'google', ?, ?, ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          userId,
          profile.providerUserId,
          profile.email,
          profile.emailVerifiedAt,
          now,
          now,
        ),
      db
        .prepare(
          "INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, 'auth.google_registered', 'user', ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          userId,
          userId,
          JSON.stringify({ provider: "google", role }),
          now,
        ),
    ]);
  } catch (error) {
    const racedIdentity = await findGoogleLocalIdentity(
      profile.providerUserId,
      profile.email,
    );
    if (racedIdentity) {
      return refreshGoogleIdentity(racedIdentity, profile, role);
    }
    throw error;
  }
  return {
    userId,
    id: userId,
    name: profile.name,
    email: profile.email,
    role,
    status: "active",
    avatarUrl: profile.avatarUrl,
  };
}

export async function ensureGoogleLocalIdentity(
  supabaseUser: SupabaseAuthUser,
  role: GoogleRole,
): Promise<GoogleLocalIdentity> {
  const profile = googleProfile(supabaseUser);
  const existing = await findGoogleLocalIdentity(
    profile.providerUserId,
    profile.email,
  );
  return existing
    ? refreshGoogleIdentity(existing, profile, role)
    : createGoogleIdentity(profile, role);
}
