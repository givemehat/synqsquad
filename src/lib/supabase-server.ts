import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient, isAdminConfigured } from "./supabase-admin.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

function validateDatabaseEnvironment(): void {
  // Test safety guard
  if (process.env.NODE_ENV === "test" || process.env.TEST_RUNNER === "true") {
    const allowedTestUrl = process.env.TEST_SUPABASE_URL;
    if (allowedTestUrl && supabaseUrl !== allowedTestUrl) {
      throw new Error(
        `FATAL SAFETY GUARD: Test suite URL (${supabaseUrl}) does not match TEST_SUPABASE_URL allowlist (${allowedTestUrl}).`
      );
    }
  }

  if (!supabaseUrl) {
    throw new Error(
      "CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_URL is missing. Database access failed."
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      "CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) is missing. Database access failed."
    );
  }
}

/**
 * Public unauthenticated Supabase client.
 * Uses anon/publishable key. Queries execute under Postgres 'anon' role.
 * Queries on raw tables are blocked by RLS; queries on public views return masked data.
 */
export function getSupabaseAnonClient(): SupabaseClient {
  validateDatabaseEnvironment();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Authenticated user Supabase client.
 * Uses anon key with user's verified Bearer JWT.
 * Queries execute under Postgres 'authenticated' role with auth.uid() matching the user.
 * Row-Level Security (RLS) is strictly enforced by PostgreSQL as defense in depth.
 */
export function getSupabaseUserClient(userJwt: string): SupabaseClient {
  validateDatabaseEnvironment();

  if (!userJwt || typeof userJwt !== "string") {
    throw new Error("AUTHENTICATION ERROR: User JWT required for user-scoped database access.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${userJwt}`,
      },
    },
  });
}

/**
 * Backward-compatible helper:
 * If token is provided, returns user-scoped client with RLS.
 * If no token is provided, returns public anon client (or admin client if admin configured and needed).
 */
export function getSupabaseServerClient(token?: string): SupabaseClient {
  if (token) {
    return getSupabaseUserClient(token);
  }
  // If service role is configured on server, fallback to admin only for internal jobs
  if (isAdminConfigured()) {
    return getSupabaseAdminClient();
  }
  return getSupabaseAnonClient();
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
