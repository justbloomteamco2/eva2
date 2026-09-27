import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "../../../../lib/admin-auth";
import { deleteEventPoster, uploadEventPoster, MAX_POSTER_BYTES } from "../../../../lib/cloudinary";
import { getIndiaCalendarDate } from "../../../../lib/dates";
import { hasTrustedOrigin } from "../../../../lib/http";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

const eventFields = z.object({
  title: z.string().trim().min(2).max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid calendar date."),
  city: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(2000),
  registration_type: z.enum(["free", "paid"]),
  registration_link: z.union([z.string().trim().url().max(2048).refine((value) => {
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  }), z.literal(""), z.null()]).optional()
    .transform((value) => value || null),
  status: z.enum(["draft", "published"])
}).strict();

const createSchema = eventFields.superRefine((event, context) => {
  if (event.registration_type === "paid" && !event.registration_link) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["registration_link"],
      message: "A registration link is required for paid events."
    });
  }
});
const updateSchema = eventFields.partial().strict().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one event field to update."
});
const MAX_REQUEST_BYTES = MAX_POSTER_BYTES + 128 * 1024;

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function authorized(request) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

function requestedPage(request) {
  const raw = new URL(request.url).searchParams.get("page") || "1";
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

async function parseForm(request, schema) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return { response: json({ error: "Submit event details as multipart form data." }, 415) };
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isSafeInteger(contentLength) || contentLength < 1) {
    return { response: json({ error: "Request size could not be verified." }, 411) };
  }
  if (contentLength > MAX_REQUEST_BYTES) return { response: json({ error: "The event or poster is too large." }, 413) };

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return { response: json({ error: "Could not parse the event form." }, 400) };
  }

  const values = {};
  let posterCount = 0;
  for (const [key, value] of formData.entries()) {
    if (key === "poster") {
      posterCount += 1;
      if (posterCount > 1 || !(value instanceof File)) return { response: json({ error: "Invalid or repeated poster upload." }, 400) };
      continue;
    }
    if (key in values || value instanceof File) return { response: json({ error: "Unexpected or repeated event field." }, 400) };
    values[key] = value;
  }
  const poster = formData.get("poster");
  if (poster !== null && !(poster instanceof File)) return { response: json({ error: "Invalid poster upload." }, 400) };
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { response: json({ error: parsed.error.issues[0]?.message || "Check the event details." }, 400) };
  return { data: parsed.data, poster };
}

export async function GET(request) {
  try {
    if (!(await authorized(request))) return json({ error: "Admin authentication is required." }, 401);
    const page = requestedPage(request);
    if (!page) return json({ error: "Page must be a positive integer." }, 400);
    const pageSize = 20;
    const from = (page - 1) * pageSize;
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(from + pageSize - 1)) {
      return json({ error: "Page is out of range." }, 400);
    }
    const client = getSupabaseAdmin();
    const { data, count, error } = await client.from("events")
      .select("id,title,date,city,poster_url,description,registration_type,registration_link,status,created_at,updated_at", { count: "exact" })
      .order("date", { ascending: true }).order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Admin event list failed: ${error.message}`);
    return json({ events: data, page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) });
  } catch (error) {
    console.error("Admin event listing failed:", error.message);
    return json({ error: "Events are temporarily unavailable." }, 503);
  }
}

export async function POST(request) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  try {
    if (!(await authorized(request))) return json({ error: "Admin authentication is required." }, 401);
    const parsed = await parseForm(request, createSchema);
    if (parsed.response) return parsed.response;
    const client = getSupabaseAdmin();
    const posterUrl = parsed.poster ? await uploadEventPoster(parsed.poster) : null;
    let data;
    let error;
    try {
      ({ data, error } = await client.from("events").insert({
        ...parsed.data,
        registration_link: parsed.data.registration_link ?? null,
        poster_url: posterUrl
      }).select("id,title,date,city,poster_url,description,registration_type,registration_link,status,created_at,updated_at").single());
    } catch (insertError) {
      if (posterUrl) {
        try {
          await deleteEventPoster(posterUrl);
        } catch (cleanupError) {
          console.error("Failed to remove an unclaimed event poster:", cleanupError.message);
        }
      }
      throw insertError;
    }
    if (error) {
      if (posterUrl) {
        try {
          await deleteEventPoster(posterUrl);
        } catch (cleanupError) {
          console.error("Failed to remove an unclaimed event poster:", cleanupError.message);
        }
      }
      throw new Error(`Event could not be created: ${error.message}`);
    }
    return json({ event: data }, 201);
  } catch (error) {
    console.error("Admin event creation failed:", error.message);
    const status = error.message.startsWith("Choose a poster") || error.message.startsWith("Upload a JPG")
      || error.message.startsWith("The poster contents") ? 400
      : error.message.startsWith("CLOUDINARY_") || error.message.includes("must be configured") ? 503 : 500;
    return json({ error: status === 500 ? "Event could not be created." : error.message }, status);
  }
}
