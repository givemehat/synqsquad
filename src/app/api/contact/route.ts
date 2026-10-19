import { NextRequest, NextResponse } from "next/server";
import { recordContact, getContactedListings, getListingById } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUserEmail, listingId } = body;

    if (!fromUserEmail || !listingId) {
      return NextResponse.json(
        { success: false, error: "fromUserEmail and listingId are required" },
        { status: 400 }
      );
    }

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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to process Gmail connect", details: error?.message },
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch contacted listings", details: error?.message },
      { status: 500 }
    );
  }
}
