import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { USER_ROLES } from "../lib/rbac.ts";

const root = new URL("../", import.meta.url);

test("RBAC invariants strictly preserve 3 user roles while supporting ownerType", async () => {
  // USER_ROLES must remain exactly ["admin", "store_owner", "customer"]
  assert.deepEqual([...USER_ROLES], ["admin", "store_owner", "customer"]);

  // auth source inspection
  const authSource = await readFile(new URL("lib/auth.ts", root), "utf8");
  assert.match(authSource, /ownerType\?: "shop" \| "healthcare"/);
  assert.match(authSource, /export function dashboardForRole\(role:\s*UserRole,\s*ownerType\?:/);
  assert.match(authSource, /ownerType === "healthcare" \|\| \(role as string\) === "healthcare_owner"/);
  assert.match(authSource, /return "\/healthcare\/dashboard"/);
  assert.match(authSource, /resolveOwnerType/);
});

test("GoogleRoleOnboarding provides 2 first-tier choices (customer, shop owner) and nested healthcare owner", async () => {
  const file = await readFile(new URL("components/auth/GoogleRoleOnboarding.tsx", root), "utf8");

  // Type definitions
  assert.match(file, /"healthcare_owner"/);
  assert.match(file, /ownerExpanded/);

  // First-tier: customer and shop owner
  assert.match(file, /Customer/);
  assert.match(file, /Shop Owner/);

  // Nested selection options
  assert.match(file, /Healthcare Owner/);
  assert.match(file, /Hospitals, Clinics, Doctors/);
  assert.match(file, /Retail Stores, Salons, Supermarkets/);
  assert.match(file, /← Back/);

  // Redirection logic
  assert.match(file, /\/healthcare\/dashboard/);
});

test("Onboarding role API provisions healthcare owner with clinic store and trial", async () => {
  const file = await readFile(new URL("app/api/auth/onboarding/role/route.ts", root), "utf8");

  // Accepts healthcare_owner
  assert.match(file, /"healthcare_owner"/);
  assert.match(file, /isHealthcare\s*=\s*inputRole === "healthcare_owner"/);

  // Sets owner_type
  assert.match(file, /ownerType:\s*"shop" \| "healthcare"/);
  assert.match(file, /owner_type\s*=\s*\?/);

  // Grants 30-day Enterprise trial
  assert.match(file, /30 \* 86400/);
  assert.match(file, /'enterprise'/);

  // Provisions verified clinic store with queue enabled
  assert.match(file, /Healthcare Clinic/);
  assert.match(file, /redirectTo\s*=\s*isHealthcare\s*\?\s*"\/healthcare\/dashboard"/);
});

test("PortalShell renders 'Live Queue' for store_owner and unified Tools suite for healthcare_owner", async () => {
  const file = await readFile(new URL("components/dashboard/PortalShell.tsx", root), "utf8");

  // In store_owner nav: changed from Healthcare to Live Queue
  assert.match(file, /\{ label: "Live Queue", icon: Activity, tab: "queue" \}/);

  // Dedicated healthcareOwnerNav with unified Tools suite
  assert.match(file, /healthcareOwnerNav/);
  assert.match(file, /Clinic Overview/);
  assert.match(file, /Tools/);

  // Active workspace role resolution
  assert.match(file, /user\?\.ownerType === "healthcare"\s*\?\s*"healthcare_owner"/);
});

test("OwnerDashboard updates tab title and passes isShopOwnerMode={true} to OwnerHealthcarePanel", async () => {
  const file = await readFile(new URL("components/dashboard/OwnerDashboard.tsx", root), "utf8");

  // Title changed from Healthcare to Live Queue
  assert.match(file, /\(tab === "healthcare" \|\| tab === "queue"\) \? "Live Queue"/);

  // Passes isShopOwnerMode={true}
  assert.match(file, /<OwnerHealthcarePanel storeId=\{String\(selected\.id\)\} isShopOwnerMode=\{true\} \/>/);
});

test("OwnerHealthcarePanel excludes prescriptions, doctors, and appointments in shop owner mode", async () => {
  const file = await readFile(new URL("components/dashboard/OwnerHealthcarePanel.tsx", root), "utf8");

  // Accepts isShopOwnerMode prop
  assert.match(file, /isShopOwnerMode\s*=\s*false/);

  // In shop owner mode: title is Live Queue
  assert.match(file, /\{isShopOwnerMode \? <h1>Live Queue<\/h1> : <h1>Healthcare<\/h1>\}/);

  // Prescriptions excluded in shop owner mode
  assert.match(file, /\{!isShopOwnerMode && \(\s*<div className="mt-2 p-3 bg-slate-50/);
  assert.match(file, /\{!isShopOwnerMode && \(\s*<button[^>]*>[\s\S]*?℞ Prescribe & Complete/);

  // Doctors and appointments tabs excluded in shop owner mode
  assert.match(file, /\{!isShopOwnerMode && \(\s*<>[\s\S]*?Prescription History[\s\S]*?Appointments[\s\S]*?Doctors/);

  // Appointments settings excluded in shop owner mode
  assert.match(file, /\{!isShopOwnerMode && \(\s*<label>[\s\S]*?Allow appointments/);

  // Adapted labels for shop owner
  assert.match(file, /isShopOwnerMode \? "Service time" : "Consultation/);
  assert.match(file, /isShopOwnerMode \? "▶ Start Service" : "▶ Start Consult"/);
});

test("HealthcareOwnerDashboard provides exclusive OPD revenue, vitals logger, and triage alert", async () => {
  const [dashboard, page, layout] = await Promise.all([
    readFile(new URL("components/dashboard/HealthcareOwnerDashboard.tsx", root), "utf8"),
    readFile(new URL("app/healthcare/dashboard/page.tsx", root), "utf8"),
    readFile(new URL("app/healthcare/dashboard/layout.tsx", root), "utf8"),
  ]);

  // Page and layout setup
  assert.match(layout, /workspaceRole="healthcare_owner"/);
  assert.match(page, /HealthcareOwnerDashboard/);

  // Exclusive features in HealthcareOwnerDashboard
  assert.match(dashboard, /Healthcare Specialist Portal/);
  assert.match(dashboard, /emergencyTriage/);
  assert.match(dashboard, /Emergency Triage Active/);
  assert.match(dashboard, /opdRevenue/);
  assert.match(dashboard, /Today's OPD Revenue|Today&apos;s OPD Revenue/);
  assert.match(dashboard, /Clinical Tools & Vitals Logger/);
  assert.match(dashboard, /computedBmi/);
  assert.match(dashboard, /SPECIALTY_PRESETS/);

  // Renders OwnerHealthcarePanel in full healthcare mode
  assert.match(dashboard, /isShopOwnerMode=\{false\}/);
  assert.match(dashboard, /isHealthcareDashboard=\{true\}/);

  // Invariant compliance: No overflow-x: hidden on root container, uses overflow-x: clip
  assert.doesNotMatch(dashboard, /overflowX:\s*"hidden"/);
  assert.match(dashboard, /overflowX:\s*"clip"/);
});

test("Mutual role isolation and direct dashboard routing for healthcare vs shop owner", async () => {
  const [healthcarePage, ownerPage, googleSession, switchRole, portalShell, accessDenied] = await Promise.all([
    readFile(new URL("app/healthcare/dashboard/page.tsx", root), "utf8"),
    readFile(new URL("app/owner/page.tsx", root), "utf8"),
    readFile(new URL("app/api/auth/google/session/route.ts", root), "utf8"),
    readFile(new URL("app/api/auth/switch-role/route.ts", root), "utf8"),
    readFile(new URL("components/dashboard/PortalShell.tsx", root), "utf8"),
    readFile(new URL("app/(auth)/access-denied/page.tsx", root), "utf8"),
  ]);

  // Healthcare page isolates against non-healthcare store owners
  assert.match(healthcarePage, /user\.ownerType !== "healthcare" && user\.role !== "admin"/);
  assert.match(healthcarePage, /redirect\("\/owner"\)/);

  // Owner page isolates against healthcare store owners
  assert.match(ownerPage, /user\.ownerType === "healthcare" && user\.role !== "admin"/);
  assert.match(ownerPage, /redirect\("\/healthcare\/dashboard"\)/);

  // Google session returns direct healthcare dashboard route
  assert.match(googleSession, /resolveOwnerType/);
  assert.match(googleSession, /dashboardForRole\(identity\.role,\s*ownerType\)/);

  // Switch role returns direct healthcare dashboard route
  assert.match(switchRole, /resolveOwnerType/);
  assert.match(switchRole, /ownerType === "healthcare"\s*\?\s*"\/healthcare\/dashboard"\s*:\s*"\/owner"/);

  // PortalShell displays Healthcare Clinic badge
  assert.match(portalShell, /activeWorkspaceRole === "healthcare_owner"\s*\?\s*`\$\{user\?\.role === "admin" \? "Admin · " : ""\}Healthcare Clinic`/);

  // Access denied passes ownerType
  assert.match(accessDenied, /dashboardForRole\(session\.user\.role,\s*session\.user\.ownerType\)/);
});

test("Shop owner dashboard and live queue completely exclude healthcare pollution and clinic setup", async () => {
  const [ownerDash, ownerPanel] = await Promise.all([
    readFile(new URL("components/dashboard/OwnerDashboard.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/OwnerHealthcarePanel.tsx", root), "utf8"),
  ]);

  // Shop owner 1-click setup does not create clinic or use healthcare categories
  assert.match(ownerDash, /handleQuickSetupStore/);
  assert.match(ownerDash, /⚡ 1-Click Quick Setup Store/);
  assert.match(ownerDash, /Set up your retail shop to unlock Live Queue, Products, Orders, and Services/);
  assert.doesNotMatch(ownerDash, /⚡ 1-Click Quick Setup Clinic & Store/);

  // Defensive clamping of activeTab when isShopOwnerMode is true
  assert.match(ownerPanel, /isShopOwnerMode\s*\?\s*"queue"/);
  assert.match(ownerPanel, /setActiveTab\(\(curr\) => \(curr === "settings" \? "settings" : "queue"\)\)/);

  // Settings in shop owner mode use customer terminology
  assert.match(ownerPanel, /isShopOwnerMode \? "Accepting customers" : "Accepting patients"/);
  assert.match(ownerPanel, /isShopOwnerMode \? "Minutes a no-show customer is held before removal" : "Minutes a no-show patient is held before removal"/);
  assert.match(ownerPanel, /isShopOwnerMode \? "Includes online and walk-in customers" : "Includes online and walk-in patients"/);

  // Tab guards prevent clinical tabs in shop owner mode
  assert.match(ownerPanel, /activeTab === "appointments" && !isShopOwnerMode/);
  assert.match(ownerPanel, /activeTab === "doctors" && !isShopOwnerMode/);
  assert.match(ownerPanel, /activeTab === "patients" && !isShopOwnerMode/);
  assert.match(ownerPanel, /activeTab === "prescriptions" && !isShopOwnerMode/);
  assert.match(ownerPanel, /activeTab === "designer" && !isShopOwnerMode/);
  assert.match(ownerPanel, /prescriptionModal\.open && !isShopOwnerMode/);
});
