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

  if (code && isSupabaseServerConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error("Auth callback code exchange error:", err);
    }
  }

  const safeRedirect = getSafeRedirectUrl(next, request.url);
  return NextResponse.redirect(safeRedirect);
}
