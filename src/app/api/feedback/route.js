import { NextResponse } from "next/server";
import { z } from "zod";
import { hasTrustedOrigin, readBoundedJson } from "../../../lib/http";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../lib/supabase-admin";
import { sendFeedbackCsvEmail } from "../../../lib/feedback-email";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  type: z.enum(["event", "client"]).default("event"),
  name: z.string().trim().max(100).default(""),
  attendee_email: z.union([z.literal(""), z.string().trim().email().max(254)]).default(""),
  attendee_phone: z.string().trim().max(20).default(""),
  client_project: z.string().trim().max(160).default(""),
  client_feedback: z.string().trim().max(2000).default(""),
  event: z.string().trim().max(200).default(""),
  event_date: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
    }, "Enter a valid event date.")
  ]).default(""),
  rating: z.coerce.number().int().min(1).max(5),
  would_attend_again: z.enum(["", "yes", "maybe", "no"]).default(""),
  what_went_well: z.string().trim().max(900).default(""),
  what_to_improve: z.string().trim().max(900).default(""),
  website: z.string().max(0).optional().default("")
}).strict().superRefine((data, context) => {
  if (data.attendee_phone && !/^[+0-9().\s-]{8,20}$/.test(data.attendee_phone)) {
    context.addIssue({ code: "custom", message: "Enter a valid phone number.", path: ["attendee_phone"] });
  }

  if (data.type === "client") {
    if (data.name.length < 2) {
      context.addIssue({ code: "custom", message: "Enter your name.", path: ["name"] });
    }
    if (data.client_project.length < 2) {
      context.addIssue({ code: "custom", message: "Tell us which project or service this is about.", path: ["client_project"] });
    }
    if (!data.attendee_email && !data.attendee_phone) {
      context.addIssue({ code: "custom", message: "Add an email address or phone number so we can follow up.", path: ["attendee_email"] });
    }
    if (data.client_feedback.length < 10) {
      context.addIssue({ code: "custom", message: "Share at least 10 characters of feedback.", path: ["client_feedback"] });
    }
    return;
  }

  if (data.event.length < 2) {
    context.addIssue({ code: "custom", message: "Enter the event name.", path: ["event"] });
  }
  if (!data.would_attend_again) {
    context.addIssue({ code: "custom", message: "Choose whether you would attend another event.", path: ["would_attend_again"] });
  }
  if (data.what_went_well.length < 10 && data.what_to_improve.length < 10) {
    context.addIssue({ code: "custom", message: "Share at least one note of 10 characters or more.", path: ["what_to_improve"] });
  }
});

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
      type,
      name,
      attendee_email,
      attendee_phone,
      client_project,
      client_feedback,
      event,
      event_date,
      rating,
      would_attend_again,
      what_went_well,
      what_to_improve
    } = parsed.data;
    const feedbackMessage = type === "client"
      ? client_feedback
      : [
          what_went_well ? `What they enjoyed:\n${what_went_well}` : "",
          what_to_improve ? `What to improve:\n${what_to_improve}` : ""
        ].filter(Boolean).join("\n\n");
    const { data: feedback, error } = await client.from("feedback")
      .insert({
        feedback_type: type,
        name: type === "client" ? name : name || "Anonymous attendee",
        attendee_email,
        attendee_phone,
        client_project: type === "client" ? client_project : "",
        event: type === "client" ? "Client feedback" : event,
        event_date: type === "event" ? event_date || null : null,
        rating,
        would_attend_again: type === "event" ? would_attend_again : null,
        what_went_well: type === "event" ? what_went_well : "",
        what_to_improve: type === "event" ? what_to_improve : "",
        message: feedbackMessage
      })
      .select("id,feedback_type,name,attendee_email,attendee_phone,client_project,event,event_date,rating,would_attend_again,what_went_well,what_to_improve,message,created_at")
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
