-- Publishing without a GitHub token in the backend: GitHub's own schedule
-- (publish-watch.yml) asks every few minutes whether a release is waiting
-- and builds it. Only the newest waiting release is ever built, and a release
-- that goes live retires every older one still waiting, so the site never
-- steps back to an older release.

create or replace function app.set_release_status(p_release bigint, p_status text, p_url text default null, p_error text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('building','live','failed') then raise exception 'bad status'; end if;
  update public.releases set status = p_status, build_url = coalesce(p_url, build_url),
    started_at = case when p_status = 'building' then coalesce(started_at, now()) else started_at end,
    finished_at = case when p_status in ('live','failed') then now() else finished_at end,
    error = case when p_status = 'failed' then left(coalesce(p_error, 'build failed'), 2000) else null end
  where id = p_release;
  if p_status = 'live' then
    update public.releases set status = 'superseded' where status in ('live', 'queued') and id < p_release;
  end if;
  insert into public.audit_log (actor, actor_role, action, target, summary) values (null, 'build', 'release.' || p_status, 'release:' || p_release, jsonb_build_object('url', p_url));
end $$;
revoke all on function app.set_release_status(bigint, text, text, text) from public, anon, authenticated;
grant execute on function app.set_release_status(bigint, text, text, text) to service_role;

-- the release waiting to be built, if any: the newest queued one, newer than
-- anything already building or live, from the last two days
create or replace function public.svc_waiting_release() returns bigint
language sql stable security definer set search_path = '' as $$
  select max(r.id) from public.releases r
  where r.status = 'queued' and r.created_at > now() - interval '2 days'
    and r.id > coalesce((select max(id) from public.releases where status in ('building', 'live')), 0)
$$;
revoke all on function public.svc_waiting_release() from public, anon, authenticated;
grant execute on function public.svc_waiting_release() to service_role;
