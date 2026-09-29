import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "../../../../../lib/supabase-admin";
import { hasTrustedOrigin } from "../../../../../lib/http";

export const runtime = "nodejs";

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return json({ error: "This review could not be found." }, 404);

  const voterId = request.cookies?.get("community_voter")?.value
    || request.headers.get("cookie")?.match(/(?:^|;\s*)community_voter=([0-9a-f-]+)/i)?.[1];
  if (!voterId || !z.string().uuid().safeParse(voterId).success) {
    return json({ error: "Refresh the page before liking a review." }, 400);
  }

  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) {
    console.error("Community review likes are not configured: RATE_LIMIT_SECRET is missing or too short.");
    return json({ error: "Likes are temporarily unavailable." }, 503);
  }

  try {
    const voterHash = createHash("sha256").update(`${secret}:${voterId}`).digest("hex");
    const client = getSupabaseAdmin();
    const { data, error } = await client.rpc("like_community_review", {
      p_review_id: id,
      p_voter_hash: voterHash
    });
    if (error) {
      console.error("Community review could not be liked:", error.message);
      return json({ error: "We couldn’t like this review. Please try again." }, 500);
    }
    return json({ likes: data, liked: true });
  } catch (error) {
    console.error("Community review like service failed:", error.message);
    return json({ error: "Likes are temporarily unavailable." }, 503);
  }
}
