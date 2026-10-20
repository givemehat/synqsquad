import { NextRequest, NextResponse } from "next/server";
import { getBlockedUsers, blockUser, unblockUser } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  // 1. Authenticate caller strictly via verified session JWT
  const auth = await getAuthenticatedUser(request);
  if (!auth.user) {
    return NextResponse.json(
      { success: false, error: auth.error || "Authentication required." },
      { status: auth.status }
    );
  }

  try {
    const blockedUsers = await getBlockedUsers(auth.user.email);
    return NextResponse.json({ success: true, blockedUsers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load blocked users.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to block user." },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { blockedEmail } = body;

    if (!blockedEmail) {
      return NextResponse.json(
        { success: false, error: "blockedEmail is required." },
        { status: 400 }
      );
    }

    // Blocker is ALWAYS the verified caller
    const result = await blockUser(auth.user.email, blockedEmail);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to block user.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate caller strictly via verified session JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required to unblock user." },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { blockedEmail } = body;

    if (!blockedEmail) {
      return NextResponse.json(
        { success: false, error: "blockedEmail is required." },
        { status: 400 }
      );
    }

    // Blocker is ALWAYS the verified caller
    const result = await unblockUser(auth.user.email, blockedEmail);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to unblock user.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
