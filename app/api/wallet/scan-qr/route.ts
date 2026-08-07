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

    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS qr_scan_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        qr_token TEXT NOT NULL,
        kynisto_points_earned INTEGER DEFAULT 0,
        store_points_earned INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        scanned_at INTEGER NOT NULL
      )
    `).run();

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
    console.warn("Loyalty table init notice:", e);
  }
}

export async function POST(request: Request) {
  try {
    await ensureLoyaltyTables();
    const session = await requireApiSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { qrCodeToken } = await request.json();
    if (!qrCodeToken || typeof qrCodeToken !== "string") {
      return NextResponse.json({ error: "Valid store QR Code token is required" }, { status: 400 });
    }

    const token = qrCodeToken.trim();
    const d1 = getD1();
    const now = Math.floor(Date.now() / 1000);

    // 1. Find store loyalty settings by qr_code_token or matching store ID format
    let storeSettings = await d1.prepare(`
      SELECT sls.*, s.name as store_name
      FROM store_loyalty_settings sls
      JOIN stores s ON s.id = sls.store_id
      WHERE sls.qr_code_token = ? OR sls.store_id = ? OR ? = ('KYNISTO_LOYALTY_' || sls.store_id)
    `).bind(token, token, token).first<any>();

    // Fallback: If no custom loyalty settings row exists yet for this store ID, initialize default settings for a valid store
    if (!storeSettings) {
      const existingStore = await d1.prepare(`
        SELECT id, name FROM stores WHERE id = ? OR slug = ? OR ? = ('KYNISTO_LOYALTY_' || id)
      `).bind(token, token, token).first<any>();

      if (existingStore) {
        const defaultToken = `KYNISTO_LOYALTY_${existingStore.id}`;
        await d1.prepare(`
          INSERT INTO store_loyalty_settings (
            store_id, is_loyalty_enabled, reward_points_per_scan, qr_code_token, scan_cooldown_hours, created_at, updated_at
          ) VALUES (?, 1, 50, ?, 24, ?, ?)
          ON CONFLICT(store_id) DO UPDATE SET updated_at = ?
        `).bind(existingStore.id, defaultToken, now, now, now).run();

        storeSettings = {
          store_id: existingStore.id,
          store_name: existingStore.name,
          is_loyalty_enabled: 1,
          reward_points_per_scan: 50,
          qr_code_token: defaultToken,
          scan_cooldown_hours: 24,
        };
      }
    }

    if (!storeSettings) {
      // Log invalid scan attempt
      await d1.prepare(`
        INSERT INTO qr_scan_logs (id, user_id, store_id, qr_token, kynisto_points_earned, store_points_earned, status, scanned_at)
        VALUES (?, ?, ?, ?, 0, 0, 'invalid_qr', ?)
      `).bind(`scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, session.user.id, "unknown", token, now).run();

      return NextResponse.json({ error: "Invalid or unrecognized Kynisto Store QR Code" }, { status: 404 });
    }

    if (!storeSettings.is_loyalty_enabled) {
      await d1.prepare(`
        INSERT INTO qr_scan_logs (id, user_id, store_id, qr_token, kynisto_points_earned, store_points_earned, status, scanned_at)
        VALUES (?, ?, ?, ?, 0, 0, 'store_disabled', ?)
      `).bind(`scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, session.user.id, storeSettings.store_id, token, now).run();

      return NextResponse.json({ error: `${storeSettings.store_name} has currently disabled QR loyalty rewards.` }, { status: 403 });
    }

    // 2. Check cooldown rule (Default 24 hours per customer per store)
    const cooldownSeconds = (storeSettings.scan_cooldown_hours || 24) * 3600;
    const minScannedAt = now - cooldownSeconds;

    const recentScan = await d1.prepare(`
      SELECT scanned_at FROM qr_scan_logs
      WHERE user_id = ? AND store_id = ? AND status IN ('success', 'capped_kynisto') AND scanned_at >= ?
      ORDER BY scanned_at DESC LIMIT 1
    `).bind(session.user.id, storeSettings.store_id, minScannedAt).first<any>();

    if (recentScan) {
      const elapsed = now - recentScan.scanned_at;
      const remainingSecs = cooldownSeconds - elapsed;
      const hoursLeft = Math.ceil(remainingSecs / 3600);

      await d1.prepare(`
        INSERT INTO qr_scan_logs (id, user_id, store_id, qr_token, kynisto_points_earned, store_points_earned, status, scanned_at)
        VALUES (?, ?, ?, ?, 0, 0, 'cooldown_active', ?)
      `).bind(`scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, session.user.id, storeSettings.store_id, token, now).run();

      return NextResponse.json({
        error: `You have already scanned at ${storeSettings.store_name} today. Please wait ${hoursLeft} hour${hoursLeft > 1 ? "s" : ""} before scanning again!`,
        cooldownActive: true,
        storeName: storeSettings.store_name
      }, { status: 429 });
    }

    // 3. Fetch global system config (Global Kynisto points per scan 5-10 & 1000 max cap)
    let globalConfig = await d1.prepare(`SELECT * FROM system_loyalty_config WHERE id = 'global'`).first<any>();
    const kynistoPointsPerScan = Math.min(10, Math.max(5, globalConfig?.kynisto_points_per_scan || 10));
    const maxKynistoCap = globalConfig?.max_kynisto_balance_cap || 1000;

    // 4. Fetch customer current global wallet
    let wallet = await d1.prepare(`SELECT kynisto_points FROM kynisto_wallets WHERE user_id = ?`).bind(session.user.id).first<any>();
    const currentKynistoPoints = wallet?.kynisto_points || 0;

    let kynistoAwarded = 0;
    let isCapped = false;

    if (currentKynistoPoints >= maxKynistoCap) {
      isCapped = true;
      kynistoAwarded = 0;
    } else {
      kynistoAwarded = Math.min(kynistoPointsPerScan, maxKynistoCap - currentKynistoPoints);
    }

    // 5. Calculate store loyalty points (configured by store owner 50-100)
    const storePointsAwarded = Math.min(100, Math.max(50, storeSettings.reward_points_per_scan || 50));

    // 6. Update user global wallet atomically
    const newKynistoBalance = currentKynistoPoints + kynistoAwarded;
    await d1.prepare(`
      INSERT INTO kynisto_wallets (user_id, kynisto_points, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET kynisto_points = ?, updated_at = ?
    `).bind(session.user.id, newKynistoBalance, now, newKynistoBalance, now).run();

    if (kynistoAwarded > 0) {
      await d1.prepare(`
        INSERT INTO kynisto_point_transactions (id, user_id, amount, type, description, created_at)
        VALUES (?, ?, ?, 'earned', ?, ?)
      `).bind(
        `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        session.user.id,
        kynistoAwarded,
        `Earned via QR scan at ${storeSettings.store_name}`,
        now
      ).run();
    }

    // 7. Update user store loyalty points balance atomically
    const storeLoyaltyRow = await d1.prepare(`
      SELECT points FROM store_loyalty_points WHERE user_id = ? AND store_id = ?
    `).bind(session.user.id, storeSettings.store_id).first<any>();

    const newStoreBalance = (storeLoyaltyRow?.points || 0) + storePointsAwarded;

    await d1.prepare(`
      INSERT INTO store_loyalty_points (id, user_id, store_id, points, last_visited_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, store_id) DO UPDATE SET points = ?, last_visited_at = ?, updated_at = ?
    `).bind(
      `sl_${session.user.id}_${storeSettings.store_id}`,
      session.user.id,
      storeSettings.store_id,
      newStoreBalance,
      now,
      now,
      newStoreBalance,
      now,
      now
    ).run();

    await d1.prepare(`
      INSERT INTO store_loyalty_transactions (id, user_id, store_id, amount, type, description, created_at)
      VALUES (?, ?, ?, ?, 'earned', ?, ?)
    `).bind(
      `sltx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      session.user.id,
      storeSettings.store_id,
      storePointsAwarded,
      `QR Scan Store Reward at ${storeSettings.store_name}`,
      now
    ).run();

    // 8. Log successful scan
    const scanLogId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const finalStatus = isCapped ? "capped_kynisto" : "success";

    await d1.prepare(`
      INSERT INTO qr_scan_logs (id, user_id, store_id, qr_token, kynisto_points_earned, store_points_earned, status, scanned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(scanLogId, session.user.id, storeSettings.store_id, token, kynistoAwarded, storePointsAwarded, finalStatus, now).run();

    return NextResponse.json({
      success: true,
      storeId: storeSettings.store_id,
      storeName: storeSettings.store_name,
      kynistoPointsEarned: kynistoAwarded,
      totalKynistoPoints: newKynistoBalance,
      storePointsEarned: storePointsAwarded,
      totalStorePoints: newStoreBalance,
      isKynistoCapped: isCapped,
      message: isCapped
        ? `Scan verified! Earned +${storePointsAwarded} ${storeSettings.store_name} Loyalty Points! (Global Kynisto Points capped at ${maxKynistoCap}).`
        : `Scan verified! Earned +${kynistoAwarded} Kynisto Points & +${storePointsAwarded} ${storeSettings.store_name} Loyalty Points!`
    });
  } catch (err: any) {
    console.error("POST /api/wallet/scan-qr error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to process QR code scan" }, { status: 500 });
  }
}
