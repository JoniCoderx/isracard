/* The house's five languages on its side pages (collection14, pieces14, about14), as on /test14/: the same menu, the same
   remembered choice (silavu-lang) and the same dictionaries (lang/<l>.json, keyed by the English, fetched only when a
   reader picks that language). Hebrew is in the page itself (data-he); Arabic and Hebrew read right to left, while the
   header keeps its places. A string a dictionary does not have stays in English rather than going blank. */
(function () {
  var html = document.documentElement, btn = document.querySelector(".lng"); if (!btn) return;
  var LANGS = [["en", "EN", "English", 0], ["he", "עב", "עברית", 1], ["fr", "FR", "Français", 0], ["ar", "AR", "العربية", 1], ["ru", "RU", "Русский", 0]];
  var icon = document.querySelector('link[rel="icon"]'), root = icon ? icon.getAttribute("href").replace(/favicon\.svg.*$/, "") : "../";
  var dicts = {}, lang = "en";
  try { var s = localStorage.getItem("silavu-lang"); if (LANGS.some(function (x) { return x[0] === s; })) lang = s; } catch (e) {}
  function def(c) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === c) return LANGS[i]; return LANGS[0]; }
  /* the vision line on About is set word by word (each word rises in turn): it is said, then set again */
  function words(el, t) { el.innerHTML = t.split(" ").map(function (w, i) { return '<span style="--i:' + i + '">' + w + "</span>"; }).join(" "); }
  function font() { if (lang !== "ar" || document.getElementById("arfont")) return;
    var l = document.createElement("link"); l.id = "arfont"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500&display=swap"; document.head.appendChild(l); }
  function paint() {
    var d = def(lang), dict = dicts[lang];
    html.lang = lang; html.dir = d[3] ? "rtl" : "ltr"; html.setAttribute("data-lang", lang);
    if (lang === "he" || lang === "ar") html.setAttribute("data-ns", ""); else html.removeAttribute("data-ns");
    [].forEach.call(document.querySelectorAll("[data-en]"), function (e) {
      if (e === btn) return;
      var en = e.getAttribute("data-en"), t = lang === "he" ? e.getAttribute("data-he") : lang === "en" ? en : (dict && dict[en] != null ? dict[en] : en);
      if (t == null) t = en;
      if (e.hasAttribute("data-words")) { if (e.getAttribute("data-shown") !== t) { words(e, t); e.setAttribute("data-shown", t); } }
      else if (e.innerHTML !== t) e.innerHTML = t;
    });
    [].forEach.call(document.querySelectorAll("[data-alt-he]"), function (e) {
      if (!e.hasAttribute("data-alt-en")) e.setAttribute("data-alt-en", e.getAttribute("alt") || e.getAttribute("aria-label") || "");
      var en = e.getAttribute("data-alt-en"), a = lang === "he" ? e.getAttribute("data-alt-he") : lang === "en" ? en : (dict && dict[en]) || en;
      if (e.tagName === "VIDEO") e.setAttribute("aria-label", a); else e.setAttribute("alt", a);
    });
    btn.textContent = d[1]; btn.setAttribute("aria-label", "Language: " + d[2]);
    font();
  }
  function set(c) {
    lang = c; try { localStorage.setItem("silavu-lang", c); } catch (e) {}
    if (c === "en" || c === "he" || dicts[c]) { paint(); return; }
    fetch(root + "lang/" + c + ".json", { cache: "force-cache" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j) dicts[c] = j; if (lang === c) paint(); }, function () { if (lang === c) paint(); });
  }
  /* the menu: the five languages under the button, the current one marked */
  var menu = document.createElement("div"); menu.className = "lng14"; menu.setAttribute("role", "menu"); menu.hidden = true;
  menu.innerHTML = LANGS.map(function (x) { return '<button type="button" role="menuitemradio" data-l="' + x[0] + '"><b>' + x[1] + "</b><span>" + x[2] + "</span></button>"; }).join("");
  document.body.appendChild(menu);
  btn.setAttribute("aria-haspopup", "menu"); btn.setAttribute("aria-expanded", "false");
  function close() { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); }
  function open() {
    [].forEach.call(menu.querySelectorAll("button"), function (b) { b.setAttribute("aria-checked", b.getAttribute("data-l") === lang ? "true" : "false"); });
    menu.hidden = false; btn.setAttribute("aria-expanded", "true");
    var r = btn.getBoundingClientRect(), w = menu.offsetWidth;
    menu.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + "px"; menu.style.top = (r.bottom + 10) + "px";
    var cur = menu.querySelector('[aria-checked="true"]'); if (cur) cur.focus({ preventScroll: true });
  }
  btn.addEventListener("click", function (e) { e.stopPropagation(); menu.hidden ? open() : close(); });
  menu.addEventListener("click", function (e) { var b = e.target.closest("button[data-l]"); if (!b) return; set(b.getAttribute("data-l")); close(); btn.focus({ preventScroll: true }); });
  document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target)) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { close(); btn.focus({ preventScroll: true }); } });
  addEventListener("scroll", function () { if (!menu.hidden) close(); }, { passive: true });
  set(lang);
})();
