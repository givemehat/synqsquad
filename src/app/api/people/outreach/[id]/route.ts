import { NextRequest, NextResponse } from "next/server";
import { respondToOutreach } from "@/lib/db";
import { outreachResponseSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required." },
        { status: auth.status }
      );
    }

    const rawBody: unknown = await request.json();
    const validation = outreachResponseSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid response action." },
        { status: 400 }
      );
    }

    const result = await respondToOutreach(auth.user.id, id, validation.data.action);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: result.status,
        senderEmail: result.senderEmail,
        senderName: result.senderName,
        recipientEmail: result.recipientEmail,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update outreach response";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
