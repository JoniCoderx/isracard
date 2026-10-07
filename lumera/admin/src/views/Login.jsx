import { useState } from "preact/hooks";
import { sb, message, CONFIG } from "../lib/sb.js";
import { t, getLang, setLang } from "../lib/i18n.js";
import { Button, Input } from "../lib/ui.jsx";

const Frame = ({ title, children }) => <main class="solo"><form class="card narrow" onSubmit={(e) => e.preventDefault()}>
  <div class="brand big">SILAVU</div><h1>{title}</h1>{children}
  <button type="button" class="linkb langsw" onClick={() => setLang(getLang() === "he" ? "en" : "he")}>{getLang() === "he" ? "English" : "עברית"}</button>
</form></main>;

export function Login() {
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [mode, setMode] = useState("in"), [sent, setSent] = useState(false);
  const signIn = async () => {
    setErr(""); setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false); if (error) setErr(/invalid/i.test(error.message) ? t("That email and password do not match an account.") : message(error));
  };
  const recover = async () => {
    setErr(""); setBusy(true);
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.href.split("#")[0] + "#/reset" });
    setBusy(false); if (error) setErr(message(error)); else setSent(true);
  };
  if (mode === "forgot") return <Frame title={t("Reset your password")}>
    {sent ? <p role="status">{t("If that address has an account, a link to set a new password is on its way. It works once and expires within an hour.")}</p> : <>
      <Input label={t("Email")} type="email" autocomplete="username" value={email} onInput={setEmail} />
      {err && <div class="err" role="alert">{err}</div>}
      <Button kind="primary" busy={busy} onClick={recover} type="submit">{t("Send the link")}</Button>
      <p class="hint">{t("If no email arrives, the owner can set a new password for you under Team.")}</p></>}
    <button type="button" class="linkb" onClick={() => { setMode("in"); setSent(false); }}>{t("Back to sign in")}</button>
  </Frame>;
  const idle = (() => { try { const v = sessionStorage.getItem("silavu-idle"); sessionStorage.removeItem("silavu-idle"); return !!v; } catch (e) { return false; } })();
  return <Frame title={t("Sign in")}>
    {idle && <p class="notice" role="status">{t("You were signed out after 30 minutes without activity. Anything you had not saved is kept on this device.")}</p>}
    <Input label={t("Email")} type="email" autocomplete="username" value={email} onInput={setEmail} />
    <Input label={t("Password")} type="password" autocomplete="current-password" value={pw} onInput={setPw} onKeyDown={(e) => e.key === "Enter" && signIn()} />
    {err && <div class="err" role="alert">{err}</div>}
    <Button kind="primary" busy={busy} onClick={signIn} type="submit">{t("Sign in")}</Button>
    <button type="button" class="linkb" onClick={() => setMode("forgot")}>{t("Forgot your password?")}</button>
    <p class="hint">{t("Accounts are created by invitation from the owner. There is no sign-up.")}</p>
  </Frame>;
}

/* after the email link: choose a new password */
export function Reset({ session }) {
  const [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState(false);
  if (!session) return <Frame title={t("Set a new password")}><p>{t("This link has expired or was already used. Ask for a new one from the sign-in page.")}</p><a href="#/">{t("Back to sign in")}</a></Frame>;
  const save = async () => {
    setErr("");
    if (pw.length < 10) return setErr(t("Use at least 10 characters."));
    if (pw !== pw2) return setErr(t("The two passwords are not the same."));
    setBusy(true); const { error } = await sb.auth.updateUser({ password: pw }); setBusy(false);
    if (error) setErr(message(error)); else setDone(true);
  };
  return <Frame title={t("Set a new password")}>
    {done ? <><p role="status">{t("Your password is changed.")}</p><a class="b primary" href="#/">{t("Continue")}</a></> : <>
      <Input label={t("New password")} type="password" autocomplete="new-password" value={pw} onInput={setPw} hint={t("At least 10 characters. A sentence you will remember is good.")} />
      <Input label={t("The same again")} type="password" autocomplete="new-password" value={pw2} onInput={setPw2} />
      {err && <div class="err" role="alert">{err}</div>}
      <Button kind="primary" busy={busy} onClick={save} type="submit">{t("Save the password")}</Button></>}
  </Frame>;
}

/* the six digits from the authenticator app */
export function MfaChallenge({ onDone }) {
  const [code, setCode] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const verify = async () => {
    setErr(""); setBusy(true);
    try {
      const { data: f, error: e1 } = await sb.auth.mfa.listFactors(); if (e1) throw e1;
      const factor = (f.totp || []).find(x => x.status === "verified"); if (!factor) throw new Error(t("No authenticator is set up on this account."));
      const { data: ch, error: e2 } = await sb.auth.mfa.challenge({ factorId: factor.id }); if (e2) throw e2;
      const { error: e3 } = await sb.auth.mfa.verify({ factorId: factor.id, challengeId: ch.id, code: code.replace(/\s/g, "") }); if (e3) throw e3;
      onDone();
    } catch (e) { setErr(/invalid|failed/i.test(message(e)) ? t("That code is not right, or it has just changed. Try the new one.") : message(e)); }
    setBusy(false);
  };
  return <Frame title={t("Your authenticator code")}>
    <p>{t("Open your authenticator app and type the six digits it shows for SILAVU.")}</p>
    <Input label={t("Code")} inputmode="numeric" autocomplete="one-time-code" maxlength="7" value={code} onInput={setCode} onKeyDown={(e) => e.key === "Enter" && verify()} />
    {err && <div class="err" role="alert">{err}</div>}
    <Button kind="primary" busy={busy} onClick={verify} type="submit">{t("Continue")}</Button>
    <button type="button" class="linkb" onClick={() => sb.auth.signOut()}>{t("Sign out")}</button>
  </Frame>;
}
