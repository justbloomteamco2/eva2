import { createHash, randomUUID } from "node:crypto";
import { MAX_EVENT_POSTER_BYTES } from "./upload-limits";

const POSTER_TYPES = {
  "image/jpeg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  "image/webp": (bytes) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
};
export const MAX_POSTER_BYTES = MAX_EVENT_POSTER_BYTES;

export async function uploadEventPoster(file) {
  if (!file || file.size < 1 || file.size > MAX_POSTER_BYTES) {
    throw new Error("Choose a poster image smaller than 8 MB.");
  }
  const matches = POSTER_TYPES[file.type];
  if (!matches) throw new Error("Upload a JPG, PNG or WebP event poster.");

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matches(bytes)) throw new Error("The poster contents do not match the selected image format.");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be configured.");
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) throw new Error("CLOUDINARY_CLOUD_NAME is invalid.");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "bardapure/events";
  const publicId = randomUUID();
  const signedParams = { folder, overwrite: "false", public_id: publicId, timestamp };
  const canonical = Object.keys(signedParams).sort().map((key) => `${key}=${signedParams[key]}`).join("&");
  const signature = createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");

  const formData = new FormData();
  formData.set("file", new Blob([bytes], { type: file.type }), file.name || "poster");
  formData.set("api_key", apiKey);
  formData.set("timestamp", timestamp);
  formData.set("folder", folder);
  formData.set("public_id", publicId);
  formData.set("overwrite", "false");
  formData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
    cache: "no-store"
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Cloudinary returned an unreadable response (HTTP ${response.status}).`);
  }
  if (!response.ok || typeof result.secure_url !== "string" || !result.secure_url.startsWith("https://")) {
    throw new Error(`Cloudinary upload failed: ${result.error?.message || `HTTP ${response.status}`}`);
  }
  return result.secure_url;
}

function getEventPosterPublicId(assetUrl) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME must be configured.");

  let url;
  try {
    url = new URL(assetUrl);
  } catch {
    return null;
  }
  if (url.hostname !== "res.cloudinary.com" || url.protocol !== "https:") return null;

  const marker = `/image/upload/`;
  const markerIndex = url.pathname.indexOf(marker);
  if (markerIndex < 0 || url.pathname.slice(0, markerIndex) !== `/${cloudName}`) return null;

  const path = url.pathname.slice(markerIndex + marker.length);
  const segments = path.split("/");
  if (/^v\d+$/.test(segments[0])) segments.shift();
  const filename = segments.pop();
  if (!filename) return null;
  segments.push(filename.replace(/\.[^.]+$/, ""));

  const publicId = segments.join("/");
  return publicId.startsWith("bardapure/events/") ? publicId : null;
}

export async function deleteEventPoster(assetUrl) {
  const publicId = getEventPosterPublicId(assetUrl);
  if (!publicId) return false;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be configured.");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams = { public_id: publicId, timestamp };
  const canonical = Object.keys(signedParams).sort().map((key) => `${key}=${signedParams[key]}`).join("&");
  const signature = createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
  const formData = new FormData();
  formData.set("public_id", publicId);
  formData.set("api_key", apiKey);
  formData.set("timestamp", timestamp);
  formData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: formData,
    cache: "no-store"
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Cloudinary returned an unreadable delete response (HTTP ${response.status}).`);
  }
  if (!response.ok || !["ok", "not found"].includes(result.result)) {
    throw new Error(`Cloudinary poster deletion failed: ${result.error?.message || `HTTP ${response.status}`}`);
  }
  return true;
}
