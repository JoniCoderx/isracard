// Customers: people who wrote to the house, with only what they supplied.
// A person is matched to an earlier enquiry only by the same email address or
// phone number they gave; anonymous browsing is never joined to anyone.
import { useState } from "preact/hooks";
import { sb, rpc, q, message } from "../lib/sb.js";
import { t } from "../lib/i18n.js";
import { when, day } from "../lib/time.js";
import { href, go } from "../lib/router.js";
import { Button, Input, TextArea, Select, Toggle, Pill, PageHead, Load, useLoad, Modal, toast, ask, Empty } from "../lib/ui.jsx";

const csvCell = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export function downloadCsv(name, rows) {
  const keys = Object.keys(rows[0] || {}); const csv = "﻿" + [keys.join(","), ...rows.map(r => keys.map(k => csvCell(Array.isArray(r[k]) ? r[k].join("; ") : r[k])).join(","))].join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function Customers({ role }) {
  const [search, setSearch] = useState(""), [tag, setTag] = useState(""), [life, setLife] = useState("");
  const s = useLoad(async () => {
    let b = sb.from("customers").select("*").is("merged_into", null).order("updated_at", { ascending: false }).limit(200);
    if (search) { const x = search.replace(/[,()*]/g, " ").trim(); b = b.or(`name.ilike.*${x}*,email.ilike.*${x}*,phone.ilike.*${x}*,city.ilike.*${x}*`); }
    if (tag) b = b.contains("tags", [tag]); if (life) b = b.eq("lifecycle", life);
    return q(b);
  }, [search, tag, life]);
  return <>
    <PageHead title={t("Customers")} sub={t("Only details people gave through the site or that the team entered. Marketing permission is separate from answering an enquiry.")}>
      {role === "owner" && <Button onClick={() => s.data && downloadCsv("silavu-customers.csv", s.data.filter(c => !c.anonymized_at).map(c => ({ name: c.name, email: c.email, phone: c.phone, city: c.city, lifecycle: c.lifecycle, tags: c.tags, marketing: c.consent_marketing ? "yes" : "no", created: c.created_at })))}>{t("Export CSV")}</Button>}
    </PageHead>
    <div class="filters"><Input label={t("Search")} value={search} onInput={setSearch} /><Input label={t("Tag")} value={tag} onInput={setTag} />
      <label class="fld"><span>{t("Stage")}</span><select value={life} onChange={(e) => setLife(e.target.value)}><option value="">{t("All")}</option>{["lead", "client", "past_client", "closed"].map(x => <option value={x}>{t(x)}</option>)}</select></label></div>
    <Load s={s}>{(rows) => rows.length ? <table class="tbl"><thead><tr><th>{t("Name")}</th><th>{t("Contact")}</th><th>{t("City")}</th><th>{t("Stage")}</th><th>{t("Tags")}</th><th>{t("Marketing")}</th></tr></thead><tbody>
      {rows.map(c => <tr class="click" onClick={() => go("customers/" + c.id)}><td><a href={href("customers/" + c.id)}>{c.name}</a>{c.anonymized_at && <Pill>{t("anonymized")}</Pill>}</td><td>{c.email || c.phone || "–"}</td><td>{c.city}</td><td>{t(c.lifecycle)}</td><td>{(c.tags || []).map(x => <Pill>{x}</Pill>)}</td><td>{c.consent_marketing ? <Pill tone="ok">{t("yes")}</Pill> : <Pill>{t("no")}</Pill>}</td></tr>)}
    </tbody></table> : <Empty title={t("No customers match.")} />}</Load>
  </>;
}

export function CustomerView({ id, role }) {
  const s = useLoad(async () => {
    const c = await q(sb.from("customers").select("*").eq("id", id).maybeSingle()); if (!c) return null;
    const [enq, quotes] = await Promise.all([q(sb.from("enquiries").select("id,ref,created_at,want,product_name,status").eq("customer_id", id).order("created_at", { ascending: false })), q(sb.from("quotes").select("id,number,status,created_at").eq("customer_id", id).order("created_at", { ascending: false }))]);
    return { c, enq, quotes };
  }, [id]);
  const [busy, setBusy] = useState(false), [merge, setMerge] = useState(false);
  return <Load s={s} empty={(d) => !d}>{({ c, enq, quotes }) => {
    const set = (k, v) => s.set({ c: { ...c, [k]: v }, enq, quotes });
    const save = async () => { setBusy(true); try { await q(sb.from("customers").update({ name: c.name, email: c.email || null, phone: c.phone || null, city: c.city, preferred_channel: c.preferred_channel, lifecycle: c.lifecycle, tags: c.tags, notes: c.notes, consent_marketing: c.consent_marketing, consent_marketing_at: c.consent_marketing ? (c.consent_marketing_at || new Date().toISOString()) : null, updated_at: new Date().toISOString() }).eq("id", id)); toast(t("Saved.")); } catch (e) { toast(message(e), "bad"); } setBusy(false); };
    const forget = async () => { if (!(await ask(t("Anonymize this person?"), t("Their name, contact details, messages and notes are erased from every enquiry and quote. Counts and amounts stay. This cannot be undone."), t("Anonymize"), true))) return; try { await rpc("anonymize_customer", { p_id: id }); toast(t("Done.")); s.reload(); } catch (e) { toast(message(e), "bad"); } };
    if (c.merged_into) return <div class="notice">{t("This record was merged.")} <a href={href("customers/" + c.merged_into)}>{t("Open the record it was merged into")}</a></div>;
    return <>
      <PageHead title={c.name} crumbs={[[t("Customers"), href("customers")], [c.name]]} sub={t("First wrote {d}", { d: day(c.created_at) })}>
        <Button onClick={() => setMerge(true)}>{t("Merge with another record…")}</Button>
        {role === "owner" && !c.anonymized_at && <Button kind="danger" onClick={forget}>{t("Anonymize")}</Button>}
      </PageHead>
      <div class="grid2">
        <section class="card form">
          <Input label={t("Name")} value={c.name} onInput={(v) => set("name", v)} />
          <div class="grid2"><Input label={t("Email")} type="email" value={c.email} onInput={(v) => set("email", v)} /><Input label={t("Phone")} value={c.phone} onInput={(v) => set("phone", v)} /></div>
          <div class="grid2"><Input label={t("City")} value={c.city} onInput={(v) => set("city", v)} />
            <Select label={t("Prefers")} value={c.preferred_channel} onChange={(v) => set("preferred_channel", v)} options={[["", t("No preference")], ["email", t("Email")], ["whatsapp", "WhatsApp"], ["phone", t("Phone")]].map(([value, label]) => ({ value, label }))} /></div>
          <div class="grid2"><Select label={t("Stage")} value={c.lifecycle} onChange={(v) => set("lifecycle", v)} options={["lead", "client", "past_client", "closed"].map(x => ({ value: x, label: t(x) }))} />
            <Input label={t("Tags (comma separated)")} value={(c.tags || []).join(", ")} onInput={(v) => set("tags", v.split(",").map(x => x.trim()).filter(Boolean))} /></div>
          <Toggle label={t("Agreed to receive news from SILAVU")} checked={c.consent_marketing} onChange={(v) => set("consent_marketing", v)} hint={c.consent_marketing_at ? t("Since {d}", { d: day(c.consent_marketing_at) }) : t("Only tick this if they asked for it.")} />
          <TextArea label={t("Notes")} value={c.notes} onInput={(v) => set("notes", v)} />
          <Button kind="primary" busy={busy} onClick={save}>{t("Save")}</Button>
        </section>
        <section class="card">
          <h2>{t("Enquiries")}</h2>{enq.length ? <ul class="plain">{enq.map(e => <li><a href={href("enquiries/" + e.id)}>{e.ref}</a> {when(e.created_at)} · {e.product_name || t(e.want)} <Pill>{t(e.status)}</Pill></li>)}</ul> : <p class="hint">{t("None.")}</p>}
          <h2>{t("Quotes")}</h2>{quotes.length ? <ul class="plain">{quotes.map(x => <li><a href={href("quotes/" + x.id)}>{x.number}</a> <Pill>{t(x.status)}</Pill></li>)}</ul> : <p class="hint">{t("None.")}</p>}
        </section>
      </div>
      {merge && <Merge keep={c} onClose={() => { setMerge(false); s.reload(); }} />}
    </>;
  }}</Load>;
}

function Merge({ keep, onClose }) {
  const [search, setSearch] = useState(""), [pick, setPick] = useState(null), [busy, setBusy] = useState(false);
  const s = useLoad(async () => search.length < 2 ? [] : q(sb.from("customers").select("id,name,email,phone,created_at").is("merged_into", null).neq("id", keep.id).or(`name.ilike.*${search.replace(/[,()*]/g, " ")}*,email.ilike.*${search.replace(/[,()*]/g, " ")}*,phone.ilike.*${search.replace(/[,()*]/g, " ")}*`).limit(20)), [search]);
  return <Modal title={t("Merge two records")} onClose={onClose} actions={<><Button onClick={onClose}>{t("Cancel")}</Button><Button kind="primary" busy={busy} disabled={!pick} onClick={async () => { setBusy(true); try { await rpc("merge_customers", { p_keep: keep.id, p_drop: pick.id }); toast(t("Merged.")); onClose(); } catch (e) { toast(message(e), "bad"); setBusy(false); } }}>{t("Merge into {n}", { n: keep.name })}</Button></>}>
    <p class="hint">{t("Use this only when both records are the same person. Their enquiries and quotes move to this record; details missing here are taken from the other.")}</p>
    <Input label={t("Find the other record")} value={search} onInput={setSearch} />
    <Load s={s}>{(rows) => <ul class="plain">{rows.map(r => <li><label><input type="radio" name="m" checked={pick && pick.id === r.id} onChange={() => setPick(r)} /> {r.name} · {r.email || r.phone} · {day(r.created_at)}</label></li>)}</ul>}</Load>
  </Modal>;
}
