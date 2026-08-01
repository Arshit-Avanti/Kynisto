import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { ensureSubscriptionTables } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSubscriptionTables();
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);

  const sub = await db
    .prepare(`SELECT id, expires_at FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1`)
    .bind(session.user.id)
    .first<{ id: string; expires_at: number }>();

  if (!sub) {
    return NextResponse.json({ error: "No active subscription to cancel." }, { status: 404 });
  }

  await db
    .prepare(`UPDATE subscriptions SET status = 'cancelled', auto_renew = 0, cancelled_at = ?, updated_at = ? WHERE id = ?`)
    .bind(now, now, sub.id)
    .run();

  return NextResponse.json({
    success: true,
    message: "Your subscription has been cancelled. You will retain access until your current billing period ends.",
    expiresAt: sub.expires_at,
  });
}
