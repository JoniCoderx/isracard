-- SILAVU administration · 3 · media: the library and private storage
--
-- Originals are uploaded to the private "media" bucket and are never served
-- from it to the public. A release bakes the pictures it uses into the static
-- site (the build derives the widths), so a picture becomes public at the
-- same moment as the page that shows it, and a draft's pictures never do.
-- Customer attachments and exports have buckets of their own, also private.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', false, 52428800, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('attachments', 'attachments', false, 15728640, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('exports', 'exports', false, 524288000, array['application/json','application/gzip','application/zip'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.media_assets (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,            -- object name inside the media bucket
  kind        text not null check (kind in ('image','video')),
  mime        text not null,
  bytes       bigint not null check (bytes > 0),
  width       integer check (width is null or width > 0),
  height      integer check (height is null or height > 0),
  sha256      text,
  filename    text not null default '',
  title       text not null default '',
  alt         jsonb not null default '{"en":"","he":""}'::jsonb,
  caption     jsonb not null default '{"en":"","he":""}'::jsonb,
  folder      text not null default '',
  tags        text[] not null default '{}',
  focal_x     real not null default 0.5 check (focal_x between 0 and 1),
  focal_y     real not null default 0.5 check (focal_y between 0 and 1),
  -- 'pending' until the server has checked the bytes are what they claim to be
  status      text not null default 'pending' check (status in ('pending','ready','rejected')),
  reject_reason text,
  replaced_by uuid references public.media_assets (id),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists media_live_idx on public.media_assets (created_at desc) where deleted_at is null;
create index if not exists media_tags_idx on public.media_assets using gin (tags);
alter table public.media_assets enable row level security;

drop policy if exists media_read on public.media_assets;
create policy media_read on public.media_assets for select to authenticated using (app.has_role('owner','editor','support'));
drop policy if exists media_edit on public.media_assets;
create policy media_edit on public.media_assets for update to authenticated
  using (app.has_role('owner','editor')) with check (app.has_role('owner','editor'));
-- inserts go through register_media(); deletes through delete_media()

-- ── storage: who may touch which bucket ────────────────────────────────────
drop policy if exists "media: staff read" on storage.objects;
create policy "media: staff read" on storage.objects for select to authenticated
  using (bucket_id = 'media' and app.has_role('owner','editor','support'));
drop policy if exists "media: editors upload" on storage.objects;
create policy "media: editors upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and app.has_role('owner','editor') and (storage.foldername(name))[1] = 'originals');
drop policy if exists "attachments: support" on storage.objects;
create policy "attachments: support" on storage.objects for all to authenticated
  using (bucket_id = 'attachments' and app.has_role('owner','support'))
  with check (bucket_id = 'attachments' and app.has_role('owner','support'));
drop policy if exists "exports: owner read" on storage.objects;
create policy "exports: owner read" on storage.objects for select to authenticated
  using (bucket_id = 'exports' and app.has_role('owner'));
-- nobody updates or deletes a stored original from the browser: an original
-- is replaced by uploading a new one and pointing the asset at it

-- ── registering an upload ──────────────────────────────────────────────────
create or replace function public.register_media(p_path text, p_kind text, p_mime text, p_bytes bigint, p_width integer, p_height integer,
  p_filename text, p_sha256 text, p_folder text default '', p_tags text[] default '{}') returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','editor'); nid uuid;
begin
  if p_path !~ '^originals/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif|mp4|webm)$' then raise exception 'unexpected upload path'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'media' and name = p_path) then raise exception 'the file did not finish uploading'; end if;
  insert into public.media_assets (path, kind, mime, bytes, width, height, filename, sha256, folder, tags, created_by, title)
  values (p_path, p_kind, p_mime, p_bytes, p_width, p_height, left(coalesce(p_filename, ''), 200), p_sha256, left(coalesce(p_folder, ''), 80), coalesce(p_tags, '{}'), me,
          regexp_replace(left(coalesce(p_filename, ''), 200), '\.[A-Za-z0-9]+$', ''))
  returning id into nid;
  perform app.audit('media.upload', 'media:' || nid, jsonb_build_object('bytes', p_bytes, 'mime', p_mime));
  return nid;
end $$;

-- the media function confirms (or refuses) the file after reading its bytes
create or replace function app.set_media_check(p_id uuid, p_ok boolean, p_reason text, p_width integer, p_height integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.media_assets set status = case when p_ok then 'ready' else 'rejected' end, reject_reason = case when p_ok then null else left(p_reason, 300) end,
    width = coalesce(p_width, width), height = coalesce(p_height, height), updated_at = now() where id = p_id;
end $$;
revoke all on function app.set_media_check(uuid, boolean, text, integer, integer) from public, anon, authenticated;
grant execute on function app.set_media_check(uuid, boolean, text, integer, integer) to service_role;

-- where an asset is used: drafts, what is live, and the history kept for restoring
create or replace function public.media_usage(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'drafts', coalesce((select jsonb_agg(jsonb_build_object('key', key, 'title', title)) from public.content_docs where draft::text like '%' || p_id::text || '%'), '[]'),
    'live', coalesce((select jsonb_agg(jsonb_build_object('key', key, 'title', title)) from public.content_docs where published::text like '%' || p_id::text || '%'), '[]'),
    'history', (select count(*) from public.content_revisions where data::text like '%' || p_id::text || '%')
             + (select count(*) from public.releases where snapshot::text like '%' || p_id::text || '%'))
  where app.has_role('owner','editor')
$$;

-- a file in use, or kept by a version that can still be restored, is not deleted
create or replace function public.delete_media(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','editor'); u jsonb := public.media_usage(p_id);
begin
  if jsonb_array_length(u -> 'drafts') > 0 or jsonb_array_length(u -> 'live') > 0 then
    raise exception 'this file is in use: remove it from those pages first';
  end if;
  if (u ->> 'history')::integer > 0 then
    -- hidden from the library, kept so older versions can still be restored
    update public.media_assets set deleted_at = now(), updated_at = now() where id = p_id;
    perform app.audit('media.hide', 'media:' || p_id, '{}'::jsonb);
    return;
  end if;
  update public.media_assets set deleted_at = now(), updated_at = now() where id = p_id;
  perform app.audit('media.delete', 'media:' || p_id, '{}'::jsonb);
end $$;

-- every draft that points at one file is pointed at another (the editor
-- previews the affected pages before publishing)
create or replace function public.replace_media(p_old uuid, p_new uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','editor'); d record; touched jsonb := '[]'::jsonb;
begin
  if not exists (select 1 from public.media_assets where id = p_new and status = 'ready' and deleted_at is null) then raise exception 'the new file is not ready'; end if;
  for d in select key from public.content_docs where draft::text like '%' || p_old::text || '%' for update loop
    update public.content_docs set draft = replace(draft::text, p_old::text, p_new::text)::jsonb, draft_rev = draft_rev + 1, draft_updated_at = now(), draft_updated_by = me where key = d.key;
    insert into public.content_revisions (doc_key, rev, source, data, actor, note)
      select key, draft_rev, 'draft', draft, me, 'picture replaced' from public.content_docs where key = d.key;
    touched := touched || to_jsonb(d.key);
  end loop;
  update public.media_assets set replaced_by = p_new, updated_at = now() where id = p_old;
  perform app.audit('media.replace', 'media:' || p_old, jsonb_build_object('with', p_new, 'docs', touched));
  return touched;
end $$;

grant execute on function public.register_media(text, text, text, bigint, integer, integer, text, text, text, text[]), public.media_usage(uuid),
  public.delete_media(uuid), public.replace_media(uuid, uuid) to authenticated;

-- the build asks for the originals a snapshot uses
create or replace function app.media_for_snapshot(p_snapshot jsonb) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'path', m.path, 'kind', m.kind, 'mime', m.mime, 'width', m.width, 'height', m.height)), '[]'::jsonb)
  from public.media_assets m
  where m.status = 'ready' and p_snapshot::text like '%media:' || m.id::text || '%'
$$;
revoke all on function app.media_for_snapshot(jsonb) from public, anon, authenticated;
grant execute on function app.media_for_snapshot(jsonb) to service_role;
