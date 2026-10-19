import { NextRequest, NextResponse } from "next/server";
import { boostListing } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, plan, paymentMethod, transactionRef } = body;

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: "listingId is required" },
        { status: 400 }
      );
    }

    // Determine days to boost based on plan
    // Starter: 3 days (₹99 / $1.99)
    // Pro Spotlight: 7 days (₹199 / $3.99)
    // Mega Boost: 14 days (₹349 / $6.99)
    const days = plan === "mega" ? 14 : plan === "starter" ? 3 : 7;

    const result = await boostListing(listingId, days);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to boost listing" },
        { status: 400 }
      );
    }

    const txId = transactionRef || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      message: `Listing boosted successfully for ${days} days!`,
      data: {
        listing: result.listing,
        transactionId: txId,
        paymentMethod: paymentMethod || "UPI / Instant Pay",
        activatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to process boost", details: error?.message },
      { status: 500 }
    );
  }
}
