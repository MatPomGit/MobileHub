'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'zajecia', 'live', 'wyklady');
const files = fs.readdirSync(baseDir).filter(name => /^w\d{2}-.+-live\.html$/.test(name)).sort();

const required = [
  { name: 'Cele i efekty uczenia', pattern: /Cele i efekty uczenia/i },
  { name: 'Case study', pattern: /Case study \/ praktyka inżynierska/i },
  { name: 'Najczęstsze błędy', pattern: /Najczęstsze błędy/i },
  { name: 'Quiz', pattern: /Pytania kontrolne \+ mini quiz/i },
  { name: 'info-card', pattern: /class="[^"]*info-card[^"]*"/i },
  { name: 'comparison-grid', pattern: /class="[^"]*comparison-grid[^"]*"/i },
  { name: 'timeline', pattern: /class="[^"]*timeline[^"]*"/i },
  { name: 'callout', pattern: /class="[^"]*callout[^"]*"/i },
  { name: 'quiz-checkpoint', pattern: /class="[^"]*quiz-checkpoint[^"]*"/i },
  { name: 'co najmniej 3 slajdy rdzenia', pattern: /(class="[^"]*knowledge-slide[^"]*"[\s\S]*?){3,}/i }
];

let hasError = false;

for (const file of files) {
  const fullPath = path.join(baseDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');

  if (/Najważniejsze pojęcia/i.test(content)) {
    hasError = true;
    console.error(`❌ ${file}: znaleziono placeholder "Najważniejsze pojęcia".`);
  }

  for (const check of required) {
    if (!check.pattern.test(content)) {
      hasError = true;
      console.error(`❌ ${file}: brak wymaganego bloku: ${check.name}.`);
    }
  }

  if (!hasError) {
    // brak
  }
}

if (hasError) {
  console.error('\nWalidacja wykładów live zakończona błędami.');
  process.exit(1);
}

console.log(`✅ Walidacja OK (${files.length} wykładów).`);
