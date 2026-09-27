import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "../../../../../lib/admin-auth";
import { deleteEventPoster, MAX_POSTER_BYTES, uploadEventPoster } from "../../../../../lib/cloudinary";
import { hasTrustedOrigin } from "../../../../../lib/http";
import { getSupabaseAdmin } from "../../../../../lib/supabase-admin";

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
    .transform((value) => value === "" ? null : value),
  status: z.enum(["draft", "published"])
}).strict();
const updateSchema = eventFields.partial().strict();
const MAX_REQUEST_BYTES = MAX_POSTER_BYTES + 128 * 1024;

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readUpdateForm(request) {
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("multipart/form-data")) {
    return { response: json({ error: "Submit event updates as multipart form data." }, 415) };
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isSafeInteger(contentLength) || contentLength < 1) return { response: json({ error: "Request size could not be verified." }, 411) };
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
  let poster = formData.get("poster");
  if (poster !== null && !(poster instanceof File)) return { response: json({ error: "Invalid poster upload." }, 400) };
  if (poster instanceof File && poster.size === 0) poster = null;
  const parsed = updateSchema.safeParse(values);
  if (!parsed.success) return { response: json({ error: parsed.error.issues[0]?.message || "Check the event details." }, 400) };
  if (Object.keys(parsed.data).length === 0 && !poster) {
    return { response: json({ error: "Provide at least one event field or a poster to update." }, 400) };
  }
  return { data: parsed.data, poster };
}

function isAuthorized(request) {
  return verifyAdminToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function PATCH(request, { params }) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  try {
    if (!isAuthorized(request)) return json({ error: "Admin authentication is required." }, 401);
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return json({ error: "Invalid event id." }, 400);
    const input = await readUpdateForm(request);
    if (input.response) return input.response;
    const update = { ...input.data };
    const client = getSupabaseAdmin();
    const { data: current, error: currentError } = await client.from("events")
      .select("id,poster_url,registration_type,registration_link").eq("id", id).maybeSingle();
    if (currentError) throw new Error(`Event could not be read before update: ${currentError.message}`);
    if (!current) return json({ error: "Event not found." }, 404);

    const registrationType = input.data.registration_type ?? current.registration_type;
    const registrationLink = Object.hasOwn(input.data, "registration_link")
      ? input.data.registration_link
      : current.registration_link;
    if (registrationType === "paid" && !registrationLink) {
      return json({ error: "A registration link is required for paid events." }, 400);
    }

    const previousPosterUrl = current.poster_url;
    let uploadedPosterUrl = null;
    if (input.poster) {
      uploadedPosterUrl = await uploadEventPoster(input.poster);
      update.poster_url = uploadedPosterUrl;
    }

    update.updated_at = new Date().toISOString();
    let data;
    let error;
    try {
      ({ data, error } = await client.from("events").update(update).eq("id", id)
        .select("id,title,date,city,poster_url,description,registration_type,registration_link,status,created_at,updated_at")
        .maybeSingle());
    } catch (updateError) {
      if (uploadedPosterUrl) {
        try {
          await deleteEventPoster(uploadedPosterUrl);
        } catch (cleanupError) {
          console.error("Failed to remove an unclaimed replacement event poster:", cleanupError.message);
        }
      }
      throw updateError;
    }
    if (error || !data) {
      if (uploadedPosterUrl) {
        try {
          await deleteEventPoster(uploadedPosterUrl);
        } catch (cleanupError) {
          console.error("Failed to remove an unclaimed replacement event poster:", cleanupError.message);
        }
      }
      if (error) throw new Error(`Event could not be updated: ${error.message}`);
      return json({ error: "Event not found." }, 404);
    }
    if (previousPosterUrl && uploadedPosterUrl && previousPosterUrl !== uploadedPosterUrl) {
      try {
        await deleteEventPoster(previousPosterUrl);
      } catch (cleanupError) {
        console.error("Failed to remove the replaced event poster:", cleanupError.message);
      }
    }
    return json({ event: data });
  } catch (error) {
    console.error("Admin event update failed:", error.message);
    const invalidUpload = error.message.startsWith("Choose a poster") || error.message.startsWith("Upload a JPG")
      || error.message.startsWith("The poster contents");
    const unavailable = error.message.startsWith("CLOUDINARY_") || error.message.includes("must be configured");
    return json({ error: invalidUpload || unavailable ? error.message : "Event could not be updated." }, invalidUpload ? 400 : unavailable ? 503 : 500);
  }
}

export async function DELETE(request, { params }) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  try {
    if (!isAuthorized(request)) return json({ error: "Admin authentication is required." }, 401);
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return json({ error: "Invalid event id." }, 400);
    const client = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await client.from("events")
      .select("id,poster_url").eq("id", id).maybeSingle();
    if (lookupError) throw new Error(`Event could not be read before deletion: ${lookupError.message}`);
    if (!existing) return json({ error: "Event not found." }, 404);
    const { data, error } = await client.from("events").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw new Error(`Event could not be deleted: ${error.message}`);
    if (!data) return json({ error: "Event not found." }, 404);
    if (existing.poster_url) {
      try {
        await deleteEventPoster(existing.poster_url);
      } catch (cleanupError) {
        console.error("Failed to remove a deleted event's poster:", cleanupError.message);
      }
    }
    return json({ ok: true });
  } catch (error) {
    console.error("Admin event deletion failed:", error.message);
    return json({ error: error.message.includes("must be configured") ? error.message : "Event could not be deleted." }, error.message.includes("must be configured") ? 503 : 500);
  }
}
