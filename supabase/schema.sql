create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  organisation text not null default '' check (char_length(organisation) <= 160),
  category text not null check (category in (
    'Brand partnership',
    'Event production',
    'Creator campaign',
    'Campus partnership',
    'Film / production enquiry',
    'Joining the network',
    'Something else'
  )),
  message text not null check (char_length(message) between 10 and 4000),
  created_at timestamptz not null default now()
);

alter table public.enquiries drop constraint if exists enquiries_category_check;
alter table public.enquiries add constraint enquiries_category_check check (category in (
  'Brand partnership',
  'Event production',
  'Creator campaign',
  'Campus partnership',
  'Film / production enquiry',
  'Joining the network',
  'Something else'
));

alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon, authenticated;
grant insert, select on public.enquiries to service_role;

create table if not exists public.creator_registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (char_length(phone) between 8 and 20),
  email text not null check (char_length(email) <= 254),
  city text not null check (char_length(city) between 2 and 100),
  age integer not null check (age between 18 and 100),
  category text not null check (category in (
    'Content creator',
    'Instagram influencer',
    'Model',
    'Actor',
    'Host / emcee',
    'Dancer',
    'Musician',
    'Photographer',
    'Videographer',
    'Content writer',
    'Designer',
    'Filmmaker',
    'Event professional',
    'Social media professional',
    'Other'
  )),
  instagram text not null default '' check (char_length(instagram) <= 80),
  portfolio text not null default '' check (char_length(portfolio) <= 500),
  audience_size text not null default '' check (char_length(audience_size) <= 80),
  languages text not null check (char_length(languages) between 2 and 200),
  skills text not null check (char_length(skills) between 2 and 500),
  interests text[] not null default '{}',
  photo_path text not null,
  created_at timestamptz not null default now(),
  constraint creator_registration_interests_valid check (
    interests <@ array[
      'Brand collaborations',
      'Events',
      'Paid campaigns',
      'Modelling',
      'Acting',
      'Content creation',
      'Hosting',
      'Photography / videography'
    ]::text[]
  )
);

alter table public.creator_registrations enable row level security;
revoke all on public.creator_registrations from anon, authenticated;
grant insert, select on public.creator_registrations to service_role;
create index if not exists creator_registrations_photo_path_idx
  on public.creator_registrations (photo_path);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creator-photos', 'creator-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists restrict_creator_photos_to_server on storage.objects;
create policy restrict_creator_photos_to_server
on storage.objects
as restrictive
for all
to anon, authenticated
using (bucket_id <> 'creator-photos')
with check (bucket_id <> 'creator-photos');

create table if not exists public.enquiry_rate_limits (
  requester_hash text primary key check (char_length(requester_hash) = 64),
  window_started_at timestamptz not null default now(),
  submission_count integer not null default 1 check (submission_count between 1 and 5)
);

alter table public.enquiry_rate_limits enable row level security;
revoke all on public.enquiry_rate_limits from anon, authenticated, service_role;

create or replace function public.allow_enquiry_submission(requester_hash text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_window public.enquiry_rate_limits%rowtype;
begin
  insert into public.enquiry_rate_limits (requester_hash)
  values (allow_enquiry_submission.requester_hash)
  on conflict (requester_hash) do nothing;

  select * into current_window
  from public.enquiry_rate_limits
  where enquiry_rate_limits.requester_hash = allow_enquiry_submission.requester_hash
  for update;

  if current_window.window_started_at < now() - interval '15 minutes' then
    update public.enquiry_rate_limits
    set window_started_at = now(), submission_count = 1
    where enquiry_rate_limits.requester_hash = allow_enquiry_submission.requester_hash;
    return true;
  end if;

  if current_window.submission_count >= 5 then
    return false;
  end if;

  update public.enquiry_rate_limits
  set submission_count = submission_count + 1
  where enquiry_rate_limits.requester_hash = allow_enquiry_submission.requester_hash;
  return true;
end;
$$;

revoke all on function public.allow_enquiry_submission(text) from public, anon, authenticated;
grant execute on function public.allow_enquiry_submission(text) to service_role;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  date date not null,
  city text not null check (char_length(city) between 2 and 100),
  poster_url text check (poster_url is null or poster_url ~ '^https://'),
  description text not null check (char_length(description) between 5 and 2000),
  registration_type text not null check (registration_type in ('free', 'paid')),
  registration_link text check (
    registration_link is null
    or (char_length(registration_link) <= 2048 and registration_link ~ '^https?://')
  ),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events drop constraint if exists events_date_check;
create index if not exists events_status_date_id_idx
  on public.events (status, date, id);

alter table public.events enable row level security;
revoke all on public.events from public, anon, authenticated;
grant select, insert, update, delete on public.events to service_role;
alter table public.events alter column poster_url drop not null;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  event text not null check (char_length(event) between 2 and 200),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'feedback' and column_name = 'event_attended'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'feedback' and column_name = 'event'
  ) then
    alter table public.feedback rename column event_attended to event;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'feedback' and column_name = 'event_attended'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'feedback' and column_name = 'event'
  ) then
    update public.feedback set event = event_attended where event is null;
    alter table public.feedback drop column event_attended;
  end if;
end;
$$;

alter table public.feedback enable row level security;
revoke all on public.feedback from public, anon, authenticated;
grant insert on public.feedback to service_role;
alter table public.feedback alter column event set not null;
alter table public.feedback drop constraint if exists feedback_event_attended_check;
alter table public.feedback drop constraint if exists feedback_event_check;
alter table public.feedback add constraint feedback_event_check check (char_length(event) between 2 and 200);
