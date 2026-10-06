// The Line: what the bracelet builder offers. The 3D model, the stones'
// geometry and the wrist views stay as they are; the house chooses which
// shapes, metals and origins are offered, the carat steps and wrist sizes,
// what it opens on, and the estimate's figures. An enquiry is checked against
// what is published here, and keeps the version it was made with.
import { useState } from "preact/hooks";
import { message } from "../lib/sb.js";
import { t, getLang } from "../lib/i18n.js";
import { day } from "../lib/time.js";
import { useDoc } from "../lib/doc.js";
import { Button, Input, Select, Toggle, Bi, PageHead, Pill, NotImported } from "../lib/ui.jsx";
import { SaveBar } from "./Products.jsx";
import { Preview } from "./PreviewFrame.jsx";
import { Revisions } from "./History.jsx";

export function Configurator() {
  const d = useDoc("configurator", "configurator", { title: "The Line" });
  const [prev, setPrev] = useState(false);
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error) return <p class="err">{message(d.error)}</p>;
  if (!d.data) return <NotImported />;
  const c = d.data, set = (k, v) => d.setData({ ...c, [k]: v });
  const list = (k, label) => <section class="card"><h2>{label}</h2><div class="opts">{c[k].map((x, i) => <div class="opt">
    <Toggle label={getLang() === "he" ? x.he : x.en} checked={x.enabled !== false} onChange={(v) => set(k, c[k].map((y, j) => j === i ? { ...y, enabled: v } : y))} />
    <Bi label={t("Label")} value={{ en: x.en, he: x.he }} onInput={(v) => set(k, c[k].map((y, j) => j === i ? { ...y, ...v } : y))} wide={false} />
  </div>)}</div></section>;
  const live = (k) => c[k].filter(x => x.enabled !== false);
  const errs = [];
  if (!live("cuts").length) errs.push(t("At least one shape must be offered."));
  if (!live("metals").length) errs.push(t("At least one metal must be offered."));
  if (!live("origins").length) errs.push(t("At least one origin must be offered."));
  if (!c.carat.options.length) errs.push(t("At least one carat weight must be offered."));
  const nums = (s) => s.split(/[,\s]+/).map(Number).filter(n => Number.isFinite(n) && n > 0);
  const pr = c.pricing || {}, setPr = (k, v) => set("pricing", { ...pr, [k]: v });
  const fresh = pr.approved && pr.updated && (Date.now() - Date.parse(pr.updated)) / 864e5 <= (pr.maxAgeDays || 120);
  return <>
    <PageHead title={t("The Line")} sub={t("What the bracelet builder offers. The 3D bracelet itself stays exactly as designed.")} />
    {errs.length > 0 && <div class="notice bad">{errs.map(e => <div>{e}</div>)}</div>}
    {list("cuts", t("Diamond shapes"))}
    {list("origins", t("Diamond origin"))}
    {list("metals", t("Metals"))}
    <section class="card form"><h2>{t("Sizes")}</h2>
      <Input label={t("Total carat weights offered")} value={c.carat.options.join(", ")} onInput={(v) => { const o = nums(v); set("carat", { ...c.carat, options: o, min: o.length ? Math.min(...o) : c.carat.min, max: o.length ? Math.max(...o) : c.carat.max }); }} hint={t("Separated by commas, e.g. 2, 4, 6, 8, 10, 15, 20. An enquiry outside {a}–{b} ct is refused.", { a: c.carat.min, b: c.carat.max })} />
      <Input label={t("Wrist sizes offered (cm)")} value={c.wrists.options.join(", ")} onInput={(v) => set("wrists", { ...c.wrists, options: nums(v) })} />
      <h3>{t("Opens on")}</h3>
      <div class="grid3">
        <Select label={t("Shape")} value={c.defaults.cut} onChange={(v) => set("defaults", { ...c.defaults, cut: v })} options={live("cuts").map(x => ({ value: x.id, label: x.en }))} />
        <Select label={t("Origin")} value={c.defaults.origin} onChange={(v) => set("defaults", { ...c.defaults, origin: v })} options={live("origins").map(x => ({ value: x.id, label: x.en }))} />
        <Select label={t("Metal")} value={c.defaults.metal} onChange={(v) => set("defaults", { ...c.defaults, metal: v })} options={live("metals").map(x => ({ value: x.id, label: x.en }))} />
        <Select label={t("Carats")} value={String(c.defaults.ct)} onChange={(v) => set("defaults", { ...c.defaults, ct: Number(v) })} options={c.carat.options.map(x => ({ value: String(x), label: x + " ct" }))} />
        <Select label={t("Wrist")} value={String(c.defaults.wrist)} onChange={(v) => set("defaults", { ...c.defaults, wrist: Number(v) })} options={c.wrists.options.map(x => ({ value: String(x), label: x + " cm" }))} />
      </div>
    </section>
    <section class="card form"><h2>{t("The estimate")}</h2>
      <p>{fresh ? <Pill tone="ok">{t("Shown on the site as an estimate")}</Pill> : <Pill>{t("Not shown: the builder says \"Price on request\"")}</Pill>}</p>
      <p class="hint">{t("The builder shows an estimate only when these figures are marked approved, carry the date they were set, and that date is recent enough. Otherwise it says the price is given on request. An estimate is never a quote; the enquiry never stores it as a price.")}</p>
      <Toggle label={t("These figures are approved by the house")} checked={!!pr.approved} onChange={(v) => setPr("approved", v)} />
      <div class="grid3"><Input type="date" label={t("Set on")} value={pr.updated || ""} onInput={(v) => setPr("updated", v)} /><Input type="number" label={t("Valid for (days)")} value={pr.maxAgeDays} onInput={(v) => setPr("maxAgeDays", v)} /><Input type="number" label={t("Round to (AED)")} value={pr.roundTo} onInput={(v) => setPr("roundTo", v)} /></div>
      <Input label={t("Where the figures come from")} value={pr.source} onInput={(v) => setPr("source", v)} />
      <h3>{t("Figures (AED)")}</h3>
      <div class="grid3">
        <Input type="number" label={t("18K gold")} value={pr.metal?.gold18k} onInput={(v) => setPr("metal", { ...pr.metal, gold18k: v })} />
        <Input type="number" label={t("Platinum")} value={pr.metal?.platinum} onInput={(v) => setPr("metal", { ...pr.metal, platinum: v })} />
        <Input type="number" label={t("Making, base")} value={pr.making?.base} onInput={(v) => setPr("making", { ...pr.making, base: v })} />
        <Input type="number" label={t("Channel setting")} value={pr.making?.channelSetting} onInput={(v) => setPr("making", { ...pr.making, channelSetting: v })} />
        <Input type="number" label={t("Per stone")} value={pr.making?.perStone} onInput={(v) => setPr("making", { ...pr.making, perStone: v })} />
      </div>
      {["lab", "natural"].map(o => <div class="grid3"><Input type="number" label={t("{o}: per carat at the reference size", { o: o === "lab" ? t("Lab-grown") : t("Natural") })} value={pr.stones?.[o]?.perCtAtRef} onInput={(v) => setPr("stones", { ...pr.stones, [o]: { ...pr.stones[o], perCtAtRef: v } })} />
        <Input type="number" step="0.01" label={t("Reference size (ct)")} value={pr.stones?.[o]?.refCt} onInput={(v) => setPr("stones", { ...pr.stones, [o]: { ...pr.stones[o], refCt: v } })} />
        <Input type="number" step="0.05" label={t("Size curve")} value={pr.stones?.[o]?.exponent} onInput={(v) => setPr("stones", { ...pr.stones, [o]: { ...pr.stones[o], exponent: v } })} /></div>)}
      <h3>{t("Other currencies")}</h3>
      <p class="hint">{t("Without approved, dated rates the estimate is shown in AED only. Rates are entered by hand; nothing is fetched live.")}</p>
      <Toggle label={t("These rates are approved")} checked={!!pr.fx?.approved} onChange={(v) => setPr("fx", { ...pr.fx, approved: v })} />
      <div class="grid4"><Input type="date" label={t("Set on")} value={pr.fx?.updated || ""} onInput={(v) => setPr("fx", { ...pr.fx, updated: v })} />
        {["USD", "EUR", "ILS"].map(k => <Input type="number" step="0.0001" label={t("1 AED in {c}", { c: k })} value={pr.fx?.perAED?.[k]} onInput={(v) => setPr("fx", { ...pr.fx, perAED: { ...(pr.fx?.perAED || {}), [k]: v } })} />)}</div>
    </section>
    <Revisions docKey="configurator" onRestored={d.reload} compact />
    <SaveBar d={d} onPreview={() => setPrev(true)} />
    {prev && <Preview onClose={() => setPrev(false)} build={() => ({ kind: "home", configurator: c, scrollTo: "#build" })} />}
  </>;
}
