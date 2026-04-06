# Monetyzacja gier mobilnych

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

Zakupy w aplikacji (IAP) to jeden z najważniejszych źródeł przychodów gier mobilnych — od jednorazowych pakietów monet po odblokowanie pełnej wersji. Poniższy przykład demonstruje kompletną konfigurację `BillingClient`, w tym nawiązanie połączenia, odpytanie o dostępne produkty, uruchomienie ekranu zakupu oraz obsługę i weryfikację zrealizowanej transakcji.

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

Reklamy pełnoekranowe (interstitial) są naturalnym miejscem przerwy między poziomami gry, dzięki czemu zaburzają rozgrywkę w minimalnym stopniu przy jednoczesnym generowaniu przychodu. Poniższy przykład pokazuje, jak załadować i wyświetlić interstitial za pomocą Google AdMob oraz automatycznie wczytać kolejną reklamę po jej zamknięciu.

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

Subskrypcje różnią się od jednorazowych zakupów tym, że produkt musi być zdefiniowany jako `BillingClient.ProductType.SUBS` i wymaga wyboru konkretnej oferty (np. planu miesięcznego lub rocznego) za pomocą `offerToken`. Poniższy przykład pokazuje, jak odpytać Google Play o dostępne plany subskrypcyjne i uruchomić ekran zakupu z właściwym tokenem oferty.

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

Śledzenie zdarzeń analitycznych pozwala zrozumieć, gdzie gracze rezygnują z zakupu, które punkty w rozgrywce generują największe przychody i jak reklamy wpływają na retencję. Poniższa klasa demonstruje logowanie kluczowych eventów Firebase Analytics dla gry mobilnej: zakupu, otwarcia sklepu, nieudanego poziomu i obejrzanej reklamy.

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

Firebase Remote Config umożliwia dynamiczną zmianę parametrów aplikacji (np. cen, wariantów interfejsu) bez konieczności aktualizacji w sklepie, co jest podstawą testów A/B. Poniższy przykład pokazuje, jak pobrać aktualną cenę paczki startowej z Remote Config, co pozwala w Firebase Console przypisać różne wartości różnym grupom użytkowników i zmierzyć, która cena przynosi wyższy wskaźnik konwersji.

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

## Reklamy nagradzane (Rewarded Ads)

Reklamy nagradzane różnią się fundamentalnie od interstitiali: to **gracz decyduje**, czy chce obejrzeć reklamę w zamian za konkretną nagrodę w grze (życie, walutę, hint). Ten model szanuje autonomię gracza i jest znacznie mniej inwazyjny, co przekłada się na lepszy sentyment i wyższe eCPM.

### Kiedy pokazywać reklamy nagradzane?

Najlepsze miejsca na rewarded ad:
- **Bezpośrednio po przegranym poziomie** — „Obejrzyj reklamę, aby kontynuować od tego miejsca"
- **Przed dostępem do bonusowej zawartości** — dodatkowe skrzynie, premium zawartość
- **Uzupełnienie waluty** — „Obejrzyj, żeby otrzymać 50 monet"
- **Przyspieszenie produkcji** — zamiast czekać godzinę, obejrzyj 30-sekundową reklamę

### Implementacja AdMob RewardedAd

```kotlin
class RewardedAdManager(private val activity: Activity) {
    private var rewardedAd: RewardedAd? = null

    fun loadRewardedAd() {
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            activity,
            "ca-app-pub-3940256099942544/5224354917",  // test Ad Unit ID
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() {
                            rewardedAd = null
                            loadRewardedAd()  // preload kolejnej reklamy
                        }
                        override fun onAdFailedToShowFullScreenContent(error: AdError) {
                            rewardedAd = null
                        }
                    }
                }
                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                }
            }
        )
    }

    fun showRewardedAd(onRewarded: (String, Int) -> Unit, onSkipped: () -> Unit) {
        val ad = rewardedAd ?: run { onSkipped(); return }
        ad.show(activity) { rewardItem ->
            // Callback wywoływany TYLKO gdy gracz obejrzał do końca
            onRewarded(rewardItem.type, rewardItem.amount)
            // Przykład: onRewarded("coins", 100)
        }
    }
}
```

### Porównanie: Rewarded Ads vs Interstitials

| Aspekt | Rewarded Ads | Interstitials |
|--------|-------------|---------------|
| **Kontrola gracza** | Pełna (opt-in) | Brak (wymuszone) |
| **Fill Rate** | 90–99% | 85–95% |
| **eCPM (USD)** | $10–$30 | $2–$8 |
| **Sentyment gracza** | Pozytywny | Neutralny / negatywny |
| **Ryzyko odejścia** | Niskie | Umiarkowane |
| **Najlepsza konfiguracja** | Po przegranym poziomie | Między poziomami |

> **Zasada dobrego UX:** zawsze pokaż graczowi nagrodę *przed* wyświetleniem reklamy — „Obejrzyj 30-sekundową reklamę, aby otrzymać ×2 monety." Nigdy nie ukrywaj wartości nagrody.

---

## Battle Pass — implementacja sezonowa

Battle Pass (popularyzowany przez Fortnite) to sezonowy model postępu z dwoma ścieżkami nagród: **darmową** (dostępną dla wszystkich graczy) i **premium** (dla płacących). Zamiast jednorazowego zakupu, gracz kupuje dostęp do sezonu trwającego zwykle 6–10 tygodni.

### Jak działa Battle Pass?

- **Sezon** ma określony czas trwania (np. 60 dni) i pule nagród (100 tierów)
- Gracz zdobywa XP przez granie, kończenie wyzwań, logowanie się codziennie
- Każde N punktów XP awansuje gracza o jeden tier
- Tier odblokowuje nagrody z puli darmowej lub premium (jeśli gracz zapłacił)
- Po zakończeniu sezonu nagrody są **nieodwracalnie niedostępne** — FOMO motywuje do grania

### Kluczowe dane klasy BattlePass w Kotlinie

```kotlin
data class BattlePassState(
    val seasonId: Int,
    val seasonEndTimestamp: Long,        // Unix timestamp
    val isPremium: Boolean,
    val currentXp: Int,
    val xpPerTier: Int = 1000,
    val totalTiers: Int = 100
) {
    val currentTier: Int get() = (currentXp / xpPerTier).coerceAtMost(totalTiers)
    val progressInTier: Float get() = (currentXp % xpPerTier) / xpPerTier.toFloat()
    val remainingSecondsInSeason: Long get() =
        (seasonEndTimestamp - System.currentTimeMillis() / 1000).coerceAtLeast(0)
    val isSeasonActive: Boolean get() = remainingSecondsInSeason > 0
}

data class BattlePassTier(
    val tier: Int,
    val freeReward: Reward?,
    val premiumReward: Reward?,
    val isUnlocked: Boolean
)

data class Reward(
    val id: String,
    val name: String,
    val type: RewardType,  // COSMETIC, CURRENCY, XP_BOOST
    val quantity: Int
)

enum class RewardType { COSMETIC, CURRENCY, XP_BOOST, EMOTE }
```

### Logika odblokowywania nagród

```kotlin
class BattlePassManager(private val state: BattlePassState) {

    fun getUnlockedTiers(): List<BattlePassTier> =
        (1..state.currentTier).map { tier ->
            BattlePassTier(
                tier = tier,
                freeReward = getFreeRewardForTier(tier),
                premiumReward = if (state.isPremium) getPremiumRewardForTier(tier) else null,
                isUnlocked = true
            )
        }

    fun addXp(amount: Int): BattlePassState {
        val newXp = (state.currentXp + amount).coerceAtMost(state.totalTiers * state.xpPerTier)
        val oldTier = state.currentTier
        val newState = state.copy(currentXp = newXp)
        val tiersPassed = newState.currentTier - oldTier
        if (tiersPassed > 0) notifyTierUnlocked(oldTier + 1..newState.currentTier)
        return newState
    }

    private fun notifyTierUnlocked(tierRange: IntRange) {
        tierRange.forEach { tier ->
            // Wyślij push notyfikację lub event analytics
        }
    }
}
```

Kluczowe metryki Battle Pass: **sell-through rate** (% graczy kupujących premium), **tier completion rate** (ile tierów gracze kończą), **daily active quests completion** i **season retention** (czy gracz loguje się do końca sezonu).
