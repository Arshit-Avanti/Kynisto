import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "store.manage_own");
    const db = getD1();
    const [stores, analytics, recentReviews] = await Promise.all([
      db
        .prepare(
          `SELECT s.id, s.name, s.slug, s.description, s.business_type AS businessType,
            s.address, s.area, s.city, s.state, s.country, s.postal_code AS postalCode,
            s.latitude, s.longitude, s.google_maps_url AS googleMapsUrl,
            s.phone, s.whatsapp, s.email, s.website, s.business_hours AS businessHours,
            s.opening_days AS openingDays, s.logo_url AS logoUrl, s.banner_url AS bannerUrl,
            s.rating_average AS rating, s.rating_count AS reviewCount, s.status,
            s.rejection_reason AS rejectionReason, s.view_count AS viewCount,
            s.category_id AS categoryId, s.subcategory_id AS subcategoryId,
            c.name AS category, sc.name AS subcategory, s.created_at AS createdAt, s.updated_at AS updatedAt
           FROM stores s JOIN categories c ON c.id = s.category_id
           LEFT JOIN categories sc ON sc.id = s.subcategory_id
           WHERE s.owner_id = ? ORDER BY s.created_at DESC`,
        )
        .bind(session.user.id)
        .all(),
      db
        .prepare(
          `SELECT ae.event_type AS eventType, COUNT(*) AS total
           FROM analytics_events ae JOIN stores s ON s.id = ae.store_id
           WHERE s.owner_id = ? AND ae.occurred_at >= unixepoch() - 2592000
           GROUP BY ae.event_type`,
        )
        .bind(session.user.id)
        .all(),
      db
        .prepare(
          `SELECT r.id, r.store_id AS storeId, s.name AS storeName, r.reviewer_name AS reviewerName,
            r.rating, r.title, r.comment, r.owner_reply AS ownerReply, r.status, r.created_at AS createdAt
           FROM reviews r JOIN stores s ON s.id = r.store_id
           WHERE s.owner_id = ? ORDER BY r.created_at DESC LIMIT 20`,
        )
        .bind(session.user.id)
        .all(),
    ]);
    return noStoreJson({
      stores: stores.results ?? [],
      analytics: analytics.results ?? [],
      recentReviews: recentReviews.results ?? [],
    });
  } catch (error) {
    return apiError(error);
  }
}
