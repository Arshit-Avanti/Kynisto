const BASE_URL = "https://kynisto.nxt-arshit.workers.dev";

async function testPendingWorkflow() {
  console.log("=== TESTING PENDING PAYMENT WORKFLOW & ADMIN MESSAGES ===");

  // 1. Submit payment request with compulsory fields
  try {
    const res = await fetch(`${BASE_URL}/api/subscriptions/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: "starter",
        billingCycle: "monthly",
        subscriberName: "Test Shop Owner",
        subscriberRole: "store_owner",
        subscriberEmail: "testowner@example.com",
        paymentTime: new Date().toLocaleString(),
        amountPaid: 299,
        utr: "998877665544",
      }),
    });

    console.log("Submit Response Status:", res.status);
    const data = await res.json();
    console.log("Submit Response Data:", data);

    if (data.pendingApproval && data.message.includes("DON'T PANIC")) {
      console.log("✓ TEST PASSED: Response correctly returns 'DON'T PANIC, ADMIN WILL GIVE YOUR SUBSCRIPTION WITHIN 24 HOURS'.");
    } else {
      console.log("✗ TEST FAILED: Unexpected response format.");
    }
  } catch (err) {
    console.error("Test error:", err.message);
  }
}

testPendingWorkflow();
