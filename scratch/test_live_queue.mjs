const BASE_URL = "https://kynisto.nxt-arshit.workers.dev";
const QUEUE_CODE = "HC_A5KW2736";

async function testLiveQueue() {
  console.log("=== TESTING LIVE KYNISTO QUEUE SYSTEM ===");
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`Target Queue Code: ${QUEUE_CODE}\n`);

  let cookieHeader = "";
  let csrfToken = "";
  let rawCookieHeader = "";

  // Step 1: Test GET QR resolution endpoint
  console.log("[1] Testing GET /api/healthcare/qr/" + QUEUE_CODE + "...");
  try {
    const res1 = await fetch(`${BASE_URL}/api/healthcare/qr/${QUEUE_CODE}`, {
      headers: { "x-kynisto-platform": "web" },
    });
    console.log(`   Status: ${res1.status} ${res1.statusText}`);
    const data1 = await res1.json();
    console.log("   Response payload:", JSON.stringify(data1, null, 2));

    if (!res1.ok || !data1.ok) {
      console.error("❌ Failed to resolve QR code!");
    } else {
      console.log("✅ QR Code resolved successfully! Store: " + data1.record?.storeName);
    }
  } catch (err) {
    console.error("❌ GET QR failed with error:", err.message);
  }

  // Step 2: Test Join without auth (should return 401 Unauthorized)
  console.log("\n[2] Testing POST /api/healthcare/qr/join without auth...");
  try {
    const res2 = await fetch(`${BASE_URL}/api/healthcare/qr/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueCode: QUEUE_CODE }),
    });
    console.log(`   Status: ${res2.status} ${res2.statusText}`);
    const data2 = await res2.json();
    console.log("   Response payload:", JSON.stringify(data2));

    if (res2.status === 401 && data2.error?.code === "UNAUTHORIZED") {
      console.log("✅ Unauthenticated join correctly blocked with 401 UNAUTHORIZED!");
    } else {
      console.error("❌ Unexpected unauthenticated join behavior!");
    }
  } catch (err) {
    console.error("❌ Join without auth failed with error:", err.message);
  }

  // Step 3: Test Active Queue check
  console.log("\n[3] Testing GET /api/healthcare/queue/active without auth...");
  try {
    const res3 = await fetch(`${BASE_URL}/api/healthcare/queue/active`);
    console.log(`   Status: ${res3.status} ${res3.statusText}`);
    const data3 = await res3.json();
    console.log("   Response payload:", JSON.stringify(data3));
    if (res3.ok && data3.activeQueue === null) {
      console.log("✅ Active queue correctly returns null for unauthenticated user!");
    }
  } catch (err) {
    console.error("❌ Active queue check failed with error:", err.message);
  }

  // Step 4: Test Login API endpoint /api/auth/login
  console.log("\n[4] Testing POST /api/auth/login with test customer account...");
  try {
    const res4 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "customer@kynisto.local", password: "Password123!" }),
    });
    console.log(`   Status: ${res4.status} ${res4.statusText}`);
    const setCookie = res4.headers.getSetCookie ? res4.headers.getSetCookie() : [res4.headers.get("set-cookie")].filter(Boolean);
    console.log("   Set-Cookie headers:", setCookie);

    if (setCookie && setCookie.length > 0) {
      cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
      const csrfCookie = setCookie.find((c) => c.includes("kynisto_csrf="));
      if (csrfCookie) {
        csrfToken = csrfCookie.split("kynisto_csrf=")[1].split(";")[0];
      }
    }
    const data4 = await res4.json();
    console.log("   Login Response:", JSON.stringify(data4));

    if (res4.ok) {
      console.log("✅ Login successful! User: " + data4.user?.name);
    } else {
      console.warn("⚠️ Login failed with password, attempting mock session creation...");
    }
  } catch (err) {
    console.error("❌ Login test error:", err.message);
  }

  // Step 5: Test Join Queue WITH Auth (if logged in)
  if (cookieHeader) {
    console.log("\n[5] Testing POST /api/healthcare/qr/join WITH authenticated session...");
    try {
      const res5 = await fetch(`${BASE_URL}/api/healthcare/qr/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
          "x-kynisto-csrf": csrfToken,
        },
        body: JSON.stringify({ queueCode: QUEUE_CODE }),
      });
      console.log(`   Status: ${res5.status} ${res5.statusText}`);
      const data5 = await res5.json();
      console.log("   Join Response:", JSON.stringify(data5, null, 2));

      if (res5.ok && data5.ok) {
        console.log("✅ Authenticated join queue SUCCESSFUL! Message:", data5.message);
      } else {
        console.error("❌ Authenticated join queue failed:", data5);
      }
    } catch (err) {
      console.error("❌ Authenticated join failed with error:", err.message);
    }

    // Step 6: Test Active Queue check WITH Auth
    console.log("\n[6] Testing GET /api/healthcare/queue/active WITH authenticated session...");
    try {
      const res6 = await fetch(`${BASE_URL}/api/healthcare/queue/active`, {
        headers: { Cookie: cookieHeader },
      });
      console.log(`   Status: ${res6.status} ${res6.statusText}`);
      const data6 = await res6.json();
      console.log("   Active Queue Response:", JSON.stringify(data6, null, 2));

      if (res6.ok && data6.activeQueue) {
        console.log("✅ Active queue persistence endpoint returns active token correctly! Token:", data6.activeQueue.tokenNumber);
      }
    } catch (err) {
      console.error("❌ Active queue check with auth failed:", err.message);
    }

    // Step 7: Test Running Late update
    console.log("\n[7] Testing POST /api/healthcare/queue (action: update_arrival)...");
    try {
      const res7 = await fetch(`${BASE_URL}/api/healthcare/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
          "x-kynisto-csrf": csrfToken,
        },
        body: JSON.stringify({ action: "update_arrival", storeId: "c0429348-9397-474a-873e-e4ad4018a44c", arrivalStatus: "running_late", lateMinutes: 15 }),
      });
      console.log(`   Status: ${res7.status} ${res7.statusText}`);
      const data7 = await res7.json();
      console.log("   Running Late Response:", JSON.stringify(data7, null, 2));
      if (res7.ok) {
        console.log("✅ Running late status updated successfully!");
      }
    } catch (err) {
      console.error("❌ Running late test failed:", err.message);
    }

    // Step 8: Test Leaving Queue
    console.log("\n[8] Testing POST /api/healthcare/queue (action: leave)...");
    try {
      const res8 = await fetch(`${BASE_URL}/api/healthcare/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
          "x-kynisto-csrf": csrfToken,
        },
        body: JSON.stringify({ action: "leave", storeId: "c0429348-9397-474a-873e-e4ad4018a44c" }),
      });
      console.log(`   Status: ${res8.status} ${res8.statusText}`);
      const data8 = await res8.json();
      console.log("   Leave Queue Response:", JSON.stringify(data8, null, 2));
      if (res8.ok) {
        console.log("✅ Successfully left queue!");
      }
    } catch (err) {
      console.error("❌ Leave queue test failed:", err.message);
    }
  }

  console.log("\n=== ALL TEST STEPS COMPLETED ===");
}

testLiveQueue();
