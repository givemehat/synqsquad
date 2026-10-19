import { NextRequest, NextResponse } from "next/server";
import { getListingById, updateListing, deleteListing } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: listing });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing", details: error?.message },
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
    const body = await request.json();

    if (!body.managePin) {
      return NextResponse.json(
        { success: false, error: "managePin is required to update listing" },
        { status: 401 }
      );
    }

    const result = await updateListing(id, body.managePin, body.updates || {});
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Listing updated successfully",
      data: result.listing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update listing", details: error?.message },
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
    const body = await request.json();

    if (!body.managePin) {
      return NextResponse.json(
        { success: false, error: "managePin is required to delete listing" },
        { status: 401 }
      );
    }

    const result = await deleteListing(id, body.managePin);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete listing", details: error?.message },
      { status: 500 }
    );
  }
}
