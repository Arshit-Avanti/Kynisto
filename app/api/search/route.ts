import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { apiError } from "@/lib/security";
import { parseSearchIntent } from "@/lib/smart-search";
import { microCache, microCacheJson } from "@/lib/micro-cache";

export const dynamic = "force-dynamic";

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawQuery = (url.searchParams.get("q") ?? "").trim();
    const lat = Number(url.searchParams.get("lat")) || 28.7381;
    const lng = Number(url.searchParams.get("lng")) || 77.2669;

    const cacheKey = `search:${rawQuery}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    const cached = microCache.get<any>(cacheKey);
    if (cached) {
      return microCacheJson(cached, "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    }

    await ensureSeeded();
    const db = getD1();

    const parsed = parseSearchIntent(rawQuery);
    const tokens = parsed.cleanedTokens.filter((t) => t.length > 0);

    // 1. SEARCH HEALTHCARE (Clinics, Hospitals, Doctors, Queues)
    let healthcareQuery = `
      SELECT 
        s.id, s.name, s.slug, s.description, s.business_type AS businessType,
        s.address, s.area, s.city, s.phone, s.whatsapp, s.logo_url AS logoUrl,
        s.rating_average AS ratingAverage, s.rating_count AS ratingCount,
        s.latitude, s.longitude,
        hp.provider_type AS providerType, hp.emergency_available AS emergencyAvailable,
        hp.admin_queue_enabled AS adminQueueEnabled, hp.owner_queue_enabled AS ownerQueueEnabled,
        hp.queue_activation_status AS queueActivationStatus,
        hqs.status AS queueStatus, hqs.opening_time AS queueOpeningTime, hqs.closing_time AS queueClosingTime,
        hqs.current_token_number AS currentToken,
        (SELECT COUNT(1) FROM healthcare_queue_entries hqe WHERE hqe.store_id = s.id AND hqe.status = 'waiting') AS waitingCount,
        (SELECT json_group_array(json_object('id', d.id, 'name', d.name, 'specialization', d.specialization, 'fee', d.consultation_fee))
         FROM healthcare_doctors d WHERE d.store_id = s.id AND d.status = 'active') AS doctorsJson
      FROM stores s
      JOIN categories c ON c.id = s.category_id
      LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
      LEFT JOIN healthcare_queue_settings hqs ON hqs.store_id = s.id
      WHERE s.status NOT IN ('suspended','deleted','rejected')
        AND (
          c.module = 'healthcare' 
          OR hp.provider_type IS NOT NULL 
          OR s.business_type LIKE '%clinic%' 
          OR s.business_type LIKE '%doctor%' 
          OR s.business_type LIKE '%hospital%'
          OR EXISTS (SELECT 1 FROM healthcare_doctors doc WHERE doc.store_id = s.id)
        )
    `;

    const healthcareBindings: unknown[] = [];

    if (tokens.length > 0) {
      const tokenClauses: string[] = [];
      for (const token of tokens) {
        const tokenPattern = `%${token}%`;
        tokenClauses.push(`(
          s.name LIKE ? OR s.description LIKE ? OR s.area LIKE ? OR s.city LIKE ? OR s.business_type LIKE ?
          OR c.name LIKE ? OR EXISTS (SELECT 1 FROM healthcare_doctors doc WHERE doc.store_id = s.id AND (doc.name LIKE ? OR doc.specialization LIKE ?))
        )`);
        healthcareBindings.push(tokenPattern, tokenPattern, tokenPattern, tokenPattern, tokenPattern, tokenPattern, tokenPattern, tokenPattern);
      }
      healthcareQuery += ` AND (${tokenClauses.join(" AND ")})`;
    }

    if (parsed.minRating) {
      healthcareQuery += ` AND s.rating_average >= ?`;
      healthcareBindings.push(parsed.minRating);
    }

    healthcareQuery += " ORDER BY s.rating_average DESC LIMIT 40";

    // 2. SEARCH LOCAL STORES & SHOPS
    let storesQuery = `
      SELECT 
        s.id, s.name, s.slug, s.description, s.business_type AS businessType,
        s.address, s.area, s.city, s.phone, s.whatsapp, s.logo_url AS logoUrl, s.banner_url AS bannerUrl,
        s.rating_average AS ratingAverage, s.rating_count AS ratingCount,
        s.latitude, s.longitude,
        c.name AS categoryName, c.icon AS categoryIcon, c.color AS categoryColor
      FROM stores s
      JOIN categories c ON c.id = s.category_id
      WHERE s.status NOT IN ('suspended','deleted','rejected')
        AND c.module = 'local'
    `;

    const storesBindings: unknown[] = [];
    if (tokens.length > 0) {
      const tokenClauses: string[] = [];
      for (const token of tokens) {
        const tokenPattern = `%${token}%`;
        tokenClauses.push(`(
          s.name LIKE ? OR s.description LIKE ? OR s.area LIKE ? OR s.city LIKE ? 
          OR s.business_type LIKE ? OR c.name LIKE ?
        )`);
        storesBindings.push(tokenPattern, tokenPattern, tokenPattern, tokenPattern, tokenPattern, tokenPattern);
      }
      storesQuery += ` AND (${tokenClauses.join(" AND ")})`;
    }

    if (parsed.minRating) {
      storesQuery += ` AND s.rating_average >= ?`;
      storesBindings.push(parsed.minRating);
    }

    storesQuery += " ORDER BY s.rating_average DESC LIMIT 40";

    // 3. SEARCH SERVICES
    let servicesQuery = `
      SELECT 
        sv.id, sv.name, sv.category_name AS categoryName, sv.slug, sv.description,
        sv.price_from AS priceFrom, sv.duration_minutes AS durationMinutes,
        sv.estimated_arrival AS estimatedArrival, sv.image_url AS imageUrl,
        s.id AS storeId, s.name AS storeName, s.area AS storeArea, s.phone AS storePhone,
        s.rating_average AS storeRating, s.latitude, s.longitude
      FROM services sv
      JOIN stores s ON s.id = sv.store_id
      WHERE sv.status = 'active' AND s.status NOT IN ('suspended','deleted','rejected')
    `;

    const servicesBindings: unknown[] = [];
    if (tokens.length > 0) {
      const tokenClauses: string[] = [];
      for (const token of tokens) {
        const tokenPattern = `%${token}%`;
        tokenClauses.push(`(
          sv.name LIKE ? OR sv.description LIKE ? OR sv.category_name LIKE ? 
          OR s.name LIKE ? OR s.area LIKE ?
        )`);
        servicesBindings.push(tokenPattern, tokenPattern, tokenPattern, tokenPattern, tokenPattern);
      }
      servicesQuery += ` AND (${tokenClauses.join(" AND ")})`;
    }

    if (parsed.maxPrice) {
      servicesQuery += ` AND sv.price_from <= ?`;
      servicesBindings.push(parsed.maxPrice);
    }

    servicesQuery += " ORDER BY sv.created_at DESC LIMIT 40";

    // 4. SEARCH PRODUCTS
    let productsQuery = `
      SELECT 
        p.id, p.name, p.slug, p.description, p.price, p.currency, p.image_url AS imageUrl,
        s.id AS storeId, s.name AS storeName, s.area AS storeArea, s.latitude, s.longitude
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.status = 'active' AND s.status NOT IN ('suspended','deleted','rejected')
    `;

    const productsBindings: unknown[] = [];
    if (tokens.length > 0) {
      const tokenClauses: string[] = [];
      for (const token of tokens) {
        const tokenPattern = `%${token}%`;
        tokenClauses.push(`(
          p.name LIKE ? OR p.description LIKE ? OR s.name LIKE ?
        )`);
        productsBindings.push(tokenPattern, tokenPattern, tokenPattern);
      }
      productsQuery += ` AND (${tokenClauses.join(" AND ")})`;
    }

    if (parsed.maxPrice) {
      productsQuery += ` AND p.price <= ?`;
      productsBindings.push(parsed.maxPrice);
    }

    productsQuery += " ORDER BY p.created_at DESC LIMIT 40";

    // 5. RECOMMENDED NEARBY
    const recommendedQuery = `
      SELECT 
        s.id, s.name, s.slug, s.description, s.business_type AS businessType,
        s.address, s.area, s.city, s.phone, s.whatsapp, s.logo_url AS logoUrl,
        s.rating_average AS ratingAverage, s.rating_count AS ratingCount,
        s.latitude, s.longitude,
        c.name AS categoryName, c.icon AS categoryIcon, c.color AS categoryColor, c.module AS categoryModule
      FROM stores s
      JOIN categories c ON c.id = s.category_id
      WHERE s.status NOT IN ('suspended','deleted','rejected')
      ORDER BY s.rating_average DESC, s.view_count DESC LIMIT 20
    `;

    // BATCH ALL QUERIES IN A SINGLE ROUND-TRIP TO ELIMINATE N+1 LATENCY
    const [healthcareRes, storesRes, servicesRes, productsRes, recommendedRes] = await db.batch<any>([
      db.prepare(healthcareQuery).bind(...healthcareBindings),
      db.prepare(storesQuery).bind(...storesBindings),
      db.prepare(servicesQuery).bind(...servicesBindings),
      db.prepare(productsQuery).bind(...productsBindings),
      db.prepare(recommendedQuery),
    ]).catch(() => [
      { results: [] },
      { results: [] },
      { results: [] },
      { results: [] },
      { results: [] },
    ]);

    // Format & Calculate Distances
    let healthcare = (healthcareRes.results ?? []).map((row: any) => {
      const dist = distanceKm(lat, lng, row.latitude, row.longitude);
      let doctors = [];
      try {
        doctors = JSON.parse(row.doctorsJson || "[]");
      } catch {}
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        businessType: row.businessType,
        address: `${row.area}, ${row.city}`,
        phone: row.phone,
        whatsapp: row.whatsapp,
        logoUrl: row.logoUrl,
        rating: row.ratingAverage,
        reviews: row.ratingCount,
        distance: Number(dist.toFixed(1)),
        providerType: row.providerType,
        emergencyAvailable: Boolean(row.emergencyAvailable),
        queueEnabled: Boolean(row.adminQueueEnabled && row.ownerQueueEnabled),
        queueStatus: row.queueStatus || "closed",
        queueOpeningTime: row.queueOpeningTime,
        queueClosingTime: row.queueClosingTime,
        currentToken: row.currentToken || 0,
        waitingCount: row.waitingCount || 0,
        doctors,
      };
    });

    let stores = (storesRes.results ?? []).map((row: any) => {
      const dist = distanceKm(lat, lng, row.latitude, row.longitude);
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        businessType: row.businessType,
        category: row.categoryName,
        icon: row.categoryIcon || "🛍️",
        color: row.categoryColor || "#f97316",
        address: `${row.area}, ${row.city}`,
        phone: row.phone,
        logoUrl: row.logoUrl,
        bannerUrl: row.bannerUrl,
        rating: row.ratingAverage,
        reviews: row.ratingCount,
        distance: Number(dist.toFixed(1)),
      };
    });

    let services = (servicesRes.results ?? []).map((row: any) => {
      const dist = distanceKm(lat, lng, row.latitude, row.longitude);
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.categoryName,
        description: row.description,
        priceFrom: row.priceFrom,
        durationMinutes: row.durationMinutes,
        estimatedArrival: row.estimatedArrival,
        imageUrl: row.imageUrl,
        storeId: row.storeId,
        storeName: row.storeName,
        storeArea: row.storeArea,
        storeRating: row.storeRating,
        distance: Number(dist.toFixed(1)),
      };
    });

    let products = (productsRes.results ?? []).map((row: any) => {
      const dist = distanceKm(lat, lng, row.latitude, row.longitude);
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        price: row.price,
        currency: row.currency || "INR",
        imageUrl: row.imageUrl,
        storeId: row.storeId,
        storeName: row.storeName,
        storeArea: row.storeArea,
        distance: Number(dist.toFixed(1)),
      };
    });

    let recommended = (recommendedRes.results ?? []).map((row: any) => {
      const dist = distanceKm(lat, lng, row.latitude, row.longitude);
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.categoryName,
        icon: row.categoryIcon || "📍",
        color: row.categoryColor || "#f97316",
        module: row.categoryModule,
        address: `${row.area}, ${row.city}`,
        rating: row.ratingAverage,
        distance: Number(dist.toFixed(1)),
      };
    });

    // Distance filtering if user specified distance constraint (e.g. "within 2km")
    if (parsed.maxDistanceKm) {
      healthcare = healthcare.filter((h: any) => h.distance <= (parsed.maxDistanceKm ?? 999));
      stores = stores.filter((s: any) => s.distance <= (parsed.maxDistanceKm ?? 999));
      services = services.filter((sv: any) => sv.distance <= (parsed.maxDistanceKm ?? 999));
      products = products.filter((p: any) => p.distance <= (parsed.maxDistanceKm ?? 999));
      recommended = recommended.filter((r: any) => r.distance <= (parsed.maxDistanceKm ?? 999));
    }

    // Sort by distance if user queried "near me" or "nearest"
    if (parsed.sortBy === "nearest") {
      healthcare.sort((a: any, b: any) => a.distance - b.distance);
      stores.sort((a: any, b: any) => a.distance - b.distance);
      services.sort((a: any, b: any) => a.distance - b.distance);
      products.sort((a: any, b: any) => a.distance - b.distance);
      recommended.sort((a: any, b: any) => a.distance - b.distance);
    }

    const totalCount = healthcare.length + stores.length + services.length + products.length;

    const payload = {
      ok: true,
      query: rawQuery,
      parsedIntent: {
        cleanedTokens: parsed.cleanedTokens,
        minRating: parsed.minRating,
        maxPrice: parsed.maxPrice,
        maxDistanceKm: parsed.maxDistanceKm,
        sortBy: parsed.sortBy,
        openNow: parsed.openNow,
      },
      counts: {
        all: totalCount,
        healthcare: healthcare.length,
        stores: stores.length,
        services: services.length,
        products: products.length,
        recommended: recommended.length,
      },
      healthcare,
      stores,
      services,
      products,
      recommended,
    };

    microCache.set(cacheKey, payload, 30_000);
    return microCacheJson(payload, "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
  } catch (error) {
    return apiError(error);
  }
}
