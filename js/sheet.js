/* Shelf Label Generator -- the print sheet: label markup, pagination, autofit.
 *
 * This is the actual product surface. Verify changes in the browser's print
 * preview at the real 2-up layout, not just on screen.
 */
(function (SLG) {
  "use strict";

  var config = SLG.config;
  var state = SLG.state;
  var store = SLG.store;
  var escapeHtml = SLG.util.escapeHtml;
  var fmtPrice = SLG.util.fmtPrice;
  var normType = SLG.util.normType;

  var sheetPages = document.getElementById("sheetPages");

  /* ---------------- Label markup ---------------- */

  function labelCellHtml(l) {
    if (!l) {
      return "<div class='label-cell blank'>" +
        "<div class='cell-details'></div>" +
        "<div class='cell-price'></div>" +
        "<div class='cell-badge'></div>" +
      "</div>";
    }
    var t = normType(l.type);
    return "<div class='label-cell'>" +
      "<div class='cell-details'>" +
        // .details-inner exists so autofit can measure the brand+desc block's
        // natural height. .cell-details centres its content, and centred flex
        // overflow is clipped at both ends, which makes its own scrollHeight
        // unreliable as a fit test.
        "<div class='details-inner'>" +
          "<div class='brand'>" + escapeHtml(l.brand) + "</div>" +
          "<div class='desc'>" + escapeHtml(l.product) + "</div>" +
        "</div>" +
      "</div>" +
      "<div class='cell-price'>" +
        "<div class='price-main'>" + fmtPrice(store.finalPrice(l.price)) + "</div>" +
        "<div class='price-note'>tax incl.</div>" +
      "</div>" +
      "<div class='cell-badge type-" + t + "'>" +
        "<div class='qty'>" + escapeHtml(l.weight) + "</div>" +
        "<div class='type'>" + escapeHtml(t) + "</div>" +
      "</div>" +
    "</div>";
  }

  /* ---------------- Pagination ---------------- */

  function render() {
    sheetPages.innerHTML = "";
    if (!state.labels.length) {
      sheetPages.innerHTML = "<p class='empty-note'>Nothing to print yet.</p>";
      return;
    }
    var perPage = config.labelsPerPage;
    var pageCount = Math.ceil(state.labels.length / perPage);
    for (var p = 0; p < pageCount; p++) {
      var slice = state.labels.slice(p * perPage, (p + 1) * perPage);
      while (slice.length < perPage) slice.push(null);
      var frame = document.createElement("div");
      frame.className = "sheet-page-frame";
      var page = document.createElement("div");
      page.className = "sheet-page";
      page.innerHTML = "<div class='label-grid'>" + slice.map(labelCellHtml).join("") + "</div>";
      frame.appendChild(page);
      sheetPages.appendChild(frame);
    }
    fitLabelText();
    fitToViewport();
  }

  /* ---------------- Autofit: shrink oversized label text ---------------- */

  // Sizes are em against .label-cell's font-size, so a fitted value stays
  // correct across a --label-scale change (the box is fixed, though, so a
  // refit is still needed -- see the settings handlers in app.js).
  //
  // The floors are set by what still reproduces on paper at scale 1 (~7.5pt),
  // not by what merely fits: past the floor we truncate rather than shrink
  // into an unreadable smudge. Price gets the lowest floor because a small
  // correct price beats a clipped wrong-looking one.
  var FIT_WIDTH = [
    {sel: ".brand",      max: 1.45, min: 1.00},
    {sel: ".price-main", max: 1.40, min: 0.80},
    {sel: ".qty",        max: 1.30, min: 0.85}
  ];
  var DESC_MAX = 1.25, DESC_MIN = 0.85;
  var FIT_STEPS = 7; // ~0.005em resolution over the widest range

  // Single-line fields: shrink until the text stops overflowing. Exact only
  // because these are width:max-content capped at the column -- see the CSS.
  function fitWidth(el, max, min) {
    el.style.fontSize = max + "em";
    if (el.scrollWidth <= el.clientWidth) return; // common case, no search
    var lo = min, hi = max;
    for (var i = 0; i < FIT_STEPS; i++) {
      var mid = (lo + hi) / 2;
      el.style.fontSize = mid + "em";
      if (el.scrollWidth <= el.clientWidth) lo = mid; else hi = mid;
    }
    el.style.fontSize = lo + "em";
  }

  // Description: wraps freely, so fit on height against the space the brand
  // leaves behind rather than on width.
  function fitDesc(desc, inner, box) {
    desc.classList.remove("fit-clipped");
    desc.style.webkitLineClamp = "";
    desc.style.lineClamp = "";
    desc.style.fontSize = DESC_MAX + "em";
    // clientHeight counts the padding the inner block has to sit inside, so
    // measure against the content box or the text creeps under the border.
    var boxStyle = getComputedStyle(box);
    var boxH = box.clientHeight
      - (parseFloat(boxStyle.paddingTop) || 0)
      - (parseFloat(boxStyle.paddingBottom) || 0);
    if (inner.offsetHeight <= boxH) return;
    var lo = DESC_MIN, hi = DESC_MAX;
    for (var i = 0; i < FIT_STEPS; i++) {
      var mid = (lo + hi) / 2;
      desc.style.fontSize = mid + "em";
      if (inner.offsetHeight <= boxH) lo = mid; else hi = mid;
    }
    desc.style.fontSize = lo + "em";
    if (inner.offsetHeight <= boxH) return;
    // Bottomed out: clamp to the whole lines that actually fit underneath.
    var lineHeight = parseFloat(getComputedStyle(desc).lineHeight) || 1;
    var available = boxH - (inner.offsetHeight - desc.offsetHeight);
    var lines = String(Math.max(1, Math.floor(available / lineHeight)));
    desc.classList.add("fit-clipped");
    desc.style.webkitLineClamp = lines;
    desc.style.lineClamp = lines;
  }

  function fitLabelText() {
    sheetPages.querySelectorAll(".label-cell").forEach(function (cell) {
      FIT_WIDTH.forEach(function (rule) {
        var el = cell.querySelector(rule.sel);
        if (el) fitWidth(el, rule.max, rule.min);
      });
      var desc = cell.querySelector(".desc");
      var inner = cell.querySelector(".details-inner");
      var box = cell.querySelector(".cell-details");
      if (desc && inner && box) fitDesc(desc, inner, box);
    });
  }

  // Text metrics change when a webfont finishes loading, and every fitted size
  // was measured against whatever was rendering at the time. Refit once the
  // font settles or the print comes out sized for the fallback face.
  function refitWhenFontsReady() {
    fitLabelText();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLabelText);
  }

  /* ---------------- Screen preview scaling ---------------- */

  // On narrow screens, scale the (fixed 8.5x11in) preview down to fit so the
  // whole sheet is visible at once, instead of relying on side-scrolling.
  // Print output is untouched -- @media print forces the transform back off.
  function fitToViewport() {
    var frames = sheetPages.querySelectorAll(".sheet-page-frame");
    if (!frames.length) return;
    var availableWidth = sheetPages.clientWidth;
    frames.forEach(function (frame) {
      var page = frame.querySelector(".sheet-page");
      var naturalWidth = page.offsetWidth;
      var naturalHeight = page.offsetHeight;
      var scale = Math.min(1, availableWidth / naturalWidth);
      page.style.transform = "scale(" + scale + ")";
      frame.style.width = (naturalWidth * scale) + "px";
      frame.style.height = (naturalHeight * scale) + "px";
    });
  }

  var fitResizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(fitResizeTimer);
    fitResizeTimer = setTimeout(fitToViewport, 150);
  });

  window.addEventListener("beforeprint", fitLabelText);

  SLG.sheet = {
    render: render,
    fitLabelText: fitLabelText,
    refitWhenFontsReady: refitWhenFontsReady,
    fitToViewport: fitToViewport
  };
})(window.SLG = window.SLG || {});
