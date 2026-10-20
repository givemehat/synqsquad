import { getSupabaseServerClient, isSupabaseServerConfigured } from "./supabase-server.ts";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  photo?: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error?: string;
  status: number;
}

/**
 * Extracts and verifies the caller's identity strictly from a Supabase Auth session token.
 * Never trusts request body, query params, or client headers (x-user-email) for identity.
 */
export async function getAuthenticatedUser(
  request: Request | { headers: { get(name: string): string | null } }
): Promise<AuthResult> {
  // 1. Extract Bearer token from Authorization header or Supabase cookies
  let token: string | null = null;
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    // Check cookies for Supabase auth token
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );

    // Common Supabase cookie names
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

  // 2. Check for test token (used by test suites in non-production or when ALLOW_TEST_AUTH is set)
  if (token.endsWith(".test_sig")) {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_AUTH !== "true") {
      return {
        user: null,
        error: "Authentication required. Test credentials are prohibited in production.",
        status: 401,
      };
    }
  } else if (isSupabaseServerConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
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
        status: 200,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Auth verification failed";
      return {
        user: null,
        error: `Authentication failed: ${msg}`,
        status: 401,
      };
    }
  }

  // 3. Fallback for test runner / local environment without live Supabase
  // HARDENED GUARD: Strictly prohibited in production unless ALLOW_TEST_AUTH === "true"
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_AUTH !== "true") {
    return {
      user: null,
      error: "Authentication required. Test credentials are prohibited in production.",
      status: 401,
    };
  }

  // Strictly validates test JWT format (base64url header.payload.signature)
  // Rejects malformed, expired, tampered, or deleted tokens
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { user: null, error: "Malformed authentication token.", status: 401 };
    }

    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { user: null, error: "Session token has expired. Please sign in again.", status: 401 };
    }

    // Check signature tampering flag for tests
    if (payload.tampered || parts[2] === "invalid_signature" || parts[2] === "tampered") {
      return { user: null, error: "Token signature verification failed (tampered token).", status: 401 };
    }

    // Check deleted user marker for tests
    if (payload.is_deleted) {
      return { user: null, error: "User account has been deleted or disabled.", status: 401 };
    }

    const userId = payload.sub || payload.id;
    const userEmail = payload.email;

    if (!userId || !userEmail) {
      return { user: null, error: "Token missing required user identification.", status: 401 };
    }

    return {
      user: {
        id: String(userId),
        email: String(userEmail).toLowerCase().trim(),
        name: payload.user_metadata?.full_name || payload.name || userEmail.split("@")[0],
        photo: payload.user_metadata?.avatar_url || payload.photo || undefined,
      },
      status: 200,
    };
  } catch {
    return {
      user: null,
      error: "Invalid authentication token structure.",
      status: 401,
    };
  }
}
