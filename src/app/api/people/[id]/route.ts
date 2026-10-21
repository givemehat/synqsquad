import { NextRequest, NextResponse } from "next/server";
import { getTalentProfileById, updateTalentProfileVisibility, deleteTalentProfile } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);
    const isAuthenticated = Boolean(auth.user);
    const viewerEmail = auth.user?.email;

    const profile = await getTalentProfileById(id, isAuthenticated, viewerEmail);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Talent profile not found or unavailable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load talent profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

const updateVisibilitySchema = z
  .object({
    visible: z.boolean().optional(),
    availability: z.enum(["open", "busy", "hidden"]).optional(),
  })
  .strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required." },
        { status: auth.status }
      );
    }

    const profile = await getTalentProfileById(id, true);
    if (!profile) {
      return NextResponse.json({ success: false, error: "Talent profile not found." }, { status: 404 });
    }

    // Strict IDOR ownership verification
    if (profile.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only modify your own talent profile." },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateVisibilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid payload." },
        { status: 400 }
      );
    }

    const { visible = profile.visible, availability } = parsed.data;
    const res = await updateTalentProfileVisibility(auth.user.id, visible, availability, auth.token);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Talent profile updated successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required." },
        { status: auth.status }
      );
    }

    const profile = await getTalentProfileById(id, true);
    if (!profile) {
      return NextResponse.json({ success: false, error: "Talent profile not found." }, { status: 404 });
    }

    // Strict IDOR ownership verification
    if (profile.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only delete your own talent profile." },
        { status: 403 }
      );
    }

    const res = await deleteTalentProfile(auth.user.id, auth.token);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Talent profile deleted successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
