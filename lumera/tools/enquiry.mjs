/* The last thing a reader presses says what it is about to do, in whichever
   language they are reading; the clocks never show a placeholder; and the
   estimate says what it is. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 120)));
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });

/* the clocks must be right before anything else has run */
const early = await p.evaluate(() => ({
  dxb: (document.getElementById("clkDXB") || {}).textContent,
  tlv: (document.getElementById("clkTLV") || {}).textContent,
  pending: document.querySelectorAll(".clock.pending").length }));
ok(/^\d{2}:\d{2}$/.test(early.dxb || "") && /^\d{2}:\d{2}$/.test(early.tlv || ""),
  `both clocks read a real time before the page script runs (${early.dxb} · ${early.tlv})`);
ok(early.pending === 0, `neither clock is left waiting (${early.pending} pending)`);
const shown = await p.evaluate(() => document.body.innerText);
ok(!/-{2}:-{2}/.test(shown), "no placeholder clock anywhere a reader can see");

await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
await p.waitForTimeout(700);
/* the two channels a house has not published a number for are hidden; unhide
   them so the label logic can be read */
await p.evaluate(() => document.querySelectorAll("#cform .chip[data-ch]").forEach(c => c.hidden = false));
const want = { Email: "Send enquiry", WhatsApp: "Continue on WhatsApp", Call: "Call SILAVU" };
for (const ch of ["WhatsApp", "Call", "Email"]) {
  await p.click(`#cform .chip[data-ch="${ch}"]`);
  await p.waitForTimeout(150);
  const got = await p.evaluate(() => ({ cta: document.getElementById("csend").textContent.trim(),
    done: document.getElementById("cdone").textContent.trim() }));
  ok(got.cta === want[ch], `${ch} → the button reads "${got.cta}"`);
  const fits = ch === "WhatsApp" ? /WhatsApp/ : ch === "Call" ? /call you back/ : /mail app/;
  ok(fits.test(got.done), `${ch} → the confirmation matches the channel`);
}
/* a change of language must not undo it */
await p.click("#cform .chip[data-ch=\"WhatsApp\"]"); await p.waitForTimeout(120);
await p.click("#langBtn", { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(350); await p.click('[data-lang="he"]', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(1300);
const he = await p.evaluate(() => document.getElementById("csend").textContent.trim());
ok(/וואטסאפ/.test(he), `the channel survives a change of language (Hebrew reads "${he}")`);
const note = await p.evaluate(() => { const n = document.querySelector(".estnote"); return n ? { text: n.textContent.trim().length, vis: n.getBoundingClientRect().height > 0 } : null; });
ok(note && note.vis && note.text > 40, `the estimate carries its condition (${note ? note.text : 0} characters, shown: ${note && note.vis})`);
ok(errs.length === 0, `no script errors (${errs[0] || ""})`);
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
