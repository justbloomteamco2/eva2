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
  email_sent_at timestamptz,
  email_attempted_at timestamptz,
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
revoke all on public.enquiries from public, anon, authenticated;
grant insert, select, update on public.enquiries to service_role;
create index if not exists enquiries_email_pending_idx
  on public.enquiries (email_attempted_at, created_at, id)
  where email_sent_at is null;

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
revoke all on public.creator_registrations from public, anon, authenticated;
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
revoke all on public.enquiry_rate_limits from public, anon, authenticated, service_role;

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
  values ($1)
  on conflict do nothing;

  select * into current_window
  from public.enquiry_rate_limits
  where enquiry_rate_limits.requester_hash = $1
  for update;

  if current_window.window_started_at < now() - interval '5 minutes' then
    update public.enquiry_rate_limits
    set window_started_at = now(), submission_count = 1
    where enquiry_rate_limits.requester_hash = $1;
    return true;
  end if;

  if current_window.submission_count >= 3 then
    return false;
  end if;

  update public.enquiry_rate_limits
  set submission_count = submission_count + 1
  where enquiry_rate_limits.requester_hash = $1;
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
  attendee_email text not null default '' check (char_length(attendee_email) <= 254),
  event text not null check (char_length(event) between 2 and 200),
  event_date date,
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(message) between 10 and 2000),
  would_attend_again text check (would_attend_again in ('yes', 'maybe', 'no')),
  what_went_well text not null default '' check (char_length(what_went_well) <= 900),
  what_to_improve text not null default '' check (char_length(what_to_improve) <= 900),
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
alter table public.feedback
  add column if not exists feedback_type text not null default 'event',
  add column if not exists attendee_email text not null default '',
  add column if not exists attendee_phone text not null default '',
  add column if not exists client_project text not null default '',
  add column if not exists media_paths text[] not null default '{}',
  add column if not exists event_date date,
  add column if not exists would_attend_again text,
  add column if not exists what_went_well text not null default '',
  add column if not exists what_to_improve text not null default '';
alter table public.feedback alter column event set not null;
alter table public.feedback drop constraint if exists feedback_event_attended_check;
alter table public.feedback drop constraint if exists feedback_event_check;
alter table public.feedback add constraint feedback_event_check check (char_length(event) between 2 and 200);
alter table public.feedback drop constraint if exists feedback_would_attend_again_check;
alter table public.feedback add constraint feedback_would_attend_again_check
  check (would_attend_again is null or would_attend_again in ('yes', 'maybe', 'no'));
alter table public.feedback drop constraint if exists feedback_attendee_email_check;
alter table public.feedback add constraint feedback_attendee_email_check
  check (char_length(attendee_email) <= 254);
alter table public.feedback drop constraint if exists feedback_type_check;
alter table public.feedback add constraint feedback_type_check
  check (feedback_type in ('event', 'client'));
alter table public.feedback drop constraint if exists feedback_attendee_phone_check;
alter table public.feedback add constraint feedback_attendee_phone_check
  check (char_length(attendee_phone) <= 20);
alter table public.feedback drop constraint if exists feedback_client_project_check;
alter table public.feedback add constraint feedback_client_project_check
  check (char_length(client_project) <= 160);
alter table public.feedback drop constraint if exists feedback_client_details_valid;
alter table public.feedback add constraint feedback_client_details_valid check (
  feedback_type = 'event'
  or (
    char_length(client_project) between 2 and 160
    and (char_length(attendee_email) > 0 or char_length(attendee_phone) between 8 and 20)
    and char_length(message) between 10 and 2000
  )
);
alter table public.feedback drop constraint if exists feedback_media_paths_limit;
alter table public.feedback add constraint feedback_media_paths_limit
  check (cardinality(media_paths) <= 3);
alter table public.feedback drop constraint if exists feedback_what_went_well_check;
alter table public.feedback add constraint feedback_what_went_well_check
  check (char_length(what_went_well) <= 900);
alter table public.feedback drop constraint if exists feedback_what_to_improve_check;
alter table public.feedback add constraint feedback_what_to_improve_check
  check (char_length(what_to_improve) <= 900);

alter table public.enquiries
  add column if not exists status text not null default 'new',
  add column if not exists updated_at timestamptz not null default now();
alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check
  check (status in ('new', 'contacted', 'qualified', 'closed', 'archived'));
grant update on public.enquiries to service_role;
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_created_at_idx on public.enquiries (status, created_at desc);

alter table public.creator_registrations
  add column if not exists status text not null default 'new',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_attempted_at timestamptz;
alter table public.creator_registrations drop constraint if exists creator_registrations_status_check;
alter table public.creator_registrations add constraint creator_registrations_status_check
  check (status in ('new', 'contacted', 'qualified', 'closed', 'archived'));
grant update on public.creator_registrations to service_role;
create index if not exists creator_registrations_created_at_idx on public.creator_registrations (created_at desc);
create index if not exists creator_registrations_status_created_at_idx on public.creator_registrations (status, created_at desc);
create index if not exists creator_registrations_email_pending_idx
  on public.creator_registrations (email_attempted_at, created_at, id)
  where email_sent_at is null;

alter table public.feedback
  add column if not exists status text not null default 'new',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_attempted_at timestamptz;
alter table public.feedback drop constraint if exists feedback_status_check;
alter table public.feedback add constraint feedback_status_check
  check (status in ('new', 'contacted', 'qualified', 'closed', 'archived'));
grant select, update on public.feedback to service_role;
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_status_created_at_idx on public.feedback (status, created_at desc);
create index if not exists feedback_email_pending_idx
  on public.feedback (email_attempted_at, created_at, id)
  where email_sent_at is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-attachments',
  'feedback-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

drop policy if exists restrict_feedback_attachments_to_server on storage.objects;
create policy restrict_feedback_attachments_to_server
on storage.objects
as restrictive
for all
to anon, authenticated
using (bucket_id <> 'feedback-attachments')
with check (bucket_id <> 'feedback-attachments');

create table if not exists public.project_registrations (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  project text not null check (project in ('ifi', 'creators_meetup')),
  full_name text not null check (char_length(full_name) between 2 and 100),
  date_of_birth date,
  gender text not null check (gender in ('Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other')),
  phone text not null check (char_length(phone) between 8 and 20),
  whatsapp text not null default '' check (char_length(whatsapp) <= 20),
  email text not null check (char_length(email) <= 254),
  city text not null check (char_length(city) between 2 and 100),
  state text not null check (char_length(state) between 2 and 100),
  category text not null,
  instagram text not null default '' check (char_length(instagram) <= 300),
  youtube text not null default '' check (char_length(youtube) <= 500),
  other_social_media text not null default '' check (char_length(other_social_media) <= 1000),
  key_skills text not null check (char_length(key_skills) between 2 and 500),
  about text not null default '' check (char_length(about) <= 2000),
  portfolio text not null default '' check (char_length(portfolio) <= 500),
  collaboration_interests text[] not null default '{}',
  preferred_collaborators text not null default '' check (char_length(preferred_collaborators) <= 500),
  interested_in_future text check (interested_in_future is null or interested_in_future in ('yes', 'no')),
  preferred_city text not null default '' check (char_length(preferred_city) <= 100),
  preferred_meetup_date date,
  heard_from text not null default '' check (
    heard_from in ('', 'Instagram', 'WhatsApp', 'Friend / Creator', 'Bardapure Productions', 'Other')
  ),
  terms_accepted boolean not null default false,
  profile_photo_path text not null,
  additional_photo_paths text[] not null default '{}',
  registration_status text not null default 'received' check (
    registration_status in ('received', 'contacted', 'selected', 'closed')
  ),
  payment_status text not null check (payment_status in ('not_required', 'pending', 'paid')),
  payment_amount_paise integer not null default 0 check (payment_amount_paise >= 0),
  payment_currency text not null default 'INR' check (payment_currency = 'INR'),
  payment_paid_at timestamptz,
  email_sent_at timestamptz,
  email_attempted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint project_registration_category_valid check (
    (project = 'ifi' and category in ('Model', 'Actor', 'Creator', 'Influencer', 'Dancer', 'Artist', 'Performer', 'Other'))
    or
    (project = 'creators_meetup' and category in (
      'Content Creator', 'Influencer', 'Model', 'Actor', 'Dancer', 'Singer', 'Photographer',
      'Filmmaker', 'Video Editor', 'Graphic Designer', 'Artist', 'Host / Emcee', 'Entrepreneur', 'Other'
    ))
  ),
  constraint project_registration_fields_valid check (
    (
      project = 'ifi'
      and date_of_birth is not null
      and char_length(key_skills) >= 2
      and char_length(about) >= 30
      and terms_accepted
      and payment_status in ('pending', 'paid')
      and payment_amount_paise = 100000
      and ((payment_status = 'pending' and payment_paid_at is null)
        or (payment_status = 'paid' and payment_paid_at is not null))
    )
    or
    (
      project = 'creators_meetup'
      and char_length(whatsapp) between 8 and 20
      and char_length(instagram) between 1 and 300
      and char_length(preferred_city) between 2 and 100
      and cardinality(collaboration_interests) >= 1
      and terms_accepted
      and payment_status = 'not_required'
      and payment_amount_paise = 0
    )
  ),
  constraint project_registration_collaboration_interests_valid check (
    collaboration_interests <@ array[
      'Brand Collaborations', 'Content Creation', 'Photoshoots', 'Reels', 'Modelling',
      'Events', 'Networking', 'Film / Media Projects', 'Influencer Campaigns', 'Other'
    ]::text[]
  ),
  constraint project_registration_additional_photos_limit check (
    cardinality(additional_photo_paths) <= 3
  )
);

alter table public.project_registrations enable row level security;
revoke all on public.project_registrations from public, anon, authenticated;
grant select, insert, update on public.project_registrations to service_role;
create index if not exists project_registrations_created_at_idx
  on public.project_registrations (created_at desc);
create index if not exists project_registrations_project_status_created_idx
  on public.project_registrations (project, registration_status, created_at desc);

create table if not exists public.community_reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  city text not null check (char_length(city) between 2 and 80),
  category text not null check (category in ('Community', 'Photography', 'Events', 'Talent')),
  quote text not null check (char_length(quote) between 5 and 500),
  likes integer not null default 0 check (likes >= 0),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.community_reviews enable row level security;
revoke all on public.community_reviews from public, anon, authenticated;
grant select on public.community_reviews to anon, authenticated;
grant select, insert, update on public.community_reviews to service_role;
drop policy if exists community_reviews_read_public on public.community_reviews;
create policy community_reviews_read_public
  on public.community_reviews
  for select
  to anon, authenticated
  using (true);
create index if not exists community_reviews_created_at_idx on public.community_reviews (created_at desc);

create table if not exists public.community_review_likes (
  review_id uuid not null references public.community_reviews(id) on delete cascade,
  voter_hash text not null check (char_length(voter_hash) = 64),
  created_at timestamptz not null default now(),
  primary key (review_id, voter_hash)
);

alter table public.community_review_likes enable row level security;
revoke all on public.community_review_likes from public, anon, authenticated;
grant select, insert, delete on public.community_review_likes to service_role;

create or replace function public.like_community_review(p_review_id uuid, p_voter_hash text)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_likes integer;
begin
  insert into public.community_review_likes (review_id, voter_hash)
  values (p_review_id, p_voter_hash)
  on conflict (review_id, voter_hash) do nothing;

  if found then
    update public.community_reviews
    set likes = likes + 1
    where id = p_review_id
    returning likes into current_likes;
  else
    select likes into current_likes
    from public.community_reviews
    where id = p_review_id;
  end if;

  if current_likes is null then
    raise exception 'Community review not found';
  end if;

  return current_likes;
end;
$$;

revoke all on function public.like_community_review(uuid, text) from public, anon, authenticated;
grant execute on function public.like_community_review(uuid, text) to service_role;

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.community_reviews(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  reply_text text not null check (char_length(reply_text) between 2 and 500),
  created_at timestamptz not null default now()
);

create index if not exists review_replies_review_created_idx
  on public.review_replies (review_id, created_at asc);

alter table public.review_replies enable row level security;
revoke all on public.review_replies from public, anon, authenticated;
grant select on public.review_replies to anon, authenticated;
grant select, insert, update, delete on public.review_replies to service_role;
drop policy if exists review_replies_read_public on public.review_replies;
create policy review_replies_read_public
  on public.review_replies
  for select
  to anon, authenticated
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_reviews'
  ) then
    alter publication supabase_realtime add table public.community_reviews;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'review_replies'
  ) then
    alter publication supabase_realtime add table public.review_replies;
  end if;
end;
$$;

insert into public.community_reviews (id, name, city, category, quote, is_sample, created_at)
values
  ('b0000000-0000-4000-8000-000000000001', 'Riya', 'Pune', 'Talent', 'Bardapure team helped me get my first brand shoot!', true, now()),
  ('b0000000-0000-4000-8000-000000000002', 'Aman', 'Nagpur', 'Community', 'They support real talent, not just followers', true, now() - interval '1 minute'),
  ('b0000000-0000-4000-8000-000000000003', 'Sneha', 'Mumbai', 'Events', 'Campus event was very well managed', true, now() - interval '2 minutes'),
  ('b0000000-0000-4000-8000-000000000004', 'Karan', 'Delhi', 'Talent', 'IFI platform is genuine and supportive', true, now() - interval '3 minutes'),
  ('b0000000-0000-4000-8000-000000000005', 'Anjali', 'Hyderabad', 'Photography', 'They support Marathi artists too, loved it', true, now() - interval '4 minutes')
on conflict (id) do nothing;
create index if not exists project_registrations_email_pending_idx
  on public.project_registrations (email_attempted_at, created_at, id)
  where email_sent_at is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-registration-photos',
  'project-registration-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists restrict_project_registration_photos_to_server on storage.objects;
create policy restrict_project_registration_photos_to_server
on storage.objects
as restrictive
for all
to anon, authenticated
using (bucket_id <> 'project-registration-photos')
with check (bucket_id <> 'project-registration-photos');
