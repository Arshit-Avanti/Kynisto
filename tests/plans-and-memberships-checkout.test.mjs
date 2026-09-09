import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("CustomerPlanUI uses Kynisto Light Mode and embeds UpiCheckoutModal directly", () => {
  const filePath = path.resolve("components/subscription/CustomerPlanUI.tsx");
  assert.ok(fs.existsSync(filePath), "CustomerPlanUI.tsx must exist");

  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes('"use client"'), "Must be client component");
  assert.ok(content.includes("UpiCheckoutModal"), "Must import UpiCheckoutModal");
  assert.ok(content.includes("<UpiCheckoutModal"), "Must render UpiCheckoutModal");

  // Light Mode verification
  assert.ok(content.includes("text-slate-900"), "Must use high-contrast dark text for light mode");
  assert.ok(content.includes("bg-white"), "Must use clean white card backgrounds");
  assert.ok(!content.includes("bg-slate-950/80"), "Old dark modal background must be removed");

  // Invariant: overflow-x: clip per GEMINI.md
  assert.ok(content.includes("overflow-x-clip"), "Must enforce overflow-x: clip per GEMINI.md");
  assert.ok(!content.includes("overflow-x: hidden"), "Must NEVER use overflow-x: hidden");

  // Direct checkout action
  assert.ok(content.includes("handleOpenCheckout"), "Must provide handleOpenCheckout");
  assert.ok(content.includes("handlePaymentSuccess"), "Must handle payment completion");
  assert.ok(content.includes("/api/subscriptions/subscribe"), "Must record subscription request");
});

test("StoreMembershipsBrowser renders shop owner passes in Kynisto Light Mode", () => {
  const filePath = path.resolve("components/store/StoreMembershipsBrowser.tsx");
  assert.ok(fs.existsSync(filePath), "StoreMembershipsBrowser.tsx must exist");

  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes('"use client"'), "Must be client component");
  assert.ok(content.includes("StoreMembershipsBrowser"), "Must export StoreMembershipsBrowser");
  assert.ok(content.includes("UpiCheckoutModal"), "Must import and embed UpiCheckoutModal");
  assert.ok(content.includes("/api/memberships"), "Must fetch store membership catalog");
  assert.ok(content.includes("/api/memberships/purchase"), "Must call purchase API upon checkout");

  // Styling & Invariants
  assert.ok(content.includes("text-slate-900"), "Must be light mode text-slate-900");
  assert.ok(content.includes("overflow-x-clip"), "Must enforce overflow-x: clip");
  assert.ok(!content.includes("overflow-x: hidden"), "Must never use overflow-x: hidden");
  assert.ok(
    content.includes("DON'T PANIC") || content.includes("DON&apos;T PANIC"),
    "Must include friendly reassurance banner for customer"
  );
});

test("StoreMembershipStorefront uses unified UpiCheckoutModal for store-level checkout", () => {
  const filePath = path.resolve("components/store/StoreMembershipStorefront.tsx");
  assert.ok(fs.existsSync(filePath), "StoreMembershipStorefront.tsx must exist");

  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("UpiCheckoutModal"), "Must import and use UpiCheckoutModal");
  assert.ok(content.includes("<UpiCheckoutModal"), "Must render UpiCheckoutModal component");
  assert.ok(content.includes("handleConfirmSubmitPayment"), "Must handle checkout success");
  assert.ok(content.includes("/api/memberships/purchase"), "Must submit to purchase endpoint");
  assert.ok(content.includes("overflow-x-clip"), "Must enforce overflow-x: clip");
});

test("PricingPage provides 3-tier tabs: Kynisto VIP, Local Store Passes, and Merchant Platform", () => {
  const filePath = path.resolve("app/pricing/page.tsx");
  assert.ok(fs.existsSync(filePath), "Pricing page must exist");

  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("CustomerPlanUI"), "Must render CustomerPlanUI");
  assert.ok(content.includes("StoreMembershipsBrowser"), "Must render StoreMembershipsBrowser");
  assert.ok(content.includes("BusinessMarketplaceUI"), "Must render BusinessMarketplaceUI");

  // Tab values
  assert.ok(content.includes('"customer"'), "Must support customer tab");
  assert.ok(content.includes('"store_memberships"'), "Must support store_memberships tab");
  assert.ok(content.includes('"business"'), "Must support business tab");

  // Light Mode
  assert.ok(content.includes("bg-slate-50"), "Must use clean bg-slate-50");
  assert.ok(content.includes("text-slate-900"), "Must use text-slate-900");
  assert.ok(content.includes("overflow-x-clip"), "Must enforce overflow-x: clip");
});

test("Memberships API supports general catalog across stores without requiring storeId", () => {
  const filePath = path.resolve("app/api/memberships/route.ts");
  assert.ok(fs.existsSync(filePath), "app/api/memberships/route.ts must exist");

  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("searchParams.get(\"storeId\")"), "Reads storeId param");
  assert.ok(
    content.includes("store_membership_plans"),
    "Queries store_membership_plans table"
  );
  assert.ok(
    content.includes("Metro Supermarket & Daily Mart") || content.includes("dbPlans"),
    "Provides verified catalog response"
  );
});

test("HomePlansAndMembershipsSection is unmounted from homepage to keep hero and landing clean", () => {
  const compPath = path.resolve("components/landing/HomePlansAndMembershipsSection.tsx");
  assert.ok(fs.existsSync(compPath), "HomePlansAndMembershipsSection.tsx must exist as a modular component");

  const compContent = fs.readFileSync(compPath, "utf-8");
  assert.ok(compContent.includes("UpiCheckoutModal"), "Must embed UpiCheckoutModal");
  assert.ok(compContent.includes("Kynisto VIP Pass"), "Must showcase Kynisto VIP Pass");
  assert.ok(compContent.includes("Pay with UPI · ₹49"), "Must offer instant UPI VIP checkout");
  assert.ok(compContent.includes("Join VIP Club"), "Must offer shop owner pass checkout");

  const pagePath = path.resolve("app/page.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert.ok(
    !pageContent.includes("<HomePlansAndMembershipsSection"),
    "app/page.tsx must NOT render HomePlansAndMembershipsSection per user design request"
  );
});

test("Homepage hero features clean action pills without clutter", () => {
  const heroPath = path.resolve("components/dashboard/CredixInteractiveHeroFeatures.tsx");
  const heroContent = fs.readFileSync(heroPath, "utf-8");
  assert.ok(heroContent.includes("Live OPD Queues"), "Hero must keep Live OPD Queues");
  assert.ok(heroContent.includes("Home Services"), "Hero must keep Home Services");
  assert.ok(heroContent.includes("Local Stores"), "Hero must keep Local Stores");
  assert.ok(!heroContent.includes("VIP Plans & Store Passes"), "Hero must not render VIP pill per user request");

  const navPath = path.resolve("components/landing/Navbar3D.tsx");
  const navContent = fs.readFileSync(navPath, "utf-8");
  assert.ok(navContent.includes('href="/pricing"'), "Navbar must still provide pricing navigation");
});

test("Wallet and CustomerDashboard provide seamless Store VIP Passes browsing", () => {
  const walletPath = path.resolve("components/wallet/KynistoWalletView.tsx");
  const walletContent = fs.readFileSync(walletPath, "utf-8");
  assert.ok(walletContent.includes("/pricing?tab=store_memberships"), "Wallet must link to Store VIP passes");
  assert.ok(walletContent.includes("Browse Store VIP Passes"), "Wallet must render CTA button");

  const custDashPath = path.resolve("components/dashboard/CustomerDashboard.tsx");
  const custDashContent = fs.readFileSync(custDashPath, "utf-8");
  assert.ok(custDashContent.includes("CustomerSubscriptionTab"), "Must use CustomerSubscriptionTab");
  assert.ok(custDashContent.includes("StoreMembershipsBrowser"), "Must support StoreMembershipsBrowser");
});

