import { NextRequest, NextResponse } from "next/server";
import { createReport } from "@/lib/db";
import { reportInputSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-server";

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
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to submit moderation reports." },
        { status: auth.status }
      );
    }

    const rawBody: unknown = await request.json();
    const payloadWithIdentity =
      typeof rawBody === "object" && rawBody !== null
        ? { ...rawBody, reporterEmail: auth.user.email }
        : rawBody;

    const result = reportInputSchema.safeParse(payloadWithIdentity);

    if (!result.success) {
      const err = result.error.issues[0]?.message || "Invalid report input";
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const { targetType, targetId, reason, details } = result.data;
    const reporterEmail = auth.user.email;

    // Rate limit check
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
