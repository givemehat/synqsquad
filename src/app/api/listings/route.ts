import { NextRequest, NextResponse } from "next/server";
import { getListings, createListing, maskEmail } from "@/lib/db";
import { ListingType } from "@/types";
import { validateListingInput } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const type = searchParams.get("type");
    const skill = searchParams.get("skill")?.toLowerCase().trim();

    // Check optional authenticated caller via verified JWT
    const auth = await getAuthenticatedUser(request);
    const viewerId = auth.user?.id;
    const isAuth = Boolean(auth.user);

    let listings = await getListings(isAuth, viewerId);

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

    // Strict privacy: only the authenticated creator of a specific listing sees their own email unmasked
    const sanitizedListings = listings.map((l) => {
      const isOwner = viewerId && l.ownerId === viewerId;
      return {
        ...l,
        ownerEmail: isOwner ? l.ownerEmail : (l.ownerEmail.includes("••") ? l.ownerEmail : maskEmail(l.ownerEmail)),
      };
    });

    return NextResponse.json({
      success: true,
      count: sanitizedListings.length,
      data: sanitizedListings,
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
    // 1. Strict Identity Check: Caller must provide verified Supabase session token
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to create a listing." },
        { status: auth.status }
      );
    }

    const rawBody: unknown = await request.json();

    // Ensure ownerEmail, ownerId, and ownerName match verified identity
    const payloadWithIdentity = typeof rawBody === "object" && rawBody !== null
      ? {
          ...rawBody,
          ownerId: auth.user.id,
          ownerEmail: auth.user.email,
          ownerName: (rawBody as { ownerName?: string }).ownerName || auth.user.name || "Developer",
        }
      : rawBody;

    const validation = validateListingInput(payloadWithIdentity);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid listing input" },
        { status: 400 }
      );
    }

    const validData = validation.data;

    // Persist listing with verified owner identity (carrying user JWT for RLS enforcement)
    const newListing = await createListing(
      {
        ownerId: auth.user.id,
        ownerEmail: auth.user.email,
        ownerName: validData.ownerName || auth.user.name || "Developer",
        ownerCollege: validData.ownerCollege || "Independent",
        ownerRole: validData.ownerRole || "Developer",
        ownerPhoto: validData.ownerPhoto || auth.user.photo || "",
        type: validData.type,
        title: validData.title,
        event: validData.event,
        deadline: validData.deadline || "Upcoming",
        skillsNeeded: validData.skillsNeeded,
        slots: validData.slots,
        totalSlots: validData.totalSlots,
        description: validData.description,
      },
      auth.token
    );

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
