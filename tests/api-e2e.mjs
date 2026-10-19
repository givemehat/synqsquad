// End-to-end API verification test
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runTests() {
  console.log(`\n🧪 Starting SynqSquad API and E2E Test Suite against ${BASE_URL}...`);
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
    // 1. GET /api/listings
    console.log("\n[Test 1] GET /api/listings");
    const getRes = await fetch(`${BASE_URL}/api/listings`);
    const getData = await getRes.json();
    assert(getRes.status === 200, "Status is 200 OK");
    assert(getData.success === true, "Response reports success: true");
    assert(Array.isArray(getData.data), "Data is an array");
    assert(getData.data.length >= 6, `Seed data present (count: ${getData.data.length})`);

    // 2. GET /api/hackathons
    console.log("\n[Test 2] GET /api/hackathons");
    const hckRes = await fetch(`${BASE_URL}/api/hackathons`);
    const hckData = await hckRes.json();
    assert(hckRes.status === 200, "Status is 200 OK");
    assert(hckData.data.length >= 5, "Hackathon competitions loaded");

    // 3. POST /api/listings (Create new listing)
    console.log("\n[Test 3] POST /api/listings (Create Post)");
    const newListingPayload = {
      title: "Test Autonomous Drone Vision for IEEE Conference",
      targetName: "IEEE ICRA 2026",
      type: "research",
      domain: "Robotics & IoT",
      creatorName: "Test Researcher",
      creatorRole: "PhD Fellow",
      location: "Hybrid / India",
      description: "Testing end-to-end integration for automated team matchmaking and contact routing.",
      rolesNeeded: ["C++ ROS2 Specialist", "Edge ML Optimizer"],
      skills: ["C++", "ROS2", "PyTorch"],
      currentMembersCount: 1,
      maxMembersCount: 3,
      isVerifiedWinner: true,
      managePin: "998877",
      contact: {
        telegram: "test_researcher_bot",
        discord: "testbot#1234",
        email: "test.researcher@example.com",
      },
    };

    const postRes = await fetch(`${BASE_URL}/api/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newListingPayload),
    });
    const postData = await postRes.json();
    assert(postRes.status === 201, "Status is 201 Created");
    assert(postData.data?.id?.startsWith("lst-"), "Listing assigned unique ID");
    assert(postData.data?.managePin === "998877", "Manage PIN persisted securely");

    const createdId = postData.data.id;

    // 4. POST /api/boost (Self-serve monetization test)
    console.log("\n[Test 4] POST /api/boost (Monetization Boost)");
    const boostRes = await fetch(`${BASE_URL}/api/boost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: createdId,
        plan: "pro",
        paymentMethod: "UPI Instant Pay",
      }),
    });
    const boostData = await boostRes.json();
    assert(boostRes.status === 200, "Boost activated with 200 OK");
    assert(boostData.data?.listing?.isBoosted === true, "Listing isBoosted flag is true");
    assert(Boolean(boostData.data?.transactionId), "Transaction receipt generated");

    // 5. PATCH /api/listings/[id] (PIN validation & status update)
    console.log("\n[Test 5] PATCH /api/listings/[id] (Update status with PIN)");
    // 5a: With wrong PIN
    const wrongPinRes = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        managePin: "000000",
        updates: { status: "filled" },
      }),
    });
    assert(wrongPinRes.status === 400 || wrongPinRes.status === 401, "Rejects incorrect PIN");

    // 5b: With correct PIN
    const correctPinRes = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        managePin: "998877",
        updates: { status: "filled", currentMembersCount: 3 },
      }),
    });
    const correctPinData = await correctPinRes.json();
    assert(correctPinRes.status === 200, "Accepts correct PIN and updates");
    assert(correctPinData.data?.status === "filled", "Status updated to 'filled'");

    // 6. DELETE /api/listings/[id] (Self-service cleanup)
    console.log("\n[Test 6] DELETE /api/listings/[id] (Self-serve delete with PIN)");
    const deleteRes = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        managePin: "998877",
      }),
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200, "Delete succeeded with 200 OK");
    assert(deleteData.success === true, "Delete response success is true");

    console.log(`\n========================================`);
    console.log(`🎯 Test Summary: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runTests();
