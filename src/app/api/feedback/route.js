import { NextResponse } from "next/server";
import { z } from "zod";
import { hasTrustedOrigin, readBoundedJson } from "../../../lib/http";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  name: z.string().trim().min(2).max(100),
  event: z.string().trim().min(2).max(200),
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional().default("")
}).strict();

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    return json({ error: "Submit feedback as JSON." }, 415);
  }
  let body;
  try {
    body = await readBoundedJson(request, 8192);
  } catch (error) {
    return json({ error: error.status === 413 ? "Feedback is too large." : "Could not read the feedback form." }, error.status || 400);
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message || "Check the feedback form." }, 400);
  if (parsed.data.website) return json({ ok: true }, 202);

  try {
    const client = getSupabaseAdmin();
    const limit = await allowRateLimitedRequest(client, request);
    if (limit.missingIp) return json({ error: "This submission could not be verified." }, 400);
    if (!limit.allowed) return json({ error: "Please wait before sending more feedback." }, 429);
    const { name, event, rating, message } = parsed.data;
    const { error } = await client.from("feedback").insert({ name, event, rating, message });
    if (error) throw new Error(`Feedback could not be saved: ${error.message}`);
    return json({ ok: true }, 201);
  } catch (error) {
    console.error("Feedback submission failed:", error.message);
    return json({ error: error.message.includes("must be configured") ? error.message : "Feedback is temporarily unavailable." }, 503);
  }
}
