-- SILAVU administration · 5 · traffic analytics
--
-- First-party, allowlisted, aggregated in the database. What is collected:
-- an event name from a fixed list, the page path (no query string), the
-- referring site's host name, permitted utm_* fields, device class, browser
-- family, language, country when the edge provides it, the piece concerned,
-- and a random session id (and, only with consent, a random returning-browser
-- id). Never: form contents, email, phone, photos, full referrer URLs, IPs.
--
-- Sessions are the tracker's: a random id kept in sessionStorage that is
-- renewed after 30 minutes without activity. "Active now" counts sessions
-- with an event in the last 5 minutes; it is not a count of people.

create table if not exists public.analytics_events (
  id            bigint generated always as identity primary key,
  event_id      uuid not null unique,
  received_at   timestamptz not null default now(),
  ts            timestamptz not null,
  name          text not null check (name in ('page_view','engaged','product_view','product_open','collection_filter','gallery',
                                              'configurator_start','configurator_complete','enquiry_start','enquiry_success',
                                              'contact_click','film_play','language')),
  session_id    text not null check (session_id ~ '^[A-Za-z0-9_-]{8,40}$'),
  visitor_id    text check (visitor_id is null or visitor_id ~ '^[A-Za-z0-9_-]{8,40}$'),
  is_returning  boolean,
  path          text not null default '/',
  referrer_host text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  device        text check (device in ('mobile','tablet','desktop','other')),
  browser       text,
  os            text,
  lang          text,
  country       text check (country is null or country ~ '^[A-Z]{2}$'),
  product_key   text,
  props         jsonb not null default '{}'::jsonb,
  engaged_ms    integer check (engaged_ms is null or engaged_ms between 0 and 3600000),
  is_bot        boolean not null default false
);
create index if not exists ae_ts_idx on public.analytics_events (ts);
create index if not exists ae_name_ts_idx on public.analytics_events (name, ts);
create index if not exists ae_session_idx on public.analytics_events (session_id, ts);
alter table public.analytics_events enable row level security;
-- no policies: nobody reads raw events through the API; the functions below aggregate

create or replace function app.ingest_events(p_events jsonb, p_ctx jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare ev jsonb; n integer := 0; nm text; pr jsonb; t timestamptz;
begin
  if jsonb_typeof(p_events) <> 'array' then raise exception 'invalid' using errcode = '22023'; end if;
  for ev in select * from jsonb_array_elements(p_events) limit 50 loop
    nm := ev ->> 'name';
    begin t := (ev ->> 'ts')::timestamptz; exception when others then t := now(); end;
    if t is null or t > now() + interval '5 minutes' or t < now() - interval '2 days' then t := now(); end if;
    -- only these properties, short values
    pr := coalesce((select jsonb_object_agg(key, left(value #>> '{}', 60)) from jsonb_each(coalesce(ev -> 'props', '{}'::jsonb))
                    where key in ('channel','step','cut','origin','metal','index','filter','from','to','source','section')), '{}'::jsonb);
    begin
      insert into public.analytics_events (event_id, ts, name, session_id, visitor_id, is_returning, path, referrer_host, utm_source, utm_medium, utm_campaign,
        device, browser, os, lang, country, product_key, props, engaged_ms, is_bot)
      values ((ev ->> 'id')::uuid, t, nm, ev ->> 'sid', nullif(ev ->> 'vid', ''), (ev ->> 'ret')::boolean,
        left(regexp_replace(coalesce(ev ->> 'path', '/'), '[?#].*$', ''), 200),
        nullif(left(lower(regexp_replace(coalesce(ev ->> 'ref', ''), '^https?://([^/:?#]+).*$', '\1')), 120), ''),
        nullif(left(ev ->> 'utm_source', 100), ''), nullif(left(ev ->> 'utm_medium', 100), ''), nullif(left(ev ->> 'utm_campaign', 100), ''),
        p_ctx ->> 'device', left(p_ctx ->> 'browser', 40), left(p_ctx ->> 'os', 40), left(coalesce(ev ->> 'lang', ''), 8), nullif(p_ctx ->> 'country', ''),
        nullif(left(ev ->> 'product', 60), ''), pr,
        case when nm = 'engaged' then least(greatest(coalesce((ev ->> 'ms')::integer, 0), 0), 3600000) end,
        coalesce((p_ctx ->> 'bot')::boolean, false))
      on conflict (event_id) do nothing;
      if found then n := n + 1; end if;
    exception when check_violation or invalid_text_representation or not_null_violation then
      continue;  -- a malformed event is dropped, the rest of the batch is kept
    end;
  end loop;
  return n;
end $$;
revoke all on function app.ingest_events(jsonb, jsonb) from public, anon, authenticated;
grant execute on function app.ingest_events(jsonb, jsonb) to service_role;

-- the filtered slice every report starts from
create or replace function app.ae_slice(p_from timestamptz, p_to timestamptz, f jsonb)
returns setof public.analytics_events language sql stable security definer set search_path = '' as $$
  select * from public.analytics_events e
  where e.ts >= p_from and e.ts < p_to and not e.is_bot
    and (f ->> 'device' is null or e.device = f ->> 'device')
    and (f ->> 'source' is null or coalesce(e.utm_source, e.referrer_host, '(direct)') = f ->> 'source')
    and (f ->> 'product' is null or e.session_id in (select s.session_id from public.analytics_events s where s.ts >= p_from and s.ts < p_to and s.product_key = f ->> 'product'))
$$;
revoke all on function app.ae_slice(timestamptz, timestamptz, jsonb) from public, anon, authenticated;

create or replace function public.analytics_overview(p_from timestamptz, p_to timestamptz, p_filters jsonb default '{}'::jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := app.require('owner','analyst'); f jsonb := coalesce(p_filters, '{}'::jsonb); r jsonb; enq integer;
begin
  select count(*) into enq from public.enquiries where created_at >= p_from and created_at < p_to;
  with s as (select * from app.ae_slice(p_from, p_to, f))
  select jsonb_build_object(
    'sessions', (select count(distinct session_id) from s),
    'visitors_consented', (select count(distinct visitor_id) from s where visitor_id is not null),
    'returning_sessions', (select count(distinct session_id) from s where is_returning),
    'page_views', (select count(*) from s where name = 'page_view'),
    'engaged_seconds_avg', (select round(avg(t) / 1000.0) from (select sum(engaged_ms) t from s where name = 'engaged' group by session_id) x),
    'product_views', (select count(*) from s where name in ('product_view','product_open')),
    'configurator_starts', (select count(distinct session_id) from s where name = 'configurator_start'),
    'configurator_completes', (select count(distinct session_id) from s where name = 'configurator_complete'),
    'enquiry_sessions', (select count(distinct session_id) from s where name = 'enquiry_success'),
    'contact_clicks', (select count(*) from s where name = 'contact_click'),
    'contact_by_channel', coalesce((select jsonb_object_agg(ch, n) from (select props ->> 'channel' ch, count(*) n from s where name = 'contact_click' group by 1) x where ch is not null), '{}'),
    'enquiries_saved', enq,
    'first_event', (select min(ts) from public.analytics_events),
    'last_event', (select max(ts) from public.analytics_events),
    'active_sessions_5min', (select count(distinct session_id) from public.analytics_events where ts > now() - interval '5 minutes' and not is_bot)
  ) into r;
  return r;
end $$;

create or replace function public.analytics_series(p_from timestamptz, p_to timestamptz, p_filters jsonb default '{}'::jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := app.require('owner','analyst');
begin
  return coalesce((select jsonb_agg(jsonb_build_object('day', d, 'sessions', ss, 'page_views', pv, 'enquiries', coalesce(eq, 0)) order by d) from (
    select (ts at time zone 'Asia/Jerusalem')::date d, count(distinct session_id) ss, count(*) filter (where name = 'page_view') pv
    from app.ae_slice(p_from, p_to, coalesce(p_filters, '{}'::jsonb)) group by 1) a
    left join (select (created_at at time zone 'Asia/Jerusalem')::date d2, count(*) eq from public.enquiries where created_at >= p_from and created_at < p_to group by 1) b on b.d2 = a.d), '[]'::jsonb);
end $$;

create or replace function public.analytics_breakdown(p_from timestamptz, p_to timestamptz, p_dimension text, p_filters jsonb default '{}'::jsonb, p_limit integer default 20) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := app.require('owner','analyst'); f jsonb := coalesce(p_filters, '{}'::jsonb);
begin
  if p_dimension not in ('source','referrer_host','utm_campaign','device','browser','os','lang','country','path','product','landing','exit') then
    raise exception 'unknown dimension'; end if;
  if p_dimension in ('landing','exit') then
    return coalesce((select jsonb_agg(jsonb_build_object('value', v, 'sessions', n) order by n desc) from (
      select v, count(*) n from (
        select distinct on (session_id) session_id, path v from app.ae_slice(p_from, p_to, f) where name = 'page_view'
        order by session_id, case when p_dimension = 'landing' then extract(epoch from ts) else -extract(epoch from ts) end) x
      group by v order by n desc limit p_limit) y), '[]'::jsonb);
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('value', v, 'sessions', ss, 'events', ev) order by ss desc) from (
    select case p_dimension
             when 'source' then coalesce(utm_source, referrer_host, '(direct)')
             when 'referrer_host' then coalesce(referrer_host, '(direct)')
             when 'utm_campaign' then coalesce(utm_campaign, '(none)')
             when 'device' then device when 'browser' then browser when 'os' then os when 'lang' then lang
             when 'country' then coalesce(country, '(unknown)') when 'path' then path when 'product' then product_key end v,
           count(distinct session_id) ss, count(*) ev
    from app.ae_slice(p_from, p_to, f)
    where p_dimension <> 'product' or (product_key is not null and name in ('product_view','product_open'))
    group by 1 order by 2 desc limit p_limit) x where v is not null), '[]'::jsonb);
end $$;

-- sessions that reached each step, in order, within the period
create or replace function public.analytics_funnel(p_from timestamptz, p_to timestamptz, p_steps text[], p_filters jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','analyst'); out jsonb := '[]'::jsonb; i integer;
begin
  if array_length(p_steps, 1) is null or array_length(p_steps, 1) > 6 then raise exception 'between 1 and 6 steps'; end if;
  create temporary table if not exists _fun (session_id text, name text, ts timestamptz) on commit drop;
  truncate _fun;
  insert into _fun select session_id, name, ts from app.ae_slice(p_from, p_to, coalesce(p_filters, '{}'::jsonb)) where name = any (p_steps);
  -- each session's time of reaching step i, after it reached step i-1
  create temporary table if not exists _reach (session_id text, at timestamptz) on commit drop;
  truncate _reach;
  insert into _reach select session_id, min(ts) from _fun where name = p_steps[1] group by session_id;
  out := out || jsonb_build_object('step', p_steps[1], 'sessions', (select count(*) from _reach));
  for i in 2 .. array_length(p_steps, 1) loop
    create temporary table if not exists _next (session_id text, at timestamptz) on commit drop;
    truncate _next;
    insert into _next select f.session_id, min(f.ts) from _fun f join _reach r on r.session_id = f.session_id and f.ts >= r.at where f.name = p_steps[i] group by f.session_id;
    truncate _reach; insert into _reach select * from _next;
    out := out || jsonb_build_object('step', p_steps[i], 'sessions', (select count(*) from _reach));
  end loop;
  return out;
end $$;

-- old events are deleted; the owner sets the period (13 months by default)
create or replace function app.prune_analytics(p_days integer default 400) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from public.analytics_events where ts < now() - make_interval(days => greatest(p_days, 30));
  get diagnostics n = row_count; return n;
end $$;
revoke all on function app.prune_analytics(integer) from public, anon, authenticated;
grant execute on function app.prune_analytics(integer) to service_role;

grant execute on function public.analytics_overview(timestamptz, timestamptz, jsonb), public.analytics_series(timestamptz, timestamptz, jsonb),
  public.analytics_breakdown(timestamptz, timestamptz, text, jsonb, integer), public.analytics_funnel(timestamptz, timestamptz, text[], jsonb) to authenticated;
