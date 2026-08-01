import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { hasPermission, permissionsForRole, USER_ROLES } from "../lib/rbac.ts";

test("Kynisto exposes only the three configured primary roles", () => {
  assert.deepEqual([...USER_ROLES], ["admin", "store_owner", "customer"]);
});

test("platform administration capabilities never leak to owner or customer roles", () => {
  const sensitive = [
    "admin.dashboard",
    "users.manage",
    "stores.manage_all",
    "products.manage_all",
    "orders.manage_all",
    "settings.manage",
    "audit.view",
    "security.view",
    "reports.export",
  ];
  for (const permission of sensitive) {
    assert.equal(hasPermission("admin", permission), true, `admin needs ${permission}`);
    assert.equal(hasPermission("store_owner", permission), false, `owner must not receive ${permission}`);
    assert.equal(hasPermission("customer", permission), false, `customer must not receive ${permission}`);
  }
});

test("shop-owner capabilities remain own-store scoped", () => {
  for (const permission of ["store.manage_own", "products.manage_own", "inventory.manage_own", "orders.manage_own", "customers.view_own", "analytics.view_own"]) {
    assert.equal(hasPermission("store_owner", permission), true);
    assert.equal(hasPermission("customer", permission), false);
  }
  assert.ok(permissionsForRole("store_owner").every((permission) => !permission.endsWith("_all")));
});

test("customer commerce capabilities do not grant management authority", () => {
  for (const permission of ["profile.manage_own", "addresses.manage_own", "wishlist.manage_own", "cart.manage_own", "orders.create", "orders.view_own", "favorites.manage_own"]) {
    assert.equal(hasPermission("customer", permission), true);
  }
  assert.equal(hasPermission("customer", "products.manage_own"), false);
  assert.equal(hasPermission("customer", "store.manage_own"), false);
});

test("live queue permissions separate operators from patients", () => {
  assert.equal(hasPermission("admin", "healthcare.manage_all"), true);
  assert.equal(hasPermission("admin", "queue.join"), true);
  assert.equal(hasPermission("store_owner", "queue.manage_own"), true);
  assert.equal(hasPermission("store_owner", "queue.join"), false);
  assert.equal(hasPermission("customer", "queue.join"), true);
  assert.equal(hasPermission("customer", "queue.manage_own"), false);
  assert.equal(hasPermission("customer", "healthcare.manage_all"), false);
});

test("protected workspace routes declare permission and ownership boundaries", async () => {
  const [admin, owner, customer, auth, userAdmin] = await Promise.all([
    readFile(new URL("../app/api/admin/workspace/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/owner/workspace/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/customer/workspace/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/users/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(admin, /requireApiPermission/);
  assert.match(owner, /requireApiPermission/);
  assert.match(owner, /requireOwnedStore/);
  assert.match(customer, /requireApiPermission/);
  assert.match(auth, /ACCESS_DENIED/);
  assert.match(auth, /PASSWORD_CHANGE_REQUIRED/);
  assert.match(userAdmin, /isSuperAdmin/);
  assert.match(userAdmin, /PROTECTED_SUPER_ADMIN/);
});

test("default admin security, role-aware login, and Karawal Nagar reseed are explicit", async () => {
  const [seed, login, changePassword] = await Promise.all([
    readFile(new URL("../db/seed.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/login/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/change-password/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(seed, /nxt\.arshit@gmail\.com/);
  assert.match(seed, /hashPassword\("Arshit"\)/);
  assert.match(seed, /must_change_password/);
  assert.match(seed, /is_super_admin/);
  assert.match(seed, /28\.7381/);
  assert.match(seed, /77\.2669/);
  assert.match(seed, /DEMO_STORE_IDS/);
  assert.match(login, /expectedRole/);
  assert.match(login, /expectedRole !== "admin"/);
  assert.match(login, /GOOGLE_REQUIRED/);
  assert.match(login, /ROLE_MISMATCH/);
  assert.match(login, /TIMING_HASH/);
  assert.match(changePassword, /verifyPassword/);
  assert.match(changePassword, /DELETE FROM sessions WHERE user_id/);
});
