-- The nightly housekeeping, called by the maintenance function on a schedule:
-- visit records older than the retention the owner set in Settings are
-- deleted, and spent rate-limit counters are cleared. Nothing else is touched.

create or replace function public.svc_maintenance() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare days integer; pruned integer; rl integer;
begin
  select case when (published #>> '{analytics,retentionDays}') ~ '^\d{1,5}$' then (published #>> '{analytics,retentionDays}')::integer end
    into days from public.content_docs where key = 'settings';
  days := greatest(coalesce(days, 400), 30);
  pruned := app.prune_analytics(days);
  delete from app.rate_limits where window_start < now() - interval '1 day';
  get diagnostics rl = row_count;
  insert into public.audit_log (actor, actor_role, action, target, summary)
    values (null, 'schedule', 'maintenance.run', 'maintenance', jsonb_build_object('retention_days', days, 'analytics_pruned', pruned, 'rate_limits_pruned', rl));
  return jsonb_build_object('retention_days', days, 'analytics_pruned', pruned, 'rate_limits_pruned', rl);
end $$;
revoke all on function public.svc_maintenance() from public, anon, authenticated;
grant execute on function public.svc_maintenance() to service_role;
