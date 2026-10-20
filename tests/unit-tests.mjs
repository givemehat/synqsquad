// Unit and Security tests for RIVQ
// Validates Supabase RLS logic, ownership rules, email privacy masking, and rate limits

import { validateListingInput, detectSpam, sanitizeText } from "../src/lib/validations.ts";
import {
  getListings,
  getListingById,
  createListing,
  updateListingStatus,
  deleteListing,
  maskEmail,
  recordContact,
  exportUserData,
} from "../src/lib/supabase-db.ts";

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

async function runAllTests() {
  console.log("\n🧪 Running RIVQ Supabase & Security Unit Tests...");

  // 1. Sanitization & XSS
  console.log("\n[Test 1] Input Sanitization & Anti-XSS");
  const dirtyInput = "<script>alert('xss')</script>Hello & welcome <img src=x onerror=alert(1)>";
  const sanitized = sanitizeText(dirtyInput);
  assert(!sanitized.includes("<script>"), "Strips raw script tags");
  assert(!sanitized.includes("<img"), "Strips raw img tag angle brackets");

  // 2. Anti-Spam (Enforcing Gmail-only USP)
  console.log("\n[Test 2] Enforcing Gmail-only USP & Anti-Spam Detection");
  assert(detectSpam("Contact me on telegram @squadlead"), "Blocks Telegram handles");
  assert(detectSpam("Join our discord: discord.gg/hackathon"), "Blocks Discord invite links");
  assert(detectSpam("Chat on whatsapp +919876543210"), "Blocks WhatsApp invitations");
  assert(detectSpam("Claim free token airdrop now"), "Blocks crypto airdrop spam");
  assert(!detectSpam("Looking for a PyTorch developer for NeurIPS paper. Connect via Gmail."), "Allows clean academic & hackathon copy");

  // 3. Email Masking & Privacy (RLS Public Read Policy)
  console.log("\n[Test 3] Contact Privacy & Email Masking");
  const masked1 = maskEmail("rajnishsingh.dev@gmail.com");
  assert(masked1.startsWith("ra") && masked1.endsWith("@gmail.com") && masked1.includes("••••"), "Properly masks Gmail username for unauthenticated public viewers");
  const maskedShort = maskEmail("ab@gmail.com");
  assert(maskedShort.includes("•••"), "Properly masks short email usernames");

  // Test public feed masks emails
  const publicListings = await getListings(false);
  assert(publicListings.length > 0, "Public feed returns open listings");
  const allMasked = publicListings.every((l) => l.ownerEmail.includes("••"));
  assert(allMasked, "Logged-out users CANNOT read creator emails in feed response (RLS public read protection)");

  // Test authenticated feed returns verified emails
  const authListings = await getListings(true);
  const allUnmasked = authListings.every((l) => (l.ownerEmail.includes("@gmail.com") || l.ownerEmail.includes("@example.com")) && !l.ownerEmail.includes("••"));
  assert(allUnmasked, "Authenticated users receive verified email addresses for direct outreach");

  // 4. Ownership & Authorization (User A cannot edit/delete User B's listing)
  console.log("\n[Test 4] RLS Ownership Protection: User A vs User B");
  const userA = "alice.research@gmail.com";
  const userB = "bob.hacker@gmail.com";

  // Create listing owned by User A
  const createdByA = await createListing({
    ownerId: "usr-alice",
    ownerName: "Alice Sharma",
    ownerEmail: userA,
    ownerCollege: "IIT Bombay",
    ownerRole: "Quantum Researcher",
    type: "research",
    title: "Quantum Circuit Optimization for IEEE Quantum",
    event: "IEEE Quantum 2026",
    skillsNeeded: ["Qiskit", "Python"],
    slots: 1,
    totalSlots: 3,
    description: "Developing quantum error mitigation circuits using Qiskit. Looking for an algorithmic collaborator.",
  });

  assert(createdByA && createdByA.id, "User A successfully creates listing");

  // User B tries to update User A's listing (Mark as filled)
  const userBUpdateAttempt = await updateListingStatus(createdByA.id, userB, "filled");
  assert(userBUpdateAttempt === null, "User B CANNOT modify User A's listing (RLS rejected)");

  // User A updates their own listing
  const userAUpdate = await updateListingStatus(createdByA.id, userA, "filled");
  assert(userAUpdate !== null && userAUpdate.status === "filled", "User A can successfully update their own listing");

  // User B tries to delete User A's listing
  const userBDeleteAttempt = await deleteListing(createdByA.id, userB);
  assert(!userBDeleteAttempt || (await getListingById(createdByA.id)) !== null, "User B CANNOT delete User A's listing");

  // 5. Daily Connect Rate Limit (Max 10 / day & Parallel Requests)
  console.log("\n[Test 5] Daily Connect Rate Limit (Max 10 / day & Parallel Requests)");
  const testUser = `rate-limit-test-${Date.now()}@gmail.com`;
  for (let i = 0; i < 10; i++) {
    const res = await recordContact(testUser, `listing-${i}`);
    assert(res.success, `Connect action ${i + 1}/10 allowed`);
  }
  const eleventhAttempt = await recordContact(testUser, `listing-11`);
  assert(!eleventhAttempt.success, "11th Connect action is blocked by strict rate limit");
  assert(eleventhAttempt.remainingToday === 0, "remainingToday is reported as 0");

  // Parallel requests stress test
  const parallelUser = `parallel-test-${Date.now()}@gmail.com`;
  const parallelAttempts = await Promise.all(
    Array.from({ length: 15 }, (_, i) => recordContact(parallelUser, `listing-par-${i}`))
  );
  const successfulParallel = parallelAttempts.filter((r) => r.success).length;
  const blockedParallel = parallelAttempts.filter((r) => !r.success).length;
  assert(successfulParallel <= 10, `Parallel burst correctly capped at max 10 (allowed: ${successfulParallel})`);
  assert(blockedParallel >= 5, `Excess parallel requests were blocked (blocked: ${blockedParallel})`);

  // 6. DPDP Act 2023 / GDPR Data Export
  console.log("\n[Test 6] DPDP Act 2023 / GDPR Compliance (Export)");
  const sampleExportEmail = "export-test@gmail.com";
  const exportData = await exportUserData(sampleExportEmail);
  assert(exportData && Array.isArray(exportData.listings), "Export returns structured JSON format with listings array");
  assert(Array.isArray(exportData.contactHistory), "Export includes contactHistory array");

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
