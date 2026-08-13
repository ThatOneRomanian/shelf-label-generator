/* Shelf Label Generator -- CSV / XLSX import and the column-mapping modal.
 *
 * Files are read with FileReader and parsed in the page. Nothing is uploaded;
 * the only network request in this file is fetching the SheetJS parser itself,
 * which carries no user data. CSV needs no network at all.
 */
(function (SLG) {
  "use strict";

  var config = SLG.config;
  var state = SLG.state;
  var store = SLG.store;
  var escapeHtml = SLG.util.escapeHtml;
  var normType = SLG.util.normType;
  var uid = SLG.util.uid;

  var fileInput = document.getElementById("fileInput");
  var dropzone = document.getElementById("dropzone");
  var mapOverlay = document.getElementById("mapOverlay");
  var mapRowsEl = document.getElementById("mapRows");
  var mapFileNameEl = document.getElementById("mapFileName");
  var mapPreviewTable = document.getElementById("mapPreviewTable");
  var mapError = document.getElementById("mapError");

  /* ---------------- File intake ---------------- */

  document.getElementById("btnImport").addEventListener("click", function () { fileInput.click(); });
  dropzone.addEventListener("click", function () { fileInput.click(); });
  dropzone.addEventListener("dragover", function (e) { e.preventDefault(); dropzone.classList.add("drag"); });
  dropzone.addEventListener("dragleave", function () { dropzone.classList.remove("drag"); });
  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("drag");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
    fileInput.value = "";
  });

  function handleFile(file) {
    var name = file.name.toLowerCase();
    if (name.endsWith(".csv")) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          openMapping(parseCSV(String(reader.result)), file.name);
        } catch (err) {
          alert("Couldn't parse that CSV file: " + err.message);
        }
      };
      reader.readAsText(file);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      loadSheetJs(function (err) {
        if (err) {
          alert("Couldn't load the Excel parser (needs an internet connection). Try exporting to CSV instead.");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var wb = XLSX.read(new Uint8Array(reader.result), {type: "array"});
            var sheet = wb.Sheets[wb.SheetNames[0]];
            var rows = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ""});
            rows = rows.filter(function (r) {
              return r.some(function (c) { return String(c).trim() !== ""; });
            });
            openMapping(rows, file.name);
          } catch (err2) {
            alert("Couldn't parse that Excel file: " + err2.message);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    } else {
      alert("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.");
    }
  }

  // Loaded on demand so the CSV path stays fully offline.
  var sheetJsLoading = null;
  function loadSheetJs(cb) {
    if (window.XLSX) return cb(null);
    if (sheetJsLoading) { sheetJsLoading.push(cb); return; }
    sheetJsLoading = [cb];
    var s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
    s.crossOrigin = "anonymous";
    s.onload = function () { sheetJsLoading.forEach(function (f) { f(null); }); sheetJsLoading = null; };
    s.onerror = function () {
      sheetJsLoading.forEach(function (f) { f(new Error("load failed")); });
      sheetJsLoading = null;
    };
    document.head.appendChild(s);
  }

  function parseCSV(text) {
    // Handles quoted fields, escaped quotes (""), commas & newlines inside quotes.
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += c;
        }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ',') { row.push(field); field = ""; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
        else { field += c; }
      }
    }
    row.push(field);
    rows.push(row);
    return rows.filter(function (r) {
      return r.some(function (c) { return String(c).trim() !== ""; });
    });
  }

  /* ---------------- Column mapping modal ---------------- */

  function guessColumn(headers, keywords, excluded) {
    // Keyword-major order: check the most specific keyword across all headers
    // before falling back to a looser one, and skip columns already claimed
    // by an earlier (higher-priority) field.
    for (var k = 0; k < keywords.length; k++) {
      for (var i = 0; i < headers.length; i++) {
        if (excluded.has(i)) continue;
        if (String(headers[i]).toLowerCase().indexOf(keywords[k]) !== -1) return i;
      }
    }
    return -1;
  }

  function openMapping(rows, fileName) {
    if (!rows.length) {
      alert("That file appears to be empty.");
      return;
    }
    var headers = rows[0].map(function (h, i) { return String(h).trim() || ("Column " + (i + 1)); });
    var dataRows = rows.slice(1);
    state.pendingImport = {headers: headers, rows: dataRows, fileName: fileName};

    mapFileNameEl.textContent = fileName;
    mapError.innerHTML = "";

    var usedColumns = new Set();
    mapRowsEl.innerHTML = config.fieldDefs.map(function (f) {
      var guess = guessColumn(headers, f.keywords, usedColumns);
      if (guess !== -1) usedColumns.add(guess);
      var options = "<option value='-1'>&mdash; None &mdash;</option>" + headers.map(function (h, i) {
        return "<option value='" + i + "'" + (i === guess ? " selected" : "") + ">" + escapeHtml(h) + "</option>";
      }).join("");
      return "<div class='map-row'>" +
        "<div class='field-name'>" + escapeHtml(f.label) + "<span>" + escapeHtml(f.hint) + "</span></div>" +
        "<select data-field='" + f.key + "'>" + options + "</select>" +
      "</div>";
    }).join("");

    var previewRows = dataRows.slice(0, 4);
    mapPreviewTable.innerHTML =
      "<tr>" + headers.map(function (h) { return "<th>" + escapeHtml(h) + "</th>"; }).join("") + "</tr>" +
      previewRows.map(function (r) {
        return "<tr>" + headers.map(function (_, i) { return "<td>" + escapeHtml(r[i]) + "</td>"; }).join("") + "</tr>";
      }).join("");

    mapOverlay.hidden = false;
  }

  document.getElementById("btnMapCancel").addEventListener("click", function () {
    mapOverlay.hidden = true;
    state.pendingImport = null;
  });

  document.getElementById("btnMapConfirm").addEventListener("click", function () {
    var pending = state.pendingImport;
    if (!pending) return;
    var mapping = {};
    mapRowsEl.querySelectorAll("select[data-field]").forEach(function (sel) {
      mapping[sel.getAttribute("data-field")] = parseInt(sel.value, 10);
    });

    if (mapping.brand === -1 || mapping.product === -1) {
      mapError.innerHTML = "<div class='error-banner'>Brand and Product Name/Details must be mapped to a column before importing.</div>";
      return;
    }

    var imported = 0;
    pending.rows.forEach(function (r) {
      var brand = mapping.brand !== -1 ? String(r[mapping.brand] || "").trim() : "";
      var product = mapping.product !== -1 ? String(r[mapping.product] || "").trim() : "";
      if (!brand && !product) return; // skip fully blank rows
      var rawPrice = mapping.price !== -1 ? String(r[mapping.price] || "") : "";
      var price = parseFloat(rawPrice.replace(/[^0-9.\-]/g, "")) || 0;
      var weight = mapping.weight !== -1 ? String(r[mapping.weight] || "").trim() : "";
      var type = mapping.type !== -1 ? normType(r[mapping.type]) : "hybrid";

      state.labels.push({
        id: uid(), brand: brand, product: product, price: price, weight: weight, type: type
      });
      imported++;
    });

    store.saveLabels();
    SLG.renderAll(); // late-bound: app.js owns the render cycle
    mapOverlay.hidden = true;
    state.pendingImport = null;
    alert("Imported " + imported + " label" + (imported === 1 ? "" : "s") + ".");
  });

  SLG.importer = {parseCSV: parseCSV, handleFile: handleFile};
})(window.SLG = window.SLG || {});
