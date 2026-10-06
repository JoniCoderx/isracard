-- SILAVU administration · 4 · enquiries, customers, quotes
--
-- Only what a person supplied is kept: name, the contact details they gave,
-- city, how they want to be answered, what they asked about, their message.
-- Anonymous browsing is never joined to a person. Replying to an enquiry and
-- marketing are separate permissions; marketing is off unless they ticked it.

do $$ begin
  create type public.enquiry_status as enum ('new','contacted','quoted','follow_up','won','closed');
exception when duplicate_object then null; end $$;

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default '',
  email         text,
  phone         text,
  city          text not null default '',
  preferred_channel text not null default '' check (preferred_channel in ('','email','whatsapp','phone')),
  lifecycle     text not null default 'lead' check (lifecycle in ('lead','client','past_client','closed')),
  tags          text[] not null default '{}',
  notes         text not null default '',
  consent_marketing boolean not null default false,
  consent_marketing_at timestamptz,
  merged_into   uuid references public.customers (id),
  anonymized_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists customers_email_idx on public.customers (lower(email)) where merged_into is null and anonymized_at is null;
create index if not exists customers_phone_idx on public.customers (phone) where merged_into is null and anonymized_at is null;
create index if not exists customers_name_idx on public.customers using gin (to_tsvector('simple', name));
alter table public.customers enable row level security;

create table if not exists public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  ref           text unique,
  created_at    timestamptz not null default now(),
  idem_key      uuid not null unique,
  status        public.enquiry_status not null default 'new',
  assignee      uuid references auth.users (id) on delete set null,
  due_at        timestamptz,
  customer_id   uuid references public.customers (id),
  name          text not null,
  email         text,
  phone         text,
  contact_raw   text not null default '',
  city          text not null default '',
  channel       text not null default 'email' check (channel in ('email','whatsapp','phone')),
  want          text not null default '',
  product_key   text,
  product_ref   text,
  product_name  text,
  spec          jsonb,
  spec_text     text not null default '',
  config_rev    integer,
  message       text not null default '',
  lang          text not null default 'en' check (lang in ('en','he','ar','fr','ru')),
  page          text not null default '',
  utm           jsonb not null default '{}'::jsonb,
  consent_reply boolean not null default true,
  consent_marketing boolean not null default false,
  notify_status text not null default 'pending' check (notify_status in ('pending','sent','failed','off')),
  notify_error  text,
  tags          text[] not null default '{}',
  updated_at    timestamptz not null default now()
);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status, created_at desc);
create index if not exists enquiries_customer_idx on public.enquiries (customer_id);
alter table public.enquiries enable row level security;
create sequence if not exists public.enquiry_ref_seq;

create table if not exists public.enquiry_notes (
  id          bigint generated always as identity primary key,
  enquiry_id  uuid not null references public.enquiries (id) on delete cascade,
  author      uuid references auth.users (id) on delete set null,
  body        text not null check (length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);
alter table public.enquiry_notes enable row level security;

create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  number        text unique,
  rev           integer not null default 1,
  customer_id   uuid references public.customers (id),
  enquiry_id    uuid references public.enquiries (id),
  status        text not null default 'draft' check (status in ('draft','sent','accepted','declined','expired','withdrawn')),
  title         text not null default '',
  -- what was quoted, frozen: later product edits do not change a quote
  product_snapshot jsonb,
  spec_snapshot jsonb,
  amount_minor  bigint check (amount_minor is null or amount_minor >= 0),
  currency      text not null default 'ILS' check (currency in ('ILS','AED','USD','EUR')),
  valid_until   date,
  notes_customer text not null default '',
  notes_internal text not null default '',
  sent_at       timestamptz,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists quotes_customer_idx on public.quotes (customer_id);
alter table public.quotes enable row level security;
create sequence if not exists public.quote_number_seq;

-- support and the owner work with people; nobody else sees them
drop policy if exists customers_rw on public.customers;
create policy customers_rw on public.customers for all to authenticated
  using (app.has_role('owner','support')) with check (app.has_role('owner','support'));
drop policy if exists enquiries_read on public.enquiries;
create policy enquiries_read on public.enquiries for select to authenticated using (app.has_role('owner','support'));
drop policy if exists notes_read on public.enquiry_notes;
create policy notes_read on public.enquiry_notes for select to authenticated using (app.has_role('owner','support'));
drop policy if exists notes_add on public.enquiry_notes;
create policy notes_add on public.enquiry_notes for insert to authenticated
  with check (app.has_role('owner','support') and author = auth.uid());
drop policy if exists quotes_read on public.quotes;
create policy quotes_read on public.quotes for select to authenticated using (app.has_role('owner','support'));

-- ── the public form, through the enquiry function (service role) ──────────
create or replace function app.clean(t text, n integer) returns text language sql immutable as $$
  select left(btrim(regexp_replace(coalesce(t, ''), '[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]', '', 'g')), n) $$;

create or replace function app.submit_enquiry(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k uuid; e public.enquiries; cid uuid; nm text; em text; ph text; raw text; cfg jsonb; cfg_rev integer; sp jsonb; prod jsonb; errs text[] := '{}';
begin
  begin k := (p ->> 'idem')::uuid; exception when others then raise exception 'invalid request' using errcode = '22023'; end;
  if k is null then raise exception 'invalid request' using errcode = '22023'; end if;
  -- a second press of Send, or a retry, returns the enquiry already saved
  select * into e from public.enquiries where idem_key = k;
  if found then return jsonb_build_object('id', e.id, 'ref', e.ref, 'created_at', e.created_at, 'duplicate', true); end if;
  if coalesce(p ->> 'website', '') <> '' then raise exception 'invalid request' using errcode = '22023'; end if;  -- the honeypot

  nm := app.clean(p ->> 'name', 120);
  raw := app.clean(p ->> 'contact', 200);
  em := lower(app.clean(coalesce(nullif(p ->> 'email', ''), case when raw like '%@%' then raw end), 200));
  ph := nullif(regexp_replace(coalesce(nullif(p ->> 'phone', ''), case when raw not like '%@%' then raw end, ''), '[^0-9+]', '', 'g'), '');
  if length(nm) < 1 then errs := array_append(errs, ('name')::text); end if;
  if em is not null and em !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then errs := array_append(errs, ('email')::text); end if;
  if ph is not null and length(regexp_replace(ph, '[^0-9]', '', 'g')) not between 6 and 16 then errs := array_append(errs, ('phone')::text); end if;
  if em is null and ph is null then errs := array_append(errs, ('contact')::text); end if;
  if length(coalesce(p ->> 'message', '')) > 5000 then errs := array_append(errs, ('message')::text); end if;
  if coalesce(p ->> 'lang', 'en') not in ('en','he','ar','fr','ru') then errs := array_append(errs, ('lang')::text); end if;
  if coalesce(lower(p ->> 'channel'), 'email') not in ('email','whatsapp','phone','call') then errs := array_append(errs, ('channel')::text); end if;

  -- a piece: named by its published document, so the record carries what it was called then
  if coalesce(p ->> 'product', '') <> '' then
    select d.published into prod from public.content_docs d where d.key = 'product:' || (p ->> 'product') and d.published is not null and not d.published_archived;
    if prod is null then errs := array_append(errs, ('product')::text); end if;
  end if;

  -- a configuration: checked against the configurator settings that are live
  sp := p -> 'spec';
  if sp is not null and jsonb_typeof(sp) = 'object' then
    select d.published, d.published_rev into cfg, cfg_rev from public.content_docs d where d.key = 'configurator';
    if cfg is not null then
      if sp ? 'cut' and not exists (select 1 from jsonb_array_elements(cfg -> 'cuts') c where c ->> 'id' = sp ->> 'cut' and coalesce((c ->> 'enabled')::boolean, true)) then errs := array_append(errs, ('spec.cut')::text); end if;
      if sp ? 'origin' and not exists (select 1 from jsonb_array_elements(cfg -> 'origins') o where o ->> 'id' = sp ->> 'origin' and coalesce((o ->> 'enabled')::boolean, true)) then errs := array_append(errs, ('spec.origin')::text); end if;
      if sp ? 'metal' and not exists (select 1 from jsonb_array_elements(cfg -> 'metals') m where m ->> 'id' = sp ->> 'metal' and coalesce((m ->> 'enabled')::boolean, true)) then errs := array_append(errs, ('spec.metal')::text); end if;
      if sp ? 'ct' and ((sp ->> 'ct')::numeric < (cfg #>> '{carat,min}')::numeric or (sp ->> 'ct')::numeric > (cfg #>> '{carat,max}')::numeric) then errs := array_append(errs, ('spec.ct')::text); end if;
    end if;
    -- a price the visitor's page showed is never trusted: it is not stored as a price
    sp := sp - 'price' - 'estimate';
  else
    sp := null;
  end if;
  if array_length(errs, 1) > 0 then raise exception 'invalid: %', array_to_string(errs, ',') using errcode = '22023'; end if;

  -- the same person writing again is the same customer, matched only on the
  -- address or number they gave; nothing else is joined
  select c.id into cid from public.customers c
   where c.merged_into is null and c.anonymized_at is null and ((em is not null and lower(c.email) = em) or (ph is not null and c.phone = ph))
   order by c.created_at limit 1;
  if cid is null then
    insert into public.customers (name, email, phone, city, preferred_channel, consent_marketing, consent_marketing_at)
    values (nm, em, ph, app.clean(p ->> 'city', 80),
            case lower(coalesce(p ->> 'channel', 'email')) when 'whatsapp' then 'whatsapp' when 'call' then 'phone' when 'phone' then 'phone' else 'email' end,
            coalesce((p ->> 'consent_marketing')::boolean, false), case when coalesce((p ->> 'consent_marketing')::boolean, false) then now() end)
    returning id into cid;
  elsif coalesce((p ->> 'consent_marketing')::boolean, false) then
    update public.customers set consent_marketing = true, consent_marketing_at = now(), updated_at = now() where id = cid;
  end if;

  insert into public.enquiries (idem_key, ref, customer_id, name, email, phone, contact_raw, city, channel, want, product_key, product_ref, product_name,
    spec, spec_text, config_rev, message, lang, page, utm, consent_marketing)
  values (k, 'E-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.enquiry_ref_seq')::text, 4, '0'), cid, nm, em, ph, raw, app.clean(p ->> 'city', 80),
    case lower(coalesce(p ->> 'channel', 'email')) when 'whatsapp' then 'whatsapp' when 'call' then 'phone' when 'phone' then 'phone' else 'email' end,
    app.clean(p ->> 'want', 80), nullif(app.clean(p ->> 'product', 60), ''), coalesce(prod ->> 'ref', nullif(app.clean(p ->> 'ref', 40), '')),
    coalesce(prod ->> 'plain', null), sp, app.clean(p ->> 'selection', 2000), case when sp is not null then cfg_rev end,
    app.clean(p ->> 'message', 5000), coalesce(p ->> 'lang', 'en'), app.clean(regexp_replace(coalesce(p ->> 'page', ''), '[?#].*$', ''), 200),
    coalesce((select jsonb_object_agg(key, left(value #>> '{}', 100)) from jsonb_each(coalesce(p -> 'utm', '{}'::jsonb)) where key in ('utm_source','utm_medium','utm_campaign')), '{}'::jsonb),
    coalesce((p ->> 'consent_marketing')::boolean, false))
  on conflict (idem_key) do nothing
  returning * into e;
  if e.id is null then
    select * into e from public.enquiries where idem_key = k;
    return jsonb_build_object('id', e.id, 'ref', e.ref, 'created_at', e.created_at, 'duplicate', true);
  end if;
  insert into public.audit_log (actor, actor_role, action, target, summary) values (null, 'public', 'enquiry.received', 'enquiry:' || e.id, jsonb_build_object('want', e.want, 'product', e.product_key));
  return jsonb_build_object('id', e.id, 'ref', e.ref, 'created_at', e.created_at, 'duplicate', false);
end $$;
revoke all on function app.submit_enquiry(jsonb) from public, anon, authenticated;
grant execute on function app.submit_enquiry(jsonb) to service_role;

create or replace function app.set_enquiry_notify(p_id uuid, p_status text, p_error text default null) returns void
language sql security definer set search_path = '' as $$
  update public.enquiries set notify_status = p_status, notify_error = left(p_error, 500) where id = p_id $$;
revoke all on function app.set_enquiry_notify(uuid, text, text) from public, anon, authenticated;
grant execute on function app.set_enquiry_notify(uuid, text, text) to service_role;

-- ── working an enquiry ─────────────────────────────────────────────────────
create or replace function public.update_enquiry(p_id uuid, p_status public.enquiry_status, p_assignee uuid, p_due timestamptz, p_tags text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','support'); old public.enquiries;
begin
  select * into old from public.enquiries where id = p_id for update;
  if not found then raise exception 'no such enquiry'; end if;
  if p_assignee is not null and not exists (select 1 from public.staff where user_id = p_assignee and active and role in ('owner','support')) then
    raise exception 'that person cannot be assigned enquiries'; end if;
  update public.enquiries set status = coalesce(p_status, status), assignee = p_assignee, due_at = p_due, tags = coalesce(p_tags, tags), updated_at = now() where id = p_id;
  perform app.audit('enquiry.update', 'enquiry:' || p_id, jsonb_build_object('status_from', old.status, 'status_to', coalesce(p_status, old.status),
    'assignee', p_assignee, 'due', p_due));
end $$;

-- ── customers ──────────────────────────────────────────────────────────────
create or replace function public.merge_customers(p_keep uuid, p_drop uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','support'); k public.customers; d public.customers;
begin
  if p_keep = p_drop then raise exception 'choose two different customers'; end if;
  select * into k from public.customers where id = p_keep and merged_into is null for update;
  select * into d from public.customers where id = p_drop and merged_into is null for update;
  if k.id is null or d.id is null then raise exception 'both customers must exist and not already be merged'; end if;
  update public.enquiries set customer_id = p_keep where customer_id = p_drop;
  update public.quotes set customer_id = p_keep where customer_id = p_drop;
  update public.customers set email = coalesce(k.email, d.email), phone = coalesce(k.phone, d.phone), city = coalesce(nullif(k.city, ''), d.city),
    tags = (select coalesce(array_agg(distinct t), '{}') from unnest(k.tags || d.tags) t),
    notes = btrim(k.notes || case when d.notes <> '' then E'\n' || d.notes else '' end),
    consent_marketing = k.consent_marketing or d.consent_marketing, updated_at = now() where id = p_keep;
  update public.customers set merged_into = p_keep, updated_at = now() where id = p_drop;
  perform app.audit('customer.merge', 'customer:' || p_keep, jsonb_build_object('merged', p_drop));
end $$;

-- the right to be forgotten: the person's details go; the counts stay
create or replace function public.anonymize_customer(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner');
begin
  update public.customers set name = 'Anonymized', email = null, phone = null, city = '', notes = '', tags = '{}', consent_marketing = false,
    anonymized_at = now(), updated_at = now() where id = p_id or merged_into = p_id;
  update public.enquiries set name = 'Anonymized', email = null, phone = null, contact_raw = '', city = '', message = '[removed]', spec_text = '', page = '', utm = '{}'
    where customer_id = p_id;
  delete from public.enquiry_notes where enquiry_id in (select id from public.enquiries where customer_id = p_id);
  update public.quotes set notes_customer = '', notes_internal = '' where customer_id = p_id;
  perform app.audit('customer.anonymize', 'customer:' || p_id, '{}'::jsonb);
end $$;

-- ── quotes ─────────────────────────────────────────────────────────────────
create or replace function public.create_quote(p_enquiry uuid, p_customer uuid, p_product text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','support'); e public.enquiries; cid uuid; prod jsonb; qid uuid;
begin
  if p_enquiry is not null then select * into e from public.enquiries where id = p_enquiry; end if;
  cid := coalesce(p_customer, e.customer_id);
  if cid is null then raise exception 'a quote needs a customer'; end if;
  select d.published into prod from public.content_docs d where d.key = 'product:' || coalesce(p_product, e.product_key);
  insert into public.quotes (number, customer_id, enquiry_id, title, product_snapshot, spec_snapshot, created_by)
  values ('Q-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quote_number_seq')::text, 4, '0'), cid, p_enquiry,
          coalesce(prod ->> 'plain', e.want, ''), app.public_fields(prod), e.spec, me)
  returning id into qid;
  if p_enquiry is not null then update public.enquiries set status = 'quoted', updated_at = now() where id = p_enquiry and status in ('new','contacted'); end if;
  perform app.audit('quote.create', 'quote:' || qid, jsonb_build_object('enquiry', p_enquiry));
  return qid;
end $$;

create or replace function public.update_quote(p_id uuid, p_expected_rev integer, p jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare me uuid := app.require('owner','support'); q public.quotes; nrev integer;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'no such quote'; end if;
  if q.rev <> p_expected_rev then raise exception 'conflict: this quote was changed by someone else; reload' using errcode = '40001'; end if;
  if q.status not in ('draft') and (p ? 'amount_minor' or p ? 'currency' or p ? 'spec_snapshot') then
    raise exception 'a quote that has been sent is not edited: withdraw it and make a new one'; end if;
  if p ? 'currency' and (p ->> 'currency') not in ('ILS','AED','USD','EUR') then raise exception 'unsupported currency'; end if;
  if p ? 'status' and (p ->> 'status') not in ('draft','sent','accepted','declined','expired','withdrawn') then raise exception 'unknown status'; end if;
  update public.quotes set
    title = coalesce(left(p ->> 'title', 200), title),
    amount_minor = case when p ? 'amount_minor' then nullif(p ->> 'amount_minor', '')::bigint else amount_minor end,
    currency = coalesce(p ->> 'currency', currency),
    valid_until = case when p ? 'valid_until' then nullif(p ->> 'valid_until', '')::date else valid_until end,
    spec_snapshot = case when p ? 'spec_snapshot' then p -> 'spec_snapshot' else spec_snapshot end,
    notes_customer = coalesce(left(p ->> 'notes_customer', 5000), notes_customer),
    notes_internal = coalesce(left(p ->> 'notes_internal', 5000), notes_internal),
    status = coalesce(p ->> 'status', status),
    sent_at = case when p ->> 'status' = 'sent' and q.status <> 'sent' then now() else sent_at end,
    rev = rev + 1, updated_at = now()
  where id = p_id returning rev into nrev;
  perform app.audit('quote.update', 'quote:' || p_id, jsonb_build_object('fields', (select jsonb_agg(k) from jsonb_object_keys(p) k where k <> 'notes_internal' and k <> 'notes_customer'),
    'status', p ->> 'status'));
  return nrev;
end $$;

grant execute on function public.update_enquiry(uuid, public.enquiry_status, uuid, timestamptz, text[]), public.merge_customers(uuid, uuid),
  public.anonymize_customer(uuid), public.create_quote(uuid, uuid, text), public.update_quote(uuid, integer, jsonb) to authenticated;
