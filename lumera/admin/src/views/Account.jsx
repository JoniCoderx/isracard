// Your own account: name, password, the authenticator app, language.
import { useState } from "preact/hooks";
import { sb, rpc, fn, message } from "../lib/sb.js";
import { t, getLang, setLang } from "../lib/i18n.js";
import { Button, Input, PageHead, Pill, toast, useLoad, Load, ask } from "../lib/ui.jsx";

export function Account({ staff, minimal }) {
  const [name, setName] = useState(staff.display_name || ""), [pw, setPw] = useState(""), [busy, setBusy] = useState("");
  const factors = useLoad(async () => { const { data, error } = await sb.auth.mfa.listFactors(); if (error) throw error; return data.all || []; });
  const [enroll, setEnroll] = useState(null), [code, setCode] = useState("");
  const saveName = async () => { setBusy("name"); try { await rpc("update_my_name", { p_name: name }); toast(t("Saved.")); } catch (e) { toast(message(e), "bad"); } setBusy(""); };
  const savePw = async () => { if (pw.length < 10) return toast(t("Use at least 10 characters."), "bad"); setBusy("pw"); const { error } = await sb.auth.updateUser({ password: pw }); setBusy(""); if (error) toast(message(error), "bad"); else { setPw(""); toast(t("Your password is changed.")); } };
  const start = async () => { setBusy("mfa"); const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "SILAVU " + new Date().toISOString().slice(0, 10) }); setBusy(""); if (error) toast(message(error), "bad"); else setEnroll(data); };
  const confirmEnroll = async () => {
    setBusy("mfa");
    try {
      const { data: ch, error: e1 } = await sb.auth.mfa.challenge({ factorId: enroll.id }); if (e1) throw e1;
      const { error: e2 } = await sb.auth.mfa.verify({ factorId: enroll.id, challengeId: ch.id, code: code.replace(/\s/g, "") }); if (e2) throw e2;
      setEnroll(null); setCode(""); factors.reload(); toast(t("The authenticator is set up. You will be asked for a code when you sign in."));
      if (minimal) location.reload();
    } catch (e) { toast(/invalid|failed/i.test(message(e)) ? t("That code is not right, or it has just changed. Try the new one.") : message(e), "bad"); }
    setBusy("");
  };
  const remove = async (f) => {
    if (!(await ask(t("Remove this authenticator?"), t("You will sign in with your password only. If the owner requires a second factor for your account, you will lose access until you set one up again."), t("Remove"), true))) return;
    const { error } = await sb.auth.mfa.unenroll({ factorId: f.id }); if (error) toast(message(error), "bad"); else factors.reload();
  };
  const mfa = <section class="card">
    <h2>{t("Authenticator app")}</h2>
    <p class="hint">{t("A second step at sign-in: a six-digit code from an app such as Google Authenticator, 1Password or Microsoft Authenticator. Strongly advised for the owner.")}</p>
    <Load s={factors}>{(list) => <>
      {list.filter(f => f.status === "verified").map(f => <div class="row"><Pill tone="ok">{t("On")}</Pill><span>{f.friendly_name}</span><Button kind="quiet" onClick={() => remove(f)}>{t("Remove")}</Button></div>)}
      {!enroll && !list.some(f => f.status === "verified") && <Button kind="primary" busy={busy === "mfa"} onClick={start}>{t("Set up an authenticator")}</Button>}
      {enroll && <div class="enroll">
        <p>{t("Scan this with the app, or type the key into it by hand. Then type the six digits it shows.")}</p>
        {enroll.totp.qr_code && <img class="qr" src={enroll.totp.qr_code} alt={t("QR code for the authenticator app")} width="180" height="180" />}
        <p><code class="key">{enroll.totp.secret}</code></p>
        <Input label={t("Code")} inputmode="numeric" autocomplete="one-time-code" value={code} onInput={setCode} />
        <Button kind="primary" busy={busy === "mfa"} onClick={confirmEnroll}>{t("Turn it on")}</Button>
      </div>}
    </>}</Load>
  </section>;
  if (minimal) return mfa;
  return <>
    <PageHead title={t("Account")} sub={staff.email} />
    <div class="grid2">
      <section class="card"><h2>{t("Your name")}</h2><Input label={t("Shown to the team")} value={name} onInput={setName} /><Button busy={busy === "name"} onClick={saveName}>{t("Save")}</Button></section>
      <section class="card"><h2>{t("Password")}</h2><Input label={t("New password")} type="password" autocomplete="new-password" value={pw} onInput={setPw} hint={t("At least 10 characters.")} /><Button busy={busy === "pw"} onClick={savePw}>{t("Change the password")}</Button></section>
      {mfa}
      <DeleteAccount />
      <section class="card"><h2>{t("Language of the admin")}</h2><div class="row"><Button kind={getLang() === "en" ? "primary" : ""} onClick={() => setLang("en")}>English</Button><Button kind={getLang() === "he" ? "primary" : ""} onClick={() => setLang("he")}>עברית</Button></div></section>
    </div>
  </>;
}

/* leaving for good: the account is deleted, not just switched off */
function DeleteAccount() {
  const [word, setWord] = useState(""), [busy, setBusy] = useState(false);
  const go = async () => {
    if (!(await ask(t("Delete your account?"), t("Your sign-in is deleted for good and you lose access at once. What you wrote and published stays on the site and in the history."), t("Delete my account"), true))) return;
    setBusy(true);
    try { await fn("staff", { action: "delete_account", confirm: word }); await sb.auth.signOut(); location.hash = ""; location.reload(); }
    catch (e) { toast(message(e), "bad"); setBusy(false); }
  };
  return <section class="card danger">
    <h2>{t("Delete my account")}</h2>
    <p class="hint">{t("Type DELETE to confirm. The only owner cannot delete their account: make someone else owner first.")}</p>
    <Input label={t("Type DELETE")} value={word} onInput={setWord} autocomplete="off" />
    <Button kind="danger" busy={busy} disabled={word !== "DELETE"} onClick={go}>{t("Delete my account")}</Button>
  </section>;
}
