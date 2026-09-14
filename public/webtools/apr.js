// webtools/apr.js — Loan APR Calculator with amortization schedule.
// Exposes global initAprTool(card). Pure math in aprCalc() — no DOM.

// Periodic compounding frequencies per year
var APR_COMPOUNDS = { monthly: 12, quarterly: 4, annually: 1 };

function aprMonthlyRate(nominalPct, compound) {
  var m = APR_COMPOUNDS[compound] || 12;
  var nom = nominalPct / 100;
  if (nom === 0) return 0;
  // Effective monthly rate derived from nominal + compounding frequency
  return Math.pow(1 + nom / m, m / 12) - 1;
}

function aprPayment(principal, monthlyRate, months) {
  if (months <= 0) return NaN;
  if (monthlyRate === 0) return principal / months;
  var d = 1 - Math.pow(1 + monthlyRate, -months);
  return principal * monthlyRate / d;
}

// True APR (effective annual %, fees treated as paid upfront):
// solve monthly rate j with  (P - fees) = pmt * (1-(1+j)^-n)/j
function aprTrueRate(principal, fees, pmt, months) {
  var net = principal - fees;
  if (net <= 0 || !(pmt > 0) || months <= 0) return NaN;
  if (fees === 0) return NaN; // caller falls back to nominal effective
  var f = function (j) {
    if (j === 0) return pmt * months - net;
    return pmt * (1 - Math.pow(1 + j, -months)) / j - net;
  };
  var lo = 0, hi = 1, mid = 0;
  if (f(lo) <= 0) return NaN; // repayments don't even cover the net advance
  for (var k = 0; k < 100; k++) {
    mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  return (Math.pow(1 + mid, 12) - 1) * 100;
}

function aprCalc(principal, nominalPct, fees, months, compound) {
  if (!(principal > 0)) return { error: "Enter a loan amount greater than 0." };
  if (!(nominalPct >= 0)) return { error: "Enter a nominal rate of 0% or more." };
  if (!(fees >= 0)) return { error: "Fees can't be negative." };
  if (!(months >= 1)) return { error: "Enter a term of at least 1 month." };
  var i = aprMonthlyRate(nominalPct, compound);
  var pmt = aprPayment(principal, i, months);
  if (!isFinite(pmt) || pmt <= 0) return { error: "Those figures don't produce a valid repayment." };
  var rows = [];
  var bal = principal, totalInterest = 0;
  for (var n = 1; n <= months; n++) {
    var interest = bal * i;
    var capital = pmt - interest;
    if (n === months) { capital = bal; }
    bal = Math.max(0, bal - capital);
    totalInterest += interest;
    rows.push({ n: n, payment: n === months ? capital + interest : pmt, interest: interest, capital: capital, balance: bal });
  }
  var totalPayable = pmt * (months - 1) + rows[months - 1].payment;
  var effNominal = (Math.pow(1 + i, 12) - 1) * 100;
  var trueApr = fees > 0 ? aprTrueRate(principal, fees, pmt, months) : effNominal;
  return {
    error: null, payment: pmt, totalInterest: totalInterest,
    totalPayable: totalPayable,
    upfrontFees: fees, trueApr: trueApr, effNominal: effNominal,
    monthlyRate: i, rows: rows,
  };
}

function aprMoney(v) {
  if (!isFinite(v)) return "—";
  return "P" + v.toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function initAprTool(card) {
  if (card.aprInitialized) return;
  card.aprInitialized = true;

  var $ = function (sel) { return card.querySelector(sel); };
  var inputs = ["#apr-principal", "#apr-rate", "#apr-fees", "#apr-term", "#apr-term-unit", "#apr-compound", "#apr-start"]
    .map($).filter(Boolean);
  var errBox = $("#apr-error");
  var t = null;

  function setError(msg) {
    if (!errBox) return;
    if (!msg) { errBox.hidden = true; errBox.textContent = ""; return; }
    errBox.hidden = false;
    errBox.textContent = msg;
  }

  function read() {
    var num = function (id) {
      var el = $(id);
      return el ? parseFloat(String(el.value).replace(/[, ]/g, "")) : NaN;
    };
    var termVal = num("#apr-term");
    var unit = $("#apr-term-unit") ? $("#apr-term-unit").value : "months";
    return {
      principal: num("#apr-principal"),
      rate: num("#apr-rate"),
      fees: num("#apr-fees") || 0,
      months: Math.round(unit === "years" ? termVal * 12 : termVal),
      compound: $("#apr-compound") ? $("#apr-compound").value : "monthly",
    };
  }

  function render() {
    var r = read();
    var res = aprCalc(r.principal, r.rate, r.fees, r.months, r.compound);
    var set = function (id, v) { var el = $(id); if (el) el.textContent = v; };
    if (res.error) {
      setError(res.error);
      ["#apr-monthly", "#apr-apr", "#apr-interest", "#apr-payable"].forEach(function (id) { set(id, "—"); });
      var tb = $("#apr-schedule");
      if (tb) tb.innerHTML = "";
      var meta = $("#apr-meta");
      if (meta) meta.textContent = "";
      return null;
    }
    setError(null);
    set("#apr-monthly", aprMoney(res.payment));
    set("#apr-apr", isFinite(res.trueApr) ? res.trueApr.toFixed(2) + "%" : "—");
    set("#apr-interest", aprMoney(res.totalInterest));
    set("#apr-payable", aprMoney(res.totalPayable + res.upfrontFees));
    var meta2 = $("#apr-meta");
    if (meta2) meta2.textContent = r.months + " monthly payments · nominal " + r.rate + "% " + r.compound + " compounding" + (res.upfrontFees ? " · P" + res.upfrontFees.toFixed(2) + " upfront fees included in APR" : "");
    var tb2 = $("#apr-schedule");
    if (tb2) {
      tb2.innerHTML = res.rows.map(function (row) {
        return "<tr><td>" + row.n + "</td><td>" + aprMoney(row.payment) + "</td><td>" +
          aprMoney(row.interest) + "</td><td>" + aprMoney(row.capital) + "</td><td>" +
          aprMoney(row.balance) + "</td></tr>";
      }).join("");
    }
    return res;
  }

  var sched = null;
  inputs.forEach(function (el) {
    el.addEventListener("input", function () {
      if (t) clearTimeout(t);
      t = setTimeout(function () { sched = render(); }, 200);
    });
    el.addEventListener("change", function () { sched = render(); });
  });

  card.querySelectorAll("[data-apr-preset]").forEach(function (b) {
    b.addEventListener("click", function () {
      var parts = (b.getAttribute("data-apr-preset") || "").split("|");
      if (parts.length < 3) return;
      var p = $("#apr-principal"), rt = $("#apr-rate"), tm = $("#apr-term"), tu = $("#apr-term-unit");
      if (p) p.value = parts[0];
      if (rt) rt.value = parts[1];
      if (tm) tm.value = parts[2];
      if (tu) tu.value = "months";
      sched = render();
    });
  });

  var csvBtn = $("#apr-csv");
  if (csvBtn) csvBtn.addEventListener("click", function () {
    var res = sched || render();
    if (!res) return;
    var start = $("#apr-start") ? $("#apr-start").value : "";
    var csv = "Month,Payment,Interest,Capital,Balance" + (start ? ",Due date" : "") + "\n";
    res.rows.forEach(function (row) {
      var line = [row.n, row.payment.toFixed(2), row.interest.toFixed(2), row.capital.toFixed(2), row.balance.toFixed(2)].join(",");
      if (start) {
        var d = new Date(start + "T00:00:00");
        d.setMonth(d.getMonth() + row.n - 1);
        line += "," + d.toISOString().slice(0, 10);
      }
      csv += line + "\n";
    });
    var blob = new Blob([csv], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "amortization-schedule.csv";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  });

  var copyBtn = $("#apr-copy");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var res = sched || render();
    if (!res || !navigator.clipboard) return;
    var r = read();
    var txt = "Loan " + aprMoney(r.principal) + " @ " + r.rate + "% nominal over " + r.months + " months: " +
      aprMoney(res.payment) + "/mo, interest " + aprMoney(res.totalInterest) +
      ", true APR " + (isFinite(res.trueApr) ? res.trueApr.toFixed(2) + "%" : "n/a") + ".";
    navigator.clipboard.writeText(txt).then(function () {
      copyBtn.textContent = "Copied!";
      setTimeout(function () { copyBtn.textContent = "Copy summary"; }, 1600);
    });
  });

  sched = render();
}
