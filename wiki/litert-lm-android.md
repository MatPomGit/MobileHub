# LiteRT LLM na Androidzie

LiteRT LLM (dawniej TensorFlow Lite dla LLM) pozwala uruchomić model językowy **bezpośrednio na telefonie**. W praktyce oznacza to krótszy czas odpowiedzi, działanie offline i lepszą kontrolę prywatności — szczególnie ważną w aplikacjach medycznych, edukacyjnych i enterprise.

## Dlaczego on-device LLM robi różnicę

W klasycznym podejściu chmurowym każde zapytanie wysyłasz przez sieć. To oznacza opóźnienia zależne od jakości połączenia. W on-device AI:

- lokalna inferencja potrafi zejść do **dziesiątek–setek milisekund** dla krótkich zadań,
- aplikacja działa nawet przy braku Internetu,
- dane użytkownika nie muszą opuszczać urządzenia.

To podejście jest szczególnie skuteczne tam, gdzie liczy się UX „tu i teraz”: autouzupełnianie tekstu, streszczanie notatek, asystenci kontekstowi i klasyfikacja treści.

## Twarde parametry, które warto monitorować

W projektach R&D najlepiej mierzyć nie tylko „czy działa”, ale **jak działa**:

- **TTFT (Time To First Token)** — czas do pierwszego tokenu.
- **Tokens/s** — przepustowość generacji.
- **P95 latency** — opóźnienie dla 95% zapytań (stabilność UX).
- **Peak RAM** — szczytowe zużycie pamięci.
- **mWh / zapytanie** — koszt energetyczny pojedynczej odpowiedzi.

Dla praktycznych wdrożeń mobilnych sensowny punkt startowy to:

- TTFT < **1.5 s**,
- stabilność P95 bez „skoków” > **2×** mediany,
- brak OOM dla co najmniej **3 klas urządzeń** (low/mid/high).

## Jak dobrać model do telefonu

Nie zawsze większy model = lepszy produkt. Na mobile często wygrywa model mniejszy, ale przewidywalny:

1. Zacznij od modelu o mniejszym rozmiarze i krótkim kontekście.
2. Uruchom testy jakości na własnych promptach domenowych.
3. Dopiero potem zwiększaj parametry modelu, jeśli ROI jest realne.

### Heurystyka doboru (praktyczna)

- Jeżeli P95 latency jest za wysokie, najpierw redukuj długość kontekstu.
- Jeżeli jakość spada zbyt mocno, testuj lepszą kwantyzację zamiast większego modelu.
- Jeżeli bateria „znika”, ogranicz maksymalną liczbę tokenów odpowiedzi.

## Kwantyzacja: mały zabieg, duży efekt

Kwantyzacja (np. INT8 / mixed precision) często daje:

- mniejszy rozmiar modelu,
- szybszy czas ładowania,
- niższy koszt energetyczny inferencji.

W praktyce spadek jakości bywa mały względem zysku wydajnościowego, ale trzeba to **zweryfikować na własnym zbiorze testowym**. Najlepiej oceniać jednocześnie: jakość odpowiedzi, opóźnienie i zużycie baterii.

## Najczęstsze pułapki wdrożeniowe

- Zbyt długie prompty, które niepotrzebnie podnoszą TTFT.
- Brak limitów tokenów i timeoutów (ryzyko „zawieszania” UX).
- Testy tylko na jednym flagowcu zamiast przekroju urządzeń.
- Brak fallbacku (np. krótszy prompt lub lżejszy model) przy przeciążeniu.

## Ciekawostka architektoniczna

W wielu aplikacjach najlepsze efekty daje układ hybrydowy:

- **on-device** dla szybkich, prywatnych operacji,
- **cloud** dla cięższych, rzadkich zadań wymagających większego modelu.

Taki podział może ograniczyć liczbę wywołań do chmury nawet o kilkadziesiąt procent, a użytkownik nadal odczuwa aplikację jako szybką i „inteligentną”.

## Materiały źródłowe

- Dokumentacja: https://ai.google.dev/edge/litert-lm/android?hl=pl
