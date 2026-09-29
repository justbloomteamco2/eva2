alter table public.project_registrations
  drop constraint if exists project_registration_fields_valid;

alter table public.project_registrations
  add constraint project_registration_fields_valid check (
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
  ) not valid;

create table public.community_reviews (
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
grant select, insert, update on public.community_reviews to service_role;
create index community_reviews_created_at_idx on public.community_reviews (created_at desc);

create table public.community_review_likes (
  review_id uuid not null references public.community_reviews(id) on delete cascade,
  voter_hash text not null check (char_length(voter_hash) = 64),
  created_at timestamptz not null default now(),
  primary key (review_id, voter_hash)
);

alter table public.community_review_likes enable row level security;
revoke all on public.community_review_likes from public, anon, authenticated;
grant select, insert, delete on public.community_review_likes to service_role;

create function public.like_community_review(p_review_id uuid, p_voter_hash text)
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

insert into public.community_reviews (id, name, city, category, quote, is_sample, created_at)
values
  ('b0000000-0000-4000-8000-000000000001', 'Riya', 'Pune', 'Talent', 'Bardapure team helped me get my first brand shoot!', true, now()),
  ('b0000000-0000-4000-8000-000000000002', 'Aman', 'Nagpur', 'Community', 'They support real talent, not just followers', true, now() - interval '1 minute'),
  ('b0000000-0000-4000-8000-000000000003', 'Sneha', 'Mumbai', 'Events', 'Campus event was very well managed', true, now() - interval '2 minutes'),
  ('b0000000-0000-4000-8000-000000000004', 'Karan', 'Delhi', 'Talent', 'IFI platform is genuine and supportive', true, now() - interval '3 minutes'),
  ('b0000000-0000-4000-8000-000000000005', 'Anjali', 'Hyderabad', 'Photography', 'They support Marathi artists too, loved it', true, now() - interval '4 minutes')
on conflict (id) do nothing;