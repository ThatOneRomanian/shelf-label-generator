/* Shelf Label Generator -- application state and its persistence.
 *
 * localStorage only. There is no backend and there must never be one: label
 * content, prices and imported spreadsheets stay in the browser. See the CSP
 * in index.html, which enforces that rather than trusting it.
 */
(function (SLG) {
  "use strict";

  var config = SLG.config;

  function loadLabels() {
    try {
      var raw = localStorage.getItem(config.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveLabels() {
    try { localStorage.setItem(config.storageKey, JSON.stringify(state.labels)); } catch (e) {}
  }

  function loadSettings() {
    var s;
    try {
      var raw = localStorage.getItem(config.settingsKey);
      s = raw
        ? Object.assign({}, config.defaultSettings, JSON.parse(raw))
        : Object.assign({}, config.defaultSettings);
    } catch (e) { s = Object.assign({}, config.defaultSettings); }
    // A scale saved under an older sizeChoices list won't match any option,
    // which would leave the Text Size select blank. Fall back to the default.
    var known = config.sizeChoices.some(function (c) {
      return parseFloat(c.value) === parseFloat(s.scale);
    });
    if (!known) s.scale = config.defaultSettings.scale;
    return s;
  }

  function saveSettings() {
    try { localStorage.setItem(config.settingsKey, JSON.stringify(state.settings)); } catch (e) {}
  }

  function applySettingsToCss() {
    var root = document.documentElement.style;
    root.setProperty("--label-font", state.settings.font);
    root.setProperty("--label-scale", state.settings.scale);
    root.setProperty("--label-h", config.labelHeightIn + "in");
  }

  function taxMultiplier() {
    var r = Number(state.settings.taxRate);
    return 1 + (isNaN(r) ? 0 : r) / 100;
  }

  function finalPrice(basePrice) {
    return (Number(basePrice) || 0) * taxMultiplier();
  }

  var state = {
    labels: loadLabels(),
    settings: loadSettings(),
    editingId: null,
    pendingImport: null // {headers, rows, fileName}
  };

  SLG.state = state;
  SLG.store = {
    saveLabels: saveLabels,
    saveSettings: saveSettings,
    applySettingsToCss: applySettingsToCss,
    taxMultiplier: taxMultiplier,
    finalPrice: finalPrice
  };
})(window.SLG = window.SLG || {});
