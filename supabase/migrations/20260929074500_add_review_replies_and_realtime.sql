grant select on public.community_reviews to anon, authenticated;
drop policy if exists community_reviews_read_public on public.community_reviews;
create policy community_reviews_read_public
  on public.community_reviews
  for select
  to anon, authenticated
  using (true);

create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.community_reviews(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  reply_text text not null check (char_length(reply_text) between 2 and 500),
  created_at timestamptz not null default now()
);

create index review_replies_review_created_idx
  on public.review_replies (review_id, created_at asc);

alter table public.review_replies enable row level security;
revoke all on public.review_replies from public, anon, authenticated;
grant select on public.review_replies to anon, authenticated;
grant select, insert, update, delete on public.review_replies to service_role;
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