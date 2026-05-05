# Lokalizacja i mapy

GPS i mapy to jedne z najczęściej używanych funkcji aplikacji mobilnych - od nawigacji po geofencing i śledzenie aktywności fizycznej. Android dostarcza Fused Location Provider, a Google Maps SDK i Mapbox umożliwiają bogatą wizualizację.

## Fused Location Provider - Android

Fused Location Provider łączy GPS, Wi-Fi, sieć komórkową i czujniki ruchu, automatycznie wybierając najdokładniejsze i najoszczędniejsze źródło lokalizacji:

```kotlin
class LocationRepository(context: Context) {
    private val fusedClient = LocationServices.getFusedLocationProviderClient(context)

    // Jednorazowe pobranie aktualnej lokalizacji
    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocation(): Location? = suspendCancellableCoroutine { cont ->
        val request = CurrentLocationRequest.Builder()
            .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
            .setDurationMillis(5_000L)   // max 5s czekania
            .setMaxUpdateAgeMillis(10_000L) // zaakceptuj wynik sprzed max 10s
            .build()

        fusedClient.getCurrentLocation(request, null)
            .addOnSuccessListener { location -> cont.resume(location) }
            .addOnFailureListener { cont.resume(null) }
    }

    // Ciągłe aktualizacje jako Flow
    @SuppressLint("MissingPermission")
    fun getLocationUpdates(intervalMs: Long = 5_000L): Flow<Location> = callbackFlow {
        val request = LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, intervalMs)
            .setMinUpdateIntervalMillis(intervalMs / 2)
            .setMaxUpdateDelayMillis(intervalMs * 3)  // batching przy słabym sygnale
            .build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { trySend(it) }
            }
            override fun onLocationAvailability(availability: LocationAvailability) {
                if (!availability.isLocationAvailable)
                    Log.w("Location", "Lokalizacja niedostępna")
            }
        }

        fusedClient.requestLocationUpdates(request, callback, Looper.getMainLooper())
        awaitClose { fusedClient.removeLocationUpdates(callback) }
    }
}
```

## Strategie dokładności vs. bateria

```kotlin
// Tryby lokalizacji - dobierz do potrzeb
val priority = when (useCase) {
    UseCase.TURN_BY_TURN_NAVIGATION -> Priority.PRIORITY_HIGH_ACCURACY       // GPS, ~50mAh/h
    UseCase.ACTIVITY_TRACKING       -> Priority.PRIORITY_BALANCED_POWER_ACCURACY // Wi-Fi+Cell, ~10mAh/h
    UseCase.WEATHER_APP             -> Priority.PRIORITY_LOW_POWER             // Cell only, ~3mAh/h
    UseCase.BACKGROUND_LOGGER       -> Priority.PRIORITY_PASSIVE               // bez aktywnej prośby, ~0mAh/h
}
```

## Geofencing - strefy powiadomień

```kotlin
class GeofenceManager(context: Context) {
    private val geofencingClient = LocationServices.getGeofencingClient(context)

    @SuppressLint("MissingPermission")
    fun addGeofence(
        id: String,
        lat: Double,
        lng: Double,
        radiusMeters: Float = 100f,
        pendingIntent: PendingIntent
    ) {
        val geofence = Geofence.Builder()
            .setRequestId(id)
            .setCircularRegion(lat, lng, radiusMeters)
            .setExpirationDuration(Geofence.NEVER_EXPIRE)
            .setTransitionTypes(
                Geofence.GEOFENCE_TRANSITION_ENTER or
                Geofence.GEOFENCE_TRANSITION_EXIT or
                Geofence.GEOFENCE_TRANSITION_DWELL
            )
            .setLoiteringDelay(60_000)  // 1 minuta na przebywanie = DWELL event
            .build()

        val request = GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
            .addGeofence(geofence)
            .build()

        geofencingClient.addGeofences(request, pendingIntent)
            .addOnSuccessListener { Log.d("Geofence", "Dodano geofence: $id") }
    }

    fun removeGeofence(id: String) = geofencingClient.removeGeofences(listOf(id))
}

// BroadcastReceiver odbierający zdarzenia
class GeofenceBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val geofencingEvent = GeofencingEvent.fromIntent(intent) ?: return
        if (geofencingEvent.hasError()) return

        val triggeringGeofences = geofencingEvent.triggeringGeofences ?: return
        when (geofencingEvent.geofenceTransition) {
            Geofence.GEOFENCE_TRANSITION_ENTER -> {
                triggeringGeofences.forEach {
                    Log.d("Geofence", "Wejście do strefy: ${it.requestId}")
                }
            }
            Geofence.GEOFENCE_TRANSITION_EXIT  -> { /* opuszczenie strefy */ }
            Geofence.GEOFENCE_TRANSITION_DWELL -> { /* przebywanie w strefie */ }
        }
    }
}
```

## Google Maps SDK - Compose

```kotlin
dependencies {
    implementation("com.google.maps.android:maps-compose:4.4.1")
    implementation("com.google.android.gms:play-services-maps:19.0.0")
}

@Composable
fun MapScreen(viewModel: MapViewModel) {
    val userLocation by viewModel.userLocation.collectAsState()
    val markers by viewModel.markers.collectAsState()

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(LatLng(50.0647, 19.9450), 13f) // Kraków
    }

    // Ustaw kamerę gdy zmieni się lokalizacja
    LaunchedEffect(userLocation) {
        userLocation?.let {
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngZoom(LatLng(it.latitude, it.longitude), 15f),
                durationMs = 800
            )
        }
    }

    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        properties = MapProperties(
            isMyLocationEnabled = true,
            mapType = MapType.NORMAL,
            isTrafficEnabled = false
        ),
        uiSettings = MapUiSettings(
            zoomControlsEnabled = false,
            myLocationButtonEnabled = true,
            compassEnabled = true
        )
    ) {
        // Markery
        markers.forEach { marker ->
            Marker(
                state = MarkerState(position = LatLng(marker.lat, marker.lng)),
                title = marker.name,
                snippet = marker.description,
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)
            )
        }

        // Polilinia - trasa
        Polyline(
            points = viewModel.routePoints,
            color = Color(0xFF1976D2),
            width = 8f,
            jointType = JointType.ROUND,
            startCap = RoundCap(),
            endCap = RoundCap()
        )

        // Okrąg - geofence
        userLocation?.let {
            Circle(
                center = LatLng(it.latitude, it.longitude),
                radius = 100.0,
                fillColor = Color(0x330000FF),
                strokeColor = Color(0xFF0000FF),
                strokeWidth = 2f
            )
        }
    }
}
```

## Geocoding - adres ↔ współrzędne

```kotlin
class GeocoderHelper(private val context: Context) {
    private val geocoder = Geocoder(context, Locale.getDefault())

    // Adres → współrzędne
    suspend fun geocode(addressText: String): LatLng? = withContext(Dispatchers.IO) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                suspendCancellableCoroutine { cont ->
                    geocoder.getFromLocationName(addressText, 1) { addresses ->
                        cont.resume(addresses.firstOrNull()?.let { LatLng(it.latitude, it.longitude) })
                    }
                }
            } else {
                @Suppress("DEPRECATION")
                geocoder.getFromLocationName(addressText, 1)
                    ?.firstOrNull()?.let { LatLng(it.latitude, it.longitude) }
            }
        } catch (e: IOException) {
            null
        }
    }

    // Współrzędne → adres (reverse geocoding)
    suspend fun reverseGeocode(lat: Double, lng: Double): String = withContext(Dispatchers.IO) {
        try {
            val addresses = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                suspendCancellableCoroutine { cont ->
                    geocoder.getFromLocation(lat, lng, 1) { cont.resume(it) }
                }
            } else {
                @Suppress("DEPRECATION")
                geocoder.getFromLocation(lat, lng, 1) ?: emptyList()
            }
            addresses.firstOrNull()?.getAddressLine(0) ?: "Nieznana lokalizacja"
        } catch (e: IOException) {
            "Brak połączenia z siecią"
        }
    }
}
```

## Mapbox - alternatywa dla Google Maps

```kotlin
// Mapbox Maps SDK - lepsza personalizacja stylów, offline mapy
dependencies {
    implementation("com.mapbox.maps:android:11.6.0")
}

// W Compose
MapboxMap(
    modifier = Modifier.fillMaxSize(),
    mapInitOptionsFactory = { context ->
        MapInitOptions(
            context = context,
            styleUri = Style.MAPBOX_STREETS  // lub własny styl z Mapbox Studio
        )
    }
) {
    // Dodaj źródło danych GeoJSON
    MapEffect(Unit) { mapView ->
        mapView.getMapboxMap().getStyle { style ->
            style.addSource(GeoJsonSource.Builder("route-source")
                .featureCollection(FeatureCollection.fromFeatures(routeFeatures))
                .build()
            )
        }
    }
}
```

## Uprawnienia lokalizacji

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<!-- Wymagane oddzielne pytanie od API 29 -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

> **Ważne:** Od API 30 nie możesz prosić o `ACCESS_BACKGROUND_LOCATION` razem z pozostałymi uprawnieniami. Użytkownik musi sam przejść do ustawień i wybrać „Zawsze".

## Mapy w aplikacjach iOS - MapKit

Apple dostarcza własny framework mapowy - **MapKit** - dostępny zarówno w UIKit (przez `MKMapView`), jak i w SwiftUI (przez komponent `Map`). Nie wymaga kluczy API i działa w pełni offline w zakresie renderowania kafelków zapisanych w pamięci podręcznej.

### MKMapView w UIKit

```swift
import MapKit
import UIKit

class MapViewController: UIViewController, MKMapViewDelegate {
    private let mapView = MKMapView()

    override func viewDidLoad() {
        super.viewDidLoad()
        mapView.frame = view.bounds
        mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        mapView.delegate = self
        mapView.mapType = .standard          // .satellite, .hybrid
        mapView.showsUserLocation = true
        mapView.userTrackingMode = .follow   // kamera śledzi użytkownika
        view.addSubview(mapView)

        // Wyśrodkuj mapę na Warszawie
        let warsaw = CLLocationCoordinate2D(latitude: 52.2297, longitude: 21.0122)
        let region = MKCoordinateRegion(
            center: warsaw,
            latitudinalMeters: 5000,
            longitudinalMeters: 5000
        )
        mapView.setRegion(region, animated: true)
    }
}
```

### Adnotacje (pinezki) na mapie

`MKAnnotation` to protokół opisujący punkt na mapie. Implementujesz go w swojej klasie modelu, a `MKMapView` automatycznie wyrenderuje widok przy użyciu `MKAnnotationView`:

```swift
// Model adnotacji
class PoiAnnotation: NSObject, MKAnnotation {
    var coordinate: CLLocationCoordinate2D
    var title: String?
    var subtitle: String?
    let category: String

    init(coordinate: CLLocationCoordinate2D,
         title: String, subtitle: String, category: String) {
        self.coordinate = coordinate
        self.title = title
        self.subtitle = subtitle
        self.category = category
    }
}

// Delegate - customowy widok adnotacji
extension MapViewController {
    func mapView(_ mapView: MKMapView,
                 viewFor annotation: MKAnnotation) -> MKAnnotationView? {
        guard let poi = annotation as? PoiAnnotation else { return nil }

        let identifier = "PoiPin"
        var view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)
            as? MKMarkerAnnotationView

        if view == nil {
            view = MKMarkerAnnotationView(annotation: poi, reuseIdentifier: identifier)
            view?.canShowCallout = true
            // Przycisk szczegółów w dymku
            view?.rightCalloutAccessoryView = UIButton(type: .detailDisclosure)
        } else {
            view?.annotation = poi
        }

        // Kolor zależy od kategorii
        view?.markerTintColor = poi.category == "restaurant" ? .red : .blue
        return view
    }

    // Obsługa kliknięcia przycisku w dymku
    func mapView(_ mapView: MKMapView, annotationView view: MKAnnotationView,
                 calloutAccessoryControlTapped control: UIControl) {
        guard let poi = view.annotation as? PoiAnnotation else { return }
        print("Otwórz szczegóły: \(poi.title ?? "")")
    }
}
```

### Mapa w SwiftUI (iOS 17+)

Od iOS 17 API `Map` jest znacznie bogatsze - obsługuje markery, polilinie i nakładki bezpośrednio w deklaratywnym stylu:

```swift
import MapKit
import SwiftUI

struct ContentMapView: View {
    @State private var region = MapCameraPosition.region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 50.0647, longitude: 19.9450),
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        )
    )

    let landmarks: [Landmark]

    var body: some View {
        Map(position: $region) {
            // Lokalizacja użytkownika
            UserAnnotation()

            // Markery
            ForEach(landmarks) { landmark in
                Annotation(landmark.name, coordinate: landmark.coordinate) {
                    Image(systemName: "mappin.circle.fill")
                        .foregroundStyle(.red)
                        .font(.title)
                }
            }
        }
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
        .ignoresSafeArea()
    }
}
```

### Uprawnienia lokalizacji - iOS

W pliku `Info.plist` dodaj klucze opisujące powód dostępu do lokalizacji:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Aplikacja używa lokalizacji, aby pokazać Cię na mapie.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Dostęp w tle pozwala wysyłać powiadomienia o geofencach.</string>
```

Zapytaj o uprawnienia w `CLLocationManagerDelegate`:

```swift
class LocationService: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    func requestPermission() {
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.requestWhenInUseAuthorization()
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.startUpdatingLocation()
        case .denied, .restricted:
            print("Brak uprawnień do lokalizacji")
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager,
                         didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        print("Pozycja: \(loc.coordinate.latitude), \(loc.coordinate.longitude)")
    }
}
```

---

## Geocoding i reverse geocoding

Geocoding przekształca tekstowy adres na współrzędne geograficzne, a **reverse geocoding** robi odwrotnie - z pary (lat, lng) zwraca czytelny adres. Obie operacje wymagają połączenia z siecią, bo dane są pobierane z serwerów geokodowania.

### Geocoder w Android - pełny przykład

Poniższy przykład opakowuje `Geocoder` w repozytorium zgodne z korutynami i obsługuje różnicę API (< 33 vs. ≥ 33):

```kotlin
class GeocoderRepository(private val context: Context) {
    private val geocoder = Geocoder(context, Locale("pl", "PL"))

    sealed class GeoResult {
        data class Success(val latLng: LatLng) : GeoResult()
        data class AddressResult(val address: String) : GeoResult()
        object NotFound : GeoResult()
        data class Error(val message: String) : GeoResult()
    }

    /** Adres → współrzędne (geocoding) */
    suspend fun geocode(query: String): GeoResult = withContext(Dispatchers.IO) {
        try {
            val addresses = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                suspendCancellableCoroutine { cont ->
                    geocoder.getFromLocationName(query, 3) { cont.resume(it) }
                }
            } else {
                @Suppress("DEPRECATION")
                geocoder.getFromLocationName(query, 3) ?: emptyList()
            }
            addresses.firstOrNull()
                ?.let { GeoResult.Success(LatLng(it.latitude, it.longitude)) }
                ?: GeoResult.NotFound
        } catch (e: IOException) {
            GeoResult.Error("Brak połączenia z siecią: ${e.message}")
        }
    }

    /** Współrzędne → adres (reverse geocoding) */
    suspend fun reverseGeocode(lat: Double, lng: Double): GeoResult =
        withContext(Dispatchers.IO) {
            try {
                val addresses = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    suspendCancellableCoroutine { cont ->
                        geocoder.getFromLocation(lat, lng, 1) { cont.resume(it) }
                    }
                } else {
                    @Suppress("DEPRECATION")
                    geocoder.getFromLocation(lat, lng, 1) ?: emptyList()
                }
                val line = addresses.firstOrNull()?.getAddressLine(0)
                    ?: return@withContext GeoResult.NotFound
                GeoResult.AddressResult(line)
            } catch (e: IOException) {
                GeoResult.Error("Błąd sieci: ${e.message}")
            }
        }
}
```

> **Uwaga:** `Geocoder` wymaga działającej usługi Google Play Services po stronie serwera. Na urządzeniach bez GMS (np. Huawei) użyj **Nominatim** (OpenStreetMap) przez zwykłe żądanie HTTP.

### CLGeocoder w iOS

Na iOS do geokodowania służy klasa `CLGeocoder` z frameworka `CoreLocation`. Jej metody oparte są na `async/await` od iOS 15:

```swift
import CoreLocation

class GeocoderService {

    private let geocoder = CLGeocoder()

    // Adres → współrzędne
    func geocode(address: String) async throws -> CLLocationCoordinate2D {
        let placemarks = try await geocoder.geocodeAddressString(address)
        guard let location = placemarks.first?.location else {
            throw GeoError.notFound
        }
        return location.coordinate
    }

    // Współrzędne → adres (reverse geocoding)
    func reverseGeocode(latitude: Double, longitude: Double) async throws -> String {
        let location = CLLocation(latitude: latitude, longitude: longitude)
        let placemarks = try await geocoder.reverseGeocodeLocation(location)
        guard let placemark = placemarks.first else {
            throw GeoError.notFound
        }
        // Złóż adres z komponentów
        return [
            placemark.thoroughfare,
            placemark.subThoroughfare,
            placemark.locality,
            placemark.administrativeArea,
            placemark.country
        ].compactMap { $0 }.joined(separator: ", ")
    }

    enum GeoError: Error {
        case notFound
    }
}

// Użycie w SwiftUI ViewModel
@MainActor
class AddressViewModel: ObservableObject {
    @Published var resolvedAddress = ""
    private let service = GeocoderService()

    func lookupAddress(for coordinate: CLLocationCoordinate2D) {
        Task {
            do {
                resolvedAddress = try await service.reverseGeocode(
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude
                )
            } catch {
                resolvedAddress = "Nie udało się ustalić adresu"
            }
        }
    }
}
```

---

## Geofencing - zaawansowana konfiguracja

Geofencing pozwala definiować wirtualne obszary geograficzne i reagować na wejście, wyjście lub przebywanie użytkownika w ich obrębie. System Android monitoruje geofence'y w tle, bez konieczności uruchomienia aplikacji.

### Wymagania i ograniczenia

| Aspekt | Wartość |
|---|---|
| Maksymalna liczba geofence'ów | 100 na aplikację |
| Minimalny promień | 100 m (rekomendowane) |
| Dokładność detekcji | ±50–100 m |
| Wymagane uprawnienie w tle | `ACCESS_BACKGROUND_LOCATION` (API 29+) |

### Obsługa zdarzeń przez BroadcastReceiver

```kotlin
// Rejestracja PendingIntent wskazującego na BroadcastReceiver
fun buildGeofencePendingIntent(context: Context): PendingIntent {
    val intent = Intent(context, GeofenceBroadcastReceiver::class.java)
    return PendingIntent.getBroadcast(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )
}

// BroadcastReceiver z pełną obsługą zdarzeń
class GeofenceBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val event = GeofencingEvent.fromIntent(intent) ?: return
        if (event.hasError()) {
            val errorMessage = GeofenceStatusCodes.getStatusCodeString(event.errorCode)
            Log.e("Geofence", "Błąd geofencingu: $errorMessage")
            return
        }

        val transition = event.geofenceTransition
        val ids = event.triggeringGeofences?.map { it.requestId } ?: return

        when (transition) {
            Geofence.GEOFENCE_TRANSITION_ENTER -> {
                Log.d("Geofence", "Wejście do stref: $ids")
                showNotification(context, "Wejście", "Jesteś w pobliżu: ${ids.joinToString()}")
            }
            Geofence.GEOFENCE_TRANSITION_EXIT -> {
                Log.d("Geofence", "Wyjście ze stref: $ids")
                showNotification(context, "Wyjście", "Opuściłeś obszar: ${ids.joinToString()}")
            }
            Geofence.GEOFENCE_TRANSITION_DWELL -> {
                Log.d("Geofence", "Przebywanie w strefach: $ids")
                showNotification(context, "Przebywanie", "Długo przebywasz w: ${ids.joinToString()}")
            }
        }
    }

    private fun showNotification(context: Context, title: String, text: String) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "geofence_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(channelId, "Geofence", NotificationManager.IMPORTANCE_HIGH)
            )
        }
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_location)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        nm.notify(System.currentTimeMillis().toInt(), notification)
    }
}
```

### Rejestracja geofence'ów po restarcie urządzenia

Geofence'y **nie przeżywają restartu urządzenia**. Aby je przywrócić, zarejestruj `BroadcastReceiver` na akcję `BOOT_COMPLETED`:

```kotlin
// AndroidManifest.xml
// <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
// <receiver android:name=".BootReceiver" android:exported="true">
//     <intent-filter>
//         <action android:name="android.intent.action.BOOT_COMPLETED"/>
//     </intent-filter>
// </receiver>

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Odczytaj geofence'y z bazy danych i zarejestruj je ponownie
            val repo = GeofenceRepository(context)
            repo.restoreAllGeofences()
        }
    }
}
```

### Geofencing na iOS - CLCircularRegion

Na iOS geofencing obsługuje `CLLocationManager` przez klasy `CLCircularRegion`. System może monitorować do 20 regionów jednocześnie:

```swift
class GeofenceService: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    func monitorRegion(id: String, center: CLLocationCoordinate2D, radius: Double) {
        guard CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self) else {
            print("Geofencing niedostępny na tym urządzeniu")
            return
        }
        let region = CLCircularRegion(center: center, radius: radius, identifier: id)
        region.notifyOnEntry = true
        region.notifyOnExit = true
        manager.startMonitoring(for: region)
    }

    func locationManager(_ manager: CLLocationManager,
                         didEnterRegion region: CLRegion) {
        print("Wejście do regionu: \(region.identifier)")
    }

    func locationManager(_ manager: CLLocationManager,
                         didExitRegion region: CLRegion) {
        print("Wyjście z regionu: \(region.identifier)")
    }
}
```

---

## Geofencing w Compose - wizualizacja stref

Wyświetlenie geofence'ów jako okręgów na mapie Google Maps Compose jest naturalne dzięki komponentowi `Circle`. Poniższy przykład łączy ViewModel z danymi stref i interaktywną mapą:

```kotlin
data class GeofenceZone(
    val id: String,
    val name: String,
    val center: LatLng,
    val radiusMeters: Double,
    val isActive: Boolean
)

@HiltViewModel
class GeofenceMapViewModel @Inject constructor(
    private val geofenceManager: GeofenceManager,
    private val locationRepo: LocationRepository
) : ViewModel() {

    val zones: StateFlow<List<GeofenceZone>> = geofenceManager.zones
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val userLocation: StateFlow<Location?> = locationRepo
        .getLocationUpdates()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    fun toggleZone(zone: GeofenceZone) {
        viewModelScope.launch {
            if (zone.isActive) geofenceManager.remove(zone.id)
            else geofenceManager.add(zone)
        }
    }
}

@Composable
fun GeofenceMapScreen(viewModel: GeofenceMapViewModel = hiltViewModel()) {
    val zones by viewModel.zones.collectAsState()
    val userLocation by viewModel.userLocation.collectAsState()

    val cameraState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(LatLng(52.2297, 21.0122), 12f)
    }

    // Przesuń kamerę do użytkownika przy pierwszym odczycie
    LaunchedEffect(userLocation) {
        userLocation?.let {
            cameraState.animate(
                CameraUpdateFactory.newLatLngZoom(LatLng(it.latitude, it.longitude), 14f)
            )
        }
    }

    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraState,
        properties = MapProperties(isMyLocationEnabled = true)
    ) {
        zones.forEach { zone ->
            // Okrąg strefy
            Circle(
                center = zone.center,
                radius = zone.radiusMeters,
                fillColor = if (zone.isActive)
                    Color(0x3300C853)   // zielony, półprzezroczysty
                else
                    Color(0x33FF1744), // czerwony, nieaktywna
                strokeColor = if (zone.isActive) Color(0xFF00C853) else Color(0xFFFF1744),
                strokeWidth = 3f,
                clickable = true,
                onClick = { viewModel.toggleZone(zone) }
            )

            // Etykieta w centrum strefy
            Marker(
                state = MarkerState(position = zone.center),
                title = zone.name,
                snippet = "Promień: ${zone.radiusMeters.toInt()} m - " +
                          if (zone.isActive) "aktywna" else "nieaktywna",
                icon = BitmapDescriptorFactory.defaultMarker(
                    if (zone.isActive) BitmapDescriptorFactory.HUE_GREEN
                    else BitmapDescriptorFactory.HUE_RED
                )
            )
        }
    }
}
```

---

## Nawigacja turn-by-turn

Turn-by-turn navigation prowadzi użytkownika przez trasę krok po kroku, podając głosowe i wizualne wskazówki skrętów. Android oferuje kilka sposobów realizacji tej funkcji.

### Uruchomienie Google Maps jako zewnętrznej aplikacji

Najprostsze rozwiązanie - przekazanie trasy do zainstalowanej aplikacji Google Maps przez `Intent`:

```kotlin
fun openGoogleMapsNavigation(
    context: Context,
    destLat: Double,
    destLng: Double,
    label: String = ""
) {
    // Tryb nawigacji: mode=d (driving), w (walking), b (bicycling)
    val uri = Uri.parse("google.navigation:q=$destLat,$destLng&mode=d")
    val intent = Intent(Intent.ACTION_VIEW, uri).apply {
        setPackage("com.google.android.apps.maps")
    }
    if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
    } else {
        // Fallback - otwórz w przeglądarce
        val webUri = Uri.parse(
            "https://www.google.com/maps/dir/?api=1" +
            "&destination=$destLat,$destLng" +
            "&travelmode=driving"
        )
        context.startActivity(Intent(Intent.ACTION_VIEW, webUri))
    }
}
```

### Google Maps Directions API - obliczanie trasy

Aby wyświetlić trasę we własnym widoku mapy (bez przełączania do aplikacji), pobierz dane z **Directions API** i narysuj polilinię:

```kotlin
data class RouteStep(
    val instruction: String,
    val distance: String,
    val duration: String,
    val startLocation: LatLng,
    val endLocation: LatLng
)

class DirectionsRepository(private val apiKey: String) {
    private val client = OkHttpClient()

    suspend fun getRoute(
        origin: LatLng,
        destination: LatLng,
        mode: String = "driving"   // driving | walking | bicycling | transit
    ): List<LatLng> = withContext(Dispatchers.IO) {
        val url = "https://maps.googleapis.com/maps/api/directions/json" +
            "?origin=${origin.latitude},${origin.longitude}" +
            "&destination=${destination.latitude},${destination.longitude}" +
            "&mode=$mode" +
            "&language=pl" +
            "&key=$apiKey"

        val response = client.newCall(Request.Builder().url(url).build()).execute()
        val json = JSONObject(response.body?.string() ?: return@withContext emptyList())

        val routes = json.getJSONArray("routes")
        if (routes.length() == 0) return@withContext emptyList()

        // Dekoduj zakodowaną polilinię
        val encodedPolyline = routes
            .getJSONObject(0)
            .getJSONObject("overview_polyline")
            .getString("points")

        decodePolyline(encodedPolyline)
    }

    // Algorytm dekodowania zakodowanej polilini Google
    private fun decodePolyline(encoded: String): List<LatLng> {
        val poly = mutableListOf<LatLng>()
        var index = 0
        var lat = 0
        var lng = 0

        while (index < encoded.length) {
            var shift = 0; var result = 0
            do {
                val b = encoded[index++].code - 63
                result = result or ((b and 0x1f) shl shift)
                shift += 5
            } while (result and 0x20 != 0)
            lat += if (result and 1 != 0) (result shr 1).inv() else result shr 1

            shift = 0; result = 0
            do {
                val b = encoded[index++].code - 63
                result = result or ((b and 0x1f) shl shift)
                shift += 5
            } while (result and 0x20 != 0)
            lng += if (result and 1 != 0) (result shr 1).inv() else result shr 1

            poly.add(LatLng(lat / 1e5, lng / 1e5))
        }
        return poly
    }
}
```

### Wyświetlanie trasy na mapie Compose

```kotlin
@Composable
fun NavigationMapScreen(
    origin: LatLng,
    destination: LatLng,
    routePoints: List<LatLng>
) {
    val cameraState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(origin, 13f)
    }

    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraState,
        properties = MapProperties(isMyLocationEnabled = true)
    ) {
        // Narysuj trasę
        if (routePoints.isNotEmpty()) {
            Polyline(
                points = routePoints,
                color = Color(0xFF1565C0),
                width = 10f,
                jointType = JointType.ROUND,
                startCap = RoundCap(),
                endCap = RoundCap()
            )
        }

        // Marker startu
        Marker(
            state = MarkerState(position = origin),
            title = "Start",
            icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)
        )

        // Marker celu
        Marker(
            state = MarkerState(position = destination),
            title = "Cel",
            icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
        )
    }
}
```

### Uruchomienie nawigacji Apple Maps (iOS)

Na iOS możesz uruchomić nawigację przez Apple Maps lub Google Maps używając odpowiednich schematów URL:

```swift
func openAppleMapsNavigation(to coordinate: CLLocationCoordinate2D, label: String) {
    let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: coordinate))
    mapItem.name = label
    mapItem.openInMaps(launchOptions: [
        MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving
    ])
}

func openGoogleMapsNavigation(to coordinate: CLLocationCoordinate2D) {
    let urlString = "comgooglemaps://?daddr=\(coordinate.latitude),\(coordinate.longitude)&directionsmode=driving"
    if let url = URL(string: urlString), UIApplication.shared.canOpenURL(url) {
        UIApplication.shared.open(url)
    } else {
        // Fallback: Apple Maps
        openAppleMapsNavigation(to: coordinate, label: "Cel")
    }
}
```

> **Info.plist:** Aby sprawdzić dostępność Google Maps, dodaj `comgooglemaps` do klucza `LSApplicationQueriesSchemes`.

---

## Linki

- [Fused Location Provider](https://developer.android.com/develop/sensors-and-location/location)
- [Maps Compose](https://github.com/googlemaps/android-maps-compose)
- [Geofencing API](https://developer.android.com/develop/sensors-and-location/location/geofencing)
- [Mapbox Android](https://docs.mapbox.com/android/maps/guides/)
- [MapKit - Apple Developer](https://developer.apple.com/documentation/mapkit)
- [CLGeocoder - Apple Developer](https://developer.apple.com/documentation/corelocation/clgeocoder)
- [Google Maps Directions API](https://developers.google.com/maps/documentation/directions/overview)
- [CLLocationManager - Geofencing iOS](https://developer.apple.com/documentation/corelocation/monitoring_the_user_s_proximity_to_geographic_regions)
