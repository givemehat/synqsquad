import { NextRequest, NextResponse } from "next/server";
import { getListingById, updateListingStatus, deleteListing } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isAuth = searchParams.get("auth") === "true";

    const listing = await getListingById(id, isAuth);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: listing });
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
    const { id } = await params;
    const body = (await request.json()) as { ownerEmail?: string; status?: "open" | "filled" | "renew" };

    if (!body.ownerEmail || !body.status) {
      return NextResponse.json(
        { success: false, error: "ownerEmail and status ('open' | 'filled' | 'renew') are required" },
        { status: 400 }
      );
    }

    if (!["open", "filled", "renew"].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Status must be 'open', 'filled', or 'renew'" },
        { status: 400 }
      );
    }

    const result = await updateListingStatus(id, body.ownerEmail, body.status);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Listing updated successfully`,
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
    const { id } = await params;
    const body = (await request.json()) as { ownerEmail?: string };

    if (!body.ownerEmail) {
      return NextResponse.json(
        { success: false, error: "ownerEmail is required to delete listing" },
        { status: 401 }
      );
    }

    const result = await deleteListing(id, body.ownerEmail);
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
