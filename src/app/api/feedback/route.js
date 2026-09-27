import { NextResponse } from "next/server";
import { z } from "zod";
import { hasTrustedOrigin, readBoundedJson } from "../../../lib/http";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../lib/supabase-admin";
import { sendFeedbackCsvEmail } from "../../../lib/feedback-email";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  name: z.string().trim().max(100).default("").transform((value) => value || "Anonymous attendee"),
  attendee_email: z.union([z.literal(""), z.string().trim().email().max(254)]).default(""),
  event: z.string().trim().min(2).max(200),
  event_date: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
    }, "Enter a valid event date.")
  ]).default(""),
  rating: z.coerce.number().int().min(1).max(5),
  would_attend_again: z.enum(["yes", "maybe", "no"]),
  what_went_well: z.string().trim().max(900).default(""),
  what_to_improve: z.string().trim().max(900).default(""),
  website: z.string().max(0).optional().default("")
}).strict().refine(
  (data) => data.what_went_well.length >= 10 || data.what_to_improve.length >= 10,
  { message: "Share at least one note of 10 characters or more.", path: ["what_to_improve"] }
);

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
    const {
      name,
      attendee_email,
      event,
      event_date,
      rating,
      would_attend_again,
      what_went_well,
      what_to_improve
    } = parsed.data;
    const message = [
      what_went_well ? `What they enjoyed:\n${what_went_well}` : "",
      what_to_improve ? `What to improve:\n${what_to_improve}` : ""
    ].filter(Boolean).join("\n\n");
    const { data: feedback, error } = await client.from("feedback")
      .insert({
        name,
        attendee_email,
        event,
        event_date: event_date || null,
        rating,
        would_attend_again,
        what_went_well,
        what_to_improve,
        message
      })
      .select("id,name,attendee_email,event,event_date,rating,would_attend_again,what_went_well,what_to_improve,message,created_at")
      .single();
    if (error) throw new Error(`Feedback could not be saved: ${error.message}`);

    let notificationPending = false;
    try {
      const attemptedAt = new Date().toISOString();
      const { error: attemptError } = await client.from("feedback")
        .update({ email_attempted_at: attemptedAt })
        .eq("id", feedback.id)
        .is("email_sent_at", null);
      if (attemptError) throw new Error(`Feedback email attempt could not be saved: ${attemptError.message}`);

      await sendFeedbackCsvEmail(feedback);
      const { error: updateError } = await client.from("feedback")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", feedback.id)
        .is("email_sent_at", null);
      if (updateError) throw new Error(`Feedback email status could not be saved: ${updateError.message}`);
    } catch (emailError) {
      notificationPending = true;
      console.error("Feedback email delivery failed:", emailError.message);
    }

    return json({ ok: true, notificationPending }, 201);
  } catch (error) {
    console.error("Feedback submission failed:", error.message);
    return json({ error: error.message.includes("must be configured") ? error.message : "Feedback is temporarily unavailable." }, 503);
  }
}
