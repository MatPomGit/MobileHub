#!/usr/bin/env bash
set -euo pipefail

stage() {
  local name="$1"
  shift

  echo ""
  echo "▶ [QA] ${name}"
  if "$@"; then
    echo "✔ [QA] ${name} — OK"
  else
    local exit_code=$?
    echo "✖ [QA] ${name} — FAILED (exit ${exit_code})"
    echo "✖ [QA] Przerywam kolejne etapy (fail-fast)."
    exit "${exit_code}"
  fi
}

run_smoke_e2e() {
  if [[ "${CI:-}" == "true" ]]; then
    npm run test:e2e:smoke:ci
  else
    npm run test:e2e:smoke
  fi
}

# Jeden punkt wejścia QA dla local + CI.
stage "Walidacja struktury repozytorium" python3 scripts/validate-repository-structure.py
stage "Walidacja postępu scrollowania" node scripts/validate-scroll-progress.js
stage "Walidacja danych materiałów (kontrakty + ścieżki)" node scripts/validate-material-links.js
stage "Walidacja danych wykładów live" node scripts/validate-live-lectures.js
stage "Walidacja smoke layoutu mobilnego" node scripts/validate-mobile-layout-smoke.js
stage "Testy jednostkowe" node --test tests/*.unit.test.js
stage "Smoke E2E (lokalnie/CI)" run_smoke_e2e
