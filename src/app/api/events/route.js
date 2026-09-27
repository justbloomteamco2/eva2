import { NextResponse } from "next/server";
import { getIndiaCalendarDate } from "../../../lib/dates";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const view = searchParams.get("view") || "upcoming";
    const rawPage = searchParams.get("page") || "1";
    const page = Number(rawPage);
    if (!["upcoming", "archive"].includes(view)) {
      return NextResponse.json({ error: "View must be upcoming or archive." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    if (!Number.isSafeInteger(page) || page < 1) {
      return NextResponse.json({ error: "Page must be a positive integer." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const pageSize = 20;
    const from = (page - 1) * pageSize;
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(from + pageSize - 1)) {
      return NextResponse.json({ error: "Page is out of range." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const client = getSupabaseAdmin();
    const today = getIndiaCalendarDate();
    let query = client.from("events")
      .select("id,title,date,city,poster_url,description,registration_type,registration_link", { count: "exact" })
      .eq("status", "published");
    query = view === "archive" ? query.lt("date", today) : query.gte("date", today);
    const { data, count, error } = await query
      .order("date", { ascending: view === "upcoming" })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Public event list failed: ${error.message}`);
    return NextResponse.json({
      events: data,
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      view
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Public event listing failed:", error.message);
    return NextResponse.json({ error: "Events are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
