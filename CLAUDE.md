# Shelf Label Generator

A free browser tool for designing, importing and printing 2-up retail shelf
tags. Published at
[ThatOneRomanian.github.io/shelf-label-generator](https://ThatOneRomanian.github.io/shelf-label-generator/)
via GitHub Pages.

**No build step, no bundler, no framework, no package.json, no server.** Keep it
that way — the lack of a toolchain is a feature, not an oversight. The project
was a single `index.html` until it outgrew it; it is now markup, one stylesheet
and six plain scripts, still with nothing to install and nothing to compile.

```
index.html        markup only, plus the CSP and the asset <link>/<script> tags
css/styles.css    every style
js/config.js      constants: storage keys, label geometry, font/size choices
js/util.js        pure helpers (escapeHtml, fmtPrice, normType, uid)
js/store.js       state + localStorage persistence
js/sheet.js       label markup, pagination, autofit, print-preview scaling
js/importer.js    CSV/XLSX parsing and the column-mapping modal
js/app.js         DOM wiring, form, table, settings, init
```

Scripts are **classic scripts sharing one `window.SLG` namespace**, loaded in
dependency order (`config → util → store → sheet → importer → app`).
Deliberately not ES modules: `type="module"` is fetched with CORS, which
`file://` cannot satisfy, and opening `index.html` straight off disk is the
documented way to work on this. Don't convert them without solving that first.

## The constraint that defines this project

User data never leaves the browser. Label content, imported spreadsheets and
pricing are processed entirely client-side; there is no backend to send them to
and there must never be one. **Any change that introduces a network call
carrying user input breaks the core promise on the README and the live page.**

That promise is now *enforced*, not just documented: the CSP in `index.html`
sets `connect-src 'none'`, so no `fetch`, XHR or WebSocket can leave the page at
all. If you ever need to add one, you are breaking the core promise — stop and
say so rather than editing the CSP.

Be precise about what that does and doesn't mean today: the page still loads
three *external assets* — Google Fonts (`fonts.googleapis.com`,
`fonts.gstatic.com`) and the SheetJS library from `cdn.sheetjs.com`, injected on
demand in `js/importer.js` for spreadsheet import. Those are third-party
requests that reveal the visitor's IP and referrer to Google and the CDN, even
though no label data is transmitted. If the privacy claim is ever tightened,
self-hosting those two assets is the fix.

**Known gap:** the SheetJS URL is `xlsx-latest`, a rolling tag, so it cannot
carry an SRI hash and whatever that CDN serves runs with full access to the
imported spreadsheet. `connect-src 'none'` blocks the obvious exfiltration path
but not every one. Pinning a version plus `integrity`, or vendoring the library,
is the fix.

## Working on it

- Open `index.html` directly in a browser; there is nothing to run or install.
- Printing is the actual product surface — verify changes in the browser's print
  preview at the real 2-up layout, not just on screen.
- Label geometry is driven by one constant: `config.labelHeightIn`. Rows per
  sheet and the CSS grid both derive from it. Don't hardcode a row count.
- Autofit in `js/sheet.js` measures real layout. Its fit tests depend on the
  fitted fields being `width:max-content` capped at their column — change that
  CSS and the tests silently stop firing.
- If it outgrows this structure, say so before adding a bundler; don't quietly
  add a build step.
