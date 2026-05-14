'use strict';

export function setupSearch() {
  const input = document.getElementById('wikiSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('.wiki-category').forEach(cat => {
      let vis = 0;
      cat.querySelectorAll('[data-article]').forEach(link => {
        const match = !q || link.textContent.toLowerCase().includes(q);
        const li = link.closest('li');
        if (li) li.style.display = match ? '' : 'none';
        if (match) vis++;
      });
      if (q && vis > 0) { const l = cat.querySelector('.cat-list'); if (l) l.classList.remove('collapsed'); }
      cat.style.display = (!q || vis > 0) ? '' : 'none';
    });
  });
}
