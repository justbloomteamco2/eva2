import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminCookieOptions } from "../../../../lib/admin-auth";
import { hasTrustedOrigin } from "../../../../lib/http";

export const runtime = "nodejs";

export async function POST(request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...createAdminCookieOptions(), maxAge: 0 });
  return response;
}
