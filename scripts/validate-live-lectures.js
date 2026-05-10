#!/usr/bin/env node
'use strict';

/**
 * Test wykrywa uszkodzenie struktury plików live lectures (Reveal + PDF sync)
 * i blokuje regresję, w której wykład nie renderuje slajdów albo traci zasoby startowe.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'zajecia', 'live', 'wyklady');
const files = fs.readdirSync(baseDir).filter((name) => /^w\d{2}-.+-live\.html$/.test(name)).sort();

const required = [
  { name: 'root Reveal `.reveal`', pattern: /class="reveal"/i },
  { name: 'kontener slajdów `.slides`', pattern: /class="slides[^"]*"/i },
  { name: 'atrybut data-pdf-src', pattern: /data-pdf-src="[^"]+\.pdf"/i },
  { name: 'slajd ładowania `[data-loading-slide]`', pattern: /data-loading-slide/i },
  { name: 'podpięty live-theme.css', pattern: /live-theme\.css/i },
  { name: 'podpięty live-reveal-enhancements.js', pattern: /live-reveal-enhancements\.js/i },
  { name: 'inicjalizacja renderPdfSlides', pattern: /renderPdfSlides\s*\(/i }
];

let hasError = false;
for (const file of files) {
  const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
  for (const check of required) {
    if (!check.pattern.test(content)) {
      hasError = true;
      console.error(`❌ ${file}: brak wymaganego elementu struktury: ${check.name}.`);
    }
  }
}

if (hasError) {
  console.error('\nWalidacja struktury live lectures zakończona błędami.');
  process.exit(1);
}

console.log(`✅ Walidacja struktury live lectures OK (${files.length} plików).`);
