import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { apiError } from "@/lib/security";
import { safeJson, ValidationError } from "@/lib/validation";
import type { UserRole } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request, { csrf: false });
    const body = (await safeJson(request)) as Record<string, unknown>;

    const inputRole = typeof body.role === "string" ? body.role : "";
    if (inputRole !== "customer" && inputRole !== "shop_owner" && inputRole !== "store_owner") {
      throw new ValidationError("Invalid role specified.");
    }

    const dbRole: UserRole = (inputRole === "shop_owner" || inputRole === "store_owner") ? "store_owner" : "customer";
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const userId = session.user.id;

    // Update D1 local users table with permanent chosen role
    await db.batch([
      db
        .prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
        .bind(dbRole, now, userId),
      db
        .prepare(
          "INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, 'auth.role_selected', 'user', ?, ?, ?)"
        )
        .bind(
          crypto.randomUUID(),
          userId,
          userId,
          JSON.stringify({ role: dbRole }),
          now
        ),
    ]);

    const redirectTo = dbRole === "store_owner" ? "/owner" : "/";
    return NextResponse.json({
      success: true,
      role: dbRole,
      redirectTo,
    });
  } catch (error) {
    return apiError(error);
  }
}
