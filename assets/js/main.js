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
