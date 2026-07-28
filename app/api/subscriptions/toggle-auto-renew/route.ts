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

  const sub = await db
    .prepare(`SELECT id, auto_renew FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1`)
    .bind(session.user.id)
    .first<{ id: string; auto_renew: number }>();

  if (!sub) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
  }

  const newStatus = sub.auto_renew ? 0 : 1;
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(`UPDATE subscriptions SET auto_renew = ?, updated_at = ? WHERE id = ?`)
    .bind(newStatus, now, sub.id)
    .run();

  return NextResponse.json({
    success: true,
    autoRenew: Boolean(newStatus),
    message: newStatus ? "Auto-renew enabled." : "Auto-renew disabled.",
  });
}
