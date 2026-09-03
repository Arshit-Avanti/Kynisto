import { getD1 } from "@/db/runtime";
import { HttpError, hashedClientIp } from "@/lib/security";

export async function requireOwnedStore(ownerId: string, storeId: string) {
  const db = getD1();
  const user = await db
    .prepare("SELECT role FROM users WHERE id = ? LIMIT 1")
    .bind(ownerId)
    .first<{ role: string }>();

  if (user?.role === "admin") {
    const store = await db
      .prepare("SELECT id, name, slug, status FROM stores WHERE id = ? LIMIT 1")
      .bind(storeId)
      .first<{ id: string; name: string; slug: string; status: string }>();
    if (store) return store;
  }

  const store = await db
    .prepare("SELECT id, name, slug, status FROM stores WHERE id = ? AND owner_id = ? LIMIT 1")
    .bind(storeId, ownerId)
    .first<{ id: string; name: string; slug: string; status: string }>();
  if (!store) {
    throw new HttpError(404, "Business not found or not owned by this account.", "STORE_NOT_OWNED");
  }
  return store;
}

export async function writeAudit(
  request: Request,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await getD1()
    .prepare(
      "INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      crypto.randomUUID(),
      actorId,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata),
      await hashedClientIp(request),
      Math.floor(Date.now() / 1000),
    )
    .run();
}
