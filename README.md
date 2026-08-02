# BuzzedBuds Shelf Label Generator

A free, browser-based tool for designing, importing, and printing 2-up retail shelf tags. No install, no account, no server — everything runs client-side and nothing you enter ever leaves your browser.

**[Open the live app](https://ThatOneRomanian.github.io/BuzzedBuds/)**

## Features

- **Manual entry** — add, edit, and delete labels through a simple form (Brand, Product, Price, Weight/Qty, Type).
- **CSV / Excel import** — drag in a `.csv`, `.xlsx`, or `.xls` file, map its columns to the label fields (with smart auto-detection), and import in one click.
- **Print-ready layout** — a 2-column × 8-row grid sized for standard 8.5" × 11" paper, with color-coded strain badges (Sativa = yellow, Indica = blue, Hybrid = green).
- **Local persistence** — your label list is saved to your browser's local storage, so it's still there next time you open the page.
- **Sample data** — a "Load Sample Data" button to preview the layout instantly.

## Usage

Just open `index.html` in any modern browser — locally or via the hosted link above. No build step, no dependencies to install.

`.csv` import works fully offline. `.xlsx`/`.xls` import loads [SheetJS](https://sheetjs.com/) from a CDN on first use, so that specific feature needs an internet connection.

## Privacy

This is a static, client-side-only tool. Labels you add or import are stored only in your own browser's local storage — nothing is uploaded to any server.
