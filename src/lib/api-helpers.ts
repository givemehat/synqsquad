import { NextResponse } from "next/server";

/**
 * Safely parse JSON from an incoming request.
 * If the body is malformed or invalid JSON, returns a ready 400 Bad Request response.
 */
export async function safeParseJson<T = unknown>(
  request: Request
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const data = (await request.json()) as T;
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Malformed or invalid JSON payload." },
        { status: 400 }
      ),
    };
  }
}
