# Automation Web Test — Klik Indomaret

End-to-end browser test automation for [klikindomaret.com](https://www.klikindomaret.com/), built with **Playwright + TypeScript** and run on **GitHub Actions**.

## What it tests

Automated shopping flow against the live production site:

1. Open the storefront and pass the Cloudflare security check
2. Dismiss popups / modals on page load
3. Browse the meta category **Makanan**
4. Open the sub-category **Madu**
5. Select the first product (handles lazy-loaded product lists)
6. Open the product detail page and click **Keranjang**
7. Verify that the add-to-cart action produced a visible cart indicator

## Why this repo is interesting

The target site sits behind **Cloudflare bot protection**, which breaks most naive automation. The suite handles it explicitly:

- `tungguLolosCloudflare()` — polls the challenge page for up to 90 seconds until human verification finishes
- `gotoAman()` — retries navigation up to 3 times to survive interrupted page loads
- Real Chrome channel (`channel: 'chrome'`) plus `--disable-blink-features=AutomationControlled`
- **Headed locally** (a human clears the challenge) vs **headless in CI**
- Scroll loop for lazy-loaded product lists, popup dismissal, and navigation race guards (`waitForURL` + `waitForLoadState`)

## Stack

| Piece | Detail |
|---|---|
| Runner | Playwright Test `1.64` |
| Language | TypeScript |
| Browsers | Chromium, Firefox, WebKit |
| Reporting | HTML report + list reporter, trace on first retry, screenshot on failure |
| CI | GitHub Actions: `npm ci` → install browsers → run tests → upload `playwright-report/` artifact (30 days) |

## Run locally

```bash
npm ci
npx playwright install --with-deps
npm run test:headed -- --project=chromium
npm run report
```

> The Klik Indomaret test runs **headed** locally so the Cloudflare challenge can be cleared manually.

## CI note

`tests/klikindomaret.spec.ts` is **skipped on CI** — Cloudflare blocks the GitHub Actions IP range, so the challenge can never be cleared from a runner. CI still runs the rest of the suite and archives the HTML report on every push. The skip is intentional and documented in the spec file.

## Repo structure

```
.github/workflows/playwright.yml   CI pipeline (install → test → upload report)
tests/klikindomaret.spec.ts        the actual e-commerce flow test
tests/example.spec.ts              removed: was untouched Playwright scaffold
playwright.config.ts               multi-browser config, Cloudflare workarounds
```

## Known limitation

The step-7 cart indicator uses a **loose union selector** (badge, mini-cart, success toast) so it survives minor markup changes. If it ever fails, tighten the selector in `tests/klikindomaret.spec.ts` to the current cart badge markup and check the failure screenshot in `test-results/`.
