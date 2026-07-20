import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("builds the Kynisto discovery experience and social asset", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    access(new URL("dist/server/index.js", root)),
    access(new URL("dist/client/og.svg", root)),
  ]);
  assert.match(page, /Kynisto/);
  assert.match(page, /Everything Around You, Smarter\./);
  assert.match(page, /DLF Ankur Vihar/);
  assert.match(layout, /generateMetadata/);
  assert.match(layout, /Kynisto – Everything Around You, Smarter\./);
  assert.doesNotMatch(page, /Your site is taking shape|Codex is working/);
});

test("ships relational data, secure auth and role boundaries", async () => {
  const [schema, bootstrap, seed, auth, crypto, adminLayout, ownerLayout, customerLayout, hosting] = await Promise.all([
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("db/bootstrap.ts", root), "utf8"),
    readFile(new URL("db/seed.ts", root), "utf8"),
    readFile(new URL("lib/auth.ts", root), "utf8"),
    readFile(new URL("lib/crypto.ts", root), "utf8"),
    readFile(new URL("app/admin/layout.tsx", root), "utf8"),
    readFile(new URL("app/owner/layout.tsx", root), "utf8"),
    readFile(new URL("app/account/layout.tsx", root), "utf8"),
    readFile(new URL(".openai/hosting.json", root), "utf8"),
  ]);
  assert.match(schema, /sqliteTable\(\s*"users"/);
  assert.match(schema, /sqliteTable\(\s*"stores"/);
  assert.match(schema, /sqliteTable\(\s*"reviews"/);
  assert.match(bootstrap, /ensureDatabaseReady/);
  assert.match(bootstrap, /CREATE TABLE IF NOT EXISTS/);
  assert.match(seed, /index < 100/);
  assert.match(seed, /categorySeeds/);
  assert.match(seed, /if \(!existingAdmin\)/);
  assert.match(crypto, /PBKDF2/);
  assert.match(crypto, /100_000/);
  assert.match(auth, /sameSite:\s*"strict"/);
  assert.match(auth, /httpOnly:\s*true/);
  assert.match(adminLayout, /requirePageRole\(\["admin"\]/);
  assert.match(ownerLayout, /requirePageRole\(\["store_owner"\]/);
  assert.match(customerLayout, /requirePageRole\(\["customer"\]/);
  assert.match(hosting, /"d1":\s*"DB"/);
  assert.match(hosting, /"r2":\s*"MEDIA"/);
});

test("ships production health checks, discovery controls and complete management actions", async () => {
  const [page, health, adminStores, adminUsers, ownerDashboard] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/api/health/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/stores/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/users/route.ts", root), "utf8"),
    readFile(new URL("components/dashboard/OwnerDashboard.tsx", root), "utf8"),
  ]);
  assert.match(page, /navigator\.geolocation/);
  assert.match(page, /areaFilter/);
  assert.match(page, /pinFilter/);
  assert.match(page, /loadMore/);
  assert.match(page, /mode-\$\{themeMode\}/);
  assert.match(health, /ensureSeeded/);
  assert.match(health, /stores:/);
  assert.match(adminStores, /action === "update"/);
  assert.match(adminStores, /action === "assign"/);
  assert.match(adminUsers, /export async function DELETE/);
  assert.match(ownerDashboard, /OwnerStoreEditor/);
});

test("allows administrators to use owner and customer capabilities, including live queue access", async () => {
  const [rbac, auth, accountLayout, ownerLayout, portal, healthcare, patientQueue, storeActions, chat] = await Promise.all([
    readFile(new URL("lib/rbac.ts", root), "utf8"),
    readFile(new URL("lib/auth.ts", root), "utf8"),
    readFile(new URL("app/account/layout.tsx", root), "utf8"),
    readFile(new URL("app/owner/layout.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/PortalShell.tsx", root), "utf8"),
    readFile(new URL("components/healthcare/HealthcareDiscovery.tsx", root), "utf8"),
    readFile(new URL("app/api/healthcare/queue/route.ts", root), "utf8"),
    readFile(new URL("components/store/StoreActions.tsx", root), "utf8"),
    readFile(new URL("app/api/chat/route.ts", root), "utf8"),
  ]);
  assert.match(rbac, /admin: \[\.\.\.adminPermissions, \.\.\.storeOwnerPermissions, \.\.\.customerPermissions\]/);
  assert.match(rbac, /"queue\.join"/);
  assert.match(auth, /session\.user\.role !== "admin" && !allowedRoles\.includes/);
  assert.match(accountLayout, /workspaceRole="customer"/);
  assert.match(ownerLayout, /workspaceRole="store_owner"/);
  assert.match(portal, /Shop owner tools/);
  assert.match(portal, /Customer tools/);
  assert.match(healthcare, /role === "customer" \|\| role === "admin"/);
  assert.match(patientQueue, /requireApiPermission\(request, "queue\.join"/);
  assert.match(storeActions, /canUseCustomerFeatures/);
  assert.match(chat, /session\.user\.role !== "customer" && session\.user\.role !== "admin"/);
});

test("publishes SEO discovery endpoints and structured local business data", async () => {
  const [layout, profile, robots, sitemap] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/stores/[slug]/page.tsx", root), "utf8"),
    readFile(new URL("app/robots.txt/route.ts", root), "utf8"),
    readFile(new URL("app/sitemap.xml/route.ts", root), "utf8"),
  ]);
  assert.match(layout, /openGraph/);
  assert.match(layout, /summary_large_image/);
  assert.match(profile, /LocalBusiness/);
  assert.match(profile, /AggregateRating/);
  assert.match(robots, /Sitemap/);
  assert.match(sitemap, /sitemaps\.org\/schemas\/sitemap/);
});

test("ships participant-scoped real-time chat and the admin chat center", async () => {
  const [schema, policy, chat, stream, center, support] = await Promise.all([
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("lib/chat.ts", root), "utf8"),
    readFile(new URL("app/api/chat/route.ts", root), "utf8"),
    readFile(new URL("app/api/chat/stream/route.ts", root), "utf8"),
    readFile(new URL("components/dashboard/ChatCenter.tsx", root), "utf8"),
    readFile(new URL("app/api/customer/workspace/route.ts", root), "utf8"),
  ]);
  assert.match(schema, /"conversation_participants"/);
  assert.match(schema, /"messages"/);
  assert.match(schema, /"conversation_blocks"/);
  assert.match(policy, /ACCESS_DENIED/);
  assert.match(policy, /row\.ownerId === user\.id/);
  assert.match(chat, /action === "start_store"/);
  assert.match(chat, /action === "start_admin"/);
  assert.match(chat, /action === "report"/);
  assert.match(stream, /text\/event-stream/);
  assert.match(center, /Admin Chat Center/);
  assert.match(center, /mark_read/);
  assert.match(support, /kind, store_id, support_ticket_id/);
});

test("ships the independent healthcare module and production live queues", async () => {
  const [schema, seed, discovery, patientQueue, ownerQueue, adminQueue, queueManagement, healthcare, adminPanel, ownerPanel, page, manageStream, migration, sitemap, queueStyles, portalCommerce] = await Promise.all([
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("db/seed.ts", root), "utf8"),
    readFile(new URL("app/api/healthcare/route.ts", root), "utf8"),
    readFile(new URL("app/api/healthcare/queue/route.ts", root), "utf8"),
    readFile(new URL("app/api/owner/healthcare/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/healthcare/route.ts", root), "utf8"),
    readFile(new URL("lib/healthcare-queue-management.ts", root), "utf8"),
    readFile(new URL("lib/healthcare.ts", root), "utf8"),
    readFile(new URL("components/dashboard/AdminHealthcarePanel.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/OwnerHealthcarePanel.tsx", root), "utf8"),
    readFile(new URL("components/healthcare/HealthcareDiscovery.tsx", root), "utf8"),
    readFile(new URL("app/api/healthcare/queue/manage-stream/route.ts", root), "utf8"),
    readFile(new URL("drizzle/0005_loving_absorbing_man.sql", root), "utf8"),
    readFile(new URL("app/sitemap.xml/route.ts", root), "utf8"),
    readFile(new URL("app/healthcare/healthcare-queue-badge.css", root), "utf8"),
    readFile(new URL("app/portal-commerce.css", root), "utf8"),
  ]);
  assert.match(schema, /enum: \["local", "healthcare"\]/);
  assert.match(schema, /"healthcare_queue_entries"/);
  assert.match(schema, /healthcare_queue_active_unique/);
  assert.match(schema, /expiresAt: integer\("expires_at"\)/);
  assert.match(seed, /HEALTHCARE_CATEGORY_INDEXES/);
  assert.match(discovery, /c\.module = 'healthcare'/);
  assert.match(patientQueue, /"queue\.join"/);
  assert.match(ownerQueue, /"queue\.manage_own"/);
  assert.match(ownerQueue, /operateHealthcareQueue/);
  assert.match(adminQueue, /"healthcare\.manage_all"/);
  assert.match(adminQueue, /action === "setup_queue"/);
  assert.match(adminQueue, /action === "queue_action"/);
  assert.match(adminQueue, /action === "configure_queue"/);
  assert.match(adminQueue, /decision === "delete"/);
  assert.match(queueManagement, /action === "call_next"/);
  assert.match(queueManagement, /action === "add_walk_in"/);
  assert.match(queueManagement, /action === "remove"/);
  assert.match(queueManagement, /action === "reset"/);
  assert.match(healthcare, /QUEUE_ENTRY_TTL_SECONDS = 3 \* 60 \* 60/);
  assert.match(healthcare, /event_type, metadata, created_at/);
  assert.doesNotMatch(healthcare, /settings\.status === "open" && withinOperatingHours && capacityAvailable/);
  assert.match(patientQueue, /customer:\$\{session\.user\.id\}/);
  assert.match(patientQueue, /hp\.accepting_patients = 1/);
  assert.match(patientQueue, /You are already in an active healthcare queue/);
  assert.match(migration, /expires_at/);
  assert.match(adminPanel, /Healthcare Queue Management/);
  assert.match(adminPanel, /Call next/);
  assert.match(adminPanel, /BulkDeleteBar/);
  assert.match(ownerPanel, /Add Walk-in|add_walk_in/);
  assert.match(manageStream, /text\/event-stream/);
  assert.match(page, /Live Queue/);
  assert.match(page, /Join Live Queue/);
  assert.match(page, /queueBusy === "join" \? "Joining…"/);
  assert.match(page, /max \$\{provider\.maximumDailyPatients/);
  assert.match(page, /queueArrivalReminder/);
  assert.match(queueStyles, /queueDockEnter/);
  assert.match(queueStyles, /queueDockLoader/);
  assert.match(portalCommerce, /input:not\(\[type="checkbox"\]\)/);
  assert.match(portalCommerce, /font-size:16px/);
  assert.match(sitemap, /healthcare/);
});

test("ships reusable admin multi-select deletion for every requested management resource", async () => {
  const [selection, tables, dashboard, workspace, users, categories, reviews, reports, stores, products, healthcare] = await Promise.all([
    readFile(new URL("components/dashboard/AdminBulkSelection.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/AdminTables.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/AdminDashboard.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/AdminWorkspacePanel.tsx", root), "utf8"),
    readFile(new URL("app/api/admin/users/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/categories/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/reviews/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/reports/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/stores/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/workspace/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/healthcare/route.ts", root), "utf8"),
  ]);
  assert.match(selection, /SelectAllCheckbox/);
  assert.match(selection, /Delete Selected/);
  assert.match(selection, /Deletion is permanent/);
  assert.match(selection, /if \(deleting \|\| count === 0\) return/);
  assert.match(tables, /UserManagementTable/);
  assert.match(tables, /BulkDeleteBar/);
  assert.match(dashboard, /action: "bulk_delete", reviews:/);
  assert.match(dashboard, /action: "bulk_delete", reportIds:/);
  assert.match(workspace, /bulk_delete_products/);
  assert.match(workspace, /bulk_delete_banners/);
  assert.match(workspace, /bulk_delete_coupons/);
  for (const route of [users, categories, reviews, reports, stores, products, healthcare]) {
    assert.match(route, /bulk_delete|bulkDelete|storeIds/);
    assert.match(route, /writeAudit/);
  }
});

test("uses Google-only customer and owner authentication at the login-first entry point", async () => {
  const [proxy, login, googleSignIn, adminLogin, register, forgot, confirm, reset] = await Promise.all([
    readFile(new URL("proxy.ts", root), "utf8"),
    readFile(new URL("app/(auth)/login/page.tsx", root), "utf8"),
    readFile(new URL("components/auth/GoogleSignIn.tsx", root), "utf8"),
    readFile(new URL("components/auth/AdminLoginForm.tsx", root), "utf8"),
    readFile(new URL("app/(auth)/register/page.tsx", root), "utf8"),
    readFile(new URL("app/(auth)/forgot-password/page.tsx", root), "utf8"),
    readFile(new URL("app/(auth)/auth/confirm/page.tsx", root), "utf8"),
    readFile(new URL("app/(auth)/reset-password/page.tsx", root), "utf8"),
  ]);
  assert.match(proxy, /pathname === "\/"/);
  assert.match(proxy, /\/login/);
  assert.match(proxy, /returnTo/);
  assert.match(login, /GoogleSignIn/);
  assert.match(login, /AdminLoginForm/);
  assert.match(googleSignIn, /signInWithOAuth/);
  assert.match(googleSignIn, /provider:\s*"google"/);
  assert.match(googleSignIn, /redirectTo/);
  assert.match(googleSignIn, /window\.location\.origin/);
  assert.match(googleSignIn, /skipBrowserRedirect:\s*false/);
  assert.match(googleSignIn, /Continue with Google/);
  assert.doesNotMatch(googleSignIn, /\/auth\/callback/);
  assert.match(adminLogin, /expectedRole:\s*"admin"/);
  for (const legacyPage of [register, forgot, confirm, reset]) {
    assert.match(legacyPage, /redirect\("\/login"\)/);
  }
});

test("uses Supabase profiles directly for Google completion while preserving protected admin credentials", async () => {
  const [login, layout, manager, googleSignIn, onboarding, provider, browser, identity, schema, auth, shell, proxy, envExample] =
    await Promise.all([
      readFile(new URL("app/api/auth/login/route.ts", root), "utf8"),
      readFile(new URL("app/layout.tsx", root), "utf8"),
      readFile(new URL("components/auth/SupabaseAuthManager.tsx", root), "utf8"),
      readFile(new URL("components/auth/GoogleSignIn.tsx", root), "utf8"),
      readFile(new URL("components/auth/GoogleRoleOnboarding.tsx", root), "utf8"),
      readFile(new URL("lib/supabase-auth.ts", root), "utf8"),
      readFile(new URL("lib/supabase-browser.ts", root), "utf8"),
      readFile(new URL("lib/supabase-identity.ts", root), "utf8"),
      readFile(new URL("db/schema.ts", root), "utf8"),
      readFile(new URL("lib/auth.ts", root), "utf8"),
      readFile(new URL("components/dashboard/PortalShell.tsx", root), "utf8"),
      readFile(new URL("proxy.ts", root), "utf8"),
      readFile(new URL(".env.example", root), "utf8"),
    ]);
  assert.match(login, /expectedRole !== "admin"/);
  assert.match(login, /GOOGLE_REQUIRED/);
  assert.match(login, /verifyPassword/);
  assert.match(login, /administrator path intentionally remains/);
  assert.match(layout, /SupabaseAuthManager/);
  assert.match(manager, /auth\.getSession\(\)/);
  assert.match(manager, /onAuthStateChange/);
  assert.match(manager, /"SIGNED_IN"/);
  assert.match(manager, /"INITIAL_SESSION"/);
  assert.match(manager, /"SIGNED_OUT"/);
  assert.match(manager, /"TOKEN_REFRESHED"/);
  assert.match(manager, /\.from\("profiles"\)/);
  assert.match(manager, /\.eq\("id", session\.user\.id\)/);
  assert.match(manager, /\.maybeSingle/);
  assert.match(manager, /completion\.current/);
  assert.match(manager, /finally/);
  assert.match(manager, /Profile query failed/);
  assert.match(manager, /Supabase session not found/);
  assert.match(manager, /Blocked cookies/);
  assert.match(manager, /verifyGoogleApplicationSession/);
  assert.match(manager, /Try again/);
  assert.match(manager, /Sign out/);
  assert.equal(
    [layout, manager, googleSignIn, onboarding, browser]
      .join("\n")
      .match(/onAuthStateChange/g)?.length,
    1,
  );
  assert.doesNotMatch(
    [manager, googleSignIn, onboarding, browser].join("\n"),
    /exchangeCodeForSession|setSession|CALLBACK_TIMEOUT_MS|ONBOARDING_TIMEOUT_MS|timed out after 10 seconds/,
  );
  assert.match(onboarding, /type SelectedRole = "customer" \| "shop_owner"/);
  assert.match(onboarding, /\.from\("profiles"\)\.upsert/);
  assert.match(onboarding, /id:\s*user\.id/);
  assert.match(onboarding, /email:\s*user\.email/);
  assert.match(onboarding, /full_name:/);
  assert.match(onboarding, /avatar_url:/);
  assert.match(onboarding, /verifyGoogleApplicationSession/);
  assert.match(onboarding, /onboarding_completed:\s*true/);
  assert.match(onboarding, /onConflict:\s*"id"/);
  assert.match(onboarding, /finally/);
  assert.match(provider, /SUPABASE_URL/);
  assert.match(provider, /SUPABASE_ANON_KEY/);
  assert.match(provider, /isGoogleSupabaseUser/);
  assert.match(provider, /applicationRoleFromProfile/);
  assert.match(browser, /persistSession:\s*true/);
  assert.match(browser, /autoRefreshToken:\s*true/);
  assert.match(browser, /detectSessionInUrl:\s*true/);
  assert.match(browser, /flowType:\s*"pkce"/);
  assert.match(browser, /auth\.signOut/);
  assert.match(browser, /"\/api\/auth\/me"/);
  assert.match(browser, /This Google account cannot open a Customer or Shop Owner workspace/);
  assert.match(identity, /provider = 'google'/);
  assert.match(identity, /Administrators must use the protected Admin login/);
  assert.match(identity, /avatar_url/);
  assert.match(identity, /ensureGoogleLocalIdentity/);
  assert.match(schema, /"external_auth_identities"/);
  assert.match(auth, /httpOnly:\s*true/);
  assert.match(auth, /sameSite:\s*"strict"/);
  assert.match(auth, /authentication:\s*"supabase"/);
  assert.match(auth, /Supabase session access denied/);
  assert.match(proxy, /SUPABASE_ACCESS_COOKIE/);
  assert.match(shell, /signOutSupabaseBrowser/);
  assert.match(envExample, /sb_publishable_replace_me/);
  await assert.rejects(
    access(new URL(["app/api/auth/google", "complete/route.ts"].join("/"), root)),
    /ENOENT/,
  );
  await assert.rejects(
    access(new URL(["app/api/auth/google", "onboarding/route.ts"].join("/"), root)),
    /ENOENT/,
  );
  await assert.rejects(
    access(new URL(["app", "(auth)", "auth", "callback", "page.tsx"].join("/"), root)),
    /ENOENT/,
  );
  assert.doesNotMatch(
    [login, layout, manager, googleSignIn, onboarding, provider, browser, identity, auth, shell, proxy, envExample].join("\n"),
    /sb_publishable_[A-Za-z0-9_-]{20,}/,
  );
});

test("keeps the authenticated discovery home inside narrow Android and mobile browser viewports", async () => {
  const [page, globalStyles, brandStyles] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("app/kynisto-brand.css", root), "utf8"),
  ]);
  assert.match(page, /className="mobileNav"/);
  assert.match(page, /Open Kynisto navigation/);
  assert.match(globalStyles, /overflow-x: clip/);
  assert.match(globalStyles, /-webkit-text-size-adjust: 100%/);
  assert.match(globalStyles, /\.headerActions > \.accountButton/);
  assert.match(globalStyles, /grid-template-columns: minmax\(0, 1fr\) auto/);
  assert.match(globalStyles, /\.heroCopy,\s*\.mapScene \{ width: 100%; max-width: 100%; min-width: 0; \}/);
  assert.match(globalStyles, /\.searchBox \{ width: 100%; max-width: 100%; min-width: 0; \}/);
  assert.match(brandStyles, /font-size: clamp\(48px, 16vw, 62px\)/);
});

test("ships reconnecting chat streams, direct admin chat, bulk administration, and immediate public store removal", async () => {
  const [chatCenter, chatApi, adminTables, adminWorkspace, storeApi, productApi, publicStores] = await Promise.all([
    readFile(new URL("components/dashboard/ChatCenter.tsx", root), "utf8"),
    readFile(new URL("app/api/chat/route.ts", root), "utf8"),
    readFile(new URL("components/dashboard/AdminTables.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/AdminWorkspacePanel.tsx", root), "utf8"),
    readFile(new URL("app/api/admin/stores/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/workspace/route.ts", root), "utf8"),
    readFile(new URL("app/api/stores/route.ts", root), "utf8"),
  ]);
  assert.doesNotMatch(chatCenter, /source\.onerror = \(\) => source\.close/);
  assert.match(chatApi, /New customer conversation/);
  assert.match(chatApi, /Kynisto support started a conversation/);
  assert.match(adminTables, />Chat</);
  assert.match(adminTables, /bulk_delete/);
  assert.match(adminWorkspace, /bulk_update_products/);
  assert.match(storeApi, /action === "bulk"/);
  assert.match(productApi, /bulkDeleteProducts/);
  assert.match(publicStores, /"Cache-Control": "no-store"/);
});

test("ships owner/admin product and service media with scoped R2 lifecycle management", async () => {
  const [media, catalogMedia, chatMedia, ownerCatalog, adminWorkspace, ownerDashboard, adminDashboard, control, profile] = await Promise.all([
    readFile(new URL("app/api/media/route.ts", root), "utf8"),
    readFile(new URL("app/api/catalog-media/route.ts", root), "utf8"),
    readFile(new URL("app/api/chat/media/route.ts", root), "utf8"),
    readFile(new URL("app/api/owner/catalog/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/workspace/route.ts", root), "utf8"),
    readFile(new URL("components/dashboard/OwnerDashboard.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/AdminWorkspacePanel.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/CatalogMediaControl.tsx", root), "utf8"),
    readFile(new URL("app/stores/[slug]/page.tsx", root), "utf8"),
  ]);
  assert.match(media, /requireApiPermission\(request, "media\.manage"/);
  assert.match(media, /media-upload:\$\{session\.user\.id\}/);
  assert.match(media, /isGenuineImage/);
  assert.match(media, /productForStore\(productId, storeId\)/);
  assert.match(media, /UPDATE products SET image_key = \?, image_url = \?/);
  assert.match(media, /kind, content_type, size_bytes/);
  assert.match(catalogMedia, /ownerTypeInput/);
  assert.match(catalogMedia, /mediaChecksum/);
  assert.match(catalogMedia, /DUPLICATE_MEDIA/);
  assert.match(catalogMedia, /action === "reorder"/);
  assert.match(catalogMedia, /action === "feature"/);
  assert.match(chatMedia, /requireConversationAccess/);
  assert.match(chatMedia, /New media message/);
  assert.match(ownerCatalog, /catalogMediaKeys/);
  assert.match(adminWorkspace, /media_assets WHERE product_id/);
  assert.match(ownerDashboard, /CatalogMediaControl/);
  assert.match(adminDashboard, /CatalogMediaControl/);
  assert.match(control, /capture="environment"/);
  assert.match(control, /Upload all/);
  assert.match(control, /Selected media deleted/);
  assert.match(profile, /productOfferCard/);
  assert.match(profile, /preload="none"/);
  assert.match(profile, /loading="lazy"/);
});

test("ships a signed-release-ready live Android shell, website download, and safe web update manager", async () => {
  const [activity, manifest, androidBuild, updateManager, serviceWorker, loginPage, worker] = await Promise.all([
    readFile(new URL("android/app/src/main/java/com/kynisto/app/MainActivity.java", root), "utf8"),
    readFile(new URL("android/app/src/main/AndroidManifest.xml", root), "utf8"),
    readFile(new URL("android/app/build.gradle", root), "utf8"),
    readFile(new URL("components/AppUpdateManager.tsx", root), "utf8"),
    readFile(new URL("app/sw.js/route.ts", root), "utf8"),
    readFile(new URL("app/(auth)/login/page.tsx", root), "utf8"),
    readFile(new URL("worker/index.ts", root), "utf8"),
    access(new URL("public/downloads/Kynisto-1.0.0-release.apk", root)),
  ]);
  assert.match(activity, /BuildConfig\.WEB_URL/);
  assert.match(activity, /Press back again to close Kynisto/);
  assert.match(activity, /onShowFileChooser/);
  assert.match(activity, /registerDefaultNetworkCallback/);
  assert.match(manifest, /usesCleartextTraffic="false"/);
  assert.match(manifest, /ACCESS_FINE_LOCATION/);
  assert.match(androidBuild, /minifyEnabled true/);
  assert.match(androidBuild, /KYNISTO_KEYSTORE_PATH/);
  assert.match(updateManager, /New version available/);
  assert.match(serviceWorker, /CLEAR_OLD_CACHES/);
  assert.match(loginPage, /Download APK/);
  assert.match(loginPage, /Kynisto-1\.0\.0-release\.apk/);
  assert.match(worker, /application\/vnd\.android\.package-archive/);
  assert.match(worker, /Content-Disposition/);
});
