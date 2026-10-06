// The admin's building blocks. Plain, labelled, keyboard-friendly.
import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "./i18n.js";
import { message } from "./sb.js";

let uid = 0; export const useId = (p = "f") => { const r = useRef(null); if (!r.current) r.current = p + (++uid); return r.current; };

export function Button({ kind = "", busy, children, ...p }) {
  return <button type="button" class={"b " + kind + (busy ? " busy" : "")} disabled={busy || p.disabled} aria-busy={busy ? "true" : undefined} {...p}>{children}</button>;
}

export function Field({ label, hint, error, children, id, wide }) {
  return <div class={"fld" + (error ? " bad" : "") + (wide ? " wide" : "")}>
    {label && <label for={id}>{label}</label>}
    {children}
    {error ? <div class="err" role="alert">{error}</div> : hint ? <div class="hint" id={id ? id + "-h" : undefined}>{hint}</div> : null}
  </div>;
}

export function Input({ label, hint, error, value, onInput, type = "text", wide, ...p }) {
  const id = useId();
  return <Field label={label} hint={hint} error={error} id={id} wide={wide}>
    <input id={id} type={type} value={value ?? ""} onInput={(e) => onInput(type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} aria-describedby={hint ? id + "-h" : undefined} {...p} />
  </Field>;
}
export function TextArea({ label, hint, error, value, onInput, rows = 4, wide, ...p }) {
  const id = useId();
  return <Field label={label} hint={hint} error={error} id={id} wide={wide}>
    <textarea id={id} rows={rows} value={value ?? ""} onInput={(e) => onInput(e.target.value)} {...p} />
  </Field>;
}
export function Select({ label, hint, value, onChange, options, wide, ...p }) {
  const id = useId();
  return <Field label={label} hint={hint} id={id} wide={wide}>
    <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...p}>
      {options.map(o => <option value={o.value}>{o.label}</option>)}
    </select>
  </Field>;
}
export function Toggle({ label, hint, checked, onChange, disabled }) {
  const id = useId();
  return <div class="tgl"><input id={id} type="checkbox" role="switch" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <label for={id}><span class="sw" aria-hidden="true"></span>{label}</label>{hint && <div class="hint">{hint}</div>}</div>;
}

/* a pair of texts, English and Hebrew; Hebrew is typed right to left */
export function Bi({ label, hint, value, onInput, multiline, rows = 3, required, wide = true }) {
  const v = value || { en: "", he: "" }, ide = useId(), idh = useId();
  const set = (k, x) => onInput({ ...v, [k]: x });
  const El = multiline ? "textarea" : "input";
  const miss = (k) => required && !(v[k] || "").trim();
  return <fieldset class={"bi" + (wide ? " wide" : "")}>
    <legend>{label}</legend>
    <div class="bipair">
      <div class={"fld" + (miss("en") ? " bad" : "")}><label for={ide}>English</label><El id={ide} dir="ltr" lang="en" rows={rows} value={v.en || ""} onInput={(e) => set("en", e.target.value)} />{miss("en") && <div class="err">{t("Required")}</div>}</div>
      <div class={"fld" + (miss("he") ? " bad" : "")}><label for={idh}>עברית</label><El id={idh} dir="rtl" lang="he" rows={rows} value={v.he || ""} onInput={(e) => set("he", e.target.value)} />{miss("he") ? <div class="err">{t("Required")}</div> : !(v.he || "").trim() && (v.en || "").trim() ? <div class="hint warnx">{t("No Hebrew yet: the Hebrew page will show nothing here")}</div> : null}</div>
    </div>
    {hint && <div class="hint">{hint}</div>}
  </fieldset>;
}

export function Pill({ tone = "", children }) { return <span class={"pill " + tone}>{children}</span>; }

export function PageHead({ title, crumbs, children, sub }) {
  return <header class="ph">
    {crumbs && <nav class="crumbs" aria-label={t("Breadcrumbs")}>{crumbs.map((c, i) => <span>{c[1] ? <a href={c[1]}>{c[0]}</a> : c[0]}{i < crumbs.length - 1 && <i aria-hidden="true"> / </i>}</span>)}</nav>}
    <div class="phrow"><h1>{title}</h1><div class="phact">{children}</div></div>
    {sub && <p class="phsub">{sub}</p>}
  </header>;
}

export function Loading({ label }) { return <div class="state" role="status"><span class="spin" aria-hidden="true"></span>{label || t("Loading…")}</div>; }
export function Empty({ title, children }) { return <div class="state empty"><strong>{title}</strong>{children && <div>{children}</div>}</div>; }
export function ErrorBox({ error, retry }) {
  return <div class="state bad" role="alert"><strong>{t("Could not load this.")}</strong><div>{message(error)}</div>{retry && <Button onClick={retry}>{t("Try again")}</Button>}</div>;
}

/* loads, shows loading / error with retry / the content; reload() to refresh */
export function useLoad(fnc, deps = []) {
  const [s, set] = useState({ loading: true, error: null, data: null });
  const run = async () => { set(x => ({ ...x, loading: true, error: null })); try { set({ loading: false, error: null, data: await fnc() }); } catch (e) { set({ loading: false, error: e, data: null }); } };
  useEffect(() => { run(); }, deps);
  return { ...s, reload: run, set: (data) => set(x => ({ ...x, data })) };
}
export function Load({ s, children, empty }) {
  if (s.loading && !s.data) return <Loading />;
  if (s.error) return <ErrorBox error={s.error} retry={s.reload} />;
  if (empty && empty(s.data)) return empty === true ? null : <Empty title={t("Nothing here yet.")} />;
  return children(s.data);
}

/* ── toasts ── */
const toastL = new Set();
export function toast(text, tone = "ok") { toastL.forEach(f => f({ text, tone, id: Math.random() })); }
export function Toasts() {
  const [list, set] = useState([]);
  useEffect(() => { const f = (x) => { set(l => [...l, x]); setTimeout(() => set(l => l.filter(y => y.id !== x.id)), x.tone === "bad" ? 9000 : 4000); }; toastL.add(f); return () => toastL.delete(f); }, []);
  return <div class="toasts" role="status" aria-live="polite">{list.map(x => <div class={"toast " + x.tone}>{x.text}</div>)}</div>;
}

/* ── dialogs ── */
export function Modal({ title, onClose, children, actions, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement; const el = ref.current;
    const f = el && el.querySelector("input, textarea, select, button:not(.x)"); (f || el)?.focus();
    const key = (e) => { if (e.key === "Escape") onClose(); if (e.key === "Tab") { const all = [...el.querySelectorAll("a[href], button, input, textarea, select")].filter(x => !x.disabled); if (!all.length) return; const a = all[0], z = all[all.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } };
    addEventListener("keydown", key); return () => { removeEventListener("keydown", key); prev && prev.focus && prev.focus(); };
  }, []);
  return <div class="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div class={"modal" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
      <header><h2>{title}</h2><button type="button" class="x" aria-label={t("Close")} onClick={onClose}>×</button></header>
      <div class="mbody">{children}</div>
      {actions && <footer>{actions}</footer>}
    </div></div>;
}
let confirmSet = null;
export function ConfirmHost() { const [c, set] = useState(null); confirmSet = set;
  return c && <Modal title={c.title} onClose={() => { c.done(false); set(null); }} actions={<><Button onClick={() => { c.done(false); set(null); }}>{t("Cancel")}</Button><Button kind={c.danger ? "danger" : "primary"} onClick={() => { c.done(true); set(null); }}>{c.ok || t("Confirm")}</Button></>}><p>{c.text}</p></Modal>; }
export const ask = (title, text, ok, danger) => new Promise(done => confirmSet({ title, text, ok, danger, done }));

/* ── tabs ── */
export function Tabs({ tabs, value, onChange }) {
  return <div class="tabs" role="tablist">{tabs.map(([k, label, n]) => <button type="button" role="tab" aria-selected={value === k} class={value === k ? "on" : ""} onClick={() => onChange(k)}>{label}{n != null && <span class="cnt">{n}</span>}</button>)}</div>;
}

/* ── an ordered list of things: add, remove, move ── */
export function ListEdit({ items, onChange, render, add, addLabel, empty, max, removable = true }) {
  const list = items || [];
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= list.length) return; const n = [...list]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  const [drag, setDrag] = useState(null);
  return <div class="listed">
    {!list.length && empty && <div class="hint">{empty}</div>}
    {list.map((it, i) => <div class={"li" + (drag === i ? " dragging" : "")} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag == null || drag === i) return; const n = [...list]; const [x] = n.splice(drag, 1); n.splice(i, 0, x); onChange(n); setDrag(null); }} onDragEnd={() => setDrag(null)}>
      <div class="lictl"><span class="grip" aria-hidden="true">⋮⋮</span>
        <button type="button" class="ib" aria-label={t("Move up")} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
        <button type="button" class="ib" aria-label={t("Move down")} disabled={i === list.length - 1} onClick={() => move(i, 1)}>↓</button>
        {removable && <button type="button" class="ib del" aria-label={t("Remove")} onClick={() => onChange(list.filter((_, k) => k !== i))}>×</button>}</div>
      <div class="libody">{render(it, (v) => onChange(list.map((x, k) => k === i ? v : x)), i)}</div>
    </div>)}
    {add && (!max || list.length < max) && <Button onClick={() => onChange([...list, add()])}>+ {addLabel || t("Add")}</Button>}
  </div>;
}

/* the state of a document, said plainly: draft saved, or live */
export function DocState({ doc, dirty, saving, savedAt, conflict }) {
  if (conflict) return <Pill tone="bad">{t("Changed elsewhere")}</Pill>;
  if (saving) return <Pill>{t("Saving…")}</Pill>;
  if (dirty) return <Pill tone="warn">{t("Unsaved changes")}</Pill>;
  if (!doc) return null;
  const live = doc.published_rev === doc.draft_rev && !!doc.published_archived === !!doc.archived_at;
  return live ? <Pill tone="ok">{t("Published")}</Pill> : <Pill tone="info">{t("Draft saved, not live yet")}</Pill>;
}

/* a screen whose content has not been brought into the admin yet */
export function NotImported() {
  return <div class="notice warn">{t("The site's content is not in the admin yet. Open Publishing and choose \"Import the current site\".")}</div>;
}
