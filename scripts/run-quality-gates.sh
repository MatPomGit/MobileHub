#!/usr/bin/env bash
set -euo pipefail

# Runner agreguje wszystkie walidacje jakości i blokuje merge przy regresji UX/PWA.
node scripts/validate-scroll-progress.js
node scripts/validate-live-lectures.js
node scripts/validate-mobile-layout-smoke.js
node scripts/validate-material-links.js
npx playwright test
