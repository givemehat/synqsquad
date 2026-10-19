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

    if (!body.ownerEmail || !body.status) {
      return NextResponse.json(
        { success: false, error: "ownerEmail and status ('open' | 'filled') are required" },
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
      message: `Listing marked as ${body.status}`,
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete listing", details: error?.message },
      { status: 500 }
    );
  }
}
