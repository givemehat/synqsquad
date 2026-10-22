import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseServerConfigured } from "@/lib/supabase-server";

/**
 * Validates the redirect target to prevent Open Redirect attacks.
 * Disallows external domains, protocol-relative slashes (//evil.com), backslashes, and javascript: URLs.
 */
function getSafeRedirectUrl(nextParam: string | null, requestUrl: string): URL {
  const base = new URL(requestUrl);
  if (!nextParam) {
    return new URL("/", base.origin);
  }

  // Must begin with a single slash, not double slash or backslash
  const trimmed = nextParam.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.toLowerCase().includes("javascript:") &&
    !trimmed.toLowerCase().includes("data:")
  ) {
    try {
      const resolved = new URL(trimmed, base.origin);
      if (resolved.origin === base.origin) {
        return resolved;
      }
    } catch {
      // Ignore parse failure, fall back to root
    }
  }

  return new URL("/", base.origin);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Determine origin, accounting for reverse proxies on Vercel or cloud deployments
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const origin = !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : requestUrl.origin;

  if (code && isSupabaseServerConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Auth callback code exchange error:", error.message);
        return NextResponse.redirect(
          new URL(`/?auth_error=${encodeURIComponent(error.message)}`, origin)
        );
      }
    } catch (err) {
      console.error("Auth callback code exchange exception:", err);
      const msg = err instanceof Error ? err.message : "Authentication code exchange failed";
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent(msg)}`, origin)
      );
    }
  } else if (errorDescription) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorDescription)}`, origin)
    );
  }

  const safeRedirect = getSafeRedirectUrl(next, origin);
  return NextResponse.redirect(safeRedirect);
}
