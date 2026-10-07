// Enquiries: every request saved from the site, worked from New to Won or
// Closed. A WhatsApp, email or phone click on the site is counted in
// Analytics, never shown here as if it were a message: only what reached the
// database is an enquiry.
import { useState } from "preact/hooks";
import { sb, rpc, q, message } from "../lib/sb.js";
import { t, getLang } from "../lib/i18n.js";
import { when, ago } from "../lib/time.js";
import { href, go } from "../lib/router.js";
import { Button, Input, TextArea, Select, Pill, PageHead, Load, useLoad, toast, Empty } from "../lib/ui.jsx";

export const STATUSES = ["new", "contacted", "quoted", "follow_up", "won", "closed"];
const tone = { new: "warn", contacted: "info", quoted: "info", follow_up: "warn", won: "ok", closed: "" };
const CUT = { round: "Round", oval: "Oval", cushion: "Cushion", princess: "Princess", emerald: "Emerald", marquise: "Marquise", pear: "Pear", baguette: "Baguette" };

export function SpecView({ spec }) {
  if (!spec) return null;
  return <dl class="meta">{spec.cut && <><dt>{t("Shape")}</dt><dd>{t(CUT[spec.cut] || spec.cut)}</dd></>}{spec.ct != null && <><dt>{t("Carats")}</dt><dd>{spec.ct} ct</dd></>}
    {spec.origin && <><dt>{t("Diamonds")}</dt><dd>{spec.origin === "lab" ? t("Lab-grown") : t("Natural")}</dd></>}{spec.metal && <><dt>{t("Metal")}</dt><dd>{t(spec.metal)}</dd></>}{spec.wrist && <><dt>{t("Wrist")}</dt><dd>{spec.wrist} cm</dd></>}</dl>;
}

export function Enquiries({ query }) {
  const [status, setStatus] = useState(query.get("status") || "open"), [search, setSearch] = useState(""), [page, setPage] = useState(0);
  const staff = useLoad(() => q(sb.from("staff").select("user_id,display_name,email,role").eq("active", true)));
  const [mine, setMine] = useState(false);
  const s = useLoad(async () => {
    let b = sb.from("enquiries").select("id,ref,created_at,name,email,phone,city,channel,want,product_name,status,assignee,due_at,notify_status,lang,flagged", { count: "exact" }).order("created_at", { ascending: false }).range(page * 50, page * 50 + 49);
    if (status === "open") b = b.in("status", ["new", "contacted", "quoted", "follow_up"]); else if (status === "flagged") b = b.eq("flagged", true); else if (status !== "all") b = b.eq("status", status);
    if (search) { const x = search.replace(/[,()*]/g, " ").trim(); b = b.or(`name.ilike.*${x}*,email.ilike.*${x}*,phone.ilike.*${x}*,ref.ilike.*${x}*,city.ilike.*${x}*`); }
    if (mine) { const { data } = await sb.auth.getUser(); b = b.eq("assignee", data.user.id); }
    return q(b);
  }, [status, search, page, mine]);
  const who = (id) => { const p = (staff.data || []).find(x => x.user_id === id); return p ? (p.display_name || p.email) : ""; };
  return <>
    <PageHead title={t("Enquiries")} sub={t("Only enquiries the site saved are here. Clicks on WhatsApp, email or phone are counted in Analytics; they are not messages.")} />
    <div class="filters">
      <label class="fld"><span>{t("Status")}</span><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}><option value="open">{t("Open")}</option><option value="all">{t("All")}</option>{STATUSES.map(x => <option value={x}>{t(x)}</option>)}<option value="flagged">{t("Offensive words")}</option></select></label>
      <Input label={t("Search name, email, phone, reference, city")} value={search} onInput={(v) => { setSearch(v); setPage(0); }} />
      <label class="chk"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> {t("Assigned to me")}</label>
    </div>
    <Load s={s}>{(r) => r.data.length ? <>
      <table class="tbl"><thead><tr><th>{t("When")}</th><th>{t("Ref.")}</th><th>{t("Who")}</th><th>{t("About")}</th><th>{t("Answer by")}</th><th>{t("Status")}</th><th>{t("Assigned")}</th></tr></thead><tbody>
        {r.data.map(e => <tr class="click" onClick={() => go("enquiries/" + e.id)}><td>{when(e.created_at)}</td><td><a href={href("enquiries/" + e.id)}>{e.ref}</a></td><td>{e.name}<div class="hint">{e.city}</div></td><td>{e.product_name || t(e.want) || "–"}</td><td>{t(e.channel)}</td>
          <td><Pill tone={tone[e.status]}>{t(e.status)}</Pill>{e.due_at && new Date(e.due_at) < new Date() && !["won", "closed"].includes(e.status) && <Pill tone="bad">{t("overdue")}</Pill>}{e.notify_status === "failed" && <Pill tone="bad">{t("email not sent")}</Pill>}{e.flagged && <Pill tone="bad">{t("offensive words")}</Pill>}</td><td>{who(e.assignee)}</td></tr>)}
      </tbody></table>
      <div class="pager"><Button disabled={page === 0} onClick={() => setPage(page - 1)}>← {t("Newer")}</Button><span>{t("{a}–{b} of {n}", { a: page * 50 + 1, b: page * 50 + r.data.length, n: r.count })}</span><Button disabled={(page + 1) * 50 >= r.count} onClick={() => setPage(page + 1)}>{t("Older")} →</Button></div>
    </> : <Empty title={t("No enquiries match.")} />}</Load>
  </>;
}

export function EnquiryView({ id, role, me }) {
  const s = useLoad(async () => {
    const e = await q(sb.from("enquiries").select("*").eq("id", id).maybeSingle()); if (!e) return null;
    const [notes, staff, quotes, customer] = await Promise.all([q(sb.from("enquiry_notes").select("*").eq("enquiry_id", id).order("id")), q(sb.from("staff").select("user_id,display_name,email,role").eq("active", true)),
      q(sb.from("quotes").select("id,number,status,amount_minor,currency,created_at").eq("enquiry_id", id).order("created_at")), e.customer_id ? q(sb.from("customers").select("id,name,tags,lifecycle,consent_marketing").eq("id", e.customer_id).maybeSingle()) : null]);
    return { e, notes, staff, quotes, customer };
  }, [id]);
  const [note, setNote] = useState(""), [busy, setBusy] = useState("");
  return <Load s={s} empty={(d) => !d}>{({ e, notes, staff, quotes, customer }) => {
    const update = async (patch) => { setBusy("st"); try { await rpc("update_enquiry", { p_id: id, p_status: patch.status ?? e.status, p_assignee: patch.assignee !== undefined ? patch.assignee : e.assignee, p_due: patch.due !== undefined ? patch.due : e.due_at, p_tags: patch.tags ?? e.tags }); toast(t("Saved.")); s.reload(); } catch (x) { toast(message(x), "bad"); } setBusy(""); };
    const addNote = async () => { if (!note.trim()) return; setBusy("n"); try { await q(sb.from("enquiry_notes").insert({ enquiry_id: id, body: note.trim(), author: me.user_id })); setNote(""); s.reload(); } catch (x) { toast(message(x), "bad"); } setBusy(""); };
    const quote = async () => { setBusy("q"); try { const qid = await rpc("create_quote", { p_enquiry: id, p_customer: null, p_product: null }); go("quotes/" + qid); } catch (x) { toast(message(x), "bad"); setBusy(""); } };
    const wa = (e.phone || "").replace(/[^0-9]/g, "");
    return <>
      <PageHead title={`${e.ref} · ${e.name}`} crumbs={[[t("Enquiries"), href("enquiries")], [e.ref]]} sub={t("Received {w} (Israel time) · written in {l}", { w: when(e.created_at), l: e.lang === "he" ? "עברית" : e.lang.toUpperCase() })}>
        <Button kind="primary" busy={busy === "q"} onClick={quote}>{t("Make a quote")}</Button>
      </PageHead>
      {e.flagged && <div class="notice warn">{t("This enquiry contains words that look offensive ({w}). It is kept like any other; read it with care.", { w: (e.flag_reason || "").replace(/^words: /, "") })}</div>}
      {e.notify_status === "failed" && <div class="notice bad">{t("The email to the house about this enquiry was not sent ({why}). The enquiry itself is saved here.", { why: e.notify_error || "" })}</div>}
      <div class="grid2">
        <section class="card">
          <h2>{t("Who")}</h2>
          <dl class="meta"><dt>{t("Name")}</dt><dd>{e.name}</dd><dt>{t("City")}</dt><dd>{e.city || "–"}</dd>
            <dt>{t("Email")}</dt><dd>{e.email ? <a href={"mailto:" + e.email + "?subject=" + encodeURIComponent("SILAVU · " + e.ref)}>{e.email}</a> : "–"}</dd>
            <dt>{t("Phone")}</dt><dd>{e.phone ? <><a href={"tel:" + e.phone}>{e.phone}</a>{wa && <> · <a href={"https://wa.me/" + wa} target="_blank" rel="noopener">WhatsApp</a></>}</> : "–"}</dd>
            <dt>{t("Prefers")}</dt><dd>{t(e.channel)}</dd>
            <dt>{t("Marketing")}</dt><dd>{e.consent_marketing ? t("Agreed") : t("Not agreed: reply to this enquiry only")}</dd>
            {customer && <><dt>{t("Customer")}</dt><dd><a href={href("customers/" + customer.id)}>{customer.name}</a> {(customer.tags || []).map(x => <Pill>{x}</Pill>)}</dd></>}</dl>
        </section>
        <section class="card">
          <h2>{t("What they asked")}</h2>
          <dl class="meta"><dt>{t("About")}</dt><dd>{t(e.want) || "–"}</dd>{e.product_name && <><dt>{t("Piece")}</dt><dd>{e.product_name} {e.product_ref && <span class="hint">{e.product_ref}</span>}</dd></>}</dl>
          {e.spec && <><h3>{t("Their design (The Line)")}</h3><SpecView spec={e.spec} />{e.config_rev && <p class="hint">{t("Made with configurator version {n}; kept as it was.", { n: e.config_rev })}</p>}</>}
          {e.spec_text && <p class="hint pre">{e.spec_text}</p>}
          <h3>{t("Message")}</h3><p class="pre msg">{e.message || "–"}</p>
          {(e.utm && Object.keys(e.utm).length > 0) && <p class="hint">{t("Came from")}: {Object.values(e.utm).join(" · ")}</p>}
        </section>
      </div>
      <section class="card form">
        <h2>{t("Handling")}</h2>
        <div class="grid3">
          <Select label={t("Status")} value={e.status} onChange={(v) => update({ status: v })} options={STATUSES.map(x => ({ value: x, label: t(x) }))} />
          <Select label={t("Assigned to")} value={e.assignee || ""} onChange={(v) => update({ assignee: v || null })} options={[{ value: "", label: t("Nobody") }, ...staff.filter(p => ["owner", "support"].includes(p.role)).map(p => ({ value: p.user_id, label: p.display_name || p.email }))]} />
          <Input type="date" label={t("Follow up on")} value={e.due_at ? e.due_at.slice(0, 10) : ""} onInput={(v) => update({ due: v ? new Date(v + "T09:00:00+03:00").toISOString() : null })} />
        </div>
        <Input label={t("Tags (comma separated)")} value={(e.tags || []).join(", ")} onChange={(ev) => update({ tags: ev.target.value.split(",").map(x => x.trim()).filter(Boolean) })} onInput={() => {}} />
      </section>
      <section class="card">
        <h2>{t("Notes")}</h2>
        <p class="hint">{t("For the team only. Never shown to the customer.")}</p>
        {notes.length ? <ul class="notes">{notes.map(n => <li><div class="hint">{(staff.find(p => p.user_id === n.author) || {}).display_name || t("Someone")} · {when(n.created_at)}</div><div class="pre">{n.body}</div></li>)}</ul> : <p class="hint">{t("No notes yet.")}</p>}
        <TextArea label={t("Add a note")} value={note} onInput={setNote} rows={3} />
        <Button busy={busy === "n"} onClick={addNote}>{t("Add the note")}</Button>
      </section>
      {quotes.length > 0 && <section class="card"><h2>{t("Quotes")}</h2><ul class="plain">{quotes.map(x => <li><a href={href("quotes/" + x.id)}>{x.number}</a> <Pill>{t(x.status)}</Pill></li>)}</ul></section>}
    </>;
  }}</Load>;
}
