import { NextRequest, NextResponse } from "next/server";
import { createReport } from "@/lib/db";
import { reportInputSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { safeParseJson } from "@/lib/api-helpers";

// Rate limit reports: max 10 per hour per reporter
const reportRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkReportRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = reportRateLimitMap.get(email);
  if (!entry || now > entry.resetAt) {
    reportRateLimitMap.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) {
    return false;
  }
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const jsonResult = await safeParseJson(request);
    if (!jsonResult.success) {
      return jsonResult.response;
    }
    const rawBody: unknown = jsonResult.data;

    const auth = await getAuthenticatedUser(request);
    let reporterEmail = auth.user?.email;

    if (!reporterEmail && typeof rawBody === "object" && rawBody !== null) {
      const explicitEmail = (rawBody as { reporterEmail?: string }).reporterEmail;
      if (explicitEmail && typeof explicitEmail === "string") {
        reporterEmail = explicitEmail.toLowerCase().trim();
      }
    }

    if (!reporterEmail) {
      return NextResponse.json(
        { success: false, error: "Reporter email or authenticated session required to submit moderation reports." },
        { status: 401 }
      );
    }

    const payloadWithIdentity =
      typeof rawBody === "object" && rawBody !== null
        ? { ...rawBody, reporterEmail }
        : rawBody;

    const result = reportInputSchema.safeParse(payloadWithIdentity);

    if (!result.success) {
      const err = result.error.issues[0]?.message || "Invalid report input";
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const { targetType, targetId, reason, details } = result.data;

    // Rate limit check: max 10 per hour per reporter
    if (!checkReportRateLimit(reporterEmail)) {
      return NextResponse.json(
        { success: false, error: "Too many reports submitted. Please wait before submitting another report." },
        { status: 429 }
      );
    }

    const report = await createReport({
      reporterEmail,
      targetType,
      targetId,
      reason,
      details,
    });

    return NextResponse.json({
      success: true,
      message: "Report submitted. Our moderation team reviews every flag within 24 hours.",
      data: report,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to submit report";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
