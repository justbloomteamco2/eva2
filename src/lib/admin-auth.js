import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
export const ADMIN_COOKIE_NAME = "admin_session";
const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60;

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function configuredSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_JWT_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export async function verifyAdminCredentials(username, password) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUsername || !passwordHash) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be configured.");
  }

  const usernameMatches = username.length === expectedUsername.length
    && timingSafeEqual(createHash("sha256").update(username).digest(), createHash("sha256").update(expectedUsername).digest());
  const [scheme, salt, expectedKey] = passwordHash.split(":");
  if (scheme !== "scrypt" || !salt || !expectedKey || passwordHash.split(":").length !== 3) {
    throw new Error("ADMIN_PASSWORD_HASH must use the scrypt:<salt>:<hash> format.");
  }

  let expected;
  let actual;
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(salt) || !/^[A-Za-z0-9_-]+$/.test(expectedKey)) {
      throw new Error("Invalid base64url value.");
    }
    const saltBytes = Buffer.from(salt, "base64url");
    expected = Buffer.from(expectedKey, "base64url");
    if (saltBytes.length !== 16 || saltBytes.toString("base64url") !== salt
      || expected.length !== 64 || expected.toString("base64url") !== expectedKey) {
      throw new Error("Invalid scrypt salt or key.");
    }
    actual = await scrypt(password, saltBytes, expected.length);
  } catch {
    throw new Error("ADMIN_PASSWORD_HASH is malformed.");
  }
  return usernameMatches && timingSafeEqual(expected, actual);
}

export function createAdminToken(username) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: username, iat: now, exp: now + TOKEN_LIFETIME_SECONDS }));
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", configuredSecret()).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifyAdminToken(token) {
  configuredSecret();
  try {
    if (typeof token !== "string") return false;
    const [encodedHeader, encodedPayload, encodedSignature, ...extra] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature || extra.length) return false;

    const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (header.alg !== "HS256" || header.typ !== "JWT") return false;
    const expectedSignature = createHmac("sha256", configuredSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    const providedSignature = Buffer.from(encodedSignature, "base64url");
    if (providedSignature.length !== expectedSignature.length || !timingSafeEqual(providedSignature, expectedSignature)) return false;

    return payload.sub === process.env.ADMIN_USERNAME
      && Number.isInteger(payload.iat)
      && Number.isInteger(payload.exp)
      && payload.iat <= Math.floor(Date.now() / 1000)
      && payload.exp > Math.floor(Date.now() / 1000)
      && payload.exp - payload.iat <= TOKEN_LIFETIME_SECONDS;
  } catch {
    return false;
  }
}

export async function getAdminSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export function createAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TOKEN_LIFETIME_SECONDS
  };
}

export function generateScryptPasswordHash(password, salt = randomBytes(16)) {
  return scrypt(password, salt, 64).then((key) => `scrypt:${salt.toString("base64url")}:${key.toString("base64url")}`);
}
