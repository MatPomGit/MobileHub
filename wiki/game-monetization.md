# Monetyzacja Gier Mobilnych

Gry mobilne generują większość przychodów z App Store i Google Play. Wybór modelu monetyzacji wpływa na projektowanie mechaniki gry, retencję graczy i długoterminowe przychody.

## Modele monetyzacji

| Model | Opis | Przykłady | Zalety |
|-------|------|-----------|--------|
| **Premium** | Jednorazowy zakup | Minecraft, Alto's Odyssey | Uczciwy, brak barier |
| **Freemium (F2P)** | Darmowa + IAP | Clash of Clans, PUBG Mobile | Szeroka baza graczy |
| **Subskrypcja** | Miesięczne płatności | Apple Arcade, GamePass | Przewidywalne przychody |
| **Reklamy** | Wyświetlanie reklam | Hyper-casual gry | Bez bariery wejścia |
| **Battle Pass** | Sezonowy pass | Fortnite, Brawl Stars | Retencja + zaangażowanie |
| **Hybrid** | Kilka modeli naraz | Większość mid-core | Maksymalne przychody |

## In-App Purchases (IAP) — Google Play Billing

```kotlin
class BillingManager(private val context: Context) {
    private val billingClient = BillingClient.newBuilder(context)
        .setListener { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                purchases?.forEach { purchase ->
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        handlePurchase(purchase)
                    }
                }
            }
        }
        .enablePendingPurchases()
        .build()

    fun startConnection(onReady: () -> Unit) {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) onReady()
            }
            override fun onBillingServiceDisconnected() {
                // Ponów połączenie
            }
        })
    }

    suspend fun queryProducts(productIds: List<String>): List<ProductDetails> {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productIds.map { id ->
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
            }).build()

        val result = billingClient.queryProductDetails(params)
        return if (result.billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
            result.productDetailsList ?: emptyList()
        } else emptyList()
    }

    fun launchPurchase(activity: Activity, product: ProductDetails) {
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(product)
                        .build()
                )
            ).build()
        billingClient.launchBillingFlow(activity, params)
    }

    private fun handlePurchase(purchase: Purchase) {
        // Weryfikuj zakup na serwerze, następnie przyznaj zawartość
        coroutineScope.launch {
            val verified = verifyPurchaseOnServer(purchase.purchaseToken)
            if (verified) {
                grantPurchaseContent(purchase.products)
                acknowledgePurchase(purchase)
            }
        }
    }
}
```

## Reklamy — Unity Ads + AdMob

```kotlin
// Google AdMob — Interstitial (pełnoekranowa)
class AdManager(private val activity: Activity) {
    private var interstitialAd: InterstitialAd? = null

    fun loadInterstitial() {
        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(
            activity,
            "ca-app-pub-3940256099942544/1033173712",  // test ID
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() {
                            interstitialAd = null
                            loadInterstitial()  // załaduj następną
                        }
                    }
                }
                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
                }
            }
        )
    }

    fun showInterstitialBetweenLevels() {
        interstitialAd?.show(activity) ?: run {
            // Reklama nie gotowa — kontynuuj bez niej
            proceedToNextLevel()
        }
    }
}
```

## Projektowanie uczciwe (Ethical Design)

Branża gier mobilnych zmaga się z problemem nieetycznych mechanik:

| Praktyka | Opis | Etyczna alternatywa |
|---------|------|---------------------|
| **Pay-to-win** | Zakupy dają przewagę w PvP | Zakupy kosmetyczne |
| **Loot boxes** | Losowe nagrody | Bezpośredni zakup |
| **Energia/lives** | Limit grania wymusza zakup | Brak lub długi reset |
| **FOMO events** | Tylko 24h! | Dłuższe okna |
| **Dark patterns** | Celowo mylące UI zakupu | Przejrzyste ceny |

> **Apple App Store (2021+) i Google Play wymagają** ujawnienia szans w loot boxes. Niektóre kraje (Belgia, Niderlandy) zakazały loot boxes jako formę hazardu.

## Linki

- [Google Play Billing](https://developer.android.com/google/play/billing)
- [AdMob](https://admob.google.com)
- [IAP Best Practices](https://developer.android.com/google/play/billing/best-practices)

## Subskrypcje — Google Play Billing

```kotlin
// Subskrypcje mają inną strukturę niż jednorazowe zakupy
suspend fun querySubscriptions(): List<ProductDetails> {
    val params = QueryProductDetailsParams.newBuilder()
        .setProductList(listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("premium_monthly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("premium_annual")
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )).build()

    val result = billingClient.queryProductDetails(params)
    return result.productDetailsList ?: emptyList()
}

fun launchSubscriptionPurchase(activity: Activity, product: ProductDetails) {
    // Subskrypcja może mieć różne plany (miesięczny/roczny)
    val offerToken = product.subscriptionOfferDetails
        ?.firstOrNull { it.offerId == null }  // plan bazowy
        ?.offerToken ?: return

    val params = BillingFlowParams.newBuilder()
        .setProductDetailsParamsList(listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(product)
                .setOfferToken(offerToken)
                .build()
        )).build()

    billingClient.launchBillingFlow(activity, params)
}
```

## Analytics — mierzenie KPI monetyzacji

```kotlin
// Firebase Analytics — kluczowe eventy dla gier
class GameAnalytics(private val firebaseAnalytics: FirebaseAnalytics) {

    // Zakup w grze
    fun logPurchase(productId: String, price: Double, currency: String = "PLN") {
        firebaseAnalytics.logEvent(FirebaseAnalytics.Event.PURCHASE) {
            param(FirebaseAnalytics.Param.ITEM_ID, productId)
            param(FirebaseAnalytics.Param.VALUE, price)
            param(FirebaseAnalytics.Param.CURRENCY, currency)
        }
    }

    // Wyświetlenie sklepu
    fun logShopOpened(source: String) {
        firebaseAnalytics.logEvent("shop_opened") {
            param("source", source)  // "level_failed", "main_menu", "out_of_lives"
        }
    }

    // Utknięcie na poziomie — okazja do monetyzacji
    fun logLevelFailed(level: Int, attemptsCount: Int) {
        firebaseAnalytics.logEvent("level_failed") {
            param("level", level.toLong())
            param("attempts", attemptsCount.toLong())
        }
    }

    // Obejrzenie reklamy
    fun logAdWatched(adType: String, reward: String) {
        firebaseAnalytics.logEvent("ad_watched") {
            param("ad_type", adType)       // "rewarded", "interstitial"
            param("reward", reward)         // "extra_life", "coins_100"
        }
    }
}
```

## A/B Testing cen — Remote Config

```kotlin
// Firebase Remote Config — testuj różne strategie cen
class PricingExperiment {
    private val remoteConfig = Firebase.remoteConfig

    suspend fun getPriceForStarterPack(): Double {
        remoteConfig.fetchAndActivate().await()
        return remoteConfig.getDouble("starter_pack_price")
        // Konfiguruj warianty A/B w Firebase Console:
        // Wariant A: 9.99, Wariant B: 14.99, Wariant C: 4.99
    }

    fun getShowBonusChest(): Boolean =
        remoteConfig.getBoolean("show_bonus_chest_offer")

    // Grupy użytkowników widzą różne ceny — mierzysz CVR (conversion rate)
}
```

## Kluczowe metryki monetyzacji

| Metryka | Opis | Dobry wynik |
|---------|------|-------------|
| **DAU/MAU** | Aktywność dzienna/miesięczna | >20% |
| **ARPU** | Średni przychód na użytkownika | Zależy od gatunku |
| **ARPPU** | Średni przychód na płacącego | 3-10× ARPU |
| **Conversion Rate** | % graczy dokonujących zakupu | 2-5% F2P |
| **LTV** | Lifetime Value — całkowity przychód z gracza | >CAC |
| **Churn Rate** | % graczy odchodzących | <5%/miesiąc |
| **Session Length** | Średnia długość sesji | >8 min |
| **Retention D1/D7/D30** | Powrót po 1/7/30 dniach | >40%/20%/10% |

## Linki dodatkowe

- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Firebase Remote Config](https://firebase.google.com/docs/remote-config)
- [App Store Connect — Revenue Reports](https://developer.apple.com/app-store-connect/)
