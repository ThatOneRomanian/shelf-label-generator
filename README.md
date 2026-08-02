# Shelf Label Generator

A free, browser-based tool for designing, importing, and printing 2-up retail shelf tags. No install, no account, no server — everything runs client-side and nothing you enter ever leaves your browser.

**[Open the live app](https://ThatOneRomanian.github.io/shelf-label-generator/)**

## Features

- **Manual entry** — add, edit, and delete labels through a simple form (Brand, Product, Price, Weight/Qty, Type).
- **CSV / Excel import** — drag in a `.csv`, `.xlsx`, or `.xls` file, map its columns to the label fields (with smart auto-detection), and import in one click.
- **Print-ready layout** — a 2-column × 8-row grid sized for standard 8.5" × 11" paper, with color-coded strain badges (Sativa = yellow, Indica = blue, Hybrid = green).
- **Local persistence** — your label list is saved to your browser's local storage, so it's still there next time you open the page.
- **Sample data** — a "Load Sample Data" button to preview the layout instantly.

## Usage

Open the [hosted link above](https://ThatOneRomanian.github.io/shelf-label-generator/) in any modern browser. No install, no account, no build step.

`.csv` import works fully offline. `.xlsx`/`.xls` import loads [SheetJS](https://sheetjs.com/) from a CDN on first use, so that specific feature needs an internet connection.

## Privacy

This is a static, client-side-only tool. Labels you add or import are stored only in your own browser's local storage — nothing is uploaded to any server.

## License / Ownership

Copyright (c) 2026 ThatOneRomanian. All rights reserved.

This project is **not open source**. You're welcome to use the hosted app above for free, as-is. Copying, forking, modifying, redistributing, or rehosting the source code — or presenting it as your own work — is not permitted without prior written permission. See [LICENSE](LICENSE) for the full terms.

Have a legitimate reason to reuse or build on this? [Open an issue](https://github.com/ThatOneRomanian/shelf-label-generator/issues) to ask.
