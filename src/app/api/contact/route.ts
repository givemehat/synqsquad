import { NextRequest, NextResponse } from "next/server";
import { recordContact, getContactedListings, getListingById } from "@/lib/db";
import { contactInputSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    const parseResult = contactInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const err = parseResult.error.issues[0]?.message || "Invalid contact payload";
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const { fromUserEmail, listingId } = parseResult.data;

    // Get the listing with unmasked email (internal access)
    const listing = await getListingById(listingId, true);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.status === "filled") {
      return NextResponse.json(
        { success: false, error: "This squad is already filled and closed for inquiries." },
        { status: 400 }
      );
    }

    // Record contact & check rate limit (10 / day)
    const recordResult = await recordContact(fromUserEmail, listingId);
    if (!recordResult.success) {
      return NextResponse.json(
        { success: false, error: recordResult.error },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contact recorded",
      data: {
        recipientEmail: listing.ownerEmail,
        recipientName: listing.ownerName,
        event: listing.event,
        title: listing.title,
        remainingToday: recordResult.remainingToday,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process Gmail connect";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "email query param is required" },
        { status: 400 }
      );
    }

    const contacted = await getContactedListings(email);
    return NextResponse.json({
      success: true,
      count: contacted.length,
      data: contacted,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch contacted listings";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
