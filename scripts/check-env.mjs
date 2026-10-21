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

// Auto-alias between NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
} else if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
const hasClientKey = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
);
const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

// On Vercel build environments, Sensitive Environment Variables are withheld
// during the build phase and injected at runtime into the serverless Lambdas.
const isVercelBuild = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);

const displayStatus = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", present: hasSupabaseUrl, required: true },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", present: hasClientKey, required: true },
  { 
    name: "SUPABASE_SERVICE_ROLE_KEY", 
    present: hasServiceRoleKey, 
    required: !isVercelBuild,
    note: isVercelBuild && !hasServiceRoleKey ? " (Runtime-injected Vercel Sensitive Variable)" : ""
  },
  { name: "NEXT_PUBLIC_APP_URL", present: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()), required: false },
  { name: "PLAY_APP_SIGNING_SHA256", present: Boolean(process.env.PLAY_APP_SIGNING_SHA256?.trim()), required: false },
];

const prohibitedProduction = [
  "ALLOW_TEST_AUTH",
  "DEMO_MODE",
];

console.log("\n🔒 SynqSquad Environment Configuration Audit:");
console.log("================================================");

let hasErrors = false;

// 1. Check required & optional variables
for (const item of displayStatus) {
  const icon = item.present ? "✓" : item.required ? "✗" : "ℹ";
  const note = item.note || "";
  const status = item.present ? "PRESENT" : item.required ? "MISSING" : `MISSING (optional)${note}`;
  console.log(`  ${icon} ${item.name}: ${status}`);
  if (item.required && !item.present && process.env.NODE_ENV === "production" && process.env.CI_SKIP_ENV_CHECK !== "true") {
    hasErrors = true;
  }
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
