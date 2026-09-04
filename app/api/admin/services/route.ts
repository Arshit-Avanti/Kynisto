import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { hasPermission } from "@/lib/rbac";
import { apiError, HttpError, noStoreJson } from "@/lib/security";

async function requireAdmin(request: Request) {
  const session = await requireApiSession(request);
  if (!hasPermission(session.user.role, "stores.manage_all")) {
    throw new HttpError(403, "Access Denied: Admin role required.", "ACCESS_DENIED");
  }
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = getD1();

    await db.prepare(`CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category_name TEXT NOT NULL DEFAULT 'General',
      slug TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price_from REAL,
      duration_minutes INTEGER,
      estimated_arrival TEXT NOT NULL DEFAULT '30–60 min',
      image_key TEXT,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run().catch(() => {});

    const items = await db.prepare(`SELECT 
        sv.id, sv.name, sv.category_name AS categoryName, sv.slug, sv.description,
        sv.price_from AS priceFrom, sv.estimated_arrival AS estimatedArrival,
        sv.status, sv.created_at AS createdAt,
        s.id AS storeId, s.name AS storeName, u.email AS ownerEmail
      FROM services sv
      JOIN stores s ON s.id = sv.store_id
      LEFT JOIN users u ON u.id = s.owner_id
      ORDER BY sv.created_at DESC`).all();

    return noStoreJson({
      ok: true,
      items: items.results || [],
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json() as { serviceId?: string; status?: string; action?: string; serviceIds?: string[] };
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);

    if (body.action === "bulk_approve" && Array.isArray(body.serviceIds) && body.serviceIds.length > 0) {
      const placeholders = body.serviceIds.map(() => "?").join(",");
      await db.prepare(`UPDATE services SET status = 'active', updated_at = ? WHERE id IN (${placeholders})`)
        .bind(now, ...body.serviceIds)
        .run();
      return noStoreJson({ ok: true, message: `${body.serviceIds.length} services allowed/approved.` });
    }

    if (body.action === "bulk_reject" && Array.isArray(body.serviceIds) && body.serviceIds.length > 0) {
      const placeholders = body.serviceIds.map(() => "?").join(",");
      await db.prepare(`UPDATE services SET status = 'rejected', updated_at = ? WHERE id IN (${placeholders})`)
        .bind(now, ...body.serviceIds)
        .run();
      return noStoreJson({ ok: true, message: `${body.serviceIds.length} services rejected.` });
    }

    if (!body.serviceId) {
      throw new HttpError(400, "Service ID is required.", "MISSING_SERVICE_ID");
    }

    const newStatus = body.status ?? (body.action === "allow" || body.action === "approve" ? "active" : "rejected");
    await db.prepare("UPDATE services SET status = ?, updated_at = ? WHERE id = ?")
      .bind(newStatus, now, body.serviceId)
      .run();

    return noStoreJson({ ok: true, message: `Service status updated to ${newStatus}.` });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json() as { serviceId?: string; serviceIds?: string[]; action?: string };
    const db = getD1();

    if ((body.action === "bulk_delete" || Array.isArray(body.serviceIds)) && body.serviceIds && body.serviceIds.length > 0) {
      const placeholders = body.serviceIds.map(() => "?").join(",");
      await db.prepare(`DELETE FROM services WHERE id IN (${placeholders})`)
        .bind(...body.serviceIds)
        .run();
      return noStoreJson({ ok: true, message: `${body.serviceIds.length} services permanently deleted.` });
    }

    if (!body.serviceId) {
      throw new HttpError(400, "Service ID is required.", "MISSING_SERVICE_ID");
    }

    await db.prepare("DELETE FROM services WHERE id = ?").bind(body.serviceId).run();

    return noStoreJson({ ok: true, message: "Service deleted successfully." });
  } catch (error) {
    return apiError(error);
  }
}
