/* Shelf Label Generator -- configuration and physical constants.
 *
 * Loaded first; every other module reads from SLG.config and none of them
 * hardcode these values. Plain script, no module system: see index.html for
 * why (file:// has to keep working).
 */
(function (SLG) {
  "use strict";

  // Label height is the input; rows per sheet is the output. Change
  // labelHeightIn and both the grid (via --label-h) and pagination follow.
  var PAGE_USABLE_H_IN = 10.5; // 11in sheet - 2 x 0.25in page padding
  var LABEL_COLS = 2;
  var LABEL_H_IN = 1;

  var FONT_CHOICES = [
    {value: "Arial, Helvetica, sans-serif", label: "Arial (Default)"},
    {value: "'Helvetica Neue', Helvetica, Arial, sans-serif", label: "Helvetica"},
    {value: "Verdana, Geneva, sans-serif", label: "Verdana"},
    {value: "Tahoma, Geneva, sans-serif", label: "Tahoma"},
    {value: "'Trebuchet MS', sans-serif", label: "Trebuchet MS"},
    {value: "'Inter', Arial, sans-serif", label: "Inter"},
    {value: "Georgia, 'Times New Roman', serif", label: "Georgia (Serif)"},
    {value: "'Times New Roman', Times, serif", label: "Times New Roman (Serif)"},
    {value: "'Courier New', Courier, monospace", label: "Courier New (Mono)"}
  ];

  var SIZE_CHOICES = [
    {value: "0.8", label: "Small"},
    {value: "0.9", label: "Medium"},
    {value: "1", label: "Large (Default)"},
    {value: "1.12", label: "Extra Large"}
  ];

  SLG.config = {
    storageKey: "shelf_label_generator_v1",
    settingsKey: "shelf_label_generator_settings_v1",

    pageUsableHeightIn: PAGE_USABLE_H_IN,
    labelCols: LABEL_COLS,
    labelHeightIn: LABEL_H_IN,
    labelsPerPage: Math.floor(PAGE_USABLE_H_IN / LABEL_H_IN) * LABEL_COLS,

    // Just the set of types normType may return. The colours live in CSS
    // (.cell-badge.type-*, .chip.*), not here.
    types: ["sativa", "indica", "hybrid"],

    fontChoices: FONT_CHOICES,
    sizeChoices: SIZE_CHOICES,
    defaultSettings: {taxRate: 13, font: FONT_CHOICES[0].value, scale: 1},

    // Import column-mapping fields, in priority order: an earlier field claims
    // a matching column before a later one gets to look at it.
    fieldDefs: [
      {key: "brand",   label: "Brand",                hint: "e.g. FOUR54",              keywords: ["brand"]},
      {key: "product", label: "Product Name/Details", hint: "e.g. Route 66 Pre-Roll",   keywords: ["product", "description", "name", "item", "title"]},
      {key: "price",   label: "Price (before tax)",   hint: "e.g. 39.04",               keywords: ["price", "cost", "msrp", "retail"]},
      {key: "weight",  label: "Weight / Qty",         hint: "e.g. 1g, 5x0.5g",          keywords: ["weight", "qty", "quantity", "size", "wt"]},
      {key: "type",    label: "Strain / Type",        hint: "sativa / indica / hybrid", keywords: ["strain", "type", "category", "subcategory"]}
    ]
  };
})(window.SLG = window.SLG || {});
