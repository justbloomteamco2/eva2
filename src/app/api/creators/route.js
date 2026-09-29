import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { creatorCategories, creatorInterests } from "../../../data/content";
import { hasTrustedOrigin } from "../../../lib/http";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../lib/supabase-admin";
import { sendCreatorApplicationCsvEmail } from "../../../lib/feedback-email";
import { MAX_CREATOR_PHOTO_BYTES } from "../../../lib/upload-limits";

export const runtime = "nodejs";

const creatorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[+0-9().\s-]{8,20}$/),
  email: z.string().trim().email().max(254),
  city: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(18).max(100),
  category: z.enum(creatorCategories),
  instagram: z.string().trim().max(80).default(""),
  portfolio: z.union([z.literal(""), z.string().trim().url().max(500)]).default(""),
  audienceSize: z.string().trim().max(80).default(""),
  languages: z.string().trim().min(2).max(200),
  skills: z.string().trim().min(2).max(500),
  interests: z.array(z.enum(creatorInterests)).max(creatorInterests.length).refine((values) => new Set(values).size === values.length),
  website: z.string().max(0).default("")
}).strict();

const PHOTO_TYPES = {
  "image/jpeg": { extension: "jpg", matches: (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  "image/png": { extension: "png", matches: (data) => data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { extension: "webp", matches: (data) => data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP" }
};
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function removeUnclaimedPhoto(client, photoPath) {
  try {
    const { error } = await client.storage.from("creator-photos").remove([photoPath]);
    if (error) console.error("Failed to remove an unclaimed creator photo:", error.message);
  } catch (error) {
    console.error("Failed to remove an unclaimed creator photo:", error.message);
  }
}

export async function POST(request) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("multipart/form-data")) {
    return json({ error: "Please submit your profile using the website." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isSafeInteger(contentLength) || contentLength < 1) {
    return json({ error: "This request could not be verified. Please try again." }, 411);
  }
  if (contentLength > MAX_REQUEST_BYTES) return json({ error: "This profile is too large. Choose a photo smaller than 5 MB." }, 413);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Please check your profile and try again." }, 400);
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0 || photo.size > MAX_CREATOR_PHOTO_BYTES) {
    return json({ error: "Choose a profile photo smaller than 5 MB." }, 400);
  }
  const photoType = PHOTO_TYPES[photo.type];
  if (!photoType) return json({ error: "Upload a JPG, PNG or WebP profile photo." }, 400);

  const interests = formData.getAll("interests");
  const input = Object.fromEntries(
    [...formData.entries()].filter(([key]) => key !== "photo" && key !== "interests")
  );
  input.interests = interests;
  const parsed = creatorSchema.safeParse(input);
  if (!parsed.success) return json({ error: "Please check your details and try again." }, 400);
  if (parsed.data.website) return json({ ok: true });

  let client;
  try {
    client = getSupabaseAdmin();
  } catch (error) {
    console.error("Creator registration is not configured:", error.message);
    return json({ error: "Creator registration is temporarily unavailable. Please try again later." }, 503);
  }

  try {
    const limit = await allowRateLimitedRequest(client, request);
    if (limit.missingIp) return json({ error: "We couldn’t verify this submission. Please try again later." }, 400);
    if (!limit.allowed) return json({ error: "Please wait a little before sending another submission." }, 429);
  } catch (error) {
    console.error("Creator rate-limit check failed:", error.message);
    return json({ error: "Creator registration is temporarily unavailable. Please try again later." }, 503);
  }

  let photoBuffer;
  try {
    photoBuffer = Buffer.from(await photo.arrayBuffer());
  } catch (error) {
    console.error("Creator profile photo could not be read:", error.message);
    return json({ error: "We couldn’t read your photo. Please choose it again and retry." }, 400);
  }
  if (!photoType.matches(photoBuffer)) return json({ error: "The photo contents don’t match the selected image format." }, 400);

  const photoPath = `${randomUUID()}.${photoType.extension}`;
  let uploadError;
  try {
    ({ error: uploadError } = await client.storage.from("creator-photos").upload(photoPath, photoBuffer, {
      contentType: photo.type,
      cacheControl: "3600",
      upsert: false
    }));
  } catch (error) {
    await removeUnclaimedPhoto(client, photoPath);
    console.error("Creator profile photo upload failed:", error.message);
    return json({ error: "We couldn’t save your photo. Please try again." }, 500);
  }
  if (uploadError) {
    await removeUnclaimedPhoto(client, photoPath);
    console.error("Creator profile photo could not be stored:", uploadError.message);
    return json({ error: "We couldn’t save your photo. Please try again." }, 500);
  }

  let application;
  let insertError;
  try {
    ({ data: application, error: insertError } = await client.from("creator_registrations").insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      city: parsed.data.city,
      age: parsed.data.age,
      category: parsed.data.category,
      instagram: parsed.data.instagram,
      portfolio: parsed.data.portfolio,
      audience_size: parsed.data.audienceSize,
      languages: parsed.data.languages,
      skills: parsed.data.skills,
      interests: parsed.data.interests,
      photo_path: photoPath
    })
      .select("id, name, phone, email, city, age, category, instagram, portfolio, audience_size, languages, skills, interests, photo_path, created_at")
      .single());
  } catch (error) {
    await removeUnclaimedPhoto(client, photoPath);
    console.error("Creator registration could not be saved:", error.message);
    return json({ error: "We couldn’t save your profile. Please try again." }, 500);
  }
  if (insertError) {
    await removeUnclaimedPhoto(client, photoPath);
    console.error("Creator registration could not be saved:", insertError.message);
    return json({ error: "We couldn’t save your profile. Please try again." }, 500);
  }

  let notificationPending = false;
  try {
    const { error: attemptError } = await client.from("creator_registrations")
      .update({ email_attempted_at: new Date().toISOString() })
      .eq("id", application.id)
      .is("email_sent_at", null);
    if (attemptError) throw new Error(`Application email attempt could not be saved: ${attemptError.message}`);

    await sendCreatorApplicationCsvEmail(application, client);
    const { error: updateError } = await client.from("creator_registrations")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", application.id)
      .is("email_sent_at", null);
    if (updateError) throw new Error(`Application email status could not be saved: ${updateError.message}`);
  } catch (emailError) {
    notificationPending = true;
    console.error("Creator application email delivery failed:", emailError.message);
  }

  return json({ ok: true, notificationPending });
}
