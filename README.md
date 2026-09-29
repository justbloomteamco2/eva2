# Bardapure Productions®

An editorial Next.js portfolio and creator-registration site built with Bardapure photography and campaign artwork. The project uses Next.js App Router, React, Tailwind CSS, GSAP/ScrollTrigger, Lenis, Lucide React and Supabase.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the Supabase, rate-limit, email-delivery and cron secrets.
3. For a new database, run `supabase/schema.sql` in the Supabase SQL editor. For an existing installation, also apply `supabase/migrations/20260927185132_remove_admin_panel.sql` as described below.
4. Start the development server with `npm run dev`.

The public site content is bundled with the application. The admin dashboard, admin authentication, private admin APIs and editable CMS have been removed. Event listings remain read-only through the public API.

## Existing database cleanup

Apply `supabase/migrations/20260927185132_remove_admin_panel.sql` once to an existing project. It deletes event listings, drops the CMS content, admin credentials and admin audit tables, and leaves the event table in place for the public event API. It does **not** delete enquiries, creator applications, event feedback, creator profile photos, or the rate-limit records. This migration is destructive to the listed CMS/admin data and the existing public event schedule. Remove obsolete `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET`, `ADMIN_RECOVERY_KEY` and `CLOUDINARY_*` values from local and deployment configuration; retain `ADMIN_EMAIL` only if it is still the fixed notification recipient.

The migration does not delete Cloudinary files previously uploaded for event posters or CMS images. Those external assets are retained; the migration only removes their database references.

## Forms and notifications

The **event attendee feedback** form is on `/events`. The separate **job / creator application** form is on `/creators`. Both forms show loading, success and error states, validate input on the server, and store submissions privately. Event feedback and creator applications are sent as separate CSV emails to the fixed `ADMIN_EMAIL` recipient.

Configure server-only `RESEND_API_KEY`, `FEEDBACK_EMAIL_FROM` (an address on a Resend-verified domain), and `ADMIN_EMAIL` (the notification inbox). Failed email deliveries remain queued and Vercel retries them daily using `CRON_SECRET`. Creator application CSVs omit private profile-photo storage paths.

The public enquiry, creator application and event feedback endpoints share the atomic Supabase rate limiter: three requests per IP hash per five minutes. It reads only the configured trusted proxy header (`x-real-ip` on Vercel; `cf-connecting-ip` on Cloudflare), validates the value, and ignores `X-Forwarded-For`. Do not expose a direct origin that accepts client-supplied proxy headers.

## Public routes and API

Public pages: `/`, `/work`, `/events`, `/creators`, `/about`, and `/contact`.

All API errors use `{ "error": "..." }`; public form submissions return JSON. The event API returns only published records, paginated by 20:

| Method and path | Purpose |
| --- | --- |
| `POST /api/enquiries` | Save a brand or project enquiry |
| `POST /api/creators` | Save a creator/job application and private profile photo |
| `POST /api/feedback` | Save event-attendee feedback |
| `GET /api/events?view=upcoming&page=1` | List published upcoming events |
| `GET /api/events?view=archive&page=1` | List published past events |
| `GET /api/maintenance/creator-photos` | Remove unclaimed creator photos; requires the cron bearer secret |
| `GET /api/maintenance/feedback-email` | Retry pending CSV notifications; requires the cron bearer secret |

Public submissions use bounded request sizes, Zod validation, same-origin checks, honeypot fields and rate limiting. Creator photos accept JPEG, PNG and WebP up to 5 MB and stay in a private Supabase Storage bucket.

## Technology and current hosting

- **Application:** Next.js 15 App Router and React
- **Database and storage:** Supabase
- **Current hosting:** Vercel
- **Version control:** GitHub
- **Cloudflare target:** Cloudflare Workers using the OpenNext adapter. The Wrangler Worker name is `eva2`, matching the existing Cloudflare Worker and its custom domain; the existing Next.js/Vercel workflow remains available

## Supabase and deployment

Set `SUPABASE_URL`, the server-only `SUPABASE_SECRET_KEY`, `RATE_LIMIT_SECRET` (at least 32 random characters), `RATE_LIMIT_IP_HEADER`, and the email/cron variables in `.env.local` or the host's encrypted environment settings. `SUPABASE_SERVICE_ROLE_KEY` remains a legacy server-side fallback. Never expose a Supabase secret or email-provider credential through a `NEXT_PUBLIC_` variable.

The schema enables RLS and denies anonymous/authenticated direct access to enquiries, creator registrations, feedback, events and rate-limit records. Visitors can read published event records only through the filtered API. The creator-photo bucket is private and restricted to server-side access.

Vercel runs the photo-cleanup and feedback-email retry crons once daily. Cloudflare uses the same UTC schedules in `wrangler.jsonc`; `worker.js` dispatches each trigger to its existing authenticated maintenance route. Set `CRON_SECRET` to the same random secret in the Cloudflare Worker environment.

## Deploying to Cloudflare

The Cloudflare deployment uses `@opennextjs/cloudflare` to adapt this Next.js app to Workers. Use Node.js 22 or newer for install/build/deploy commands. Keep using `npm run dev` for normal development and `npm run build` for the regular Next.js build. The following additional scripts are available:

1. Install exactly the checked-in dependencies with `npm ci`.
2. Copy `.dev.vars.example` to `.dev.vars` and add local values for the Supabase, rate-limit, cron and email variables. `.dev.vars` is ignored by Git; never commit it.
3. Run `npm run preview` to build the Worker and exercise it locally in the Cloudflare Workers runtime.
4. In Cloudflare, create or select a Workers account and authenticate Wrangler with `npx wrangler login`.
5. In **Workers & Pages → eva2 → Settings → Variables and Secrets**, add `SUPABASE_URL`, `ADMIN_EMAIL`, and `FEEDBACK_EMAIL_FROM` as variables; add `SUPABASE_SECRET_KEY`, `RATE_LIMIT_SECRET`, `CRON_SECRET`, and `RESEND_API_KEY` as secrets. `RATE_LIMIT_IP_HEADER=cf-connecting-ip` is already set in `wrangler.jsonc`. Use the matching Supabase project's server-only secret key, plus a Resend API key and sender address on a domain verified with Resend. Do not put secret values in `wrangler.jsonc` or commit them.
6. For the Git-connected Worker build at **Workers & Pages → eva2 → Settings → Builds**, use:

   - Build command: `npm run cf-build`
   - Deploy command: `npm run cf-deploy`
   - Root directory: `/`
   - Production branch: `main`

   These scripts run the OpenNext adapter in its separate build and deploy phases. Do not use `npm run build` plus `npx wrangler deploy`: that skips the OpenNext Worker bundle. The Wrangler `name` in `wrangler.jsonc` must stay `eva2` to match the existing Worker and domain.

7. Start or retry the production deployment after adding those settings and runtime secrets. Alternatively, test/deploy from a terminal with `npm run preview` and `npm run deploy` after `npx wrangler login`.
8. Test the generated `*.workers.dev` URL before changing DNS. Verify public routes, forms, Supabase writes/storage, email notifications, and both maintenance jobs. Confirm Cloudflare Cron Triggers are present in Worker settings.
9. Add the purchased domain as a Cloudflare zone. If it is registered elsewhere, change its nameservers at the registrar to the nameservers Cloudflare assigns, then wait until Cloudflare reports the zone as **Active**.
10. Attach the apex domain and (if desired) `www` as Worker custom domains in **Worker → Settings → Domains & Routes → Add → Custom Domain**. Test HTTPS and the live forms on the custom domain.
11. Keep Vercel deployed and working until Cloudflare is verified. After DNS cutover, confirm the domain resolves to the Cloudflare Worker, then decide whether to retain Vercel as rollback hosting.

Do not remove `vercel.json` until Vercel is no longer needed; its cron configuration remains useful for rollback. Cloudflare schedules are configured separately in `wrangler.jsonc`. Cron jobs use UTC. When connecting GitHub to Cloudflare, deploy the intended reviewed branch—this local checkout may have uncommitted changes and may need to be synchronized with GitHub first. OpenNext warns that Windows support is limited; if local Worker previews behave inconsistently, run them in WSL or use Cloudflare's Git-based build environment.

## Content integrity

Project names, services, locations and dates shown here were supplied in the Bardapure Productions brief. Dates, results and campaign-specific details are not invented where source material is unavailable. Upcoming events remain unannounced until a published event record exists. The hero uses locally bundled clips from supplied Instagram Reels, with muted playback and reduced-motion support.
