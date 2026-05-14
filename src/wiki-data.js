'use strict';

export const WikiStore = {
  articles: {},
  metadata: {},
  categories: [],
  activeArticleId: null
};

function validateWikiConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('Konfiguracja wiki jest pusta lub niepoprawna.');
  if (!config.articles || typeof config.articles !== 'object') throw new Error('Brak pola "articles" w konfiguracji wiki.');
  if (!config.metadata || typeof config.metadata !== 'object') throw new Error('Brak pola "metadata" w konfiguracji wiki.');
  if (!Array.isArray(config.categories)) throw new Error('Pole "categories" musi być tablicą.');
}

export async function loadWikiConfig() {
  const response = await fetch('pam-wiki-config.json');
  if (!response.ok) throw new Error(`Nie udało się pobrać konfiguracji wiki (HTTP ${response.status}).`);
  const config = await response.json();
  validateWikiConfig(config);

  WikiStore.articles = config.articles || {};
  WikiStore.metadata = config.metadata || {};
  WikiStore.categories = config.categories || [];
}
