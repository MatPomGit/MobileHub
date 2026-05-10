#!/usr/bin/env node
'use strict';

/**
 * Test smoke dla layoutu mobilnego wykrywa brak krytycznych kontrolek UI
 * i blokuje regresję, w której strona traci podstawową nawigację na telefonach.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(filePath, 'utf8');

const checks = [
  { name: 'meta viewport', pattern: /<meta\s+name="viewport"[^>]*>/i },
  { name: 'panel mobilny #pullPanel', pattern: /id="pullPanel"/i },
  { name: 'uchwyt panelu #pullHandle', pattern: /id="pullHandle"/i },
  { name: 'overlay panelu #pullOverlay', pattern: /id="pullOverlay"/i },
  { name: 'zakładki page-tab-bar', pattern: /class="[^"]*page-tab-bar[^"]*"/i },
  { name: 'panel treści wiki #panel-wiki', pattern: /id="panel-wiki"/i },
  { name: 'wyszukiwarka wiki #wikiSearch', pattern: /id="wikiSearch"/i }
];

const errors = checks.filter((check) => !check.pattern.test(html));
if (errors.length > 0) {
  console.error('❌ Smoke layoutu mobilnego wykrył braki:');
  errors.forEach((error) => console.error(`  - ${error.name}`));
  process.exit(1);
}

console.log(`✅ Smoke layoutu mobilnego OK (${checks.length} reguł).`);
