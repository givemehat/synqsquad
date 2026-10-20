import { NextRequest, NextResponse } from "next/server";
import { getTalentProfiles, upsertTalentProfile } from "@/lib/db";
import { validateTalentProfileInput } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    const isAuthenticated = Boolean(auth.user);
    const viewerEmail = auth.user?.email;

    const { searchParams } = new URL(request.url);
    const skillsParam = searchParams.get("skills");
    const skills = skillsParam ? skillsParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const lookingFor = searchParams.get("lookingFor") || undefined;
    const experienceLevel = searchParams.get("experienceLevel") || undefined;
    const availability = searchParams.get("availability") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const result = await getTalentProfiles(isAuthenticated, viewerEmail, {
      skills,
      lookingFor,
      experienceLevel,
      availability,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      count: result.profiles.length,
      total: result.total,
      data: result.profiles,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load talent profiles";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to publish talent profile." },
        { status: auth.status }
      );
    }

    const rawBody: unknown = await request.json();
    const validation = validateTalentProfileInput(rawBody);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid talent profile payload." },
        { status: 400 }
      );
    }

    const profile = await upsertTalentProfile(auth.user.id, auth.user.email, validation.data);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save talent profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
