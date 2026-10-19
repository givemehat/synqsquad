import { NextRequest, NextResponse } from "next/server";
import { upsertUser, deleteUserData } from "@/lib/db";
import { UserProfile } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<UserProfile>;
    if (!body.email || !body.name) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const user = await upsertUser({
      id: body.id || `usr-${Date.now().toString(36)}`,
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      photo: body.photo || "",
      role: body.role || "Developer",
      college: body.college || "Independent",
      skills: Array.isArray(body.skills) ? body.skills : [],
      lookingFor: body.lookingFor || "both",
      bio: body.bio || "",
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
    const body = (await request.json()) as { email?: string };
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required to confirm deletion" },
        { status: 400 }
      );
    }

    const success = await deleteUserData(email);
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
