// Quotes: what was offered to whom, for how much, until when. The piece and
// the design are copied into the quote when it is made, so later changes to
// the product never change a quote. Once sent, the amount is fixed: a new
// offer is a new quote. The customer's copy never shows internal notes.
import { useState } from "preact/hooks";
import { sb, rpc, q, message, SITE } from "../lib/sb.js";
import { t, getLang } from "../lib/i18n.js";
import { when, day } from "../lib/time.js";
import { href, go } from "../lib/router.js";
import { Button, Input, TextArea, Select, Pill, PageHead, Load, useLoad, toast, ask, Empty } from "../lib/ui.jsx";
import { SpecView } from "./Enquiries.jsx";
import { formatMoney } from "../../../site/src/content/money.mjs";
import { safeInline } from "../../../site/src/content/apply.mjs";

const CURS = ["ILS", "AED", "USD", "EUR"];
const QST = ["draft", "sent", "accepted", "declined", "expired", "withdrawn"];
const money = (m, c) => m == null ? "–" : (formatMoney(Number(m), c) || {}).en;
const plain = (h) => String(h || "").replace(/<[^>]+>/g, "");

export function Quotes() {
  const [st, setSt] = useState("");
  const s = useLoad(async () => { let b = sb.from("quotes").select("id,number,status,title,amount_minor,currency,valid_until,created_at,customer_id").order("created_at", { ascending: false }).limit(200); if (st) b = b.eq("status", st); const rows = await q(b);
    const ids = [...new Set(rows.map(r => r.customer_id).filter(Boolean))]; const cs = ids.length ? await q(sb.from("customers").select("id,name").in("id", ids)) : [];
    return rows.map(r => ({ ...r, customer: (cs.find(c => c.id === r.customer_id) || {}).name })); }, [st]);
  return <>
    <PageHead title={t("Quotes")} sub={t("Quotes are made from an enquiry. Each keeps a copy of the piece and the design as they were.")} />
    <div class="filters"><label class="fld"><span>{t("Status")}</span><select value={st} onChange={(e) => setSt(e.target.value)}><option value="">{t("All")}</option>{QST.map(x => <option value={x}>{t(x)}</option>)}</select></label></div>
    <Load s={s}>{(rows) => rows.length ? <table class="tbl"><thead><tr><th>{t("Number")}</th><th>{t("Customer")}</th><th>{t("For")}</th><th>{t("Amount")}</th><th>{t("Valid until")}</th><th>{t("Status")}</th></tr></thead><tbody>
      {rows.map(r => <tr class="click" onClick={() => go("quotes/" + r.id)}><td><a href={href("quotes/" + r.id)}>{r.number}</a></td><td>{r.customer}</td><td>{plain(r.title)}</td><td>{money(r.amount_minor, r.currency)}</td><td>{day(r.valid_until)}</td><td><Pill tone={r.status === "accepted" ? "ok" : r.status === "sent" ? "info" : ""}>{t(r.status)}</Pill></td></tr>)}
    </tbody></table> : <Empty title={t("No quotes yet.")}>{t("Open an enquiry and choose \"Make a quote\".")}</Empty>}</Load>
  </>;
}

export function QuoteEdit({ id }) {
  const s = useLoad(async () => { const r = await q(sb.from("quotes").select("*").eq("id", id).maybeSingle()); if (!r) return null; const c = r.customer_id ? await q(sb.from("customers").select("id,name,email,phone").eq("id", r.customer_id).maybeSingle()) : null; return { r, c, edit: { title: plain(r.title), amount: r.amount_minor != null ? Number(r.amount_minor) / 100 : null, currency: r.currency, valid_until: r.valid_until || "", notes_customer: r.notes_customer, notes_internal: r.notes_internal } }; }, [id]);
  const [busy, setBusy] = useState(false);
  return <Load s={s} empty={(d) => !d}>{({ r, c, edit }) => {
    const set = (k, v) => s.set({ r, c, edit: { ...edit, [k]: v } });
    const locked = r.status !== "draft";
    const save = async (extra = {}) => {
      setBusy(true);
      try {
        const patch = { title: edit.title, notes_customer: edit.notes_customer, notes_internal: edit.notes_internal, ...extra };
        if (!locked) Object.assign(patch, { amount_minor: edit.amount == null ? "" : Math.round(edit.amount * 100), currency: edit.currency, valid_until: edit.valid_until || "" });
        await rpc("update_quote", { p_id: id, p_expected_rev: r.rev, p: patch }); toast(t("Saved.")); s.reload();
      } catch (e) { toast(/conflict/i.test(message(e)) ? t("Someone else changed this quote. Reload to see their version.") : message(e), "bad"); }
      setBusy(false);
    };
    const markSent = async () => {
      if (edit.amount == null || !edit.valid_until) return toast(t("A quote needs an amount and a date it is valid until."), "bad");
      if (!(await ask(t("Mark as sent?"), t("The amount and the specification are then fixed. Send the customer's copy yourself (print it to PDF or open the email below); nothing is sent automatically."), t("Mark as sent")))) return;
      await save({ status: "sent" });
    };
    const p = r.product_snapshot, total = money(edit.amount == null ? null : edit.amount * 100, edit.currency);
    const mail = c && c.email ? `mailto:${c.email}?subject=${encodeURIComponent("SILAVU · " + r.number)}&body=${encodeURIComponent(`${c.name},\n\n${edit.title}: ${total}${edit.valid_until ? " (valid until " + day(edit.valid_until) + ")" : ""}.\n\n${edit.notes_customer || ""}\n\nSILAVU`)}` : null;
    return <>
      <PageHead title={r.number} crumbs={[[t("Quotes"), href("quotes")], [r.number]]} sub={c ? t("For {n}", { n: c.name }) : ""}>
        <a class="b" href={href("print/" + id)} target="_blank" rel="noopener">{t("Customer's copy")}</a>
        {r.status === "draft" && <Button kind="primary" onClick={markSent}>{t("Mark as sent")}</Button>}
      </PageHead>
      {locked && <div class="notice">{t("This quote was sent on {d}. Its amount and specification are fixed; to offer something else, withdraw it and make a new one.", { d: when(r.sent_at) })}</div>}
      <div class="grid2">
        <section class="card form">
          <Input label={t("What it is for")} value={edit.title} onInput={(v) => set("title", v)} />
          <div class="grid3"><Input type="number" min="0" label={t("Amount")} value={edit.amount} onInput={(v) => set("amount", v)} disabled={locked} hint={total} />
            <Select label={t("Currency")} value={edit.currency} onChange={(v) => set("currency", v)} options={CURS.map(x => ({ value: x, label: x }))} disabled={locked} />
            <Input type="date" label={t("Valid until")} value={edit.valid_until} onInput={(v) => set("valid_until", v)} disabled={locked} /></div>
          <TextArea label={t("Note to the customer (on their copy)")} value={edit.notes_customer} onInput={(v) => set("notes_customer", v)} />
          <TextArea label={t("Internal note (never on their copy)")} value={edit.notes_internal} onInput={(v) => set("notes_internal", v)} />
          <Select label={t("Status")} value={r.status} onChange={(v) => save({ status: v })} options={QST.map(x => ({ value: x, label: t(x) }))} />
          <Button kind="primary" busy={busy} onClick={() => save()}>{t("Save")}</Button>
          {mail && <a class="b" href={mail}>{t("Open an email to {n}", { n: c.name })}</a>}
        </section>
        <section class="card">
          <h2>{t("As quoted")}</h2>
          {p ? <><p><strong dangerouslySetInnerHTML={{ __html: safeInline((p.name && p.name.en) || p.plain) }} /> <span class="hint">{p.ref}</span></p>{p.specs && <dl class="meta">{p.specs.filter(x => x[0].en !== "Price").map(x => <><dt>{x[0].en}</dt><dd dangerouslySetInnerHTML={{ __html: safeInline(x[1].en) }} /></>)}</dl>}</> : <p class="hint">{t("No piece from the collection.")}</p>}
          {r.spec_snapshot && <><h3>{t("Their design (The Line)")}</h3><SpecView spec={r.spec_snapshot} /></>}
          <p class="hint">{t("Copied when the quote was made on {d}; later product changes do not affect it.", { d: when(r.created_at) })}</p>
        </section>
      </div>
    </>;
  }}</Load>;
}

/* the customer's copy: what was offered, nothing internal; print it to PDF */
export function QuotePrint({ id }) {
  const s = useLoad(async () => { const r = await q(sb.from("quotes").select("number,title,amount_minor,currency,valid_until,notes_customer,product_snapshot,spec_snapshot,created_at,customer_id,status").eq("id", id).maybeSingle()); const c = r && r.customer_id ? await q(sb.from("customers").select("name,city").eq("id", r.customer_id).maybeSingle()) : null; return r && { r, c }; }, [id]);
  return <Load s={s} empty={(d) => !d}>{({ r, c }) => <div class="print">
    <div class="noprint row"><Button kind="primary" onClick={() => print()}>{t("Print or save as PDF")}</Button></div>
    <header><div class="brand big">SILAVU</div><div>{r.number}<br />{day(r.created_at)}</div></header>
    {c && <p>{c.name}{c.city ? ", " + c.city : ""}</p>}
    <h1>{plain(r.title)}</h1>
    {r.product_snapshot && <><p class="hint">{r.product_snapshot.ref}</p><dl class="meta">{(r.product_snapshot.specs || []).filter(x => x[0].en !== "Price" && x[0].en !== "Reference").map(x => <><dt>{x[0].en}</dt><dd dangerouslySetInnerHTML={{ __html: safeInline(x[1].en) }} /></>)}</dl></>}
    {r.spec_snapshot && <SpecView spec={r.spec_snapshot} />}
    <p class="amount">{money(r.amount_minor, r.currency)}</p>
    {r.valid_until && <p>{t("Valid until {d}.", { d: day(r.valid_until) })}</p>}
    {r.notes_customer && <p class="pre">{r.notes_customer}</p>}
    <footer>SILAVU · concierge · {SITE.replace(/^https?:\/\//, "").replace(/\/$/, "")}</footer>
  </div>}</Load>;
}
