# Prywatność i bezpieczeństwo w lokalnej AI

## Streszczenie

Lokalna AI na urządzeniach mobilnych oferuje fundamentalną przewagę nad AI chmurową: dane użytkownika nie opuszczają urządzenia. Artykuł omawia techniczne i prawne aspekty prywatności oraz bezpieczeństwa w aplikacjach z lokalną AI — od ochrony modeli i bezpiecznych enklawach sprzętowych, przez federacyjne uczenie maszynowe, aż po zagrożenia adversarialne i wymogi RODO.

**Słowa kluczowe:** prywatność AI, bezpieczeństwo modeli, Federated Learning, Differential Privacy, adversarial attacks, RODO, Secure Enclave, on-device AI

## 1. Dlaczego lokalna AI poprawia prywatność

Tradycyjne modele AI w chmurze wymagają przesyłania surowych danych (zdjęcia, nagrania głosowe, dane biometryczne) na serwery zewnętrzne. Lokalna AI eliminuje ten wektor zagrożeń:

| Aspekt | AI w chmurze | Lokalna AI |
|---|---|---|
| Dane użytkownika | Opuszczają urządzenie | Pozostają na urządzeniu |
| Prywatność wnioskowania | Operator chmury widzi zapytania | Tylko urządzenie przetwarza |
| Działanie offline | Niemożliwe | Pełna funkcjonalność |
| Latencja | Zależna od sieci (50–500 ms) | Stała (10–100 ms) |
| Koszt operacyjny | Koszt API za zapytanie | Jednorazowy koszt modelu |
| Ryzyko naruszenia danych | Serwer może zostać skompromitowany | Ograniczone do urządzenia |

## 2. Ochrona modeli ML

### 2.1. Szyfrowanie plików modeli

Pliki modeli (`.tflite`, `.mlpackage`, `.onnx`) zawierają cenne zasoby intelektualne. Bez ochrony mogą zostać skopiowane z APK/IPA i użyte przez konkurencję.

**Android — szyfrowanie modelu kluczem z Android Keystore:**

```kotlin
// Generowanie klucza AES w Android Keystore (nie opuszcza bezpiecznej enklawy)
val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
keyGenerator.init(
    KeyGenParameterSpec.Builder("model_key",
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .build()
)
val secretKey = keyGenerator.generateKey()

// Deszyfrowanie modelu przed załadowaniem
fun decryptModel(encryptedModel: ByteArray, iv: ByteArray): ByteArray {
    val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    val key = keyStore.getKey("model_key", null) as SecretKey
    val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply {
        init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, iv))
    }
    return cipher.doFinal(encryptedModel)
}

// Sprawdzenie integralności modelu (SHA-256 hash)
fun verifyModelIntegrity(modelBytes: ByteArray, expectedHash: String): Boolean {
    val digest = MessageDigest.getInstance("SHA-256")
    val hash = digest.digest(modelBytes)
    val hexHash = hash.joinToString("") { "%02x".format(it) }
    return hexHash == expectedHash
}
```

**iOS — model w `.mlpackage` z szyfrowaniem:**

```swift
// Core ML obsługuje szyfrowanie modelu natywnie przez MLModelConfiguration
let config = MLModelConfiguration()
config.computeUnits = .cpuAndNeuralEngine

// Weryfikacja integralności przed załadowaniem
func loadModelSecurely(url: URL) throws -> MLModel {
    let modelData = try Data(contentsOf: url)
    let hash = SHA256.hash(data: modelData)
    guard hash == expectedModelHash else {
        throw SecurityError.modelTampered
    }
    return try MLModel(contentsOf: url, configuration: config)
}
```

### 2.2. Obfuskacja modelu

Oprócz szyfrowania można stosować obfuskację: permutację warstw, zmianę nazw tensorów, dodanie warstw no-op. Narzędzia: `tensorflow/model-optimization`, `onnx-modifier`.

## 3. Sprzętowe enklawy bezpieczeństwa

### 3.1. iOS Secure Enclave

Secure Enclave Processor (SEP) to odizolowany koprocesor w chipach Apple, przechowujący klucze kryptograficzne, które nigdy nie opuszczają enklawy.

```swift
// Tworzenie klucza w Secure Enclave
let accessControl = SecAccessControlCreateWithFlags(
    nil,
    kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    [.privateKeyUsage, .biometryCurrentSet],
    nil
)!

let attributes: [String: Any] = [
    kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
    kSecAttrKeySizeInBits as String: 256,
    kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
    kSecPrivateKeyAttrs as String: [
        kSecAttrIsPermanent as String: true,
        kSecAttrApplicationTag as String: "ai.model.key",
        kSecAttrAccessControl as String: accessControl
    ]
]

var error: Unmanaged<CFError>?
let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error)
```

### 3.2. Android Titan M2 i StrongBox

Titan M2 (Pixel) i StrongBox Keymaster (Android 9+) oferują sprzętowe przechowywanie kluczy z certyfikacją FIPS 140-2 Level 3.

```kotlin
// Klucz generowany w StrongBox (sprzętowa enklawa)
val spec = KeyGenParameterSpec.Builder("ai_key", PURPOSE_ENCRYPT or PURPOSE_DECRYPT)
    .setIsStrongBoxBacked(true)  // wymaga StrongBox
    .setBlockModes(BLOCK_MODE_GCM)
    .setEncryptionPaddings(ENCRYPTION_PADDING_NONE)
    .build()
```

## 4. Federacyjne uczenie maszynowe (Federated Learning)

### 4.1. Idea i algorytm FedAvg

Federated Learning (FL) pozwala doskonalić model bez zbierania danych użytkowników na serwerze. Dane pozostają na urządzeniu, a serwer agreguje tylko gradienty lub zaktualizowane wagi.

**Algorytm FedAvg (McMahan et al., 2017):**

```
Inicjalizacja: serwer posiada model w_0
Dla każdej rundy t = 1, 2, ..., T:
  1. Serwer wybiera losowo podzbiór klientów S_t
  2. Serwer wysyła bieżące wagi w_t do każdego klienta k ∈ S_t
  3. Każdy klient k wykonuje lokalny SGD na swoich danych:
       w_k = w_t - η * ∇L_k(w_t)
  4. Klienci odsyłają swoje wagi w_k
  5. Serwer agreguje: w_{t+1} = Σ_k (n_k/n) * w_k
     gdzie n_k = rozmiar zbioru klienta k, n = suma wszystkich
```

### 4.2. TensorFlow Federated na Androidzie

Google wbudował FL w Android (Android Federated Learning) do poprawy Gboard, asystenta i innych modeli.

```python
# Uproszczony przykład FedAvg z TFF
import tensorflow_federated as tff

def model_fn():
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(10, activation='relu', input_shape=(4,)),
        tf.keras.layers.Dense(3, activation='softmax')
    ])
    return tff.learning.models.from_keras_model(
        model,
        input_spec=...,
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=[tf.keras.metrics.SparseCategoricalAccuracy()]
    )

trainer = tff.learning.algorithms.build_weighted_fed_avg(
    model_fn,
    client_optimizer_fn=lambda: tf.keras.optimizers.SGD(0.1),
    server_optimizer_fn=lambda: tf.keras.optimizers.SGD(1.0)
)
```

## 5. Differential Privacy (Prywatność różniczkowa)

Differential Privacy (DP) gwarantuje, że wynik analizy danych (lub gradient w uczeniu maszynowym) nie ujawnia informacji o żadnym indywidualnym użytkowniku.

**Definicja (ε, δ)-DP:** mechanizm M spełnia (ε, δ)-DP gdy dla wszystkich sąsiednich zbiorów danych D, D':

```
P[M(D) ∈ S] ≤ e^ε · P[M(D') ∈ S] + δ
```

**DP-SGD** (Abadi et al., 2016) dodaje szum gaussowski do gradientów podczas treningu:

```python
from tensorflow_privacy import DPKerasSGDOptimizer

optimizer = DPKerasSGDOptimizer(
    l2_norm_clip=1.0,      # przycinanie gradientów
    noise_multiplier=1.1,  # siła szumu
    num_microbatches=256,
    learning_rate=0.01
)

model.compile(optimizer=optimizer, loss='sparse_categorical_crossentropy')
```

## 6. Ataki adversarialne

### 6.1. Typy ataków

**FGSM (Fast Gradient Sign Method):** perturbacja wejścia w kierunku gradientu straty:

```python
def fgsm_attack(image, epsilon, gradient):
    """Generuje adversarial example metodą FGSM."""
    sign_gradient = tf.sign(gradient)
    adversarial_image = image + epsilon * sign_gradient
    return tf.clip_by_value(adversarial_image, 0, 1)

# Przykład użycia
with tf.GradientTape() as tape:
    tape.watch(input_image)
    prediction = model(input_image)
    loss = loss_fn(true_label, prediction)

gradient = tape.gradient(loss, input_image)
adversarial = fgsm_attack(input_image, epsilon=0.01, gradient=gradient)
```

### 6.2. Obrona przed atakami

- **Adversarial training** — dodawanie adversarial examples do danych treningowych
- **Input preprocessing** — wymazywanie szumu (JPEG compression, feature squeezing)
- **Wykrywanie anomalii** — monitorowanie rozkładu wejść w czasie rzeczywistym
- **Certyfikowana obrona** — randomized smoothing z gwarancją matematyczną

## 7. Wymogi prawne: RODO i AI Act

### 7.1. RODO a dane biometryczne

Dane biometryczne (odciski palców, twarze, głos) to dane szczególnej kategorii art. 9 RODO. Przetwarzanie lokalne znacznie upraszcza compliance:

- Brak transferu do chmury → brak potrzeby art. 46 RODO (odpowiednie zabezpieczenia)
- Brak udziału procesora zewnętrznego → brak umowy DPA
- Minimalizacja danych: embeddingi twarzy nie muszą być przechowywane po uwierzytelnieniu

### 7.2. EU AI Act (2024)

AI Act klasyfikuje systemy AI według ryzyka:

| Ryzyko | Przykład | Wymogi |
|---|---|---|
| Niedopuszczalne | Social scoring | Zakaz |
| Wysokie | Biometria, rekrutacja | Rejestracja, audyt, przejrzystość |
| Ograniczone | Chatboty | Obowiązek informowania |
| Minimalne | Gry, spam filter | Brak specjalnych wymogów |

## 8. Audyt i fairness

Narzędzia do analizy bias i sprawiedliwości modelu:

```python
# Fairlearn — analiza bias modelu
from fairlearn.metrics import MetricFrame, selection_rate

metric_frame = MetricFrame(
    metrics={"accuracy": accuracy_score, "selection_rate": selection_rate},
    y_true=y_test,
    y_pred=predictions,
    sensitive_features=sensitive_feature_column
)

print(metric_frame.by_group)
print("Disparate impact:", metric_frame.difference(method='between_groups'))
```

## 9. Wymagania sklepów aplikacji

**Google Play:**
- Aplikacje korzystające z danych biometrycznych muszą wypełnić *Data Safety Section*
- Jasne deklarowanie użycia kamer/mikrofonu w celach AI
- Zakaz zbierania danych biometrycznych bez wyraźnej zgody

**Apple App Store:**
- *Privacy Nutrition Labels* — obowiązkowe dla wszystkich kategorii danych
- *App Tracking Transparency* (ATT) — wymagana zgoda dla śledzenia cross-app
- Face ID / Touch ID API (LocalAuthentication) nie ujawnia danych biometrycznych aplikacji

## 10. Podsumowanie

Lokalna AI jest naturalnym sojusznikiem prywatności użytkowników, ale wymaga świadomego podejścia do bezpieczeństwa samych modeli i pipeline'ów wnioskowania. Kluczowe zasady:

1. Szyfruj modele i weryfikuj ich integralność przed załadowaniem
2. Używaj sprzętowych enklawach (Keystore, Secure Enclave) do przechowywania kluczy
3. Rozważ FL zamiast centralnego treningu dla aplikacji personalizowanych
4. Stosuj DP przy wszelkim zbieraniu statystyk z urządzeń
5. Planuj zgodność z RODO i AI Act od początku projektu

## Powiązane artykuły

- [Wprowadzenie do lokalnej AI na urządzeniu mobilnym](#local-ai-intro)
- [Bezpieczeństwo aplikacji mobilnych](#mobile-security)
- [Prawne aspekty AI na urządzeniach mobilnych](#ai-legal-aspects)
- [Sieci neuronowe na urządzeniu mobilnym](#neural-networks-mobile)
- [Biometria i uwierzytelnianie](#biometrics)
- [Wnioskowanie lokalne — architektura i wydajność](#on-device-inference)
