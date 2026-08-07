import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";

async function ensureLoyaltyTables() {
  try {
    const d1 = getD1();
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS system_loyalty_config (
        id TEXT PRIMARY KEY DEFAULT 'global',
        kynisto_points_per_scan INTEGER DEFAULT 10,
        max_kynisto_balance_cap INTEGER DEFAULT 1000,
        updated_at INTEGER NOT NULL
      )
    `).run();

    await d1.prepare(`
      INSERT INTO system_loyalty_config (id, kynisto_points_per_scan, max_kynisto_balance_cap, updated_at)
      VALUES ('global', 10, 1000, ?)
      ON CONFLICT DO NOTHING
    `).bind(Math.floor(Date.now() / 1000)).run();
  } catch (e) {
    console.warn("Table init notice:", e);
  }
}

export async function GET(request: Request) {
  try {
    await ensureLoyaltyTables();
    const session = await requireApiSession(request);
    if (!session?.user || (session.user.role !== "admin" && !session.user.isSuperAdmin)) {
      return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    }

    const d1 = getD1();

    // 1. Fetch global loyalty config
    let config = await d1.prepare(`SELECT * FROM system_loyalty_config WHERE id = 'global'`).first<any>();
    if (!config) {
      config = { kynisto_points_per_scan: 10, max_kynisto_balance_cap: 1000 };
    }

    // 2. Fetch global scan audit log (all scans across platform)
    const scanLogs = await d1.prepare(`
      SELECT ql.id, ql.user_id, ql.store_id, ql.qr_token, ql.kynisto_points_earned, ql.store_points_earned, ql.status, ql.scanned_at,
             u.name as customer_name, u.email as customer_email, s.name as store_name
      FROM qr_scan_logs ql
      LEFT JOIN users u ON u.id = ql.user_id
      LEFT JOIN stores s ON s.id = ql.store_id
      ORDER BY ql.scanned_at DESC
      LIMIT 100
    `).all();

    // 3. Fetch summary metrics
    const totals = await d1.prepare(`
      SELECT
        COUNT(*) as total_scans,
        SUM(CASE WHEN status IN ('success', 'capped_kynisto') THEN 1 ELSE 0 END) as successful_scans,
        SUM(CASE WHEN status = 'cooldown_active' THEN 1 ELSE 0 END) as duplicate_attempts,
        SUM(kynisto_points_earned) as total_kynisto_awarded,
        SUM(store_points_earned) as total_store_awarded
      FROM qr_scan_logs
    `).first<any>();

    // 4. Fetch participating stores & loyalty configs
    const participatingStores = await d1.prepare(`
      SELECT s.id, s.name, s.slug, COALESCE(sls.is_loyalty_enabled, 1) as is_loyalty_enabled, COALESCE(sls.reward_points_per_scan, 50) as reward_points_per_scan, sls.qr_code_token
      FROM stores s
      LEFT JOIN store_loyalty_settings sls ON sls.store_id = s.id
      ORDER BY s.name ASC
    `).all();

    return NextResponse.json({
      config: {
        kynistoPointsPerScan: config.kynisto_points_per_scan || 10,
        maxKynistoBalanceCap: config.max_kynisto_balance_cap || 1000,
      },
      metrics: {
        totalScans: totals?.total_scans || 0,
        successfulScans: totals?.successful_scans || 0,
        duplicateAttempts: totals?.duplicate_attempts || 0,
        totalKynistoAwarded: totals?.total_kynisto_awarded || 0,
        totalStoreAwarded: totals?.total_store_awarded || 0,
      },
      scanLogs: scanLogs.results ?? [],
      participatingStores: participatingStores.results ?? [],
    });
  } catch (err: any) {
    console.error("GET /api/admin/loyalty error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to fetch admin loyalty config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureLoyaltyTables();
    const session = await requireApiSession(request);
    if (!session?.user || (session.user.role !== "admin" && !session.user.isSuperAdmin)) {
      return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    }

    const { kynistoPointsPerScan, maxKynistoBalanceCap } = await request.json();
    const d1 = getD1();
    const now = Math.floor(Date.now() / 1000);

    const pointsPerScan = Math.min(10, Math.max(5, parseInt(String(kynistoPointsPerScan || 10), 10)));
    const maxCap = Math.max(100, parseInt(String(maxKynistoBalanceCap || 1000), 10));

    await d1.prepare(`
      INSERT INTO system_loyalty_config (id, kynisto_points_per_scan, max_kynisto_balance_cap, updated_at)
      VALUES ('global', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        kynisto_points_per_scan = ?,
        max_kynisto_balance_cap = ?,
        updated_at = ?
    `).bind(pointsPerScan, maxCap, now, pointsPerScan, maxCap, now).run();

    return NextResponse.json({
      success: true,
      message: `Global Kynisto reward points updated to ${pointsPerScan} points per scan (Max cap: ${maxCap} points).`,
      config: {
        kynistoPointsPerScan: pointsPerScan,
        maxKynistoBalanceCap: maxCap,
      }
    });
  } catch (err: any) {
    console.error("POST /api/admin/loyalty error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update global loyalty config" }, { status: 500 });
  }
}
