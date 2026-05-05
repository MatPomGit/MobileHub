# Formaty audio i wideo w aplikacjach mobilnych

Wybór odpowiedniego formatu audio i wideo to jedno z kluczowych decyzji projektowych w aplikacjach mobilnych. Wpływa na jakość odtwarzania, rozmiar pliku, zużycie baterii oraz kompatybilność z różnymi urządzeniami. W tym artykule omówimy najpopularniejsze formaty, ich zastosowania oraz implementację na platformach Android i iOS.

---

## Podstawowe pojęcia: kontener vs kodek

Przed omówieniem konkretnych formatów warto rozróżnić dwa fundamentalne pojęcia:

- **Kodek** (ang. *codec* = *coder-decoder*) - algorytm kompresji i dekompresji danych audio/wideo (np. H.264, AAC, VP9)
- **Kontener** - format pliku przechowujący zakodowane strumienie audio i wideo wraz z metadanymi (np. MP4, MKV, WebM)

Przykład: plik `.mp4` to kontener, który może zawierać strumień wideo zakodowany kodekiem H.264 i strumień audio zakodowany kodekiem AAC.

---

## Formaty audio

### MP3 (MPEG Audio Layer III)

MP3 to najstarszy i najbardziej rozpowszechniony format audio z kompresją stratną. Pomimo swojego wieku jest nadal szeroko stosowany ze względu na:

- Powszechną obsługę na wszystkich platformach
- Dobry balans jakości i rozmiaru przy 128–320 kbps
- Bogatą bibliotekę istniejących plików

**Wada:** Stratna kompresja - traci część informacji dźwiękowych nieodwracalnie.

### AAC (Advanced Audio Coding)

AAC to domyślny format audio w ekosystemie Apple (iPhone, iPad, iTunes). Oferuje lepszą jakość niż MP3 przy tym samym bitrate.

- Standard w iTunes, YouTube, Android
- Obsługa sprzętowa w chipsetach mobilnych (niskie zużycie energii)
- Warianty: AAC-LC (podstawowy), HE-AAC (strumieniowanie), HE-AAC v2

### OGG/Vorbis

Format otwarty, preferowany w ekosystemie Android i grach (Godot, Unity opcjonalnie):

- Brak opłat licencyjnych
- Dobra jakość przy niskim bitrate
- Natywna obsługa w przeglądarce Chrome i Firefoksie
- Brak wsparcia natywnego w iOS (wymaga biblioteki zewnętrznej)

### FLAC (Free Lossless Audio Codec)

Format bezstratny - idealne odwzorowanie oryginału:

- Kompresja bezstratna (~50–60% mniej niż WAV)
- Obsługiwany natywnie na Androidzie od wersji 3.1
- Na iOS wymaga biblioteki zewnętrznej lub konwersji do ALAC (Apple Lossless)
- Stosowany w serwisach hi-fi (Tidal, Qobuz)

### WAV (Waveform Audio File Format)

Nieskompresowany format audio:

- Najwyższa jakość, brak artefaktów kompresji
- Bardzo duże rozmiary plików (~10 MB/min dla CD quality)
- Stosowany w produkcji muzycznej i nagraniach surowych
- Nieodpowiedni do dystrybucji i przesyłania przez sieć

### Opus

Nowoczesny kodek zoptymalizowany pod kątem komunikacji w czasie rzeczywistym:

- Niskie opóźnienia (idealny do VoIP, wideokonferencji)
- Doskonała jakość nawet przy 6–32 kbps
- Otwarty standard IETF (RFC 6716)
- Stosowany przez WhatsApp, Discord, WebRTC
- Obsługiwany natywnie w Androidzie od wersji 5.0

---

## Formaty wideo

### MP4 / H.264 (AVC)

Najpowszechniejszy format wideo w aplikacjach mobilnych:

- Sprzętowe wsparcie dekodowania na wszystkich nowoczesnych urządzeniach
- Doskonała kompatybilność (każda platforma, każda przeglądarka)
- Dobra jakość przy umiarkowanym rozmiarze
- Profil Baseline zapewnia maksymalną kompatybilność

### H.265 / HEVC (High Efficiency Video Coding)

Następca H.264, oferujący ~50% lepszą kompresję:

- Sprzętowe kodowanie/dekodowanie na Apple A9+ i Snapdragon 820+
- Domyślny format nagrywania w iPhone (HEIF + HEVC)
- Ograniczenia licencyjne utrudniają szerokie wdrożenie na Androidzie
- Nieobsługiwany w przeglądarkach (Firefox, Chrome)

### VP9

Format open-source stworzony przez Google, używany na YouTube:

- Lepsza kompresja niż H.264, porównywalna z H.265
- Obsługa sprzętowa na urządzeniach z Androidem
- Brak wsparcia sprzętowego na iOS (dekodowanie programowe = wyższe zużycie baterii)
- Stosowany w WebRTC i strumieniowaniu adaptacyjnym

### AV1

Następna generacja kodeków wideo (Alliance for Open Media):

- ~30% lepsza kompresja niż VP9 i H.265
- Całkowicie bezpłatny, brak opłat licencyjnych
- Obsługa sprzętowa dopiero w najnowszych chipsetach (A17 Pro, Snapdragon 8 Gen 2)
- Powolne kodowanie (nieodpowiedni do nagrywania w czasie rzeczywistym na mobile)
- Przyszłościowy standard dla VOD i streamingu

### WebM

Kontener stworzony przez Google, używany w przeglądarkach:

- Zawiera kodeki VP8/VP9/AV1 (audio: Vorbis/Opus)
- Idealny dla aplikacji webowych i PWA
- Ograniczone wsparcie natywne poza przeglądarkami

---

## Tabela porównawcza formatów

### Audio

| Format | Kompresja | Jakość | Acc. sprzętowy Android | Acc. sprzętowy iOS | Strumieniowanie |
|--------|-----------|--------|------------------------|-------------------|-----------------|
| MP3    | Stratna   | Dobra  | ✅ Tak                 | ✅ Tak            | ✅ Tak          |
| AAC    | Stratna   | Bardzo dobra | ✅ Tak          | ✅ Tak (domyślny) | ✅ Tak          |
| OGG    | Stratna   | Dobra  | ✅ Tak                 | ❌ Nie            | ✅ Tak          |
| FLAC   | Bezstratna| Najlepsza | ✅ Tak (API 16+)    | ❌ Wymaga lib.    | ❌ Ograniczone  |
| WAV    | Brak      | Najlepsza | ✅ Tak              | ✅ Tak            | ❌ Nie          |
| Opus   | Stratna   | Doskonała (niski bitrate) | ✅ Tak | ✅ Tak (iOS 11+) | ✅ Tak (VoIP) |

### Wideo

| Format      | Kompresja    | Jakość    | Acc. Android | Acc. iOS    | Strumieniowanie |
|-------------|--------------|-----------|--------------|-------------|-----------------|
| MP4/H.264   | Stratna      | Dobra     | ✅ Tak        | ✅ Tak      | ✅ HLS, DASH    |
| H.265/HEVC  | Stratna      | Bardzo dobra | ✅ Snapdr. 820+ | ✅ A9+  | ✅ HLS          |
| VP9         | Stratna      | Bardzo dobra | ✅ Tak      | ❌ Soft.    | ✅ DASH         |
| AV1         | Stratna      | Najlepsza | ✅ SD 8 Gen2+ | ✅ A17 Pro+ | ✅ DASH         |
| WebM        | Stratna      | Dobra     | ✅ Tak        | ❌ Nie      | ✅ Tak          |

---

## Android: MediaPlayer i ExoPlayer

### MediaPlayer - prosty odtwarzacz

`MediaPlayer` jest wbudowanym komponentem Androida, wystarczającym do podstawowego odtwarzania:

```kotlin
val mediaPlayer = MediaPlayer().apply {
    setDataSource(context, Uri.parse("https://example.com/audio.mp3"))
    setAudioAttributes(
        AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .build()
    )
    prepareAsync()
    setOnPreparedListener { start() }
    setOnCompletionListener { release() }
}
```

### ExoPlayer - nowoczesne rozwiązanie

ExoPlayer (biblioteka Jetpack Media3) to zalecane rozwiązanie dla zaawansowanych zastosowań:

```kotlin
// build.gradle.kts
// implementation("androidx.media3:media3-exoplayer:1.3.0")
// implementation("androidx.media3:media3-exoplayer-hls:1.3.0")
// implementation("androidx.media3:media3-exoplayer-dash:1.3.0")
// implementation("androidx.media3:media3-ui:1.3.0")

val player = ExoPlayer.Builder(context).build().also { exoPlayer ->
    val mediaItem = MediaItem.fromUri("https://example.com/stream.m3u8") // HLS
    exoPlayer.setMediaItem(mediaItem)
    exoPlayer.prepare()
    exoPlayer.playWhenReady = true
}

// Podpięcie do widoku
playerView.player = player

// Obsługa cyklu życia
override fun onStop() {
    super.onStop()
    player.release()
}
```

ExoPlayer obsługuje natywnie:
- **HLS** (HTTP Live Streaming) - standard Apple, używany przez Netflix, Twitch
- **DASH** (Dynamic Adaptive Streaming over HTTP) - standard MPEG
- **SmoothStreaming** - format Microsoft
- Adaptacyjny bitrate (ABR)

---

## Nagrywanie audio w Kotlinie (MediaRecorder)

```kotlin
import android.media.MediaRecorder
import java.io.File

class AudioRecorder(private val context: android.content.Context) {

    private var recorder: MediaRecorder? = null
    private var outputFile: File? = null

    fun startRecording(): File {
        val file = File(context.cacheDir, "nagranie_${System.currentTimeMillis()}.aac")
        outputFile = file

        recorder = MediaRecorder(context).apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)   // kontener MP4
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)       // kodek AAC
            setAudioEncodingBitRate(128_000)                      // 128 kbps
            setAudioSamplingRate(44_100)                          // 44.1 kHz
            setOutputFile(file.absolutePath)
            prepare()
            start()
        }

        return file
    }

    fun stopRecording(): File? {
        recorder?.apply {
            stop()
            release()
        }
        recorder = null
        return outputFile
    }

    fun getMaxAmplitude(): Int = recorder?.maxAmplitude ?: 0
}
```

---

## iOS: AVFoundation

Apple udostępnia framework `AVFoundation` do obsługi multimediów:

```swift
import AVFoundation

// Odtwarzanie audio
class AudioPlayerService {
    private var player: AVAudioPlayer?

    func play(url: URL) throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default)
        try session.setActive(true)

        player = try AVAudioPlayer(contentsOf: url)
        player?.prepareToPlay()
        player?.play()
    }

    func stop() {
        player?.stop()
    }
}

// Strumieniowanie z AVPlayer (HLS, DASH)
let player = AVPlayer(url: URL(string: "https://example.com/stream.m3u8")!)
let playerLayer = AVPlayerLayer(player: player)
view.layer.addSublayer(playerLayer)
player.play()
```

---

## Kiedy wybrać który format?

### Nagrywanie

| Zastosowanie      | Rekomendowany format | Uzasadnienie                          |
|-------------------|---------------------|---------------------------------------|
| Podcast / wywiad  | AAC 128 kbps        | Mały rozmiar, dobra jakość mowy       |
| Muzyka hi-fi      | FLAC lub WAV        | Bezstratna jakość do postprodukcji    |
| Wideokonferencja  | Opus 32 kbps        | Niskie opóźnienie, odporność na błędy |
| Film 1080p        | H.264 / H.265       | Powszechna kompatybilność / mały plik |

### Dystrybucja i streaming

- **Muzyka**: AAC 256 kbps (Apple Music) lub OGG (Spotify)
- **Podcasts**: MP3 lub AAC, 64–128 kbps
- **Video streaming**: HLS z H.264 (kompatybilność) lub H.265 (jakość)
- **VoIP / komunikatory**: Opus w WebRTC

### Archiwizacja

- Audio: FLAC - bezstratna kompresja, przyszłościowy
- Wideo: H.265 / AV1 - najlepsza kompresja bez utraty jakości

---

## Dobre praktyki

- Zawsze sprawdzaj obsługiwane formaty na docelowych urządzeniach - różne wersje Androida mają różne zestawy kodeków
- Używaj `ExoPlayer`/`Media3` zamiast `MediaPlayer` w nowych projektach Android
- Na iOS korzystaj z `AVFoundation` - zapewnia dostęp do sprzętowej akceleracji
- Dla strumieniowania wybierz **HLS** - najlepsza kompatybilność i wsparcie CDN
- Testuj odtwarzanie przy różnych prędkościach sieci (3G, WiFi) - adaptacyjny bitrate jest kluczowy
- Kompresuj wideo po stronie serwera, nie na urządzeniu mobilnym - oszczędzaj baterię

---

## Podsumowanie

Wybór formatu audio/wideo powinien być podyktowany trzema czynnikami: **jakością**, **rozmiarem pliku** i **kompatybilnością**. AAC i H.264/MP4 pozostają najbezpieczniejszym wyborem dla szerokiej kompatybilności. ExoPlayer na Androidzie i AVFoundation na iOS zapewniają zaawansowane możliwości odtwarzania, włącznie z adaptacyjnym strumieniowaniem HLS i DASH. Nowe projekty powinny rozważyć Opus do komunikacji głosowej i AV1 do przyszłościowego streamingu wideo.
