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
      and char_length(about) >= 10
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
      and terms_accepted
      and payment_status = 'not_required'
      and payment_amount_paise = 0
    )
  ),
  constraint project_registration_collaboration_interests_valid check (
    collaboration_interests <@ array[
      'Brand Collaborations',
      'Content Creation',
      'Photoshoots',
      'Reels',
      'Modelling',
      'Events',
      'Networking',
      'Film / Media Projects',
      'Influencer Campaigns',
      'Other'
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