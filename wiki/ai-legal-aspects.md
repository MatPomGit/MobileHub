# Prawne aspekty AI na urządzeniach mobilnych — RODO i AI Act

Rosnące możliwości sztucznej inteligencji na urządzeniach mobilnych stawiają przed twórcami aplikacji nowe wyzwania prawne. Dwa kluczowe akty prawne Unii Europejskiej kształtują dziś ramy tego obszaru: **RODO** (Rozporządzenie o Ochronie Danych Osobowych, ang. GDPR) oraz **AI Act** — pierwsze na świecie kompleksowe prawo regulujące systemy sztucznej inteligencji. Znajomość obu regulacji jest niezbędna dla każdego dewelopera tworzącego aplikacje mobilne z elementami AI.

## RODO / GDPR a sztuczna inteligencja na urządzeniach mobilnych

### Podstawy prawne przetwarzania danych przez AI

RODO (Rozporządzenie (UE) 2016/679) obowiązuje od 25 maja 2018 r. i dotyczy każdego przetwarzania danych osobowych obywateli UE — niezależnie od tego, czy odbywa się w chmurze, czy lokalnie na urządzeniu mobilnym. Modele AI pracujące na danych użytkownika (np. rozpoznawanie twarzy, analiza głosu, klasyfikacja aktywności) **zawsze** wymagają podstawy prawnej z art. 6 RODO.

**Dopuszczalne podstawy prawne:**

| Podstawa prawna | Kiedy stosować w aplikacji mobilnej |
|----------------|-------------------------------------|
| Zgoda (art. 6 ust. 1 lit. a) | Personalizacja, profilowanie, reklama behawioralna |
| Umowa (art. 6 ust. 1 lit. b) | Funkcje niezbędne do świadczenia usługi |
| Prawnie uzasadniony interes (art. 6 ust. 1 lit. f) | Bezpieczeństwo aplikacji, wykrywanie nadużyć |
| Obowiązek prawny (art. 6 ust. 1 lit. c) | Wymagania KYC w aplikacjach finansowych |

### Dane szczególnych kategorii a modele AI

Art. 9 RODO szczególnie chroni dane **biometryczne** — a to właśnie one są najczęściej przetwarzane przez modele AI na urządzeniach mobilnych. Rozpoznawanie twarzy, odciski palców, analiza chodu czy głosu to dane biometryczne w rozumieniu RODO, gdy są przetwarzane w celu jednoznacznej identyfikacji osoby fizycznej.

Przetwarzanie danych biometrycznych w aplikacji mobilnej wymaga spełnienia jednego z wyjątków z art. 9 ust. 2, najczęściej:
- **wyraźnej zgody** (lit. a) — musi być oddzielna, konkretna, dobrowolna i świadoma,
- **konieczności ochrony żywotnych interesów** (lit. c),
- **względów interesu publicznego** (lit. g) — w aplikacjach rządowych lub medycznych.

```kotlin
// Przykład: zbieranie świadomej zgody przed uruchomieniem modelu biometrycznego
fun requestBiometricConsentAndRun(context: Context, onConsent: () -> Unit) {
    MaterialAlertDialogBuilder(context)
        .setTitle("Przetwarzanie danych biometrycznych")
        .setMessage(
            "Aplikacja użyje Twojego wizerunku twarzy do weryfikacji tożsamości. " +
            "Dane są przetwarzane wyłącznie lokalnie na urządzeniu i nie są " +
            "przesyłane na serwery. Możesz cofnąć zgodę w ustawieniach aplikacji."
        )
        .setPositiveButton("Wyrażam zgodę") { _, _ ->
            saveConsentTimestamp(context)   // zapisz znacznik czasu zgody
            onConsent()
        }
        .setNegativeButton("Odrzuć", null)
        .show()
}

fun saveConsentTimestamp(context: Context) {
    // Zgodę należy przechowywać dowodowo (kiedy, co, wersja polityki prywatności)
    getEncryptedPrefs(context).edit {
        putLong("biometric_consent_ts", System.currentTimeMillis())
        putString("biometric_consent_policy_version", BuildConfig.PRIVACY_POLICY_VERSION)
    }
}
```

### Zasady RODO stosowane do lokalnej AI

RODO w art. 5 formułuje sześć zasad, które bezpośrednio przekładają się na projektowanie systemów AI na urządzeniach mobilnych:

**1. Minimalizacja danych (data minimisation)**
Model AI powinien pobierać tylko te dane wejściowe, które są niezbędne do realizacji konkretnej funkcji. Jeśli funkcja klasyfikacji aktywności fizycznej nie potrzebuje lokalizacji GPS — nie należy jej pobierać. Architektura *Privacy by Design* wymaga, by ograniczenie zakresu danych było wbudowane w sam model.

**2. Ograniczenie celu (purpose limitation)**
Dane zebrane do jednego celu (np. wykrywanie upadków seniorów) nie mogą być bez odrębnej podstawy prawnej użyte do innego celu (np. analizy wzorców ruchu w celach marketingowych).

**3. Ograniczenie przechowywania (storage limitation)**
Wyniki inferencji, embeddingi, predykcje AI — wszystkie dane mają swój czas życia. Aplikacja powinna automatycznie usuwać dane po upływie określonego okresu.

```kotlin
// Automatyczne usuwanie danych AI po 30 dniach
class AiDataRetentionWorker(ctx: Context, params: WorkerParameters) :
    CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        val db = AppDatabase.getInstance(applicationContext)
        val cutoff = System.currentTimeMillis() - TimeUnit.DAYS.toMillis(30)
        db.aiResultsDao().deleteOlderThan(cutoff)
        return Result.success()
    }
}

// Rejestracja cyklicznego zadania (co 24 godziny)
WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "ai-data-retention",
    ExistingPeriodicWorkPolicy.KEEP,
    PeriodicWorkRequestBuilder<AiDataRetentionWorker>(1, TimeUnit.DAYS).build()
)
```

**4. Prawidłowość (accuracy)**
Błędna predykcja AI — szczególnie w kontekście diagnostyki zdrowotnej, scoringu kredytowego czy wykrywania fraudów — może naruszać prawo do poprawności danych. Aplikacje powinny udostępniać mechanizm kwestionowania lub korygowania wyników AI.

**5. Integralność i poufność (integrity and confidentiality)**
Lokalne modele AI i wyniki ich pracy muszą być chronione przed nieautoryzowanym dostępem. Oznacza to szyfrowanie plików modelu (`.tflite`, `.mlpackage`) i wyników inferencji zapisywanych na urządzeniu.

**6. Rozliczalność (accountability)**
Twórca aplikacji musi być w stanie udowodnić zgodność z RODO. W praktyce oznacza to prowadzenie rejestru czynności przetwarzania (art. 30), przeprowadzanie oceny skutków dla ochrony danych (DPIA, art. 35) dla systemów AI wysokiego ryzyka, a także dokumentowanie podstaw prawnych.

### Ocena skutków dla ochrony danych (DPIA)

Art. 35 RODO nakłada obowiązek przeprowadzenia DPIA, gdy przetwarzanie „może powodować wysokie ryzyko naruszenia praw lub wolności osób fizycznych". Wytyczne EROD wskazują, że DPIA jest wymagane w przypadku:

- **Systematycznej i rozległej oceny czynników osobowych** przy użyciu automatycznego przetwarzania (w tym profilowania AI),
- **Przetwarzania na dużą skalę** danych szczególnych kategorii (biometria, zdrowie),
- **Systematycznego monitorowania** miejsc dostępnych publicznie.

> ⚠️ **Praktyczna wskazówka:** Większość aplikacji mobilnych korzystających z lokalnej AI (rozpoznawanie twarzy, analiza mowy, klasyfikacja zdrowia) powinna posiadać DPIA. Brak tego dokumentu może skutkować karą do 10 mln EUR lub 2% globalnego obrotu (art. 83 ust. 4 RODO).

### Zautomatyzowane podejmowanie decyzji (art. 22 RODO)

Art. 22 RODO przyznaje osobom fizycznym prawo do **niepodlegania decyzji opartej wyłącznie na zautomatyzowanym przetwarzaniu**, jeśli wywołuje ona skutki prawne lub podobnie istotnie wpływa na osobę. Dotyczy to np.:

- aplikacji mobilnych przyznających kredyty opierając się na modelu scoringowym,
- systemów rekrutacyjnych oceniających kandydatów na podstawie AI,
- ubezpieczeń bazujących na monitorowaniu stylu jazdy przez aplikację.

W takich przypadkach użytkownik ma prawo żądać **ingerencji człowieka**, wyrażenia własnego stanowiska i zakwestionowania decyzji. Aplikacja musi zapewnić taki mechanizm.

---

## AI Act — unijne prawo o sztucznej inteligencji

### Czym jest AI Act?

**Rozporządzenie (UE) 2024/1689** — znane jako **AI Act** — zostało opublikowane 12 lipca 2024 r. i weszło w życie 1 sierpnia 2024 r. Jest pierwszym na świecie kompleksowym aktem prawnym regulującym systemy AI. Stosuje podejście **oparte na ryzyku**: im wyższe ryzyko stwarzane przez system AI, tym ostrzejsze wymagania.

Przepisy wchodzą w życie stopniowo:
- **1 lutego 2025** — zakaz systemów AI niedopuszczalnego ryzyka (art. 5),
- **2 sierpnia 2025** — obowiązki dla modeli GPAI i podmiotów notyfikowanych,
- **2 sierpnia 2026** — pełne stosowanie, w tym wymagania dla systemów wysokiego ryzyka.

### Klasyfikacja ryzyka systemów AI

AI Act dzieli systemy AI na cztery poziomy ryzyka:

```
┌─────────────────────────────────────────────────────────────────┐
│  NIEDOPUSZCZALNE RYZYKO — ZAKAZ (art. 5)                        │
│  • Social scoring przez władze publiczne                        │
│  • Biometryczna identyfikacja w czasie rzeczywistym w           │
│    przestrzeni publicznej (z wyjątkami dla organów ścigania)    │
│  • Systemy manipulacji podprogowej                              │
│  • Wyzysk podatności (wiek, niepełnosprawność)                 │
├─────────────────────────────────────────────────────────────────┤
│  WYSOKIE RYZYKO (załącznik III) — RYGORYSTYCZNE WYMAGANIA      │
│  • Infrastruktura krytyczna                                     │
│  • Edukacja i kwalifikacje zawodowe                             │
│  • Zatrudnienie i zarządzanie pracownikami                      │
│  • Usługi podstawowe (kredyty, ubezpieczenia, opieka zdrowotna) │
│  • Egzekwowanie prawa                                           │
│  • Zarządzanie migracją i granicami                             │
│  • Wymiar sprawiedliwości                                       │
├─────────────────────────────────────────────────────────────────┤
│  OGRANICZONE RYZYKO — OBOWIĄZKI PRZEJRZYSTOŚCI                  │
│  • Chatboty / asystenci głosowi                                 │
│  • Deepfake i syntetyczne treści                                │
│  • Systemy rekomendacji                                         │
├─────────────────────────────────────────────────────────────────┤
│  MINIMALNE RYZYKO — BRAK WYMAGAŃ                                │
│  • Filtry antyspamowe                                           │
│  • AI w grach                                                   │
│  • Optymalizacja zużycia baterii                                │
└─────────────────────────────────────────────────────────────────┘
```

### AI Act a aplikacje mobilne — przykłady klasyfikacji

| Typ aplikacji mobilnej | Klasyfikacja AI Act | Kluczowe wymagania |
|------------------------|--------------------|--------------------|
| Aplikacja fitness z analizą aktywności | Minimalne ryzyko | Brak dodatkowych |
| Asystent głosowy / chatbot AI | Ograniczone ryzyko | Obowiązek informowania o interakcji z AI |
| Rozpoznawanie twarzy do odblokowania telefonu | Ograniczone/niskie ryzyko | Informacja + zgoda RODO |
| Aplikacja diagnostyki medycznej AI | Wysokie ryzyko | Pełne wymagania art. 9–15 |
| Aplikacja oceny zdolności kredytowej | Wysokie ryzyko | Rejestracja w UE, audyt, nadzór ludzki |
| Rekrutacja przez AI na mobile | Wysokie ryzyko | Transparentność, odwołanie, dokumentacja |
| Generatywna AI tworzący deepfake | Ograniczone ryzyko | Obowiązkowe oznaczanie treści AI |
| Biometryczne ID w czasie rzeczywistym w przestrzeni publicznej | Niedopuszczalne | **ZAKAZ** |

### Wymagania dla systemów wysokiego ryzyka (art. 9–15)

Twórcy mobilnych aplikacji AI zakwalifikowanych jako systemy wysokiego ryzyka muszą wdrożyć:

**1. System zarządzania ryzykiem (art. 9)**
Ciągły, przez cały cykl życia systemu AI, obejmujący identyfikację, analizę i mitygację ryzyk. Musi być dokumentowany.

**2. Zarządzanie danymi treningowymi (art. 10)**
Dane treningowe muszą być odpowiednie, reprezentatywne, wolne od błędów i kompletne. Wymóg ten dotyczy też modeli fine-tunowanych na urządzeniu (on-device fine-tuning). Należy uwzględniać możliwe bias.

**3. Dokumentacja techniczna (art. 11)**
Obowiązek sporządzenia i aktualizowania szczegółowej dokumentacji technicznej przed wprowadzeniem systemu na rynek. Zawiera m.in. opis ogólny, dane treningowe, walidacje, wskaźniki dokładności.

**4. Rejestrowanie zdarzeń (logging, art. 12)**
Systemy wysokiego ryzyka muszą automatycznie rejestrować zdarzenia przez cały okres działania. Logi muszą umożliwiać weryfikację działania systemu i identyfikację ryzyk ex-post.

```kotlin
// Przykład logowania decyzji AI zgodnie z wymogami AI Act (art. 12)
data class AiDecisionLog(
    val timestamp: Long = System.currentTimeMillis(),
    val modelVersion: String,
    val inputHash: String,          // hash danych wejściowych (nie same dane!)
    val outputClass: String,
    val confidence: Float,
    val humanReviewTriggered: Boolean,
    val sessionId: String
)

object AiAuditLogger {
    private val logs = mutableListOf<AiDecisionLog>()

    fun log(entry: AiDecisionLog) {
        logs.add(entry)
        if (entry.confidence < 0.75f || entry.humanReviewTriggered) {
            // Zdarzenia niskiej pewności lub wymagające ingerencji człowieka
            // muszą być szczególnie zaznaczone (wymóg art. 14 ust. 4)
            flagForHumanReview(entry)
        }
    }

    fun exportForAudit(): List<AiDecisionLog> = logs.toList()
}
```

**5. Przejrzystość i informowanie użytkownika (art. 13)**
Systemy wysokiego ryzyka muszą być dostatecznie przejrzyste, by osoby nadzorujące mogły je właściwie interpretować. Użytkownicy końcowi aplikacji muszą wiedzieć, że interakcja jest prowadzona z systemem AI.

**6. Nadzór ludzki (art. 14)**
Systemy AI wysokiego ryzyka muszą pozwalać na skuteczny nadzór ludzki. W aplikacjach mobilnych oznacza to mechanizmy umożliwiające człowiekowi:
- interwencję i unieważnienie decyzji AI,
- monitorowanie działania systemu w czasie rzeczywistym,
- wyłączenie systemu w sytuacjach awaryjnych (*stop button*).

**7. Dokładność, solidność i cyberbezpieczeństwo (art. 15)**
Systemy wysokiego ryzyka muszą osiągać odpowiedni poziom dokładności i być odporne na błędy, awarie oraz ataki (w tym adversarialne).

### Obowiązki przejrzystości dla ograniczonego ryzyka (art. 50)

Aplikacje mobilne korzystające z chatbotów AI, syntetycznych głosów lub generowania obrazów mają uproszczone, ale realne obowiązki:

- **Chatboty** — użytkownik musi być poinformowany, że prowadzi interakcję z systemem AI (nie dotyczy oczywistych zastosowań artystycznych lub humorystycznych).
- **Deepfake i syntetyczne treści** — treści wideo, audio lub graficzne wygenerowane lub znacząco zmodyfikowane przez AI muszą być **widocznie oznaczone**.
- **Syntetyczny głos** — systemy klonowania głosu muszą informować o sztucznym charakterze głosu.

```swift
// Swift: oznaczanie treści generowanych przez AI (wymaganie art. 50 AI Act)
import UIKit

extension UIImage {
    /// Dodaje widoczne oznaczenie wymaganego przez AI Act do treści generowanych przez AI
    func withAiGeneratedWatermark() -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            self.draw(at: .zero)
            let label = "AI Generated"
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 12, weight: .semibold),
                .foregroundColor: UIColor.white,
                .backgroundColor: UIColor.black.withAlphaComponent(0.6)
            ]
            let size = label.size(withAttributes: attrs)
            label.draw(
                at: CGPoint(x: 8, y: self.size.height - size.height - 8),
                withAttributes: attrs
            )
        }
    }
}
```

### Modele AI ogólnego przeznaczenia (GPAI)

AI Act wprowadza nową kategorię: **modele AI ogólnego przeznaczenia** (ang. General-Purpose AI Models, GPAI) — takie jak GPT-4 czy Gemini. Dostawcy tych modeli mają własne obowiązki (art. 53–55), a deweloperzy budujący na ich bazie aplikacje mobilne muszą:

- weryfikować, czy dostawca modelu GPAI spełnia wymogi AI Act,
- dostosowywać własne systemy do wymagań kategorii ryzyka, w której działa finalna aplikacja,
- dla modeli o mocy obliczeniowej ≥ 10²⁵ FLOPs — stosować dodatkowe wymagania bezpieczeństwa systemowego.

---

## Zbieżność i różnice RODO i AI Act

### Gdzie się nakładają

RODO i AI Act wzajemnie się uzupełniają i w wielu miejscach nakładają się na siebie. Deweloper aplikacji mobilnej korzystającej z AI powinien traktować je jako jeden spójny system:

| Zagadnienie | RODO | AI Act |
|-------------|------|--------|
| Dane treningowe | Art. 5 (zasady), art. 9 (dane wrażliwe) | Art. 10 (jakość i reprezentatywność) |
| Zautomatyzowane decyzje | Art. 22 (prawo sprzeciwu) | Art. 14 (nadzór ludzki) |
| Przejrzystość | Art. 13–14 (informowanie) | Art. 13, 50 (obowiązki przejrzystości) |
| Dokumentacja | Art. 30 (rejestr czynności) | Art. 11 (dokumentacja techniczna) |
| Ocena ryzyka | Art. 35 (DPIA) | Art. 9 (system zarządzania ryzykiem) |
| Organy nadzorcze | Organy ochrony danych (UODO w PL) | Krajowy organ nadzoru AI (wyznaczany) |

### Ważne różnice

- **RODO** chroni dane osobowe i jest stosowane, gdy **przetwarzane są dane identyfikowalne**. AI Act dotyczy **systemów AI jako takich** — niezależnie od tego, czy przetwarzają dane osobowe.
- **RODO** daje prawa podmiotom danych (dostęp, sprostowanie, usunięcie). **AI Act** daje prawa osobom dotkniętym decyzją systemu AI (nadzór ludzki, wyjaśnialność).
- **RODO** jest już w pełni stosowane (od 2018). **AI Act** wchodzi stopniowo (2024–2026).
- Kary: RODO — do 20 mln EUR lub 4% globalnego obrotu; AI Act — do 35 mln EUR lub 7% globalnego obrotu za naruszenie zakazów z art. 5.

---

## Praktyczne wskazówki dla dewelopera

### Checklista zgodności prawnej aplikacji mobilnej z AI

Przed publikacją aplikacji mobilnej korzystającej z AI warto zweryfikować:

**RODO:**
- [ ] Czy zidentyfikowałem wszystkie dane osobowe przetwarzane przez modele AI?
- [ ] Czy dla każdej czynności przetwarzania istnieje podstawa prawna (art. 6)?
- [ ] Czy dane biometryczne są przetwarzane zgodnie z art. 9?
- [ ] Czy polityka prywatności opisuje przetwarzanie przez AI w języku zrozumiałym dla użytkownika?
- [ ] Czy przeprowadziłem DPIA (jeśli wymagana)?
- [ ] Czy użytkownik ma możliwość wycofania zgody i usunięcia swoich danych?
- [ ] Czy wdrożyłem zasadę minimalizacji danych?
- [ ] Czy dane są automatycznie usuwane po upływie okresu retencji?

**AI Act:**
- [ ] Czy sklasyfikowałem system AI według poziomów ryzyka?
- [ ] Czy informuję użytkownika o interakcji z AI (chatboty, syntetyczna mowa)?
- [ ] Czy treści generowane przez AI są odpowiednio oznaczone?
- [ ] Czy dla systemów wysokiego ryzyka sporządziłem dokumentację techniczną?
- [ ] Czy wdrożyłem mechanizmy nadzoru ludzkiego?
- [ ] Czy system loguje zdarzenia zgodnie z art. 12?

### Privacy by Design — architektura zgodna z przepisami od podstaw

```kotlin
// Wzorzec Privacy by Design: enkapsulacja danych AI z ograniczonym dostępem
class PrivacyAwareAiProcessor private constructor(
    private val context: Context
) {
    // Dane przetwarzane tylko w pamięci, nigdy nie utrwalane bez zgody
    private var tempInput: ByteArray? = null

    fun processWithConsent(
        input: ByteArray,
        purpose: DataPurpose,
        consentToken: ConsentToken,
        onResult: (AiResult) -> Unit,
        onNoConsent: () -> Unit
    ) {
        if (!ConsentManager.hasValidConsent(context, purpose, consentToken)) {
            onNoConsent()
            return
        }
        tempInput = input
        try {
            val result = runInference(input)
            AiAuditLogger.log(
                AiDecisionLog(
                    modelVersion = MODEL_VERSION,
                    inputHash = input.sha256Hex(),   // logujemy hash, nie dane!
                    outputClass = result.topClass,
                    confidence = result.confidence,
                    humanReviewTriggered = result.confidence < HIGH_CONFIDENCE_THRESHOLD,
                    sessionId = consentToken.sessionId
                )
            )
            onResult(result)
        } finally {
            tempInput?.fill(0)   // bezpieczne czyszczenie danych z pamięci
            tempInput = null
        }
    }

    companion object {
        const val MODEL_VERSION = BuildConfig.AI_MODEL_VERSION
        const val HIGH_CONFIDENCE_THRESHOLD = 0.85f

        @Volatile private var instance: PrivacyAwareAiProcessor? = null
        fun getInstance(ctx: Context) = instance ?: synchronized(this) {
            instance ?: PrivacyAwareAiProcessor(ctx.applicationContext).also { instance = it }
        }
    }
}

enum class DataPurpose { BIOMETRIC_AUTH, HEALTH_MONITORING, CONTENT_MODERATION }
```

### Rejestr czynności przetwarzania dla aplikacji z AI (art. 30 RODO)

Każda organizacja przetwarzająca dane w imieniu użytkowników musi prowadzić rejestr. Przykładowy wpis dla funkcji AI w aplikacji mobilnej:

| Pole | Wartość przykładowa |
|------|---------------------|
| Nazwa czynności | Lokalna klasyfikacja aktywności fizycznej |
| Cel przetwarzania | Personalizacja planu treningowego |
| Kategorie osób | Użytkownicy aplikacji mobilnej |
| Kategorie danych | Dane z akcelerometru, żyroskopu; dane zdrowotne (art. 9) |
| Podstawa prawna | Zgoda (art. 9 ust. 2 lit. a) |
| Okres retencji | 90 dni od ostatniej aktywności |
| Odbiorcy | Brak (przetwarzanie wyłącznie lokalne na urządzeniu) |
| Zabezpieczenia | Szyfrowanie AES-256-GCM, Android Keystore / Secure Enclave |
| Kraj przetwarzania | Urządzenie użytkownika (UE i poza UE) |

---

## Podsumowanie

Tworzenie aplikacji mobilnych z elementami AI wymaga dziś znajomości dwóch filarów europejskiego prawa cyfrowego. **RODO** reguluje ochronę danych osobowych przetwarzanych przez modele AI — od biometrii po rekomendacje — i wymaga świadomego projektowania pod kątem prywatności (*Privacy by Design*). **AI Act** jako nowe, pionierskie prawo klasyfikuje systemy AI według ryzyka i nakłada obowiązki proporcjonalne do potencjalnych szkód — od prostego obowiązku informowania (chatboty) po rygorystyczne wymagania dokumentacyjne i nadzorcze (diagnostyka medyczna, credit scoring).

Dla dewelopera mobilnego kluczowe jest:
1. **Klasyfikacja systemu AI** według AI Act — jeszcze przed projektowaniem architektury,
2. **Identyfikacja danych osobowych** przetwarzanych przez modele — obowiązki RODO,
3. **Wdrożenie Privacy by Design** — minimalizacja danych, szyfrowanie, zarządzanie zgodami,
4. **Dokumentacja i rozliczalność** — rejestr czynności (RODO), dokumentacja techniczna (AI Act),
5. **Mechanizmy nadzoru ludzkiego** — szczególnie dla systemów wysokiego ryzyka.

Ignorowanie tych wymagań grozi nie tylko sankcjami finansowymi (do 35 mln EUR), ale też utratą zaufania użytkowników i wykluczeniem z rynku europejskiego.
