'use strict';

import { initWiki } from '../pam-wiki.js';
import { initMaterials } from '../pam-files.js';

async function runAppInitialization() {
  // 1) Bazowy UI shell: zakładki, panel pull-down, wskaźnik offline, bootstrap kart/sekcji.
  window.initPageTabs?.();
  window.initPullPanel?.();
  window.initOfflineIndicator?.();
  window.initBootstrapUi?.();

  // 2) Tryb developerski po przygotowaniu bazowego UI (wymaga obecnych kontrolek ustawień).
  window.initDevMode?.();

  // 3) Moduł materiałów (listy plików/live + preview) zanim użytkownik przejdzie do zakładki materiały.
  initMaterials();

  // 4) Wiki na końcu: router hash i ładowanie artykułu (obsługa wejścia z/bez hasha).
  await initWiki();
}

document.addEventListener('DOMContentLoaded', () => {
  runAppInitialization();
});
