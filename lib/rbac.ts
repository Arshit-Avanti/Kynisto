/**
 * Kynisto's authorization policy lives in one place so routes and UI never
 * invent their own role rules. Keep permission names resource/action based;
 * adding a role only requires defining its policy here and assigning it at the
 * identity boundary.
 */
export const USER_ROLES = ["admin", "store_owner", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  "admin.dashboard",
  "users.manage",
  "stores.manage_all",
  "products.manage_all",
  "orders.manage_all",
  "categories.manage",
  "analytics.view_all",
  "notifications.manage",
  "banners.manage",
  "coupons.manage_all",
  "reviews.moderate",
  "support.manage",
  "settings.manage",
  "audit.view",
  "security.view",
  "reports.export",
  "reports.create",
  "media.manage",
  "store.manage_own",
  "products.manage_own",
  "inventory.manage_own",
  "orders.manage_own",
  "customers.view_own",
  "analytics.view_own",
  "reviews.reply_own",
  "coupons.manage_own",
  "notifications.view_own",
  "settings.manage_own",
  "profile.manage_own",
  "addresses.manage_own",
  "wishlist.manage_own",
  "cart.manage_own",
  "orders.create",
  "orders.view_own",
  "reviews.create",
  "favorites.manage_own",
  "support.create",
  "chat.use",
  "chat.manage_all",
  "healthcare.manage_all",
  "queue.monitor_all",
  "queue.manage_own",
  "queue.join",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const storeOwnerPermissions: readonly Permission[] = [
    "store.manage_own",
    "products.manage_own",
    "inventory.manage_own",
    "orders.manage_own",
    "customers.view_own",
    "analytics.view_own",
    "reviews.reply_own",
    "coupons.manage_own",
    "notifications.view_own",
    "settings.manage_own",
    "support.create",
    "reports.create",
    "media.manage",
    "chat.use",
    "queue.manage_own",
];

const customerPermissions: readonly Permission[] = [
    "profile.manage_own",
    "addresses.manage_own",
    "wishlist.manage_own",
    "cart.manage_own",
    "orders.create",
    "orders.view_own",
    "reviews.create",
    "favorites.manage_own",
    "notifications.view_own",
    "settings.manage_own",
    "support.create",
    "reports.create",
    "chat.use",
    "queue.join",
];

const adminPermissions: readonly Permission[] = [
    "admin.dashboard",
    "users.manage",
    "stores.manage_all",
    "products.manage_all",
    "orders.manage_all",
    "categories.manage",
    "analytics.view_all",
    "notifications.manage",
    "banners.manage",
    "coupons.manage_all",
    "reviews.moderate",
    "support.manage",
    "settings.manage",
    "audit.view",
    "security.view",
    "reports.export",
    "reports.create",
    "media.manage",
    "chat.manage_all",
    "healthcare.manage_all",
    "queue.monitor_all",
];

const policies: Record<UserRole, readonly Permission[]> = {
  // Admins inherit all owner and customer actions in addition to global
  // controls. Resource-level ownership checks still apply inside each route.
  admin: [...adminPermissions, ...storeOwnerPermissions, ...customerPermissions],
  store_owner: storeOwnerPermissions,
  customer: customerPermissions,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  store_owner: "Shop owner",
  customer: "Customer",
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return policies[role];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return policies[role].includes(permission);
}
