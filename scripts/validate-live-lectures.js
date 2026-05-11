#!/usr/bin/env node
'use strict';

/**
 * Audytuje kontrakt struktury live lecture dla trybu PDF sync (1:1 z materiałem źródłowym).
 * Walidacja wymaga zarówno elementów renderowania PDF, jak i scaffoldu kontraktu dydaktycznego.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'zajecia', 'live', 'wyklady');
const files = fs.readdirSync(baseDir).filter((name) => /^w\d{2}-.+-live\.html$/.test(name)).sort();

const required = [
  { name: 'root Reveal `.reveal`', pattern: /class="reveal"/i },
  { name: 'kontener slajdów `.slides`', pattern: /class="slides[^"]*"/i },
  { name: 'tryb pdf-sync', pattern: /data-lecture-template="pdf-sync"/i },
  { name: 'źródło PDF', pattern: /data-pdf-src="[^\"]+\.pdf"/i },
  { name: 'slajd ładowania', pattern: /data-loading-slide/i },
  { name: 'scaffold walidatora', pattern: /data-validator-scaffold/i },
  { name: 'manifest kontraktu', pattern: /data-live-contract/i },
  { name: 'renderPdfSlides', pattern: /renderPdfSlides\s*\(/i },
  { name: 'live-theme.css', pattern: /live-theme\.css/i },
  { name: 'live-reveal-enhancements.js', pattern: /live-reveal-enhancements\.js/i }
];

const requiredSections = ['cele-efekty', 'case-study', 'najczestsze-bledy', 'quiz'];
const requiredComponents = ['info-card', 'comparison-grid', 'timeline', 'callout', 'quiz-checkpoint'];

let hasError = false;
for (const file of files) {
  const content = fs.readFileSync(path.join(baseDir, file), 'utf8');

  for (const check of required) {
    if (!check.pattern.test(content)) {
      hasError = true;
      console.error(`❌ ${file}: brak wymaganego elementu kontraktu: ${check.name}.`);
    }
  }

  for (const section of requiredSections) {
    if (!content.includes(`data-section="${section}"`)) {
      hasError = true;
      console.error(`❌ ${file}: brak sekcji kontraktu: ${section}.`);
    }
  }

  for (const component of requiredComponents) {
    if (!content.includes(component)) {
      hasError = true;
      console.error(`❌ ${file}: brak komponentu kontraktu: ${component}.`);
    }
  }

  const coreSlidesCount = (content.match(/data-section="rdzen-wiedzy"/g) || []).length;
  if (coreSlidesCount < 3) {
    hasError = true;
    console.error(`❌ ${file}: zbyt mało pozycji rdzenia wiedzy (wymagane min. 3, znalezione: ${coreSlidesCount}).`);
  }
}

if (hasError) {
  console.error('\nWalidacja kontraktu live lectures zakończona błędami.');
  process.exit(1);
}

console.log(`✅ Walidacja kontraktu live lectures OK (${files.length} plików).`);
