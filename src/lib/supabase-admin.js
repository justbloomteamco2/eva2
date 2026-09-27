import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) must be configured.");
  }

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function allowRateLimitedRequest(client, request) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("RATE_LIMIT_SECRET must contain at least 32 characters.");
  }

  const ipHeader = (process.env.RATE_LIMIT_IP_HEADER || "x-real-ip").toLowerCase();
  if (!["x-real-ip", "cf-connecting-ip"].includes(ipHeader)) {
    throw new Error("RATE_LIMIT_IP_HEADER must be x-real-ip or cf-connecting-ip.");
  }
  const headerValue = request.headers.get(ipHeader)?.trim();
  const ip = headerValue && isIP(headerValue)
    ? headerValue
    : process.env.NODE_ENV === "development" ? "127.0.0.1" : null;
  if (!ip) return { allowed: false, missingIp: true };

  const requesterHash = createHash("sha256").update(`${secret}:${ip}`).digest("hex");
  const { data, error } = await client.rpc("allow_enquiry_submission", { requester_hash: requesterHash });
  if (error) throw new Error(`Rate-limit check failed: ${error.message}`);
  return { allowed: data === true, missingIp: false };
}
