import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/db/runtime";
import { apiError, noStoreJson } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim();
    const query = searchParams.get("q")?.trim();
    const db = getD1();

    // Ensure services table exists safely
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

    let sql = `SELECT 
        sv.id, sv.name, sv.category_name AS categoryName, sv.slug, sv.description,
        sv.price_from AS startingPrice, sv.estimated_arrival AS estimatedArrival,
        sv.status, sv.created_at AS createdAt,
        s.id AS storeId, s.name AS storeName, s.slug AS storeSlug, s.phone AS storePhone,
        s.address, s.area, s.city
      FROM services sv
      JOIN stores s ON s.id = sv.store_id
      WHERE sv.status = 'active' AND s.status = 'approved'`;

    const params: (string | number)[] = [];

    if (category && category !== "All") {
      sql += ` AND sv.category_name = ?`;
      params.push(category);
    }

    if (query) {
      sql += ` AND (sv.name LIKE ? OR sv.description LIKE ? OR sv.category_name LIKE ? OR s.name LIKE ?)`;
      const term = `%${query}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY sv.created_at DESC LIMIT 100`;

    const items = await db.prepare(sql).bind(...params).all<{
      id: string;
      name: string;
      categoryName: string;
      slug: string;
      description: string;
      startingPrice: number | null;
      estimatedArrival: string;
      status: string;
      createdAt: number;
      storeId: string;
      storeName: string;
      storeSlug: string;
      storePhone: string | null;
      address: string;
      area: string;
      city: string;
    }>();

    return NextResponse.json(
      { ok: true, items: items.results || [] },
      {
        headers: {
          "Cache-Control": "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    return apiError(error);
  }
}
