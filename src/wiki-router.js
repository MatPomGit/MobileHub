'use strict';

import { WikiStore } from './wiki-data.js';

export function createWikiRouter(loadArticle, setActiveLink) {
  const navigateToArticle = (id, options = {}) => {
    if (!id || !WikiStore.articles[id]) return;
    const { updateHash = true } = options;
    if (updateHash && window.location.hash.substring(1) !== id) {
      window.location.hash = id;
      return;
    }
    WikiStore.activeArticleId = id;
    loadArticle(id);
    setActiveLink(id);
  };

  const bindHashRouting = () => {
    const hash = window.location.hash.substring(1);
    if (hash && WikiStore.articles[hash]) navigateToArticle(hash, { updateHash: false });
    window.addEventListener('hashchange', () => {
      const id = window.location.hash.substring(1);
      if (id && WikiStore.articles[id]) navigateToArticle(id, { updateHash: false });
    });
  };

  return { navigateToArticle, bindHashRouting };
}
