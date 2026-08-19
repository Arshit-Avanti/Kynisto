import { getD1 } from "@/db/runtime";

// In-memory cache for ultra-fast sub-millisecond settings lookups (< 0.1ms)
const _settingsCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 5000; // 5 seconds memory cache

export async function systemSetting(key: string, fallback: string): Promise<string> {
  const now = Date.now();
  const cached = _settingsCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const row = await getD1()
      .prepare("SELECT value FROM system_settings WHERE key = ? LIMIT 1")
      .bind(key)
      .first<{ value: string }>();
    const value = row?.value ?? fallback;
    _settingsCache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
    return value;
  } catch {
    return fallback;
  }
}

export async function systemBoolean(key: string, fallback = false): Promise<boolean> {
  const value = await systemSetting(key, fallback ? "true" : "false");
  return value === "true" || value === "1";
}

export async function systemNumber(key: string, fallback: number): Promise<number> {
  const value = await systemSetting(key, String(fallback));
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function systemCurrency(): Promise<string> {
  const value = (await systemSetting("default_currency", "INR")).toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : "INR";
}

// ---- High-Level Synchronized Feature Toggles & Limits ---------------------

export async function isOrdersEnabled(): Promise<boolean> {
  return systemBoolean("orders_enabled", true);
}

export async function isCustomerMembershipEnabled(): Promise<boolean> {
  return systemBoolean("kynisto_customer_membership_enabled", true);
}

export async function isOwnerMembershipEnabled(): Promise<boolean> {
  return systemBoolean("kynisto_owner_membership_enabled", true);
}

export async function isMembershipsEnabled(): Promise<boolean> {
  return systemBoolean("memberships_enabled", true);
}

export async function getMaxMembershipPlansPerStore(): Promise<number> {
  return systemNumber("membership_max_plans_per_store", 20);
}

export async function isHealthcareQueueEnabled(): Promise<boolean> {
  return systemBoolean("healthcare_queue_enabled", true);
}

export async function getMaxDailyPatients(): Promise<number> {
  return systemNumber("healthcare_max_daily_patients", 1000);
}

export async function isAppointmentsEnabled(): Promise<boolean> {
  return systemBoolean("appointments_enabled", true);
}

export async function isLoyaltyEnabled(): Promise<boolean> {
  return systemBoolean("loyalty_program_enabled", true);
}

export async function isCouponsEnabled(): Promise<boolean> {
  return systemBoolean("coupons_enabled", true);
}

export async function isChatEnabled(): Promise<boolean> {
  return systemBoolean("chat_enabled", true);
}

export async function isBroadcastEnabled(): Promise<boolean> {
  return systemBoolean("broadcast_enabled", true);
}

export async function isAdSenseEnabled(): Promise<boolean> {
  return systemBoolean("adsense_enabled", true);
}

export async function getMaxProductsPerStore(): Promise<number> {
  return systemNumber("max_products_per_store", 10000);
}

export async function getMaxServicesPerStore(): Promise<number> {
  return systemNumber("max_services_per_store", 1000);
}

export async function getMaxImageUploadMb(): Promise<number> {
  return systemNumber("max_image_upload_mb", 25);
}

export async function getQueueRefreshIntervalMs(): Promise<number> {
  return systemNumber("queue_refresh_interval_ms", 1200);
}

export function invalidateSettingsCache(key?: string) {
  if (key) {
    _settingsCache.delete(key);
  } else {
    _settingsCache.clear();
  }
}
