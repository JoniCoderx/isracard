-- SILAVU administration · 7 · the server functions' entry points
--
-- The private "app" schema is not exposed by the API. The edge functions call
-- these thin public wrappers with the service-role key; nobody else can
-- execute them (the grants below), so the public API gains no new door.

create or replace function public.svc_submit_enquiry(p jsonb) returns jsonb language sql security definer set search_path = '' as $$ select app.submit_enquiry(p) $$;
create or replace function public.svc_set_enquiry_notify(p_id uuid, p_status text, p_error text) returns void language sql security definer set search_path = '' as $$ select app.set_enquiry_notify(p_id, p_status, p_error) $$;
create or replace function public.svc_ingest_events(p_events jsonb, p_ctx jsonb) returns integer language sql security definer set search_path = '' as $$ select app.ingest_events(p_events, p_ctx) $$;
create or replace function public.svc_rate_hit(p_bucket text, p_limit integer, p_window integer) returns boolean language sql security definer set search_path = '' as $$ select app.rate_hit(p_bucket, p_limit, p_window) $$;
create or replace function public.svc_set_release_status(p_release bigint, p_status text, p_url text, p_error text) returns void language sql security definer set search_path = '' as $$ select app.set_release_status(p_release, p_status, p_url, p_error) $$;
create or replace function public.svc_release_for_build(p_release bigint) returns jsonb language sql security definer set search_path = '' as $$ select app.release_for_build(p_release) $$;
create or replace function public.svc_media_for_snapshot(p_snapshot jsonb) returns jsonb language sql security definer set search_path = '' as $$ select app.media_for_snapshot(p_snapshot) $$;
create or replace function public.svc_set_media_check(p_id uuid, p_ok boolean, p_reason text, p_width integer, p_height integer) returns void language sql security definer set search_path = '' as $$ select app.set_media_check(p_id, p_ok, p_reason, p_width, p_height) $$;
create or replace function public.svc_add_staff(p_actor uuid, p_user uuid, p_email text, p_role public.staff_role, p_name text) returns void language sql security definer set search_path = '' as $$ select app.add_staff(p_actor, p_user, p_email, p_role, p_name) $$;
create or replace function public.svc_import_doc(p_key text, p_kind text, p_title text, p_data jsonb, p_sort integer) returns text language sql security definer set search_path = '' as $$ select app.import_doc(p_key, p_kind, p_title, p_data, p_sort) $$;
create or replace function public.svc_import_release(p_note text) returns bigint language sql security definer set search_path = '' as $$ select app.import_release(p_note) $$;
create or replace function public.svc_prune_analytics(p_days integer) returns integer language sql security definer set search_path = '' as $$ select app.prune_analytics(p_days) $$;

-- who is calling, for the functions that act on someone's behalf: the role is
-- read here, from the staff table, exactly as RLS reads it
create or replace function public.svc_staff_role(p_user uuid, p_aal text) returns text
language sql stable security definer set search_path = '' as $$
  select s.role::text from public.staff s where s.user_id = p_user and s.active and (not s.mfa_required or p_aal = 'aal2')
$$;

create or replace function public.svc_audit(p_actor uuid, p_role text, p_action text, p_target text, p_summary jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor, actor_role, action, target, summary) values (p_actor, p_role, p_action, p_target, coalesce(p_summary, '{}'::jsonb))
$$;

-- everything the house holds, for the owner's export (the function stores it
-- in the private exports bucket and hands back a short-lived link)
create or replace function public.svc_export() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'format', 'silavu-export', 'version', 1, 'exported_at', now(),
    'content_docs', coalesce((select jsonb_agg(to_jsonb(d)) from public.content_docs d), '[]'),
    'content_revisions', coalesce((select jsonb_agg(to_jsonb(r)) from public.content_revisions r), '[]'),
    'releases', coalesce((select jsonb_agg(to_jsonb(r)) from public.releases r), '[]'),
    'product_private', coalesce((select jsonb_agg(to_jsonb(p)) from public.product_private p), '[]'),
    'media_assets', coalesce((select jsonb_agg(to_jsonb(m)) from public.media_assets m), '[]'),
    'customers', coalesce((select jsonb_agg(to_jsonb(c)) from public.customers c), '[]'),
    'enquiries', coalesce((select jsonb_agg(to_jsonb(e)) from public.enquiries e), '[]'),
    'enquiry_notes', coalesce((select jsonb_agg(to_jsonb(n)) from public.enquiry_notes n), '[]'),
    'quotes', coalesce((select jsonb_agg(to_jsonb(q)) from public.quotes q), '[]'),
    'staff', coalesce((select jsonb_agg(to_jsonb(s)) from public.staff s), '[]'),
    'audit_log', coalesce((select jsonb_agg(to_jsonb(a)) from (select * from public.audit_log order by id desc limit 20000) a), '[]'))
$$;

-- signing someone out where the platform allows it; a role change already
-- applies on the next request because RLS reads the staff table every time
create or replace function app.kill_sessions(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  begin
    delete from auth.sessions where user_id = p_user;
    update auth.refresh_tokens set revoked = true where user_id = p_user::text;
  exception when insufficient_privilege or undefined_table then
    null;  -- the staff function also bans a revoked account through the Auth admin API
  end;
end $$;
revoke all on function app.kill_sessions(uuid) from public, anon, authenticated;

do $$ declare f text; begin
  foreach f in array array[
    'svc_submit_enquiry(jsonb)', 'svc_set_enquiry_notify(uuid, text, text)', 'svc_ingest_events(jsonb, jsonb)', 'svc_rate_hit(text, integer, integer)',
    'svc_set_release_status(bigint, text, text, text)', 'svc_release_for_build(bigint)', 'svc_media_for_snapshot(jsonb)', 'svc_set_media_check(uuid, boolean, text, integer, integer)',
    'svc_add_staff(uuid, uuid, text, public.staff_role, text)', 'svc_import_doc(text, text, text, jsonb, integer)', 'svc_import_release(text)', 'svc_prune_analytics(integer)',
    'svc_staff_role(uuid, text)', 'svc_audit(uuid, text, text, text, jsonb)', 'svc_export()'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- one library record, for the media check
create or replace function public.svc_media_row(p_id uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select to_jsonb(m) from public.media_assets m where m.id = p_id $$;
revoke all on function public.svc_media_row(uuid) from public, anon, authenticated;
grant execute on function public.svc_media_row(uuid) to service_role;
