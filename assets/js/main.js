// CardNova dev template — client-only interactions. No network, no data collection.
(function () {
  "use strict";

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var navList = document.getElementById("nav-list");
  if (toggle && navList) {
    toggle.addEventListener("click", function () {
      var open = navList.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    navList.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navList.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Loan calculator (local, illustrative math only)
  var amount = document.getElementById("amount");
  var months = document.getElementById("months");
  var amountOut = document.getElementById("amount-out");
  var monthsOut = document.getElementById("months-out");
  var monthlyOut = document.getElementById("monthly-out");
  var ANNUAL_RATE = 0.049; // sample rate only

  function fmt(n) { return Math.round(n).toLocaleString("he-IL"); }

  function recalc() {
    if (!amount || !months) return;
    var p = Number(amount.value);
    var n = Number(months.value);
    var r = ANNUAL_RATE / 12;
    var payment = r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n));
    if (amountOut) amountOut.textContent = fmt(p);
    if (monthsOut) monthsOut.textContent = n;
    if (monthlyOut) monthlyOut.textContent = "₪" + fmt(payment);
  }

  if (amount && months) {
    amount.addEventListener("input", recalc);
    months.addEventListener("input", recalc);
    recalc();
  }

  // Dashboard demo data (client-side only)
  var txBody = document.getElementById("tx-body");
  if (txBody) {
    var txs = [
      { date: "18.07", merchant: "סופרמרקט העיר", cat: "מזון", amount: -284.90 },
      { date: "17.07", merchant: "תחנת דלק צפון", cat: "דלק", amount: -212.00 },
      { date: "16.07", merchant: "בית קפה מרכז", cat: "מסעדות", amount: -46.50 },
      { date: "15.07", merchant: "חנות אלקטרוניקה", cat: "קניות", amount: -1299.00 },
      { date: "14.07", merchant: "זיכוי מועדון", cat: "זיכוי", amount: 38.20 },
      { date: "13.07", merchant: "מנוי סטרימינג", cat: "בידור", amount: -54.90 }
    ];

    var rows = txs.map(function (t) {
      var sign = t.amount < 0 ? "−" : "+";
      var val = "₪" + Math.abs(t.amount).toLocaleString("he-IL", { minimumFractionDigits: 2 });
      var color = t.amount < 0 ? "" : ' style="color:var(--accent)"';
      return "<tr><td>" + t.date + "</td><td>" + t.merchant +
        "</td><td><span class=\"tx-cat\">" + t.cat + "</span></td>" +
        "<td class=\"num\"" + color + ">" + sign + val + "</td></tr>";
    }).join("");
    txBody.innerHTML = rows;

    var spent = txs.reduce(function (s, t) { return s + (t.amount < 0 ? -t.amount : 0); }, 0);
    var LIMIT = 50000;
    var setText = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    setText("dash-balance", "₪" + spent.toLocaleString("he-IL", { minimumFractionDigits: 2 }));
    setText("dash-limit", "₪" + (LIMIT - spent).toLocaleString("he-IL"));
    setText("dash-points", (1240).toLocaleString("he-IL"));
    var bar = document.getElementById("dash-bar");
    if (bar) bar.style.width = Math.min(100, (spent / LIMIT) * 100).toFixed(1) + "%";
  }

  // Login form — demo only, never submits anywhere
  var loginForm = document.getElementById("login-form");
  var loginNote = document.getElementById("login-note");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (loginNote) loginNote.textContent = "זהו טופס דמו בלבד — לא נשלח ולא נשמר מידע.";
      loginForm.reset();
    });
  }
})();
