// The admin speaks English and Hebrew. Every label is written in English in
// the code and looked up in the Hebrew dictionary (he.js); a label with no
// Hebrew yet falls back to English. Hebrew also turns the whole workspace
// right-to-left.
import { HE } from "./he.js";

let lang = "en";
try { lang = localStorage.getItem("silavu-admin-lang") || ((navigator.language || "").startsWith("he") ? "he" : "en"); } catch (e) {}
const listeners = new Set();

export function t(s, vars) {
  let out = lang === "he" && HE[s] ? HE[s] : s;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return out;
}
export const getLang = () => lang;
export function setLang(l) {
  lang = l === "he" ? "he" : "en";
  try { localStorage.setItem("silavu-admin-lang", lang); } catch (e) {}
  document.documentElement.lang = lang; document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  listeners.forEach(f => f(lang));
}
export const onLang = (f) => { listeners.add(f); return () => listeners.delete(f); };
document.documentElement.lang = lang; document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
