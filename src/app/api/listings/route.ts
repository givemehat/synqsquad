import { NextRequest, NextResponse } from "next/server";
import { getListings, createListing } from "@/lib/db";
import { ListingType } from "@/types";
import { validateListingInput } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const type = searchParams.get("type");
    const skill = searchParams.get("skill")?.toLowerCase().trim();
    const isAuth = searchParams.get("auth") === "true";

    let listings = await getListings(isAuth);

    if (type && type !== "all") {
      listings = listings.filter((l) => l.type === (type as ListingType));
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load listings";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();

    const validation = validateListingInput(rawBody);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid listing input" },
        { status: 400 }
      );
    }

    const validData = validation.data;

    const newListing = await createListing({
      ownerId: validData.ownerId,
      ownerName: validData.ownerName,
      ownerEmail: validData.ownerEmail,
      ownerCollege: validData.ownerCollege || "Independent",
      ownerRole: validData.ownerRole || "Developer",
      ownerPhoto: validData.ownerPhoto || "",
      type: validData.type,
      title: validData.title,
      event: validData.event,
      deadline: validData.deadline || "Upcoming",
      skillsNeeded: validData.skillsNeeded,
      slots: validData.slots,
      totalSlots: validData.totalSlots,
      description: validData.description,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Requirement published successfully.",
        data: newListing,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create listing";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
