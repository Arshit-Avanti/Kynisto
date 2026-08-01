import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { apiError, HttpError } from "@/lib/security";
import { cleanText, d1SearchText, numberInput } from "@/lib/validation";

const SORT_SQL = {
  relevance: "s.rating_average DESC, p.created_at DESC",
  rated: "s.rating_average DESC, s.rating_count DESC, p.created_at DESC",
  newest: "p.created_at DESC",
  price_asc: "p.price ASC, p.created_at DESC",
  price_desc: "p.price DESC, p.created_at DESC",
} as const;

type ProductSort = keyof typeof SORT_SQL;

function positiveInteger(value: string | null, fallback: number, maximum: number): number {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new HttpError(400, "Pagination value is invalid.", "INVALID_PAGINATION");
  }
  return parsed;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function optionalQueryText(value: string | null, label: string, max: number): string {
  return cleanText(value, label, { required: false, max });
}

/** Public, read-only product catalogue. Only active products from approved stores are exposed. */
export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const url = new URL(request.url);
    const query = optionalQueryText(url.searchParams.get("q"), "Search", 100);
    const storeId = optionalQueryText(url.searchParams.get("storeId"), "Store", 80);
    const category = optionalQueryText(url.searchParams.get("category"), "Category", 80);
    const area = optionalQueryText(url.searchParams.get("area"), "Area", 100);
    const page = positiveInteger(url.searchParams.get("page"), 1, 10_000);
    const limit = positiveInteger(url.searchParams.get("limit"), 12, 48);
    const minPrice = numberInput(url.searchParams.get("minPrice"), "Minimum price", {
      min: 0,
      max: 10_000_000,
      required: false,
    });
    const maxPrice = numberInput(url.searchParams.get("maxPrice"), "Maximum price", {
      min: 0,
      max: 10_000_000,
      required: false,
    });
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      throw new HttpError(400, "Minimum price cannot exceed maximum price.", "INVALID_PRICE_RANGE");
    }

    const sortParam = url.searchParams.get("sort") ?? "relevance";
    const sort = (sortParam in SORT_SQL ? sortParam : "relevance") as ProductSort;
    const inStock = url.searchParams.get("inStock") === "true";
    const conditions = ["p.status = 'active'", "p.price IS NOT NULL", "s.status = 'approved'"];
    const bindings: unknown[] = [];

    if (query) {
      const pattern = `%${d1SearchText(escapeLike(query))}%`;
      conditions.push(
        "(p.name LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\' OR s.name LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\')",
      );
      bindings.push(pattern, pattern, pattern, pattern);
    }
    if (storeId) {
      conditions.push("s.id = ?");
      bindings.push(storeId);
    }
    if (category) {
      conditions.push("(c.id = ? OR c.slug = ?)");
      bindings.push(category, category.toLowerCase());
    }
    if (area) {
      conditions.push("(s.area LIKE ? ESCAPE '\\' OR s.city LIKE ? ESCAPE '\\' OR s.postal_code = ?)");
      const pattern = `%${d1SearchText(escapeLike(area))}%`;
      bindings.push(pattern, pattern, area);
    }
    if (minPrice !== null) {
      conditions.push("p.price >= ?");
      bindings.push(minPrice);
    }
    if (maxPrice !== null) {
      conditions.push("p.price <= ?");
      bindings.push(maxPrice);
    }
    if (inStock) conditions.push("(i.quantity - i.reserved_quantity) > 0");

    const where = conditions.join(" AND ");
    const from = `FROM products p
      JOIN inventory i ON i.product_id = p.id AND i.store_id = p.store_id
      JOIN stores s ON s.id = p.store_id
      JOIN categories c ON c.id = s.category_id
      LEFT JOIN store_settings ss ON ss.store_id = s.id`;
    const db = getD1();
    const offset = (page - 1) * limit;
    const [countResult, itemResult] = await db.batch([
      db.prepare(`SELECT COUNT(*) AS total ${from} WHERE ${where}`).bind(...bindings),
      db
        .prepare(
          `SELECT p.id, p.store_id AS storeId, p.name, p.slug, p.description,
            p.price, p.currency, p.image_url AS imageUrl, p.created_at AS createdAt,
            i.sku, i.quantity, i.reserved_quantity AS reservedQuantity,
            MAX(i.quantity - i.reserved_quantity, 0) AS availableQuantity,
            s.name AS storeName, s.slug AS storeSlug, s.area, s.city,
            s.rating_average AS storeRating, s.rating_count AS storeRatingCount,
            COALESCE((SELECT ROUND(AVG(pr.rating), 1) FROM product_reviews pr
              WHERE pr.product_id = p.id AND pr.status = 'published'), 0) AS productRating,
            (SELECT COUNT(*) FROM product_reviews pr
              WHERE pr.product_id = p.id AND pr.status = 'published') AS productReviewCount,
            s.logo_url AS storeLogoUrl, c.id AS categoryId, c.name AS category,
            c.slug AS categorySlug, COALESCE(ss.accepting_orders, 1) AS acceptingOrders
           ${from}
           WHERE ${where}
           ORDER BY ${SORT_SQL[sort]}
           LIMIT ? OFFSET ?`,
        )
        .bind(...bindings, limit, offset),
    ]);

    const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
    return Response.json(
      {
        items: itemResult.results ?? [],
        pagination: {
          page,
          limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        },
      },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
