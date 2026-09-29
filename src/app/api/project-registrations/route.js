import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../lib/supabase-admin";
import { hasTrustedOrigin } from "../../../lib/http";
import { sendProjectRegistrationCsvEmail } from "../../../lib/feedback-email";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = 21 * 1024 * 1024;
const BUCKET = "project-registration-photos";
const genders = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];
const ifiCategories = ["Model", "Actor", "Creator", "Influencer", "Dancer", "Artist", "Performer", "Other"];
const meetupCategories = [
  "Content Creator", "Influencer", "Model", "Actor", "Dancer", "Singer", "Photographer",
  "Filmmaker", "Video Editor", "Graphic Designer", "Artist", "Host / Emcee", "Entrepreneur", "Other"
];
const collaborationOptions = [
  "Brand Collaborations", "Content Creation", "Photoshoots", "Reels", "Modelling",
  "Events", "Networking", "Film / Media Projects", "Influencer Campaigns", "Other"
];
const referralOptions = ["Instagram", "WhatsApp", "Friend / Creator", "Bardapure Productions", "Other"];
const photoTypes = {
  "image/jpeg": { extension: "jpg", matches: (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  "image/png": { extension: "png", matches: (data) => data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { extension: "webp", matches: (data) => data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP" }
};

const dateSchema = z.preprocess(
  (value) => value === "" || value == null ? null : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }).nullable()
);
const commonSchema = z.object({
  project: z.enum(["ifi", "creators_meetup"]),
  category: z.string().trim().min(2).max(80),
  fullName: z.string().trim().min(2).max(100),
  dateOfBirth: dateSchema,
  gender: z.enum(genders),
  phone: z.string().trim().regex(/^[+0-9().\s-]{8,20}$/),
  whatsapp: z.string().trim().max(20).default(""),
  email: z.string().trim().email().max(254),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  instagram: z.string().trim().max(300).default(""),
  youtube: z.union([z.literal(""), z.string().trim().url().max(500)]).default(""),
  otherSocialMedia: z.string().trim().max(1000).default(""),
  keySkills: z.string().trim().min(2).max(500),
  about: z.string().trim().max(2000).default(""),
  portfolio: z.union([z.literal(""), z.string().trim().url().max(500)]).default(""),
  preferredCollaborators: z.string().trim().max(500).default(""),
  interestedInFuture: z.enum(["", "yes", "no"]).default(""),
  preferredCity: z.string().trim().max(100).default(""),
  preferredMeetupDate: dateSchema,
  heardFrom: z.enum(["", ...referralOptions]).default(""),
  collaborationInterests: z.array(z.enum(collaborationOptions)).max(collaborationOptions.length)
    .refine((values) => new Set(values).size === values.length),
  termsAccepted: z.literal("true"),
  website: z.string().max(0).default("")
}).strict().superRefine((data, context) => {
  if (data.project === "ifi") {
    if (!data.dateOfBirth || !isOlderThan16(data.dateOfBirth)) {
      context.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "Applicants must be older than 16 years."
      });
    }
    if (data.about.trim().length < 30) {
      context.addIssue({
        code: "custom",
        path: ["about"],
        message: "Tell us about yourself in at least 30 characters."
      });
    }
    return;
  }

  if (data.whatsapp.length < 8 || !/^[+0-9().\s-]{8,20}$/.test(data.whatsapp)) {
    context.addIssue({ code: "custom", path: ["whatsapp"], message: "Enter a valid WhatsApp number." });
  }
  if (!data.instagram) {
    context.addIssue({ code: "custom", path: ["instagram"], message: "Instagram is required." });
  }
  if (data.preferredCity.length < 2) {
    context.addIssue({ code: "custom", path: ["preferredCity"], message: "Preferred city is required." });
  }
  if (!data.collaborationInterests.length) {
    context.addIssue({
      code: "custom",
      path: ["collaborationInterests"],
      message: "Select at least one collaboration interest."
    });
  }
});

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function getValue(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isOlderThan16(dateOfBirth) {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  const birthdayHasNotOccurred =
    today.getUTCMonth() + 1 < month
    || (today.getUTCMonth() + 1 === month && today.getUTCDate() < day);
  if (birthdayHasNotOccurred) age -= 1;
  return age > 16;
}

function validateImages(files, required) {
  if (required && (!files[0] || files[0].size === 0)) {
    return { error: "Choose a profile photo." };
  }
  if (files.some((file) => !(file instanceof File) || file.size === 0 || file.size > MAX_IMAGE_BYTES)) {
    return { error: "Each photo must be a JPG, PNG or WebP smaller than 5 MB." };
  }
  if (files.some((file) => !photoTypes[file.type])) {
    return { error: "Upload JPG, PNG or WebP photos only." };
  }
  return { error: null };
}

async function removeUploadedFiles(client, paths) {
  if (!paths.length) return;
  try {
    const { error } = await client.storage.from(BUCKET).remove(paths);
    if (error) console.error("Project registration upload cleanup failed:", error.message);
  } catch (error) {
    console.error("Project registration upload cleanup failed:", error.message);
  }
}

async function uploadFiles(client, files, registrationId) {
  const paths = [];
  try {
    for (const [index, file] of files.entries()) {
      const type = photoTypes[file.type];
      const path = `${registrationId}/${index}-${randomUUID()}.${type.extension}`;
      const contents = Buffer.from(await file.arrayBuffer());
      if (!type.matches(contents)) {
        throw Object.assign(new Error("Photo contents do not match the selected file type."), { status: 400 });
      }
      const { error } = await client.storage.from(BUCKET).upload(path, contents, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false
      });
      if (error) throw new Error(`Project registration photo upload failed: ${error.message}`);
      paths.push(path);
    }
    return paths;
  } catch (error) {
    await removeUploadedFiles(client, paths);
    throw error;
  }
}

export async function POST(request) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("multipart/form-data")) {
    return json({ error: "Please submit the form using the website." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isSafeInteger(contentLength) || contentLength < 1) {
    return json({ error: "This request could not be verified. Please try again." }, 411);
  }
  if (contentLength > MAX_REQUEST_BYTES) return json({ error: "The total photo upload must be smaller than 20 MB." }, 413);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Please check your application and try again." }, 400);
  }

  const project = getValue(formData, "project");
  if (project !== "ifi" && project !== "creators_meetup") {
    return json({ error: "Choose a valid registration form." }, 400);
  }

  const photoEntries = formData.getAll("profilePhoto");
  const additionalPhotoEntries = formData.getAll("additionalPhotos");
  if (photoEntries.length !== 1 || additionalPhotoEntries.some((item) => !(item instanceof File))) {
    return json({ error: "Please choose valid photo files and try again." }, 400);
  }
  const photo = photoEntries[0];
  const additionalPhotos = additionalPhotoEntries.filter((item) => item.size > 0);
  if (project === "creators_meetup" && formData.getAll("additionalPhotos").length) {
    return json({ error: "Additional photos are only supported for IFI applications." }, 400);
  }
  if (additionalPhotos.length > 3) return json({ error: "Choose no more than 3 additional photos." }, 400);
  const files = [photo, ...additionalPhotos].filter((item) => item instanceof File && item.size > 0);
  const imageResult = validateImages([photo, ...additionalPhotos], true);
  if (imageResult.error) return json({ error: imageResult.error }, 400);

  const input = Object.fromEntries(
    [...formData.entries()].filter(([key, value]) => typeof value === "string" && key !== "project")
  );
  input.project = project;
  input.category = getValue(formData, "category");
  input.termsAccepted = getValue(formData, "termsAccepted");
  input.collaborationInterests = formData.getAll("collaborationInterests");
  const validKeys = new Set([
    "fullName", "dateOfBirth", "gender", "phone", "whatsapp", "email", "city", "state",
    "instagram", "youtube", "otherSocialMedia", "keySkills", "about", "portfolio",
    "preferredCollaborators", "interestedInFuture", "preferredCity", "preferredMeetupDate",
    "heardFrom", "termsAccepted", "website", "project", "collaborationInterests"
  ]);
  const validFileKeys = new Set(["profilePhoto", "additionalPhotos"]);
  const seenFields = new Set();
  for (const [key] of formData.entries()) {
    if (!validKeys.has(key) && !validFileKeys.has(key)) {
      return json({ error: "Please check your application and try again." }, 400);
    }
    if (key !== "collaborationInterests" && key !== "additionalPhotos" && seenFields.has(key)) {
      return json({ error: "Please check your application and try again." }, 400);
    }
    seenFields.add(key);
  }
  for (const key of Object.keys(input)) {
    if (!validKeys.has(key)) return json({ error: "Please check your application and try again." }, 400);
  }

  const parsed = commonSchema.safeParse(input);
  if (!parsed.success) return json({ error: "Please check your details and try again." }, 400);
  const data = parsed.data;
  if (data.website) return json({ ok: true, referenceNumber: "received" });

  if (project === "ifi") {
    if (!ifiCategories.includes(getValue(formData, "category"))) return json({ error: "Choose a valid talent category." }, 400);
    if (data.instagram && !/^(@?[a-zA-Z0-9._]{1,80}|https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._/]+\/?)$/i.test(data.instagram)) {
      return json({ error: "Enter a valid Instagram username or profile link." }, 400);
    }
  } else {
    if (!meetupCategories.includes(getValue(formData, "category"))) return json({ error: "Choose a valid creator category." }, 400);
  }

  const collaborationInterests = formData.getAll("collaborationInterests");
  if (collaborationInterests.length > collaborationOptions.length
    || collaborationInterests.some((item) => typeof item !== "string" || !collaborationOptions.includes(item))
    || new Set(collaborationInterests).size !== collaborationInterests.length) {
    return json({ error: "Choose valid collaboration interests." }, 400);
  }

  let client;
  try {
    client = getSupabaseAdmin();
  } catch (error) {
    console.error("Project registration is not configured:", error.message);
    return json({ error: "Registrations are temporarily unavailable. Please try again later." }, 503);
  }
  try {
    const limit = await allowRateLimitedRequest(client, request);
    if (limit.missingIp) return json({ error: "We couldn’t verify this submission. Please try again later." }, 400);
    if (!limit.allowed) return json({ error: "Please wait a little before sending another submission." }, 429);
  } catch (error) {
    console.error("Project registration rate-limit check failed:", error.message);
    return json({ error: "Registrations are temporarily unavailable. Please try again later." }, 503);
  }

  const registrationId = randomUUID();
  const referenceNumber = `${project === "ifi" ? "IFI" : "BCM"}-${registrationId.slice(0, 8).toUpperCase()}`;
  let uploadedPaths = [];
  let registration;
  try {
    uploadedPaths = await uploadFiles(client, files, registrationId);
    const { data, error } = await client.from("project_registrations").insert({
      id: registrationId,
      reference_number: referenceNumber,
      project,
      category: data.category,
      full_name: data.fullName,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      city: data.city,
      state: data.state,
      instagram: data.instagram,
      youtube: data.youtube,
      other_social_media: data.otherSocialMedia,
      key_skills: data.keySkills,
      about: data.about,
      portfolio: data.portfolio,
      collaboration_interests: collaborationInterests,
      preferred_collaborators: data.preferredCollaborators,
      interested_in_future: data.interestedInFuture || null,
      preferred_city: data.preferredCity,
      preferred_meetup_date: data.preferredMeetupDate,
      heard_from: data.heardFrom,
      terms_accepted: data.termsAccepted === "true",
      profile_photo_path: uploadedPaths[0],
      additional_photo_paths: uploadedPaths.slice(1),
      payment_status: project === "ifi" ? "pending" : "not_required",
      payment_amount_paise: project === "ifi" ? 100000 : 0,
      payment_currency: "INR"
    }).select("*").single();

    if (error) throw new Error(`Project registration could not be saved: ${error.message}`);
    registration = data;
  } catch (error) {
    await removeUploadedFiles(client, uploadedPaths);
    if (error.status === 400) return json({ error: error.message }, 400);
    console.error("Project registration could not be completed:", error.message);
    return json({ error: "We couldn’t save your registration. Please try again." }, 500);
  }

  let notificationPending = false;
  try {
    const { error: attemptError } = await client.from("project_registrations")
      .update({ email_attempted_at: new Date().toISOString() })
      .eq("id", registration.id)
      .is("email_sent_at", null);
    if (attemptError) throw new Error(`Project registration email attempt could not be saved: ${attemptError.message}`);

    await sendProjectRegistrationCsvEmail(registration, client);
    const { error: updateError } = await client.from("project_registrations")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", registration.id)
      .is("email_sent_at", null);
    if (updateError) throw new Error(`Project registration email status could not be saved: ${updateError.message}`);
  } catch (emailError) {
    notificationPending = true;
    console.error("Project registration email delivery failed:", emailError.message);
  }

  return json({
    ok: true,
    registrationId: registration.id,
    referenceNumber: registration.reference_number,
    notificationPending
  });
}
