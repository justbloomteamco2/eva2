import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../lib/supabase-admin";
import { hasTrustedOrigin, readBoundedJson } from "../../../lib/http";

export const runtime = "nodejs";

const COOKIE_NAME = "community_voter";
const categories = ["Community", "Photography", "Events", "Talent"];
const reviewSchema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  category: z.enum(categories),
  quote: z.string().trim().min(5).max(500)
}).strict();

function voterIdFromRequest(request) {
  const value = request.cookies?.get(COOKIE_NAME)?.value
    || request.headers.get("cookie")?.match(/(?:^|;\s*)community_voter=([0-9a-f-]+)/i)?.[1];
  return value && z.string().uuid().safeParse(value).success ? value : null;
}

function hashVoterId(voterId) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) throw new Error("RATE_LIMIT_SECRET must contain at least 32 characters.");
  return createHash("sha256").update(`${secret}:${voterId}`).digest("hex");
}

function json(body, status = 200, headers = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers }
  });
}

function toReview(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    category: row.category,
    quote: row.quote,
    likes: row.likes,
    createdAt: row.created_at,
    isSample: row.is_sample
  };
}

export async function GET(request) {
  let client;
  try {
    client = getSupabaseAdmin();
    const voterId = voterIdFromRequest(request) || randomUUID();
    const voterHash = hashVoterId(voterId);
    const [reviewsResult, likesResult] = await Promise.all([
      client.from("community_reviews")
        .select("id,name,city,category,quote,likes,is_sample,created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      client.from("community_review_likes")
        .select("review_id")
        .eq("voter_hash", voterHash)
        .order("created_at", { ascending: false })
    ]);
    if (reviewsResult.error) throw new Error(`Community reviews could not be loaded: ${reviewsResult.error.message}`);
    if (likesResult.error) throw new Error(`Community review likes could not be loaded: ${likesResult.error.message}`);
    const reviewIds = (reviewsResult.data || []).map((review) => review.id);
    const repliesResult = reviewIds.length
      ? await client.from("review_replies")
        .select("id,review_id,name,reply_text,created_at")
        .in("review_id", reviewIds)
        .order("created_at", { ascending: true })
      : { data: [], error: null };
    if (repliesResult.error) throw new Error(`Community review replies could not be loaded: ${repliesResult.error.message}`);

    const secure = new URL(request.url).protocol === "https:";
    const cookie = `${COOKIE_NAME}=${voterId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
    return json({
      reviews: (reviewsResult.data || []).map((review) => ({
        ...toReview(review),
        replies: (repliesResult.data || [])
          .filter((reply) => reply.review_id === review.id)
          .map((reply) => ({
            id: reply.id,
            reviewId: reply.review_id,
            name: reply.name,
            replyText: reply.reply_text,
            createdAt: reply.created_at
          }))
      })),
      likedIds: (likesResult.data || []).map((like) => like.review_id)
    }, 200, { "Set-Cookie": cookie });
  } catch (error) {
    console.error("Community reviews could not be loaded:", error.message);
    return json({ error: "Community reviews are temporarily unavailable." }, 503);
  }
}

export async function POST(request) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    return json({ error: "Please submit your review using the website." }, 415);
  }

  let body;
  try {
    body = await readBoundedJson(request, 4096);
  } catch (error) {
    return json({ error: error.status === 413 ? "This review is too large." : "Please check your review and try again." }, error.status || 400);
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Enter your name, city, category, and a review of at least 5 characters." }, 400);

  let client;
  try {
    client = getSupabaseAdmin();
    const limit = await allowRateLimitedRequest(client, request);
    if (limit.missingIp) return json({ error: "We couldn’t verify this submission. Please try again later." }, 400);
    if (!limit.allowed) return json({ error: "Please wait a little before posting another review." }, 429);
  } catch (error) {
    console.error("Community review submission is not configured:", error.message);
    return json({ error: "Reviews are temporarily unavailable. Please try again later." }, 503);
  }

  const { data, error } = await client.from("community_reviews")
    .insert({ ...parsed.data, is_sample: false })
    .select("id,name,city,category,quote,likes,is_sample,created_at")
    .single();
  if (error) {
    console.error("Community review could not be saved:", error.message);
    return json({ error: "We couldn’t save your review. Please try again." }, 500);
  }
  return json({ review: toReview(data) }, 201);
}
