import { getD1 } from "@/db/runtime";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { hashPassword } from "@/lib/crypto";
import { slugify } from "@/lib/validation";

const SEED_VERSION = "v9-no-demo-stores";

const categorySeeds = [
  ["Salons & Beauty", "✂", "#f4a38a", ["Hair salon", "Beauty parlour"]],
  ["Grocery & Essentials", "◒", "#8fbd91", ["Supermarket", "Daily needs"]],
  ["Clinics & Doctors", "+", "#8fa5df", ["General physician", "Child clinic"]],
  ["Stationery & Printing", "✎", "#e7c34e", ["Stationery", "Printing shop"]],
  ["Pharmacies", "✚", "#83c5b2", ["Medical store", "Wellness store"]],
  ["Bakeries", "♨", "#dda979", ["Cake shop", "Fresh bakery"]],
  ["Mobile & Electronics Repair", "⚙", "#a995ce", ["Mobile repair", "Electronics repair"]],
  ["Pet Care", "●", "#82bdd4", ["Pet grooming", "Veterinary clinic"]],
  ["Fitness & Yoga", "↔", "#aaca62", ["Gym", "Yoga studio"]],
  ["Cafés", "☕", "#b38a68", ["Coffee shop", "Tea café"]],
  ["Restaurants", "◉", "#e38b69", ["Family restaurant", "Fast food"]],
  ["Home Services", "⌂", "#7fa995", ["Plumber", "Electrician"]],
  ["Hardware", "◆", "#9a9e9a", ["Hardware store", "Paint shop"]],
  ["Education & Coaching", "◇", "#8fa8cd", ["Tuition centre", "Computer classes"]],
  ["Fashion", "✦", "#d49ab5", ["Clothing store", "Boutique"]],
  ["Automobile Services", "◈", "#86a2ac", ["Car service", "Two-wheeler repair"]],
  ["Banks & ATMs", "▣", "#8095c9", ["Bank branch", "ATM"]],
  ["Dental Care", "⬡", "#79b7b3", ["Dental clinic", "Orthodontist"]],
  ["Opticians", "◌", "#b89d74", ["Optical store", "Eye clinic"]],
  ["Florists", "✿", "#d2909d", ["Flower shop", "Gift bouquets"]],
] as const;

const HEALTHCARE_CATEGORY_INDEXES = new Set([2, 4, 7, 17, 18]);

let databaseSeeded = false;
let seedPromise: Promise<void> | null = null;

type SeedValue = string | number | null;

function sqlLiteral(value: SeedValue): string {
  if (value === null) return "NULL";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Seed data contains a non-finite number.");
    return String(value);
  }
  return `'${value.replaceAll("'", "''")}'`;
}

function bulkInserts(
  db: D1Database,
  table: string,
  columns: string[],
  rows: SeedValue[][],
): D1PreparedStatement[] {
  if (!/^[a-z_]+$/.test(table) || columns.some((column) => !/^[a-z_]+$/.test(column))) {
    throw new Error("Invalid internal seed identifier.");
  }
  if (rows.some((row) => row.length !== columns.length)) {
    throw new Error(`Invalid ${table} seed row.`);
  }
  const prefix = `INSERT OR IGNORE INTO "${table}" (${columns.map((column) => `"${column}"`).join(", ")}) VALUES `;
  const encoder = new TextEncoder();
  const queries: string[] = [];
  let values: string[] = [];
  for (const row of rows) {
    const value = `(${row.map(sqlLiteral).join(", ")})`;
    const candidate = `${prefix}${[...values, value].join(", ")}`;
    if (values.length > 0 && encoder.encode(candidate).byteLength > 95_000) {
      queries.push(`${prefix}${values.join(", ")}`);
      values = [value];
    } else {
      values.push(value);
    }
  }
  if (values.length > 0) queries.push(`${prefix}${values.join(", ")}`);
  if (queries.some((query) => encoder.encode(query).byteLength > 100_000)) {
    throw new Error(`${table} contains an oversized seed row.`);
  }
  return queries.map((query) => db.prepare(query));
}

async function seedDatabase(): Promise<void> {
  const db = getD1();
  const marker = await db
    .prepare("SELECT value FROM system_settings WHERE key = 'seed_version'")
    .first<{ value: string }>();
  if (marker?.value === SEED_VERSION || marker?.value?.endsWith(`-${SEED_VERSION}`)) {
    databaseSeeded = true;
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const adminPassword = await hashPassword("Arshit1029");
  const existingAdmin = await db
    .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
    .bind("nxt.arshit@gmail.com")
    .first<{ id: string }>();
  const adminId = existingAdmin?.id ?? "user-admin-default";
  const authorityStatements: D1PreparedStatement[] = [];

  if (!existingAdmin) {
    authorityStatements.push(
      db.prepare(
        `INSERT INTO users
         (id, name, email, password_hash, password_salt, password_iterations, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'admin', 'active', ?, ?)`,
      ).bind(
        adminId,
        "Arshit Anand",
        "nxt.arshit@gmail.com",
        adminPassword.hash,
        adminPassword.salt,
        adminPassword.iterations,
        now,
        now,
      ),
    );
  } else {
    authorityStatements.push(
      db.prepare(
        "UPDATE users SET role = 'admin', status = 'active', password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?",
      ).bind(
        adminPassword.hash,
        adminPassword.salt,
        adminPassword.iterations,
        now,
        adminId,
      ),
    );
  }

  authorityStatements.push(
    db.prepare(
      `INSERT INTO user_security
       (user_id, must_change_password, is_super_admin, failed_login_count, locked_until, updated_at)
       VALUES (?, 0, 1, 0, NULL, ?)
       ON CONFLICT(user_id) DO UPDATE SET must_change_password = 0, is_super_admin = 1, failed_login_count = 0, locked_until = NULL, updated_at = excluded.updated_at`,
    ).bind(adminId, now),
  );

  // Seed categories only — no demo stores
  const categoryRows: SeedValue[][] = [];
  categorySeeds.forEach(([name, icon, color, children], categoryIndex) => {
    const parentId = `category-${String(categoryIndex + 1).padStart(2, "0")}`;
    categoryRows.push([
      parentId,
      null,
      name,
      slugify(name),
      `Trusted ${name.toLowerCase()} in and around Your Locality.`,
      icon,
      color,
      HEALTHCARE_CATEGORY_INDEXES.has(categoryIndex) ? "healthcare" : "local",
      categoryIndex,
      "active",
      now,
      now,
    ]);
    children.forEach((child, childIndex) => {
      categoryRows.push([
        `${parentId}-${childIndex + 1}`,
        parentId,
        child,
        `${slugify(name)}-${slugify(child)}`,
        `${child} businesses serving Your Locality and Loni.`,
        icon,
        color,
        HEALTHCARE_CATEGORY_INDEXES.has(categoryIndex) ? "healthcare" : "local",
        childIndex,
        "active",
        now,
        now,
      ]);
    });
  });

  await db.batch([
    ...authorityStatements,
    ...bulkInserts(db, "categories", ["id", "parent_id", "name", "slug", "description", "icon", "color", "module", "sort_order", "status", "created_at", "updated_at"], categoryRows),
    db.prepare(`UPDATE categories SET module = CASE
      WHEN id LIKE 'category-03%' OR id LIKE 'category-05%' OR id LIKE 'category-08%'
        OR id LIKE 'category-18%' OR id LIKE 'category-19%' THEN 'healthcare'
      ELSE 'local' END
      WHERE id LIKE 'category-%'`),
    db.prepare(
      "INSERT INTO system_settings (key, value, updated_at) VALUES ('seed_version', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    ).bind(SEED_VERSION, now),
  ]);
  databaseSeeded = true;
}

export function ensureSeeded(): Promise<void> {
  if (databaseSeeded) return Promise.resolve();
  if (!seedPromise) {
    seedPromise = ensureDatabaseReady().then(() => seedDatabase()).catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
