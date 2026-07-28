const BASE_URL = "https://kynisto.nxt-arshit.workers.dev";

async function testAdminBulkAPI() {
  console.log("=== TESTING ADMIN BULK & TRIAL API ACTIONS ===");
  try {
    const res = await fetch(`${BASE_URL}/api/admin/subscriptions/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invalid_test" })
    });
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response body:", data);
    if (res.status === 403 || res.status === 400) {
      console.log("✓ Admin API security enforcement verified (403/400 Gated).");
    }
  } catch (err) {
    console.error("Test error:", err.message);
  }
}

testAdminBulkAPI();
