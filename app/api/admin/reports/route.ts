import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { writeAudit } from "@/lib/ownership";
import { apiError, HttpError } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, "support.manage");
    const status = new URL(request.url).searchParams.get("status");
    const valid = ["open", "reviewing", "resolved", "dismissed"];
    const condition = valid.includes(status ?? "") ? "WHERE rp.status = ?" : "";
    const statement = getD1().prepare(`SELECT rp.id, rp.store_id AS storeId, s.name AS storeName, rp.review_id AS reviewId, rp.reason, rp.details, rp.status, u.name AS reporterName, u.email AS reporterEmail, rp.created_at AS createdAt, rp.updated_at AS updatedAt FROM reports rp LEFT JOIN stores s ON s.id = rp.store_id LEFT JOIN users u ON u.id = rp.reporter_id ${condition} ORDER BY CASE rp.status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END, rp.created_at DESC LIMIT 200`);
    const result = condition ? await statement.bind(status).all() : await statement.all();
    return Response.json({ items: result.results ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "support.manage", { csrf: true });
    const body = await safeJson(request);
    const id = cleanText(body.id, "Report", { max: 80 });
    const status = body.status;
    if (status !== "open" && status !== "reviewing" && status !== "resolved" && status !== "dismissed") throw new HttpError(400, "Invalid report status.", "INVALID_STATUS");
    const now = Math.floor(Date.now() / 1000);
    await getD1().prepare("UPDATE reports SET status = ?, assigned_to = ?, resolved_at = CASE WHEN ? IN ('resolved','dismissed') THEN ? ELSE NULL END, updated_at = ? WHERE id = ?").bind(status, session.user.id, status, now, now, id).run();
    await writeAudit(request, session.user.id, "report.updated", "report", id, { status });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "support.manage", { csrf: true });
    const body = await safeJson(request);
    const reportIds = body.action === "bulk_delete"
      ? Array.isArray(body.reportIds) ? [...new Set(body.reportIds.map((item) => cleanText(item, "Report", { max: 80 })))] : []
      : [cleanText(body.id, "Report", { max: 80 })];
    if (!reportIds.length || reportIds.length > 100) throw new HttpError(400, "Choose between 1 and 100 reports.", "INVALID_SELECTION");
    const placeholders = reportIds.map(() => "?").join(",");
    const found = await getD1().prepare(`SELECT id FROM reports WHERE id IN (${placeholders})`).bind(...reportIds).all();
    if ((found.results ?? []).length !== reportIds.length) throw new HttpError(404, "One or more reports were not found.", "REPORT_NOT_FOUND");
    await getD1().prepare(`DELETE FROM reports WHERE id IN (${placeholders})`).bind(...reportIds).run();
    await writeAudit(request, session.user.id, reportIds.length > 1 ? "report.bulk_deleted" : "report.deleted", "report", reportIds[0], { reportIds, count: reportIds.length });
    return Response.json({ ok: true, count: reportIds.length });
  } catch (error) {
    return apiError(error);
  }
}
