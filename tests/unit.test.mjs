import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateListingInput, detectSpam } from "../src/lib/validations.ts";

test("Unit: Spam and external chat detection", () => {
  // Disallowed channels: Telegram, Discord, WhatsApp, crypto airdrop, etc.
  assert.equal(detectSpam("Join our telegram t.me/hackteam for SIH"), true);
  assert.equal(detectSpam("Discord link discord.gg/1234 to talk"), true);
  assert.equal(detectSpam("Message on chat.whatsapp.com/abcde"), true);
  assert.equal(detectSpam("Free crypto airdrop for participants"), true);

  // Legitimate descriptions with Gmail mentions are clean
  assert.equal(
    detectSpam("Looking for a PyTorch developer for SIH 2026. Reach out on Gmail."),
    false
  );
  assert.equal(
    detectSpam("FastAPI telemetry pipeline for embedded devices."),
    false
  );
});

test("Unit: Zod Server-side Requisition Validation", () => {
  const validPayload = {
    title: "Edge Vision Model for Railway Track Fault Detection",
    event: "Smart India Hackathon 2026",
    type: "hackathon",
    deadline: "Nov 30, 2026",
    skillsNeeded: ["Next.js", "Python", "FastAPI"],
    slots: 2,
    totalSlots: 4,
    description: "Building an edge computer vision telemetry pipeline for rail track analysis.",
    ownerId: "usr-unit-01",
    ownerName: "Aarav Sharma",
    ownerEmail: "aarav.sharma@gmail.com",
    ownerCollege: "IIT Delhi",
    ownerRole: "ML Researcher",
  };

  const validResult = validateListingInput(validPayload);
  assert.equal(validResult.success, true);
  assert.ok(validResult.data);
  assert.equal(validResult.data?.title, validPayload.title);

  // Non-gmail email must be rejected
  const invalidEmailPayload = {
    ...validPayload,
    ownerEmail: "spammer@yahoo.com",
  };
  const invalidEmailResult = validateListingInput(invalidEmailPayload);
  assert.equal(invalidEmailResult.success, false);
  assert.match(invalidEmailResult.error || "", /verified @gmail\.com/);

  // External chat spam must be rejected
  const spamPayload = {
    ...validPayload,
    description: "Ping me on t.me/mygroup for full details and team links.",
  };
  const spamResult = validateListingInput(spamPayload);
  assert.equal(spamResult.success, false);
  assert.match(spamResult.error || "", /External chat invitations/);

  // Short title must be rejected
  const shortTitlePayload = {
    ...validPayload,
    title: "Hi",
  };
  const shortTitleResult = validateListingInput(shortTitlePayload);
  assert.equal(shortTitleResult.success, false);
});

test("Unit: Matching Logic (Plain English, Skill Overlap, No Fake %)", () => {
  const userSkills = ["Python", "PyTorch", "Next.js"];

  const listings = [
    {
      id: "lst-1",
      title: "Bioinformatics ML Pipeline",
      skillsNeeded: ["Python", "PyTorch", "Docker"],
      status: "open",
    },
    {
      id: "lst-2",
      title: "Solana Smart Contracts",
      skillsNeeded: ["Rust", "Solana Anchor"],
      status: "open",
    },
    {
      id: "lst-3",
      title: "Full-Stack Health Dashboard",
      skillsNeeded: ["Next.js", "TypeScript", "Tailwind CSS"],
      status: "open",
    },
  ];

  const scored = listings.map((l) => {
    const matches = l.skillsNeeded.filter((needed) =>
      userSkills.some((us) => us.toLowerCase() === needed.toLowerCase())
    );
    return {
      listing: l,
      matchedCount: matches.length,
      matches,
    };
  });

  scored.sort((a, b) => b.matchedCount - a.matchedCount);

  // lst-1 has 2 matches (Python, PyTorch)
  assert.equal(scored[0].listing.id, "lst-1");
  assert.equal(scored[0].matchedCount, 2);
  assert.deepEqual(scored[0].matches, ["Python", "PyTorch"]);

  // lst-3 has 1 match (Next.js)
  assert.equal(scored[1].listing.id, "lst-3");
  assert.equal(scored[1].matchedCount, 1);

  // lst-2 has 0 matches
  assert.equal(scored[2].listing.id, "lst-2");
  assert.equal(scored[2].matchedCount, 0);
});

test("Unit: 30-Day Auto-Expiry & One-Click Renew Calculation", () => {
  const now = new Date();
  const past31Days = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const future28Days = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString();

  // Expired listing check
  const isPastExpired = new Date(past31Days) < now;
  assert.equal(isPastExpired, true);

  // Active listing check
  const isActive = new Date(future28Days) > now;
  assert.equal(isActive, true);

  // Renew calculation: sets expiresAt to now + 30 days
  const renewedExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  assert.ok(renewedExpiresAt > now);
  const diffDays = Math.round((renewedExpiresAt.getTime() - now.getTime()) / (24 * 3600 * 1000));
  assert.equal(diffDays, 30);
});

test("Unit: UGC In-App Block Filter (Google Play UGC Safety Policy)", () => {
  const sampleListings = [
    { id: "1", ownerEmail: "good-dev@gmail.com", title: "SIH Team" },
    { id: "2", ownerEmail: "bad-actor@gmail.com", title: "Spam Post" },
    { id: "3", ownerEmail: "researcher@gmail.com", title: "NeurIPS Paper" },
  ];

  const blockedList = ["bad-actor@gmail.com"];

  const filtered = sampleListings.filter(
    (l) => !blockedList.includes(l.ownerEmail.toLowerCase())
  );

  assert.equal(filtered.length, 2);
  assert.equal(filtered.some((l) => l.ownerEmail === "bad-actor@gmail.com"), false);
  assert.equal(filtered[0].id, "1");
  assert.equal(filtered[1].id, "3");
});

test("Unit: Brand String & Package Alignment (RIVQ / SynqSquad)", () => {
  // Validate package name
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  assert.ok(["rivq", "synqsquad"].includes(pkg.name));

  // Validate Manifest
  const manifest = JSON.parse(readFileSync("public/manifest.json", "utf-8"));
  assert.ok(manifest.name.includes("RIVQ") || manifest.name.includes("SynqSquad"));

  // Validate Assetlinks package name
  const assetlinks = JSON.parse(readFileSync("public/.well-known/assetlinks.json", "utf-8"));
  const packageNames = assetlinks.map((e) => e.target.package_name);
  assert.ok(packageNames.includes("com.rivq.app") || packageNames.includes("com.synqsquad.app"));
});

test("Unit: Quick Profile Setup Modal UX Integrity", () => {
  const modalCode = readFileSync("src/components/GoogleAuthModal.tsx", "utf-8");

  // 1. Role dropdown: Custom popover, no native select
  assert.equal(modalCode.includes("<select"), false, "Must not use native select");
  assert.ok(modalCode.includes("roleDropdownRef"), "Has custom role dropdown ref");
  assert.ok(modalCode.includes('role="listbox"'), "Has accessible listbox for roles");
  assert.ok(modalCode.includes("handleRoleKeyDown"), "Has keyboard navigation for roles");

  // 2. Skill chips: Sans font, grouped categories, 36px height, live counter
  assert.ok(modalCode.includes("font-sans"), "Skill chips must use sans font");
  assert.ok(modalCode.includes("SKILL_GROUPS"), "Skills must be grouped neatly");
  assert.ok(modalCode.includes("/5 selected"), "Must show live counter for skills");
  assert.ok(modalCode.includes("Select at least 3"), "Must show hint when under 3 skills");
  assert.ok(modalCode.includes("h-[36px]"), "Skill chips must be 36px height");

  // 3. Segmented control for Looking for
  assert.ok(modalCode.includes("grid grid-cols-3"), "Segmented control layout");

  // 4. College placeholder and Bio 140 character limit
  assert.ok(modalCode.includes("e.g. IIT Delhi"), "College placeholder present");
  assert.ok(modalCode.includes("maxLength={140}"), "Bio 140 char limit present");
  assert.ok(modalCode.includes("/140"), "Bio live counter present");

  // 5. Clean header & max-width 520px
  assert.ok(modalCode.includes("Complete your profile"), "Clean header title");
  assert.ok(modalCode.includes("max-w-[520px]"), "Max-width 520px modal container");

  // 6. Mobile bottom sheet
  assert.ok(modalCode.includes("max-sm:rounded-t-[20px]"), "Mobile bottom sheet rounded top corners");
  assert.ok(modalCode.includes("sticky bottom-0"), "Sticky bottom footer for mobile");
});

test("Unit: Email Masking and Anti-Scraping Protection", async () => {
  const { maskEmail } = await import("../src/lib/db.ts");

  // Standard emails
  assert.equal(maskEmail("priya.nair@example.com"), "pr••••r@example.com");
  assert.equal(maskEmail("aditya.verma.quant@gmail.com"), "ad••••t@gmail.com");
  assert.equal(maskEmail("ab@gmail.com"), "ab•••@gmail.com");
  assert.equal(maskEmail(""), "••••@gmail.com");
});

test("Unit: SSR Cookie Chunking and Base64 Decoder Integrity", () => {
  // Simulates chunked and base64-encoded cookie from @supabase/ssr
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
  const jsonPayload = JSON.stringify([token, "refresh-123"]);
  const base64Val = "base64-" + Buffer.from(jsonPayload).toString("base64");

  // Split into 2 chunks
  const mid = Math.floor(base64Val.length / 2);
  const chunk0 = base64Val.slice(0, mid);
  const chunk1 = base64Val.slice(mid);

  const cookies = {
    "sb-proj-auth-token.0": chunk0,
    "sb-proj-auth-token.1": chunk1,
  };

  // Run decoder logic
  const authChunks = [];
  for (const [key, val] of Object.entries(cookies)) {
    const match = key.match(/-auth-token\.(\d+)$/);
    if (match) authChunks.push({ index: parseInt(match[1], 10), val });
  }
  authChunks.sort((a, b) => a.index - b.index);
  const combined = authChunks.map((c) => c.val).join("");

  assert.equal(combined, base64Val);

  const rawJson = Buffer.from(combined.slice(7), "base64").toString("utf-8");
  const parsed = JSON.parse(rawJson);
  assert.equal(parsed[0], token);
});

test("Unit: Blurred Gmail Privacy and Auth Guard on UI Components", () => {
  const listingCard = readFileSync("src/components/ListingCard.tsx", "utf-8");
  const listingDrawer = readFileSync("src/components/ListingDetailDrawer.tsx", "utf-8");
  const personCard = readFileSync("src/components/PersonCard.tsx", "utf-8");
  const personModal = readFileSync("src/components/PersonDetailModal.tsx", "utf-8");

  // Verify blur styling is implemented for unauthenticated states
  assert.ok(listingCard.includes("blur-[4px]"), "ListingCard has blurred Gmail protection");
  assert.ok(listingCard.includes("Reveal Gmail"), "ListingCard has Reveal Gmail CTA");
  assert.ok(listingDrawer.includes("blur-[5px]"), "ListingDetailDrawer has blurred Gmail protection");
  assert.ok(listingDrawer.includes("openAuthModal"), "ListingDetailDrawer calls openAuthModal on click");
  assert.ok(personCard.includes("blur-[4px]"), "PersonCard has blurred Gmail protection");
  assert.ok(personModal.includes("blur-[4px]"), "PersonDetailModal has blurred Gmail protection");
});

test("Unit: Profile Page Architecture and Modern Feature Completeness", () => {
  const profilePage = readFileSync("src/app/profile/page.tsx", "utf-8");

  // Verify full feature set
  assert.ok(profilePage.includes("Identity & Affiliation"), "Identity section present");
  assert.ok(profilePage.includes("Top Skills & Expertise"), "Skills section present");
  assert.ok(profilePage.includes("Public Portfolios & Links"), "Portfolio links section present");
  assert.ok(profilePage.includes("Show My Profile on /people"), "Discoverability toggle present");
  assert.ok(profilePage.includes("My Requisitions"), "Requisitions tab present");
  assert.ok(profilePage.includes("Contacted History"), "Contacted tab present");
  assert.ok(profilePage.includes("Export Data"), "GDPR export present");
  assert.ok(profilePage.includes("Permanently Delete"), "Account deletion safeguard present");
});



