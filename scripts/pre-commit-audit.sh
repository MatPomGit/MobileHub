#!/usr/bin/env bash
set -euo pipefail

# Szybki audyt kontraktów materiałów i wykładów live przed commitem.
node scripts/validate-live-lectures.js
node scripts/validate-material-links.js
