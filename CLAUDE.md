# Shelf Label Generator

A free browser tool for designing, importing and printing 2-up retail shelf
tags. Published at
[ThatOneRomanian.github.io/shelf-label-generator](https://ThatOneRomanian.github.io/shelf-label-generator/)
via GitHub Pages.

**The whole project is one file: `index.html` (~1,050 lines).** No build step, no
bundler, no framework, no package.json, no server. Keep it that way — the lack of
a toolchain is a feature, not an oversight.

## The constraint that defines this project

User data never leaves the browser. Label content, imported spreadsheets and
pricing are processed entirely client-side; there is no backend to send them to
and there must never be one. **Any change that introduces a network call
carrying user input breaks the core promise on the README and the live page.**

Be precise about what that does and doesn't mean today: the page currently loads
three *external assets* — Google Fonts (`fonts.googleapis.com`,
`fonts.gstatic.com`) and the SheetJS library from `cdn.sheetjs.com`, injected at
`index.html:901` for spreadsheet import. Those are third-party requests that
reveal the visitor's IP and referrer to Google and the CDN, even though no label
data is transmitted. If the privacy claim is ever tightened, self-hosting those
two assets is the fix.

## Working on it

- Open `index.html` directly in a browser; there is nothing to run or install.
- Printing is the actual product surface — verify changes in the browser's print
  preview at the real 2-up layout, not just on screen.
- Keep it a single file. If it genuinely outgrows that, say so before splitting;
  don't quietly add a build step.
