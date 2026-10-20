import test from "node:test";
import assert from "node:assert/strict";
import {
  validateTalentProfileInput,
  validateOutreachInput,
  detectSpam,
  sanitizeText,
} from "../src/lib/validations.ts";
import {
  getTalentProfiles,
  getTalentProfileById,
  upsertTalentProfile,
  updateTalentProfileVisibility,
  deleteTalentProfile,
  recordOutreach,
  getOutreachForUser,
  respondToOutreach,
  blockUser,
  unblockUser,
  createReport,
  exportUserData,
  deleteUserData,
  resetInMemoryStore,
} from "../src/lib/db.ts";

test.beforeEach(() => {
  resetInMemoryStore();
});

// 1. Validation & Input Sanitization
test("Talent Profile: Rejects spam and external chat invite links", () => {
  const spamPayload = {
    displayName: "Spam Dev",
    headline: "Join telegram t.me/fastmoney for hackathon team",
    skills: ["Python"],
    lookingFor: ["hackathon"],
    experienceLevel: "student",
    bio: "Reach out on telegram t.me/fastmoney",
    availability: "open",
    visible: true,
  };

  const result = validateTalentProfileInput(spamPayload);
  assert.equal(result.success, false);
  assert.ok(result.error?.includes("prohibited"));
});

test("Talent Profile: Rejects invalid or malicious social links", () => {
  const xssLinkPayload = {
    displayName: "XSS Hunter",
    headline: "Security researcher open for collaboration",
    skills: ["Next.js"],
    lookingFor: ["research"],
    experienceLevel: "experienced",
    bio: "Focusing on web security.",
    portfolio: "javascript:alert(document.cookie)",
    availability: "open",
    visible: true,
  };

  const result = validateTalentProfileInput(xssLinkPayload);
  assert.equal(result.success, false);
});

test("Talent Profile: Accepts valid profile and sanitizes inputs", () => {
  const validPayload = {
    displayName: "<script>alert(1)</script>Aarav Sharma",
    headline: "Computer Vision Researcher & Edge AI Dev",
    skills: ["PyTorch", "ROS2", "CUDA"],
    lookingFor: ["hackathon", "research"],
    experienceLevel: "experienced",
    bio: "Building real-time telemetry systems. <b>Let's build.</b>",
    github: "aarav-sharma",
    linkedin: "https://linkedin.com/in/aarav-sharma-ml",
    portfolio: "https://aaravsharma.dev",
    availability: "open",
    visible: true,
  };

  const result = validateTalentProfileInput(validPayload);
  assert.equal(result.success, true);
  assert.ok(result.data);
  // Angle brackets stripped by sanitizer, neutralizing any HTML tags
  assert.ok(!result.data.displayName.includes("<"));
  assert.ok(!result.data.displayName.includes(">"));
  assert.ok(!result.data.bio.includes("<"));
  assert.ok(!result.data.bio.includes(">"));
});

// 2. Privacy & Email Masking
test("Talent Profile: Public queries strictly mask emails and omit hidden profiles", async () => {
  // Public (unauthenticated) query
  const publicRes = await getTalentProfiles(false);
  assert.ok(publicRes.profiles.length > 0);

  for (const profile of publicRes.profiles) {
    assert.ok(profile.email.includes("••"), `Email must be masked: ${profile.email}`);
    assert.notEqual(profile.availability, "hidden");
    assert.notEqual(profile.visible, false);
  }

  // Authenticated query exposes real emails
  const authRes = await getTalentProfiles(true);
  for (const profile of authRes.profiles) {
    assert.ok(profile.email.includes("@gmail.com"));
    assert.ok(!profile.email.includes("••"));
  }
});

test("Talent Profile: Single profile query strictly masks email for public visitors", async () => {
  const publicProf = await getTalentProfileById("prf-ananya-ai-01", false);
  assert.ok(publicProf);
  assert.ok(publicProf.email.includes("••"));

  const authProf = await getTalentProfileById("prf-ananya-ai-01", true);
  assert.ok(authProf);
  assert.equal(authProf.email, "ananya.iyer.ai@gmail.com");
});

// 3. Two-Way Outreach & Rate Limiting
test("Outreach: Rejects self-outreach", async () => {
  const result = await recordOutreach(
    "usr-ananya-01",
    "ananya.iyer.ai@gmail.com",
    "Ananya Iyer",
    "usr-ananya-01",
    "prf-ananya-ai-01",
    null,
    "Hello myself, let's team up!"
  );

  assert.equal(result.success, false);
  assert.ok(result.error?.includes("own talent profile"));
});

test("Outreach: Successfully records outreach and decrements remaining budget", async () => {
  const result = await recordOutreach(
    "usr-sender-99",
    "sender.test@gmail.com",
    "Sender User",
    "usr-ananya-01",
    "prf-ananya-ai-01",
    null,
    "Hi Ananya, would love to team up for the upcoming AI hackathon!"
  );

  assert.equal(result.success, true);
  assert.ok(result.outreachId?.startsWith("out-"));
  assert.equal(result.remainingToday, 9);
});

test("Outreach: 10/day shared rate limit and 50 parallel requests burst", async () => {
  const senderEmail = "burst.outreach@gmail.com";
  const senderId = "usr-burst-99";

  // Fire 50 concurrent requests simultaneously
  const requests = Array.from({ length: 50 }, (_, i) =>
    recordOutreach(
      senderId,
      senderEmail,
      "Burst User",
      "usr-dev-02",
      "prf-dev-systems-02",
      null,
      `Parallel collaboration request attempt #${i + 1} with enough text.`
    )
  );

  const results = await Promise.all(requests);
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  assert.equal(successes.length, 10, "Strictly capped at max 10 per day");
  assert.equal(failures.length, 40, "Excess burst requests rejected");
  assert.ok(failures[0].error?.includes("limit reached"));
});

// 4. UGC Safety & Mutual Blocking
test("Outreach: Blocked users cannot send or receive outreach in either direction", async () => {
  const userA = "usera.collab@gmail.com";
  const userB = "ananya.iyer.ai@gmail.com"; // prf-ananya-ai-01 owner

  // User B blocks User A
  await blockUser(userB, userA);

  const outreachFromBlocked = await recordOutreach(
    "usr-a-01",
    userA,
    "User A",
    "usr-ananya-01",
    "prf-ananya-ai-01",
    null,
    "Attempting to contact after being blocked."
  );

  assert.equal(outreachFromBlocked.success, false);
  assert.ok(outreachFromBlocked.error?.includes("Cannot contact"));

  // Reverse direction: User A blocking User B also blocks outreach
  await unblockUser(userB, userA);
  await blockUser(userA, userB);

  const reverseOutreach = await recordOutreach(
    "usr-a-01",
    userA,
    "User A",
    "usr-ananya-01",
    "prf-ananya-ai-01",
    null,
    "Attempting contact while blocker."
  );

  assert.equal(reverseOutreach.success, false);
  assert.ok(reverseOutreach.error?.includes("Cannot contact"));
});

// 5. Recipient Resolution (Accept & Decline)
test("Outreach: Recipient can accept outreach and unmask contact details", async () => {
  const sendRes = await recordOutreach(
    "usr-lead-01",
    "teamlead@gmail.com",
    "Team Lead",
    "usr-ananya-01",
    "prf-ananya-ai-01",
    null,
    "We have an open spot on our SIH hackathon team."
  );
  assert.equal(sendRes.success, true);
  const outreachId = sendRes.outreachId;
  assert.ok(outreachId);

  // Non-recipient cannot respond (IDOR protection)
  const imposterRes = await respondToOutreach("usr-imposter-99", outreachId, "accept");
  assert.equal(imposterRes.success, false);
  assert.ok(imposterRes.error?.includes("Unauthorized"));

  // Recipient accepts
  const acceptRes = await respondToOutreach("usr-ananya-01", outreachId, "accept");
  assert.equal(acceptRes.success, true);
  assert.equal(acceptRes.status, "accepted");
  assert.equal(acceptRes.senderEmail, "teamlead@gmail.com");
  assert.equal(acceptRes.recipientEmail, "ananya.iyer.ai@gmail.com");

  // Cannot accept again
  const secondAccept = await respondToOutreach("usr-ananya-01", outreachId, "accept");
  assert.equal(secondAccept.success, false);
  assert.ok(secondAccept.error?.includes("already been resolved"));
});

// 6. DPDP Cascade Erasure & Data Export
test("Compliance: Account deletion purges talent profile and outreach records", async () => {
  const testEmail = "ananya.iyer.ai@gmail.com";
  const testUserId = "usr-ananya-01";

  // Pre-check
  const profileBefore = await getTalentProfileById("prf-ananya-ai-01", true);
  assert.ok(profileBefore);

  // Perform cascade deletion
  await deleteUserData(testUserId, testEmail);

  // Verify talent profile is deleted
  const profileAfter = await getTalentProfileById("prf-ananya-ai-01", true);
  assert.equal(profileAfter, null);

  // Verify export contains null talentProfile
  const exportData = await exportUserData(testUserId, testEmail);
  assert.equal(exportData.talentProfile, null);
  assert.equal(exportData.outreachHistory.length, 0);
});
