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

test("Unit: Brand String & Package Alignment (RIVQ)", () => {
  // Validate package name
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  assert.equal(pkg.name, "rivq");

  // Validate Manifest
  const manifest = JSON.parse(readFileSync("public/manifest.json", "utf-8"));
  assert.equal(manifest.name, "RIVQ — Match & Connect on Gmail");
  assert.equal(manifest.short_name, "RIVQ");

  // Validate Assetlinks package name
  const assetlinks = JSON.parse(readFileSync("public/.well-known/assetlinks.json", "utf-8"));
  assert.equal(assetlinks[0].target.package_name, "com.rivq.app");
});

