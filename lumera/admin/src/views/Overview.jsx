// The first screen: what happened, what needs attention, and whether the
// pieces of the system are connected. Every figure says where it comes from
// and for which period; nothing is estimated or filled in.
import { sb, rpc, fn, q, message } from "../lib/sb.js";
import { t } from "../lib/i18n.js";
import { range, day, ago, when } from "../lib/time.js";
import { PageHead, Load, useLoad, Pill, Empty } from "../lib/ui.jsx";
import { href } from "../lib/router.js";
import { ReleaseState } from "./Publish.jsx";

const pct = (a, b) => b ? Math.round((a / b) * 1000) / 10 + "%" : "–";
const delta = (a, b) => { if (b == null || !Number.isFinite(b)) return null; if (!b) return a ? "new" : "0"; const d = Math.round(((a - b) / b) * 100); return (d > 0 ? "+" : "") + d + "%"; };

function Stat({ label, value, prev, note }) {
  const d = delta(value, prev);
  return <div class="stat"><div class="sl">{label}</div><div class="sv">{value ?? "–"}</div>
    {d != null && <div class={"sd" + (String(d).startsWith("+") ? " up" : String(d).startsWith("-") ? " down" : "")}>{d === "new" ? t("new") : d} <span>{t("vs the 7 days before")}</span></div>}
    {note && <div class="sn">{note}</div>}</div>;
}

export function Overview({ role, staff }) {
  const R = range(7);
  const sees = { traffic: role === "owner" || role === "analyst", people: role === "owner" || role === "support", content: role === "owner" || role === "editor" };
  const traffic = useLoad(async () => sees.traffic ? {
    now: await rpc("analytics_overview", { p_from: R.from.toISOString(), p_to: R.to.toISOString(), p_filters: {} }),
    prev: await rpc("analytics_overview", { p_from: R.prevFrom.toISOString(), p_to: R.prevTo.toISOString(), p_filters: {} }),
    top: await rpc("analytics_breakdown", { p_from: R.from.toISOString(), p_to: R.to.toISOString(), p_dimension: "product", p_filters: {}, p_limit: 5 })
  } : null);
  const people = useLoad(async () => sees.people ? {
    recent: await q(sb.from("enquiries").select("id,ref,created_at,name,want,product_name,status,notify_status").order("created_at", { ascending: false }).limit(6)),
    open: (await q(sb.from("enquiries").select("id", { count: "exact", head: false }).in("status", ["new", "follow_up"]).limit(1))).count,
    due: await q(sb.from("enquiries").select("id,ref,name,due_at").not("due_at", "is", null).lt("due_at", new Date(Date.now() + 86400000).toISOString()).not("status", "in", "(won,closed)").order("due_at").limit(5))
  } : null);
  const content = useLoad(async () => sees.content ? {
    ...(await (async () => { const all = await q(sb.from("content_docs").select("key,title,kind,draft_rev,published_rev,draft_updated_at,archived_at,published_archived"));
      return { empty: !all.length, drafts: all.filter(r => r.draft_rev !== r.published_rev || !!r.archived_at !== !!r.published_archived) }; })()),
    release: (await q(sb.from("releases").select("id,status,build_url,error,created_at,finished_at,note").order("id", { ascending: false }).limit(1)))[0] || null
  } : null);
  const status = useLoad(() => fn("status", {}, "GET"));
  return <>
    <PageHead title={t("Good to see you, {name}", { name: (staff.display_name || staff.email).split(" ")[0].split("@")[0] })} sub={t("Times are Israel time. Figures cover the last 7 full days unless they say otherwise.")} />
    {sees.traffic && <section class="card">
      <h2>{t("Visits")} <a class="more" href={href("analytics")}>{t("Analytics")} →</a></h2>
      <Load s={traffic}>{(d) => d.now.first_event ? <>
        <div class="stats">
          <Stat label={t("Sessions")} value={d.now.sessions} prev={d.prev.sessions} />
          <Stat label={t("Returning browsers (with consent)")} value={d.now.visitors_consented} prev={d.prev.visitors_consented} />
          <Stat label={t("Pages viewed")} value={d.now.page_views} prev={d.prev.page_views} />
          <Stat label={t("Enquiries saved")} value={d.now.enquiries_saved} prev={d.prev.enquiries_saved} />
          <Stat label={t("Sessions that sent an enquiry")} value={pct(d.now.enquiry_sessions, d.now.sessions)} note={t("{a} of {b} counted sessions", { a: d.now.enquiry_sessions, b: d.now.sessions })} />
          <Stat label={t("WhatsApp, email and phone clicks")} value={d.now.contact_clicks} prev={d.prev.contact_clicks} note={t("A click is not a message received.")} />
        </div>
        <p class="hint">{t("Counted only for visitors who allowed it. Counting started {d}. Last event {w}. Active in the last 5 minutes: {n} sessions.", { d: day(d.now.first_event), w: ago(d.now.last_event), n: d.now.active_sessions_5min })}</p>
        {d.top.length > 0 && <><h3>{t("Most viewed pieces")}</h3><ol class="toplist">{d.top.map(x => <li><span>{x.value}</span><b>{x.sessions}</b></li>)}</ol></>}
      </> : <Empty title={t("No visits counted yet.")}>{t("Counting begins when the backend is connected and a visitor allows it. There is no earlier history to show.")}</Empty>}</Load>
    </section>}
    {sees.people && <section class="card">
      <h2>{t("Enquiries")} <a class="more" href={href("enquiries")}>{t("All enquiries")} →</a></h2>
      <Load s={people}>{(d) => <>
        <p>{t("{n} new or waiting for a follow-up.", { n: d.open })}</p>
        {d.due.length > 0 && <div class="notice warn">{t("Due today or overdue:")} {d.due.map(e => <a href={href("enquiries/" + e.id)}>{e.ref} {e.name}</a>)}</div>}
        {d.recent.length ? <table class="tbl"><thead><tr><th>{t("When")}</th><th>{t("Who")}</th><th>{t("About")}</th><th>{t("Status")}</th></tr></thead><tbody>
          {d.recent.map(e => <tr><td>{when(e.created_at)}</td><td><a href={href("enquiries/" + e.id)}>{e.name}</a></td><td>{e.product_name || t(e.want) || "–"}</td><td><Pill tone={e.status === "new" ? "warn" : ""}>{t(e.status)}</Pill>{e.notify_status === "failed" && <Pill tone="bad">{t("email not sent")}</Pill>}</td></tr>)}
        </tbody></table> : <Empty title={t("No enquiries yet.")} />}
      </>}</Load>
    </section>}
    {sees.content && <section class="card">
      <h2>{t("The site")}</h2>
      <Load s={content}>{(d) => d.empty ? <div class="notice warn">{role === "owner" ? t("The site's content is not in the admin yet. Open Publishing and choose \"Import the current site\".") : t("The owner has not imported the site's content yet.")}</div> : <>
        {d.release ? <div class="row"><span>{t("Latest release")} #{d.release.id} · {when(d.release.created_at)}</span><ReleaseState r={d.release} /></div> : <p>{t("Nothing has been published from the admin yet.")}</p>}
        {d.drafts.length ? <p>{t("{n} saved changes are not live yet.", { n: d.drafts.length })} {d.drafts.slice(0, 6).map(x => <Pill>{x.title || x.key}</Pill>)}</p> : <p>{t("Everything saved is live.")}</p>}
      </>}</Load>
    </section>}
    <section class="card">
      <h2>{t("Connections")}</h2>
      <Load s={status}>{(s) => <ul class="conn">
        <li><Pill tone="ok">{t("On")}</Pill>{t("Database and sign-in")}</li>
        <li><Pill tone={s.publishing ? "ok" : "bad"}>{s.publishing ? t("On") : t("Off")}</Pill>{t("Publishing to the site (GitHub)")}</li>
        <li><Pill tone={s.build_token ? "ok" : "bad"}>{s.build_token ? t("On") : t("Off")}</Pill>{t("Build access to published content")}</li>
        <li><Pill tone={s.mail === "off" ? "warn" : "ok"}>{s.mail === "off" ? t("Off") : s.mail}</Pill>{t("Email to the house when an enquiry arrives")}{s.mail === "off" && <span class="hint"> {t("Enquiries are still saved; nobody is emailed.")}</span>}</li>
        <li><Pill tone={s.auto_reply ? "ok" : ""}>{s.auto_reply ? t("On") : t("Off")}</Pill>{t("Confirmation email to the person who wrote")}</li>
      </ul>}</Load>
    </section>
  </>;
}
