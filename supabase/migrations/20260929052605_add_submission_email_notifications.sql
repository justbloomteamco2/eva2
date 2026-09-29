alter table public.enquiries
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_attempted_at timestamptz;

grant update on public.enquiries to service_role;

create index if not exists enquiries_email_pending_idx
  on public.enquiries (email_attempted_at, created_at, id)
  where email_sent_at is null;

alter table public.project_registrations
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_attempted_at timestamptz;

create index if not exists project_registrations_email_pending_idx
  on public.project_registrations (email_attempted_at, created_at, id)
  where email_sent_at is null;
alter table public.enquiries
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_attempted_at timestamptz;

grant update on public.enquiries to service_role;

create index if not exists enquiries_email_pending_idx
  on public.enquiries (email_attempted_at, created_at, id)
  where email_sent_at is null;

alter table public.project_registrations
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_attempted_at timestamptz;

create index if not exists project_registrations_email_pending_idx
  on public.project_registrations (email_attempted_at, created_at, id)
  where email_sent_at is null;