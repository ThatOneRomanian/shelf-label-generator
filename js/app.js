/* Shelf Label Generator -- UI wiring and startup.
 *
 * Loaded last: owns the DOM handles, the label form and table, the settings
 * controls, and the render cycle the other modules call back into.
 */
(function (SLG) {
  "use strict";

  var config = SLG.config;
  var state = SLG.state;
  var store = SLG.store;
  var sheet = SLG.sheet;
  var escapeHtml = SLG.util.escapeHtml;
  var fmtPrice = SLG.util.fmtPrice;
  var uid = SLG.util.uid;

  var els = {
    brand: document.getElementById("f_brand"),
    product: document.getElementById("f_product"),
    price: document.getElementById("f_price"),
    weight: document.getElementById("f_weight"),
    type: document.getElementById("f_type"),
    form: document.getElementById("labelForm"),
    formTitle: document.getElementById("formTitle"),
    btnSubmit: document.getElementById("btnSubmit"),
    btnCancelEdit: document.getElementById("btnCancelEdit"),
    tbody: document.getElementById("labelTbody"),
    emptyNote: document.getElementById("emptyNote"),
    countBadge: document.getElementById("countBadge"),
    taxRate: document.getElementById("taxRate"),
    labelSize: document.getElementById("labelSize"),
    labelFont: document.getElementById("labelFont"),
    taxNote: document.getElementById("taxNote")
  };

  function renderAll() {
    renderTable();
    sheet.render();
  }
  SLG.renderAll = renderAll;

  /* ---------------- Settings: tax rate, font, text size ---------------- */

  config.fontChoices.forEach(function (f) {
    var opt = document.createElement("option");
    opt.value = f.value; opt.textContent = f.label;
    els.labelFont.appendChild(opt);
  });
  config.sizeChoices.forEach(function (s) {
    var opt = document.createElement("option");
    opt.value = s.value; opt.textContent = s.label;
    els.labelSize.appendChild(opt);
  });

  function renderSettingsControls() {
    els.taxRate.value = state.settings.taxRate;
    els.labelFont.value = state.settings.font;
    els.labelSize.value = String(state.settings.scale);
    var rate = Number(state.settings.taxRate) || 0;
    els.taxNote.textContent = "All prices above and on the printed sheet include " + rate +
      "% tax. Enter pre-tax prices in the form below — tax is added automatically.";
    store.applySettingsToCss();
  }

  els.taxRate.addEventListener("input", function () {
    var v = parseFloat(els.taxRate.value);
    state.settings.taxRate = isNaN(v) ? 0 : v;
    store.saveSettings();
    renderSettingsControls();
    renderAll();
  });
  els.labelFont.addEventListener("change", function () {
    state.settings.font = els.labelFont.value;
    store.saveSettings();
    store.applySettingsToCss();
    sheet.refitWhenFontsReady(); // new face, new metrics
  });
  els.labelSize.addEventListener("change", function () {
    state.settings.scale = parseFloat(els.labelSize.value) || 1;
    store.saveSettings();
    store.applySettingsToCss();
    sheet.fitLabelText(); // em sizes survive the scale change, but the box didn't
  });

  /* ---------------- Label form ---------------- */

  function resetForm() {
    state.editingId = null;
    els.form.reset();
    els.type.value = "sativa";
    els.formTitle.innerHTML = "Add a Label<small>Fields marked are used on the printed tag</small>";
    els.btnSubmit.textContent = "Add Label";
    els.btnCancelEdit.hidden = true;
  }

  function startEdit(id) {
    var item = state.labels.find(function (l) { return l.id === id; });
    if (!item) return;
    state.editingId = id;
    els.brand.value = item.brand;
    els.product.value = item.product;
    els.price.value = item.price;
    els.weight.value = item.weight;
    els.type.value = item.type;
    els.formTitle.innerHTML = "Edit Label<small>Updating an existing tag</small>";
    els.btnSubmit.textContent = "Save Changes";
    els.btnCancelEdit.hidden = false;
    els.brand.focus();
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function deleteLabel(id) {
    state.labels = state.labels.filter(function (l) { return l.id !== id; });
    if (state.editingId === id) resetForm();
    store.saveLabels();
    renderAll();
  }

  els.form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = {
      brand: els.brand.value.trim(),
      product: els.product.value.trim(),
      price: parseFloat(els.price.value) || 0,
      weight: els.weight.value.trim(),
      type: els.type.value
    };
    if (!data.brand || !data.product || !data.weight) { return; }

    if (state.editingId) {
      var idx = state.labels.findIndex(function (l) { return l.id === state.editingId; });
      if (idx !== -1) state.labels[idx] = Object.assign({id: state.editingId}, data);
    } else {
      state.labels.push(Object.assign({id: uid()}, data));
    }
    store.saveLabels();
    resetForm();
    renderAll();
  });

  els.btnCancelEdit.addEventListener("click", resetForm);

  document.getElementById("btnClear").addEventListener("click", function () {
    if (!state.labels.length) return;
    if (!confirm("Remove all " + state.labels.length + " labels? This can't be undone.")) return;
    state.labels = [];
    resetForm();
    store.saveLabels();
    renderAll();
  });

  document.getElementById("btnSample").addEventListener("click", function () {
    var sample = [
      {brand: "Sticky Greens",   product: "Electric Green Frog Live Diamonds",     price: 39.04, weight: "0.95g",     type: "sativa"},
      {brand: "FOUR54",          product: "Route 66 Live Resin Cartridge",         price: 44.06, weight: "1g",        type: "sativa"},
      {brand: "Purple Hills",    product: "Live Resin Critical Punch XL AIO",      price: 46.27, weight: "1g",        type: "indica"},
      {brand: "Pistol and Paris", product: "Pink Goo Pre-Roll",                    price: 12.99, weight: "10x0.5g",   type: "indica"},
      {brand: "Truro",           product: "Cosmic Cookies Pre-Roll",               price: 9.49,  weight: "5x0.5g",    type: "hybrid"},
      {brand: "HighXotic",       product: "Royal Assembly: The Summit Pre-Roll",   price: 54.99, weight: "20x0.5g",   type: "hybrid"},
      {brand: "EastCann",        product: "Scented Marker Prerolls",               price: 18.47, weight: "3x0.5g",    type: "indica"},
      {brand: "1964",            product: "FZY Peach Live Rosin Gummies",          price: 31.58, weight: "10x1 Pack", type: "indica"},
      {brand: "Super Toast",     product: "Blue Razz Rosin Bites",                 price: 24.80, weight: "10x1 Pack", type: "sativa"},
      {brand: "Adults Only",     product: "NSFW Promiscuous Peach Sour Quickies",  price: 22.58, weight: "10x1 Pack", type: "hybrid"}
    ];
    sample.forEach(function (s) { state.labels.push(Object.assign({id: uid()}, s)); });
    store.saveLabels();
    renderAll();
  });

  /* ---------------- Label table ---------------- */

  function renderTable() {
    els.tbody.innerHTML = "";
    els.emptyNote.style.display = state.labels.length ? "none" : "block";
    state.labels.forEach(function (l) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td data-label='Brand'>" + escapeHtml(l.brand) + "</td>" +
        "<td data-label='Product'>" + escapeHtml(l.product) + "</td>" +
        "<td data-label='Price' class='num'><div class='price-cell'>" + fmtPrice(store.finalPrice(l.price)) +
          "<span class='price-cell-note'>" + fmtPrice(l.price) + " + tax</span></div></td>" +
        "<td data-label='Weight/Qty'>" + escapeHtml(l.weight) + "</td>" +
        "<td data-label='Type'><span class='chip " + escapeHtml(l.type) + "'>" + escapeHtml(l.type) + "</span></td>" +
        "<td class='row-actions' data-label=''>" +
          "<button class='small' data-edit='" + escapeHtml(l.id) + "'>Edit</button>" +
          "<button class='small danger' data-del='" + escapeHtml(l.id) + "'>Delete</button>" +
        "</td>";
      els.tbody.appendChild(tr);
    });
    els.countBadge.textContent = state.labels.length + " label" + (state.labels.length === 1 ? "" : "s");
  }

  els.tbody.addEventListener("click", function (e) {
    var editId = e.target.getAttribute("data-edit");
    var delId = e.target.getAttribute("data-del");
    if (editId) startEdit(editId);
    if (delId) deleteLabel(delId);
  });

  /* ---------------- Print buttons ---------------- */

  function doPrint() { window.print(); }
  document.getElementById("btnPrintTop").addEventListener("click", doPrint);
  document.getElementById("btnPrintFab").addEventListener("click", doPrint);

  /* ---------------- init ---------------- */

  renderSettingsControls();
  renderAll();
  sheet.refitWhenFontsReady(); // first paint may still be on the fallback face
})(window.SLG = window.SLG || {});
