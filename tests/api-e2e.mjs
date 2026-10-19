// End-to-end API verification test for SynqSquad (Gmail-only architecture)
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

async function runTests() {
  console.log(`\n🧪 Running SynqSquad Gmail-Only E2E Test Suite against ${BASE_URL}...`);
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
    // 1. GET /api/listings (Unauthenticated - Email privacy check)
    console.log("\n[Test 1] GET /api/listings (Privacy Protection)");
    const getRes = await fetch(`${BASE_URL}/api/listings`);
    const getData = await getRes.json();
    assert(getRes.status === 200, "Status is 200 OK");
    assert(getData.success === true, "Response reports success: true");
    assert(Array.isArray(getData.data), "Data is an array");
    assert(getData.data.length >= 12, `12 Realistic Seed listings present (count: ${getData.data.length})`);
    assert(getData.data[0].ownerEmail.includes("••"), "Public view masks owner email to protect privacy");

    // 2. GET /api/listings?auth=true (Authenticated check)
    console.log("\n[Test 2] GET /api/listings?auth=true");
    const authGetRes = await fetch(`${BASE_URL}/api/listings?auth=true`);
    const authGetData = await authGetRes.json();
    assert(authGetRes.status === 200, "Status is 200 OK");
    assert(authGetData.data[0].ownerEmail.includes("@gmail.com"), "Authenticated view provides verified Gmail for direct connect");

    // 3. POST /api/listings (Create requirement)
    console.log("\n[Test 3] POST /api/listings (Create Requirement)");
    const newListingPayload = {
      title: "Test Autonomous Agricultural Drone for SIH 2026",
      event: "Smart India Hackathon 2026",
      deadline: "Nov 30, 2026",
      type: "hackathon",
      skillsNeeded: ["ROS2", "Python", "FastAPI"],
      slots: 2,
      totalSlots: 4,
      description: "Testing end-to-end integration for automated team matchmaking and Gmail contact routing.",
      ownerId: "usr-test-99",
      ownerName: "Rajnish Singh",
      ownerEmail: "rajnishsingh.test@gmail.com",
      ownerCollege: "Gautam Buddha University",
      ownerRole: "Robotics Lead",
    };

    const postRes = await fetch(`${BASE_URL}/api/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newListingPayload),
    });
    const postData = await postRes.json();
    assert(postRes.status === 201, "Status is 201 Created");
    assert(postData.data?.id?.startsWith("lst-"), "Listing assigned unique ID");
    assert(postData.data?.ownerEmail === "rajnishsingh.test@gmail.com", "Owner email persisted");

    const createdId = postData.data.id;

    // 4. POST /api/contact (Gmail Connect Flow & 10/day rate limit)
    console.log("\n[Test 4] POST /api/contact (Connect on Gmail & Rate Limit)");
    const contactRes = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserEmail: "applicant@gmail.com",
        listingId: createdId,
      }),
    });
    const contactData = await contactRes.json();
    assert(contactRes.status === 200, "Contact recorded with 200 OK");
    assert(contactData.data?.recipientEmail === "rajnishsingh.test@gmail.com", "Recipient email resolved for Gmail compose URL");
    assert(typeof contactData.data?.remainingToday === "number", "Daily contact quota returned");

    // 5. GET /api/contact?email=applicant@gmail.com (Contacted history)
    console.log("\n[Test 5] GET /api/contact (Fetch Contacted List)");
    const historyRes = await fetch(`${BASE_URL}/api/contact?email=applicant@gmail.com`);
    const historyData = await historyRes.json();
    assert(historyRes.status === 200, "Status is 200 OK");
    assert(historyData.data.some((l) => l.id === createdId), "Listing saved to applicant's Contacted list");

    // 6. PATCH /api/listings/[id] (Mark as filled by verified owner)
    console.log("\n[Test 6] PATCH /api/listings/[id] (Mark Filled)");
    // 6a: Unauthorized attempt
    const unauthorizedPatch = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerEmail: "imposter@gmail.com",
        status: "filled",
      }),
    });
    assert(unauthorizedPatch.status === 403, "Rejects update from non-owner email");

    // 6b: Authorized attempt
    const authorizedPatch = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerEmail: "rajnishsingh.test@gmail.com",
        status: "filled",
      }),
    });
    const authorizedPatchData = await authorizedPatch.json();
    assert(authorizedPatch.status === 200, "Owner successfully marks listing as filled");
    assert(authorizedPatchData.data?.status === "filled", "Status changed to 'filled'");

    // 7. DELETE /api/listings/[id] (Delete by verified owner)
    console.log("\n[Test 7] DELETE /api/listings/[id] (Delete Listing)");
    const deleteRes = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerEmail: "rajnishsingh.test@gmail.com",
      }),
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200, "Delete succeeded with 200 OK");
    assert(deleteData.success === true, "Delete response reports success");

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
