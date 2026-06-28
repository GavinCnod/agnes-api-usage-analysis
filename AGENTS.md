<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Agnes AI Usage Analytics Dashboard by Gavin & Mindrose Team

A browser-side dashboard for Agnes AI usage analytics. Users upload a single Agnes usage CSV and get instant cost, token, request, per-key, per-project, and trend analytics. Everything runs client-side — no server, no upload, no database.

Strictly follows an Apple-minimalist design language: cold gray paper-texture backgrounds, ample whitespace, full-width modules, thin horizontal dividers, subtle rounded corners, and diffuse shadows. Full light/dark theme support is driven by CSS custom properties.

**Version**: `0.1.0`

## Locked Product Decisions

- Input is **one Agnes usage CSV**.
- Do **not** implement ZIP extraction or amount/cost dual-file pairing.
- Count **only** rows with `Consumption Status=success`.
- Dashboard tabs are only:
  - `overview`
  - `projects`
  - `keys`
  - `trends`
- Cache analytics are removed because the Agnes CSV does not expose cache fields.
- Existing public external links and default site URL fallback remain:
  - GitHub: `https://github.com/GavinCnod/deepseek-api-usage-analysis`
  - Site URL fallback: `https://deepseek-usage.xyz`

## Architecture

```text
src/
├── app/
│   ├── layout.tsx            # Global metadata, JSON-LD, providers, GA injection
│   ├── page.tsx              # Entry → <Dashboard />
│   ├── guideline/page.tsx    # User guide route with independent metadata
│   ├── privacy/page.tsx      # Privacy page route with independent metadata
│   ├── terms/page.tsx        # Terms page route with independent metadata
│   ├── changelog/page.tsx    # Changelog route with independent metadata
│   ├── globals.css           # Tailwind v4 + CSS variables + global effects
│   ├── robots.ts             # Build-time robots.txt
│   └── sitemap.ts            # Build-time sitemap.xml
├── components/
│   ├── Dashboard.tsx         # Landing vs dashboard switch, tab nav, model filter
│   ├── LandingPage.tsx       # Pre-upload landing page
│   ├── DropZone.tsx          # Single CSV uploader with 50MB limit
│   ├── OverviewView.tsx      # Overview charts
│   ├── ProjectView.tsx       # By project aggregation/config
│   ├── KeyView.tsx           # Per-key table
│   ├── TrendsView.tsx        # Trend chart view
│   ├── ShareButton.tsx       # Opens share modal
│   ├── ShareModal.tsx        # Share preview/copy/download dialog
│   ├── ShareCard.tsx         # 1200x630 share image renderer
│   ├── TitleBar.tsx          # Shared top navigation
│   ├── FooterBar.tsx         # Shared footer
│   ├── GuidelinePage.tsx     # Agnes user guide
│   ├── PrivacyPage.tsx       # Privacy policy
│   ├── TermsPage.tsx         # Terms of use
│   ├── ChangelogPage.tsx     # Agnes changelog
│   └── *Content.tsx          # <noscript> SEO fallback content
├── i18n/
│   ├── I18nProvider.tsx
│   └── translations.ts
└── lib/
    ├── parser.ts             # Agnes CSV parser
    ├── types.ts              # Agnes parse/result types
    ├── DataContext.tsx       # Result/error/loading/model filter state
    ├── upload.ts             # Single CSV read + file size constant
    ├── ProjectConfigContext.tsx
    ├── shareCardData.ts
    ├── format.ts
    ├── schema.ts
    ├── analytics.ts
    └── ThemeContext.tsx
```

## Agnes CSV Format

Required columns in the uploaded CSV:

- `Type`
- `Secret Key Name`
- `Consumption Model`
- `Consumption Amount(cents)`
- `Consumption Quantity`
- `Consumption Time`
- `Consumption Status`

Current parser behavior:

- Parses `Consumption Quantity` like `input:123/output:45`
- Converts `Consumption Amount(cents)` to displayed cost by dividing by `100`
- Groups daily data by date + model + secret key name
- Ignores all rows whose status is not `success`
- Returns warnings for partial quantity parsing and ignored statuses

## Key Technical Notes

- Static export via `next.config.ts`
- Next.js 16 + React 19
- TypeScript strict mode
- Tailwind CSS v4
- Papa Parse for CSV parsing
- ECharts 6 via `echarts-for-react`
- html2canvas + qrcode for share cards
- Vitest + Testing Library for tests
- No JSZip in current product scope

## Theme / UI Rules

- All colors must come from CSS custom properties in `src/app/globals.css`
- Do not hardcode theme colors in normal components unless chart libraries require computed values
- Reuse the existing Apple-minimalist spacing and divider patterns
- Keep share cards, landing page, and legal pages visually aligned with the current design language

## i18n Rules

- Add strings to both `en` and `zh`
- Keep translation keys flat at the `group.key` level
- Do not reintroduce `cache` translation groups or cache tabs unless the product requirements change

## Common Tasks

- **Adjust parser behavior**: edit `src/lib/parser.ts` and, when needed, `src/lib/types.ts`
- **Change upload behavior**: edit `src/components/DropZone.tsx`, `src/components/Dashboard.tsx`, and `src/lib/upload.ts`
- **Add or modify project grouping**: edit `src/components/ProjectView.tsx` and `src/lib/ProjectConfigContext.tsx`
- **Update metadata/schema**: edit `src/app/layout.tsx`, sub-page `page.tsx` files, and `src/lib/schema.ts`
- **Update user-visible copy**: edit `src/i18n/translations.ts`
- **Update public docs**: edit `README.md`, `README_zh.md`, `public/llms.txt`, and `public/llms-full.txt`
- **Update share cards**: edit `src/components/ShareModal.tsx`, `src/components/ShareCard.tsx`, and `src/lib/shareCardData.ts`

## Verification Checklist

- Run `npm test`
- Run `npm run build`
- Use `sampleData/2026-06-28 10_45_38.csv` for a manual upload check
- Confirm there are only four tabs in the dashboard
- Confirm non-CSV, multi-file, and oversized-file flows show clear errors
- Confirm metadata uses the correct Agnes titles and the real OG image filename

## Notes For Future Agents

- Do not reintroduce DeepSeek dual-file logic unless explicitly requested by the user
- Do not replace the preserved external links/domain without user approval
- When in doubt, treat `src/lib/schema.ts`, `src/i18n/translations.ts`, and `src/lib/parser.ts` as the main truth sources for product behavior
