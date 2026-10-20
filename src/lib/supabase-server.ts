import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Server-side Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY when available (for administrative / moderation writes),
 * or falls back to anon / publishable key with optional user session token for RLS isolation.
 */
export function getSupabaseServerClient(token?: string): SupabaseClient {
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
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}
