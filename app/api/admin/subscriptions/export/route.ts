import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { ensureSubscriptionTables } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    await ensureSubscriptionTables();
    const db = getD1();

    const subsResult = await db
      .prepare(
        `SELECT s.id, s.user_id AS userId, COALESCE(u.name, s.user_id, 'User') AS userName, COALESCE(u.email, '') AS userEmail, COALESCE(u.role, s.user_role, 'customer') AS userRole, s.plan_id AS planId, s.billing_cycle AS billingCycle, s.amount, s.status, s.starts_at AS startsAt, s.expires_at AS expiresAt, s.utr, s.receipt_number AS receiptNumber, s.created_at AS createdAt
         FROM subscriptions s
         LEFT JOIN users u ON u.id = s.user_id
         ORDER BY s.created_at DESC`
      )
      .all<{
        id: string;
        userId: string;
        userName: string;
        userEmail: string;
        userRole: string;
        planId: string;
        billingCycle: string;
        amount: number;
        status: string;
        startsAt: number;
        expiresAt: number;
        utr?: string;
        receiptNumber?: string;
        createdAt: number;
      }>();

    const rows = subsResult.results || [];

    const headers = [
      "Subscription ID",
      "User ID",
      "User Name",
      "User Email",
      "Role",
      "Plan",
      "Billing Cycle",
      "Amount (INR)",
      "Status",
      "Starts At",
      "Expires At",
      "UTR Ref",
      "Receipt Number",
      "Created At",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const formatDate = (val: number | null | undefined) => {
      if (!val || isNaN(Number(val)) || Number(val) <= 0) return "N/A";
      try {
        return new Date(Number(val) * 1000).toISOString();
      } catch {
        return "N/A";
      }
    };

    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          escapeCsv(r.id),
          escapeCsv(r.userId),
          escapeCsv(r.userName),
          escapeCsv(r.userEmail),
          escapeCsv(r.userRole),
          escapeCsv(r.planId),
          escapeCsv(r.billingCycle),
          escapeCsv(r.amount),
          escapeCsv(r.status),
          escapeCsv(formatDate(r.startsAt)),
          escapeCsv(formatDate(r.expiresAt)),
          escapeCsv(r.utr || ""),
          escapeCsv(r.receiptNumber || ""),
          escapeCsv(formatDate(r.createdAt)),
        ].join(",")
      ),
    ];

    return new NextResponse(csvRows.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kynisto_subscriptions_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("Subscriptions CSV export error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to export subscriptions CSV" },
      { status: 500 }
    );
  }
}
