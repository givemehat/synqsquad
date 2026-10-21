import { createClient } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  photo?: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  token?: string;
  error?: string;
  status: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

/**
 * Extracts and verifies the caller's identity strictly from a Supabase Auth session token.
 * NEVER trusts request body, query params, or client headers (x-user-email) for identity.
 * NO test backdoors, NO test signature bypasses in production bundle.
 */
export async function getAuthenticatedUser(
  request: Request | { headers: { get(name: string): string | null } }
): Promise<AuthResult> {
  // 1. Extract Bearer token from Authorization header or Supabase cookies
  let token: string | null = null;
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    // Check cookies for Supabase auth session token
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );

    // Standard Supabase cookie formats
    for (const [key, val] of Object.entries(cookies)) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed[0]) token = parsed[0];
          else if (parsed.access_token) token = parsed.access_token;
        } catch {
          token = val;
        }
        break;
      } else if (key === "sb-access-token") {
        token = val;
        break;
      }
    }
  }

  if (!token) {
    return {
      user: null,
      error: "Authentication required. Please sign in with Google.",
      status: 401,
    };
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[Auth Error] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY on server."
    );
    return {
      user: null,
      error: "Authentication service temporarily unavailable. Please try again later.",
      status: 503,
    };
  }

  // 2. Authoritative verification via Supabase Auth API
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return {
        user: null,
        error: error?.message || "Invalid, expired, or revoked authentication session.",
        status: 401,
      };
    }

    const u = data.user;
    if (!u.email) {
      return {
        user: null,
        error: "Authenticated user must have an associated email address.",
        status: 401,
      };
    }

    return {
      user: {
        id: u.id,
        email: u.email.toLowerCase().trim(),
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email.split("@")[0],
        photo: u.user_metadata?.avatar_url || undefined,
      },
      token,
      status: 200,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Auth verification error";
    console.error("[Auth Error] getUser exception:", msg);
    return {
      user: null,
      error: "Authentication failed. Please sign in again.",
      status: 401,
    };
  }
}
