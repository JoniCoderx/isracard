// SILAVU admin: the shell. Signs a member of staff in, reads their role from
// the database (not from anything the browser holds), shows only the parts
// of the workspace that role can use, and routes between them.
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { sb, connected, rpc, fn, q, message, CONFIG, SITE } from "./lib/sb.js";
import { t, setLang, getLang, onLang } from "./lib/i18n.js";
import { useRoute, href, go } from "./lib/router.js";
import { Toasts, ConfirmHost, Loading, Button, Modal, Pill, toast } from "./lib/ui.jsx";
import { Login, Reset, MfaChallenge } from "./views/Login.jsx";
import { Overview } from "./views/Overview.jsx";
import { Analytics } from "./views/Analytics.jsx";
import { Products, ProductEdit } from "./views/Products.jsx";
import { Pages } from "./views/Pages.jsx";
import { Media } from "./views/Media.jsx";
import { Enquiries, EnquiryView } from "./views/Enquiries.jsx";
import { Customers, CustomerView } from "./views/Customers.jsx";
import { Quotes, QuoteEdit, QuotePrint } from "./views/Quotes.jsx";
import { Configurator } from "./views/Configurator.jsx";
import { Languages } from "./views/Languages.jsx";
import { Settings } from "./views/Settings.jsx";
import { Team } from "./views/Team.jsx";
import { History } from "./views/History.jsx";
import { Account } from "./views/Account.jsx";
import { PublishPanel, usePending } from "./views/Publish.jsx";

/* never count the house's own visits on the storefront (same site, same browser) */
try { localStorage.setItem("silavu-staff", "1"); } catch (e) {}

export const NAV = [
  ["", "Overview", ["owner", "editor", "support", "analyst"]],
  ["analytics", "Analytics", ["owner", "analyst"]],
  ["products", "Products", ["owner", "editor"]],
  ["pages", "Pages & text", ["owner", "editor"]],
  ["media", "Media", ["owner", "editor"]],
  ["enquiries", "Enquiries", ["owner", "support"]],
  ["customers", "Customers", ["owner", "support"]],
  ["quotes", "Quotes", ["owner", "support"]],
  ["line", "The Line", ["owner", "editor"]],
  ["languages", "Languages & SEO", ["owner", "editor"]],
  ["settings", "Settings", ["owner", "editor"]],
  ["team", "Team", ["owner"]],
  ["history", "History & backups", ["owner", "editor"]]
];
export const can = (role, path) => { const n = NAV.find(x => x[0] === path); return !!n && n[2].includes(role); };

function NotConnected() {
  return <main class="solo"><div class="card narrow"><div class="brand big">SILAVU</div><h1>{t("The admin is not connected yet")}</h1>
    <p>{t("This copy of the admin was built without the backend's address. Follow ADMIN_SETUP.md: create the Supabase project, add its address and publishable key to the repository's Actions secrets, and publish once.")}</p></div></main>;
}

function App() {
  const route = useRoute();
  const [, rerender] = useState(0); useEffect(() => onLang(() => rerender(x => x + 1)), []);
  const [auth, setAuth] = useState({ ready: false, session: null, staff: null, aal: null, error: null });
  const refresh = async (session) => {
    if (!session) return setAuth({ ready: true, session: null, staff: null });
    try {
      const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      const staff = await rpc("my_staff", {});
      setAuth({ ready: true, session, staff, aal });
    } catch (e) { setAuth({ ready: true, session, staff: null, error: e }); }
  };
  useEffect(() => {
    if (!connected) return;
    sb.auth.getSession().then(({ data }) => refresh(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((ev, session) => { if (ev === "PASSWORD_RECOVERY") go("reset"); if (ev !== "INITIAL_SESSION") refresh(session); });
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!connected) return <NotConnected />;
  if (!auth.ready) return <Loading />;
  if (route.parts[0] === "reset") return <Reset session={auth.session} />;
  if (!auth.session) return <Login />;
  /* a second factor is set up: it is asked for before anything else */
  if (auth.aal && auth.aal.nextLevel === "aal2" && auth.aal.currentLevel !== "aal2") return <MfaChallenge onDone={() => sb.auth.getSession().then(({ data }) => refresh(data.session))} />;
  if (!auth.staff || !auth.staff.effective_role) return <NoAccess staff={auth.staff} error={auth.error} />;
  return <Shell auth={auth} route={route} />;
}

function NoAccess({ staff, error }) {
  const needsMfa = staff && staff.active && staff.mfa_required && staff.aal !== "aal2";
  return <main class="solo"><div class="card narrow"><div class="brand big">SILAVU</div>
    <h1>{needsMfa ? t("Your account needs a second factor") : t("This account has no access to the admin")}</h1>
    <p>{needsMfa ? t("The owner requires an authenticator app for your account. Set it up in Account, then sign in again.") : error ? message(error) : t("Ask the owner to invite you. If you were removed, your access ended at once.")}</p>
    {needsMfa ? <Account staff={staff} minimal /> : null}
    <Button onClick={() => sb.auth.signOut()}>{t("Sign out")}</Button></div></main>;
}

function Shell({ auth, route }) {
  const role = auth.staff.effective_role, [section, a, b] = route.parts;
  const [menu, setMenu] = useState(false), [pub, setPub] = useState(false);
  const pending = usePending(role);
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [route.parts.join("/")]);
  const allowed = (p) => can(role, p);
  let view;
  const S = section || "";
  if (!NAV.some(n => n[0] === S) && !["account", "print"].includes(S)) view = <NotFound />;
  else if (!["account", "print"].includes(S) && !allowed(S)) view = <Forbidden />;
  else switch (S) {
    case "": view = <Overview role={role} staff={auth.staff} />; break;
    case "analytics": view = <Analytics />; break;
    case "products": view = a ? <ProductEdit id={a} role={role} onPublished={pending.reload} /> : <Products role={role} />; break;
    case "pages": view = <Pages tab={a} item={b} role={role} onChange={pending.reload} />; break;
    case "media": view = <Media id={a} />; break;
    case "enquiries": view = a ? <EnquiryView id={a} role={role} me={auth.staff} /> : <Enquiries role={role} query={route.query} />; break;
    case "customers": view = a ? <CustomerView id={a} role={role} /> : <Customers role={role} />; break;
    case "quotes": view = a ? <QuoteEdit id={a} role={role} /> : <Quotes />; break;
    case "print": view = can(role, "quotes") ? <QuotePrint id={a} /> : <Forbidden />; break;
    case "line": view = <Configurator />; break;
    case "languages": view = <Languages tab={a} />; break;
    case "settings": view = <Settings role={role} />; break;
    case "team": view = <Team me={auth.staff} />; break;
    case "history": view = <History role={role} tab={a} />; break;
    case "account": view = <Account staff={auth.staff} />; break;
  }
  if (S === "print") return view;
  return <div class={"shell" + (menu ? " menu-open" : "")}>
    <a class="skip" href="#main">{t("Skip to content")}</a>
    <aside class="side" aria-label={t("Admin sections")}>
      <div class="brand"><span>SILAVU</span><small>{t("Admin")}</small></div>
      <nav>{NAV.filter(n => n[2].includes(role)).map(n => <a href={href(n[0])} class={S === n[0] ? "on" : ""} aria-current={S === n[0] ? "page" : undefined}>{t(n[1])}</a>)}</nav>
      <div class="sidefoot">
        <a href={SITE} target="_blank" rel="noopener">{t("View the site")} ↗</a>
        <a href={href("account")} class={S === "account" ? "on" : ""}>{t("Account")}</a>
        <button type="button" class="linkb" onClick={() => setLang(getLang() === "he" ? "en" : "he")}>{getLang() === "he" ? "English" : "עברית"}</button>
        <button type="button" class="linkb" onClick={async () => { await sb.auth.signOut(); location.hash = ""; }}>{t("Sign out")}</button>
        <div class="who">{auth.staff.display_name || auth.staff.email}<br /><Pill>{t(role)}</Pill></div>
      </div>
    </aside>
    <div class="mainwrap">
      <header class="top">
        <button type="button" class="menub" aria-expanded={menu} aria-label={t("Menu")} onClick={() => setMenu(!menu)}>☰</button>
        <div class="brand sm">SILAVU</div>
        <div class="topact">
          {(role === "owner" || role === "editor") && <Button kind={pending.list.length ? "primary" : ""} onClick={() => setPub(true)}>{pending.list.length ? t("Publish ({n})", { n: pending.list.length }) : t("Publishing")}</Button>}
        </div>
      </header>
      <main id="main" tabIndex={-1}>{view}</main>
    </div>
    {menu && <div class="scrim side-scrim" onClick={() => setMenu(false)} />}
    {pub && <PublishPanel role={role} pending={pending} onClose={() => { setPub(false); pending.reload(); }} />}
  </div>;
}
const NotFound = () => <div class="state"><strong>{t("This page does not exist.")}</strong><a href="#/">{t("Back to the overview")}</a></div>;
const Forbidden = () => <div class="state bad"><strong>{t("Your role does not include this part of the admin.")}</strong><a href="#/">{t("Back to the overview")}</a></div>;

function Root() { return <><App /><Toasts /><ConfirmHost /></>; }
render(<Root />, document.getElementById("app"));
