# Camera API i przetwarzanie obrazu w aplikacjach mobilnych

Kamera w urządzeniu mobilnym nie jest wyłącznie „modułem do robienia zdjęć”. Z perspektywy inżynierii oprogramowania jest to złożony sensor czasu rzeczywistego, który dostarcza strumień danych do systemów percepcji maszynowej, rozszerzonej rzeczywistości, biometrii, skanowania dokumentów, wideokomunikacji, nawigacji oraz analityki obrazu. Współczesne aplikacje mobilne nie pracują więc na „obrazie z kamery” w sensie potocznym, lecz na rezultacie całego pipeline'u obliczeniowego: od fotonów padających na matrycę, przez przetwarzanie ISP (Image Signal Processor), aż po struktury API udostępniane przez system operacyjny.

Na Androidzie rekomendowaną warstwą wysokiego poziomu jest CameraX, a na iOS i iPadOS rolę podstawowego frameworka pełni AVFoundation. Oba podejścia rozwiązują ten sam problem: jak bezpiecznie, wydajnie i przewidywalnie sterować zasobem sprzętowym, który jest jednocześnie kosztowny energetycznie, silnie zależny od możliwości urządzenia i wyjątkowo wrażliwy na błędy synchronizacji oraz zarządzania pamięcią.


---

## 1. Kamera jako pipeline przetwarzania sygnału

Najprostszy intuicyjny model „kamera robi zdjęcie” jest technicznie błędny. Kamera realizuje ciąg etapów:

```text
Scena -> optyka -> sensor -> odczyt matrycy -> ISP -> bufor obrazu -> API systemowe ->
preview / zapis / analiza ML / transmisja / archiwizacja
```

W praktyce oznacza to, że aplikacja najczęściej nie pracuje na „surowej rzeczywistości”, lecz na obrazie już przetworzonym. Po drodze wykonywane są między innymi:

- autoekspozycja (AE),
- autofokus (AF),
- automatyczny balans bieli (AWB),
- redukcja szumu,
- wyostrzanie,
- demosaicing, czyli rekonstrukcja koloru z matrycy Bayera,
- korekcja dystorsji optycznej,
- często także elementy fotografii obliczeniowej, jak HDR czy wieloklatkowe odszumianie.

### Dlaczego to ważne dla programisty

To, co otrzymujemy w aplikacji, jest kompromisem między jakością, przepustowością, opóźnieniem i poborem energii. Ta obserwacja tłumaczy dużą część decyzji projektowych w CameraX i AVFoundation:

- dlatego istnieje rozdzielenie na `Preview`, `ImageCapture` i `ImageAnalysis`,
- dlatego analiza w czasie rzeczywistym zwykle pracuje na buforach YUV zamiast na JPEG,
- dlatego nie wolno blokować strumienia przez zbyt długie przetwarzanie jednej klatki,
- dlatego obrót obrazu bywa metadanymi, a nie fizycznym obrotem pikseli,
- dlatego ten sam aparat może dawać inne rezultaty dla podglądu, skanu QR i finalnego zdjęcia.

### Ciekawostka

Większość sensorów rejestruje natywnie jasność i składowe barwne przez filtr Bayera. „Kolorowy piksel” w gotowym obrazie nie jest więc bezpośrednio mierzony, lecz rekonstruowany obliczeniowo. To jeden z powodów, dla których nowoczesna fotografia mobilna jest w równym stopniu problemem programistycznym co optycznym.

---

## 2. Warstwy API na Androidzie i iOS

### 2.1 Android: od Camera1 do CameraX

Na Androidzie historycznie istniało niskopoziomowe API Camera1, później Camera2, a następnie CameraX jako warstwa Jetpack upraszczająca pracę z różnorodnym sprzętem. Camera2 daje większą kontrolę, ale wymaga znacznie bardziej szczegółowego zarządzania sesjami, powierzchniami, stanami urządzenia i kompatybilnością. CameraX abstrahuje nad Camera2 i dostarcza model oparty na „use case'ach”, czyli deklaratywnych celach użycia, takich jak podgląd, zdjęcie, analiza i wideo.

### 2.2 iOS: AVFoundation

W ekosystemie Apple głównym frameworkiem do zaawansowanej obsługi kamery jest AVFoundation. Podobnie jak Camera2/CameraX na Androidzie, AVFoundation oddziela wejścia (`AVCaptureDeviceInput`) od wyjść (`AVCapturePhotoOutput`, `AVCaptureVideoDataOutput`, `AVCaptureMovieFileOutput`) oraz centralnej sesji (`AVCaptureSession`).

### Dlaczego w ogóle istnieją warstwy wysokiego poziomu

Programista aplikacji najczęściej nie chce zarządzać każdym szczegółem sensora. Zwykle chce odpowiedzieć na pytania:

- jak pokazać podgląd,
- jak zrobić zdjęcie,
- jak analizować klatki,
- jak nagrać wideo,
- jak nie zepsuć działania na setkach urządzeń.

Warstwy wysokiego poziomu powstały właśnie po to, aby ograniczyć liczbę decyzji sprzętowo-zależnych, zachowując rozsądną kontrolę nad wydajnością.

---

## 3. Dlaczego CameraX jest zwykle lepszym punktem startowym niż Camera2

CameraX jest zalecanym punktem startowym dla nowych aplikacji na Androidzie. Jego główna przewaga polega na tym, że przenosi znaczną część złożoności urządzeniowej z aplikacji do biblioteki zgodności. Oficjalna dokumentacja podkreśla, że CameraX jest biblioteką Jetpack przeznaczoną do uproszczenia rozwoju aplikacji kamerowych, rekomendowaną dla nowych aplikacji i kompatybilną wstecz do Androida 5.0 (API 21).

### Najważniejsze konsekwencje architektoniczne

1. Programista myśli w kategoriach celu, a nie sesji niskiego poziomu.
2. Biblioteka lepiej obsługuje fragmentację sprzętową.
3. Wiązanie z `LifecycleOwner` upraszcza zarządzanie stanami aktywności i fragmentów.
4. Można łączyć przypadki użycia, zamiast ręcznie konfigurować cały graf strumieni.

### Dlaczego nie zawsze CameraX

Są sytuacje, w których Camera2 lub niższy poziom kontroli jest uzasadniony:

- aplikacje wymagające bardzo precyzyjnych manualnych parametrów sensora,
- niestandardowe workflow RAW,
- zaawansowane scenariusze przemysłowe lub badawcze,
- eksperymentalne pipeline'y o bardzo nietypowych wymaganiach.

W typowych aplikacjach konsumenckich CameraX zwykle daje jednak lepszy stosunek złożoności do rezultatu.

---

## 4. Architektura CameraX

Dokumentacja CameraX opisuje model oparty na abstrakcji `use case`. Dostępne są `Preview`, `ImageAnalysis`, `ImageCapture` i `VideoCapture`, a przypadki użycia można łączyć i aktywować współbieżnie. CameraX oferuje też dwa style pracy: prostszy `CameraController` oraz bardziej elastyczny `CameraProvider`.

### 4.1 Główne elementy

- `ProcessCameraProvider` – zarządza dostępem do kamery oraz wiązaniem use case'ów.
- `CameraSelector` – wybiera kamerę, np. tylną lub przednią.
- `Preview` – dostarcza obraz do podglądu na żywo.
- `ImageCapture` – realizuje fotografowanie.
- `ImageAnalysis` – dostarcza bufory dostępne dla CPU.
- `VideoCapture` – obsługuje nagrywanie obrazu i dźwięku.
- `PreviewView` – gotowy komponent UI do wyświetlania podglądu.

### 4.2 Schemat logiczny

Zrozumienie architektury CameraX jest kluczowe dla prawidłowego projektowania aplikacji kamerowych. Poniższy diagram pokazuje hierarchię zależności między głównym dostawcą kamery a poszczególnymi przypadkami użycia: podglądem, fotografowaniem i analizą. Każdy use case działa niezależnie, lecz wszystkie są koordynowane przez `ProcessCameraProvider` i wiązane z cyklem życia komponentu.

```text
                     +-------------------------+
                     |   ProcessCameraProvider |
                     +-----------+-------------+
                                 |
                         bindToLifecycle()
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
     +---v---+              +----v----+            +----v----+
     |Preview|              |ImageCap.|            |ImageAn. |
     +---+---+              +----+----+            +----+----+
         |                       |                      |
   PreviewView/UI           JPEG/HEIF/plik       ML / CV / OCR / QR
```

### Dlaczego use case'y są rozdzielone

Ponieważ każda ścieżka ma inny profil wymagań:

- `Preview` wymaga niskiego opóźnienia i dobrej responsywności interfejsu.
- `ImageCapture` dąży do wysokiej jakości finalnego obrazu.
- `ImageAnalysis` potrzebuje buforów dogodnych do obliczeń, niekoniecznie do prezentacji.
- `VideoCapture` musi synchronizować obraz, dźwięk, enkodowanie i zapis.

Jedno uniwersalne API dla wszystkich tych ścieżek byłoby trudniejsze w użyciu i mniej wydajne.

---

## 5. Lifecycle jako fundament zarządzania kamerą

Jedną z najważniejszych decyzji architektonicznych CameraX jest związanie przypadków użycia z cyklem życia komponentu Androida. Oficjalna dokumentacja wskazuje wprost, że aplikacja określa zamierzony przepływ działania przez wiązanie use case'ów z Android Architecture Lifecycles, a CameraX obserwuje cykl życia, by wiedzieć, kiedy otworzyć kamerę, utworzyć sesję i kiedy ją zatrzymać.

### Dlaczego to jest robione w ten sposób

Kamera jest zasobem ekskluzywnym i kosztownym. Gdy aplikacja przechodzi do tła, dalsze utrzymywanie aktywnej sesji kamery zwykle jest błędem z trzech powodów:

1. Zużywa energię i generuje ciepło.
2. Może blokować dostęp innym aplikacjom lub samemu systemowi.
3. Zwiększa ryzyko wycieków zasobów i awarii przy zmianach konfiguracji.

Z punktu widzenia inżynierii oprogramowania lifecycle binding jest więc mechanizmem wymuszającym poprawny stan systemu, a nie wyłącznie „ułatwieniem”.

---

## 6. Zależności Gradle i przygotowanie projektu

W materiałach dydaktycznych warto rozdzielić nazwę artefaktu od jego wersji. W praktyce produkcyjnej wersje należy pinować do konkretnych wydań i aktualizować zgodnie z release notes, a nie używać strategii typu `latest.release`.

```kotlin
// build.gradle.kts (moduł app)
dependencies {
    val camerax = "<aktualna_wersja_CameraX_z_release_notes>"

    implementation("androidx.camera:camera-core:$camerax")
    implementation("androidx.camera:camera-camera2:$camerax")
    implementation("androidx.camera:camera-lifecycle:$camerax")
    implementation("androidx.camera:camera-view:$camerax")
    implementation("androidx.camera:camera-video:$camerax")

    // ML Kit - wybierz tylko to, czego rzeczywiście potrzebujesz
    implementation("com.google.mlkit:barcode-scanning:<wersja>")
    implementation("com.google.mlkit:text-recognition:<wersja>")
    implementation("com.google.mlkit:face-detection:<wersja>")
}
```

### Dlaczego nie warto używać „magicznych” najnowszych wersji bez kontroli

W środowisku dydaktycznym łatwo wpaść w pułapkę: „zawsze pobieraj najnowsze”. W praktyce profesjonalnej to zła rada. Aplikacja powinna być reproducowalna. Oznacza to, że zespół musi wiedzieć dokładnie, które wersje bibliotek zbudowały konkretny artefakt APK lub IPA. W przeciwnym razie dwa buildy wykonane tego samego dnia mogą zachowywać się inaczej.

---

## 7. Uprawnienia i prywatność

### 7.1 Android

Dla samego obrazu wymagane jest uprawnienie `CAMERA`. Przy nagrywaniu z dźwiękiem dochodzi `RECORD_AUDIO`. Warto prosić o zgodę dopiero w kontekście funkcjonalnym, a nie natychmiast po uruchomieniu aplikacji.

### Dlaczego prosimy o uprawnienie dopiero wtedy, gdy użytkownik rozumie cel

Z punktu widzenia UX i bezpieczeństwa użytkownik powinien znać powód żądania. Informacja „potrzebujemy kamery do skanowania kodu” jest czytelna. Informacja „daj uprawnienie, bo tak” obniża współczynnik zgód i pogarsza zaufanie do aplikacji.

### Przykład – bramka uprawnień w Compose

Przed uruchomieniem kamery aplikacja musi sprawdzić i ewentualnie poprosić o odpowiednie uprawnienie systemowe. Poniższy przykład pokazuje implementację composable pełniącego rolę „bramki uprawnień" — wyświetla treść kamery po udzieleniu zgody, a komunikat z prośbą o uprawnienie, jeśli zgoda nie została jeszcze nadana. Takie podejście pozwala elegancko obsłużyć oba stany bez rozpraszania logiki w głównym ekranie.

```kotlin
@Composable
fun CameraPermissionGate(content: @Composable () -> Unit) {
    val context = LocalContext.current
    var granted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted = it }

    LaunchedEffect(Unit) {
        if (!granted) launcher.launch(Manifest.permission.CAMERA)
    }

    if (granted) {
        content()
    } else {
        Column(Modifier.padding(24.dp)) {
            Text("Aplikacja potrzebuje dostępu do kamery, aby wyświetlić podgląd i analizować obraz.")
            Spacer(Modifier.height(12.dp))
            Button(onClick = { launcher.launch(Manifest.permission.CAMERA) }) {
                Text("Nadaj uprawnienie")
            }
        }
    }
}
```

### 7.2 iOS

W AVFoundation użytkownik również musi wyrazić zgodę na użycie kamery i mikrofonu. Apple wymaga jawnego sprawdzenia statusu autoryzacji i wywołania żądania dostępu, gdy status to `notDetermined`. System zapamiętuje wybór użytkownika, ale może on później zmienić go w ustawieniach.

### Dlaczego oba systemy są restrykcyjne

Kamera to sensor prywatnościowo krytyczny. Zawiera dane o twarzy, miejscu pobytu, otoczeniu, dokumentach, ekranach innych urządzeń i obiektach codziennego użytku. W nowoczesnych systemach operacyjnych dostęp do kamery jest więc kontrolowany nie tylko z powodu bezpieczeństwa technicznego, ale także z powodu ochrony danych osobowych.

---

## 8. Podgląd kamery w CameraX i Jetpack Compose

### 8.1 `PreviewView` i `AndroidView`

W praktyce podgląd kamery na Androidzie nadal opiera się na klasycznym komponencie `PreviewView`, który osadza się w Compose przez `AndroidView`.

### Dlaczego nie jest to „czysty Compose”

Ponieważ strumień wideo jest renderowany przez wyspecjalizowane prymitywy systemowe (`SurfaceView` lub `TextureView`). Compose jest frameworkiem deklaratywnego UI, ale nie zastępuje niskopoziomowych powierzchni renderujących wideo. Stąd most między światem Compose i światem widoków systemowych.

### Tryby implementacji `PreviewView`

Dokumentacja wskazuje, że domyślny tryb to `PERFORMANCE`, natomiast `COMPATIBLE` wykorzystuje `TextureView`. Gdy to możliwe, `PERFORMANCE` używa `SurfaceView`, co omija ścieżkę GPU i może obniżyć opóźnienie oraz pobór energii. `COMPATIBLE` daje większą elastyczność transformacji i nakładania treści, ale zwykle kosztem wydajności.

### Dlaczego w wielu tutorialach widzi się `COMPATIBLE`

Bo `TextureView` jest wygodny przy eksperymentach z animacjami, efektami i nietypowym skalowaniem. W systemach produkcyjnych nie należy jednak wybierać go bez powodu. Jeśli nie ma konkretnego problemu kompatybilności, warto zacząć od `PERFORMANCE`.

### Praktyczny przykład – podgląd i fotografowanie

Poniższy przykład demonstruje pełny ekran podglądu kamery połączony z możliwością wykonania zdjęcia w Jetpack Compose. Kamera jest powiązana z cyklem życia composable za pomocą `DisposableEffect`, co zapewnia jej automatyczne zwolnienie po opuszczeniu ekranu. Przycisk wyzwalacza zapisuje zdjęcie do pamięci podręcznej i zwraca identyfikator URI do pliku.

```kotlin
@Composable
fun CameraPreviewScreen(onPhotoTaken: (Uri) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val mainExecutor = remember(context) { ContextCompat.getMainExecutor(context) }
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    val previewView = remember {
        PreviewView(context).apply {
            implementationMode = PreviewView.ImplementationMode.PERFORMANCE
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }

    val preview = remember { Preview.Builder().build() }
    val imageCapture = remember {
        ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .setFlashMode(ImageCapture.FLASH_MODE_AUTO)
            .build()
    }

    DisposableEffect(lifecycleOwner) {
        val listener = Runnable {
            val cameraProvider = cameraProviderFuture.get()
            preview.setSurfaceProvider(previewView.surfaceProvider)
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                CameraSelector.DEFAULT_BACK_CAMERA,
                preview,
                imageCapture
            )
        }

        cameraProviderFuture.addListener(listener, mainExecutor)

        onDispose {
            if (cameraProviderFuture.isDone) {
                cameraProviderFuture.get().unbindAll()
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        AndroidView(
            factory = { previewView },
            modifier = Modifier.fillMaxSize()
        )

        IconButton(
            onClick = {
                val file = File(context.cacheDir, "photo_${System.currentTimeMillis()}.jpg")
                val options = ImageCapture.OutputFileOptions.Builder(file).build()

                imageCapture.takePicture(
                    options,
                    mainExecutor,
                    object : ImageCapture.OnImageSavedCallback {
                        override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                            onPhotoTaken(output.savedUri ?: Uri.fromFile(file))
                        }

                        override fun onError(exception: ImageCaptureException) {
                            Log.e("CameraX", "Capture failed", exception)
                        }
                    }
                )
            },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp)
                .size(72.dp)
                .background(Color.White, CircleShape)
        ) {
            Icon(Icons.Default.CameraAlt, contentDescription = "Zrób zdjęcie", tint = Color.Black)
        }
    }
}
```

### Co tu jest ważne i dlaczego

- `remember { PreviewView(...) }` – nie tworzymy nowej powierzchni przy każdej rekombinacji.
- `DisposableEffect` – wiązanie i odwiązanie kamery powinno być powiązane z życiem composable.
- `unbindAll()` – zapobiega konfliktom między poprzednimi i nowymi konfiguracjami.
- `CAPTURE_MODE_MINIMIZE_LATENCY` – dobry domyślny wybór dla interaktywnych scenariuszy.
- `cacheDir` – w przykładzie dydaktycznym jest wystarczający; w produkcji należy zaprojektować docelowy model przechowywania.

---

## 9. Fotografowanie: `ImageCapture`

`ImageCapture` odpowiada za wykonanie finalnego zdjęcia. Dokumentacja CameraX wskazuje dwa podstawowe tryby: `CAPTURE_MODE_MINIMIZE_LATENCY` oraz `CAPTURE_MODE_MAXIMIZE_QUALITY`, przy czym domyślny jest pierwszy z nich. Istnieje też eksperymentalny tryb Zero-Shutter Lag.

### 9.1 Latency vs quality

To klasyczny kompromis systemowy.

- `MINIMIZE_LATENCY` – ważny, gdy użytkownik oczekuje natychmiastowej reakcji po naciśnięciu spustu.
- `MAXIMIZE_QUALITY` – lepszy, gdy zależy nam na jakości końcowej bardziej niż na czasie reakcji.

### Dlaczego domyślnie preferowana jest latencja

Bo w typowej aplikacji mobilnej użytkownik silniej odczuwa opóźnienie niż subtelny zysk jakości. To decyzja z obszaru HCI: perceived responsiveness bardzo silnie wpływa na ocenę jakości aplikacji.

### 9.2 Zero-Shutter Lag

Oficjalna dokumentacja CameraX opisuje Zero-Shutter Lag jako tryb wykorzystujący pierścieniowy bufor trzech ostatnich klatek. Po wciśnięciu spustu biblioteka wybiera klatkę o znaczniku czasu najbliższym chwili naciśnięcia. Jeśli funkcja nie jest wspierana, CameraX wraca do `CAPTURE_MODE_MINIMIZE_LATENCY`.

### Dlaczego to działa

Użytkownik psychologicznie utożsamia zdjęcie z chwilą dotknięcia przycisku. System może więc „cofnąć się” o ułamek sekundy do klatki już zarejestrowanej i dać wrażenie natychmiastowego uchwycenia momentu.

### Ciekawostka

Zero-Shutter Lag nie działa, gdy flash jest włączony lub w trybie AUTO. Wynika to z faktu, że błysk i związana z nim ekspozycja zmieniają warunki rejestracji i niwelują korzyść z wcześniejszego buforowania.

---

## 10. `ImageAnalysis`: analiza klatek w czasie rzeczywistym

To najważniejszy use case dla widzenia komputerowego. `ImageAnalysis` łączy producenta obrazu (kamerę) z konsumentem (analyzer). Dokumentacja podkreśla, że po zbindowaniu use case'u CameraX natychmiast zaczyna przekazywać klatki do analizatora. `ImageAnalysis` wspiera formaty `YUV_420_888` i `RGBA_8888`, a domyślnym formatem jest `YUV_420_888`.

### 10.1 Dlaczego domyślnie YUV, a nie JPEG albo Bitmap

Bo analiza czasu rzeczywistego powinna unikać kosztownych transformacji. Format YUV:

- jest naturalny dla pipeline'u wideo,
- zachowuje luminancję wprost, co bywa szczególnie użyteczne w CV,
- ogranicza koszty kopiowania i konwersji,
- lepiej odpowiada pracy algorytmów, które nie potrzebują natychmiast pełnej reprezentacji RGB.

JPEG jest świetny jako format zapisu, ale słaby jako format roboczy dla każdej klatki strumienia.

### 10.2 Backpressure i strategie kolejkowania

To jeden z kluczowych tematów dydaktycznych. Dokumentacja CameraX opisuje tryby blokujący i nieblokujący. Dla analizatora wolnego lub o wysokiej latencji często lepsza jest strategia nieblokująca, bo stare klatki i tak tracą wartość semantyczną.

W praktyce najczęściej używa się:

- `STRATEGY_KEEP_ONLY_LATEST` – przetwarzaj najnowszą klatkę, porzucaj zaległe,
- `STRATEGY_BLOCK_PRODUCER` – zatrzymaj producenta, jeśli konsument nie nadąża.

### Dlaczego `KEEP_ONLY_LATEST` bywa najlepszym wyborem

W systemach czasu rzeczywistego „najświeższa informacja” bywa cenniejsza niż „pełna historia”. Jeśli analizujesz kody QR, twarze lub tekst z żywej sceny, stara klatka sprzed 300 ms jest często mniej wartościowa niż utrata jednej klatki. Dlatego porzucanie klatek jest czasem racjonalne i pożądane.

### 10.3 Budżet czasowy klatki

Przy 30 fps masz około 33,3 ms na jedną klatkę.
Przy 60 fps masz około 16,7 ms na jedną klatkę.

Jeśli twój analizator potrzebuje 45 ms, to przy 30 fps nie nadąża. Matematyki nie da się „optymalizować komentarzem w kodzie”. Trzeba albo zmniejszyć rozdzielczość, albo uprościć model, albo ograniczyć częstotliwość analizy.

### 10.4 Dlaczego trzeba zamknąć `ImageProxy`

To absolutnie krytyczne. Jeśli nie wywołasz `imageProxy.close()`, bufor nie wróci do puli i pipeline może się zatrzymać lub dramatycznie spowolnić. Na iOS istnieje analogiczny problem z buforami `CMSampleBuffer`, które odwołują się do pamięci wielokrotnego użytku i nie powinny być bezrefleksyjnie przechowywane poza kontekstem callbacku.

### Praktyczny przykład – analizator kodów kreskowych

Poniższy przykład prezentuje implementację analizatora kodów kreskowych i QR korzystającego z ML Kit w ramach pipeline'u `ImageAnalysis`. Analizator odbiera klatki w formacie YUV, przetwarza je przez skaner kodów i zwraca wynik przez callback — krytyczne jest przy tym zawsze zamknięcie `ImageProxy` po zakończeniu analizy. Budowanie `ImageAnalysis` ze strategią `KEEP_ONLY_LATEST` zapobiega narastaniu kolejki nieprzetworzonych klatek.

```kotlin
class BarcodeAnalyzer(
    private val onBarcodeDetected: (String) -> Unit
) : ImageAnalysis.Analyzer {

    private val scanner = BarcodeScanning.getClient(
        BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_QR_CODE,
                Barcode.FORMAT_EAN_13,
                Barcode.FORMAT_EAN_8
            )
            .build()
    )

    @androidx.camera.core.ExperimentalGetImage
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return
        }

        val inputImage = InputImage.fromMediaImage(
            mediaImage,
            imageProxy.imageInfo.rotationDegrees
        )

        scanner.process(inputImage)
            .addOnSuccessListener { barcodes ->
                val firstValue = barcodes.firstOrNull()?.rawValue
                if (firstValue != null) onBarcodeDetected(firstValue)
            }
            .addOnFailureListener { e ->
                Log.e("BarcodeAnalyzer", "Scanning failed", e)
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    }
}

fun buildImageAnalysis(analyzer: ImageAnalysis.Analyzer): ImageAnalysis {
    return ImageAnalysis.Builder()
        .setTargetResolution(Size(1280, 720))
        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
        .build()
        .also {
            it.setAnalyzer(Executors.newSingleThreadExecutor(), analyzer)
        }
}
```

### Dlaczego ograniczamy formaty kodów

ML Kit zaleca konfigurowanie skanera pod konkretne formaty, bo „skanuj wszystko” zwiększa koszt obliczeń. Ograniczenie liczby obsługiwanych symbologii jest klasycznym przykładem optymalizacji semantycznej: system robi mniej pracy, bo lepiej rozumie problem.

### Dlaczego `Executors.newSingleThreadExecutor()`

Bo wiele zadań CV ma charakter sekwencyjny i nie potrzebuje jednoczesnego przetwarzania wielu klatek. Jednowątkowy executor upraszcza synchronizację i zapobiega narastaniu współbieżnych analiz, które na urządzeniu mobilnym szybko mogłyby pogorszyć wydajność.

---

## 11. Rozdzielczość, proporcje i orientacja

Konfiguracja rozdzielczości w CameraX nie jest trywialna. Dokumentacja wyjaśnia, że biblioteka dobiera rozdzielczość na podstawie możliwości urządzenia, poziomu sprzętowego, zestawu use case'ów i żądanego aspect ratio. Nie należy jednocześnie wymuszać i `resolution`, i `aspectRatio`, bo mają konkurencyjny charakter. CameraX stara się znaleźć najlepsze dopasowanie dla danego zestawu wymagań.

### Dlaczego nie zawsze ustawiamy „maksymalną rozdzielczość”

Bo większy obraz to nie tylko „więcej jakości”. To także:

- więcej danych do kopiowania,
- większe obciążenie CPU/GPU/NPU,
- większe opóźnienie,
- większy pobór energii,
- większa presja na garbage collector i pamięć.

Dla skanera kodów kreskowych 4K najczęściej nie jest potrzebne. Dla OCR dokumentu o drobnym druku może już mieć sens. Wybór rozdzielczości powinien wynikać z zadania, a nie z intuicji „więcej = lepiej”.

### Orientacja i rotacja

Dokumentacja CameraX zaznacza, że obrót bywa dostarczany jako metadane, a nie przez fizyczne obracanie danych pikselowych. To ważne szczególnie przy `ImageAnalysis` i `ImageCapture`, bo odbiorca klatki musi wiedzieć, jak interpretować orientację.

### Dlaczego obrót to nie tylko problem estetyczny

Zły obrót niszczy wyniki ML. OCR, detekcja twarzy czy segmentacja obrazu silnie zależą od poprawnej interpretacji osi. Błąd „obraz jest tylko bokiem” często oznacza realne pogorszenie skuteczności modelu.

---

## 12. OCR i analiza semantyczna obrazu z ML Kit

ML Kit udostępnia zestaw modeli uruchamianych lokalnie na urządzeniu. Dokumentacja podkreśla, że przetwarzanie odbywa się on-device, co poprawia szybkość i umożliwia scenariusze czasu rzeczywistego. Dotyczy to m.in. rozpoznawania tekstu, kodów kreskowych i detekcji twarzy.

### 12.1 Bundled vs unbundled

W dokumentacji ML Kit dla barcode scanning i text recognition opisano dwa modele dystrybucji:

- **bundled** – większy rozmiar aplikacji, ale model jest dostępny natychmiast,
- **unbundled** – mniejszy rozmiar aplikacji, ale model może być dynamicznie pobierany przed pierwszym użyciem.

Dla skanera kodów kreskowych dokumentacja podaje orientacyjnie około 200 KB wzrostu przy wariancie unbundled i około 2,4 MB przy bundled.

### Dlaczego ta decyzja jest ważna

To klasyczny kompromis „rozmiar aplikacji kontra gotowość funkcji przy pierwszym uruchomieniu”. W aplikacji logistycznej, która musi skanować natychmiast po instalacji, bundled bywa rozsądny. W aplikacji, w której OCR jest funkcją poboczną, unbundled może być lepszy.

### Praktyczny przykład – OCR na bitmapie

Optyczne rozpoznawanie znaków (OCR) umożliwia ekstrakcję tekstu bezpośrednio z obrazu na urządzeniu, bez konieczności wysyłania danych na serwer. Poniższy przykład pokazuje, jak skonfigurować i uruchomić silnik Text Recognition z ML Kit na dostarczonym obiekcie `Bitmap`. Wyniki są agregowane z bloków i linii tekstu do postaci jednolitego ciągu znaków.

```kotlin
val textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

fun recognizeText(bitmap: Bitmap, onResult: (String) -> Unit, onError: (Exception) -> Unit) {
    val image = InputImage.fromBitmap(bitmap, 0)

    textRecognizer.process(image)
        .addOnSuccessListener { result ->
            val text = result.textBlocks.joinToString("\n") { block ->
                block.lines.joinToString(" ") { line -> line.text }
            }
            onResult(text)
        }
        .addOnFailureListener(onError)
}
```

### Dlaczego OCR często działa lepiej na kadrze „zatrzymanym” niż na każdej klatce preview

Bo tekst jest bardzo wrażliwy na rozmycie ruchu, niedokładny fokus, zbyt agresywne skalowanie i szum. W wielu aplikacjach lepszy workflow wygląda tak:

1. `Preview` pomaga użytkownikowi ustawić dokument.
2. `ImageCapture` wykonuje zdjęcie o wyższej jakości.
3. OCR działa na finalnym obrazie, a nie na każdej klatce.

To świetny przykład tego, że architektura use case'ów odzwierciedla realne potrzeby użytkowe.

---

## 13. Detekcja twarzy

ML Kit umożliwia detekcję twarzy w obrazie i wideo, w tym wykrywanie cech twarzy, konturów oraz estymację pewnych cech, ale nie służy do rozpoznawania tożsamości osób. Dokumentacja wyraźnie odróżnia „wykrywanie twarzy” od „rozpoznawania osób”.

### Dlaczego to rozróżnienie jest ważne

Bo w dyskusjach dydaktycznych często miesza się dwa różne zadania:

- **face detection** – „czy jest twarz i gdzie?”,
- **face recognition** – „czyja to twarz?”.

To inny problem techniczny, inna warstwa ryzyka prywatności i zwykle inny reżim prawny.

### Praktyczny przykład – detekcja twarzy

Detekcja twarzy w czasie rzeczywistym jest jednym z kluczowych zastosowań biblioteki ML Kit, umożliwiając m.in. filtry AR czy automatyczne kadrowanie. Poniższy przykład konfiguruje detektor twarzy w trybie szybkiego działania z klasyfikacją wyrazu, a następnie przetwarza kolejne klatki z kamery. Ważne jest wywołanie `imageProxy.close()` po zakończeniu przetwarzania, aby nie zablokować pipeline'u.

```kotlin
val faceDetector = FaceDetection.getClient(
    FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
        .enableTracking()
        .build()
)

fun processFaces(imageProxy: ImageProxy) {
    val mediaImage = imageProxy.image ?: run {
        imageProxy.close()
        return
    }

    val image = InputImage.fromMediaImage(
        mediaImage,
        imageProxy.imageInfo.rotationDegrees
    )

    faceDetector.process(image)
        .addOnSuccessListener { faces ->
            faces.forEach { face ->
                val smile = face.smilingProbability ?: 0f
                val leftEye = face.leftEyeOpenProbability ?: 0f
                val rightEye = face.rightEyeOpenProbability ?: 0f
                Log.d(
                    "FaceDetection",
                    "id=${face.trackingId}, smile=$smile, leftEye=$leftEye, rightEye=$rightEye"
                )
            }
        }
        .addOnFailureListener { e ->
            Log.e("FaceDetection", "Failed", e)
        }
        .addOnCompleteListener {
            imageProxy.close()
        }
}
```

### Dlaczego `PERFORMANCE_MODE_FAST`

Bo w analizie strumienia liczy się płynność. Tryb szybszy daje niższą latencję kosztem części dokładności. Dla aplikacji selfie, filtrów AR czy prostych reakcji UI to zwykle bardziej użyteczny kompromis.

---

## 14. Wideo: `VideoCapture`

Dokumentacja CameraX opisuje `VideoCapture` jako use case, który może działać samodzielnie albo w połączeniu z innymi. Oficjalnie zagwarantowane jest połączenie `Preview + VideoCapture` na wszystkich urządzeniach. Warstwa `VideoCapture` abstrahuje nad źródłami audio/video, enkoderami, muxerem i zapisem do pliku.

### Dlaczego nagrywanie wideo jest trudniejsze niż zdjęcie

Bo jest procesem ciągłym. Trzeba jednocześnie:

- odbierać klatki,
- kompresować wideo,
- synchronizować audio,
- reagować na błędy urządzenia,
- zapisywać strumień,
- utrzymać sensowny pobór energii.

### Praktyczny przykład – nagrywanie wideo

Nagrywanie wideo wymaga jednoczesnej obsługi obrazu, dźwięku, enkodowania i zapisu do pliku, co czyni je bardziej złożonym niż jednorazowe fotografowanie. Poniższy przykład przedstawia kontroler nagrywania oparty na `VideoCapture<Recorder>` z CameraX, obsługujący start i stop nagrywania oraz reagujący na zdarzenie zakończenia. Obiekt `QualitySelector` pozwala zadeklarować preferowaną jakość wyjściową z możliwością automatycznego obniżenia jej, gdy urządzenie nie spełnia wymagań.

```kotlin
class VideoRecorderController(
    private val context: Context,
    private val videoCapture: VideoCapture<Recorder>
) {
    private var activeRecording: Recording? = null

    fun startRecording(onSaved: (Uri) -> Unit, onError: (Throwable) -> Unit) {
        val file = File(context.filesDir, "video_${System.currentTimeMillis()}.mp4")
        val outputOptions = FileOutputOptions.Builder(file).build()

        activeRecording = videoCapture.output
            .prepareRecording(context, outputOptions)
            .withAudioEnabled()
            .start(ContextCompat.getMainExecutor(context)) { event ->
                when (event) {
                    is VideoRecordEvent.Finalize -> {
                        if (!event.hasError()) {
                            onSaved(event.outputResults.outputUri)
                        } else {
                            onError(IllegalStateException("Finalize error: ${event.error}"))
                        }
                    }
                }
            }
    }

    fun stopRecording() {
        activeRecording?.stop()
        activeRecording = null
    }
}

fun createVideoCapture(): VideoCapture<Recorder> {
    val recorder = Recorder.Builder()
        .setQualitySelector(
            QualitySelector.from(
                Quality.FHD,
                FallbackStrategy.lowerQualityOrHigherThan(Quality.SD)
            )
        )
        .build()

    return VideoCapture.withOutput(recorder)
}
```

### Dlaczego `QualitySelector`, a nie „ustaw 4K zawsze”

Bo nie każde urządzenie, kamera i enkoder obsługują te same profile równie dobrze. `QualitySelector` opisuje intencję aplikacji, a CameraX dobiera najlepszą realizację w ramach możliwości urządzenia. To kolejny przykład przesunięcia decyzji sprzętowo-zależnej z aplikacji do biblioteki.

---

## 15. Alternatywa dla prostego skanowania: Google Code Scanner

Dla części aplikacji nie trzeba budować własnego pipeline'u `Preview + ImageAnalysis + ML Kit`. Dokumentacja Google opisuje Google Code Scanner jako rozwiązanie skanujące kody bez wymagania uprawnienia do kamery, delegujące całe zadanie do Google Play services i zwracające tylko wynik. Wszystko odbywa się lokalnie na urządzeniu.

### Kiedy to ma sens

- gdy potrzebujesz tylko wyniku skanu,
- gdy nie potrzebujesz własnego UI kamery,
- gdy chcesz uprościć zgodę na uprawnienia,
- gdy priorytetem jest szybkość wdrożenia.

### Dlaczego nie zawsze to wystarcza

Bo tracisz pełną kontrolę nad doświadczeniem użytkownika i pipeline'em analitycznym. Jeśli chcesz jednocześnie rysować overlay, analizować inne obiekty i sterować ekspozycją, potrzebujesz własnego workflow na CameraX.

---

## 16. Wydajność: najczęstsze błędy i ich przyczyny

### 16.1 Błąd: analiza jest „losowo” wolna

Najczęstsze przyczyny:

- zbyt wysoka rozdzielczość,
- alokacje obiektów w każdej klatce,
- konwersja każdej klatki do `Bitmap`,
- zbyt ciężki model ML,
- wykonywanie pracy na main thread,
- brak `STRATEGY_KEEP_ONLY_LATEST`.

### 16.2 Błąd: preview działa, ale analiza przestaje dochodzić

Najczęstsza przyczyna: brak `imageProxy.close()`.

### 16.3 Błąd: zdjęcie jest obrócone albo overlay nie pasuje

Najczęstsza przyczyna: pomieszanie orientacji sensora, rotacji wyświetlacza i układu współrzędnych UI.

### 16.4 Błąd: aplikacja działa dobrze na jednym telefonie, źle na innym

To klasyczna konsekwencja fragmentacji sprzętowej. Kamery mobilne różnią się:

- rozdzielczościami wspieranych strumieni,
- opóźnieniami,
- profilem enkoderów,
- implementacją ISP,
- zachowaniem autofocusu,
- możliwościami łączenia kilku use case'ów naraz.

### Dlaczego CameraX tak mocno abstrahuje sprzęt

Właśnie po to, by ograniczyć liczbę urządzeniowo-specyficznych ścieżek kodu. To nie jest „utrata kontroli”, lecz transfer odpowiedzialności za zgodność do biblioteki, która ma lepszą wiedzę o platformie.

---

## 17. AVFoundation na iOS: odpowiednik CameraX/Camera2

AVFoundation opiera się na centralnej sesji przechwytywania. Oficjalna dokumentacja Apple opisuje `AVCaptureSession` jako obiekt konfigurujący zachowanie przechwytywania i koordynujący przepływ danych od wejść do wyjść. Dokumentacja „Setting up a capture session” podkreśla też, że `AVCaptureSession` stanowi podstawę przechwytywania mediów i zarządza wyłącznym dostępem aplikacji do infrastruktury capture.

### 17.1 Odpowiedniki pojęciowe

- `AVCaptureSession` – centralna sesja podobna do zarządzania konfiguracją w CameraX/Camera2,
- `AVCaptureDeviceInput` – źródło danych z urządzenia,
- `AVCaptureVideoPreviewLayer` – warstwa podglądu,
- `AVCapturePhotoOutput` – zdjęcia,
- `AVCaptureVideoDataOutput` – klatki do analizy,
- `AVCaptureMovieFileOutput` lub inne ścieżki – wideo.

### Dlaczego Apple rozdziela inputy i outputy

Bo pozwala to budować różne grafy przetwarzania i precyzyjnie kontrolować, jakie dane trafiają do jakiego celu. To bardzo podobna idea do use case'ów na Androidzie, tylko inaczej nazwana i osadzona w innej architekturze frameworka.

### 17.2 Konfiguracja sesji i fotografia

Apple zaleca grupowanie zmian pomiędzy `beginConfiguration()` i `commitConfiguration()`. Ma to sens, bo rekonfiguracja sesji powinna być atomowa z punktu widzenia stanu systemu. Dokumentacja Apple wskazuje też, że do sesji można jednocześnie dodać np. `AVCapturePhotoOutput` i `AVCaptureMovieFileOutput`, a `beginConfiguration()`/`commitConfiguration()` powinny otaczać modyfikacje wejść i wyjść.

### Praktyczny przykład – sesja zdjęciowa w Swift

Konfiguracja sesji przechwytywania w AVFoundation wymaga atomowego grupowania zmian za pomocą metod `beginConfiguration()` i `commitConfiguration()`. Poniższy przykład w Swift pokazuje, jak zbudować `CameraManager` zarządzający sesją na osobnej kolejce, aby nie blokować wątku UI. Po skonfigurowaniu wejścia i wyjścia sesja jest uruchamiana i gotowa do wykonywania zdjęć.

```swift
import AVFoundation
import UIKit

final class CameraManager: NSObject, ObservableObject {
    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let sessionQueue = DispatchQueue(label: "camera.session.queue")

    func configure() {
        sessionQueue.async {
            self.session.beginConfiguration()
            self.session.sessionPreset = .photo

            guard
                let camera = AVCaptureDevice.default(.builtInWideAngleCamera,
                                                     for: .video,
                                                     position: .back),
                let input = try? AVCaptureDeviceInput(device: camera),
                self.session.canAddInput(input),
                self.session.canAddOutput(self.photoOutput)
            else {
                self.session.commitConfiguration()
                return
            }

            self.session.addInput(input)
            self.session.addOutput(self.photoOutput)
            self.session.commitConfiguration()
            self.session.startRunning()
        }
    }

    func capturePhoto(delegate: AVCapturePhotoCaptureDelegate) {
        let settings = AVCapturePhotoSettings()
        if photoOutput.availablePhotoCodecTypes.contains(.hevc) {
            settings.isHighResolutionPhotoEnabled = true
        }
        photoOutput.capturePhoto(with: settings, delegate: delegate)
    }
}
```

### Co tu jest ważne i dlaczego

- osobna `sessionQueue` – konfiguracja i sterowanie sesją nie powinny obciążać głównego wątku UI,
- `beginConfiguration()` / `commitConfiguration()` – sesja nie wpada w stan pośredni w trakcie zmian,
- `sessionPreset = .photo` – intencja jakościowa zależna od scenariusza,
- `canAddInput()` / `canAddOutput()` – defensywne programowanie wobec sprzętu.

---

## 18. Podgląd na iOS: `AVCaptureVideoPreviewLayer`

Apple opisuje `AVCaptureVideoPreviewLayer` jako warstwę Core Animation wyświetlającą obraz wideo z urządzenia kamery. Gdy sesja zaczyna działać, preview layer zaczyna renderować obraz. Dokumentacja AVCam wskazuje też, że w SwiftUI zwykle osadza się tę warstwę w `UIView` lub `UIViewRepresentable`, bo SwiftUI nie operuje bezpośrednio na warstwach Core Animation.

### Dlaczego to przypomina `PreviewView` na Androidzie

Bo problem jest ten sam: framework deklaratywnego UI nie jest naturalnym miejscem do bezpośredniego renderowania wysokowydajnego strumienia wideo. Potrzebny jest wyspecjalizowany nośnik warstwy podglądu.

### Praktyczny przykład – widok podglądu w UIKit/SwiftUI

W UIKit warstwa podglądu kamery jest implementowana jako `AVCaptureVideoPreviewLayer` przypisana do niestandardowego `UIView`. Poniższy przykład pokazuje, jak przesłonić `layerClass`, aby widok automatycznie używał warstwy podglądu AVFoundation. Metoda `attach(session:)` przypisuje sesję do warstwy i ustawia tryb dopasowania obrazu do rozmiarów widoku.

```swift
import AVFoundation
import UIKit

final class PreviewView: UIView {
    override class var layerClass: AnyClass {
        AVCaptureVideoPreviewLayer.self
    }

    var previewLayer: AVCaptureVideoPreviewLayer {
        layer as! AVCaptureVideoPreviewLayer
    }

    func attach(session: AVCaptureSession) {
        previewLayer.session = session
        previewLayer.videoGravity = .resizeAspectFill
    }
}
```

---

## 19. Analiza klatek na iOS: `AVCaptureVideoDataOutput`

Do analizy czasu rzeczywistego iOS udostępnia `AVCaptureVideoDataOutput`, którego delegate otrzymuje kolejne `CMSampleBuffer`. Apple podkreśla, że callbacki trafiają na kolejkę podaną w `setSampleBufferDelegate(_:queue:)`, a same sample buffer'y często odwołują się do pamięci wielokrotnego użytku. Jeśli bufor ma być przechowywany poza zakresem metody, trzeba nim zarządzać ostrożnie.

### Dlaczego nie analizujemy wszystkiego na main thread

Dokładnie z tego samego powodu co na Androidzie: analiza obrazu jest ciężka obliczeniowo i powinna być izolowana od wątku interfejsu.

### Praktyczny przykład – odbieranie klatek

Analiza klatek wideo na iOS odbywa się poprzez implementację delegata `AVCaptureVideoDataOutputSampleBufferDelegate`, który odbiera kolejne `CMSampleBuffer`. Poniższy przykład konfiguruje wyjście wideo z włączonym odrzucaniem spóźnionych klatek i deleguje przetwarzanie na dedykowaną kolejkę. Wywołanie analizy na osobnym wątku zapobiega blokowaniu interfejsu użytkownika przez intensywne obliczenia.

```swift
import AVFoundation

final class VideoAnalyzer: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
    private let queue = DispatchQueue(label: "camera.analysis.queue")
    let output = AVCaptureVideoDataOutput()

    func configureOutput() {
        output.alwaysDiscardsLateVideoFrames = true
        output.setSampleBufferDelegate(self, queue: queue)
    }

    func captureOutput(_ output: AVCaptureOutput,
                       didOutput sampleBuffer: CMSampleBuffer,
                       from connection: AVCaptureConnection) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        // Tu można wykonać analizę Vision / Core ML / własne CV.
        // Nie kopiujemy danych bez potrzeby i nie blokujemy kolejki długimi operacjami.
        _ = pixelBuffer
    }
}
```

### Dlaczego `alwaysDiscardsLateVideoFrames = true`

To odpowiednik filozofii `KEEP_ONLY_LATEST`: w analizie czasu rzeczywistego lepiej porzucać klatki spóźnione niż narastać kolejkę starych danych.

---

## 20. Android i iOS – podobieństwa koncepcyjne

| Problem | Android (CameraX) | iOS (AVFoundation) |
|---|---|---|
| Podgląd | `Preview` + `PreviewView` | `AVCaptureVideoPreviewLayer` |
| Zdjęcie | `ImageCapture` | `AVCapturePhotoOutput` |
| Analiza klatek | `ImageAnalysis` | `AVCaptureVideoDataOutput` |
| Wideo | `VideoCapture` | `AVCaptureMovieFileOutput` lub inne workflow nagrywania |
| Wybór urządzenia | `CameraSelector` | `AVCaptureDevice` |
| Zarządzanie cyklem | `bindToLifecycle()` | ręczne zarządzanie sesją i stanami |
| Kluczowy problem wydajności | backpressure i zamykanie `ImageProxy` | kolejki callbacków i życie `CMSampleBuffer` |

### Wniosek

Choć nazewnictwo i ergonomia API różnią się, oba systemy rozwiązują bardzo podobne problemy:

- jak kontrolować dostęp do sensora,
- jak rozdzielić preview od capture i analysis,
- jak pogodzić jakość z latencją,
- jak nie zablokować pipeline'u,
- jak chronić prywatność użytkownika.

---

## 21. Dobre praktyki projektowe

### 21.1 Projektuj pod konkretny scenariusz

Inny pipeline zbudujesz dla:

- aparatu dokumentowego,
- skanera kodów,
- selfie z efektami,
- telemedycyny,
- monitoringu jakości produkcji.

### 21.2 Nie analizuj więcej, niż potrzebujesz

Jeżeli wystarczy co druga klatka, analizuj co drugą.
Jeżeli wystarczy 720p, nie używaj 4K.
Jeżeli wystarczy luminancja, nie konwertuj do pełnego RGB.

### 21.3 Traktuj kamerę jako zasób zawodny

Kamera może być zajęta, może chwilowo utracić fokus, może nie wspierać wszystkich kombinacji use case'ów, może zachowywać się inaczej po zmianie orientacji lub po wznowieniu aplikacji.

### 21.4 Testuj na więcej niż jednym urządzeniu

Emulator nie odda zachowania autofocusu, czasu ekspozycji, szumu, termiki i realnej przepustowości ISP.

---

## 22. Ciekawostki techniczne

### 22.1 Rolling shutter

Wiele sensorów mobilnych nie „zamraża” całego obrazu jednocześnie, lecz odczytuje go liniami. To może powodować przechylenie szybko poruszających się obiektów albo deformacje przy szybkim ruchu kamery.

### 22.2 Preview nie jest tym samym co finalne zdjęcie

Podgląd jest zoptymalizowany pod płynność. Zdjęcie finalne może być przetwarzane inaczej, z innym profilem jakości, innym pipeline'em i większym opóźnieniem.

### 22.3 Skanowanie kodów czasem działa lepiej przy mniejszej rozdzielczości

Brzmi paradoksalnie, ale mniejsza rozdzielczość oznacza mniej danych do przepchnięcia przez pipeline i mniejsze opóźnienie. Jeśli kontrast kodu jest dobry, szybszy pipeline może wygrać z bardziej szczegółowym, lecz spóźnionym obrazem.

### 22.4 „Camera app” to de facto system czasu rzeczywistego

Nie w znaczeniu hard real-time, lecz w sensie silnej zależności od terminowości. Klatka spóźniona o 300 ms może być logicznie bezwartościowa, nawet jeśli obliczenie było formalnie poprawne.

---

## 23. Podsumowanie

Camera API w nowoczesnych systemach mobilnych nie jest prostym interfejsem do robienia zdjęć. To warstwa kontrolująca złożony pipeline sensoryczny, obliczeniowy i energetyczny. CameraX oraz AVFoundation dzielą wspólną filozofię: oddzielić podgląd, zapis, analizę i wideo, a następnie dać programiście kontrolę nad kompromisami jakości, latencji i zgodności sprzętowej.

Najważniejsze praktyczne wnioski są następujące:

- dobieraj use case do celu, a nie odwrotnie,
- szanuj lifecycle i uprawnienia,
- analizę realizuj poza main thread,
- zamykaj/zwalniaj bufory natychmiast po użyciu,
- nie myl jakości zdjęcia z jakością pipeline'u czasu rzeczywistego,
- traktuj orientację, rozdzielczość i backpressure jako zagadnienia pierwszorzędne.

---

## 24. Bibliografia i źródła oficjalne

1. Android Developers, *CameraX overview*.
2. Android Developers, *CameraX architecture*.
3. Android Developers, *Implement a preview*.
4. Android Developers, *Image analysis*.
5. Android Developers, *Capture an image* i *Configure for optimization, flash, and file format*.
6. Android Developers, *Configuration options*.
7. Android Developers, *CameraX video capturing architecture*.
8. Android Developers, *Reduce latency with Zero-Shutter Lag*.
9. Google for Developers, *ML Kit – Barcode Scanning on Android*.
10. Google for Developers, *ML Kit – Text Recognition v2 on Android*.
11. Google for Developers, *ML Kit – Face Detection on Android*.
12. Google for Developers, *Google Code Scanner*.
13. Apple Developer Documentation, *AVCaptureSession*.
14. Apple Developer Documentation, *Setting up a capture session*.
15. Apple Developer Documentation, *Requesting authorization to capture and save media*.
16. Apple Developer Documentation, *AVCaptureVideoPreviewLayer*.
17. Apple Developer Documentation, *AVCapturePhotoOutput*.
18. Apple Developer Documentation, *AVCaptureVideoDataOutput*.
19. Apple Developer Documentation, *AVCaptureVideoDataOutputSampleBufferDelegate*.

---

