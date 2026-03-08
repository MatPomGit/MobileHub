# Lokalizacja i Mapy

GPS i mapy to jedne z najczęściej używanych funkcji aplikacji mobilnych — od nawigacji po geofencing i śledzenie aktywności fizycznej. Android dostarcza Fused Location Provider, a Google Maps SDK i Mapbox umożliwiają bogatą wizualizację.

## Fused Location Provider — Android

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
// Tryby lokalizacji — dobierz do potrzeb
val priority = when (useCase) {
    UseCase.TURN_BY_TURN_NAVIGATION -> Priority.PRIORITY_HIGH_ACCURACY       // GPS, ~50mAh/h
    UseCase.ACTIVITY_TRACKING       -> Priority.PRIORITY_BALANCED_POWER_ACCURACY // Wi-Fi+Cell, ~10mAh/h
    UseCase.WEATHER_APP             -> Priority.PRIORITY_LOW_POWER             // Cell only, ~3mAh/h
    UseCase.BACKGROUND_LOGGER       -> Priority.PRIORITY_PASSIVE               // bez aktywnej prośby, ~0mAh/h
}
```

## Geofencing — strefy powiadomień

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

## Google Maps SDK — Compose

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

        // Polilinia — trasa
        Polyline(
            points = viewModel.routePoints,
            color = Color(0xFF1976D2),
            width = 8f,
            jointType = JointType.ROUND,
            startCap = RoundCap(),
            endCap = RoundCap()
        )

        // Okrąg — geofence
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

## Geocoding — adres ↔ współrzędne

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

## Mapbox — alternatywa dla Google Maps

```kotlin
// Mapbox Maps SDK — lepsza personalizacja stylów, offline mapy
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

## Linki

- [Fused Location Provider](https://developer.android.com/develop/sensors-and-location/location)
- [Maps Compose](https://github.com/googlemaps/android-maps-compose)
- [Geofencing API](https://developer.android.com/develop/sensors-and-location/location/geofencing)
- [Mapbox Android](https://docs.mapbox.com/android/maps/guides/)
