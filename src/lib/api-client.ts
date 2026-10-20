import { getSupabaseBrowserClient } from "./supabase-browser.ts";

/**
 * Retrieves the active session Bearer token for API requests.
 * Uses real Supabase session access token when Supabase is configured,
 * with localStorage fallback for local development & automated test sessions.
 */
export async function getAuthHeader(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return `Bearer ${data.session.access_token}`;
      }
    } catch {
      // Fallback to storage
    }
  }

  try {
    const fallbackToken = localStorage.getItem("synqsquad_token");
    if (fallbackToken) {
      return `Bearer ${fallbackToken}`;
    }
  } catch {}

  return null;
}

/**
 * Enterprise authenticated fetch wrapper.
 * Automatically injects the Authorization Bearer header from the active Supabase session.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const authHeader = await getAuthHeader();
  const headers = new Headers(init?.headers);

  if (authHeader && !headers.has("Authorization") && !headers.has("authorization")) {
    headers.set("Authorization", authHeader);
  }

  return fetch(input, { ...init, headers });
}
