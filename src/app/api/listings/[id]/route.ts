import { NextRequest, NextResponse } from "next/server";
import { getListingById, updateListingStatus, deleteListing, maskEmail } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);
    const viewerId = auth.user?.id;

    const listing = await getListingById(id, false, viewerId);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    const isOwner = Boolean(viewerId && listing.ownerId === viewerId);
    const sanitized = {
      ...listing,
      ownerEmail: isOwner ? listing.ownerEmail : maskEmail(listing.ownerEmail),
    };

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch listing";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to update listing." },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as { status?: "open" | "filled" | "renew" };

    if (!body.status || !["open", "filled", "renew"].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Status must be 'open', 'filled', or 'renew'" },
        { status: 400 }
      );
    }

    // 2. Ownership check strictly keyed by auth.user.id, passing auth.token for RLS enforcement
    const result = await updateListingStatus(id, auth.user.id, body.status, auth.token);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Listing updated successfully",
      data: result.listing,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update listing";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to delete listing." },
        { status: auth.status }
      );
    }

    const { id } = await params;

    // 2. Deletion ownership check strictly keyed by auth.user.id, passing auth.token for RLS enforcement
    const result = await deleteListing(id, auth.user.id, auth.token);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete listing";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
