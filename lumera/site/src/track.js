/* The house's own visit counter. Included only when the backend is connected
   (window.SILAVU_TRACK carries its address and mode).

   What it sends: an event name from a fixed list, the page path (never the
   query string), the referring site's host when it is another site, the
   utm_source / utm_medium / utm_campaign of the visit, the language, which
   piece, and a random session id that lasts until 30 minutes of quiet. With
   consent only: a random id kept in this browser, so a returning visit can
   be told from a new one. Never: anything typed into a form, an email or a
   phone number, a photograph, a cookie, a fingerprint.

   Modes (set by the owner in the admin):
     consent     nothing is sent until the visitor allows it (the default)
     cookieless  sessions are counted without storing anything lasting;
                 allowing adds the returning-visit id
     off         nothing at all
   A visitor's "No" stops it at once; Global Privacy Control counts as "No"
   until they say otherwise. Anyone signed in to the admin on this browser is
   never counted. */
(function () {
  "use strict";
  var C = window.SILAVU_TRACK; if (!C || !C.url || C.mode === "off") return;
  var LS = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
  var SS = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
  if (LS("silavu-staff") === "1") return;
  var he = function () { return (document.documentElement.lang || "en") === "he"; };
  var choice = function () { var c = LS("silavu-consent"); if (c) return c; return navigator.globalPrivacyControl ? "no" : null; };
  var allowed = function () { var c = choice(); return C.mode === "cookieless" ? c !== "no" : c === "yes"; };
  var rid = function (n) { var a = new Uint8Array(n); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; }); return Array.prototype.map.call(a, function (b) { return "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"[b & 63]; }).join(""); };
  var uuid = function () { return crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, function (c) { return (c ^ (Math.random() * 16) >> (c / 4)).toString(16); }); };

  /* the visit's campaign, kept for this tab only (the enquiry form reads it too) */
  (function () { var q = new URLSearchParams(location.search), u = {}; ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { var v = q.get(k); if (v) u[k] = v.slice(0, 100); });
    if (Object.keys(u).length) SS("silavu-utm", JSON.stringify(u)); })();

  function session() {
    var now = Date.now(), s = null; try { s = JSON.parse(SS("silavu-sid") || "null"); } catch (e) {}
    if (!s || now - s.t > 30 * 60 * 1000) s = { id: rid(16), t: now, n: 1 }; else s.t = now;
    SS("silavu-sid", JSON.stringify(s)); return s;
  }
  var q = [], timer = 0;
  function send(beacon) {
    if (!q.length) return; var body = JSON.stringify({ events: q.splice(0, 50) });
    try { if (beacon && navigator.sendBeacon && navigator.sendBeacon(C.url, new Blob([body], { type: "text/plain" }))) return; } catch (e) {}
    try { fetch(C.url, { method: "POST", body: body, headers: { "content-type": "text/plain" }, keepalive: true, credentials: "omit", mode: "cors" }).catch(function () {}); } catch (e) {}
  }
  function ev(name, extra) {
    if (!allowed()) return;
    var s = session(), utm = {}; try { utm = JSON.parse(SS("silavu-utm") || "{}"); } catch (e) {}
    var vid = null, ret = null;
    if (choice() === "yes") { vid = LS("silavu-vid"); ret = !!vid && !SS("silavu-new"); if (!vid) { vid = rid(16); LS("silavu-vid", vid); SS("silavu-new", "1"); } }
    var ref = ""; try { var r = document.referrer ? new URL(document.referrer) : null; if (r && r.host !== location.host) ref = r.protocol + "//" + r.host; } catch (e) {}
    var e = { id: uuid(), ts: new Date().toISOString(), name: name, sid: s.id, vid: vid, ret: ret, path: location.pathname, ref: ref, lang: document.documentElement.lang || "en" };
    for (var k in utm) e[k] = utm[k];
    for (var x in extra || {}) e[x] = extra[x];
    q.push(e); clearTimeout(timer); timer = setTimeout(function () { send(false); }, 4000);
  }

  /* the question, asked once, in the page's language; answered by a choice that sticks */
  function ask(force) {
    if ((!force && (C.mode !== "consent" || choice())) || document.getElementById("consent")) return;
    var box = document.createElement("div"); box.id = "consent"; box.className = "consent"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", he() ? "מדידת ביקורים" : "Counting visits");
    var t = function (en, hw) { return '<span data-en="' + en + '" data-he="' + hw + '">' + (he() ? hw : en) + "</span>"; };
    box.innerHTML = '<p>' + t("May SILAVU count this visit anonymously? It helps the house see which pieces people look at. No advertising, nothing shared.", "האם SILAVU יכול לספור את הביקור הזה באופן אנונימי? זה עוזר לנו לראות באילו תכשיטים מתעניינים. ללא פרסום, ללא שיתוף.")
      + ' <a href="' + (C.privacy || "privacy/") + '">' + t("Privacy", "פרטיות") + "</a></p>"
      + '<div class="cbtns"><button type="button" class="btn" data-c="no">' + t("No, thank you", "לא, תודה") + '</button><button type="button" class="btn solid" data-c="yes">' + t("Allow", "אישור") + "</button></div>";
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (!b) return; set(b.getAttribute("data-c")); box.remove(); });
    document.body.appendChild(box);
  }
  function set(c) {
    LS("silavu-consent", c);
    if (c === "no") { LS("silavu-vid", null); q.length = 0; }
    else ev("page_view");
  }
  window.__consent = { open: function () { ask(true); }, state: choice };

  /* what is counted */
  var pm = location.pathname.match(/\/pieces\/([a-z0-9-]+)\/?$/);
  ev("page_view");
  if (pm) ev("product_view", { product: pm[1] });
  document.addEventListener("click", function (e) {
    var t = e.target, a = t.closest && t.closest("a[href]");
    if (a) { var h = a.getAttribute("href") || "";
      if (/^mailto:/i.test(h)) ev("contact_click", { props: { channel: "email" } });
      else if (/^tel:/i.test(h)) ev("contact_click", { props: { channel: "phone" } });
      else if (/wa\.me\//i.test(h)) ev("contact_click", { props: { channel: "whatsapp" } }); }
    var pc = t.closest && t.closest(".pgrid .piece:not(.soon)");
    if (pc && /^p-/.test(pc.id) && !t.closest(".cnav, a.q")) ev("product_open", { product: pc.id.slice(2) });
    var cat = t.closest && t.closest(".cats .cat"); if (cat) ev("collection_filter", { props: { filter: cat.getAttribute("data-cat") } });
    if (t.closest && t.closest(".gnav, .cnav, .ppprev, .ppnext, .ppth")) ev("gallery");
    if (t.closest && t.closest("#build [data-k]") && !SS("silavu-cfg")) { SS("silavu-cfg", "1"); ev("configurator_start"); }
    var lb = t.closest && t.closest("#langmenu [data-lang], .dlang [data-lang]"); if (lb) ev("language", { props: { to: lb.getAttribute("data-lang") } });
  }, true);
  document.addEventListener("focusin", function (e) { if (e.target.closest && e.target.closest("#cform") && !SS("silavu-enq")) { SS("silavu-enq", "1"); ev("enquiry_start"); } });
  addEventListener("silavu:select", function (e) { var d = e.detail || {}; if (d.k === "line") ev("configurator_complete", { props: d.b ? { cut: d.b.cut, origin: d.b.origin, metal: d.b.metal } : {} }); });
  addEventListener("silavu:enquiry", function () { ev("enquiry_success"); send(true); });
  addEventListener("silavu:contact", function (e) { ev("contact_click", { props: { channel: (e.detail || {}).channel || "email" } }); });
  document.addEventListener("play", function (e) { if (e.target && e.target.classList && e.target.classList.contains("ppvid")) ev("film_play", pm ? { product: pm[1] } : {}); }, true);

  /* time actually spent looking: only while the tab is visible */
  var shown = document.visibilityState === "visible" ? Date.now() : 0, spent = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { if (shown) spent += Date.now() - shown; shown = 0; if (spent > 1000) { ev("engaged", { ms: Math.min(spent, 3600000) }); spent = 0; } send(true); }
    else shown = Date.now();
  });
  addEventListener("pagehide", function () { send(true); });

  /* the choice can be changed at any time, from the foot of every page */
  function start() {
    ask();
    var fb = document.querySelector(".fbot, .dfbot");
    if (fb && !fb.querySelector(".cchoice")) { var b = document.createElement("button"); b.type = "button"; b.className = "cchoice";
      b.setAttribute("data-en", "Analytics choices"); b.setAttribute("data-he", "בחירות מדידה"); b.textContent = he() ? "בחירות מדידה" : "Analytics choices";
      b.addEventListener("click", function () { window.__consent.open(); }); fb.appendChild(b); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
