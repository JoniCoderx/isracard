-- SILAVU administration · 6 · least privilege
--
-- Supabase grants every new public table to the API roles and leaves the
-- decision to row-level security. Here the grants themselves are narrowed too,
-- so a missing policy can never become an open door: the public (anon) role
-- has no table access at all (the storefront is static and its two endpoints
-- are functions), and signed-in staff can only write where a policy says so.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon, public;

revoke all on all tables in schema public from authenticated;
grant select on public.staff, public.audit_log, public.content_docs, public.content_revisions, public.releases,
  public.media_assets, public.customers, public.enquiries, public.enquiry_notes, public.quotes to authenticated;
grant select, insert, update, delete on public.product_private to authenticated;
grant update (title, alt, caption, folder, tags, focal_x, focal_y) on public.media_assets to authenticated;
grant insert, update on public.customers to authenticated;
grant update (name, email, phone, city, preferred_channel, lifecycle, tags, notes, consent_marketing, consent_marketing_at, updated_at) on public.customers to authenticated;
grant insert on public.enquiry_notes to authenticated;
-- analytics_events: no grant at all; reports come from the functions

-- the functions the admin calls (each checks the role itself)
grant execute on function
  public.my_staff(), public.update_my_name(text), public.set_staff_role(uuid, public.staff_role), public.revoke_staff(uuid), public.set_staff_mfa(uuid, boolean),
  public.save_draft(text, text, text, jsonb, integer, boolean), public.set_doc_order(text[]), public.archive_doc(text, boolean), public.delete_doc(text),
  public.restore_revision(bigint), public.publish_docs(text[], text), public.republish_release(bigint, text),
  public.register_media(text, text, text, bigint, integer, integer, text, text, text, text[]), public.media_usage(uuid), public.delete_media(uuid), public.replace_media(uuid, uuid),
  public.update_enquiry(uuid, public.enquiry_status, uuid, timestamptz, text[]), public.merge_customers(uuid, uuid), public.anonymize_customer(uuid),
  public.create_quote(uuid, uuid, text), public.update_quote(uuid, integer, jsonb),
  public.analytics_overview(timestamptz, timestamptz, jsonb), public.analytics_series(timestamptz, timestamptz, jsonb),
  public.analytics_breakdown(timestamptz, timestamptz, text, jsonb, integer), public.analytics_funnel(timestamptz, timestamptz, text[], jsonb)
to authenticated;

-- future tables start closed to the public role
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from anon, public;
