import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Community review live updates are not configured: Supabase URL or publishable key is missing.");
    return NextResponse.json(
      { error: "Live review updates are temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    { url, key },
    { headers: { "Cache-Control": "no-store" } }
  );
}
