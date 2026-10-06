// The house's details and the site's switches. Contact details here are the
// ones every page shows; the email address replaces the house address
// wherever the site names it.
import { useState } from "preact/hooks";
import { message } from "../lib/sb.js";
import { t } from "../lib/i18n.js";
import { useDoc } from "../lib/doc.js";
import { Input, Select, Toggle, Bi, PageHead } from "../lib/ui.jsx";
import { SaveBar } from "./Products.jsx";
import { Preview } from "./PreviewFrame.jsx";
import { safeHref } from "../../../site/src/content/apply.mjs";

const EMAIL = /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}$/;
export function Settings({ role }) {
  const d = useDoc("settings", "settings", { title: "Site settings" });
  const [prev, setPrev] = useState(false);
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error) return <p class="err">{message(d.error)}</p>;
  const s = d.data, set = (k, v) => d.setData({ ...s, [k]: v });
  const sub = (k, f, v) => set(k, { ...(s[k] || {}), [f]: v });
  const url = (v) => v && !/^https:\/\/[^\s"'<>\\]+$/.test(v) ? t("A full address starting with https://") : "";
  return <>
    <PageHead title={t("Settings")} />
    <section class="card form"><h2>{t("Contact")}</h2>
      <Input label={t("The house's email address")} type="email" value={s.contact.email} onInput={(v) => sub("contact", "email", v)} error={s.contact.email && !EMAIL.test(s.contact.email) ? t("This does not look like an email address.") : ""} hint={t("Shown on every page and used for \"write to us\" links.")} />
      <div class="grid2"><Input label={t("WhatsApp number")} value={s.contact.whatsapp} onInput={(v) => sub("contact", "whatsapp", v)} hint={t("With the country code, e.g. +972 50 000 0000. Empty: no WhatsApp option.")} />
        <Input label={t("Phone number")} value={s.contact.phone} onInput={(v) => sub("contact", "phone", v)} hint={t("Empty: no call option.")} /></div>
      <Input label={t("Inbox for enquiries (when the backend is not used)")} type="email" value={s.enquiry.inbox} onInput={(v) => sub("enquiry", "inbox", v)} hint={t("With the backend connected, enquiries are saved here in the admin and the house is emailed through the mail settings in ADMIN_SETUP.md.")} />
    </section>
    <section class="card form"><h2>{t("Social accounts")}</h2>
      <p class="hint">{t("Only accounts the house has confirmed. An empty address shows nothing and claims nothing.")}</p>
      {[["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["pinterest", "Pinterest"]].map(([k, n]) => <Input label={n} value={s.socials[k]} onInput={(v) => sub("socials", k, v)} error={url(s.socials[k])} placeholder="https://" />)}
    </section>
    <section class="card form"><h2>{t("Announcement")}</h2>
      <Toggle label={t("Show a short announcement on the home page")} checked={!!s.announcement.enabled} onChange={(v) => sub("announcement", "enabled", v)} hint={t("A small bar at the foot of the screen that visitors can close.")} />
      {s.announcement.enabled && <><Bi label={t("Words")} value={s.announcement.text} onInput={(v) => sub("announcement", "text", v)} required />
        <Input label={t("Goes to (optional)")} value={s.announcement.href} onInput={(v) => sub("announcement", "href", v)} error={s.announcement.href && !safeHref(s.announcement.href) ? t("Use a page on this site (like about/ or #concierge), or a full https:// address.") : ""} /></>}
    </section>
    <section class="card form"><h2>{t("Features")}</h2>
      <Toggle label={t("\"See it on your wrist\" with your own photograph")} checked={s.features.tryon !== false} onChange={(v) => sub("features", "tryon", v)} hint={t("The photograph never leaves the visitor's device.")} />
    </section>
    <section class="card form"><h2>{t("Visit counting")}</h2>
      {role === "owner" ? <>
        <Select label={t("How visits are counted")} value={s.analytics.mode} onChange={(v) => sub("analytics", "mode", v)} options={[
          { value: "consent", label: t("Only after the visitor allows it (recommended)") },
          { value: "cookieless", label: t("Anonymously without storing anything; allowing adds return visits") },
          { value: "off", label: t("Not at all") }]} hint={t("The privacy page changes its wording to match when you publish.")} />
        <Input type="number" min="30" label={t("Keep visit records for (days)")} value={s.analytics.retentionDays} onInput={(v) => sub("analytics", "retentionDays", v)} />
      </> : <p class="hint">{t("Only the owner changes how visits are counted.")}</p>}
    </section>
    <SaveBar d={d} onPreview={() => setPrev(true)} />
    {prev && <Preview onClose={() => setPrev(false)} build={() => ({ kind: "home", settings: s })} />}
  </>;
}
