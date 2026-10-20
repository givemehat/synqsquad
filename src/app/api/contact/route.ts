import { NextRequest, NextResponse } from "next/server";
import { recordContact, getContactedListings, getListingById } from "@/lib/db";
import { contactInputSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to connect with teammates." },
        { status: auth.status }
      );
    }

    const rawBody: unknown = await request.json();
    const payloadWithUser =
      typeof rawBody === "object" && rawBody !== null
        ? {
            ...rawBody,
            fromUserEmail:
              (rawBody as { fromUserEmail?: string }).fromUserEmail || auth.user.email,
          }
        : rawBody;
    const parseResult = contactInputSchema.safeParse(payloadWithUser);

    if (!parseResult.success) {
      const err = parseResult.error.issues[0]?.message || "Invalid contact payload";
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const { listingId } = parseResult.data;

    // Caller identity is ALWAYS the verified JWT session user
    const callerEmail = auth.user.email;

    // Get the listing with unmasked email (internal server access)
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

    // Record contact & check atomic rate limit (10 / day)
    const recordResult = await recordContact(callerEmail, listingId);
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
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to view contact history." },
        { status: auth.status }
      );
    }

    // IDOR immunity: history is strictly scoped to the verified caller
    const contacted = await getContactedListings(auth.user.email);
    return NextResponse.json({
      success: true,
      count: contacted.length,
      data: contacted,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load contacted listings";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
