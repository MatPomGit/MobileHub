#!/usr/bin/env node

'use strict';

/**
 * Walidator spójności konfiguracji wiki:
 * - unikalność slugów,
 * - kompletność metadanych,
 * - istnienie plików markdown,
 * - spójność kategorii i odwołań.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const configPath = path.join(repoRoot, 'pam-wiki-config.json');

/**
 * Zwraca listę błędów walidacji konfiguracji.
 */
function validateConfig(config) {
  const errors = [];
  const { articles = {}, metadata = {}, categories = [] } = config;

  const articleSlugs = Object.keys(articles);
  const metadataSlugs = Object.keys(metadata);

  for (const slug of articleSlugs) {
    const filePath = articles[slug];
    if (typeof filePath !== 'string' || filePath.trim() === '') {
      errors.push(`Artykuł "${slug}" ma nieprawidłową ścieżkę pliku.`);
      continue;
    }

    const absoluteFilePath = path.join(repoRoot, filePath);
    if (!fs.existsSync(absoluteFilePath)) {
      errors.push(`Artykuł "${slug}" wskazuje na nieistniejący plik: ${filePath}`);
    }

    const meta = metadata[slug];
    if (!meta) {
      errors.push(`Brak metadanych dla sluga "${slug}".`);
      continue;
    }

    if (!meta.title || !meta.category || !meta.icon) {
      errors.push(`Niekompletne metadane dla sluga "${slug}" (wymagane: title, category, icon).`);
    }
  }

  for (const slug of metadataSlugs) {
    if (!articles[slug] && slug !== 'robohub-external') {
      errors.push(`Metadane "${slug}" nie mają odpowiadającego wpisu w articles.`);
    }
  }

  const usedSlugs = new Set();
  for (const category of categories) {
    for (const articleEntry of category.articles || []) {
      const slug = typeof articleEntry === 'string' ? articleEntry : articleEntry.id;

      if (!slug) {
        errors.push(`Kategoria "${category.id}" zawiera wpis bez sluga.`);
        continue;
      }

      if (!metadata[slug]) {
        errors.push(`Kategoria "${category.id}" odwołuje się do sluga bez metadanych: "${slug}".`);
      }

      if (typeof articleEntry === 'string' && !articles[slug]) {
        errors.push(`Kategoria "${category.id}" odwołuje się do nieistniejącego artykułu: "${slug}".`);
      }

      if (usedSlugs.has(slug) && slug !== 'robohub-external') {
        errors.push(`Slug "${slug}" występuje wielokrotnie w listach kategorii.`);
      }
      usedSlugs.add(slug);
    }
  }

  return errors;
}

function main() {
  if (!fs.existsSync(configPath)) {
    console.error(`Brak pliku konfiguracji: ${configPath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const errors = validateConfig(config);

  if (errors.length > 0) {
    console.error('❌ Walidacja nie powiodła się:');
    for (const error of errors) {
      console.error(` - ${error}`);
    }
    process.exit(1);
  }

  console.log('✅ Walidacja zakończona sukcesem. Konfiguracja wiki jest spójna.');
}

main();
