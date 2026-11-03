import { NextRequest, NextResponse } from "next/server";
import {
  recordOutreach,
  getOutreachForUser,
  getTalentProfileById,
  isUserBlocked,
  maskEmail,
} from "@/lib/db";
import { validateOutreachInput } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { safeParseJson } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to view collaboration outreach." },
        { status: auth.status }
      );
    }

    const outreaches = await getOutreachForUser(auth.user.id, auth.user.email, "all");
    return NextResponse.json({
      success: true,
      count: outreaches.length,
      data: outreaches,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load outreach records";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const jsonResult = await safeParseJson(request);
    if (!jsonResult.success) {
      return jsonResult.response;
    }
    const rawBody: unknown = jsonResult.data;

    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to send collaboration outreach." },
        { status: auth.status }
      );
    }
    const validation = validateOutreachInput(rawBody);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid outreach payload." },
        { status: 400 }
      );
    }

    const { recipientId, profileId, listingId, message } = validation.data;

    // Look up target talent profile (internal server access for block check and notification)
    const targetProfile = await getTalentProfileById(profileId, true);
    if (!targetProfile) {
      return NextResponse.json(
        { success: false, error: "Talent profile not found." },
        { status: 404 }
      );
    }

    // Check UGC block
    const blocked = await isUserBlocked(auth.user.email, targetProfile.email);
    if (blocked) {
      return NextResponse.json(
        { success: false, error: "You cannot send outreach to this member." },
        { status: 403 }
      );
    }

    // Execute atomic rate-limited outreach (10 / day shared budget)
    const result = await recordOutreach(
      auth.user.id,
      auth.user.email,
      auth.user.name || "Collaborator",
      recipientId,
      profileId,
      listingId || null,
      message
    );

    if (!result.success) {
      const status = result.error?.includes("limit reached") ? 429 : 400;
      return NextResponse.json({ success: false, error: result.error }, { status });
    }

    // Strict privacy: Collaboration request is recorded as 'pending'.
    // Direct verified Gmail contact details are revealed only when the recipient explicitly accepts.
    return NextResponse.json({
      success: true,
      status: "pending",
      remainingToday: result.remainingToday,
      outreachId: result.outreachId,
      recipientName: targetProfile.displayName,
      recipientEmail: maskEmail(targetProfile.email),
      message: "Collaboration outreach sent. Verified Gmail contact will be unlocked once accepted.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record collaboration outreach";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
