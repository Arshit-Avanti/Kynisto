import { getD1 } from "@/db/runtime";

export async function systemSetting(key: string, fallback: string): Promise<string> {
  const row = await getD1()
    .prepare("SELECT value FROM system_settings WHERE key = ? LIMIT 1")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? fallback;
}

export async function systemBoolean(key: string, fallback = false): Promise<boolean> {
  const value = await systemSetting(key, fallback ? "true" : "false");
  return value === "true" || value === "1";
}

export async function systemCurrency(): Promise<string> {
  const value = (await systemSetting("default_currency", "INR")).toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : "INR";
}
