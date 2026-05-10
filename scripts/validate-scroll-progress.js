#!/usr/bin/env node
'use strict';

/**
 * Test wykrywa duplikację elementu `.scroll-progress` w index.html
 * i blokuje regresję powodującą podwójny pasek postępu po refaktorze layoutu.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(filePath, 'utf8');
const matches = html.match(/class="[^"]*\bscroll-progress\b[^"]*"/g) || [];

if (matches.length !== 1) {
  console.error(`❌ Oczekiwano dokładnie 1 elementu .scroll-progress, znaleziono: ${matches.length}.`);
  process.exit(1);
}

console.log('✅ Scroll progress: znaleziono dokładnie jeden element .scroll-progress.');
