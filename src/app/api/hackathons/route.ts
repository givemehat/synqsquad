import { NextResponse } from "next/server";
import { UPCOMING_HACKATHONS } from "@/data/seed";

export async function GET() {
  return NextResponse.json({
    success: true,
    count: UPCOMING_HACKATHONS.length,
    data: UPCOMING_HACKATHONS,
  });
}
