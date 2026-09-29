alter table public.feedback
  add column if not exists media_paths text[] not null default '{}';

alter table public.feedback drop constraint if exists feedback_media_paths_limit;
alter table public.feedback
  add constraint feedback_media_paths_limit check (cardinality(media_paths) <= 3);

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