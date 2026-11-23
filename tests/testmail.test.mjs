import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Load .env.local if present
const envLocalPath = path.resolve(rootDir, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function runTests() {
  console.log("🧪 Starting Testmail.app Integration Test...");

  const apiKey = process.env.TESTMAIL_API_KEY;
  const namespace = process.env.TESTMAIL_NAMESPACE;

  assert(apiKey, "TESTMAIL_API_KEY must be defined");
  assert(namespace, "TESTMAIL_NAMESPACE must be defined");
  assert.equal(namespace, "vatxl", "Expected namespace vatxl");

  console.log(`✓ Namespace verified: ${namespace}`);

  // Test dynamic inbox address generation
  const tag = "talent_inquiry_test";
  const expectedAddress = `${namespace}.${tag}@inbox.testmail.app`;
  console.log(`✓ Generated Dynamic Inbox: ${expectedAddress}`);

  // Test live API connectivity
  const url = `https://api.testmail.app/api/json?apikey=${apiKey}&namespace=${namespace}&tag=${tag}&limit=5`;
  const res = await fetch(url);
  assert.equal(res.status, 200, "Testmail API must respond with HTTP 200");

  const data = await res.json();
  assert.equal(data.result, "success", "Testmail API result should be success");
  assert(Array.isArray(data.emails), "Emails field must be an array");

  console.log(`✓ Live API query successful (HTTP 200, count: ${data.count})`);
  console.log("🎉 All Testmail.app tests PASSED cleanly!");
}

runTests().catch((err) => {
  console.error("❌ Testmail test failed:", err);
  process.exit(1);
});
