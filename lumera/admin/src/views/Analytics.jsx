// Visit analytics: anonymous, aggregated in the database, never a person.
// Every figure has its definition one click away, and the period it covers.
import { useState } from "preact/hooks";
import { rpc } from "../lib/sb.js";
import { t } from "../lib/i18n.js";
import { range, day, ago, israelDayStart } from "../lib/time.js";
import { Button, Input, PageHead, Load, useLoad, Tabs, Empty } from "../lib/ui.jsx";
import { downloadCsv } from "./Customers.jsx";

const DIMS = [["source", "Where visits came from"], ["utm_campaign", "Campaign"], ["landing", "First page"], ["exit", "Last page"], ["path", "Pages"], ["product", "Pieces"], ["device", "Device"], ["browser", "Browser"], ["lang", "Language"], ["country", "Country"]];
const FUNNELS = [
  ["collection", "Collection to enquiry", ["product_open", "enquiry_start", "enquiry_success"]],
  ["line", "The Line to enquiry", ["configurator_start", "configurator_complete", "enquiry_success"]]
];
const STEP = { product_open: "Opened a piece", enquiry_start: "Started the form", enquiry_success: "Enquiry saved", configurator_start: "Started designing", configurator_complete: "Chose a design" };

function Chart({ series }) {
  if (!series.length) return null;
  const W = 720, H = 200, P = 28, max = Math.max(1, ...series.map(s => s.sessions)), n = series.length;
  const x = (i) => P + (n === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (n - 1)), y = (v) => H - P - (v / max) * (H - 2 * P);
  const line = series.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(s.sessions).toFixed(1)}`).join(" ");
  const ticks = [0, Math.round(max / 2), max];
  return <figure class="chart"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("Sessions per day")}>
    {ticks.map(v => <g><line x1={P} x2={W - P} y1={y(v)} y2={y(v)} class="grid" /><text x={P - 6} y={y(v) + 4} class="ax" text-anchor="end">{v}</text></g>)}
    <path d={line + ` L${x(n - 1)},${H - P} L${x(0)},${H - P} Z`} class="area" />
    <path d={line} class="ln" />
    {series.map((s, i) => s.enquiries ? <circle cx={x(i)} cy={y(s.sessions)} r="4" class="enq"><title>{t("{n} enquiries", { n: s.enquiries })}</title></circle> : null)}
    {series.map((s, i) => (n <= 14 || i % Math.ceil(n / 10) === 0) && <text x={x(i)} y={H - 8} class="ax" text-anchor="middle">{s.day.slice(5)}</text>)}
  </svg><figcaption>{t("Sessions per day (Israel time). Dots mark days with saved enquiries.")}</figcaption></figure>;
}

export function Analytics() {
  const [days, setDays] = useState(30), [custom, setCustom] = useState({ from: "", to: "" }), [f, setF] = useState({}), [dim, setDim] = useState("source");
  const R = custom.from && custom.to ? (() => { const from = israelDayStart(new Date(custom.from)), to = new Date(israelDayStart(new Date(custom.to)).getTime() + 86400000), len = to - from; return { from, to, prevFrom: new Date(from - len), prevTo: from }; })() : range(days);
  const filters = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
  const args = { p_from: R.from.toISOString(), p_to: R.to.toISOString(), p_filters: filters };
  const s = useLoad(async () => {
    const [now, prev, series, funnels] = await Promise.all([rpc("analytics_overview", args), rpc("analytics_overview", { ...args, p_from: R.prevFrom.toISOString(), p_to: R.prevTo.toISOString() }), rpc("analytics_series", args),
      Promise.all(FUNNELS.map(x => rpc("analytics_funnel", { ...args, p_steps: x[2] })))]);
    return { now, prev, series, funnels };
  }, [R.from.getTime(), R.to.getTime(), JSON.stringify(filters)]);
  const b = useLoad(() => rpc("analytics_breakdown", { ...args, p_dimension: dim, p_limit: 25 }), [dim, R.from.getTime(), R.to.getTime(), JSON.stringify(filters)]);
  const cmp = (a, p) => { if (!p) return a ? t("new") : "–"; const d = Math.round(((a - p) / p) * 100); return (d > 0 ? "+" : "") + d + "%"; };
  return <>
    <PageHead title={t("Analytics")} sub={t("{a} to {b} (Israel time), compared with the same length of time before.", { a: day(R.from), b: day(new Date(R.to - 1)) })}>
      <Button onClick={() => s.data && downloadCsv("silavu-visits-by-day.csv", s.data.series)}>{t("Export days (CSV)")}</Button>
      <Button onClick={() => b.data && downloadCsv(`silavu-${dim}.csv`, b.data)}>{t("Export this table (CSV)")}</Button>
    </PageHead>
    <div class="filters">
      <Tabs tabs={[[7, t("7 days")], [30, t("30 days")], [90, t("90 days")]]} value={custom.from ? 0 : days} onChange={(v) => { setCustom({ from: "", to: "" }); setDays(v); }} />
      <Input type="date" label={t("From")} value={custom.from} onInput={(v) => setCustom({ ...custom, from: v })} />
      <Input type="date" label={t("To")} value={custom.to} onInput={(v) => setCustom({ ...custom, to: v })} />
      <label class="fld"><span>{t("Device")}</span><select value={f.device || ""} onChange={(e) => setF({ ...f, device: e.target.value })}><option value="">{t("All")}</option><option value="mobile">{t("mobile")}</option><option value="tablet">{t("tablet")}</option><option value="desktop">{t("desktop")}</option></select></label>
      <Input label={t("Source (e.g. instagram.com)")} value={f.source || ""} onInput={(v) => setF({ ...f, source: v })} />
      <Input label={t("Piece (e.g. knot)")} value={f.product || ""} onInput={(v) => setF({ ...f, product: v })} />
    </div>
    <Load s={s}>{({ now, prev, series, funnels }) => !now.first_event ? <Empty title={t("No visits counted yet.")}>{t("Counting starts when the backend is connected and visitors allow it. There is no history from before that.")}</Empty> : <>
      <section class="card"><div class="stats">
        {[["Sessions", "sessions"], ["Returning browsers (with consent)", "visitors_consented"], ["Pages viewed", "page_views"], ["Pieces opened", "product_views"], ["Designs started", "configurator_starts"], ["Enquiries saved", "enquiries_saved"], ["WhatsApp, email and phone clicks", "contact_clicks"]].map(([l, k]) =>
          <div class="stat"><div class="sl">{t(l)}</div><div class="sv">{now[k] ?? 0}</div><div class="sd">{cmp(now[k] || 0, prev[k] || 0)}</div></div>)}
        <div class="stat"><div class="sl">{t("Sessions that sent an enquiry")}</div><div class="sv">{now.sessions ? Math.round((now.enquiry_sessions / now.sessions) * 1000) / 10 + "%" : "–"}</div><div class="sn">{t("{a} of {b} counted sessions", { a: now.enquiry_sessions, b: now.sessions })}</div></div>
        <div class="stat"><div class="sl">{t("Average time looking")}</div><div class="sv">{now.engaged_seconds_avg != null ? Math.round(now.engaged_seconds_avg) + " s" : "–"}</div><div class="sn">{t("per session, while the page was in view")}</div></div>
      </div>
      <p class="hint">{t("Active now: {n} sessions with activity in the last 5 minutes (not a count of people). Counting started {d}; latest event {w}.", { n: now.active_sessions_5min, d: day(now.first_event), w: ago(now.last_event) })}</p>
      {now.contact_by_channel && Object.keys(now.contact_by_channel).length > 0 && <p class="hint">{Object.entries(now.contact_by_channel).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>}</section>
      <section class="card"><Chart series={series} /></section>
      <section class="card"><h2>{t("Funnels")}</h2><div class="grid2">{funnels.map((fn, i) => <div><h3>{t(FUNNELS[i][1])}</h3><ol class="funnel">{fn.map((st, j) => <li><span>{t(STEP[st.step] || st.step)}</span><b>{st.sessions}</b>{j > 0 && fn[j - 1].sessions > 0 && <i>{Math.round((st.sessions / fn[j - 1].sessions) * 100)}%</i>}</li>)}</ol></div>)}</div>
        <p class="hint">{t("A step counts a session once it has done it after the step before, within the period.")}</p></section>
    </>}</Load>
    <section class="card"><div class="row"><h2 class="grow">{t("Breakdown")}</h2><label class="fld"><span>{t("By")}</span><select value={dim} onChange={(e) => setDim(e.target.value)}>{DIMS.map(([k, l]) => <option value={k}>{t(l)}</option>)}</select></label></div>
      <Load s={b}>{(rows) => rows.length ? <table class="tbl"><thead><tr><th>{t(DIMS.find(d => d[0] === dim)[1])}</th><th>{t("Sessions")}</th>{rows[0].events != null && <th>{t("Events")}</th>}</tr></thead><tbody>{rows.map(r => <tr><td>{r.value}</td><td>{r.sessions}</td>{r.events != null && <td>{r.events}</td>}</tr>)}</tbody></table> : <Empty title={t("Nothing in this period.")} />}</Load></section>
    <details class="card defs"><summary>{t("How these are counted")}</summary><ul>
      <li>{t("A session is one visit in one browser tab: a random number kept until 30 minutes pass without activity. Nothing about the person is known.")}</li>
      <li>{t("Returning browsers are counted only for visitors who allowed it; the same person on two devices counts twice.")}</li>
      <li>{t("Robots that say who they are, and the admin's own browser, are left out. Robot detection is never perfect.")}</li>
      <li>{t("Enquiries saved come from the enquiries themselves, not from the counter, so they include visitors who did not allow counting.")}</li>
      <li>{t("A WhatsApp, email or phone click means someone pressed the button. Whether they sent anything is not known.")}</li>
      <li>{t("Sources: the referring site's name, or the utm_source of a campaign link. Direct means neither was given.")}</li>
      <li>{t("Records older than the period set in Settings are deleted.")}</li>
    </ul></details>
  </>;
}
