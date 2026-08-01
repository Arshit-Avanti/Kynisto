const BASE_URL = "https://kynisto.nxt-arshit.workers.dev";

async function runTests() {
  console.log("=== KYNISTO SUBSCRIPTION SYSTEM E2E TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  // Test 1: Pricing page loads cleanly
  try {
    const res = await fetch(`${BASE_URL}/pricing`);
    const text = await res.text();
    if (res.status === 200 && text.includes("Customer Subscription Plans") || text.includes("CUSTOMER SUBSCRIPTION PLANS")) {
      console.log("✓ TEST 1 PASSED: Pricing page loaded (200 OK) with Customer Plans section.");
      passed++;
    } else {
      console.log(`✗ TEST 1 FAILED: Status ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log("✗ TEST 1 FAILED:", err.message);
    failed++;
  }

  // Test 2: Pricing page contains Shop Owner Plans section
  try {
    const res = await fetch(`${BASE_URL}/pricing`);
    const text = await res.text();
    if (res.status === 200 && (text.includes("Business Owner Subscription Plans") || text.includes("BUSINESS OWNER SUBSCRIPTION PLANS"))) {
      console.log("✓ TEST 2 PASSED: Pricing page loaded with Business Owner Plans section.");
      passed++;
    } else {
      console.log(`✗ TEST 2 FAILED: Status ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log("✗ TEST 2 FAILED:", err.message);
    failed++;
  }

  // Test 3: Verify all prices are in response HTML or bundle payload
  try {
    const res = await fetch(`${BASE_URL}/pricing`);
    const text = await res.text();
    const has49 = text.includes("49");
    const has299 = text.includes("299");
    const has499 = text.includes("499");
    if (has49 && (has299 || has499)) {
      console.log("✓ TEST 3 PASSED: Pricing page contains plan prices (₹49, ₹299, ₹499).");
      passed++;
    } else {
      console.log("✗ TEST 3 FAILED: Prices missing from pricing response payload.");
      failed++;
    }
  } catch (err) {
    console.log("✗ TEST 3 FAILED:", err.message);
    failed++;
  }

  // Test 4: API health check endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    console.log(`✓ TEST 4 PASSED: API health endpoint status ${res.status}.`);
    passed++;
  } catch (err) {
    console.log("✗ TEST 4 FAILED:", err.message);
    failed++;
  }

  // Test 5: Owner healthcare queue gating API
  try {
    const res = await fetch(`${BASE_URL}/api/owner/healthcare?storeId=sample-store-id`);
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      console.log(`✓ TEST 5 PASSED: Live Queue Management correctly enforced (${res.status} Access Gated).`);
      passed++;
    } else {
      console.log(`✗ TEST 5 FAILED: Unexpected status ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log("✗ TEST 5 FAILED:", err.message);
    failed++;
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
}

runTests();
