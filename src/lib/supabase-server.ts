import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const PROD_SUPABASE_HOST = "kkndyiguzadfkakxjaaj.supabase.co";

/**
 * Server-side Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY when available (for administrative / moderation writes),
 * or falls back to anon / publishable key with optional user session token for RLS isolation.
 */
export function getSupabaseServerClient(token?: string): SupabaseClient {
  if (
    (process.env.NODE_ENV === "test" || process.env.TEST_ENV === "true") &&
    supabaseUrl.includes(PROD_SUPABASE_HOST) &&
    process.env.ALLOW_PROD_TESTS !== "true"
  ) {
    throw new Error(
      "FATAL SAFETY GUARD: Mutating or testing against live production Supabase instance (kkndyiguzadfkakxjaaj.supabase.co) is prohibited during test runs."
    );
  }

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  const apiKey = supabaseServiceRoleKey || supabaseAnonKey;
  if (!apiKey) {
    throw new Error("Missing Supabase API key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
  }

  const globalHeaders: Record<string, string> = {};
  if (token) {
    globalHeaders.Authorization = `Bearer ${token}`;
  }

  return createClient(supabaseUrl, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: globalHeaders,
    },
  });
}

export function isSupabaseServerConfigured(): boolean {
  // Automated test runs strictly default to in-memory store
  if (process.env.NODE_ENV === "test" || process.env.TEST_ENV === "true") {
    if (process.env.SUPABASE_TEST_MODE === "live_staging") {
      if (supabaseUrl.includes(PROD_SUPABASE_HOST)) {
        throw new Error(
          "FATAL SAFETY GUARD: Tests cannot run against the live production Supabase instance (kkndyiguzadfkakxjaaj.supabase.co). Configure a local emulator or isolated staging project."
        );
      }
      return Boolean(supabaseUrl && supabaseServiceRoleKey);
    }
    return false;
  }

  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}
