/* Shelf Label Generator -- pure helpers. No DOM, no state, no side effects. */
(function (SLG) {
  "use strict";

  var config = SLG.config;

  function uid() {
    return (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : ("id" + Date.now() + Math.random().toString(16).slice(2));
  }

  // Every value that reaches innerHTML goes through this. Imported spreadsheet
  // cells are untrusted input -- a product name is free text a supplier typed.
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtPrice(p) {
    var n = Number(p);
    if (isNaN(n)) return "$0.00";
    return "$" + n.toFixed(2);
  }

  function normType(t) {
    var v = String(t || "").trim().toLowerCase();
    if (v.indexOf("sat") === 0 || v === "s") return "sativa";
    if (v.indexOf("ind") === 0 || v === "i") return "indica";
    if (v.indexOf("hyb") === 0 || v === "h") return "hybrid";
    if (config.types.indexOf(v) !== -1) return v;
    return "hybrid"; // sane fallback colour, original text still not lost elsewhere
  }

  SLG.util = {
    uid: uid,
    escapeHtml: escapeHtml,
    fmtPrice: fmtPrice,
    normType: normType
  };
})(window.SLG = window.SLG || {});
