# Bezpieczeństwo Aplikacji Mobilnych

Bezpieczeństwo mobilne obejmuje ochronę danych użytkownika, bezpieczną komunikację sieciową, odporność na reverse engineering i zgodność z regulacjami (RODO/GDPR, HIPAA). Naruszenie bezpieczeństwa = utrata zaufania, ocen i potencjalne konsekwencje prawne.

## OWASP Mobile Top 10

OWASP (Open Web Application Security Project) publikuje listę 10 najważniejszych zagrożeń dla aplikacji mobilnych:

| # | Zagrożenie | Przykład |
|---|-----------|---------|
| M1 | Improper Credential Usage | Hardkodowane hasła w APK |
| M2 | Inadequate Supply Chain Security | Zależności z podatnościami |
| M3 | Insecure Authentication | Brak weryfikacji tokenu |
| M4 | Insufficient Input/Output Validation | SQL injection, XSS |
| M5 | Insecure Communication | Brak Certificate Pinning |
| M6 | Inadequate Privacy Controls | Zbieranie zbędnych danych |
| M7 | Insufficient Binary Protections | Brak obfuskacji |
| M8 | Security Misconfiguration | Debuggable=true w release |
| M9 | Insecure Data Storage | Token w SharedPreferences |
| M10 | Insufficient Cryptography | MD5, ECB mode |

## Bezpieczne przechowywanie danych

### Android Keystore + EncryptedSharedPreferences

```kotlin
// NIGDY nie przechowuj tokenów i haseł w zwykłych SharedPreferences!
// Użyj EncryptedSharedPreferences lub własnego szyfrowania kluczem z Keystore

// Opcja 1 — EncryptedSharedPreferences (najłatwiejsze)
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .setUserAuthenticationRequired(false)  // true = wymaga biometrii/PIN
    .build()

val securePrefs = EncryptedSharedPreferences.create(
    context,
    "secure_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)

// Zapisz token bezpiecznie
securePrefs.edit { putString("auth_token", token) }
val savedToken = securePrefs.getString("auth_token", null)
```

```kotlin
// Opcja 2 — własne szyfrowanie z Android Keystore (AES-256-GCM)
object SecureDataStore {
    private const val KEY_ALIAS = "app_main_key_v2"
    private const val PREFS_NAME = "encrypted_data"
    private const val ALGORITHM = "AES/GCM/NoPadding"

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        return keyStore.getKey(KEY_ALIAS, null) as? SecretKey
            ?: KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
                .apply {
                    init(
                        KeyGenParameterSpec.Builder(
                            KEY_ALIAS,
                            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                        )
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setKeySize(256)
                        .setRandomizedEncryptionRequired(true)
                        .build()
                    )
                }.generateKey()
    }

    fun encrypt(plaintext: String): EncryptedData {
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
        return EncryptedData(ciphertext, cipher.iv)
    }

    fun decrypt(data: EncryptedData): String {
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(128, data.iv))
        return String(cipher.doFinal(data.ciphertext), Charsets.UTF_8)
    }
}

data class EncryptedData(
    val ciphertext: ByteArray,
    val iv: ByteArray
)
```

## Certificate Pinning

Certificate Pinning chroni przed atakami Man-in-the-Middle, gdzie atakujący podstawia własny certyfikat TLS:

```kotlin
// OkHttp Certificate Pinning
val certificatePinner = CertificatePinner.Builder()
    // Pobierz SHA-256 pin: openssl s_client -connect api.example.com:443 | openssl x509 -pubkey -noout | openssl rsa -pubin -outform der | openssl dgst -sha256 -binary | base64
    .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .add("api.example.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")  // Backup pin!
    .build()

val httpClient = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .addInterceptor { chain ->
        val response = chain.proceed(chain.request())
        if (!response.isSuccessful) {
            Log.w("Security", "Unexpected response: ${response.code}")
        }
        response
    }
    .build()
```

> **Uwaga:** Zawsze dodaj backup pin (certyfikat CA lub następny certyfikat serwera). Bez backupu ryzykujesz zablokowanie aplikacji gdy certyfikat wygaśnie.

## Bezpieczeństwo AndroidManifest.xml

```xml
<!-- AndroidManifest.xml — typowe błędy bezpieczeństwa -->

<!-- BŁĄD: debuggable w release -->
<application android:debuggable="true">  <!-- NIGDY w release! -->

<!-- BŁĄD: eksportowane komponenty bez ochrony -->
<activity android:name=".AdminActivity" android:exported="true" />

<!-- POPRAWNIE: ogranicz dostęp sygnaturą -->
<activity
    android:name=".AdminActivity"
    android:exported="true"
    android:permission="com.example.permission.ADMIN" />

<!-- POPRAWNIE: blokuj backup danych -->
<application
    android:allowBackup="false"
    android:fullBackupContent="false"
    android:dataExtractionRules="@xml/backup_rules">

<!-- POPRAWNIE: content provider niepubliczny -->
<provider
    android:name=".DataProvider"
    android:exported="false"
    android:authorities="com.example.provider" />

<!-- Uprawnienia sieciowe i cleartext -->
<application android:usesCleartextTraffic="false">  <!-- Zablokuj HTTP -->

<!-- POPRAWNIE: Network Security Config dla konkretnych wyjątków -->
<application android:networkSecurityConfig="@xml/network_security_config">
```

```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <!-- Wyjątek dla local network IoT -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.1.0</domain>
    </domain-config>
    <!-- Certificate pinning -->
    <domain-config>
        <domain includeSubdomains="true">api.example.com</domain>
        <pin-set expiration="2026-01-01">
            <pin digest="SHA-256">AAAA...=</pin>
            <pin digest="SHA-256">BBBB...=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

## Root i Tamper Detection

```kotlin
class SecurityChecker {

    // Sprawdź podstawowe oznaki rootowania
    fun isDeviceRooted(): Boolean {
        return checkRootFiles() || checkBuildTags() || checkSuCommand()
    }

    private fun checkRootFiles(): Boolean {
        val rootPaths = listOf(
            "/system/app/Superuser.apk",
            "/system/xbin/su",
            "/sbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )
        return rootPaths.any { File(it).exists() }
    }

    private fun checkBuildTags(): Boolean =
        Build.TAGS?.contains("test-keys") == true

    private fun checkSuCommand(): Boolean {
        return try {
            Runtime.getRuntime().exec(arrayOf("/system/xbin/su"))
            true
        } catch (e: IOException) {
            false
        }
    }

    // Sprawdź integralność APK (Play Integrity API — bardziej niezawodne)
    suspend fun verifyWithPlayIntegrity(context: Context): IntegrityVerdict {
        val nonce = generateSecureNonce()
        val integrityManager = IntegrityManagerFactory.create(context)
        val request = IntegrityTokenRequest.builder().setNonce(nonce).build()
        val token = integrityManager.requestIntegrityToken(request).await()

        // Wyślij token na własny backend do weryfikacji przez Google API
        return backendApi.verifyIntegrityToken(token.token())
    }

    private fun generateSecureNonce() =
        Base64.encodeToString(ByteArray(32).also { SecureRandom().nextBytes(it) }, Base64.NO_WRAP)
}
```

## Bezpieczna komunikacja — SSL/TLS

```kotlin
// Tylko TLS 1.2+ i bezpieczne szyfry
val tlsSpec = ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
    .tlsVersions(TlsVersion.TLS_1_3, TlsVersion.TLS_1_2)
    .cipherSuites(
        CipherSuite.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
        CipherSuite.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
        CipherSuite.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
    )
    .build()

val secureClient = OkHttpClient.Builder()
    .connectionSpecs(listOf(tlsSpec))
    .build()
```

## Linki

- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-app-security/)
- [Android Security Best Practices](https://developer.android.com/topic/security/best-practices)
- [Play Integrity API](https://developer.android.com/google/play/integrity)
- [iOS Security Guide](https://support.apple.com/guide/security/welcome/web)
