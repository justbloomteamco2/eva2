import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PHOTO_BUCKET = "creator-photos";
const MINIMUM_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;

function isAuthorized(request) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  if (!expected || !authorization.startsWith("Bearer ")) return false;

  const expectedToken = Buffer.from(expected);
  const providedToken = Buffer.from(authorization.slice(7));
  if (expectedToken.length < 32 || providedToken.length !== expectedToken.length) return false;
  return timingSafeEqual(providedToken, expectedToken);
}

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request) {
  if (!isAuthorized(request)) return json({ error: "Maintenance authorization is required." }, 401);

  try {
    const client = getSupabaseAdmin();
    const cutoff = Date.now() - MINIMUM_ORPHAN_AGE_MS;
    const orphanPaths = [];

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await client.storage.from(PHOTO_BUCKET).list("", {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: "created_at", order: "asc" }
      });
      if (error) throw new Error(`Creator photo listing failed: ${error.message}`);

      for (const file of data || []) {
        const createdAt = Date.parse(file.created_at || "");
        if (file.name && Number.isFinite(createdAt) && createdAt < cutoff) orphanPaths.push(file.name);
      }
      if (!data || data.length < PAGE_SIZE) break;
    }

    let removed = 0;
    for (let index = 0; index < orphanPaths.length; index += PAGE_SIZE) {
      const paths = orphanPaths.slice(index, index + PAGE_SIZE);
      const { data: registrations, error: lookupError } = await client
        .from("creator_registrations")
        .select("photo_path")
        .in("photo_path", paths);
      if (lookupError) throw new Error(`Creator photo reference lookup failed: ${lookupError.message}`);

      const referenced = new Set((registrations || []).map((registration) => registration.photo_path));
      const unreferenced = paths.filter((photoPath) => !referenced.has(photoPath));
      if (unreferenced.length === 0) continue;

      const { data, error: removalError } = await client.storage.from(PHOTO_BUCKET).remove(unreferenced);
      if (removalError) throw new Error(`Orphaned creator photo removal failed: ${removalError.message}`);
      removed += data?.length || 0;
    }

    return json({ ok: true, removed });
  } catch (error) {
    console.error("Creator photo cleanup failed:", error.message);
    return json({ error: "Creator photo cleanup is temporarily unavailable." }, 503);
  }
}
