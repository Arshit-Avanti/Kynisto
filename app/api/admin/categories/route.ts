import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { writeAudit } from "@/lib/ownership";
import { apiError, HttpError } from "@/lib/security";
import { cleanText, safeJson, slugify } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, "categories.manage");
    const result = await getD1().prepare(`SELECT c.id, c.parent_id AS parentId, c.name, c.slug, c.description, c.icon, c.color, c.sort_order AS sortOrder, c.status, p.name AS parentName, COUNT(s.id) AS storeCount FROM categories c LEFT JOIN categories p ON p.id = c.parent_id LEFT JOIN stores s ON s.category_id = c.id OR s.subcategory_id = c.id GROUP BY c.id ORDER BY c.parent_id IS NOT NULL, COALESCE(p.sort_order, c.sort_order), c.sort_order, c.name`).all();
    return Response.json({ items: result.results ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "categories.manage", { csrf: true });
    const body = await safeJson(request);
    const name = cleanText(body.name, "Category name", { min: 2, max: 100 });
    const parentId = cleanText(body.parentId, "Parent category", { max: 80, required: false }) || null;
    if (parentId) {
      const parent = await getD1().prepare("SELECT id FROM categories WHERE id = ? AND parent_id IS NULL").bind(parentId).first();
      if (!parent) throw new HttpError(400, "Parent category not found.", "INVALID_PARENT");
    }
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await getD1().prepare("INSERT INTO categories (id, parent_id, name, slug, description, icon, color, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)").bind(id, parentId, name, `${slugify(name)}-${id.slice(0, 5)}`, cleanText(body.description, "Description", { max: 500, required: false }) || null, cleanText(body.icon, "Icon", { max: 8, required: false }) || "⌖", cleanText(body.color, "Colour", { max: 20, required: false }) || "#f15f3a", Number(body.sortOrder) || 0, now, now).run();
    await writeAudit(request, session.user.id, "category.created", "category", id, { parentId });
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "categories.manage", { csrf: true });
    const body = await safeJson(request);
    const id = cleanText(body.id, "Category", { max: 80 });
    const name = cleanText(body.name, "Category name", { min: 2, max: 100 });
    const status = body.status === "hidden" ? "hidden" : "active";
    await getD1().prepare("UPDATE categories SET name = ?, description = ?, icon = ?, color = ?, sort_order = ?, status = ?, updated_at = ? WHERE id = ?").bind(name, cleanText(body.description, "Description", { max: 500, required: false }) || null, cleanText(body.icon, "Icon", { max: 8, required: false }) || "⌖", cleanText(body.color, "Colour", { max: 20, required: false }) || "#f15f3a", Number(body.sortOrder) || 0, status, Math.floor(Date.now() / 1000), id).run();
    await writeAudit(request, session.user.id, "category.updated", "category", id, { status });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "categories.manage", { csrf: true });
    const body = await safeJson(request);
    if (body.action === "bulk_delete") {
      if (!Array.isArray(body.categoryIds)) throw new HttpError(400, "Choose at least one category.", "SELECTION_REQUIRED");
      const categoryIds = [...new Set(body.categoryIds.map((item) => cleanText(item, "Category", { max: 80 })))];
      if (!categoryIds.length || categoryIds.length > 50) throw new HttpError(400, "Choose between 1 and 50 categories.", "INVALID_SELECTION");
      const placeholders = categoryIds.map(() => "?").join(",");
      const categories = await getD1().prepare(`SELECT c.id, c.name,
        (SELECT COUNT(*) FROM stores s WHERE s.category_id = c.id OR s.subcategory_id = c.id) +
        (SELECT COUNT(*) FROM categories child WHERE child.parent_id = c.id) AS usageCount
        FROM categories c WHERE c.id IN (${placeholders})`).bind(...categoryIds).all<{ id: string; name: string; usageCount: number }>();
      const found = categories.results ?? [];
      if (found.length !== categoryIds.length) throw new HttpError(404, "One or more categories were not found.", "CATEGORY_NOT_FOUND");
      if (found.some((category) => Number(category.usageCount) > 0)) throw new HttpError(409, "Move related stores or subcategories before deleting selected categories.", "CATEGORY_IN_USE");
      await getD1().prepare(`DELETE FROM categories WHERE id IN (${placeholders})`).bind(...categoryIds).run();
      await writeAudit(request, session.user.id, "category.bulk_deleted", "category", categoryIds[0], { categoryIds, names: found.map((category) => category.name), count: categoryIds.length });
      return Response.json({ ok: true, count: categoryIds.length });
    }
    const id = cleanText(body.id, "Category", { max: 80 });
    const usage = await getD1().prepare("SELECT (SELECT COUNT(*) FROM stores WHERE category_id = ? OR subcategory_id = ?) + (SELECT COUNT(*) FROM categories WHERE parent_id = ?) AS total").bind(id, id, id).first<{ total: number }>();
    if ((usage?.total ?? 0) > 0) throw new HttpError(409, "Move related stores or subcategories before deleting this category.", "CATEGORY_IN_USE");
    await getD1().prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
    await writeAudit(request, session.user.id, "category.deleted", "category", id);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
