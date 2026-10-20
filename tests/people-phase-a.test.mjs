import test from "node:test";
import assert from "node:assert/strict";
import {
  getTalentProfiles,
  getTalentProfileById,
  upsertTalentProfile,
  recordOutreach,
  getOutreachForUser,
  blockUser,
  deleteUserData,
  exportUserData,
  resetInMemoryStore,
} from "../src/lib/db.ts";
import { validateTalentProfileInput, validateOutreachInput } from "../src/lib/validations.ts";

test("Phase A: Talent Profiles mask emails for unauthenticated visitors", async () => {
  resetInMemoryStore();
  const publicResult = await getTalentProfiles(false);
  assert.ok(publicResult.profiles.length > 0, "Public talent profiles exist");

  for (const p of publicResult.profiles) {
    assert.match(
      p.email,
      /••/,
      `Unauthenticated visitor must see masked email on talent profile (found: ${p.email})`
    );
  }

  const authenticatedResult = await getTalentProfiles(true);
  for (const p of authenticatedResult.profiles) {
    assert.ok(
      p.email.includes("@example.com") || p.email.includes("@gmail.com"),
      `Authenticated member must see verified email (found: ${p.email})`
    );
  }
});

test("Phase A: Two-way collaboration outreach is rate-limited to 10/day", async () => {
  resetInMemoryStore();
  const senderEmail = "active.hacker.sender@gmail.com";
  const senderId = "usr-sender-999";
  const result = await getTalentProfiles(true);
  const target = result.profiles[0];

  assert.ok(target, "Target profile exists");

  // Send 10 successful outreaches
  for (let i = 0; i < 10; i++) {
    const res = await recordOutreach(
      senderId,
      senderEmail,
      "Active Hacker",
      target.userId,
      target.id,
      null,
      `Hello! I would love to collaborate on a hackathon project with you #run${i}`
    );
    assert.strictEqual(res.success, true, `Outreach #${i + 1} should succeed`);
  }

  // 11th outreach must be rejected
  const rejected = await recordOutreach(
    senderId,
    senderEmail,
    "Active Hacker",
    target.userId,
    target.id,
    null,
    "11th attempt that should exceed the daily quota"
  );

  assert.strictEqual(rejected.success, false);
  assert.match(rejected.error || "", /limit reached/i);
});

test("Phase A: UGC Block prevents seeing or outreaching to blocked members", async () => {
  resetInMemoryStore();
  const blockerEmail = "my.clean.user@gmail.com";
  const blockerId = "usr-clean-123";
  const result = await getTalentProfiles(true);
  const toxicProfile = result.profiles[1];

  // Block the member
  await blockUser(blockerEmail, toxicProfile.email);

  // Blocker should no longer see the blocked member in the directory
  const filtered = await getTalentProfiles(true, blockerEmail);
  const existsInFeed = filtered.profiles.some((p) => p.email.toLowerCase() === toxicProfile.email.toLowerCase());
  assert.strictEqual(existsInFeed, false, "Blocked member must not appear in directory for blocker");

  // Attempting to send outreach must fail
  const attempt = await recordOutreach(
    blockerId,
    blockerEmail,
    "Clean User",
    toxicProfile.userId,
    toxicProfile.id,
    null,
    "Attempting to message blocked member"
  );
  assert.strictEqual(attempt.success, false);
  assert.match(attempt.error || "", /Cannot contact this user|blocked/i);
});

test("Phase A: Cascading account deletion purges talent profile & outreach history", async () => {
  resetInMemoryStore();
  const testEmail = "talent.to.delete@gmail.com";
  const testUserId = "usr-talent-delete-11";

  await upsertTalentProfile(testUserId, testEmail, {
    displayName: "Temporary Member",
    headline: "Temporary Profile Headline",
    skills: ["Next.js", "TypeScript"],
    lookingFor: ["hackathon"],
    experienceLevel: "student",
    bio: "This profile will be permanently deleted.",
    availability: "open",
    visible: true,
  });

  // Verify created
  const beforeExport = await exportUserData(testUserId, testEmail);
  assert.ok(beforeExport.talentProfile !== null, "Talent profile should exist before deletion");

  // Delete user
  const deleted = await deleteUserData(testUserId, testEmail);
  assert.strictEqual(deleted, true);

  // Verify purged
  const afterExport = await exportUserData(testUserId, testEmail);
  assert.strictEqual(afterExport.talentProfile, null, "Talent profile must be purged after account deletion");
});

test("Phase A: Validation strictly rejects external chat spam in headlines or bio", async () => {
  const spamInput = {
    displayName: "Spammer User",
    headline: "Join my Telegram t.me/cryptoscam for tokens",
    skills: ["Crypto"],
    lookingFor: ["hackathon"],
    experienceLevel: "student",
    bio: "Free airdrops at discord.gg/fakegroup",
    availability: "open",
    visible: true,
  };

  const validation = validateTalentProfileInput(spamInput);
  assert.strictEqual(validation.success, false);
  assert.match(validation.error || "", /External chat invitations|prohibited/i);
});

test("Phase A: Outreach validation requires minimum length and rejects external links", async () => {
  const shortMsg = {
    recipientId: "usr-target",
    profileId: "prf-target",
    message: "Hi",
  };
  const shortVal = validateOutreachInput(shortMsg);
  assert.strictEqual(shortVal.success, false);
  assert.match(shortVal.error || "", /at least 10 characters/i);

  const spamMsg = {
    recipientId: "usr-target",
    profileId: "prf-target",
    message: "DM me on whatsapp chat.whatsapp.com/invitelink right now",
  };
  const spamVal = validateOutreachInput(spamMsg);
  assert.strictEqual(spamVal.success, false);
  assert.match(spamVal.error || "", /External chat invitations|prohibited/i);
});

test("Phase A: /api/people filter and pagination caps", async () => {
  resetInMemoryStore();

  // 1. Skill filter test
  const rustResults = await getTalentProfiles(false, undefined, { skills: ["Rust"] });
  assert.ok(rustResults.profiles.length > 0, "Should find profiles with Rust");
  for (const p of rustResults.profiles) {
    const hasRust = p.skills.some((s) => s.toLowerCase().includes("rust"));
    assert.strictEqual(hasRust, true, `Profile ${p.displayName} must include Rust`);
  }

  // 2. Experience level filter
  const expResults = await getTalentProfiles(false, undefined, { experienceLevel: "experienced" });
  assert.ok(expResults.profiles.length > 0, "Should find experienced profiles");
  for (const p of expResults.profiles) {
    assert.strictEqual(p.experienceLevel, "experienced");
  }

  // 3. Pagination offset & limit
  const paged1 = await getTalentProfiles(false, undefined, { limit: 2, offset: 0 });
  const paged2 = await getTalentProfiles(false, undefined, { limit: 2, offset: 2 });
  assert.strictEqual(paged1.profiles.length, 2);
  assert.strictEqual(paged2.profiles.length, 2);
  assert.notStrictEqual(paged1.profiles[0].id, paged2.profiles[0].id, "Pagination offsets must yield different profiles");
});

test("Phase A: XSS in profile bio/headline is strictly sanitized", () => {
  const xssPayload = {
    displayName: "Hacker <script>alert(1)</script>",
    headline: "Malicious headline <img src=x onerror=alert('xss')>",
    skills: ["Python", "Security"],
    lookingFor: ["research"],
    experienceLevel: "student",
    bio: "Bio with <iframe src='https://evil.com'></iframe> and javascript:void(0)",
    availability: "open",
    visible: true,
  };

  const validated = validateTalentProfileInput(xssPayload);
  assert.strictEqual(validated.success, true);
  assert.ok(validated.data);
  // Verify all dangerous angle brackets were removed
  assert.strictEqual(validated.data.displayName.includes("<"), false);
  assert.strictEqual(validated.data.displayName.includes(">"), false);
  assert.strictEqual(validated.data.headline.includes("<"), false);
  assert.strictEqual(validated.data.headline.includes(">"), false);
  assert.strictEqual(validated.data.bio.includes("<"), false);
  assert.strictEqual(validated.data.bio.includes(">"), false);
});

test("Phase A: Two-way blocking in both directions for talent profiles", async () => {
  resetInMemoryStore();
  const aliceEmail = "alice.talent@example.com";
  const bobEmail = "bob.talent@example.com";

  // Register two profiles
  await upsertTalentProfile("usr-alice-test", aliceEmail, {
    displayName: "Alice Dev",
    headline: "Distributed systems engineer",
    skills: ["Rust", "Raft"],
    lookingFor: ["hackathon"],
    experienceLevel: "experienced",
    bio: "Building consensus systems.",
    availability: "open",
    visible: true,
  });

  await upsertTalentProfile("usr-bob-test", bobEmail, {
    displayName: "Bob Dev",
    headline: "AI engineer",
    skills: ["PyTorch"],
    lookingFor: ["research"],
    experienceLevel: "student",
    bio: "Exploring diffusion models.",
    availability: "open",
    visible: true,
  });

  // Alice blocks Bob
  await blockUser(aliceEmail, bobEmail);

  // 1. From Alice's view: Bob is hidden
  const aliceView = await getTalentProfiles(true, aliceEmail);
  const bobInAliceView = aliceView.profiles.some((p) => p.email.toLowerCase() === bobEmail.toLowerCase());
  assert.strictEqual(bobInAliceView, false, "Blocked user Bob must not appear in Alice's view");

  // 2. From Bob's view: Alice is also hidden (mutual block isolation)
  const bobView = await getTalentProfiles(true, bobEmail);
  const aliceInBobView = bobView.profiles.some((p) => p.email.toLowerCase() === aliceEmail.toLowerCase());
  assert.strictEqual(aliceInBobView, false, "Blocker Alice must not appear in blocked Bob's view");
});
