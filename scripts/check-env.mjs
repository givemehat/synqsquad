#!/usr/bin/env node

/**
 * Environment audit script for SynqSquad.
 * Strictly prints only variable NAMES and status (PRESENT / MISSING).
 * NEVER prints, logs, or leaks any secret values or substrings.
 */

import fs from "fs";
import path from "path";

// Load .env.production, .env.local, or .env if present on disk
for (const envFile of [".env.production", ".env.local", ".env"]) {
  const p = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
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
}

const requiredProduction = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const optionalProduction = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
  "PLAY_APP_SIGNING_SHA256",
];

const prohibitedProduction = [
  "ALLOW_TEST_AUTH",
  "DEMO_MODE",
];

console.log("\n🔒 SynqSquad Environment Configuration Audit:");
console.log("================================================");

let hasErrors = false;

// 1. Check required variables
for (const name of requiredProduction) {
  const isPresent = Boolean(process.env[name] && process.env[name].trim().length > 0);
  console.log(`  ${isPresent ? "✓" : "✗"} ${name}: ${isPresent ? "PRESENT" : "MISSING"}`);
  if (!isPresent && process.env.NODE_ENV === "production" && process.env.CI_SKIP_ENV_CHECK !== "true") {
    hasErrors = true;
  }
}

// 2. Check optional variables
for (const name of optionalProduction) {
  const isPresent = Boolean(process.env[name] && process.env[name].trim().length > 0);
  console.log(`  ℹ ${name}: ${isPresent ? "PRESENT" : "MISSING (optional)"}`);
}

// 3. Check strictly prohibited backdoor flags
for (const name of prohibitedProduction) {
  const isPresent = Boolean(process.env[name]);
  if (isPresent) {
    console.error(`  🚨 CRITICAL VIOLATION: Prohibited backdoor variable ${name} is PRESENT!`);
    hasErrors = true;
  } else {
    console.log(`  ✓ ${name}: NOT PRESENT (compliant)`);
  }
}

console.log("================================================");

if (hasErrors) {
  console.error("❌ Environment validation failed! Missing required production variables or prohibited flags present.\n");
  process.exit(1);
} else {
  console.log("✅ Environment configuration passed validation.\n");
  process.exit(0);
}
