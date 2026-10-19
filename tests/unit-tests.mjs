// Unit tests for SynqSquad business logic, validations, and security rules
import { validateListingInput, detectSpam, sanitizeText } from "../src/lib/validations.ts";
import { getListings, maskEmail, recordContact, exportUserData } from "../src/lib/db.ts";

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
  console.log("\n🧪 Running SynqSquad Core Unit & Security Tests...");

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

  // 3. Email Masking (Contact Privacy)
  console.log("\n[Test 3] Contact Privacy & Email Masking");
  const masked1 = maskEmail("rajnishsingh.dev@gmail.com");
  assert(masked1.startsWith("ra") && masked1.endsWith("@gmail.com") && masked1.includes("••••"), "Properly masks Gmail username for unauthenticated public viewers");
  const maskedShort = maskEmail("ab@gmail.com");
  assert(maskedShort.includes("•••"), "Properly masks short email usernames");

  // 4. Rate Limiting (Abuse Prevention - Max 10 per day)
  console.log("\n[Test 4] Daily Connect Rate Limit (Max 10 / day)");
  const testUser = `rate-limit-test-${Date.now()}@gmail.com`;
  for (let i = 0; i < 10; i++) {
    const res = await recordContact(testUser, `listing-${i}`);
    assert(res.success, `Connect action ${i + 1}/10 allowed`);
  }
  const eleventhAttempt = await recordContact(testUser, `listing-11`);
  assert(!eleventhAttempt.success, "11th Connect action is blocked by strict rate limit");
  assert(eleventhAttempt.remainingToday === 0, "remainingToday is reported as 0");

  // 5. Seed Data & Expiry Integrity
  console.log("\n[Test 5] Seed Integrity & 30-Day Expiry");
  const listings = await getListings(true);
  assert(listings.length >= 12, `Seed database contains 12+ realistic listings (found: ${listings.length})`);
  const now = new Date().getTime();
  const allValidExpiry = listings.every((l) => new Date(l.expiresAt).getTime() > now);
  assert(allValidExpiry, "All active listings have valid non-expired timestamps");

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
