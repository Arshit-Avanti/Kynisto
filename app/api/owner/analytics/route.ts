import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "analytics.view_own");
    const result = await getD1()
      .prepare(
        `SELECT date(ae.occurred_at, 'unixepoch') AS day, ae.event_type AS eventType, COUNT(*) AS total
         FROM analytics_events ae JOIN stores s ON s.id = ae.store_id
         WHERE s.owner_id = ? AND ae.occurred_at >= unixepoch() - 2592000
         GROUP BY day, ae.event_type ORDER BY day ASC`,
      )
      .bind(session.user.id)
      .all();
    return noStoreJson({ items: result.results ?? [] });
  } catch (error) {
    return apiError(error);
  }
}
