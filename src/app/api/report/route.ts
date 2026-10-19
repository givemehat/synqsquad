import { NextRequest, NextResponse } from "next/server";
import { createReport } from "@/lib/db";
import { reportInputSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    const result = reportInputSchema.safeParse(rawBody);

    if (!result.success) {
      const err = result.error.issues[0]?.message || "Invalid report input";
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const { reporterEmail, targetType, targetId, reason, details } = result.data;

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
