# Agnes AI Usage Analytics Dashboard by Gavin & Mindrose Team

<p align="center">
  <img src="public/agnes-usage-logo.png" alt="Logo" width="128" />
</p>

A browser-side multimodal analytics dashboard for Agnes AI usage. Upload a single Agnes usage CSV and get instant text tokens, image counts, video duration, cost, requests, per-key, per-project, and trend analytics — all in your browser. No server, no upload, no signup.

> [中文版](README_zh.md)

## Sister Project

If you also analyze DeepSeek API usage, check the companion open-source project in the same tool family:

- GitHub: [DeepSeek API Usage Analyzer Repo](https://github.com/GavinCnod/deepseek-api-usage-analysis)
- Website: [DeepSeek API Usage Analyzer](https://deepseek-usage.xyz)

## How It Works

1. Export a usage CSV from Agnes AI.
2. Upload the CSV to the dashboard.
3. Review the Overview, By Project, By Key, and Trends views.
4. Everything stays in the browser and is processed locally.

## Current Scope

- **Single CSV input** — Agnes export is a single usage CSV. No ZIP extraction and no amount/cost file pairing.
- **Success-only counting** — Only rows with `Consumption Status=success` are included in analytics.
- **Four dashboard tabs** — `Overview`, `By Project`, `By Key`, `Trends`, each displaying the three co-equal core metrics (tokens / images / video).
- **Model filter** — Filter all views when the CSV contains two or more models.
- **Multi-metric sorting** — Sort project/key tables by tokens, images, video duration, requests, or cost.
- **Custom projects** — Group secret keys into your own projects with browser-local config.
- **Share cards** — Generate 1200×630 images with multimodal annotations for each dashboard tab.
- **Privacy-first** — All parsing and rendering runs locally in the browser.
- **Light/Dark themes** — Theme-aware charts, layout, and share cards.
- **Bilingual UI** — English and Chinese translations across pages and docs.

## CSV Format

The current parser expects the Agnes usage export columns below:

| Column | Meaning |
| --- | --- |
| `Type` | Usage record type (`api_call` / `image` / `video`) |
| `Secret Key Name` | Secret key label shown in the dashboard |
| `Consumption Model` | Model name |
| `Consumption Amount(cents)` | Raw charge value from Agnes export |
| `Consumption Quantity` | Text tokens (`input:123/output:45`), image count (`images:3`), or video duration (`video_seconds:180`) |
| `Consumption Time` | Call timestamp |
| `Consumption Status` | Record status, only `success` is counted |

## Key Behaviors

- `Consumption Quantity` is parsed into text tokens (`input:123/output:45`), image counts (`images:3`), or video seconds (`video_seconds:180`) depending on the row type.
- `Type` column is classified into `api_call`, `image`, `video`, or `unknown`.
- Three co-equal core metrics (tokens, images, videoSeconds) are aggregated per data grouping.
- `Consumption Amount(cents)` is aggregated into displayed cost by dividing by `100`.
- Rows with non-`success` status are ignored and surfaced as warnings.
- Empty files, missing columns, malformed amounts, and invalid timestamps raise parse errors.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

## Tech Stack

- Next.js 16 App Router with static export
- React 19
- TypeScript 5
- Tailwind CSS v4
- Papa Parse
- ECharts 6 + `echarts-for-react`
- html2canvas
- qrcode
- Vitest + Testing Library

## Release Notes

- `v0.1.1` — Refined the three-core-metric experience with relative-comparison charts in `Overview` / `Trends`, aligned share cards with static peak/lowest annotations, updated KPI wording, simplified the Hero layout, integrated the DeepSeek sister-project module with UTM-tracked cross-site links, removed legacy guideline screenshots in favor of a text-only guide, and synchronized all release-facing docs.
- `v0.1.0` — Migrated the product from the earlier DeepSeek usage-analysis project to the Agnes single-CSV workflow, removed cache-era semantics, and rewrote the UI, SEO, and docs around Agnes analytics.

## Project Notes

- App version is `0.1.1`.
- Default site URL fallback changed to `https://agnes-usage.xyz`.
- The public GitHub link changed to `https://github.com/GavinCnod/agnes-api-usage-analysis`.
- These external addresses are intentionally kept for now and are not part of this migration pass.
