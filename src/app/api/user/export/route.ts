import { NextRequest, NextResponse } from "next/server";
import { exportUserData } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to export data." },
        { status: auth.status }
      );
    }

    // Export strictly scoped to caller's verified identity
    const exportData = await exportUserData(auth.user.id, auth.user.email);
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="synqsquad-data-${Date.now()}.json"`,
        "Cache-Control": "no-store, max-age=0",
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
