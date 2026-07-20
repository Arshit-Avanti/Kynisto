import { getD1 } from "@/db/runtime";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { hashPassword } from "@/lib/crypto";
import { slugify } from "@/lib/validation";

const SEED_VERSION = "v8-admin-arshit1029-pass";
const DEFAULT_LATITUDE = 28.7381;
const DEFAULT_LONGITUDE = 77.2669;
const DEMO_STORE_IDS = Array.from(
  { length: 100 },
  (_, index) => `store-${String(index + 1).padStart(3, "0")}`,
);

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
const HEALTHCARE_TYPES = [
  "hospital",
  "clinic",
  "dental_clinic",
  "diagnostic_lab",
  "pharmacy",
  "eye_clinic",
  "veterinary_clinic",
] as const;

const nameSeeds = [
  "Glow & Grace", "Fresh Basket", "Aarogya", "Paper Point", "WellSpring",
  "Oven Story", "QuickFix", "Happy Paws", "MoveWell", "Third Place",
  "Ankur Kitchen", "HomeEase", "BuildRight", "Bright Future", "Urban Thread",
  "AutoCare", "People's Bank", "SmileCraft", "ClearView", "Petal House",
];

const streets = [
  "B-2 Road", "B-3 Road", "B-4 Road", "B-6 Road",
  "MM Road", "Shiv Chowk Road", "B Block Park Road", "Kalawa Vatika Lane",
  "Ankur Vihar Main Road", "Karawal Nagar Link Road",
];

const businessHours = JSON.stringify({
  mon: { open: "09:00", close: "21:00" },
  tue: { open: "09:00", close: "21:00" },
  wed: { open: "09:00", close: "21:00" },
  thu: { open: "09:00", close: "21:00" },
  fri: { open: "09:00", close: "21:00" },
  sat: { open: "09:00", close: "21:00" },
  sun: { open: "10:00", close: "18:00" },
});

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
  if (marker?.value === SEED_VERSION || marker?.value?.endsWith(`-${SEED_VERSION}`)) return;

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
      )
      .bind(
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

  const categoryRows: SeedValue[][] = [];
  categorySeeds.forEach(([name, icon, color, children], categoryIndex) => {
    const parentId = `category-${String(categoryIndex + 1).padStart(2, "0")}`;
    categoryRows.push([
      parentId,
      null,
      name,
      slugify(name),
      `Trusted ${name.toLowerCase()} in and around DLF Ankur Vihar.`,
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
        `${child} businesses serving DLF Ankur Vihar and Loni.`,
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
  const storeRows: SeedValue[][] = [];
  const productRows: SeedValue[][] = [];
  const serviceRows: SeedValue[][] = [];
  const offerRows: SeedValue[][] = [];
  const reviewRows: SeedValue[][] = [];
  const storeSettingsRows: SeedValue[][] = [];
  const inventoryRows: SeedValue[][] = [];
  const healthcareProfileRows: SeedValue[][] = [];
  const healthcareQueueSettingRows: SeedValue[][] = [];
  const serviceDate = new Date(now * 1000).toISOString().slice(0, 10);

  for (let index = 0; index < 100; index += 1) {
    const categoryIndex = index % categorySeeds.length;
    const sequence = Math.floor(index / categorySeeds.length) + 1;
    const storeId = `store-${String(index + 1).padStart(3, "0")}`;
    const categoryId = `category-${String(categoryIndex + 1).padStart(2, "0")}`;
    const subcategoryId = `${categoryId}-${(index % 2) + 1}`;
    const categoryName = categorySeeds[categoryIndex][0];
    const storeName = `${nameSeeds[categoryIndex]} ${sequence === 1 ? "" : sequence}`.trim();
    const slug = `${slugify(storeName)}-ankur-vihar`;
    const street = streets[index % streets.length];
    const house = 12 + ((index * 17) % 380);
    // Keep the deterministic catalog in a compact, symmetric grid around the
    // user-confirmed DLF Ankur Vihar point near Karawal Nagar.
    const latitude = DEFAULT_LATITUDE + ((index % 10) - 4.5) * 0.00105;
    const longitude = DEFAULT_LONGITUDE + (Math.floor(index / 10) - 4.5) * 0.00103;
    const ratingAverage = Number((4.1 + ((index * 7) % 9) / 10).toFixed(1));
    const ratingCount = 18 + ((index * 29) % 360);
    const status = index >= 98 ? "suspended" : index >= 90 ? "pending" : "approved";
    const createdAt = now - (100 - index) * 21_600;
    const address = `${house}, ${street}, DLF Ankur Vihar, Loni, Ghaziabad, Uttar Pradesh 201102`;

    storeRows.push([
      storeId,
      null,
      categoryId,
      subcategoryId,
      storeName,
      slug,
      `${storeName} is a trusted ${categoryName.toLowerCase()} business serving DLF Ankur Vihar, Loni near Karawal Nagar and nearby Ghaziabad communities. Clear pricing, friendly service and convenient local access.`,
      categoryName,
      address,
      "DLF Ankur Vihar",
      "Loni",
      "Uttar Pradesh",
      "India",
      "201102",
      latitude,
      longitude,
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      `+91 98${String(10000000 + index * 13791).slice(-8)}`,
      `+91 98${String(20000000 + index * 19373).slice(-8)}`,
      `hello${index + 1}@demo.kynisto.local`,
      `https://example.com/store-${index + 1}`,
      businessHours,
      JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      ratingAverage,
      ratingCount,
      status,
      status === "approved" ? createdAt + 3600 : null,
      status === "approved" ? adminId : null,
      120 + index * 17,
      createdAt,
      createdAt,
    ]);
    storeSettingsRows.push([storeId, 1, 1, 1, 0, 25, 5, 0, now]);
    if (HEALTHCARE_CATEGORY_INDEXES.has(categoryIndex)) {
      const healthcareType =
        categoryIndex === 4
          ? "pharmacy"
          : categoryIndex === 7
            ? "veterinary_clinic"
            : categoryIndex === 17
              ? "dental_clinic"
              : categoryIndex === 18
                ? "eye_clinic"
                : HEALTHCARE_TYPES[(sequence - 1) % 4];
      healthcareProfileRows.push([
        storeId,
        healthcareType,
        1,
        healthcareType === "hospital" ? 1 : 0,
        0,
        0,
        status === "approved" ? "verified" : "pending",
        createdAt,
        now,
      ]);
      healthcareQueueSettingRows.push([
        storeId,
        "closed",
        15 + (index % 3) * 5,
        0,
        1,
        serviceDate,
        null,
        null,
        null,
        now,
      ]);
    }

    if (index < 60) {
      productRows.push([
        `product-${storeId}-1`,
        storeId,
        `Popular ${categoryName.split(" ")[0]} item`,
        "popular-item",
        `A customer favourite available at ${storeName}.`,
        99 + (index % 12) * 50,
        "INR",
        "active",
        createdAt,
        createdAt,
      ]);
      inventoryRows.push([
        `product-${storeId}-1`,
        storeId,
        `NN-${String(index + 1).padStart(4, "0")}`,
        20 + ((index * 7) % 81),
        0,
        5,
        now,
      ]);
      serviceRows.push([
        `service-${storeId}-1`,
        storeId,
        `${categoryName.split(" ")[0]} consultation`,
        "consultation",
        `A convenient local service from ${storeName}.`,
        149 + (index % 10) * 75,
        30 + (index % 3) * 15,
        "active",
        createdAt,
        createdAt,
      ]);
      offerRows.push([
        `offer-${storeId}-1`,
        storeId,
        "Neighbourhood welcome offer",
        "Save 10% on your first visit through Kynisto.",
        "NEAR10",
        now - 86_400,
        now + 30 * 86_400,
        "active",
        createdAt,
        createdAt,
      ]);
    }

    if (index < 80) {
      const reviewCount = index % 3 === 0 ? 2 : 1;
      for (let reviewIndex = 0; reviewIndex < reviewCount; reviewIndex += 1) {
        const rating = Math.max(3, Math.min(5, Math.round(ratingAverage + (reviewIndex ? -0.5 : 0.2))));
        reviewRows.push([
          `review-${storeId}-${reviewIndex + 1}`,
          storeId,
          null,
          ["Neha S.", "Rahul K.", "Priya M.", "Mohit G."][(index + reviewIndex) % 4],
          rating,
          rating >= 5 ? "Excellent local service" : "Reliable and convenient",
          rating >= 5
            ? "Friendly team, clear information and a very convenient location for our neighbourhood."
            : "Good experience overall. The address was easy to find and the service was helpful.",
          "published",
          createdAt + (reviewIndex + 1) * 1800,
          createdAt + (reviewIndex + 1) * 1800,
        ]);
      }
    }
  }

  // Recreate only the deterministic demo catalog. User-created stores use
  // different IDs and are intentionally left untouched. Orders must be
  // removed explicitly because their store relationship is restrictive;
  // remaining demo children are removed by their foreign-key cascades.
  const demoStorePlaceholders = DEMO_STORE_IDS.map(() => "?").join(", ");
  const deleteDemoOrders = db
    .prepare(`DELETE FROM orders WHERE store_id IN (${demoStorePlaceholders})`)
    .bind(...DEMO_STORE_IDS);
  const deleteDemoStores = db
    .prepare(`DELETE FROM stores WHERE id IN (${demoStorePlaceholders})`)
    .bind(...DEMO_STORE_IDS);

  // The free D1 tier allows 50 queries per Worker invocation. Multi-row seed
  // statements keep the complete 100-store catalog well below that limit.
  await db.batch([
    ...authorityStatements,
    deleteDemoOrders,
    deleteDemoStores,
    ...bulkInserts(db, "categories", ["id", "parent_id", "name", "slug", "description", "icon", "color", "module", "sort_order", "status", "created_at", "updated_at"], categoryRows),
    db.prepare(`UPDATE categories SET module = CASE
      WHEN id LIKE 'category-03%' OR id LIKE 'category-05%' OR id LIKE 'category-08%'
        OR id LIKE 'category-18%' OR id LIKE 'category-19%' THEN 'healthcare'
      ELSE 'local' END
      WHERE id LIKE 'category-%'`),
    ...bulkInserts(db, "stores", ["id", "owner_id", "category_id", "subcategory_id", "name", "slug", "description", "business_type", "address", "area", "city", "state", "country", "postal_code", "latitude", "longitude", "google_maps_url", "phone", "whatsapp", "email", "website", "business_hours", "opening_days", "rating_average", "rating_count", "status", "approved_at", "approved_by", "view_count", "created_at", "updated_at"], storeRows),
    ...bulkInserts(db, "store_settings", ["store_id", "accepting_orders", "pickup_enabled", "delivery_enabled", "minimum_order", "delivery_fee", "delivery_radius_km", "auto_accept_orders", "updated_at"], storeSettingsRows),
    ...bulkInserts(db, "healthcare_provider_profiles", ["store_id", "provider_type", "accepting_patients", "emergency_available", "admin_queue_enabled", "owner_queue_enabled", "verification_status", "created_at", "updated_at"], healthcareProfileRows),
    ...bulkInserts(db, "healthcare_queue_settings", ["store_id", "status", "consultation_minutes", "current_token_number", "next_token_number", "service_date", "opened_at", "closed_at", "updated_by", "updated_at"], healthcareQueueSettingRows),
    ...bulkInserts(db, "products", ["id", "store_id", "name", "slug", "description", "price", "currency", "status", "created_at", "updated_at"], productRows),
    ...bulkInserts(db, "inventory", ["product_id", "store_id", "sku", "quantity", "reserved_quantity", "low_stock_threshold", "updated_at"], inventoryRows),
    ...bulkInserts(db, "services", ["id", "store_id", "name", "slug", "description", "price_from", "duration_minutes", "status", "created_at", "updated_at"], serviceRows),
    ...bulkInserts(db, "offers", ["id", "store_id", "title", "description", "code", "starts_at", "ends_at", "status", "created_at", "updated_at"], offerRows),
    ...bulkInserts(db, "reviews", ["id", "store_id", "user_id", "reviewer_name", "rating", "title", "comment", "status", "created_at", "updated_at"], reviewRows),
    db.prepare(
      "INSERT INTO system_settings (key, value, updated_at) VALUES ('seed_version', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    ).bind(SEED_VERSION, now),
  ]);
}

export async function ensureSeeded(): Promise<void> {
  await ensureDatabaseReady();
  if (!seedPromise) {
    seedPromise = seedDatabase().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
