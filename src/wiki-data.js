'use strict';

export const WikiStore = {
  articles: {},
  metadata: {},
  categories: [],
  activeArticleId: null
};

const WIKI_CONFIG_URL = 'data/pam-wiki-config.json';
const WIKI_CONFIG_RETRY_DELAYS_MS = [250, 500, 1000];

function createRetryableError(message, retryable) {
  const error = new Error(message);
  error.retryable = retryable;
  return error;
}

function validateWikiConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('Konfiguracja wiki jest pusta lub niepoprawna.');
  if (!config.articles || typeof config.articles !== 'object') throw new Error('Brak pola "articles" w konfiguracji wiki.');
  if (!config.metadata || typeof config.metadata !== 'object') throw new Error('Brak pola "metadata" w konfiguracji wiki.');
  if (!Array.isArray(config.categories)) throw new Error('Pole "categories" musi być tablicą.');
}

async function fetchWikiConfigWithRetry() {
  let lastError = null;

  for (let attempt = 0; attempt <= WIKI_CONFIG_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(WIKI_CONFIG_URL);
      if (!response.ok) {
        const shouldRetry = response.status >= 500;
        if (!shouldRetry) {
          throw createRetryableError(`Nie udało się pobrać konfiguracji wiki (HTTP ${response.status}).`, false);
        }
        throw createRetryableError(`Tymczasowy błąd serwera podczas pobierania konfiguracji wiki (HTTP ${response.status}).`, true);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (error?.retryable === false) {
        break;
      }
      const delayMs = WIKI_CONFIG_RETRY_DELAYS_MS[attempt];
      if (!delayMs) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Nie udało się pobrać konfiguracji wiki.');
}

export async function loadWikiConfig() {
  const config = await fetchWikiConfigWithRetry();
  validateWikiConfig(config);

  WikiStore.articles = config.articles || {};
  WikiStore.metadata = config.metadata || {};
  WikiStore.categories = config.categories || [];
}
