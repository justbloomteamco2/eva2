# Bardapure Productions®

An editorial Next.js portfolio and creator-registration site built with supplied Bardapure photography and campaign artwork. The site uses Next.js App Router, React, Tailwind CSS, GSAP/ScrollTrigger, Lenis, Lucide React and Supabase.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set server-side Supabase, admin, rate-limit and Cloudinary credentials.
3. Run the complete `supabase/schema.sql` in the Supabase SQL editor. It creates the event and feedback tables, the private `creator-photos` storage bucket, and the atomic rate-limit function. Re-apply it after schema changes.
4. Start the development server with `npm run dev`.

Generate a password hash in Node using `scrypt` and a random salt; set `ADMIN_PASSWORD_HASH` to the printed value (format `scrypt:<base64url-salt>:<base64url-key>`). In PowerShell, enter the password at the prompt (so it is not saved in shell history), generate the hash, then clear the temporary environment variable:

```powershell
$env:ADMIN_PLAINTEXT_PASSWORD = Read-Host "Admin password"
try {
  @'
const c = require("node:crypto");
const p = process.env.ADMIN_PLAINTEXT_PASSWORD;
const salt = c.randomBytes(16);
console.log(`scrypt:${salt.toString("base64url")}:${c.scryptSync(p, salt, 64).toString("base64url")}`);
'@ | node
} finally {
  Remove-Item Env:ADMIN_PLAINTEXT_PASSWORD
}
```

Set `ADMIN_USERNAME`, the resulting `ADMIN_PASSWORD_HASH`, and a cryptographically random `ADMIN_JWT_SECRET` of at least 32 characters. The signed HS256 admin cookie is HttpOnly, SameSite=Strict, Secure in production, scoped to `/` so server-rendered admin pages can verify it with `getAdminSession()`, and expires after eight hours. Configure all three Cloudinary values (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) for event poster uploads. Use `SUPABASE_PUBLISHABLE_KEY` for client-side Supabase access if needed; server routes require the secret `SUPABASE_SECRET_KEY` (legacy `SUPABASE_SERVICE_ROLE_KEY` remains a fallback). Cloudinary credentials, either Supabase secret key, `RATE_LIMIT_SECRET`, and `ADMIN_JWT_SECRET` are server-only: never prefix them with `NEXT_PUBLIC_` or expose them in client code.

Brand enquiries, creator registrations, admin logins, and feedback use the atomic Supabase rate-limit RPC: five requests per hashed requester address per 15 minutes. The rate limiter reads only the configured hosting-provider address header (`RATE_LIMIT_IP_HEADER`), validates it as an IP address, and ignores the spoofable `X-Forwarded-For` chain. Use `x-real-ip` on Vercel and change it to `cf-connecting-ip` when moving to Cloudflare. Local development uses a loopback address if the configured proxy header is unavailable. Do not expose a direct origin that accepts client-supplied proxy headers. All newly added state-changing endpoints require a matching `Origin` host. Creator registration accepts JPEG, PNG and WebP profile photos up to 5 MB and stores them in a private bucket. Events and feedback have RLS enabled and no anon/authenticated grants; event reads for visitors are available only through the filtered public API.

Vercel runs the `/api/maintenance/creator-photos` cron once daily. Set `CRON_SECRET` to a random secret with at least 32 characters in the deployment settings. The endpoint removes only creator photos older than 24 hours that have no corresponding creator-registration row, covering storage objects left behind by an interrupted upload/database write. When moving to Cloudflare, port this cleanup to a scheduled Worker or another trusted scheduler; do not expose the endpoint without the bearer secret.

## Preview and deployment

Keep the source in GitHub and connect the repository to Vercel for a client preview; the Next.js API routes, admin system, and Supabase integration require a server runtime and cannot run on GitHub Pages alone. Add the `.env.example` values to Vercel's encrypted environment-variable settings, never to the repository. When ready to move to Cloudflare, deploy the full Next.js application with a compatible Cloudflare/OpenNext adapter and configure the same server-only secrets there, setting `RATE_LIMIT_IP_HEADER=cf-connecting-ip`.

## Event and feedback API

All successful responses are JSON; errors use `{ "error": "..." }`. Admin routes require the `admin_session` cookie from login.

| Method and path | Request | Success |
| --- | --- | --- |
| `POST /api/admin/login` | JSON `{ "username": "...", "password": "..." }` | `200 { "ok": true }`, sets the admin cookie |
| `POST /api/admin/logout` | Empty body | `200 { "ok": true }`, clears the cookie |
| `GET /api/admin/events?page=1` | Admin cookie | `200 { "events": [...], "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }` |
| `POST /api/admin/events` | Multipart fields `title`, `date` (`YYYY-MM-DD`; past dates are allowed for the archive), `city`, `poster` file (optional), `description`, `registration_type` (`free`/`paid`), optional `registration_link`, `status` (`draft`/`published`) | `201 { "event": {...} }` |
| `PATCH /api/admin/events/{id}` | Multipart with one or more event fields above; poster is optional and omitted fields are left unchanged | `200 { "event": {...} }` |
| `DELETE /api/admin/events/{id}` | Empty body | `200 { "ok": true }` |
| `GET /api/events?view=upcoming&page=1` | No authentication | `200` with paginated published events dated today or later in India |
| `GET /api/events?view=archive&page=1` | No authentication | `200` with paginated published events before today's date in India |
| `POST /api/feedback` | JSON `{ "name": "...", "event": "...", "rating": 1, "message": "...", "website": "" }` (`website` is an optional honeypot) | `201 { "ok": true }` |

Posters, when provided, must be JPEG, PNG or WebP, at most 8 MB; the client rejects oversized files before upload, the server verifies file signatures, and Cloudinary uploads are signed. Replaced and deleted event posters are removed from Bardapure's Cloudinary event folder after their database change succeeds. Feedback ratings are integers from 1 to 5. Both create endpoints validate request size, fields, and same-origin before writing with server credentials. Admin event listing and the public event API never return draft entries to visitors. Event list APIs use stable, 20-item pagination; the admin editor saves text fields to the current tab and restores them after an expired session (selected local files must be chosen again).

Invalid fields, dates, IDs and uploads return `400`; oversized bodies return `413`; unsupported media types return `415`; rejected origins return `403`; invalid or expired admin sessions return `401`; missing records return `404`; rate limits return `429`; and unavailable server dependencies return `503`. Login rejects incorrect credentials with `401`.

## Supabase configuration

Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and a long, random `RATE_LIMIT_SECRET`. Optionally set `SUPABASE_PUBLISHABLE_KEY` for client-side Supabase access; server-side routes use `SUPABASE_SECRET_KEY`, falling back to `SUPABASE_SERVICE_ROLE_KEY` for legacy deployments. The SQL schema stores enquiries, creator profiles, events and feedback with row-level security enabled; denies anonymous and authenticated direct table access for all of them; and creates a restricted database function for atomic rate limiting. Creator profile photos remain private and are only uploaded or removed by the server; a restrictive Storage RLS policy also prevents client roles from accessing the private-photo bucket even if other project policies permit access to different buckets.

## Content integrity

Project names, services, network figures, locations and dates shown here were supplied in the Bardapure Productions brief. Dates, results and campaign-specific imagery are not available for every case study and are deliberately not implied. Upcoming events are marked as unannounced, not advertised as scheduled. Recognition quotes and images come from the supplied appreciation artwork. Contact and social links use the Instagram account names provided in the brief.

The homepage hero uses locally bundled short playback from the supplied Royal Enfield Flying Flea and Bidar Air Force Station Instagram Reels as a full-bleed background. A dark gradient keeps the overlaid headline readable. The muted carousel advances between the two clips, provides visible playback/navigation controls, and pauses when reduced motion is preferred or the browser tab is hidden.
