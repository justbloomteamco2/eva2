import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, createAdminCookieOptions, createAdminToken, verifyAdminCredentials } from "../../../../lib/admin-auth";
import { hasTrustedOrigin, readBoundedJson } from "../../../../lib/http";
import { allowRateLimitedRequest, getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(1024)
}).strict();

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (!hasTrustedOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    return json({ error: "Please submit JSON credentials." }, 415);
  }

  let body;
  try {
    body = await readBoundedJson(request, 4096);
  } catch (error) {
    return json({ error: error.status === 413 ? "This request is too large." : "Please check the submitted credentials." }, error.status || 400);
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check the submitted credentials." }, 400);

  try {
    const client = getSupabaseAdmin();
    const limit = await allowRateLimitedRequest(client, request);
    if (limit.missingIp) return json({ error: "This request could not be verified." }, 400);
    if (!limit.allowed) return json({ error: "Too many sign-in attempts. Try again later." }, 429);

    if (!(await verifyAdminCredentials(parsed.data.username, parsed.data.password))) {
      return json({ error: "Invalid username or password." }, 401);
    }

    const token = createAdminToken(parsed.data.username);
    const response = json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, createAdminCookieOptions());
    return response;
  } catch (error) {
    console.error("Admin login failed:", error.message);
    return json({ error: "Admin login is temporarily unavailable." }, 503);
  }
}
