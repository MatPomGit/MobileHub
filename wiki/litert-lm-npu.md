# LiteRT LLM i akceleracja NPU

NPU (Neural Processing Unit) to wyspecjalizowany układ dla obliczeń AI. W scenariuszach LLM na mobile często daje najlepszy kompromis: **wysoka wydajność przy niższym poborze energii** niż CPU.

## Co realnie daje NPU w aplikacji mobilnej

W dobrze dobranym pipeline NPU potrafi:

- skrócić czas odpowiedzi o odczuwalny poziom dla użytkownika,
- utrzymać bardziej stabilną wydajność przy dłuższych sesjach,
- zmniejszyć nagrzewanie urządzenia względem długiej inferencji na CPU.

To kluczowe np. w asystentach głosowych, live-captioning i aplikacjach, które działają przez wiele minut bez przerwy.

## Parametry, które naprawdę warto raportować

W testach R&D nie wystarczy podać średniej latencji. Mierz co najmniej:

- **TTFT** oraz **P50/P95/P99 latency**,
- **tokens/s** dla krótkich i długich promptów,
- **temperaturę urządzenia** po 5/10/20 minutach,
- **spadek SoC battery %/h** w kontrolowanym scenariuszu,
- udział operatorów wykonywanych poza NPU.

Jeśli istotna część operatorów „spada” na CPU, zysk z NPU bywa dużo mniejszy niż oczekiwany.

## Strategia fallback, która ratuje produkcję

W praktyce najbezpieczniejsza kolejność to:

1. **NPU** (najlepszy priorytet przy wsparciu urządzenia),
2. **GPU** (często dobry kompromis),
3. **CPU** (najwyższa kompatybilność).

Dodatkowo warto mieć fallback funkcjonalny:

- krótszy kontekst,
- mniejszy limit tokenów,
- „lite mode” dla starszych telefonów.

## Ciekawostka: dlaczego same benchmarki syntetyczne mylą

Model może wyglądać świetnie w teście mikro (krótki prompt, zimny start), ale gorzej w realnym UX:

- po kilkunastu zapytaniach rośnie temperatura,
- system obniża częstotliwości (throttling),
- P95 latency pogarsza się znacznie bardziej niż średnia.

Dlatego test „end-to-end” w sesji 15–20 minut jest dużo bardziej wiarygodny niż pojedynczy pomiar.

## Wskazówki integracyjne

- Zawsze loguj, który backend wykonał inferencję.
- Dodaj telemetrykę wydajności na poziomie funkcji produktu.
- Oddziel testy „cold start” od „warm run”.
- Waliduj jakość modelu także po zmianie backendu (NPU/GPU/CPU).

## Materiały źródłowe

- Dokumentacja: https://ai.google.dev/edge/litert/next/litert_lm_npu?hl=pl#NPU
