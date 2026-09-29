alter table public.feedback
  add column if not exists feedback_type text not null default 'event',
  add column if not exists attendee_phone text not null default '',
  add column if not exists client_project text not null default '';

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