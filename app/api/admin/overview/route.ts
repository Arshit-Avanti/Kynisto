import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/security";

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, "admin.dashboard");
    const db = getD1();
    const [stats, growth, eventTotals, pendingStores, recentUsers] = await Promise.all([
      db.prepare(`SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE role = 'store_owner') AS owners,
        (SELECT COUNT(*) FROM stores) AS stores,
        (SELECT COUNT(*) FROM stores WHERE status = 'pending') AS pendingStores,
        (SELECT COUNT(*) FROM stores WHERE status = 'approved') AS approvedStores,
        (SELECT COUNT(*) FROM reviews) AS reviews,
        (SELECT COUNT(*) FROM reports WHERE status IN ('open','reviewing')) AS openReports,
        (SELECT COUNT(*) FROM categories WHERE parent_id IS NULL) AS categories`).first(),
      db.prepare("SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS total FROM users WHERE created_at >= unixepoch() - 2592000 GROUP BY day ORDER BY day ASC").all(),
      db.prepare("SELECT event_type AS eventType, COUNT(*) AS total FROM analytics_events WHERE occurred_at >= unixepoch() - 2592000 GROUP BY event_type ORDER BY total DESC").all(),
      db.prepare("SELECT s.id, s.name, s.slug, s.address, s.created_at AS createdAt, c.name AS category, u.name AS ownerName FROM stores s JOIN categories c ON c.id = s.category_id LEFT JOIN users u ON u.id = s.owner_id WHERE s.status = 'pending' ORDER BY s.created_at ASC LIMIT 8").all(),
      db.prepare("SELECT id, name, email, role, status, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT 8").all(),
    ]);
    return noStoreJson({
      stats,
      growth: growth.results ?? [],
      eventTotals: eventTotals.results ?? [],
      pendingStores: pendingStores.results ?? [],
      recentUsers: recentUsers.results ?? [],
    });
  } catch (error) {
    return apiError(error);
  }
}
