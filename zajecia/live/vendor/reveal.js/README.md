# Reveal.js (zasoby lokalne)

Ten katalog jest miejscem na lokalną kopię plików Reveal.js używanych przez prezentacje live.

## Oczekiwana struktura

- `dist/reveal.js`
- `dist/reveal.css`
- `dist/theme/black.css`

## Dlaczego to działa również bez tych plików?

Pliki HTML w `zajecia/live/wyklady/` najpierw próbują użyć tej lokalnej ścieżki,
a gdy zasób nie istnieje — automatycznie przechodzą na CDN (jsDelivr),
a dla skryptu JS mają dodatkowy fallback na unpkg.

Dzięki temu:

1. środowisko produkcyjne może korzystać z lokalnych, stabilnych zasobów,
2. środowiska bez tych plików nadal działają przez CDN.
