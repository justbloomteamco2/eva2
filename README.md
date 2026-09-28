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

The site exposes two forms: the **Contact / Collaboration** form on `/contact` and the **event attendee feedback** form on `/events`. Both show loading, success and error states, validate input on the server, and store submissions privately. Collaboration links can preselect the relevant enquiry type. Event feedback is sent to the fixed `ADMIN_EMAIL` recipient.

Configure server-only `RESEND_API_KEY`, `FEEDBACK_EMAIL_FROM` (an address on a Resend-verified domain), and `ADMIN_EMAIL` (the notification inbox). Failed email deliveries remain queued and Vercel retries them daily using `CRON_SECRET`.

The public enquiry, legacy creator application, and event feedback endpoints share the atomic Supabase rate limiter: three requests per IP hash per five minutes. The legacy creator API remains available without a linked public form; existing application records and profile photos are retained. The rate limiter reads only the configured trusted proxy header (`x-real-ip` on Vercel; `cf-connecting-ip` on Cloudflare), validates the value, and ignores `X-Forwarded-For`. Do not expose a direct origin that accepts client-supplied proxy headers.

## Public routes and API

Public pages: `/`, `/work`, `/events`, `/about`, and `/contact`. The legacy `/creators` route redirects to `/contact?category=Creator%20collaboration`.

All API errors use `{ "error": "..." }`; public form submissions return JSON. The event API returns only published records, paginated by 20:

| Method and path | Purpose |
| --- | --- |
| `POST /api/enquiries` | Save a brand or project enquiry |
| `POST /api/creators` | Legacy creator submission API; not linked from the public site |
| `POST /api/feedback` | Save event-attendee feedback |
| `GET /api/events?view=upcoming&page=1` | List published upcoming events |
| `GET /api/events?view=archive&page=1` | List published past events |
| `GET /api/maintenance/creator-photos` | Remove unclaimed creator photos; requires the cron bearer secret |
| `GET /api/maintenance/feedback-email` | Retry pending CSV notifications; requires the cron bearer secret |

Public submissions use bounded request sizes, Zod validation, same-origin checks, honeypot fields and rate limiting. Creator photos accept JPEG, PNG and WebP up to 5 MB and stay in a private Supabase Storage bucket.

## Supabase and deployment

Set `SUPABASE_URL`, the server-only `SUPABASE_SECRET_KEY`, `RATE_LIMIT_SECRET` (at least 32 random characters), `RATE_LIMIT_IP_HEADER`, and the email/cron variables in `.env.local` or Vercel's encrypted environment settings. `SUPABASE_SERVICE_ROLE_KEY` remains a legacy server-side fallback. Never expose a Supabase secret or email-provider credential through a `NEXT_PUBLIC_` variable.

The schema enables RLS and denies anonymous/authenticated direct access to enquiries, creator registrations, feedback, events and rate-limit records. Visitors can read published event records only through the filtered API. The creator-photo bucket is private and restricted to server-side access.

Vercel runs the photo-cleanup and feedback-email retry crons once daily. Set `CRON_SECRET` to a random secret of at least 32 characters. When moving to another host, configure an equivalent trusted scheduler and proxy IP header.

## Content integrity

Project names, services, locations and dates shown here were supplied in the Bardapure Productions brief. Dates, results and campaign-specific details are not invented where source material is unavailable. Upcoming events remain unannounced until a published event record exists. The hero uses locally bundled clips from supplied Instagram Reels, with muted playback and reduced-motion support.
