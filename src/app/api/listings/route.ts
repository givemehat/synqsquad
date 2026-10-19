import { NextRequest, NextResponse } from "next/server";
import { getListings, createListing } from "@/lib/db";
import { ListingType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const type = searchParams.get("type") as ListingType | null;
    const skill = searchParams.get("skill")?.toLowerCase().trim();
    const isAuth = searchParams.get("auth") === "true";

    let listings = await getListings(isAuth);

    if (type && type !== ("all" as any)) {
      listings = listings.filter((l) => l.type === type);
    }

    if (skill && skill !== "all") {
      listings = listings.filter((l) =>
        l.skillsNeeded.some((s) => s.toLowerCase() === skill)
      );
    }

    if (search) {
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(search) ||
          l.event.toLowerCase().includes(search) ||
          l.description.toLowerCase().includes(search) ||
          l.ownerCollege.toLowerCase().includes(search) ||
          l.ownerName.toLowerCase().includes(search) ||
          l.skillsNeeded.some((s) => s.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: listings.length,
      data: listings,
    });
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

    if (!body.title || !body.event || !body.description || !body.ownerEmail || !body.ownerName) {
      return NextResponse.json(
        {
          success: false,
          error: "Required fields missing: title, event, description, ownerName, ownerEmail",
        },
        { status: 400 }
      );
    }

    const skills = Array.isArray(body.skillsNeeded)
      ? body.skillsNeeded.map((s: string) => s.trim()).filter(Boolean)
      : [];

    const newListing = await createListing({
      ownerId: body.ownerId || `usr-${Date.now().toString(36)}`,
      ownerName: body.ownerName.trim(),
      ownerEmail: body.ownerEmail.trim().toLowerCase(),
      ownerCollege: body.ownerCollege?.trim() || "Independent",
      ownerRole: body.ownerRole?.trim() || "Developer",
      ownerPhoto: body.ownerPhoto || "",
      type: body.type || "hackathon",
      title: body.title.trim(),
      event: body.event.trim(),
      deadline: body.deadline?.trim() || "Upcoming",
      skillsNeeded: skills.length > 0 ? skills : ["General Collaborator"],
      slots: Number(body.slots) || 1,
      totalSlots: Number(body.totalSlots) || Number(body.slots) || 4,
      description: body.description.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Requirement published successfully.",
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
