import { NextRequest, NextResponse } from "next/server";
import { upsertUser, deleteUserData, getUserProfile } from "@/lib/db";
import { UserProfile } from "@/types";
import { sanitizeText } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required." },
        { status: auth.status }
      );
    }

    const profile = await getUserProfile(auth.user.id, auth.user.email);
    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to update profile." },
        { status: auth.status }
      );
    }

    const body = (await request.json()) as Partial<UserProfile>;

    // Identity is anchored to verified auth.user (cannot spoof another user's id or email)
    const user = await upsertUser({
      id: auth.user.id,
      email: auth.user.email,
      name: sanitizeText(body.name || auth.user.name || "Developer"),
      photo: body.photo || auth.user.photo || "",
      role: sanitizeText(body.role || "Developer"),
      college: sanitizeText(body.college || "Independent"),
      skills: Array.isArray(body.skills) ? body.skills.map(sanitizeText) : [],
      lookingFor: body.lookingFor || "both",
      bio: sanitizeText(body.bio || ""),
      consentAt: body.consentAt || new Date().toISOString(),
      createdAt: body.createdAt || new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to delete account." },
        { status: auth.status }
      );
    }

    // Cascade deletion strictly scoped to the verified caller
    const success = await deleteUserData(auth.user.id, auth.user.email);
    return NextResponse.json({
      success,
      message: "Your profile, requisitions, and audit records have been permanently deleted.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete user account";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
