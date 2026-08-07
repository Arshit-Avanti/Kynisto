import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";

async function ensureLoyaltyTables() {
  try {
    const d1 = getD1();
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS store_loyalty_settings (
        store_id TEXT PRIMARY KEY,
        is_loyalty_enabled INTEGER DEFAULT 1,
        reward_points_per_scan INTEGER DEFAULT 50,
        qr_code_token TEXT NOT NULL UNIQUE,
        scan_cooldown_hours INTEGER DEFAULT 24,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();
  } catch (e) {
    console.warn("Table init notice:", e);
  }
}

export async function GET(request: Request) {
  try {
    await ensureLoyaltyTables();
    const session = await requireApiSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const d1 = getD1();
    const now = Math.floor(Date.now() / 1000);

    // Fetch or create default store loyalty settings
    let settings = await d1.prepare(`
      SELECT * FROM store_loyalty_settings WHERE store_id = ?
    `).bind(storeId).first<any>();

    if (!settings) {
      const defaultToken = `KYNISTO_LOYALTY_${storeId}`;
      await d1.prepare(`
        INSERT INTO store_loyalty_settings (
          store_id, is_loyalty_enabled, reward_points_per_scan, qr_code_token, scan_cooldown_hours, created_at, updated_at
        ) VALUES (?, 1, 50, ?, 24, ?, ?)
        ON CONFLICT DO NOTHING
      `).bind(storeId, defaultToken, now, now).run();

      settings = {
        store_id: storeId,
        is_loyalty_enabled: 1,
        reward_points_per_scan: 50,
        qr_code_token: defaultToken,
        scan_cooldown_hours: 24,
      };
    }

    // Generate scannable QR code image URL
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(settings.qr_code_token)}`;

    // Fetch customer loyalty balances for this store
    const customerBalances = await d1.prepare(`
      SELECT slp.points, slp.last_visited_at, u.name as customer_name, u.email as customer_email
      FROM store_loyalty_points slp
      LEFT JOIN users u ON u.id = slp.user_id
      WHERE slp.store_id = ? AND slp.points > 0
      ORDER BY slp.points DESC
    `).bind(storeId).all();

    // Fetch scan audit history for this store
    const scanHistory = await d1.prepare(`
      SELECT ql.id, ql.user_id, ql.kynisto_points_earned, ql.store_points_earned, ql.status, ql.scanned_at, u.name as customer_name, u.email as customer_email
      FROM qr_scan_logs ql
      LEFT JOIN users u ON u.id = ql.user_id
      WHERE ql.store_id = ?
      ORDER BY ql.scanned_at DESC
      LIMIT 50
    `).bind(storeId).all();

    return NextResponse.json({
      settings: {
        storeId: settings.store_id,
        isLoyaltyEnabled: Boolean(settings.is_loyalty_enabled),
        rewardPointsPerScan: settings.reward_points_per_scan || 50,
        qrCodeToken: settings.qr_code_token,
        scanCooldownHours: settings.scan_cooldown_hours || 24,
        qrCodeImageUrl,
      },
      customerBalances: customerBalances.results ?? [],
      scanHistory: scanHistory.results ?? [],
    });
  } catch (err: any) {
    console.error("GET /api/owner/loyalty error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to fetch loyalty settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureLoyaltyTables();
    const session = await requireApiSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, isLoyaltyEnabled, rewardPointsPerScan, regenerateQr } = await request.json();
    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const d1 = getD1();
    const now = Math.floor(Date.now() / 1000);

    const points = Math.min(100, Math.max(50, parseInt(String(rewardPointsPerScan || 50), 10)));
    const enabled = isLoyaltyEnabled ? 1 : 0;

    let existing = await d1.prepare(`SELECT qr_code_token FROM store_loyalty_settings WHERE store_id = ?`).bind(storeId).first<any>();
    let newToken = existing?.qr_code_token || `KYNISTO_LOYALTY_${storeId}`;

    if (regenerateQr) {
      newToken = `KYNISTO_LOYALTY_${storeId}_${Date.now().toString(36)}`;
    }

    await d1.prepare(`
      INSERT INTO store_loyalty_settings (
        store_id, is_loyalty_enabled, reward_points_per_scan, qr_code_token, scan_cooldown_hours, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 24, ?, ?)
      ON CONFLICT(store_id) DO UPDATE SET
        is_loyalty_enabled = ?,
        reward_points_per_scan = ?,
        qr_code_token = ?,
        updated_at = ?
    `).bind(storeId, enabled, points, newToken, now, now, enabled, points, newToken, now).run();

    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newToken)}`;

    return NextResponse.json({
      success: true,
      message: "Store loyalty settings updated successfully!",
      settings: {
        storeId,
        isLoyaltyEnabled: Boolean(enabled),
        rewardPointsPerScan: points,
        qrCodeToken: newToken,
        qrCodeImageUrl,
      }
    });
  } catch (err: any) {
    console.error("POST /api/owner/loyalty error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update loyalty settings" }, { status: 500 });
  }
}
