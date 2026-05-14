/**
 * Zależności modułów Wiki:
 * pam-wiki.js (bootstrap) -> src/wiki-app.js
 * src/wiki-app.js -> wiki-data, wiki-router, wiki-ui, wiki-sidebar, wiki-search
 * wiki-router i wiki-sidebar współpracują przez navigateToArticle,
 * a współdzielony stan utrzymywany jest w WikiStore (wiki-data.js).
 */

'use strict';

import { initApp } from './src/wiki-app.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
