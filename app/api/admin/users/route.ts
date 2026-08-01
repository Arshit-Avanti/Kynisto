import { getD1 } from "@/db/runtime";
import { requireApiPermission, type UserRole } from "@/lib/auth";
import { writeAudit } from "@/lib/ownership";
import { apiError, HttpError } from "@/lib/security";
import { cleanText, d1SearchText, safeJson } from "@/lib/validation";

function cleanUserIds(value: unknown): string[] {
  if (!Array.isArray(value)) throw new HttpError(400, "Choose at least one user.", "SELECTION_REQUIRED");
  const ids = [...new Set(value.map((item) => cleanText(item, "User", { max: 80 })))];
  if (!ids.length) throw new HttpError(400, "Choose at least one user.", "SELECTION_REQUIRED");
  if (ids.length > 50) throw new HttpError(400, "You can delete up to 50 users at once.", "SELECTION_TOO_LARGE");
  return ids;
}

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, "users.manage");
    const url = new URL(request.url);
    const query = d1SearchText((url.searchParams.get("q") ?? "").replace(/[%_]/g, "").trim());
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const conditions = ["1 = 1"];
    const bindings: unknown[] = [];
    if (query) {
      conditions.push("(name LIKE ? OR email LIKE ?)");
      bindings.push(`%${query}%`, `%${query}%`);
    }
    if (role === "admin" || role === "store_owner" || role === "customer") {
      conditions.push("role = ?");
      bindings.push(role);
    }
    if (status === "active" || status === "suspended" || status === "disabled" || status === "banned") {
      conditions.push("status = ?");
      bindings.push(status);
    }
    const where = conditions.join(" AND ");
    const db = getD1();
    const [items, total] = await Promise.all([
      db.prepare(`SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar_url AS avatarUrl, u.last_login_at AS lastLoginAt, u.created_at AS createdAt, COALESCE(us.is_super_admin, 0) AS isSuperAdmin FROM users u LEFT JOIN user_security us ON us.user_id = u.id WHERE ${where.replaceAll("name", "u.name").replaceAll("email", "u.email").replaceAll("role", "u.role").replaceAll("status", "u.status")} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`).bind(...bindings, limit, (page - 1) * limit).all(),
      db.prepare(`SELECT COUNT(*) AS total FROM users WHERE ${where}`).bind(...bindings).first<{ total: number }>(),
    ]);
    return Response.json({ items: items.results ?? [], pagination: { page, limit, total: total?.total ?? 0 } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "users.manage", { csrf: true });
    const body = await safeJson(request);
    if (body.action === "bulk_delete") {
      const userIds = cleanUserIds(body.userIds);
      if (userIds.includes(session.user.id)) throw new HttpError(409, "You cannot delete your own administrator account.", "SELF_PROTECTION");
      const placeholders = userIds.map(() => "?").join(",");
      const users = await getD1().prepare(`SELECT u.id, u.email, u.role, COALESCE(us.is_super_admin, 0) AS isSuperAdmin,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orderCount
        FROM users u LEFT JOIN user_security us ON us.user_id = u.id WHERE u.id IN (${placeholders})`).bind(...userIds).all<{ id: string; email: string; role: UserRole; isSuperAdmin: number; orderCount: number }>();
      const found = users.results ?? [];
      if (found.length !== userIds.length) throw new HttpError(404, "One or more users were not found.", "USER_NOT_FOUND");
      if (found.some((user) => user.isSuperAdmin)) throw new HttpError(409, "The Super Admin account cannot be deleted.", "PROTECTED_SUPER_ADMIN");
      if (!session.user.isSuperAdmin && found.some((user) => user.role === "admin")) throw new HttpError(403, "Only the Super Admin can delete administrators.", "SUPER_ADMIN_REQUIRED");
      if (found.some((user) => Number(user.orderCount) > 0)) throw new HttpError(409, "Users with order history must be suspended or banned instead of deleted.", "USER_HAS_ORDERS");
      await writeAudit(request, session.user.id, "user.bulk_deleted", "user", userIds[0], { userIds, emails: found.map((user) => user.email), count: userIds.length });
      await getD1().prepare(`DELETE FROM users WHERE id IN (${placeholders})`).bind(...userIds).run();
      return Response.json({ ok: true, count: userIds.length });
    }
    const userId = cleanText(body.userId, "User", { max: 80 });
    const status = body.status;
    const role = body.role;
    if (status !== "active" && status !== "suspended" && status !== "disabled" && status !== "banned") {
      throw new HttpError(400, "Choose a valid account status.", "INVALID_STATUS");
    }
    if (role !== "admin" && role !== "store_owner" && role !== "customer") {
      throw new HttpError(400, "Choose a valid role.", "INVALID_ROLE");
    }
    if (userId === session.user.id && (role !== "admin" || status !== "active")) {
      throw new HttpError(409, "You cannot remove your own administrator access.", "SELF_PROTECTION");
    }
    const target = await getD1().prepare(
      `SELECT u.role, COALESCE(us.is_super_admin, 0) AS isSuperAdmin
       FROM users u LEFT JOIN user_security us ON us.user_id = u.id WHERE u.id = ? LIMIT 1`,
    ).bind(userId).first<{ role: UserRole; isSuperAdmin: number }>();
    if (!target) throw new HttpError(404, "User not found.", "USER_NOT_FOUND");
    if (target.isSuperAdmin) {
      throw new HttpError(409, "The Super Admin role and active status are protected.", "PROTECTED_SUPER_ADMIN");
    }
    if (!session.user.isSuperAdmin && (target.role === "admin" || role === "admin")) {
      throw new HttpError(403, "Only the Super Admin can change administrator access.", "SUPER_ADMIN_REQUIRED");
    }
    await getD1().prepare("UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?").bind(role as UserRole, status, Math.floor(Date.now() / 1000), userId).run();
    if (status !== "active") await getD1().prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
    await writeAudit(request, session.user.id, "user.updated", "user", userId, { role, status });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "users.manage", { csrf: true });
    const body = await safeJson(request);
    const userId = cleanText(body.userId, "User", { max: 80 });
    if (userId === session.user.id) {
      throw new HttpError(409, "You cannot delete your own administrator account.", "SELF_PROTECTION");
    }
    const user = await getD1()
      .prepare("SELECT u.email, u.role, COALESCE(us.is_super_admin, 0) AS isSuperAdmin FROM users u LEFT JOIN user_security us ON us.user_id = u.id WHERE u.id = ? LIMIT 1")
      .bind(userId)
      .first<{ email: string; role: UserRole; isSuperAdmin: number }>();
    if (!user) throw new HttpError(404, "User not found.", "USER_NOT_FOUND");
    if (user.isSuperAdmin) {
      throw new HttpError(409, "The Super Admin account cannot be deleted.", "PROTECTED_SUPER_ADMIN");
    }
    if (user.role === "admin" && !session.user.isSuperAdmin) {
      throw new HttpError(403, "Only the Super Admin can delete an administrator.", "SUPER_ADMIN_REQUIRED");
    }
    const orderHistory = await getD1().prepare("SELECT COUNT(*) AS total FROM orders WHERE user_id = ?").bind(userId).first<{ total: number }>();
    if (Number(orderHistory?.total ?? 0) > 0) {
      throw new HttpError(409, "Users with order history must be suspended or banned instead of deleted.", "USER_HAS_ORDERS");
    }
    await writeAudit(request, session.user.id, "user.deleted", "user", userId, { email: user.email });
    await getD1().prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
