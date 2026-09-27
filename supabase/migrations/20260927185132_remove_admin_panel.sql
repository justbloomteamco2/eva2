begin;

delete from public.events;

drop table if exists public.site_content;
drop table if exists public.admin_credentials;
drop table if exists public.admin_audit_log;

commit;