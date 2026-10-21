import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * ============================================================================
 * ISOLATED ADMINISTRATIVE SUPABASE CLIENT (SERVICE ROLE)
 * ============================================================================
 * 
 * AUDIT NOTICE & SECURITY PRINCIPLES:
 * 1. SUPABASE_SERVICE_ROLE_KEY bypasses PostgreSQL Row-Level Security (RLS).
 * 2. This module is strictly isolated for narrow operations that CANNOT be executed
 *    with a standard user JWT:
 *      a. Cascade permanent account deletion (DPDP Act 2023 / GDPR erasure across tables)
 *      b. Admin moderation reports submission (reports table is restricted from public select)
 *      c. Atomic advisory-lock RPC functions for fraud prevention & rate limiting
 *      d. Test environment user provisioning via admin auth API
 * 3. All standard user-scoped reads, writes, updates, and deletes MUST use
 *    `getSupabaseUserClient(jwt)` in `src/lib/supabase-server.ts`.
 * 4. This key MUST NEVER be exposed to the browser or prefixed with NEXT_PUBLIC_.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function validateAdminEnvironment(): void {
  // Test environment safety guard:
  // If running in test mode, ensure TEST_SUPABASE_URL is configured and matches
  if (process.env.NODE_ENV === "test" || process.env.TEST_RUNNER === "true") {
    const allowedTestUrl = process.env.TEST_SUPABASE_URL;
    if (!allowedTestUrl) {
      throw new Error(
        "FATAL SAFETY GUARD: Automated tests require TEST_SUPABASE_URL to be set in environment."
      );
    }
    if (supabaseUrl !== allowedTestUrl) {
      throw new Error(
        `FATAL SAFETY GUARD: Test suite URL (${supabaseUrl}) does not match TEST_SUPABASE_URL allowlist (${allowedTestUrl}).`
      );
    }
  }

  if (!supabaseUrl) {
    throw new Error(
      "CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_URL environment variable is missing."
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "CONFIGURATION ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing on server."
    );
  }
}

/**
 * Obtains privileged admin client.
 * Every invocation must be traceable to one of the authorized administrative tasks.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  validateAdminEnvironment();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function isAdminConfigured(): boolean {
  return Boolean(supabaseUrl && serviceRoleKey);
}
