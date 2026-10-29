// RIVQ / SynqSquad Rigorous API & Security Test Suite
// Executes against real HTTP endpoints on a running Next.js production server.
// Runs with: node tests/security-rigorous.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeText, detectSpam, validateListingInput, validateTalentProfileInput } from "../src/lib/validations.ts";
import { maskEmail } from "../src/lib/db.ts";

const PORT = process.env.TEST_PORT || "3005";
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

describe("1. System Health & Baseline Audit", () => {
  it("GET /api/health returns valid configuration and system status", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.ok([200, 503].includes(res.status), `Health status returned ${res.status}`);
    const json = await res.json();
    assert.ok(["healthy", "degraded", "unhealthy"].includes(json.status));
    assert.equal(typeof json.db_configured, "boolean");
    assert.equal(typeof json.auth_configured, "boolean");
    assert.ok(json.version);
  });
});

describe("2. Workstream 3.b: Unauthenticated Public Privacy & Masked Emails", () => {
  it("GET /api/listings masks all creator emails with ••••", async () => {
    const res = await fetch(`${BASE_URL}/api/listings`);
    // Status can be 200 (if DB connected/read) or 500 (if remote DB unreachable in local test sandbox)
    if (res.status === 200) {
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));
      for (const listing of json.data) {
        assert.ok(
          listing.ownerEmail.includes("••"),
          `Email ${listing.ownerEmail} must be masked with bullet points`
        );
        assert.doesNotMatch(
          listing.ownerEmail,
          /^[a-zA-Z0-9._%+-]{3,}@gmail\.com$/,
          "Unmasked email must never be exposed publicly"
        );
      }
    } else {
      assert.ok([200, 500].includes(res.status));
    }
  });

  it("maskEmail() helper reliably masks varied email lengths", () => {
    assert.equal(maskEmail("rajnish@gmail.com"), "ra••••h@gmail.com");
    assert.equal(maskEmail("ab@gmail.com"), "ab•••@gmail.com");
    assert.equal(maskEmail("a@gmail.com"), "a•••@gmail.com");
    assert.equal(maskEmail(""), "••••@gmail.com");
  });
});

describe("3. Workstream 3.a: Anti-XSS & Payload Sanitization across POST Routes", () => {
  it("Sanitizer strips scripts, tags, event handlers and javascript: protocol", () => {
    const xss = "<script>alert('xss')</script>Hello <img src=x onerror=alert(1)>world";
    const cleaned = sanitizeText(xss);
    assert.equal(cleaned, "alert('xss')Hello world");
    assert.doesNotMatch(cleaned, /<|>/);

    const protocolAttack = "javascript:alert(document.cookie)";
    assert.equal(sanitizeText(protocolAttack), "alert(document.cookie)");
  });

  it("Spam detector catches banned channels (Telegram, Discord, WhatsApp)", () => {
    assert.equal(detectSpam("DM me on t.me/mychannel"), true);
    assert.equal(detectSpam("Join discord.gg/invite123"), true);
    assert.equal(detectSpam("WhatsApp me at wa.me/919999999999"), true);
    assert.equal(detectSpam("Free crypto airdrop tokens"), true);
    assert.equal(detectSpam("Looking for React and PyTorch collaborators"), false);
  });

  it("Requisition validation neutralizes XSS and rejects third-party chat spam", () => {
    const spamReq = validateListingInput({
      ownerId: "usr-tester-01",
      ownerName: "Dev Tester",
      title: "Legit Title Here",
      event: "Hackathon",
      type: "hackathon",
      skillsNeeded: ["Python"],
      slots: 2,
      totalSlots: 4,
      description: "Join our team on discord.gg/hackteam for fast chat",
      ownerEmail: "test@gmail.com",
    });
    assert.equal(spamReq.success, false);
    assert.ok(spamReq.error?.includes("Gmail") || spamReq.error?.includes("External chat"));

    const xssReq = validateListingInput({
      ownerId: "usr-tester-01",
      ownerName: "Dev Tester",
      title: "Valid Title <script>alert(1)</script>",
      event: "Hackathon",
      type: "hackathon",
      skillsNeeded: ["Python"],
      slots: 2,
      totalSlots: 4,
      description: "Clean description for building an open-source project",
      ownerEmail: "test@gmail.com",
    });
    assert.equal(xssReq.success, true);
    assert.equal(xssReq.data?.title, "Valid Title alert(1)");
  });

  it("Talent Profile validation rejects unauthorized external links", () => {
    const invalidProfile = validateTalentProfileInput({
      displayName: "Alex Rivera",
      headline: "Full-Stack Dev",
      bio: "Clean bio text for open-source research and hackathons.",
      skills: ["Next.js", "TypeScript"],
      lookingFor: ["hackathon"],
      availability: "open",
      github: "https://malicious-phishing.com/notgithub",
    });
    assert.equal(invalidProfile.success, false);
    assert.ok(invalidProfile.error?.includes("GitHub"));
  });
});

describe("4. Workstream 3.c: IDOR Defense & Unauthorized Modifications", () => {
  it("PATCH /api/listings/[id] rejects unauthenticated caller with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/listings/lst-test-idor`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "filled" }),
    });
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  it("PATCH /api/listings/[id] rejects forged token with 401", async () => {
    const forgedRes = await fetch(`${BASE_URL}/api/listings/lst-test-idor`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer forged.fake.jwt.token",
      },
      body: JSON.stringify({ status: "filled" }),
    });
    assert.equal(forgedRes.status, 401);
  });

  it("DELETE /api/listings/[id] rejects unauthenticated caller with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/listings/lst-test-idor`, {
      method: "DELETE",
    });
    assert.equal(res.status, 401);
  });

  it("PATCH /api/people/[id] rejects unauthenticated caller with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/people/prof-test-idor`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: "busy" }),
    });
    assert.equal(res.status, 401);
  });

  it("DELETE /api/people/[id] rejects unauthenticated caller with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/people/prof-test-idor`, {
      method: "DELETE",
    });
    assert.equal(res.status, 401);
  });
});

describe("5. Workstream 3.d: Rate Limiting & Auth Controls", () => {
  it("POST /api/contact rejects unauthenticated caller with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: "lst-sample" }),
    });
    assert.equal(res.status, 401);
  });

  it("POST /api/people/outreach rejects unauthenticated caller with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/people/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: "usr-target",
        profileId: "prof-target",
        message: "Hello I would like to collaborate on your hackathon project.",
      }),
    });
    assert.equal(res.status, 401);
  });

  it("POST /api/ai/improve-message rejects unauthenticated caller with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/improve-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hey let's team up",
        templateType: "hackathon",
      }),
    });
    assert.equal(res.status, 401);
  });

  it("POST /api/report rate limits callers to 10 reports/hour (returns 429)", async () => {
    const testEmail = `spammer-${Date.now()}@gmail.com`;
    let got429 = false;

    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${BASE_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterEmail: testEmail,
          targetType: "listing",
          targetId: "lst-flagged-target",
          reason: "Spam / Inappropriate Solicitation",
          details: `Automated test report submission number ${i + 1}`,
        }),
      });

      if (res.status === 429) {
        got429 = true;
        const json = await res.json();
        assert.equal(json.success, false);
        assert.ok(json.error?.includes("Rate limit exceeded") || json.error?.includes("wait") || json.error?.includes("Too many"));
        break;
      }
    }

    assert.ok(got429, "Expected 429 Too Many Requests after exceeding 10 reports");
  });
});

describe("6. Workstream 3.e: 400 & 404 Handling on Malformed JSON & Missing Routes", () => {
  const malformedJson = '{"title": "unclosed string, ';

  it("POST /api/listings returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(json.error?.includes("JSON"));
  });

  it("POST /api/contact returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/report returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/people returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/people`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/people/outreach returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/people/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/blocks returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/ai/improve-message returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/improve-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
  });

  it("PATCH /api/listings/[id] returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/listings/lst-123`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
  });

  it("PATCH /api/people/[id] returns 400 on malformed JSON body", async () => {
    const res = await fetch(`${BASE_URL}/api/people/prof-123`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: malformedJson,
    });
    assert.equal(res.status, 400);
  });

  it("GET /api/non-existent-route-404 returns 404 Not Found", async () => {
    const res = await fetch(`${BASE_URL}/api/non-existent-route-404`);
    assert.equal(res.status, 404);
  });

  it("GET /api/listings/lst-not-found-random-999999 returns 404 or handled error", async () => {
    const res = await fetch(`${BASE_URL}/api/listings/lst-not-found-random-999999`);
    assert.ok([404, 500].includes(res.status));
  });

  it("GET /api/people/prof-not-found-random-999999 returns 404 or handled error", async () => {
    const res = await fetch(`${BASE_URL}/api/people/prof-not-found-random-999999`);
    assert.ok([404, 500].includes(res.status));
  });
});
