import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const db_configured = isSupabaseServerConfigured();
  const auth_configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let db_reachable = false;
  if (db_configured) {
    try {
      const client = getSupabaseServerClient();
      const { error } = await client
        .from("public_listings")
        .select("id")
        .limit(1);
      db_reachable = !error;
    } catch {
      db_reachable = false;
    }
  }

  const status =
    db_configured && db_reachable && auth_configured
      ? "healthy"
      : db_configured && db_reachable
      ? "degraded"
      : "unhealthy";

  const statusCode = status === "unhealthy" ? 503 : 200;

  return NextResponse.json(
    {
      status,
      db_configured,
      db_reachable,
      auth_configured,
      version: "1.3.0",
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
