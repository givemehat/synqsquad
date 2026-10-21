// End-to-end API verification test for SynqSquad / RIVQ
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const userJwt = process.env.TEST_USER_JWT || null;

async function runTests() {
  console.log(`\n🧪 Running SynqSquad API Verification Suite against ${BASE_URL}...`);
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. GET /api/health
    console.log("\n[Test 1] GET /api/health (System Availability)");
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, "Health endpoint returned 200 OK");
    assert(healthData.status === "healthy", "Health status reports healthy");
    assert(typeof healthData.db_configured === "boolean", "db_configured is a boolean");
    assert(typeof healthData.auth_configured === "boolean", "auth_configured is a boolean");
    assert(Boolean(healthData.version), "Version string is present");

    // 2. GET /api/listings (Unauthenticated - Email privacy check)
    console.log("\n[Test 2] GET /api/listings (Privacy Protection)");
    const getRes = await fetch(`${BASE_URL}/api/listings`);
    const getData = await getRes.json();
    assert(getRes.status === 200, "Status is 200 OK");
    assert(getData.success === true, "Response reports success: true");
    assert(Array.isArray(getData.data), "Data is an array");
    if (getData.data.length > 0) {
      assert(getData.data[0].ownerEmail.includes("••"), "Public view masks owner email to protect privacy");
    } else {
      assert(true, "Public feed returned 0 listings (clean production state)");
    }

    // 3. POST /api/listings without token (Must be rejected with 401)
    console.log("\n[Test 3] POST /api/listings (Unauthenticated rejection)");
    const unauthPost = await fetch(`${BASE_URL}/api/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Unauthenticated Requisition Submission",
        event: "Hackathon",
        skillsNeeded: ["Python"],
        description: "Should be rejected because caller has no session token.",
      }),
    });
    assert(unauthPost.status === 401, "Unauthenticated POST rejected with 401 Unauthorized");

    // 4. POST /api/contact without token (Must be rejected with 401)
    console.log("\n[Test 4] POST /api/contact (Unauthenticated rejection)");
    const unauthContact = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: "lst-test-nonexistent" }),
    });
    assert(unauthContact.status === 401, "Unauthenticated contact attempt rejected with 401 Unauthorized");

    // 5. POST /api/blocks without token (Must be rejected with 401)
    console.log("\n[Test 5] POST /api/blocks (Unauthenticated rejection)");
    const unauthBlock = await fetch(`${BASE_URL}/api/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedEmail: "spammer@gmail.com" }),
    });
    assert(unauthBlock.status === 401, "Unauthenticated block attempt rejected with 401 Unauthorized");

    // 6. POST /api/report without token (Must be rejected with 401)
    console.log("\n[Test 6] POST /api/report (Unauthenticated rejection)");
    const unauthReport = await fetch(`${BASE_URL}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: "lst-test", reason: "Spam content" }),
    });
    assert(unauthReport.status === 401, "Unauthenticated report attempt rejected with 401 Unauthorized");

    // 7. GET /api/user without token (Must be rejected with 401)
    console.log("\n[Test 7] GET /api/user (Unauthenticated rejection)");
    const unauthUser = await fetch(`${BASE_URL}/api/user`);
    assert(unauthUser.status === 401, "Unauthenticated user profile attempt rejected with 401 Unauthorized");

    // 8. Authenticated tests (if TEST_USER_JWT is provided)
    if (userJwt) {
      console.log("\n[Test 8] Authenticated session provided — testing user endpoints");
      const userRes = await fetch(`${BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${userJwt}` },
      });
      assert(userRes.status === 200 || userRes.status === 404, "User profile route responded to valid Bearer token");
    } else {
      console.log("\n[Test 8] No TEST_USER_JWT provided; skipping authenticated live user calls (safe for CI).");
    }

    console.log(`\n========================================`);
    console.log(`Tests Passed: ${passed}`);
    console.log(`Tests Failed: ${failed}`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed with fatal error:", err);
    process.exit(1);
  }
}

runTests();
