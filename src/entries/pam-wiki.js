'use strict';

import { initApp as initWikiApp } from '../wiki-app.js';

export async function initWiki() {
  await initWikiApp();
}
