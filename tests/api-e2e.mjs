// End-to-end API verification test for SynqSquad (Gmail-only architecture with JWT Auth)
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

function createTestJwt({ id = "usr-test-99", email = "rajnishsingh.test@gmail.com", name = "Rajnish Singh" } = {}) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: id,
    id,
    email,
    name,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.test_sig`;
}

const ownerToken = createTestJwt({ id: "usr-owner-99", email: "rajnishsingh.test@gmail.com", name: "Rajnish Singh" });
const applicantToken = createTestJwt({ id: "usr-applicant-1", email: "applicant@gmail.com", name: "Applicant User" });
const imposterToken = createTestJwt({ id: "usr-imposter-2", email: "imposter@gmail.com", name: "Imposter User" });

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

    // 2. POST /api/listings without token (Must be rejected with 401)
    console.log("\n[Test 2] POST /api/listings (Unauthenticated rejection)");
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

    // 3. POST /api/listings with verified token (Create requirement)
    console.log("\n[Test 3] POST /api/listings (Authenticated with verified token)");
    const newListingPayload = {
      title: "Test Autonomous Agricultural Drone for SIH 2026",
      event: "Smart India Hackathon 2026",
      deadline: "Nov 30, 2026",
      type: "hackathon",
      skillsNeeded: ["ROS2", "Python", "FastAPI"],
      slots: 2,
      totalSlots: 4,
      description: "Testing end-to-end integration for automated team matchmaking and Gmail contact routing.",
      ownerCollege: "Gautam Buddha University",
      ownerRole: "Robotics Lead",
    };

    const postRes = await fetch(`${BASE_URL}/api/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify(newListingPayload),
    });
    const postData = await postRes.json();
    assert(postRes.status === 201, "Status is 201 Created");
    assert(postData.data?.id?.startsWith("lst-"), "Listing assigned unique ID");
    assert(postData.data?.ownerEmail === "rajnishsingh.test@gmail.com", "Owner email verified from token");

    const createdId = postData.data.id;

    // 4. POST /api/contact without token (Must be rejected)
    console.log("\n[Test 4] POST /api/contact (Unauthenticated rejection)");
    const unauthContact = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: createdId }),
    });
    assert(unauthContact.status === 401, "Unauthenticated contact attempt rejected with 401 Unauthorized");

    // 5. POST /api/contact with verified token (Gmail Connect Flow & 10/day rate limit)
    console.log("\n[Test 5] POST /api/contact (Connect on Gmail with verified token)");
    const contactRes = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${applicantToken}`,
      },
      body: JSON.stringify({ listingId: createdId }),
    });
    const contactData = await contactRes.json();
    assert(contactRes.status === 200, "Contact recorded with 200 OK");
    assert(contactData.data?.recipientEmail === "rajnishsingh.test@gmail.com", "Recipient email resolved for Gmail compose URL");
    assert(typeof contactData.data?.remainingToday === "number", "Daily contact quota returned");

    // 6. GET /api/contact with verified token (Fetch Contacted List)
    console.log("\n[Test 6] GET /api/contact (Fetch Contacted List for caller)");
    const historyRes = await fetch(`${BASE_URL}/api/contact`, {
      headers: { Authorization: `Bearer ${applicantToken}` },
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200, "Status is 200 OK");
    assert(historyData.data.some((l) => l.id === createdId), "Listing saved to applicant's Contacted list");

    // 7. PATCH /api/listings/[id] IDOR Defense: Imposter rejected
    console.log("\n[Test 7] PATCH /api/listings/[id] (IDOR Defense — Imposter Rejected)");
    const unauthorizedPatch = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${imposterToken}`,
      },
      body: JSON.stringify({ status: "filled" }),
    });
    assert(unauthorizedPatch.status === 403, "Rejects update from non-owner token (403 Forbidden)");

    // 8. PATCH /api/listings/[id] Owner Authorized: Mark Filled
    console.log("\n[Test 8] PATCH /api/listings/[id] (Owner Marks Filled)");
    const authorizedPatch = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: "filled" }),
    });
    const authorizedPatchData = await authorizedPatch.json();
    assert(authorizedPatch.status === 200, "Owner successfully marks listing as filled");
    assert(authorizedPatchData.data?.status === "filled", "Status changed to 'filled'");

    // 9. DELETE /api/listings/[id] (Delete by verified owner)
    console.log("\n[Test 9] DELETE /api/listings/[id] (Delete Listing)");
    const deleteRes = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200, "Delete succeeded with 200 OK");
    assert(deleteData.success === true, "Delete response reports success");

    // 10. GET /api/people (Unauthenticated Talent Profile Privacy Check)
    console.log("\n[Test 10] GET /api/people (Talent Directory Privacy)");
    const peopleRes = await fetch(`${BASE_URL}/api/people`);
    const peopleData = await peopleRes.json();
    assert(peopleRes.status === 200, "Status is 200 OK");
    assert(peopleData.success === true, "People response reports success: true");
    assert(Array.isArray(peopleData.data), "People data is an array");
    assert(peopleData.data[0].email.includes("••"), "Talent profile email is masked for unauthenticated viewers");

    // 11. POST /api/people (Publish Availability Card with verified token)
    console.log("\n[Test 11] POST /api/people (Create Talent Profile)");
    const profilePayload = {
      displayName: "Rajnish Singh",
      headline: "AI Systems Engineer | Edge AI & Robotics Co-author",
      skills: ["PyTorch", "ROS2", "Next.js"],
      lookingFor: ["hackathon", "research"],
      experienceLevel: "experienced",
      bio: "Building autonomous systems and low-latency computer vision pipelines.",
      github: "rajnishsingh",
      availability: "open",
      visible: true,
    };
    const createProfileRes = await fetch(`${BASE_URL}/api/people`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify(profilePayload),
    });
    const createProfileData = await createProfileRes.json();
    assert(createProfileRes.status === 200, "Talent profile published successfully");
    const talentProfileId = createProfileData.data?.profile?.id || "prf-ananya-ai-01";

    // 12. POST /api/people/outreach (Send Team -> Talent Collaboration Request)
    console.log("\n[Test 12] POST /api/people/outreach (Two-Way Outreach)");
    const outreachRes = await fetch(`${BASE_URL}/api/people/outreach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${applicantToken}`,
      },
      body: JSON.stringify({
        recipientId: "usr-owner-99",
        profileId: talentProfileId,
        message: "Hi Rajnish, saw your edge vision profile. Would love to invite you to our SIH hackathon team!",
      }),
    });
    const outreachData = await outreachRes.json();
    assert(outreachRes.status === 200, "Collaboration outreach sent successfully");
    assert(outreachData.success === true, "Outreach reports success");
    assert(Boolean(outreachData.gmailUrl), "Generates pre-filled Gmail compose link");

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
