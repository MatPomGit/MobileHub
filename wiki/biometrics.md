# Biometria i uwierzytelnianie

Biometria mobilna (odcisk palca, rozpoznawanie twarzy) zastępuje tradycyjne hasła wygodniejszym i bezpieczniejszym uwierzytelnianiem. Android udostępnia BiometricPrompt API, iOS - LocalAuthentication z Face ID i Touch ID.

## BiometricPrompt - Android

`BiometricPrompt` to rekomendowane przez Google API do obsługi uwierzytelniania biometrycznego na Androidzie, zapewniające spójny interfejs niezależnie od typu sensora (odcisk palca, twarz, tęczówka). Poniższy przykład implementuje klasę menedżera, która sprawdza dostępność biometrii i wyświetla systemowy dialog uwierzytelniania z obsługą sukcesu, błędu i nieudanej próby. Wyliczenie `BiometricStatus` pozwala czytelnie komunikować różne stany dostępności biometrii w logice aplikacji.

```kotlin
class BiometricAuthManager(private val activity: FragmentActivity) {

    // Sprawdź dostępność biometrii
    fun canAuthenticate(): BiometricStatus {
        val manager = BiometricManager.from(activity)
        return when (manager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.DEVICE_CREDENTIAL
        )) {
            BiometricManager.BIOMETRIC_SUCCESS             -> BiometricStatus.AVAILABLE
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE   -> BiometricStatus.NO_HARDWARE
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> BiometricStatus.HARDWARE_UNAVAILABLE
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> BiometricStatus.NOT_ENROLLED
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> BiometricStatus.SECURITY_UPDATE_REQUIRED
            else                                           -> BiometricStatus.UNKNOWN_ERROR
        }
    }

    // Prosta autentykacja (login, płatność)
    fun authenticate(
        title: String = "Uwierzytelnij się",
        subtitle: String = "Użyj odcisku palca lub twarzy",
        negativeButtonText: String = "Użyj hasła",
        onSuccess: () -> Unit,
        onError: (String) -> Unit,
        onFailed: () -> Unit = {}
    ) {
        val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    // result.authenticationType: BIOMETRIC lub DEVICE_CREDENTIAL
                    onSuccess()
                }
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    if (errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                        errorCode == BiometricPrompt.ERROR_USER_CANCELED) {
                        // Użytkownik anulował - OK
                    } else {
                        onError("$errString (kod: $errorCode)")
                    }
                }
                override fun onAuthenticationFailed() {
                    // Odcisk nie pasuje - ale jeszcze może spróbować
                    onFailed()
                }
            }
        )

        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setNegativeButtonText(negativeButtonText)
            // Możesz zezwolić tylko na silną biometrię (bez PIN-u)
            // .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .setConfirmationRequired(false)  // false = natychmiastowe potwierdzenie (szybciej)
            .build()

        prompt.authenticate(info)
    }
}

enum class BiometricStatus {
    AVAILABLE, NO_HARDWARE, HARDWARE_UNAVAILABLE, NOT_ENROLLED, SECURITY_UPDATE_REQUIRED, UNKNOWN_ERROR
}
```

## Kryptografia z biometrią - Cryptographic Auth

Do zabezpieczania kluczy kryptograficznych (np. deszyfrowanie tokenu) biometria musi być powiązana z Android Keystore:

```kotlin
class CryptoAuthManager(private val activity: FragmentActivity) {
    private val KEY_NAME = "biometric_key_v1"
    private val KEYSTORE = "AndroidKeyStore"

    // Generuj klucz powiązany z biometrią (raz)
    fun generateSecretKey() {
        val keyStore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
        if (keyStore.containsAlias(KEY_NAME)) return  // już istnieje

        KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE).apply {
            init(
                KeyGenParameterSpec.Builder(KEY_NAME,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                .setUserAuthenticationRequired(true)
                // Klucz nieważny po zmianie odcisku/PIN - bezpieczeństwo
                .setInvalidatedByBiometricEnrollment(true)
                // Opcjonalnie: wymagaj re-autentykacji co X sekund
                .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
                .build()
            )
            generateKey()
        }
    }

    fun getEncryptCipher(): Cipher {
        val keyStore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
        val key = keyStore.getKey(KEY_NAME, null) as SecretKey
        return Cipher.getInstance("AES/CBC/PKCS7Padding").also {
            it.init(Cipher.ENCRYPT_MODE, key)
        }
    }

    fun getDecryptCipher(iv: ByteArray): Cipher {
        val keyStore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
        val key = keyStore.getKey(KEY_NAME, null) as SecretKey
        return Cipher.getInstance("AES/CBC/PKCS7Padding").also {
            it.init(Cipher.DECRYPT_MODE, key, IvParameterSpec(iv))
        }
    }

    // Szyfruj token po autentykacji biometrycznej
    fun encryptWithBiometric(plaintext: String, onEncrypted: (ByteArray, ByteArray) -> Unit) {
        val cipher = getEncryptCipher()
        val cryptoObject = BiometricPrompt.CryptoObject(cipher)

        val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    val encryptedBytes = result.cryptoObject?.cipher?.doFinal(plaintext.toByteArray())
                    val iv = result.cryptoObject?.cipher?.iv
                    if (encryptedBytes != null && iv != null) {
                        onEncrypted(encryptedBytes, iv)
                    }
                }
            }
        )

        prompt.authenticate(
            BiometricPrompt.PromptInfo.Builder()
                .setTitle("Zaszyfruj dane")
                .setSubtitle("Uwierzytelnij się aby zabezpieczyć token")
                .setNegativeButtonText("Anuluj")
                .build(),
            cryptoObject
        )
    }
}
```

## Face ID / Touch ID - iOS (LocalAuthentication)

Na platformie iOS uwierzytelnianie biometryczne jest dostępne poprzez framework `LocalAuthentication`, obsługujący zarówno Face ID, jak i Touch ID. Poniższy przykład w Swift implementuje klasę `BiometricAuth` z metodami sprawdzającymi dostępność sensora, przeprowadzającymi prostą autentykację oraz autentykację z fallbackiem do hasła urządzenia. Integracja z SwiftUI jest zaprezentowana jako kompletny widok, który automatycznie inicjuje uwierzytelnianie po wyświetleniu i obsługuje różne scenariusze błędów.

```swift
import LocalAuthentication

class BiometricAuth {

    // Sprawdź dostępność
    static func canUseBiometrics() -> (available: Bool, type: LABiometryType, error: String?) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        return (available, context.biometryType, error?.localizedDescription)
    }

    // Prosty login
    static func authenticate(
        reason: String = "Zaloguj się używając biometrii",
        completion: @escaping (Bool, Error?) -> Void
    ) {
        let context = LAContext()
        context.localizedFallbackTitle = "Użyj hasła"  // tekst przycisku fallback
        context.localizedCancelTitle   = "Anuluj"

        context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        ) { success, error in
            DispatchQueue.main.async { completion(success, error) }
        }
    }

    // Lub z hasłem urządzenia jako fallback
    static func authenticateWithFallback(reason: String, completion: @escaping (Bool, LAError.Code?) -> Void) {
        let context = LAContext()
        context.evaluatePolicy(
            .deviceOwnerAuthentication,  // biometria + PIN/hasło jako fallback
            localizedReason: reason
        ) { success, error in
            let errorCode = (error as? LAError)?.code
            DispatchQueue.main.async { completion(success, errorCode) }
        }
    }
}

// SwiftUI - użycie
struct SecureView: View {
    @State private var isAuthenticated = false
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        Group {
            if isAuthenticated {
                ProtectedContent()
            } else {
                VStack(spacing: 24) {
                    Image(systemName: "faceid")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    Text("Zaloguj się aby kontynuować")
                    Button("Uwierzytelnij Face ID") { authenticate() }
                        .buttonStyle(.borderedProminent)
                }
            }
        }
        .alert("Błąd", isPresented: $showError) {
            Button("OK") {}
        } message: { Text(errorMessage) }
        .onAppear { authenticate() }
    }

    private func authenticate() {
        BiometricAuth.authenticate { success, error in
            if success {
                withAnimation { isAuthenticated = true }
            } else if let laError = error as? LAError {
                switch laError.code {
                case .userCancel, .systemCancel: break      // ignoruj anulowanie
                case .biometryNotEnrolled:
                    errorMessage = "Skonfiguruj Face ID w ustawieniach"
                    showError = true
                default:
                    errorMessage = laError.localizedDescription
                    showError = true
                }
            }
        }
    }
}
```

## Passkeys / FIDO2 - przyszłość uwierzytelniania

Passkeys to standard zastępujący hasła kryptograficznymi kluczami powiązanymi z urządzeniem i biometrią:

```kotlin
// Android Credential Manager API (API 28+)
class PasskeyManager(private val context: Context) {
    private val credentialManager = CredentialManager.create(context)

    // Rejestracja passkey (wymaga serwera wspierającego WebAuthn)
    suspend fun registerPasskey(username: String, challenge: ByteArray): Boolean {
        val request = CreatePublicKeyCredentialRequest(
            requestJson = buildRegistrationJson(username, challenge),
            preferImmediatelyAvailableCredentials = false
        )
        return try {
            val result = credentialManager.createCredential(context, request)
            // Wyślij result.data na serwer do weryfikacji
            true
        } catch (e: CreateCredentialException) {
            Log.e("Passkey", "Rejestracja nieudana: ${e.message}")
            false
        }
    }

    // Logowanie passkey
    suspend fun signInWithPasskey(challenge: ByteArray): String? {
        val request = GetCredentialRequest(listOf(
            GetPublicKeyCredentialOption(
                requestJson = buildAuthenticationJson(challenge)
            )
        ))
        return try {
            val result = credentialManager.getCredential(context, request)
            val credential = result.credential as PublicKeyCredential
            credential.authenticationResponseJson  // wyślij na serwer
        } catch (e: GetCredentialException) {
            null
        }
    }
}
```

## Linki

- [BiometricPrompt API](https://developer.android.com/training/sign-in/biometric-auth)
- [LocalAuthentication (Apple)](https://developer.apple.com/documentation/localauthentication)
- [Credential Manager](https://developer.android.com/training/sign-in/credential-manager)
- [WebAuthn / FIDO2](https://webauthn.guide/)

## Biometria w iOS - LocalAuthentication

Framework **LocalAuthentication** pozwala uwierzytelniać użytkownika za pomocą Face ID, Touch ID lub kodu PIN jako mechanizmu awaryjnego - bez dostępu do surowych danych biometrycznych.

### LAContext i evaluatePolicy

```swift
import LocalAuthentication

class BiometricAuthService {
    private let context = LAContext()

    func authenticate() async -> Bool {
        var error: NSError?
        guard context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics, error: &error
        ) else {
            // Brak biometrii - fallback do kodu PIN
            return await authenticateWithPasscode()
        }

        do {
            // Opis wyświetlany w oknie systemowym
            let reason = "Zaloguj się, aby uzyskać dostęp do danych konta."
            return try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
        } catch LAError.userFallback {
            return await authenticateWithPasscode()
        } catch LAError.biometryLockout {
            // Zbyt wiele nieudanych prób - wymagany kod PIN
            return await authenticateWithPasscode()
        } catch {
            return false
        }
    }

    private func authenticateWithPasscode() async -> Bool {
        let fallbackContext = LAContext()
        return (try? await fallbackContext.evaluatePolicy(
            .deviceOwnerAuthentication,
            localizedReason: "Wprowadź kod, aby kontynuować."
        )) ?? false
    }
}
```

### Uprawnienie Face ID i Info.plist

Aplikacja używająca Face ID **musi** zawierać klucz `NSFaceIDUsageDescription` w `Info.plist`, inaczej zostanie odrzucona przez App Store Review. Opis powinien wyjaśniać cel w języku zrozumiałym dla użytkownika (np. „Używamy Face ID, aby chronić Twoje dane finansowe."). Touch ID nie wymaga osobnego uprawnienia.

Typ biometrii dostępny na urządzeniu można sprawdzić przez `context.biometryType` (`.faceID`, `.touchID`, `.opticID` na Vision Pro, `.none`), co pozwala wyświetlić odpowiednią ikonę w interfejsie.

## WebAuthn - biometria w aplikacjach webowych i PWA

**WebAuthn** (Web Authentication API) to standard W3C/FIDO2 umożliwiający uwierzytelnianie bez haseł w przeglądarkach i aplikacjach webowych. Zamiast hasła użytkownik używa klucza kryptograficznego przechowywanego w urządzeniu, a potwierdzenie tożsamości odbywa się przez biometrię.

### Rejestracja klucza (navigator.credentials.create)

```typescript
// Rejestracja nowego passkey
async function registerPasskey(userId: string, userName: string): Promise<void> {
    // challenge pochodzi z serwera - nigdy nie generuj go po stronie klienta
    const challenge = await fetchChallengeFromServer();

    const credential = await navigator.credentials.create({
        publicKey: {
            challenge,
            rp: { name: "MobileHub App", id: "mobilehub.example.com" },
            user: {
                id: Uint8Array.from(userId, c => c.charCodeAt(0)),
                name: userName,
                displayName: userName
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" },   // ES256
                { alg: -257, type: "public-key" }  // RS256
            ],
            authenticatorSelection: {
                residentKey: "required",            // passkey przechowywany na urządzeniu
                userVerification: "required"        // wymaga biometrii/PIN
            },
            timeout: 60000
        }
    }) as PublicKeyCredential;

    // Wyślij odpowiedź na serwer do weryfikacji i zapisania
    await sendRegistrationToServer(credential);
}

// Logowanie z istniejącym passkey
async function loginWithPasskey(): Promise<void> {
    const challenge = await fetchChallengeFromServer();
    const assertion = await navigator.credentials.get({
        publicKey: { challenge, userVerification: "required" }
    }) as PublicKeyCredential;
    await verifyAssertionOnServer(assertion);
}
```

**Passkeys** są zsynchronizowane przez iCloud Keychain (Apple) lub Google Password Manager, co oznacza, że klucz zarejestrowany na iPhone'ie działa też na Macu. FIDO2 eliminuje problemy z phishingiem - klucz jest powiązany z domeną (`rp.id`) i nie zadziała na fałszywej stronie. Android od wersji 9, iOS od 16 i wszystkie główne przeglądarki obsługują WebAuthn.

## Klucze kryptograficzne chronione biometrią

Połączenie biometrii z kluczami kryptograficznymi pozwala budować scenariusze, w których sama biometria **nie tylko uwierzytelnia użytkownika, lecz odblokowuje klucz** do szyfrowania danych - żaden klucz nie istnieje poza sprzętowym modułem bezpieczeństwa.

### Android Keystore + BiometricPrompt + CryptoObject

```kotlin
// Generowanie klucza w Android Keystore z wymaganą biometrią
fun generateBiometricKey(keyAlias: String) {
    val keyGenSpec = KeyGenParameterSpec.Builder(
        keyAlias,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
    )
        .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
        .setUserAuthenticationRequired(true)                   // wymaga biometrii
        .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
        .setInvalidatedByBiometricEnrollment(true)             // unieważnia klucz po dodaniu nowego odcisku
        .build()

    KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        .apply { init(keyGenSpec) }
        .generateKey()
}

// Szyfrowanie danych z potwierdzeniem biometrycznym
fun encryptWithBiometric(
    fragment: Fragment,
    keyAlias: String,
    plaintext: ByteArray,
    onSuccess: (ByteArray, ByteArray) -> Unit  // ciphertext, iv
) {
    val key = (KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        .getKey(keyAlias, null) as SecretKey)
    val cipher = Cipher.getInstance("AES/CBC/PKCS7Padding").apply {
        init(Cipher.ENCRYPT_MODE, key)
    }
    val cryptoObject = BiometricPrompt.CryptoObject(cipher)

    BiometricPrompt(fragment, ContextCompat.getMainExecutor(fragment.requireContext()),
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                val encryptedData = result.cryptoObject!!.cipher!!.doFinal(plaintext)
                onSuccess(encryptedData, cipher.iv)
            }
        }
    ).authenticate(
        BiometricPrompt.PromptInfo.Builder()
            .setTitle("Potwierdź tożsamość")
            .setNegativeButtonText("Anuluj")
            .build(),
        cryptoObject
    )
}
```

### iOS SecureEnclave

Na iOS klucze prywatne mogą być przechowywane w **Secure Enclave** - dedykowanym procesorze bezpieczeństwa, z którego klucz nigdy nie wychodzi:

```swift
// Generowanie klucza EC w Secure Enclave wymagającego biometrii
let accessControl = SecAccessControlCreateWithFlags(
    nil,
    kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    [.privateKeyUsage, .biometryCurrentSet],  // .biometryCurrentSet unieważnia przy zmianie biometrii
    nil
)!

let keyAttributes: [String: Any] = [
    kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
    kSecAttrKeySizeInBits as String: 256,
    kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
    kSecPrivateKeyAttrs as String: [
        kSecAttrIsPermanent as String: true,
        kSecAttrApplicationTag as String: "com.example.app.signKey",
        kSecAttrAccessControl as String: accessControl
    ]
]
var error: Unmanaged<CFError>?
let privateKey = SecKeyCreateRandomKey(keyAttributes as CFDictionary, &error)
```

Operacja podpisywania (`SecKeyCreateSignature`) automatycznie wywołuje okno Face ID/Touch ID. Klucz publiczny można wysłać na serwer i weryfikować podpisy bez przechowywania tajnych danych po stronie backendowej - to wzorzec używany przez Apple Pay i passkeys.
