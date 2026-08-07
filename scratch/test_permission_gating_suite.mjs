import { requireFeaturePermission, checkUserFeaturePermission, getFeatureMetadata } from "../lib/subscriptions.js";
import { PaymentRequiredError, apiError } from "../lib/security.js";
import assert from "node:assert/strict";

console.log("=== KYNISTO 402 FEATURE PERMISSION GATING TEST SUITE ===");

// 1. Verify PaymentRequiredError structure
const metadata = getFeatureMetadata("analytics", "store_owner");
const err = new PaymentRequiredError("analytics", metadata.featureName, metadata.availablePlans);
assert.equal(err.status, 402);
assert.equal(err.code, "PAYMENT_REQUIRED");
assert.equal(err.requiredFeature, "analytics");
assert.equal(err.featureName, "Analytics Pro");
assert.ok(Array.isArray(err.availablePlans));
assert.ok(err.availablePlans.length > 0);

// 2. Verify apiError formatting for PaymentRequiredError
const response = apiError(err);
assert.equal(response.status, 402);
const payload = await response.json();
console.log("HTTP 402 Sample JSON Payload:", JSON.stringify(payload, null, 2));

assert.equal(payload.error, "Payment Required");
assert.equal(payload.requiredFeature, "analytics");
assert.equal(payload.featureName, "Analytics Pro");
assert.ok(Array.isArray(payload.availablePlans));
assert.ok(payload.availablePlans.length >= 1);

// 3. Verify Metadata for all 6 target routes
const routesToTest = [
  { path: "/api/owner/analytics", featureKey: "analytics", role: "store_owner", expectedName: "Analytics Pro" },
  { path: "/api/owner/catalog", featureKey: "catalog", role: "store_owner", expectedName: "Catalog & Inventory Management" },
  { path: "/api/owner/healthcare", featureKey: "healthcare", role: "store_owner", expectedName: "Healthcare Live Queue Management" },
  { path: "/api/owner/memberships", featureKey: "memberships", role: "store_owner", expectedName: "Membership & Loyalty Management" },
  { path: "/api/healthcare/queue", featureKey: "queue", role: "customer", expectedName: "Live Queue Access" },
  { path: "/api/chat", featureKey: "chat", role: "customer", expectedName: "Chat & Messaging" },
];

for (const route of routesToTest) {
  const meta = getFeatureMetadata(route.featureKey, route.role);
  assert.equal(meta.featureName, route.expectedName, `Feature name match for ${route.path}`);
  assert.ok(meta.availablePlans.length > 0, `Has available upgrade plans for ${route.path}`);
  console.log(`✓ ${route.path} => Feature: '${meta.featureKey}' ('${meta.featureName}'), Upgrade Plans: ${meta.availablePlans.map(p => p.name).join(", ")}`);
}

console.log("✓ ALL PERMISSION GATING ASSERTIONS PASSED SUCCESSFULLY!");
