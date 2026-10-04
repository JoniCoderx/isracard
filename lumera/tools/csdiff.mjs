// Computed-style diff of every element between two builds (8778 vs 8777).
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const [w, h] = (process.env.SIZE || "390x844").split("x").map(Number); const pth = process.env.P || "/about/";
const props = ["display","position","font-size","font-weight","line-height","letter-spacing","margin-top","margin-bottom","padding-top","padding-bottom","width","height","opacity","color","gap","grid-template-columns","text-transform","transform","top","left"];
const get = async port => { const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760, reducedMotion: "reduce" });
  const p = await c.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto(`http://localhost:${port}${pth}`, { waitUntil: "load" }); await p.waitForTimeout(800);
  const r = await p.evaluate(props => [...document.querySelectorAll("body *:not(style):not(script):not(link)")].map(e => { const s = getComputedStyle(e); return [e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/).join(".") : ""), props.map(k => s.getPropertyValue(k)).join("|")]; }), props);
  await c.close(); return r; };
const A = await get(8778), B = await get(8777); let n = 0;
for (let i = 0; i < Math.min(A.length, B.length); i++) if (A[i][1] !== B[i][1]) { const a = A[i][1].split("|"), bb = B[i][1].split("|"); const d = props.map((k, j) => a[j] !== bb[j] ? k + ": " + a[j] + " -> " + bb[j] : "").filter(Boolean).filter(x => !/^(width|height|top|left)/.test(x)); if (d.length && n++ < 40) console.log(A[i][0], "|", B[i][0] === A[i][0] ? "" : "(" + B[i][0] + ")", d.join("; ")); }
console.log("elements", A.length, B.length, "differing", n); await b.close();
