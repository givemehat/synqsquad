import { NextRequest, NextResponse } from "next/server";
import { exportUserData } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "email parameter is required" },
        { status: 400 }
      );
    }

    const exportData = await exportUserData(email);
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="synqsquad-data-${Date.now()}.json"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to export data";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
