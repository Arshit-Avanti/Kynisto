export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Invalid request body.");
  }
  return value as Record<string, unknown>;
}

export function cleanText(
  value: unknown,
  label: string,
  options: { min?: number; max?: number; required?: boolean } = {},
): string {
  const { min = 0, max = 500, required = true } = options;
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) return "";
    throw new ValidationError(`${label} is required.`);
  }
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (required && cleaned.length < Math.max(1, min)) {
    throw new ValidationError(`${label} is too short.`);
  }
  if (cleaned.length > max) {
    throw new ValidationError(`${label} must be ${max} characters or fewer.`);
  }
  return cleaned;
}

export function emailInput(value: unknown): string {
  const email = cleanText(value, "Email", { min: 3, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Enter a valid email address.");
  }
  return email;
}

export function passwordInput(value: unknown): string {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw new ValidationError("Password must be between 8 and 128 characters.");
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new ValidationError("Password must contain a letter and a number.");
  }
  return value;
}

export function roleInput(value: unknown): "customer" | "store_owner" {
  if (value !== "customer" && value !== "store_owner") {
    throw new ValidationError("Choose a valid account type.");
  }
  return value;
}

export function booleanInput(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

export function numberInput(
  value: unknown,
  label: string,
  options: { min?: number; max?: number; integer?: boolean; required?: boolean } = {},
): number | null {
  const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, integer = false, required = true } = options;
  if (!required && (value === "" || value === null || value === undefined)) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    throw new ValidationError(`${label} is invalid.`);
  }
  return parsed;
}

export function urlInput(value: unknown, label: string, required = false): string | null {
  if (!required && (value === null || value === undefined || value === "")) return null;
  const raw = cleanText(value, label, { max: 2048, required });
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ValidationError(`${label} must be a valid URL.`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ValidationError(`${label} must use http or https.`);
  }
  return url.toString();
}

export function phoneInput(value: unknown, label = "Phone", required = false): string | null {
  if (!required && (value === null || value === undefined || value === "")) return null;
  const phone = cleanText(value, label, { min: 7, max: 20, required });
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone)) {
    throw new ValidationError(`Enter a valid ${label.toLowerCase()} number.`);
  }
  return phone;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Clamp search input so surrounding `%` wildcards stay within D1's 50-byte LIKE limit. */
export function d1SearchText(value: string, maximumBytes = 48): string {
  const encoder = new TextEncoder();
  let result = "";
  for (const character of value) {
    const candidate = result + character;
    if (encoder.encode(candidate).byteLength > maximumBytes) break;
    result = candidate;
  }
  return result;
}

export async function safeJson(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ValidationError("Content-Type must be application/json.");
  }
  try {
    return objectInput(await request.json());
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Request body must be valid JSON.");
  }
}
