import { NextRequest, NextResponse } from "next/server";
import { getListings, createListing } from "@/lib/db";
import { ListingType, ProjectDomain } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();
    const type = searchParams.get("type") as ListingType | null;
    const domain = searchParams.get("domain") as ProjectDomain | null;
    const role = searchParams.get("role")?.toLowerCase();

    let listings = await getListings();

    if (type && type !== ("all" as any)) {
      listings = listings.filter((l) => l.type === type);
    }

    if (domain && domain !== ("all" as any)) {
      listings = listings.filter((l) => l.domain === domain);
    }

    if (search) {
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(search) ||
          l.targetName.toLowerCase().includes(search) ||
          l.description.toLowerCase().includes(search) ||
          l.skills.some((s) => s.toLowerCase().includes(search)) ||
          l.rolesNeeded.some((r) => r.toLowerCase().includes(search))
      );
    }

    if (role) {
      listings = listings.filter((l) =>
        l.rolesNeeded.some((r) => r.toLowerCase().includes(role))
      );
    }

    return NextResponse.json({ success: true, count: listings.length, data: listings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to load listings", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic server validation
    if (!body.title || !body.targetName || !body.creatorName || !body.description) {
      return NextResponse.json(
        {
          success: false,
          error: "Required fields missing: title, targetName, creatorName, description",
        },
        { status: 400 }
      );
    }

    if (!body.rolesNeeded || body.rolesNeeded.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please specify at least one role needed" },
        { status: 400 }
      );
    }

    // Ensure 6-digit PIN exists
    const managePin = body.managePin || Math.floor(100000 + Math.random() * 900000).toString();

    const newListing = await createListing({
      title: body.title.trim(),
      targetName: body.targetName.trim(),
      type: body.type || "hackathon",
      domain: body.domain || "AI & Machine Learning",
      creatorName: body.creatorName.trim(),
      creatorRole: body.creatorRole?.trim() || "Team Lead",
      creatorAvatar: body.creatorAvatar || "",
      location: body.location?.trim() || "Remote",
      description: body.description.trim(),
      rolesNeeded: Array.isArray(body.rolesNeeded)
        ? body.rolesNeeded.map((r: string) => r.trim()).filter(Boolean)
        : [body.rolesNeeded],
      currentMembersCount: Number(body.currentMembersCount) || 1,
      maxMembersCount: Number(body.maxMembersCount) || 4,
      skills: Array.isArray(body.skills)
        ? body.skills.map((s: string) => s.trim()).filter(Boolean)
        : [],
      contact: {
        telegram: body.contact?.telegram?.replace("@", "").trim() || "",
        discord: body.contact?.discord?.trim() || "",
        whatsapp: body.contact?.whatsapp?.trim() || "",
        github: body.contact?.github?.replace("https://github.com/", "").trim() || "",
        linkedin: body.contact?.linkedin?.trim() || "",
        email: body.contact?.email?.trim() || "",
      },
      isBoosted: false,
      isVerifiedWinner: Boolean(body.isVerifiedWinner),
      prizeOrGrantPool: body.prizeOrGrantPool?.trim() || "",
      status: "open",
      managePin,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Listing created successfully! Keep your manage PIN safe.",
        data: newListing,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to create listing", details: error?.message },
      { status: 500 }
    );
  }
}
