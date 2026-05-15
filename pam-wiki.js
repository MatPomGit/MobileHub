'use strict';

import { initApp as initWikiApp } from './src/wiki-app.js';

export async function initWiki() {
  await initWikiApp();
}
