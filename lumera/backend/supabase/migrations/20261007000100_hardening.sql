-- Hardening, October 2026.
--  * enquiries carry a flag when their words look abusive: the house sees a
--    mark and can filter; nothing is rejected or hidden, so a real customer
--    who swears is never lost
--  * a second factor (authenticator app) is required of every member of the
--    team from now on, the owner included; each is asked to set it up at
--    their next sign-in and sees nothing until they have

alter table public.enquiries add column if not exists flagged boolean not null default false;
alter table public.enquiries add column if not exists flag_reason text;

create or replace function public.svc_flag_enquiry(p_id uuid, p_reason text) returns void
language sql security definer set search_path = '' as $$
  update public.enquiries set flagged = true, flag_reason = left(p_reason, 200) where id = p_id
$$;
revoke all on function public.svc_flag_enquiry(uuid, text) from public, anon, authenticated;
grant execute on function public.svc_flag_enquiry(uuid, text) to service_role;

-- staff can read the flag with the rest of the enquiry (column grants follow the table's)
grant select (flagged, flag_reason) on public.enquiries to authenticated;

alter table public.staff alter column mfa_required set default true;
update public.staff set mfa_required = true where active and not mfa_required;

-- leaving: a member removes their own access. The last active owner cannot,
-- so the house is never left without one.
create or replace function public.svc_leave_team(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.staff where user_id = p_user and role = 'owner' and active)
     and (select count(*) from public.staff where role = 'owner' and active) <= 1 then
    raise exception 'the last owner cannot delete their account; make someone else owner first';
  end if;
  update public.staff set active = false, revoked_at = now(), updated_at = now() where user_id = p_user;
  insert into public.audit_log (actor, actor_role, action, target, summary) values (p_user, 'self', 'staff.delete_account', 'staff:' || p_user, '{}'::jsonb);
end $$;
revoke all on function public.svc_leave_team(uuid) from public, anon, authenticated;
grant execute on function public.svc_leave_team(uuid) to service_role;
