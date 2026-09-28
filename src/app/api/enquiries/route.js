import { NextResponse } from "next/server";
import { z } from "zod";
import { hasTrustedOrigin, readBoundedJson } from "../../../lib/http";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../lib/supabase-admin";
import { enquirySubmissionCategories } from "../../../lib/enquiry-categories";

export const runtime = "nodejs";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  organisation: z.string().trim().max(160).default(""),
  message: z.string().trim().min(10).max(4000),
  category: z.enum(enquirySubmissionCategories),
  website: z.string().max(0).optional().default("")
}).strict();

function json(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function POST(request) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ error: "Please submit the form using the website." }, 415);
  }

  let body;
  try {
    body = await readBoundedJson(request, 8192);
  } catch (error) {
    return json({ error: error.status === 413 ? "This enquiry is too large." : "Please check the form and try again." }, error.status || 400);
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check your details and try again." }, 400);

  if (parsed.data.website) return json({ ok: true });

  let client;
  try {
    client = getSupabaseAdmin();
  } catch (error) {
    console.error("Enquiry submission is not configured:", error.message);
    return json({ error: "Enquiries are temporarily unavailable. Please contact us on Instagram." }, 503);
  }

  try {
    const limit = await allowRateLimitedRequest(client, request);
    if (limit.missingIp) return json({ error: "We couldn’t verify this submission. Please contact us on Instagram." }, 400);
    if (!limit.allowed) return json({ error: "Please wait a little before sending another enquiry." }, 429);
  } catch (error) {
    console.error("Enquiry rate-limit check failed:", error.message);
    return json({ error: "Enquiries are temporarily unavailable. Please contact us on Instagram." }, 503);
  }

  const { name, email, organisation, message, category } = parsed.data;
  try {
    const { error: insertError } = await client.from("enquiries").insert({
      name,
      email,
      organisation,
      message,
      category
    });
    if (insertError) throw new Error(insertError.message);
  } catch (error) {
    console.error("Enquiry could not be saved:", error.message);
    return json({ error: "We couldn’t save your enquiry. Please try again or contact us on Instagram." }, 500);
  }

  return json({ ok: true });
}
