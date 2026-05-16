#!/usr/bin/env bash
set -euo pipefail

# Przed push sprawdzamy kompletność danych materiałów.
node scripts/validate-material-links.js
