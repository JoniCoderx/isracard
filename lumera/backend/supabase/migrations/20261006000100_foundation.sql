-- SILAVU administration · 1 · foundation: staff, roles, audit trail, rate limits
--
-- Permissions are decided here, in the database, on every request:
--   * a person's role comes from public.staff, never from JWT metadata a user
--     can edit, so a change or a revocation applies to the very next request;
--   * the helper functions live in the private schema "app", which the API does
--     not expose.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;

do $$ begin
  create type public.staff_role as enum ('owner', 'editor', 'support', 'analyst');
exception when duplicate_object then null; end $$;

create table if not exists public.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text not null default '',
  role         public.staff_role not null,
  active       boolean not null default true,
  -- when true, this person's requests count only after a second factor (aal2)
  mfa_required boolean not null default false,
  invited_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  revoked_at   timestamptz
);
create index if not exists staff_role_idx on public.staff (role) where active;
alter table public.staff enable row level security;

-- ── who is asking ──────────────────────────────────────────────────────────
create or replace function app.my_role() returns public.staff_role
language sql stable security definer set search_path = '' as $$
  select s.role from public.staff s
  where s.user_id = auth.uid() and s.active
    and (not s.mfa_required or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2')
$$;

create or replace function app.has_role(variadic roles public.staff_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(app.my_role() = any (roles), false)
$$;

create or replace function app.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select app.my_role() is not null
$$;

-- raise, rather than return nothing, when a function is called without the role
create or replace function app.require(variadic roles public.staff_role[]) returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not app.has_role(variadic roles) then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  return auth.uid();
end $$;

grant execute on function app.my_role(), app.has_role(public.staff_role[]), app.is_staff(), app.require(public.staff_role[]) to authenticated, service_role;

-- ── the audit trail: append-only ───────────────────────────────────────────
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor      uuid,
  actor_role text,
  action     text not null,
  target     text,
  -- a safe summary: field names and short values, never passwords, tokens or whole messages
  summary    jsonb not null default '{}'::jsonb
);
create index if not exists audit_at_idx on public.audit_log (at desc);
create index if not exists audit_target_idx on public.audit_log (target);
alter table public.audit_log enable row level security;

create or replace function app.audit(p_action text, p_target text, p_summary jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor, actor_role, action, target, summary)
  values (auth.uid(), coalesce(app.my_role()::text, auth.role()), p_action, p_target, coalesce(p_summary, '{}'::jsonb));
end $$;
revoke all on function app.audit(text, text, jsonb) from public;

create or replace function app.audit_immutable() returns trigger language plpgsql as $$
begin raise exception 'the audit trail cannot be changed'; end $$;
drop trigger if exists audit_no_change on public.audit_log;
create trigger audit_no_change before update or delete or truncate on public.audit_log
  for each statement execute function app.audit_immutable();

-- ── rate limits for the public endpoints ──────────────────────────────────
create table if not exists app.rate_limits (
  bucket   text not null,
  window_start timestamptz not null,
  hits     integer not null default 0,
  primary key (bucket, window_start)
);

-- returns true while the caller is under the limit; counts the hit either way
create or replace function app.rate_hit(p_bucket text, p_limit integer, p_window_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds); n integer;
begin
  insert into app.rate_limits as r (bucket, window_start, hits) values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning hits into n;
  if random() < 0.01 then delete from app.rate_limits where window_start < now() - interval '1 day'; end if;
  return n <= p_limit;
end $$;
revoke all on function app.rate_hit(text, integer, integer) from public;
grant execute on function app.rate_hit(text, integer, integer) to service_role;

-- ── staff: read, invite, change, revoke ───────────────────────────────────
drop policy if exists staff_read_self on public.staff;
create policy staff_read_self on public.staff for select to authenticated
  using (user_id = auth.uid() or app.has_role('owner'));
-- no insert/update/delete policies: every change goes through the functions below

create or replace function public.my_staff() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('user_id', s.user_id, 'email', s.email, 'display_name', s.display_name,
    'role', s.role, 'active', s.active, 'mfa_required', s.mfa_required,
    'effective_role', app.my_role(), 'aal', coalesce(auth.jwt() ->> 'aal', 'aal1'))
  from public.staff s where s.user_id = auth.uid()
$$;
grant execute on function public.my_staff() to authenticated;

-- the first owner: run once by the project's owner in the SQL editor (it runs
-- as postgres). There is no route in the API that makes anyone an owner.
create or replace function app.bootstrap_owner(p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid;
begin
  if exists (select 1 from public.staff where role = 'owner' and active) then
    raise exception 'an owner already exists; invite further staff from the admin';
  end if;
  select id into u from auth.users where lower(email) = lower(p_email);
  if u is null then raise exception 'no auth user with email %: create the user in Authentication first', p_email; end if;
  insert into public.staff (user_id, email, role, mfa_required) values (u, lower(p_email), 'owner', false)
  on conflict (user_id) do update set role = 'owner', active = true, revoked_at = null, updated_at = now();
  insert into public.audit_log (actor, actor_role, action, target, summary) values (u, 'bootstrap', 'staff.bootstrap_owner', 'staff:' || u, jsonb_build_object('email', lower(p_email)));
  return u;
end $$;
revoke all on function app.bootstrap_owner(text) from public, anon, authenticated;

-- called by the staff function (service role) after Auth has created the invited user
create or replace function app.add_staff(p_actor uuid, p_user uuid, p_email text, p_role public.staff_role, p_name text default '') returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.staff where user_id = p_actor and role = 'owner' and active) then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  insert into public.staff (user_id, email, display_name, role, invited_by) values (p_user, lower(p_email), coalesce(p_name, ''), p_role, p_actor)
  on conflict (user_id) do update set role = excluded.role, active = true, revoked_at = null, updated_at = now(), invited_by = p_actor;
  insert into public.audit_log (actor, actor_role, action, target, summary) values (p_actor, 'owner', 'staff.invite', 'staff:' || p_user, jsonb_build_object('email', lower(p_email), 'role', p_role));
end $$;
revoke all on function app.add_staff(uuid, uuid, text, public.staff_role, text) from public, anon, authenticated;
grant execute on function app.add_staff(uuid, uuid, text, public.staff_role, text) to service_role;

create or replace function app.kill_sessions(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.sessions where user_id = p_user;
  update auth.refresh_tokens set revoked = true where user_id = p_user::text;
end $$;
revoke all on function app.kill_sessions(uuid) from public, anon, authenticated;

create or replace function public.set_staff_role(p_user uuid, p_role public.staff_role) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner'); old public.staff_role;
begin
  if p_user = me then raise exception 'you cannot change your own role'; end if;
  select role into old from public.staff where user_id = p_user and active for update;
  if old is null then raise exception 'no such active staff member'; end if;
  update public.staff set role = p_role, updated_at = now() where user_id = p_user;
  -- a lower role should not keep a session minted for a higher one
  perform app.kill_sessions(p_user);
  perform app.audit('staff.role', 'staff:' || p_user, jsonb_build_object('from', old, 'to', p_role));
end $$;

create or replace function public.revoke_staff(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner');
begin
  if p_user = me then raise exception 'you cannot revoke yourself'; end if;
  update public.staff set active = false, revoked_at = now(), updated_at = now() where user_id = p_user and active;
  if not found then raise exception 'no such active staff member'; end if;
  perform app.kill_sessions(p_user);
  perform app.audit('staff.revoke', 'staff:' || p_user, '{}'::jsonb);
end $$;

create or replace function public.set_staff_mfa(p_user uuid, p_required boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner');
begin
  -- required before they have one: their next sign-in asks them to set it up
  -- and shows nothing else until they have
  update public.staff set mfa_required = p_required, updated_at = now() where user_id = p_user;
  if p_required then perform app.kill_sessions(p_user); end if;
  perform app.audit('staff.mfa', 'staff:' || p_user, jsonb_build_object('required', p_required));
end $$;

create or replace function public.update_my_name(p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_staff() then raise exception 'not permitted' using errcode = '42501'; end if;
  update public.staff set display_name = left(coalesce(p_name, ''), 80), updated_at = now() where user_id = auth.uid();
end $$;

grant execute on function public.set_staff_role(uuid, public.staff_role), public.revoke_staff(uuid), public.set_staff_mfa(uuid, boolean), public.update_my_name(text) to authenticated;

drop policy if exists audit_owner_read on public.audit_log;
create policy audit_owner_read on public.audit_log for select to authenticated using (app.has_role('owner'));
