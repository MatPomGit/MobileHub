#!/usr/bin/env bash
set -euo pipefail

# Uruchamia szybki audyt kontraktu wykładów live przed commitem.
node scripts/validate-live-lectures.js
