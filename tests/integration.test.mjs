import test from "node:test";
import assert from "node:assert/strict";
import {
  getListings,
  createListing,
  updateListingStatus,
  deleteListing,
  recordContact,
  getContactedListings,
  upsertUser,
  deleteUserData,
  exportUserData,
  createReport,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../src/lib/db.ts";

test("Integration: Privacy Protection & Masked Email for Logged-Out Users", async () => {
  const publicListings = await getListings(false);
  assert.ok(publicListings.length >= 12, "At least 12 realistic seed listings exist");

  for (const l of publicListings) {
    assert.match(
      l.ownerEmail,
      /••/,
      `Public listing ${l.id} must have masked ownerEmail (found: ${l.ownerEmail})`
    );
  }

  const authenticatedListings = await getListings(true);
  for (const l of authenticatedListings) {
    assert.ok(
      l.ownerEmail.includes("@gmail.com"),
      `Authenticated listing ${l.id} must expose verified Gmail (found: ${l.ownerEmail})`
    );
  }
});

test("Integration: 10 Connect Actions / Day Rate Limit", async () => {
  const testApplicant = `applicant-${Date.now()}@gmail.com`;
  const dummyListingId = "lst-sih-railway-01";

  // Execute 10 contacts successfully
  for (let i = 0; i < 10; i++) {
    const res = await recordContact(testApplicant, dummyListingId);
    assert.equal(res.success, true);
    assert.equal(res.remainingToday, 9 - i);
  }

  // 11th contact in 24 hours must be rejected
  const limitedRes = await recordContact(testApplicant, dummyListingId);
  assert.equal(limitedRes.success, false);
  assert.equal(limitedRes.remainingToday, 0);
  assert.match(limitedRes.error || "", /Daily outreach limit reached/);

  // Check contacted history for applicant
  const contactedListings = await getContactedListings(testApplicant);
  assert.ok(contactedListings.some((l) => l.id === dummyListingId));
});

test("Integration: Owner Authentication & IDOR Protection", async () => {
  const ownerEmail = `creator-${Date.now()}@gmail.com`;
  const imposterEmail = "imposter@gmail.com";

  // Create listing
  const newListing = await createListing({
    ownerId: "usr-test-owner",
    ownerName: "Test Creator",
    ownerEmail,
    ownerCollege: "IIT Delhi",
    ownerRole: "Systems Hacker",
    type: "hackathon",
    title: "Integration Test Kernel Driver",
    event: "Kernel Hack 2026",
    deadline: "Nov 30, 2026",
    skillsNeeded: ["C", "Rust", "Linux"],
    slots: 1,
    totalSlots: 3,
    description: "Testing strict owner authentication and access control rules.",
  });

  assert.ok(newListing.id.startsWith("lst-"));
  assert.equal(newListing.status, "open");

  // Imposter tries to mark filled -> must fail with 403 authorization error
  const unauthorizedUpdate = await updateListingStatus(
    newListing.id,
    imposterEmail,
    "filled"
  );
  assert.equal(unauthorizedUpdate.success, false);
  assert.match(unauthorizedUpdate.error || "", /Only the verified creator/);

  // Imposter tries to delete -> must fail
  const unauthorizedDelete = await deleteListing(newListing.id, imposterEmail);
  assert.equal(unauthorizedDelete.success, false);
  assert.match(unauthorizedDelete.error || "", /Only the verified creator/);

  // Owner marks filled -> must succeed
  const authorizedUpdate = await updateListingStatus(
    newListing.id,
    ownerEmail,
    "filled"
  );
  assert.equal(authorizedUpdate.success, true);
  assert.equal(authorizedUpdate.listing?.status, "filled");

  // Owner renews 30 days -> must succeed and set status to open
  const renewUpdate = await updateListingStatus(
    newListing.id,
    ownerEmail,
    "renew"
  );
  assert.equal(renewUpdate.success, true);
  assert.equal(renewUpdate.listing?.status, "open");

  // Owner deletes -> must succeed
  const authorizedDelete = await deleteListing(newListing.id, ownerEmail);
  assert.equal(authorizedDelete.success, true);
});

test("Integration: User Data Cascading Deletion & GDPR/DPDP Export", async () => {
  const userEmail = `gdpr-user-${Date.now()}@gmail.com`;

  // Upsert user
  await upsertUser({
    id: `usr-${Date.now()}`,
    name: "GDPR Test User",
    email: userEmail,
    role: "Researcher",
    college: "GBU",
    skills: ["Python", "LaTeX"],
    lookingFor: "research",
    bio: "Data privacy test profile",
    consentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  // Create an associated listing
  const userListing = await createListing({
    ownerId: "usr-gdpr",
    ownerName: "GDPR Test User",
    ownerEmail: userEmail,
    ownerCollege: "GBU",
    ownerRole: "Researcher",
    type: "research",
    title: "Quantum Information Theory Study",
    event: "QIP 2027",
    deadline: "Jan 10, 2027",
    skillsNeeded: ["Quantum Computing", "Python"],
    slots: 1,
    totalSlots: 2,
    description: "Collaborative research on error correction codes.",
  });

  // Verify export format
  const exported = await exportUserData(userEmail);
  assert.ok(exported.exportedAt);
  assert.equal(exported.profile?.email, userEmail);
  assert.equal(exported.listings.length, 1);
  assert.equal(exported.listings[0].id, userListing.id);

  // Delete user account & cascade
  const deleteResult = await deleteUserData(userEmail);
  assert.equal(deleteResult, true);

  // Verify data is deleted
  const postDeleteExport = await exportUserData(userEmail);
  assert.equal(postDeleteExport.profile, null);
  assert.equal(postDeleteExport.listings.length, 0);
  assert.equal(postDeleteExport.contactHistory.length, 0);
});

test("Integration: Moderation Report Creation", async () => {
  const report = await createReport({
    reporterEmail: "moderation-tester@gmail.com",
    targetType: "listing",
    targetId: "lst-sih-railway-01",
    reason: "Spam / Unsolicited Promotion",
    details: "Testing report audit submission flow",
  });

  assert.ok(report.id.startsWith("rep-"));
  assert.equal(report.status, "pending");
  assert.equal(report.reporterEmail, "moderation-tester@gmail.com");
});

test("Integration: Cross-Device Blocking & UGC Safety Filtering", async () => {
  const blockerEmail = `blocker-${Date.now()}@gmail.com`;
  const blockedEmail = `spammer-${Date.now()}@gmail.com`;

  // 1. Initially no blocks
  let blocks = await getBlockedUsers(blockerEmail);
  assert.equal(blocks.length, 0);

  // 2. Create listing owned by spammer
  const spamListing = await createListing({
    ownerId: "usr-spammer",
    ownerName: "Spammer Account",
    ownerEmail: blockedEmail,
    ownerCollege: "Spam University",
    ownerRole: "Promoter",
    type: "hackathon",
    title: "Unsolicited Crypto Promotion",
    event: "Web3 Hackathon",
    deadline: "Dec 31, 2026",
    skillsNeeded: ["Solidity"],
    slots: 1,
    totalSlots: 4,
    description: "Spam listing created to test UGC blocking policy.",
  });

  // Blocker can see it initially
  let feedBeforeBlock = await getListings(true, blockerEmail);
  assert.ok(feedBeforeBlock.some((l) => l.id === spamListing.id));

  // 3. Blocker blocks spammer
  const blockResult = await blockUser(blockerEmail, blockedEmail);
  assert.equal(blockResult.success, true);

  // Verify getBlockedUsers returns spammer
  blocks = await getBlockedUsers(blockerEmail);
  assert.ok(blocks.includes(blockedEmail));

  // 4. Listing is immediately hidden from blocker's feed
  let feedAfterBlock = await getListings(true, blockerEmail);
  assert.equal(feedAfterBlock.some((l) => l.id === spamListing.id), false);

  // 5. Contact is blocked between them
  const contactAttempt = await recordContact(blockerEmail, spamListing.id);
  assert.equal(contactAttempt.success, false);
  assert.equal(contactAttempt.error, "You cannot contact this user.");

  // 6. Unblock restores communication
  const unblockResult = await unblockUser(blockerEmail, blockedEmail);
  assert.equal(unblockResult.success, true);
  blocks = await getBlockedUsers(blockerEmail);
  assert.equal(blocks.includes(blockedEmail), false);

  // Cleanup listing
  await deleteListing(spamListing.id, blockedEmail);
});

test("Integration: RLS Isolation — User B cannot read or modify User A's blocks", async () => {
  const userA = `user-a-${Date.now()}@gmail.com`;
  const userB = `user-b-${Date.now()}@gmail.com`;
  const target = `target-${Date.now()}@gmail.com`;

  // 1. User A blocks target
  const blockResult = await blockUser(userA, target);
  assert.equal(blockResult.success, true);

  // 2. User A can see their block
  const userABlocks = await getBlockedUsers(userA);
  assert.deepEqual(userABlocks, [target]);

  // 3. User B queries their blocks -> must NOT see User A's block
  const userBBlocks = await getBlockedUsers(userB);
  assert.equal(userBBlocks.includes(target), false);

  // 4. User B attempts to unblock target on behalf of User A -> must not affect User A's block
  await unblockUser(userB, target);
  const userABlocksStillPresent = await getBlockedUsers(userA);
  assert.deepEqual(userABlocksStillPresent, [target]);

  // Clean up
  await unblockUser(userA, target);
  const cleaned = await getBlockedUsers(userA);
  assert.equal(cleaned.length, 0);
});


