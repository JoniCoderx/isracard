-- SILAVU administration · 2 · content: documents, drafts, revisions, releases
--
-- Everything the site shows is a content document: a product, the collection
-- order, the page's sections and copy, a policy, About, the configurator, the
-- settings, SEO. Each has a draft and a published copy. Only published copies
-- ever reach the public, and only through app.public_snapshot(), which strips
-- private fields (any key named "internal" or starting with "_").

create table if not exists public.content_docs (
  key               text primary key check (key ~ '^[a-z][a-z0-9_-]*(:[a-z0-9][a-z0-9_-]*)?$'),
  kind              text not null check (kind in ('settings','product','collections','page','strings','translations',
                                                   'policy','about','docpage','navigation','configurator','seo')),
  title             text not null default '',
  sort              integer not null default 0,
  draft             jsonb not null,
  draft_rev         integer not null default 1,
  draft_updated_at  timestamptz not null default now(),
  draft_updated_by  uuid references auth.users (id) on delete set null,
  published         jsonb,
  published_rev     integer,
  published_at      timestamptz,
  published_by      uuid references auth.users (id) on delete set null,
  archived_at       timestamptz,
  -- archiving is itself published: the public view drops a piece only on publish
  published_archived boolean not null default false,
  created_at        timestamptz not null default now(),
  constraint draft_is_object check (jsonb_typeof(draft) = 'object'),
  constraint draft_size check (octet_length(draft::text) < 600000)
);
create index if not exists content_kind_idx on public.content_docs (kind, sort);
alter table public.content_docs enable row level security;

create table if not exists public.content_revisions (
  id         bigint generated always as identity primary key,
  doc_key    text not null references public.content_docs (key) on delete cascade,
  rev        integer not null,
  source     text not null check (source in ('import','draft','publish','restore','archive')),
  data       jsonb not null,
  actor      uuid references auth.users (id) on delete set null,
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists rev_doc_idx on public.content_revisions (doc_key, id desc);
alter table public.content_revisions enable row level security;

create table if not exists public.releases (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  status        text not null default 'queued' check (status in ('queued','building','live','failed','superseded')),
  note          text not null default '',
  snapshot      jsonb not null,
  doc_revs      jsonb not null default '{}'::jsonb,
  restored_from bigint references public.releases (id),
  build_url     text,
  started_at    timestamptz,
  finished_at   timestamptz,
  error         text
);
create index if not exists releases_status_idx on public.releases (status, id desc);
alter table public.releases enable row level security;

-- internal figures: never in a document, never in a snapshot
create table if not exists public.product_private (
  product_key    text primary key references public.content_docs (key) on delete cascade,
  cost_minor     bigint check (cost_minor is null or cost_minor >= 0),
  cost_currency  text check (cost_currency in ('ILS','AED','USD','EUR')),
  supplier       text not null default '',
  internal_notes text not null default '',
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users (id) on delete set null
);
alter table public.product_private enable row level security;

-- ── reading ────────────────────────────────────────────────────────────────
drop policy if exists content_staff_read on public.content_docs;
create policy content_staff_read on public.content_docs for select to authenticated using (app.is_staff());
drop policy if exists revisions_read on public.content_revisions;
create policy revisions_read on public.content_revisions for select to authenticated using (app.has_role('owner','editor'));
drop policy if exists releases_read on public.releases;
create policy releases_read on public.releases for select to authenticated using (app.has_role('owner','editor'));
drop policy if exists private_owner on public.product_private;
create policy private_owner on public.product_private for all to authenticated
  using (app.has_role('owner')) with check (app.has_role('owner'));

-- ── private fields never leave ─────────────────────────────────────────────
create or replace function app.public_fields(j jsonb) returns jsonb
language plpgsql immutable as $$
declare k text; v jsonb; out jsonb;
begin
  if j is null then return null; end if;
  if jsonb_typeof(j) = 'object' then
    out := '{}'::jsonb;
    for k, v in select * from jsonb_each(j) loop
      if k = 'internal' or left(k, 1) = '_' then continue; end if;
      out := out || jsonb_build_object(k, app.public_fields(v));
    end loop;
    return out;
  elsif jsonb_typeof(j) = 'array' then
    return coalesce((select jsonb_agg(app.public_fields(e)) from jsonb_array_elements(j) e), '[]'::jsonb);
  end if;
  return j;
end $$;

-- the published site: every live document, and the keys taken down (so a
-- build does not bring back a piece from the code's own seed)
create or replace function app.public_snapshot() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'schema', 1,
    'generated_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'docs', coalesce((select jsonb_object_agg(d.key, jsonb_build_object('kind', d.kind, 'sort', d.sort, 'rev', d.published_rev, 'data', app.public_fields(d.published)) order by d.key)
                      from public.content_docs d where d.published is not null and not d.published_archived), '{}'::jsonb),
    'archived', coalesce((select jsonb_agg(d.key order by d.key) from public.content_docs d where d.published_archived), '[]'::jsonb))
$$;

-- ── validation that cannot be skipped by a client ─────────────────────────
create or replace function app.validate_doc(p_kind text, p_key text, d jsonb) returns text[]
language plpgsql immutable as $$
declare errs text[] := '{}'; mode text; cur text; amt jsonb;
begin
  if p_kind = 'product' then
    if coalesce(d #>> '{name,en}', '') = '' then errs := array_append(errs, ('name (English) is required')::text); end if;
    if coalesce(d #>> '{name,he}', '') = '' then errs := array_append(errs, ('name (Hebrew) is required')::text); end if;
    if coalesce(d ->> 'id', '') !~ '^[a-z0-9][a-z0-9-]{0,40}$' then errs := array_append(errs, ('the address name (slug) may use a–z, 0–9 and hyphens')::text); end if;
    if p_key <> 'product:' || coalesce(d ->> 'id', '') then errs := array_append(errs, ('the slug must match the document')::text); end if;
    if jsonb_typeof(d -> 'shots') is distinct from 'array' or jsonb_array_length(d -> 'shots') = 0 then errs := array_append(errs, ('at least one photograph is required')::text); end if;
    mode := coalesce(d #>> '{price,mode}', 'on_request');
    if mode not in ('on_request','exact','from') then errs := array_append(errs, ('price mode must be on request, exact or from')::text); end if;
    if mode in ('exact','from') then
      amt := d #> '{price,amounts}';
      if jsonb_typeof(amt) is distinct from 'object' or amt = '{}'::jsonb then errs := array_append(errs, ('a price needs at least one amount')::text);
      else
        for cur in select jsonb_object_keys(amt) loop
          if cur not in ('ILS','AED','USD','EUR') then errs := array_append(errs, (('unsupported currency ' || cur))::text); end if;
          if jsonb_typeof(amt -> cur) <> 'number' or (amt ->> cur)::numeric <> floor((amt ->> cur)::numeric) or (amt ->> cur)::numeric <= 0 then
            errs := array_append(errs, (('the ' || cur || ' amount must be a whole number of minor units above zero'))::text); end if;
        end loop;
      end if;
    end if;
  elsif p_kind = 'docpage' then
    if coalesce(d #>> '{title,en}', '') = '' or coalesce(d #>> '{title,he}', '') = '' then errs := array_append(errs, ('a page needs a title in English and Hebrew')::text); end if;
    if coalesce(d ->> 'slug', '') !~ '^[a-z0-9][a-z0-9-]{0,60}$' then errs := array_append(errs, ('the page address may use a–z, 0–9 and hyphens')::text); end if;
    if coalesce(d ->> 'slug', '') in ('admin','pieces','he','img','v','f','desk','assets','fonts','lang','about','privacy','terms','_content') then errs := array_append(errs, ('that address is already used by the site')::text); end if;
  elsif p_kind = 'configurator' then
    if jsonb_typeof(d -> 'cuts') is distinct from 'array' or jsonb_array_length(d -> 'cuts') = 0 then errs := array_append(errs, ('at least one diamond shape must be enabled')::text); end if;
    if not exists (select 1 from jsonb_array_elements(coalesce(d -> 'metals', '[]')) m where coalesce((m ->> 'enabled')::boolean, true)) then errs := array_append(errs, ('at least one metal must be offered')::text); end if;
    if not exists (select 1 from jsonb_array_elements(coalesce(d -> 'origins', '[]')) o where coalesce((o ->> 'enabled')::boolean, true)) then errs := array_append(errs, ('at least one diamond origin must be offered')::text); end if;
    if not exists (select 1 from jsonb_array_elements(coalesce(d -> 'cuts', '[]')) c where coalesce((c ->> 'enabled')::boolean, true)) then errs := array_append(errs, ('at least one diamond shape must be offered')::text); end if;
    if coalesce((d #>> '{carat,min}')::numeric, 0) <= 0 or coalesce((d #>> '{carat,max}')::numeric, 0) < coalesce((d #>> '{carat,min}')::numeric, 0) then errs := array_append(errs, ('the carat range is not valid')::text); end if;
  end if;
  return errs;
end $$;

-- ── writing drafts ─────────────────────────────────────────────────────────
create or replace function public.save_draft(p_key text, p_kind text, p_title text, p_data jsonb, p_expected_rev integer, p_checkpoint boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','editor'); cur public.content_docs; nrev integer;
begin
  select * into cur from public.content_docs where key = p_key for update;
  if not found then
    if coalesce(p_expected_rev, 0) <> 0 then raise exception 'conflict: this document no longer exists' using errcode = '40001'; end if;
    insert into public.content_docs (key, kind, title, draft, draft_rev, draft_updated_by, sort)
    values (p_key, p_kind, coalesce(p_title, ''), p_data, 1, me, coalesce((select max(sort) + 1 from public.content_docs where kind = p_kind), 0));
    nrev := 1;
    perform app.audit('content.create', 'doc:' || p_key, jsonb_build_object('kind', p_kind));
  else
    if cur.kind <> p_kind then raise exception 'the document kind cannot change'; end if;
    -- how visits are counted changes what the privacy page promises: the owner's decision
    if p_key = 'settings' and not app.has_role('owner') and (p_data -> 'analytics') is distinct from (cur.draft -> 'analytics') then
      raise exception 'only the owner changes how visits are counted' using errcode = '42501';
    end if;
    if cur.draft_rev <> p_expected_rev then
      raise exception 'conflict: someone saved this at % (version %); reload to see their changes', cur.draft_updated_at, cur.draft_rev using errcode = '40001';
    end if;
    nrev := cur.draft_rev + 1;
    update public.content_docs set draft = p_data, title = coalesce(p_title, title), draft_rev = nrev, draft_updated_at = now(), draft_updated_by = me where key = p_key;
  end if;
  if p_checkpoint then
    insert into public.content_revisions (doc_key, rev, source, data, actor) values (p_key, nrev, 'draft', p_data, me);
    perform app.audit('content.save', 'doc:' || p_key, jsonb_build_object('rev', nrev));
  end if;
  return jsonb_build_object('key', p_key, 'rev', nrev, 'saved_at', now());
end $$;

create or replace function public.set_doc_order(p_keys text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','editor'); i integer;
begin
  for i in 1 .. coalesce(array_length(p_keys, 1), 0) loop
    update public.content_docs set sort = i, draft_rev = draft_rev + 1, draft_updated_at = now(), draft_updated_by = me where key = p_keys[i] and sort <> i;
  end loop;
  perform app.audit('content.reorder', 'docs', jsonb_build_object('keys', to_jsonb(p_keys)));
end $$;

create or replace function public.archive_doc(p_key text, p_archived boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','editor');
begin
  update public.content_docs set archived_at = case when p_archived then now() else null end,
    draft_rev = draft_rev + 1, draft_updated_at = now(), draft_updated_by = me
  where key = p_key and kind not in ('settings','collections','page','strings','configurator','seo','navigation','translations');
  if not found then raise exception 'this document cannot be archived'; end if;
  insert into public.content_revisions (doc_key, rev, source, data, actor)
    select key, draft_rev, 'archive', draft, me from public.content_docs where key = p_key;
  perform app.audit(case when p_archived then 'content.archive' else 'content.unarchive' end, 'doc:' || p_key, '{}'::jsonb);
end $$;

-- only an archived document that was never published, or whose archiving is
-- live, can be deleted for good, and only by the owner
create or replace function public.delete_doc(p_key text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner');
begin
  delete from public.content_docs where key = p_key and archived_at is not null and (published is null or published_archived);
  if not found then raise exception 'archive and publish first; only an archived document can be deleted'; end if;
  perform app.audit('content.delete', 'doc:' || p_key, '{}'::jsonb);
end $$;

create or replace function public.restore_revision(p_revision bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','editor'); r public.content_revisions; nrev integer;
begin
  select * into r from public.content_revisions where id = p_revision;
  if not found then raise exception 'no such revision'; end if;
  update public.content_docs set draft = r.data, draft_rev = draft_rev + 1, draft_updated_at = now(), draft_updated_by = me
    where key = r.doc_key returning draft_rev into nrev;
  insert into public.content_revisions (doc_key, rev, source, data, actor, note) values (r.doc_key, nrev, 'restore', r.data, me, 'restored from revision ' || r.id);
  perform app.audit('content.restore', 'doc:' || r.doc_key, jsonb_build_object('from_revision', r.id, 'rev', nrev));
  return jsonb_build_object('key', r.doc_key, 'rev', nrev);
end $$;

-- ── publishing ─────────────────────────────────────────────────────────────
-- p_keys null: everything whose draft differs from what is published
create or replace function public.publish_docs(p_keys text[], p_note text default '') returns bigint
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','editor'); d public.content_docs; errs text[]; all_errs text[] := '{}'; n integer := 0; rid bigint; revs jsonb := '{}'::jsonb;
begin
  for d in select * from public.content_docs
           where (p_keys is null or key = any (p_keys))
             and (published_rev is distinct from draft_rev or published_archived <> (archived_at is not null))
           order by key for update loop
    if d.archived_at is null then
      errs := app.validate_doc(d.kind, d.key, d.draft);
      if array_length(errs, 1) > 0 then
        all_errs := all_errs || (select array_agg(d.key || ': ' || e) from unnest(errs) e);
        continue;
      end if;
    end if;
    update public.content_docs set published = draft, published_rev = draft_rev, published_at = now(), published_by = me,
      published_archived = (archived_at is not null) where key = d.key;
    insert into public.content_revisions (doc_key, rev, source, data, actor, note) values (d.key, d.draft_rev, 'publish', d.draft, me, coalesce(p_note, ''));
    revs := revs || jsonb_build_object(d.key, d.draft_rev);
    n := n + 1;
  end loop;
  if array_length(all_errs, 1) > 0 then
    raise exception 'not published: %', array_to_string(all_errs, '; ') using errcode = '22023';
  end if;
  if n = 0 and p_keys is not null then raise exception 'nothing to publish: the drafts match what is live'; end if;
  insert into public.releases (created_by, note, snapshot, doc_revs) values (me, coalesce(p_note, ''), app.public_snapshot(), revs) returning id into rid;
  perform app.audit('release.create', 'release:' || rid, jsonb_build_object('docs', n, 'note', left(coalesce(p_note, ''), 140)));
  return rid;
end $$;

-- an earlier release, made current again as a new release
create or replace function public.republish_release(p_release bigint, p_note text default '') returns bigint
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner'); r public.releases; k text; v jsonb; rid bigint; nrev integer;
begin
  select * into r from public.releases where id = p_release;
  if not found then raise exception 'no such release'; end if;
  -- documents the old release did not have are taken down
  update public.content_docs set published_archived = true, archived_at = coalesce(archived_at, now()), draft_rev = draft_rev + 1
    where published is not null and not (r.snapshot -> 'docs' ? key);
  for k, v in select * from jsonb_each(r.snapshot -> 'docs') loop
    update public.content_docs set draft = v -> 'data', draft_rev = draft_rev + 1, published = v -> 'data', published_rev = draft_rev + 1,
      published_at = now(), published_by = me, archived_at = null, published_archived = false
    where key = k returning draft_rev into nrev;
    if found then
      insert into public.content_revisions (doc_key, rev, source, data, actor, note) values (k, nrev, 'restore', v -> 'data', me, 'release ' || p_release || ' restored');
    end if;
  end loop;
  insert into public.releases (created_by, note, snapshot, restored_from)
    values (me, coalesce(nullif(p_note, ''), 'Restored release ' || p_release), app.public_snapshot(), p_release) returning id into rid;
  perform app.audit('release.restore', 'release:' || rid, jsonb_build_object('from', p_release));
  return rid;
end $$;

-- the build reports back (service role, from the release-status function)
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
    update public.releases set status = 'superseded' where status = 'live' and id < p_release;
  end if;
  insert into public.audit_log (actor, actor_role, action, target, summary) values (null, 'build', 'release.' || p_status, 'release:' || p_release, jsonb_build_object('url', p_url));
end $$;
revoke all on function app.set_release_status(bigint, text, text, text) from public, anon, authenticated;
grant execute on function app.set_release_status(bigint, text, text, text) to service_role;

-- what a build should use: a given release, else the newest one that has not
-- failed (a code change must not undo a publish whose build is still running)
create or replace function app.release_for_build(p_release bigint default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('release', r.id, 'status', r.status, 'snapshot', r.snapshot)
  from public.releases r
  where (p_release is not null and r.id = p_release)
     or (p_release is null and r.id = (select max(id) from public.releases where status <> 'failed'))
  limit 1
$$;
revoke all on function app.release_for_build(bigint) from public, anon, authenticated;
grant execute on function app.release_for_build(bigint) to service_role;

-- the import of the site as it is today: once, by the seed script (service role)
create or replace function app.import_doc(p_key text, p_kind text, p_title text, p_data jsonb, p_sort integer) returns text
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.content_docs (key, kind, title, draft, draft_rev, published, published_rev, published_at, sort)
  values (p_key, p_kind, coalesce(p_title, ''), p_data, 1, p_data, 1, now(), coalesce(p_sort, 0))
  on conflict (key) do nothing;
  if found then
    insert into public.content_revisions (doc_key, rev, source, data, note) values (p_key, 1, 'import', p_data, 'imported from the site as it was');
    return 'imported';
  end if;
  return 'kept';
end $$;
revoke all on function app.import_doc(text, text, text, jsonb, integer) from public, anon, authenticated;
grant execute on function app.import_doc(text, text, text, jsonb, integer) to service_role;

create or replace function app.import_release(p_note text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare rid bigint;
begin
  if exists (select 1 from public.releases) then return null; end if;
  insert into public.releases (note, snapshot, status, finished_at) values (p_note, app.public_snapshot(), 'live', now()) returning id into rid;
  return rid;
end $$;
revoke all on function app.import_release(text) from public, anon, authenticated;
grant execute on function app.import_release(text) to service_role;

grant execute on function public.save_draft(text, text, text, jsonb, integer, boolean), public.set_doc_order(text[]), public.archive_doc(text, boolean),
  public.delete_doc(text), public.restore_revision(bigint), public.publish_docs(text[], text), public.republish_release(bigint, text) to authenticated;
