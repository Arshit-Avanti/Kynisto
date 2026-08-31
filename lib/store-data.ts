import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { d1SearchText } from "@/lib/validation";
import { microCache } from "@/lib/micro-cache";
import { parseSearchIntent } from "@/lib/smart-search";

const DEFAULT_LATITUDE = 28.7381;
const DEFAULT_LONGITUDE = 77.2669;
const tones = ["coral", "green", "blue", "yellow", "mint", "peach", "lilac", "sky", "lime", "sand"];

type StoreRow = {
  id: string;
  ownerId: string | null;
  name: string;
  slug: string;
  description: string;
  businessType: string;
  address: string;
  area: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  businessHours: string;
  openingDays: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  ratingAverage: number;
  ratingCount: number;
  viewCount: number;
  createdAt: number;
  categoryId: string;
  category: string;
  categoryModule: string;
  categorySlug: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  subcategory: string | null;
  queueActivationStatus: string | null;
  adminQueueEnabled: number | null;
  ownerQueueEnabled: number | null;
  queueStatus: string | null;
  queueOpeningTime: string | null;
  queueClosingTime: string | null;
};

export type PublicStore = ReturnType<typeof toPublicStore>;

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function indiaTime() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: get("weekday").toLowerCase().slice(0, 3),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function storeOpenStatus(hoursJson: string) {
  const hours = parseJson<Record<string, { open?: string; close?: string; open2?: string; close2?: string; closed?: boolean }>>(hoursJson, {});
  const { day, minutes } = indiaTime();
  const today = hours[day];
  if (!today || today.closed === true) return { open: false, hours: "Closed today" };

  const toMinutes = (value?: string) => {
    if (!value || !value.includes(":")) return -1;
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };

  const format = (value?: string) => {
    if (!value || !value.includes(":")) return "";
    const [hourValue, minute] = value.split(":").map(Number);
    const suffix = hourValue >= 12 ? "PM" : "AM";
    const hour = hourValue % 12 || 12;
    return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
  };

  const mOpen1 = toMinutes(today.open);
  const mClose1 = toMinutes(today.close);
  const mOpen2 = toMinutes(today.open2);
  const mClose2 = toMinutes(today.close2);

  const inShift1 = mOpen1 >= 0 && mClose1 >= 0 && minutes >= mOpen1 && minutes < mClose1;
  const inShift2 = mOpen2 >= 0 && mClose2 >= 0 && minutes >= mOpen2 && minutes < mClose2;

  if (inShift1) {
    const eveningNote = mOpen2 >= 0 ? ` (Evening ${format(today.open2)}–${format(today.close2)})` : "";
    return { open: true, hours: `Open (Morning) · Closes ${format(today.close)}${eveningNote}` };
  }

  if (inShift2) {
    return { open: true, hours: `Open (Evening) · Closes ${format(today.close2)}` };
  }

  // Currently closed - calculate next shift
  if (mOpen1 >= 0 && minutes < mOpen1) {
    return { open: false, hours: `Opens at ${format(today.open)} (Morning)` };
  } else if (mClose1 >= 0 && mOpen2 >= 0 && minutes >= mClose1 && minutes < mOpen2) {
    return { open: false, hours: `Morning shift ended · Opens at ${format(today.open2)} (Evening)` };
  } else if (mOpen2 >= 0 && minutes < mOpen2) {
    return { open: false, hours: `Opens at ${format(today.open2)} (Evening)` };
  } else if (today.open && !today.open2) {
    const isOpen = mOpen1 >= 0 && mClose1 >= 0 && minutes >= mOpen1 && minutes < mClose1;
    return {
      open: isOpen,
      hours: isOpen ? `Open until ${format(today.close)}` : `Opens at ${format(today.open)}`,
    };
  }

  return { open: false, hours: "Closed for the day" };
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toPublicStore(row: StoreRow, latitude: number, longitude: number) {
  const distance = distanceKm(latitude, longitude, row.latitude, row.longitude);
  const openStatus = storeOpenStatus(row.businessHours);
  const categoryNumber = Number(row.categoryId.replace(/\D/g, "")) || 1;
  return {
    id: row.id,
    hasOwner: Boolean(row.ownerId),
    name: row.name,
    slug: row.slug,
    description: row.description,
    businessType: row.businessType,
    category: row.category,
    categoryModule: row.categoryModule,
    categorySlug: row.categorySlug,
    subcategory: row.subcategory,
    icon: row.categoryIcon ?? "⌖",
    tone: tones[(categoryNumber - 1) % tones.length],
    color: row.categoryColor,
    address: row.address,
    shortAddress: `${row.area}, ${row.city}`,
    area: row.area,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postalCode,
    latitude: row.latitude,
    longitude: row.longitude,
    locationVerified: Boolean(row.locationVerified),
    locationAccuracy: row.locationAccuracy as number | null,
    googleMapsUrl: row.googleMapsUrl,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    logoUrl: row.logoUrl,
    bannerUrl: row.bannerUrl,
    rating: row.ratingAverage,
    reviews: row.ratingCount,
    distance: Number(distance.toFixed(1)),
    walk: distance < 1.4 ? `${Math.max(2, Math.round(distance * 13))} min walk` : `${Math.max(4, Math.round(distance * 4))} min ride`,
    open: openStatus.open,
    hours: openStatus.hours,
    services: row.subcategory ? [row.subcategory] : [row.businessType],
    createdAt: row.createdAt,
    viewCount: row.viewCount,
    queueEnabled: Boolean(row.queueActivationStatus === "approved" && row.adminQueueEnabled && row.ownerQueueEnabled),
    queueStatus: row.queueStatus,
    queueOpeningTime: row.queueOpeningTime,
    queueClosingTime: row.queueClosingTime,
  };
}

const storeSelect = `SELECT
  s.id, s.owner_id AS ownerId, s.name, s.slug, s.description, s.business_type AS businessType,
  s.address, s.area, s.city, s.state, s.country, s.postal_code AS postalCode,
  s.latitude, s.longitude, s.location_accuracy AS locationAccuracy, s.location_verified AS locationVerified,
  s.google_maps_url AS googleMapsUrl,
  s.phone, s.whatsapp, s.email, s.website,
  s.business_hours AS businessHours, s.opening_days AS openingDays,
  s.logo_url AS logoUrl, s.banner_url AS bannerUrl,
  s.rating_average AS ratingAverage, s.rating_count AS ratingCount,
  s.view_count AS viewCount, s.created_at AS createdAt,
  c.id AS categoryId, COALESCE(c.name, s.business_type) AS category, c.slug AS categorySlug, c.module AS categoryModule,
  c.icon AS categoryIcon, c.color AS categoryColor,
  sc.name AS subcategory, hp.queue_activation_status AS queueActivationStatus,
  hp.admin_queue_enabled AS adminQueueEnabled, hp.owner_queue_enabled AS ownerQueueEnabled,
  hqs.status AS queueStatus, hqs.opening_time AS queueOpeningTime, hqs.closing_time AS queueClosingTime
 FROM stores s
 LEFT JOIN categories c ON c.id = s.category_id
 LEFT JOIN categories sc ON sc.id = s.subcategory_id
 LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
 LEFT JOIN healthcare_queue_settings hqs ON hqs.store_id = s.id`;

export async function listCategories(module: "local" | "healthcare" | "all" = "local") {
  const cacheKey = `categories:${module}`;
  const cached = microCache.get<any>(cacheKey);
  if (cached) return cached;

  await ensureSeeded();
  const db = getD1();
  const moduleCondition = module === "all" ? "" : "AND c.module = ?";
  const childModuleCondition = module === "all" ? "" : "AND module = ?";
  const parentStatement = db.prepare(
    `SELECT c.id, c.name, c.slug, c.description, c.icon, c.color,
      COUNT(CASE WHEN s.status IN ('approved', 'active') THEN 1 END) AS storeCount
     FROM categories c
     LEFT JOIN stores s ON s.category_id = c.id
     WHERE c.parent_id IS NULL AND c.status = 'active' ${moduleCondition}
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`,
  );
  const childStatement = db.prepare(
    `SELECT id, parent_id AS parentId, name, slug, description, icon, color
     FROM categories WHERE parent_id IS NOT NULL AND status = 'active' ${childModuleCondition}
     ORDER BY sort_order ASC, name ASC`,
  );
  const [result, children] = await Promise.all([
    (module === "all" ? parentStatement : parentStatement.bind(module)).all<{
      id: string;
      name: string;
      slug: string;
      description: string;
      icon: string;
      color: string;
      storeCount: number;
    }>(),
    (module === "all" ? childStatement : childStatement.bind(module)).all<{
      id: string;
      parentId: string;
      name: string;
      slug: string;
      description: string;
      icon: string;
      color: string;
    }>(),
  ]);
  const categories = (result.results ?? []).map((category) => ({
    ...category,
    children: (children.results ?? []).filter((child) => child.parentId === category.id),
  }));
  microCache.set(cacheKey, categories, 60_000);
  return categories;
}

export async function listStores(options: {
  query?: string;
  category?: string;
  area?: string;
  postalCode?: string;
  businessType?: string;
  sort?: "nearest" | "rated" | "newest" | "relevance";
  openNow?: boolean;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
}) {
  const cacheKey = `stores:${JSON.stringify(options)}`;
  const cached = microCache.get<any>(cacheKey);
  if (cached) return cached;

  await ensureSeeded();
  const db = getD1();
  const conditions = ["s.status NOT IN ('suspended','deleted','rejected')", "c.module = 'local'", "c.status = 'active'"];
  const bindings: unknown[] = [];
  const query = options.query?.trim();

  let matchedCatalogStoreIds: string[] = [];

  if (query) {
    const parsed = parseSearchIntent(query);

    // 1. Search matching products & services with price filters if conversational
    try {
      const productQueryParts: string[] = [];
      const productBindings: unknown[] = [];
      const serviceQueryParts: string[] = [];
      const serviceBindings: unknown[] = [];

      for (const token of parsed.cleanedTokens) {
        const pattern = `%${d1SearchText(token)}%`;
        productQueryParts.push("(p.name LIKE ? OR p.description LIKE ?)");
        productBindings.push(pattern, pattern);
        serviceQueryParts.push("(sv.name LIKE ? OR sv.description LIKE ?)");
        serviceBindings.push(pattern, pattern);
      }

      const priceProductCondition = parsed.maxPrice !== undefined ? " AND p.price <= ?" : (parsed.minPrice !== undefined ? " AND p.price >= ?" : "");
      if (parsed.maxPrice !== undefined) productBindings.push(parsed.maxPrice);
      else if (parsed.minPrice !== undefined) productBindings.push(parsed.minPrice);

      const priceServiceCondition = parsed.maxPrice !== undefined ? " AND sv.price_from <= ?" : (parsed.minPrice !== undefined ? " AND sv.price_from >= ?" : "");
      if (parsed.maxPrice !== undefined) serviceBindings.push(parsed.maxPrice);
      else if (parsed.minPrice !== undefined) serviceBindings.push(parsed.minPrice);

      const [productRows, serviceRows] = await Promise.all([
        productQueryParts.length > 0
          ? db.prepare(`SELECT DISTINCT store_id FROM products p WHERE p.status = 'active' AND (${productQueryParts.join(" OR ")}) ${priceProductCondition} LIMIT 100`).bind(...productBindings).all<{ store_id: string }>().catch(() => ({ results: [] }))
          : Promise.resolve({ results: [] }),
        serviceQueryParts.length > 0
          ? db.prepare(`SELECT DISTINCT store_id FROM services sv WHERE sv.status = 'active' AND (${serviceQueryParts.join(" OR ")}) ${priceServiceCondition} LIMIT 100`).bind(...serviceBindings).all<{ store_id: string }>().catch(() => ({ results: [] }))
          : Promise.resolve({ results: [] }),
      ]);

      const pIds = (productRows.results ?? []).map((r) => r.store_id);
      const sIds = (serviceRows.results ?? []).map((r) => r.store_id);
      matchedCatalogStoreIds = Array.from(new Set([...pIds, ...sIds]));
    } catch {
      // Ignore catalog search error
    }

    // 2. Build multi-token text & semantic condition
    const tokenConditions: string[] = [];
    for (const token of parsed.cleanedTokens) {
      const pattern = `%${d1SearchText(token)}%`;
      tokenConditions.push("(s.name LIKE ? OR c.name LIKE ? OR sc.name LIKE ? OR s.area LIKE ? OR s.city LIKE ? OR s.business_type LIKE ? OR s.description LIKE ?)");
      bindings.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    for (const cat of parsed.categoryHints) {
      const catPattern = `%${d1SearchText(cat)}%`;
      tokenConditions.push("(c.name LIKE ? OR s.business_type LIKE ?)");
      bindings.push(catPattern, catPattern);
    }

    if (matchedCatalogStoreIds.length > 0) {
      const placeholders = matchedCatalogStoreIds.map(() => "?").join(",");
      tokenConditions.push(`s.id IN (${placeholders})`);
      bindings.push(...matchedCatalogStoreIds);
    }

    if (tokenConditions.length > 0) {
      conditions.push(`(${tokenConditions.join(" OR ")})`);
    }
  }

  if (options.category) {
    conditions.push("(c.slug = ? OR sc.slug = ? OR c.name = ? OR sc.name = ?)");
    bindings.push(options.category, options.category, options.category, options.category);
  }
  if (options.area) {
    conditions.push("s.area LIKE ?");
    bindings.push(`%${d1SearchText(options.area.replace(/[%_]/g, ""))}%`);
  }
  if (options.postalCode) {
    conditions.push("s.postal_code = ?");
    bindings.push(options.postalCode);
  }
  if (options.businessType) {
    conditions.push("s.business_type LIKE ?");
    bindings.push(`%${d1SearchText(options.businessType.replace(/[%_]/g, ""))}%`);
  }

  const rows = await db
    .prepare(`${storeSelect} WHERE ${conditions.join(" AND ")} LIMIT 500`)
    .bind(...bindings)
    .all<StoreRow>();
  const latitude = options.latitude ?? DEFAULT_LATITUDE;
  const longitude = options.longitude ?? DEFAULT_LONGITUDE;

  // Deduplicate rows by store ID to guarantee distinct, uncluttered results
  const seenIds = new Set<string>();
  const uniqueRows: StoreRow[] = [];
  for (const row of rows.results ?? []) {
    const key = String(row.id);
    if (!seenIds.has(key)) {
      seenIds.add(key);
      uniqueRows.push(row);
    }
  }

  let stores = uniqueRows.map((row) => toPublicStore(row, latitude, longitude));

  // Dynamic filter application based on Natural Language intent
  if (query) {
    const parsed = parseSearchIntent(query);
    if (parsed.maxDistanceKm !== undefined) {
      const distanceFiltered = stores.filter((s) => s.distance <= (parsed.maxDistanceKm || 50));
      if (distanceFiltered.length > 0) stores = distanceFiltered;
    }
    if (parsed.minRating !== undefined) {
      const ratingFiltered = stores.filter((s) => s.rating >= (parsed.minRating || 4));
      if (ratingFiltered.length > 0) stores = ratingFiltered;
    }
    if (parsed.openNow || options.openNow) {
      const openFiltered = stores.filter((store) => store.open);
      if (openFiltered.length > 0) stores = openFiltered;
    }
  } else if (options.openNow) {
    stores = stores.filter((store) => store.open);
  }

  const parsedIntent = query ? parseSearchIntent(query) : null;
  const effectiveSort = options.sort ?? parsedIntent?.sortBy ?? "relevance";

  if (effectiveSort === "nearest") {
    stores.sort((left, right) => left.distance - right.distance);
  } else if (effectiveSort === "rated") {
    stores.sort((left, right) => right.rating - left.rating || right.reviews - left.reviews);
  } else if (effectiveSort === "newest") {
    stores.sort((left, right) => right.createdAt - left.createdAt);
  } else if (effectiveSort === "relevance") {
    if (query && parsedIntent) {
      // Smart Relevance Score calculation
      stores.sort((left, right) => {
        let leftScore = left.rating * 2;
        let rightScore = right.rating * 2;
        const qLower = query.toLowerCase();

        // Exact name or category match bonus
        if (left.name.toLowerCase().includes(qLower)) leftScore += 20;
        if (right.name.toLowerCase().includes(qLower)) rightScore += 20;

        // Proximity bonus
        leftScore += Math.max(0, 10 - left.distance);
        rightScore += Math.max(0, 10 - right.distance);

        // Catalog match bonus
        if (matchedCatalogStoreIds.includes(String(left.id))) leftScore += 15;
        if (matchedCatalogStoreIds.includes(String(right.id))) rightScore += 15;

        return rightScore - leftScore;
      });
    } else {
      stores.sort((left, right) => right.rating * Math.log10(right.reviews + 10) - left.rating * Math.log10(left.reviews + 10));
    }
  }

  const page = Math.max(1, Math.floor(options.page ?? 1));
  const limit = Math.min(24, Math.max(1, Math.floor(options.limit ?? 12)));
  const total = stores.length;
  const start = (page - 1) * limit;
  const storeResult = {
    items: stores.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: start + limit < total,
    },
  };
  microCache.set(cacheKey, storeResult, 15_000);
  return storeResult;
}

export async function getStoreBySlug(slug: string) {
  await ensureSeeded();
  const db = getD1();
  const row = await db
    .prepare(`${storeSelect} WHERE s.slug = ? AND s.status NOT IN ('suspended','deleted','rejected') LIMIT 1`)
    .bind(slug)
    .first<StoreRow>();
  if (!row) return null;

  const [images, products, services, offers, reviews, catalogMedia] = await Promise.all([
    db.prepare("SELECT id, url, alt_text AS altText, kind, width, height FROM store_images WHERE store_id = ? ORDER BY sort_order ASC, created_at ASC").bind(row.id).all(),
    db.prepare("SELECT p.id, p.name, p.slug, p.description, p.price, p.currency, p.image_url AS imageUrl, COALESCE(i.quantity - i.reserved_quantity, 0) AS available FROM products p LEFT JOIN inventory i ON i.product_id = p.id WHERE p.store_id = ? AND p.status = 'active' ORDER BY p.created_at DESC LIMIT 24").bind(row.id).all(),
    db.prepare("SELECT id, name, slug, description, price_from AS priceFrom, duration_minutes AS durationMinutes, image_url AS imageUrl FROM services WHERE store_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 24").bind(row.id).all(),
    db.prepare("SELECT id, title, description, code, starts_at AS startsAt, ends_at AS endsAt FROM offers WHERE store_id = ? AND status = 'active' AND (ends_at IS NULL OR ends_at > unixepoch()) ORDER BY created_at DESC LIMIT 12").bind(row.id).all(),
    db.prepare("SELECT id, reviewer_name AS reviewerName, rating, title, comment, owner_reply AS ownerReply, owner_replied_at AS ownerRepliedAt, created_at AS createdAt FROM reviews WHERE store_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 50").bind(row.id).all(),
    db.prepare(`SELECT id, owner_type AS ownerType, product_id AS productId, service_id AS serviceId,
      public_url AS publicUrl, thumbnail_url AS thumbnailUrl, media_type AS mediaType,
      caption, alt_text AS altText, duration_seconds AS durationSeconds, featured,
      crop_x AS cropX, crop_y AS cropY
      FROM media_assets WHERE store_id = ? AND owner_type IN ('product', 'service')
      ORDER BY featured DESC, sort_order ASC, created_at ASC`).bind(row.id).all<Record<string, unknown>>(),
  ]);

  const mediaRows = catalogMedia.results ?? [];
  const withMedia = (items: unknown[], ownerType: "product" | "service") => items.map((raw) => {
    const item = raw as Record<string, unknown>;
    const id = String(item.id);
    return {
      ...item,
      media: mediaRows.filter((asset) => asset.ownerType === ownerType && String(ownerType === "product" ? asset.productId : asset.serviceId) === id),
    };
  });

  return {
    ...toPublicStore(row, DEFAULT_LATITUDE, DEFAULT_LONGITUDE),
    businessHours: parseJson(row.businessHours, {}),
    openingDays: parseJson(row.openingDays, []),
    images: images.results ?? [],
    products: withMedia(products.results ?? [], "product"),
    services: withMedia(services.results ?? [], "service"),
    offers: offers.results ?? [],
    reviewItems: reviews.results ?? [],
  };
}

export async function recordAnalytics(
  request: Request,
  storeId: string | null,
  eventType: string,
  userId: string | null = null,
  metadata: Record<string, unknown> = {},
) {
  const forwarded = request.headers.get("cf-connecting-ip") ?? "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(forwarded));
  const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const occurredAt = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(occurredAt / 60);
  const eventDigest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${storeId ?? "platform"}:${eventType}:${userId ?? ipHash}:${bucket}`),
  );
  const eventKey = Array.from(new Uint8Array(eventDigest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const inserted = await getD1()
    .prepare("INSERT OR IGNORE INTO analytics_events (id, store_id, user_id, event_type, metadata, ip_hash, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(`analytics-${eventKey}`, storeId, userId, eventType, JSON.stringify(metadata), ipHash, occurredAt)
    .run();
  if (storeId && eventType === "view" && Number(inserted.meta.changes ?? 0) === 1) {
    await getD1().prepare("UPDATE stores SET view_count = view_count + 1 WHERE id = ?").bind(storeId).run();
  }
}
