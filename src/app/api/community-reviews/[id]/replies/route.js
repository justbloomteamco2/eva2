import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../../../lib/supabase-admin";
import { hasTrustedOrigin, readBoundedJson } from "../../../../../lib/http";

export const runtime = "nodejs";

const replySchema = z.object({
  name: z.string().trim().min(2).max(80),
  replyText: z.string().trim().min(2).max(500)
}).strict();

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return json({ error: "This review could not be found." }, 404);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    return json({ error: "Please submit your reply using the website." }, 415);
  }

  let body;
  try {
    body = await readBoundedJson(request, 4096);
  } catch (error) {
    return json({ error: error.status === 413 ? "This reply is too large." : "Please check your reply and try again." }, error.status || 400);
  }
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) return json({ error: "Enter your name and a reply of at least 2 characters." }, 400);

  let client;
  try {
    client = getSupabaseAdmin();
    const limit = await allowRateLimitedRequest(client, request);
    if (limit.missingIp) return json({ error: "We couldn’t verify this submission. Please try again later." }, 400);
    if (!limit.allowed) return json({ error: "Please wait a little before posting another reply." }, 429);
  } catch (error) {
    console.error("Community reply submission is not configured:", error.message);
    return json({ error: "Replies are temporarily unavailable. Please try again later." }, 503);
  }

  const { data, error } = await client.from("review_replies")
    .insert({ review_id: id, name: parsed.data.name, reply_text: parsed.data.replyText })
    .select("id,review_id,name,reply_text,created_at")
    .single();
  if (error) {
    console.error("Community reply could not be saved:", error.message);
    return json({ error: "We couldn’t save your reply. Please try again." }, 500);
  }
  return json({
    reply: {
      id: data.id,
      reviewId: data.review_id,
      name: data.name,
      replyText: data.reply_text,
      createdAt: data.created_at
    }
  }, 201);
}
