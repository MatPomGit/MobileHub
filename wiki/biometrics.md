# Biometria i Uwierzytelnianie

Biometria mobilna (odcisk palca, rozpoznawanie twarzy) zastępuje tradycyjne hasła wygodniejszym i bezpieczniejszym uwierzytelnianiem. Android udostępnia BiometricPrompt API, iOS — LocalAuthentication z Face ID i Touch ID.

## BiometricPrompt — Android

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
                        // Użytkownik anulował — OK
                    } else {
                        onError("$errString (kod: $errorCode)")
                    }
                }
                override fun onAuthenticationFailed() {
                    // Odcisk nie pasuje — ale jeszcze może spróbować
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

## Kryptografia z biometrią — Cryptographic Auth

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
                // Klucz nieważny po zmianie odcisku/PIN — bezpieczeństwo
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

## Face ID / Touch ID — iOS (LocalAuthentication)

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

// SwiftUI — użycie
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

## Passkeys / FIDO2 — przyszłość uwierzytelniania

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
