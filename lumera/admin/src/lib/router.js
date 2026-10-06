// Addresses live after the # so that any page of the admin can be opened
// directly, refreshed or bookmarked on GitHub Pages (which only serves files)
// and on a custom domain alike: /isracard/admin/#/products/knot.
import { useEffect, useState } from "preact/hooks";

export function parse() {
  const h = location.hash.replace(/^#\/?/, "");
  const [p, qs] = h.split("?");
  return { parts: p.split("/").filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs || "") };
}
export function useRoute() {
  const [r, set] = useState(parse());
  useEffect(() => { const f = () => set(parse()); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  return r;
}
export const go = (path) => { location.hash = "#/" + path.replace(/^\/+/, ""); };
export const href = (path) => "#/" + path.replace(/^\/+/, "");

/* leaving a page with unsaved changes asks first */
let guard = null;
export function setLeaveGuard(fn) { guard = fn; }
/* registered before any page listens, so a "stay" stops the change before the page sees it */
addEventListener("hashchange", (e) => {
  if (guard && !guard()) { e.stopImmediatePropagation(); history.replaceState(null, "", e.oldURL); }
});
addEventListener("beforeunload", (e) => { if (guard && !guard(true)) { e.preventDefault(); e.returnValue = ""; } });
