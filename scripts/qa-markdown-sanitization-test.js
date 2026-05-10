#!/usr/bin/env node
'use strict';

/**
 * Test bezpieczeństwa: sprawdza, czy payload XSS zostaje zneutralizowany.
 */
function sanitizeRenderedMarkdown(html) {
  return html
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, '')
    .replace(/\s(href|src|xlink:href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '');
}

function run() {
  const payload = '<img src="x" onerror="alert(1)"><a href="javascript:alert(2)">klik</a><p>ok</p>';
  const sanitized = sanitizeRenderedMarkdown(payload);

  if (/onerror\s*=|javascript:/i.test(sanitized)) {
    console.error('❌ Test XSS nie powiódł się. Niebezpieczny payload nadal obecny.');
    process.exit(1);
  }

  console.log('✅ Test XSS zakończony sukcesem. Payload został zneutralizowany.');
}

run();
