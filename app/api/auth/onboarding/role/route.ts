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
    if (inputRole !== "customer" && inputRole !== "shop_owner" && inputRole !== "store_owner" && inputRole !== "healthcare_owner") {
      throw new ValidationError("Invalid role specified.");
    }

    const isHealthcare = inputRole === "healthcare_owner";
    const isOwner = inputRole === "shop_owner" || inputRole === "store_owner" || isHealthcare;
    const dbRole: UserRole = isOwner ? "store_owner" : "customer";
    const ownerType: "shop" | "healthcare" = isHealthcare ? "healthcare" : "shop";
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const userId = session.user.id;

    let grantedMaxTierTrial = false;

    // Ensure owner_type column exists
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN owner_type text DEFAULT 'shop'").run();
    } catch {}

    // Save the selected role and owner_type to the users table
    try {
      await db.prepare("UPDATE users SET role = ?, owner_type = ?, updated_at = ? WHERE id = ?")
        .bind(dbRole, ownerType, now, userId)
        .run();
    } catch {
      await db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
        .bind(dbRole, now, userId)
        .run();
    }

    if (dbRole === "store_owner") {
      const { ensureSubscriptionTables } = await import("@/lib/subscriptions");
      await ensureSubscriptionTables();

      const existingTrial = await db
        .prepare("SELECT id FROM trial_history WHERE user_id = ? OR email = ? LIMIT 1")
        .bind(userId, session.user.email)
        .first<{ id: string }>();

      if (!existingTrial) {
        grantedMaxTierTrial = true;
        const trialStartedAt = now;
        const trialEndedAt = now + 30 * 86400; // 30 Days (1 Month)

        await db.batch([
          db
            .prepare(
              "INSERT INTO trial_history (id, user_id, email, plan_id, trial_started_at, trial_ended_at, created_at) VALUES (?, ?, ?, 'enterprise', ?, ?, ?)"
            )
            .bind(crypto.randomUUID(), userId, session.user.email, trialStartedAt, trialEndedAt, now),
          db
            .prepare(
              `INSERT INTO owner_subscriptions (id, user_id, role, plan, price, billing_cycle, status, start_date, expiry_date, trial, auto_renew, created_at, updated_at)
               VALUES (?, ?, 'store_owner', 'enterprise', 0, 'monthly', 'active', ?, ?, 1, 0, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                 plan = 'enterprise',
                 status = 'active',
                 start_date = excluded.start_date,
                 expiry_date = excluded.expiry_date,
                 trial = 1,
                 updated_at = excluded.updated_at`
            )
            .bind(crypto.randomUUID(), userId, trialStartedAt, trialEndedAt, now, now),
        ]);
      }

      if (isHealthcare) {
        const { ensureHealthcareTables } = await import("@/lib/healthcare");
        await ensureHealthcareTables();

        const existingStore = await db
          .prepare("SELECT id FROM stores WHERE owner_id = ? LIMIT 1")
          .bind(userId)
          .first<{ id: string }>();

        if (!existingStore) {
          const healthCategory = await db
            .prepare("SELECT id FROM categories WHERE module = 'healthcare' OR slug = 'clinics-doctors' LIMIT 1")
            .first<{ id: string }>();
          const categoryId = healthCategory?.id || "category-03";
          const clinicStoreId = crypto.randomUUID();
          const clinicName = session.user.name ? `${session.user.name}'s Healthcare Clinic` : "City Healthcare Clinic";
          const clinicSlug = `clinic-${clinicStoreId.slice(0, 8)}`;

          await db.batch([
            db.prepare(`
              INSERT INTO stores (
                id, owner_id, category_id, name, slug, description, business_type,
                address, area, city, state, country, postal_code, latitude, longitude,
                business_hours, opening_days, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
            `).bind(
              clinicStoreId,
              userId,
              categoryId,
              clinicName,
              clinicSlug,
              "Verified community healthcare clinic providing OPD consultations, digital prescriptions, doctor appointments, and live queue tracking.",
              "Healthcare Clinic / Medical Center",
              "Main Market, Sector 14",
              "Local Area",
              "Your Locality",
              "State",
              "India",
              "110001",
              28.7381,
              77.2669,
              '{"monday":{"open":"09:00","close":"20:00"},"tuesday":{"open":"09:00","close":"20:00"},"wednesday":{"open":"09:00","close":"20:00"},"thursday":{"open":"09:00","close":"20:00"},"friday":{"open":"09:00","close":"20:00"},"saturday":{"open":"09:00","close":"20:00"}}',
              '[1,2,3,4,5,6]',
              now,
              now
            ),
            db.prepare(`
              INSERT INTO healthcare_provider_profiles (
                store_id, provider_type, accepting_patients, allow_appointments, emergency_available,
                admin_queue_enabled, owner_queue_enabled, queue_activation_status, verification_status,
                created_at, updated_at
              ) VALUES (?, 'clinic', 1, 1, 1, 1, 1, 'approved', 'verified', ?, ?)
              ON CONFLICT(store_id) DO UPDATE SET
                accepting_patients = 1,
                allow_appointments = 1,
                admin_queue_enabled = 1,
                owner_queue_enabled = 1,
                verification_status = 'verified',
                queue_activation_status = 'approved',
                updated_at = excluded.updated_at
            `).bind(clinicStoreId, now, now),
            db.prepare(`
              INSERT INTO healthcare_queue_settings (
                store_id, status, consultation_minutes, opening_time, closing_time,
                maximum_daily_patients, grace_period_minutes, updated_at
              ) VALUES (?, 'open', 15, '09:00', '20:00', 100, 30, ?)
              ON CONFLICT(store_id) DO NOTHING
            `).bind(clinicStoreId, now),
          ]);
        }
      }
    }

    const redirectTo = isHealthcare ? "/healthcare/dashboard" : dbRole === "store_owner" ? "/owner" : "/";
    return NextResponse.json({
      success: true,
      role: dbRole,
      ownerType,
      grantedMaxTierTrial,
      redirectTo,
    });
  } catch (error) {
    return apiError(error);
  }
}
