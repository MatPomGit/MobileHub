/**
 * WIKI System - Programowanie Aplikacji Mobilnych (PAM)
 * Katedra Informatyki - Politechnika Rzeszowska
 * Version: 2.2 — fix: poprawione klasy ikon FA (fa-brands vs fa-solid), zastąpione ikony Pro-only
 */

'use strict';

const ARTICLES = {
    'mobile-os':            'wiki/mobile-os.md',
    'mobile-design':        'wiki/mobile-design.md',
    'android-ecosystem':    'wiki/android-ecosystem.md',
    'ios-ecosystem':        'wiki/ios-ecosystem.md',
    'mobile-security':      'wiki/mobile-security.md',
    'mobile-performance':   'wiki/mobile-performance.md',
    'mobile-hardware':      'wiki/mobile-hardware.md',
    'ui-ux':                'wiki/ui-ux.md',
    'material-design':      'wiki/material-design.md',
    'accessibility':        'wiki/accessibility.md',
    'ergonomia-uzytkowania':'wiki/ergonomia-uzytkowania.md',
    'android-studio':       'wiki/android-studio.md',
    'termux':               'wiki/termux.md',
    'kotlin-basics':        'wiki/kotlin-basics.md',
    'jetpack-compose':      'wiki/jetpack-compose.md',
    'android-architecture': 'wiki/android-architecture.md',
    'android-data':         'wiki/android-data.md',
    'android-network':      'wiki/android-network.md',
    'android-testing':      'wiki/android-testing.md',
    'agp-upgrade-assistant':'wiki/agp-upgrade-assistant.md',
    'xcode-ios':            'wiki/xcode-ios.md',
    'swift-basics':         'wiki/swift-basics.md',
    'swiftui-advanced':     'wiki/swiftui-advanced.md',
    'ios-networking':       'wiki/ios-networking.md',
    'ios-data':             'wiki/ios-data.md',
    'ios-notifications':    'wiki/ios-notifications.md',
    'cross-platform':       'wiki/cross-platform.md',
    'flutter-advanced':     'wiki/flutter-advanced.md',
    'react-native':         'wiki/react-native.md',
    'pwa-advanced':         'wiki/pwa-advanced.md',
    'kmp-multiplatform':    'wiki/kmp-multiplatform.md',
    'buildozer':            'wiki/buildozer.md',
    'mobile-docker':        'wiki/mobile-docker.md',
    'sensors':              'wiki/sensors.md',
    'camera-api':           'wiki/camera-api.md',
    'location-maps':        'wiki/location-maps.md',
    'audio-microphone':     'wiki/audio-microphone.md',
    'biometrics':           'wiki/biometrics.md',
    'iot-mobile':           'wiki/iot-mobile.md',
    'wifi-networking':      'wiki/wifi-networking.md',
    'smart-home':           'wiki/smart-home.md',
    'affective-computing':       'wiki/affective-computing.md',
    'emotion-recognition':       'wiki/emotion-recognition.md',
    'voice-analysis':            'wiki/voice-analysis.md',
    'mental-health-apps':        'wiki/mental-health-apps.md',
    'cognitive-robotics':        'wiki/cognitive-robotics.md',
    'computational-cognition':   'wiki/computational-cognition.md',
    'software-agent':            'wiki/software-agent.md',
    'intelligent-agent':         'wiki/intelligent-agent.md',
    'knowledge-representation':  'wiki/knowledge-representation.md',
    'cognitive-models':          'wiki/cognitive-models.md',
    'cognitive-perception':      'wiki/cognitive-perception.md',
    'lida-architecture':         'wiki/lida-architecture.md',
    'soar-architecture':         'wiki/soar-architecture.md',
    'clarion-architecture':      'wiki/clarion-architecture.md',
    'actr-architecture':         'wiki/actr-architecture.md',
    'computer-aided-diagnosis':  'wiki/computer-aided-diagnosis.md',
    'active-vision':             'wiki/active-vision.md',
    'foveated-vision':           'wiki/foveated-vision.md',
    'xr-mobile':            'wiki/xr-mobile.md',
    'arcore-advanced':      'wiki/arcore-advanced.md',
    'vr-mobile':            'wiki/vr-mobile.md',
    'mobile-games':         'wiki/mobile-games.md',
    'lua-mobile-games':     'wiki/lua-mobile-games.md',
    'unity-advanced':       'wiki/unity-advanced.md',
    'game-physics':         'wiki/game-physics.md',
    'robotics-mobile':      'wiki/robotics-mobile.md',
    'gpu-rendering':        'wiki/gpu-rendering.md',
    'battery-power':        'wiki/battery-power.md',
    'memory-management':    'wiki/memory-management.md',
    'display-screen':       'wiki/display-screen.md',
    'connectivity':         'wiki/connectivity.md',
    'animations':           'wiki/animations.md',
    'navigation-patterns':  'wiki/navigation-patterns.md',
    'gestures-interactions':'wiki/gestures-interactions.md',
    'mqtt-protocol':        'wiki/mqtt-protocol.md',
    'game-monetization':    'wiki/game-monetization.md',
    'robot-control-ui':     'wiki/robot-control-ui.md',
    'ros2-mobile':          'wiki/ros2-mobile.md',
    'computer-vision-mobile':'wiki/computer-vision-mobile.md',
    'visual-odometry':       'wiki/visual-odometry.md',
    'fuzja-modalnosci-kalman': 'wiki/fuzja-modalnosci-kalman.md',
    'projekt-zaliczeniowy':  'wiki/projekt-zaliczeniowy.md',
    'egzamin-teoretyczny':   'wiki/egzamin-teoretyczny.md',
    'app-publishing':        'wiki/app-publishing.md',
    'app-distribution':      'wiki/app-distribution.md',
    'app-design-process':    'wiki/app-design-process.md',
    'app-metadata':          'wiki/app-metadata.md',
    'file-storage-mobile':   'wiki/file-storage-mobile.md',
    'gamedev-market':        'wiki/gamedev-market.md',
    'small-engine-games':    'wiki/small-engine-games.md',
    'frotz-zmachine':        'wiki/frotz-zmachine.md',
    'serious-games':         'wiki/serious-games.md',
    'local-ai-intro':        'wiki/local-ai-intro.md',
    'mobile-ml-frameworks':  'wiki/mobile-ml-frameworks.md',
    'neural-networks-mobile': 'wiki/neural-networks-mobile.md',
    'llm-on-device':         'wiki/llm-on-device.md',
    'model-quantization':    'wiki/model-quantization.md',
    'on-device-inference':   'wiki/on-device-inference.md',
    'ai-image-processing':   'wiki/ai-image-processing.md',
    'ai-speech-nlp':         'wiki/ai-speech-nlp.md',
    'ai-privacy-security':   'wiki/ai-privacy-security.md',
    'ai-legal-aspects':      'wiki/ai-legal-aspects.md',
    'mediapipe-mobile':      'wiki/mediapipe-mobile.md',
    'ai-mobile-ux':          'wiki/ai-mobile-ux.md',
    'edge-ai-future':        'wiki/edge-ai-future.md',
    'file-formats-intro':    'wiki/file-formats-intro.md',
    'json-xml-formats':      'wiki/json-xml-formats.md',
    'csv-yaml-toml':         'wiki/csv-yaml-toml.md',
    'image-formats-mobile':  'wiki/image-formats-mobile.md',
    'audio-video-formats':   'wiki/audio-video-formats.md',
    '3d-model-formats':      'wiki/3d-model-formats.md',
    'ml-file-formats':       'wiki/ml-file-formats.md',
    'binary-serialization':  'wiki/binary-serialization.md',
    'compression-mobile':    'wiki/compression-mobile.md',
    'document-formats':      'wiki/document-formats.md',
    'database-file-formats': 'wiki/database-file-formats.md',
    'data-storage-best-practices': 'wiki/data-storage-best-practices.md',
};

// NAPRAWKA: ikony używają pełnej klasy FA (np. "fa-brands fa-android")
// zamiast samej nazwy ikony — buildSidebar() nie dokłada już hardkodowanego "fa-solid"
const METADATA = {
    'mobile-os':            { category: 'Projektowanie i OS',             title: 'Systemy operacyjne urządzeń mobilnych',    icon: 'fa-solid fa-mobile-screen-button' },
    'mobile-design':        { category: 'Projektowanie i OS',             title: 'Projektowanie aplikacji mobilnych',        icon: 'fa-solid fa-pen-ruler' },
    'android-ecosystem':    { category: 'Projektowanie i OS',             title: 'Ekosystem Android i Google Play',          icon: 'fa-brands fa-android' },
    'ios-ecosystem':        { category: 'Projektowanie i OS',             title: 'Ekosystem iOS i App Store',                icon: 'fa-brands fa-apple' },
    'mobile-security':      { category: 'Projektowanie i OS',             title: 'Bezpieczeństwo aplikacji mobilnych',       icon: 'fa-solid fa-shield-halved' },
    'mobile-performance':   { category: 'Projektowanie i OS',             title: 'Wydajność aplikacji mobilnych',            icon: 'fa-solid fa-gauge-high' },
    'mobile-hardware':      { category: 'Architektura sprzętu',           title: 'Architektura i budowa urządzeń mobilnych', icon: 'fa-solid fa-microchip' },
    'ui-ux':                { category: 'Metody interakcji UI/UX',        title: 'Metody interakcji i projektowanie UI/UX',  icon: 'fa-solid fa-hand-pointer' },
    'material-design':      { category: 'Metody interakcji UI/UX',        title: 'Material Design 3',                        icon: 'fa-solid fa-palette' },
    'accessibility':        { category: 'Metody interakcji UI/UX',        title: 'Dostępność aplikacji mobilnych',           icon: 'fa-solid fa-universal-access' },
    'ergonomia-uzytkowania':{ category: 'Metody interakcji UI/UX',        title: 'Ergonomia użytkowania',                    icon: 'fa-solid fa-hand-holding-heart' },
    'android-studio':       { category: 'Programowanie natywne Android',  title: 'Android Studio — Kotlin & Compose',        icon: 'fa-brands fa-android' },
    'termux':               { category: 'Programowanie natywne Android',  title: 'Termux — terminal emulator with packages', icon: 'fa-solid fa-terminal' },
    'kotlin-basics':        { category: 'Programowanie natywne Android',  title: 'Kotlin — podstawy języka',                 icon: 'fa-solid fa-code' },
    'jetpack-compose':      { category: 'Programowanie natywne Android',  title: 'Jetpack Compose — deklaratywny UI',        icon: 'fa-solid fa-layer-group' },
    'android-architecture': { category: 'Programowanie natywne Android',  title: 'Architektura aplikacji — MVVM',            icon: 'fa-solid fa-sitemap' },
    'android-data':         { category: 'Programowanie natywne Android',  title: 'Przechowywanie danych — Room',             icon: 'fa-solid fa-database' },
    'android-network':      { category: 'Programowanie natywne Android',  title: 'Sieć i REST API — Retrofit',               icon: 'fa-solid fa-network-wired' },
    'android-testing':      { category: 'Programowanie natywne Android',  title: 'Testowanie aplikacji Android',             icon: 'fa-solid fa-flask' },
    'agp-upgrade-assistant':{ category: 'Programowanie natywne Android',  title: 'Asystent uaktualniania AGP — praktyka zaawansowana', icon: 'fa-solid fa-screwdriver-wrench' },
    'xcode-ios':            { category: 'Programowanie natywne iOS',      title: 'Xcode — Swift & SwiftUI',                  icon: 'fa-brands fa-apple' },
    'swift-basics':         { category: 'Programowanie natywne iOS',      title: 'Swift — podstawy języka',                  icon: 'fa-solid fa-terminal' },
    'swiftui-advanced':     { category: 'Programowanie natywne iOS',      title: 'SwiftUI — zaawansowane techniki',          icon: 'fa-solid fa-wand-magic-sparkles' },
    'ios-networking':       { category: 'Programowanie natywne iOS',      title: 'Sieć i API w iOS',                         icon: 'fa-solid fa-network-wired' },
    'ios-data':             { category: 'Programowanie natywne iOS',      title: 'Przechowywanie danych w iOS',              icon: 'fa-solid fa-database' },
    'ios-notifications':    { category: 'Programowanie natywne iOS',      title: 'Powiadomienia push w iOS',                 icon: 'fa-solid fa-bell' },
    'cross-platform':       { category: 'Cross-platform i PWA',           title: 'Programowanie cross-platformowe',          icon: 'fa-solid fa-layer-group' },
    'flutter-advanced':     { category: 'Cross-platform i PWA',           title: 'Flutter — zaawansowane techniki',          icon: 'fa-solid fa-wind' },
    'react-native':         { category: 'Cross-platform i PWA',           title: 'React Native',                             icon: 'fa-brands fa-react' },
    'pwa-advanced':         { category: 'Cross-platform i PWA',           title: 'Progressive Web Apps',                     icon: 'fa-solid fa-globe' },
    'kmp-multiplatform':    { category: 'Cross-platform i PWA',           title: 'Kotlin Multiplatform',                     icon: 'fa-solid fa-code-branch' },
    'buildozer':            { category: 'Cross-platform i PWA',           title: 'Buildozer — pakowanie aplikacji Python/Kivy', icon: 'fa-brands fa-python' },
    'mobile-docker':        { category: 'Cross-platform i PWA',           title: 'Konteneryzacja i Docker w projektach mobilnych', icon: 'fa-brands fa-docker' },
    'sensors':              { category: 'Obsługa sensorów',               title: 'Sensory ruchu i środowiskowe',             icon: 'fa-solid fa-compass' },
    'camera-api':           { category: 'Obsługa sensorów',               title: 'Camera API i przetwarzanie obrazu',        icon: 'fa-solid fa-camera' },
    'location-maps':        { category: 'Obsługa sensorów',               title: 'Lokalizacja i mapy',                       icon: 'fa-solid fa-location-dot' },
    'audio-microphone':     { category: 'Obsługa sensorów',               title: 'Audio i mikrofon',                         icon: 'fa-solid fa-microphone' },
    'biometrics':           { category: 'Obsługa sensorów',               title: 'Biometria i uwierzytelnianie',             icon: 'fa-solid fa-fingerprint' },
    'iot-mobile':           { category: 'IoT mobile',                     title: 'Aplikacje mobilne IoT',                    icon: 'fa-solid fa-wifi' },
    'wifi-networking':      { category: 'IoT mobile',                     title: 'Wi-Fi i sieć lokalna',                     icon: 'fa-solid fa-house-signal' },
    'smart-home':           { category: 'IoT mobile',                     title: 'Smart Home i protokoły automatyki',        icon: 'fa-solid fa-house' },
    'mqtt-protocol':        { category: 'IoT mobile',                     title: 'MQTT — protokół dla IoT',                  icon: 'fa-solid fa-tower-broadcast' },
    'affective-computing':       { category: 'Informatyka afektywna',          title: 'Informatyka afektywna w mobile',                                icon: 'fa-solid fa-face-smile' },
    'emotion-recognition':       { category: 'Informatyka afektywna',          title: 'Rozpoznawanie emocji z kamery',                                 icon: 'fa-solid fa-eye' },
    'voice-analysis':            { category: 'Informatyka afektywna',          title: 'Analiza głosu i mowy',                                          icon: 'fa-solid fa-wave-square' },
    'mental-health-apps':        { category: 'Informatyka afektywna',          title: 'Aplikacje zdrowia psychicznego',                                icon: 'fa-solid fa-heart-pulse' },
    'cognitive-robotics':        { category: 'Informatyka afektywna',          title: 'Robotyka poznawcza',                                            icon: 'fa-solid fa-robot' },
    'computational-cognition':   { category: 'Informatyka afektywna',          title: 'Computational cognition',                                       icon: 'fa-solid fa-brain' },
    'software-agent':            { category: 'Informatyka afektywna',          title: 'Agent programowy',                                              icon: 'fa-solid fa-gears' },
    'intelligent-agent':         { category: 'Informatyka afektywna',          title: 'Inteligentny agent',                                            icon: 'fa-solid fa-microchip' },
    'knowledge-representation':  { category: 'Informatyka afektywna',          title: 'Reprezentacja wiedzy i wnioskowanie',                           icon: 'fa-solid fa-diagram-project' },
    'cognitive-models':          { category: 'Informatyka afektywna',          title: 'Modele kognitywne',                                             icon: 'fa-solid fa-sitemap' },
    'cognitive-perception':      { category: 'Informatyka afektywna',          title: 'Modelowanie kognitywne ludzkiej percepcji',                     icon: 'fa-solid fa-eye-low-vision' },
    'lida-architecture':         { category: 'Informatyka afektywna',          title: 'LIDA — Learning Intelligent Distribution Agent',                icon: 'fa-solid fa-circle-nodes' },
    'soar-architecture':         { category: 'Informatyka afektywna',          title: 'Soar — architektura kognitywna',                                icon: 'fa-solid fa-layer-group' },
    'clarion-architecture':      { category: 'Informatyka afektywna',          title: 'CLARION — Connectionist Learning with Adaptive Rule Induction', icon: 'fa-solid fa-network-wired' },
    'actr-architecture':         { category: 'Informatyka afektywna',          title: 'ACT-R — Adaptive Control of Thought Rational',                  icon: 'fa-solid fa-gears' },
    'computer-aided-diagnosis':  { category: 'Informatyka afektywna',          title: 'Computer-Aided Diagnosis (CAD)',                                icon: 'fa-solid fa-stethoscope' },
    'active-vision':             { category: 'Informatyka afektywna',          title: 'Active Vision — aktywna wizja',                                 icon: 'fa-solid fa-eye' },
    'foveated-vision':           { category: 'Informatyka afektywna',          title: 'Foveated Vision — widzenie fowealne',                           icon: 'fa-solid fa-bullseye' },
    'xr-mobile':            { category: 'XR i rozszerzona rzeczywistość', title: 'Wprowadzenie do XR mobile',                icon: 'fa-solid fa-vr-cardboard' },
    'arcore-advanced':      { category: 'XR i rozszerzona rzeczywistość', title: 'ARCore — zaawansowane techniki',           icon: 'fa-solid fa-cube' },
    'vr-mobile':            { category: 'XR i rozszerzona rzeczywistość', title: 'VR mobilne i Google Cardboard',            icon: 'fa-solid fa-glasses' },
    'mobile-games':         { category: 'Gry mobilne',                    title: 'Podstawy programowania gier mobilnych',    icon: 'fa-solid fa-gamepad' },
    'lua-mobile-games':     { category: 'Gry mobilne',                    title: 'Lua w grach mobilnych — silniki i frameworki', icon: 'fa-solid fa-code' },
    'unity-advanced':       { category: 'Gry mobilne',                    title: 'Unity — zaawansowane techniki',            icon: 'fa-solid fa-cube' },
    'game-physics':         { category: 'Gry mobilne',                    title: 'Fizyka i kolizje w grach mobilnych',       icon: 'fa-solid fa-atom' },
    'game-monetization':    { category: 'Gry mobilne',                    title: 'Monetyzacja gier mobilnych',               icon: 'fa-solid fa-coins' },
    'gpu-rendering':        { category: 'Architektura sprzętu',           title: 'GPU i renderowanie grafiki',               icon: 'fa-solid fa-display' },
    'battery-power':        { category: 'Architektura sprzętu',           title: 'Bateria i zarządzanie energią',            icon: 'fa-solid fa-battery-half' },
    'memory-management':    { category: 'Architektura sprzętu',           title: 'Pamięć RAM i zarządzanie zasobami',        icon: 'fa-solid fa-memory' },
    'display-screen':       { category: 'Architektura sprzętu',           title: 'Wyświetlacze i technologie ekranów',       icon: 'fa-solid fa-display' },
    'connectivity':         { category: 'Architektura sprzętu',           title: 'Łączność bezprzewodowa — LTE, 5G, Wi-Fi 6',icon: 'fa-solid fa-signal' },
    'animations':           { category: 'Metody interakcji UI/UX',        title: 'Animacje w aplikacjach mobilnych',         icon: 'fa-solid fa-wand-magic-sparkles' },
    'navigation-patterns':  { category: 'Metody interakcji UI/UX',        title: 'Wzorce nawigacji',                         icon: 'fa-solid fa-route' },
    'gestures-interactions':{ category: 'Metody interakcji UI/UX',        title: 'Gesty i interakcje dotykowe',              icon: 'fa-solid fa-hand-pointer' },
    'robot-control-ui':     { category: 'Robotyka autonomiczna',          title: 'UI sterowania robotem',                    icon: 'fa-solid fa-gamepad' },
    'robotics-mobile':      { category: 'Robotyka autonomiczna',          title: 'Aplikacja jako kontroler robota',          icon: 'fa-solid fa-robot' },
    'ros2-mobile':          { category: 'Robotyka autonomiczna',          title: 'ROS2 i sterowanie robotem',                icon: 'fa-solid fa-diagram-project' },
    'computer-vision-mobile':{ category: 'Robotyka autonomiczna',         title: 'Computer Vision w robotyce mobilnej',      icon: 'fa-solid fa-eye' },
    'visual-odometry':       { category: 'Robotyka autonomiczna',         title: 'Odometria wizyjna i Egomotion',             icon: 'fa-solid fa-route' },
    'fuzja-modalnosci-kalman': { category: 'Robotyka autonomiczna',       title: 'Fuzja modalności: filtr Kalmana, GP i SYAC', icon: 'fa-solid fa-circle-nodes' },
    'projekt-zaliczeniowy':  { category: 'Zaliczenie',                    title: 'Projekt aplikacji',                        icon: 'fa-solid fa-laptop-code' },
    'egzamin-teoretyczny':   { category: 'Zaliczenie',                    title: 'Egzamin teoretyczny — przygotowanie',      icon: 'fa-solid fa-graduation-cap' },
    'app-publishing':        { category: 'Projektowanie i OS',            title: 'Publikacja i promocja własnej aplikacji',  icon: 'fa-solid fa-rocket' },
    'app-distribution':      { category: 'Projektowanie i OS',            title: 'Metody dystrybucji — Google Play i F-Droid', icon: 'fa-solid fa-store' },
    'app-design-process':    { category: 'Projektowanie i OS',            title: 'Proces projektowania — Brief, BRD, FRD, TRD', icon: 'fa-solid fa-file-lines' },
    'app-metadata':          { category: 'Projektowanie i OS',            title: 'Zbieranie metadanych przez aplikację',      icon: 'fa-solid fa-tags' },
    'file-storage-mobile':   { category: 'Programowanie natywne Android', title: 'Zapisywanie i odczyt plików na urządzeniu mobilnym', icon: 'fa-solid fa-file-arrow-down' },
    'gamedev-market':        { category: 'Gry mobilne',                    title: 'Rynek gamedev w Polsce i na świecie',               icon: 'fa-solid fa-earth-europe' },
    'small-engine-games':    { category: 'Gry mobilne',                    title: 'Małe silniki gier mobilnych — Pico-8, LÖVE, Defold',    icon: 'fa-solid fa-floppy-disk' },
    'frotz-zmachine':        { category: 'Gry mobilne',                    title: 'A Portable Z-Machine Interpreter — Frotz',              icon: 'fa-solid fa-terminal' },
    'serious-games':         { category: 'Gry mobilne',                    title: 'Gry poważne (Serious Games)',                      icon: 'fa-solid fa-graduation-cap' },
    'local-ai-intro':        { category: 'Lokalna AI na urządzeniu',       title: 'Wprowadzenie do lokalnej AI na urządzeniu mobilnym', icon: 'fa-solid fa-microchip' },
    'mobile-ml-frameworks':  { category: 'Lokalna AI na urządzeniu',       title: 'Frameworki ML na urządzeniu: TFLite, Core ML, ONNX', icon: 'fa-solid fa-layer-group' },
    'neural-networks-mobile': { category: 'Lokalna AI na urządzeniu',       title: 'Sieci neuronowe na urządzeniu mobilnym',             icon: 'fa-solid fa-diagram-project' },
    'llm-on-device':         { category: 'Lokalna AI na urządzeniu',       title: 'Modele językowe LLM na urządzeniu',                  icon: 'fa-solid fa-comment-dots' },
    'model-quantization':    { category: 'Lokalna AI na urządzeniu',       title: 'Kwantyzacja i optymalizacja modeli AI',              icon: 'fa-solid fa-compress' },
    'on-device-inference':   { category: 'Lokalna AI na urządzeniu',       title: 'Wnioskowanie lokalne — architektura i wydajność',    icon: 'fa-solid fa-bolt' },
    'ai-image-processing':   { category: 'Lokalna AI na urządzeniu',       title: 'AI w przetwarzaniu obrazu na urządzeniu',            icon: 'fa-solid fa-image' },
    'ai-speech-nlp':         { category: 'Lokalna AI na urządzeniu',       title: 'Przetwarzanie mowy i NLP na urządzeniu',             icon: 'fa-solid fa-microphone-lines' },
    'ai-privacy-security':   { category: 'Lokalna AI na urządzeniu',       title: 'Prywatność i bezpieczeństwo w lokalnej AI',          icon: 'fa-solid fa-shield-halved' },
    'ai-legal-aspects':      { category: 'Lokalna AI na urządzeniu',       title: 'Prawne aspekty AI na urządzeniach mobilnych',        icon: 'fa-solid fa-scale-balanced' },
    'mediapipe-mobile':      { category: 'Lokalna AI na urządzeniu',       title: 'MediaPipe — kompleksowe rozwiązania AI',             icon: 'fa-solid fa-wand-magic-sparkles' },
    'ai-mobile-ux':          { category: 'Lokalna AI na urządzeniu',       title: 'Projektowanie UX aplikacji z lokalną AI',            icon: 'fa-solid fa-hand-pointer' },
    'edge-ai-future':        { category: 'Lokalna AI na urządzeniu',       title: 'Przyszłość Edge AI — trendy i kierunki rozwoju',     icon: 'fa-solid fa-rocket' },
    'file-formats-intro':    { category: 'Formaty plików i przechowywanie danych', title: 'Wprowadzenie do formatów plików w aplikacjach mobilnych', icon: 'fa-solid fa-file-circle-question' },
    'json-xml-formats':      { category: 'Formaty plików i przechowywanie danych', title: 'JSON i XML — formaty wymiany danych',                     icon: 'fa-solid fa-code' },
    'csv-yaml-toml':         { category: 'Formaty plików i przechowywanie danych', title: 'CSV, YAML i TOML — lekkie formaty danych i konfiguracji', icon: 'fa-solid fa-table' },
    'image-formats-mobile':  { category: 'Formaty plików i przechowywanie danych', title: 'Formaty obrazów w aplikacjach mobilnych',                 icon: 'fa-solid fa-image' },
    'audio-video-formats':   { category: 'Formaty plików i przechowywanie danych', title: 'Formaty audio i wideo w aplikacjach mobilnych',           icon: 'fa-solid fa-film' },
    '3d-model-formats':      { category: 'Formaty plików i przechowywanie danych', title: 'Formaty modeli 3D w aplikacjach mobilnych',               icon: 'fa-solid fa-cube' },
    'ml-file-formats':       { category: 'Formaty plików i przechowywanie danych', title: 'Formaty plików modeli uczenia maszynowego',               icon: 'fa-solid fa-brain' },
    'binary-serialization':  { category: 'Formaty plików i przechowywanie danych', title: 'Binarne formaty serializacji danych',                     icon: 'fa-solid fa-file-zipper' },
    'compression-mobile':    { category: 'Formaty plików i przechowywanie danych', title: 'Kompresja danych w aplikacjach mobilnych',                icon: 'fa-solid fa-compress' },
    'document-formats':      { category: 'Formaty plików i przechowywanie danych', title: 'Formaty dokumentów w aplikacjach mobilnych',              icon: 'fa-solid fa-file-lines' },
    'database-file-formats': { category: 'Formaty plików i przechowywanie danych', title: 'Formaty plików baz danych w aplikacjach mobilnych',       icon: 'fa-solid fa-database' },
    'data-storage-best-practices': { category: 'Formaty plików i przechowywanie danych', title: 'Dobre praktyki przechowywania danych',              icon: 'fa-solid fa-shield-halved' },
};

// NAPRAWKA: ikony kategorii używają pełnej klasy FA
const CATEGORIES = [
    { id: 'cat-os',       name: 'Projektowanie i OS',             icon: 'fa-solid fa-mobile-screen-button', articles: ['mobile-os','mobile-design','app-design-process','app-metadata','android-ecosystem','ios-ecosystem','mobile-security','mobile-performance','app-publishing','app-distribution'] },
    { id: 'cat-hw',       name: 'Architektura sprzętu',           icon: 'fa-solid fa-microchip',            articles: ['mobile-hardware','gpu-rendering','battery-power','memory-management','display-screen','connectivity'] },
    { id: 'cat-ux',       name: 'Metody interakcji UI/UX',        icon: 'fa-solid fa-hand-pointer',         articles: ['ui-ux','material-design','accessibility','ergonomia-uzytkowania','animations','navigation-patterns','gestures-interactions'] },
    { id: 'cat-android',  name: 'Programowanie natywne Android',  icon: 'fa-brands fa-android',             articles: ['android-studio','termux','kotlin-basics','jetpack-compose','android-architecture','android-data','android-network','android-testing'] },
    { id: 'cat-ios',      name: 'Programowanie natywne iOS',      icon: 'fa-brands fa-apple',               articles: ['xcode-ios','swift-basics','swiftui-advanced','ios-networking','ios-data','ios-notifications'] },
    { id: 'cat-cross',    name: 'Cross-platform i PWA',           icon: 'fa-solid fa-layer-group',          articles: ['cross-platform','flutter-advanced','react-native','pwa-advanced','kmp-multiplatform','buildozer','mobile-docker'] },
    { id: 'cat-sensors',  name: 'Obsługa sensorów',               icon: 'fa-solid fa-compass',              articles: ['sensors','camera-api','location-maps','audio-microphone','biometrics'] },
    { id: 'cat-iot',      name: 'IoT mobile',                     icon: 'fa-solid fa-wifi',                 articles: ['iot-mobile','wifi-networking','smart-home','mqtt-protocol'] },
    { id: 'cat-affective',name: 'Informatyka afektywna',          icon: 'fa-solid fa-face-smile',           articles: ['affective-computing','emotion-recognition','voice-analysis','mental-health-apps','cognitive-robotics','computational-cognition','software-agent','intelligent-agent','knowledge-representation','cognitive-models','cognitive-perception','lida-architecture','soar-architecture','clarion-architecture','actr-architecture','computer-aided-diagnosis','active-vision','foveated-vision'] },
    { id: 'cat-xr',       name: 'XR i rozszerzona rzeczywistość', icon: 'fa-solid fa-vr-cardboard',         articles: ['xr-mobile','arcore-advanced','vr-mobile'] },
    { id: 'cat-games',    name: 'Gry mobilne',                    icon: 'fa-solid fa-gamepad',              articles: ['mobile-games','lua-mobile-games','unity-advanced','game-physics','game-monetization','gamedev-market','small-engine-games','frotz-zmachine','serious-games'] },
    { id: 'cat-robots',   name: 'Robotyka autonomiczna',          icon: 'fa-solid fa-robot',                articles: ['robotics-mobile','ros2-mobile','computer-vision-mobile','robot-control-ui','visual-odometry','fuzja-modalnosci-kalman'] },
    { id: 'cat-local-ai', name: 'Lokalna AI na urządzeniu',      icon: 'fa-solid fa-microchip',            articles: ['local-ai-intro','mobile-ml-frameworks','neural-networks-mobile','llm-on-device','model-quantization','on-device-inference','ai-image-processing','ai-speech-nlp','ai-privacy-security','ai-legal-aspects','mediapipe-mobile','ai-mobile-ux','edge-ai-future'] },
    { id: 'cat-file-formats', name: 'Formaty plików i przechowywanie danych', icon: 'fa-solid fa-folder-open',        articles: ['file-formats-intro','json-xml-formats','csv-yaml-toml','image-formats-mobile','audio-video-formats','3d-model-formats','ml-file-formats','binary-serialization','compression-mobile','document-formats','database-file-formats','data-storage-best-practices'] },
    { id: 'cat-zalicz',  name: 'Zaliczenie',                     icon: 'fa-solid fa-graduation-cap',       articles: ['projekt-zaliczeniowy','egzamin-teoretyczny'] },
];

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    initThemePicker();
    initScrollProgress();
    initBackToTop();
    waitForMarked();
});

function waitForMarked(attempts = 0) {
    if (typeof marked !== 'undefined') { initWiki(); }
    else if (attempts < 20) setTimeout(() => waitForMarked(attempts + 1), 200);
}

const VALID_THEMES = ['light', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'aurora'];

function initThemePicker() {
    const saved = localStorage.getItem('pam-theme') || 'light';
    const theme = VALID_THEMES.includes(saved) ? saved : 'light';
    applyTheme(theme);

    const pickerBtn = document.getElementById('themePickerBtn');
    const dropdown = document.getElementById('themeDropdown');
    const pickerContainer = document.getElementById('themePicker');

    pickerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        dropdown.classList.toggle('open', !isOpen);
        pickerBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    document.addEventListener('click', (e) => {
        if (!pickerContainer?.contains(e.target)) {
            dropdown?.classList.remove('open');
            pickerBtn?.setAttribute('aria-expanded', 'false');
        }
    });

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.theme;
            if (VALID_THEMES.includes(t)) {
                applyTheme(t);
                localStorage.setItem('pam-theme', t);
                dropdown?.classList.remove('open');
                pickerBtn?.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === t);
    });
}

function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    const updateProgress = () => {
        const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = h > 0 ? (window.scrollY / h) * 100 : 0;
        bar.style.width = `${Math.max(0, Math.min(progress, 100))}%`;
    };

    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    updateProgress();
}

function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initWiki() {
    if (typeof marked !== 'undefined') marked.setOptions({ breaks: true, gfm: true });
    buildSidebar();
    setupSearch();
    const hash = window.location.hash.substring(1);
    if (hash && ARTICLES[hash]) navigateToArticle(hash, { updateHash: false });
    window.addEventListener('hashchange', () => {
        const id = window.location.hash.substring(1);
        if (id && ARTICLES[id]) navigateToArticle(id, { updateHash: false });
    });
}

function buildSidebar() {
    const nav = document.querySelector('.wiki-nav-categories');
    if (!nav) return;
    CATEGORIES.forEach(cat => {
        const sec = document.createElement('div');
        sec.className = 'wiki-category';
        // NAPRAWKA: ikony kategorii i artykułów mają już pełną klasę FA w danych —
        // nie doklejamy hardkodowanego "fa-solid", tylko używamy icon bezpośrednio
        sec.innerHTML = `
            <h4 class="cat-header" data-cat="${cat.id}">
                <i class="${cat.icon}"></i>
                <span>${cat.name}</span>
                <i class="fa-solid fa-chevron-down toggle-icon"></i>
            </h4>
            <ul class="cat-list collapsed" id="${cat.id}">
                ${cat.articles.map(id => {
                    const m = METADATA[id] || {};
                    return `<li><a href="#${id}" data-article="${id}"><i class="${m.icon || 'fa-solid fa-file'} article-icon"></i>${m.title || id}</a></li>`;
                }).join('')}
            </ul>`;
        nav.appendChild(sec);
        // Start collapsed: rotate toggle icon
        const icon = sec.querySelector('.toggle-icon');
        if (icon) icon.style.transform = 'rotate(-90deg)';
    });

    document.querySelectorAll('.cat-header').forEach(h => {
        h.addEventListener('click', () => {
            const list = document.getElementById(h.dataset.cat);
            if (!list) return;
            const open = !list.classList.contains('collapsed');
            list.classList.toggle('collapsed', open);
            const icon = h.querySelector('.toggle-icon');
            if (icon) icon.style.transform = open ? 'rotate(-90deg)' : '';
        });
    });

    document.querySelectorAll('[data-article]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.dataset.article;
            navigateToArticle(id);
            if (window.innerWidth < 900) document.querySelector('.wiki-sidebar')?.classList.remove('open');
        });
    });
}

function setActiveLink(id) {
    document.querySelectorAll('[data-article]').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`[data-article="${id}"]`).forEach(l => l.classList.add('active'));

    // Expand the category that contains this article
    const activeLink = document.querySelector(`[data-article="${id}"]`);
    if (activeLink) {
        const catList = activeLink.closest('.cat-list');
        if (catList) {
            catList.classList.remove('collapsed');
            const header = document.querySelector(`[data-cat="${catList.id}"]`);
            const icon = header?.querySelector('.toggle-icon');
            if (icon) icon.style.transform = '';
        }
    }
}

function navigateToArticle(id, options = {}) {
    if (!id || !ARTICLES[id]) return;

    const { updateHash = true } = options;

    if (updateHash && window.location.hash.substring(1) !== id) {
        window.location.hash = id;
        return;
    }

    loadArticle(id);
    setActiveLink(id);
}

// setupSearch() is defined in pam-files.js

async function loadArticle(articleId) {
    const container = document.getElementById('wikiArticle');
    if (!container) return;
    const path = ARTICLES[articleId];
    if (!path) { showError('Artykuł nie został znaleziony.'); return; }

    container.innerHTML = `<div class="wiki-loading"><div class="loading-spinner"></div><p>Ładowanie…</p></div>`;

    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        container.innerHTML = marked.parse(await res.text());

        wrapTables(container);
        addReadingTime(container);
        generateTableOfContents(container);
        processInternalLinks(container);
        collapseTopicsList(container, articleId);
        addCopyButtons(container);
        injectExamQuizCallout(container, articleId);

        if (typeof hljs !== 'undefined') {
            container.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
        }
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateBreadcrumbs(articleId);
    } catch (err) {
        showError(`Nie można załadować artykułu <strong>${articleId}</strong>. Upewnij się że uruchamiasz stronę przez serwer HTTP (np. <code>python -m http.server</code>).`);
    }
}

function collapseTopicsList(container, articleId) {
    if (articleId !== 'projekt-zaliczeniowy') return;
    const headings = container.querySelectorAll('h2');
    let targetH2 = null;
    headings.forEach(h => {
        if (h.textContent.trim() === 'Lista przykładowych tematów projektu') {
            targetH2 = h;
        }
    });
    if (!targetH2) return;

    const elementsToCollapse = [];
    let el = targetH2.nextElementSibling;
    while (el && el.tagName !== 'H2') {
        elementsToCollapse.push(el);
        el = el.nextElementSibling;
    }
    if (elementsToCollapse.length === 0) return;

    const wrapperId = 'topics-list-body';
    const wrapper = document.createElement('div');
    wrapper.className = 'topics-collapse-body';
    wrapper.id = wrapperId;
    wrapper.style.display = 'none';
    elementsToCollapse.forEach(elem => wrapper.appendChild(elem));

    const toggle = document.createElement('button');
    toggle.className = 'topics-collapse-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', wrapperId);
    toggle.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Pokaż listę tematów';
    toggle.addEventListener('click', () => {
        const hidden = wrapper.style.display === 'none';
        wrapper.style.display = hidden ? '' : 'none';
        toggle.setAttribute('aria-expanded', hidden ? 'true' : 'false');
        toggle.innerHTML = hidden
            ? '<i class="fa-solid fa-chevron-up"></i> Ukryj listę tematów'
            : '<i class="fa-solid fa-chevron-down"></i> Pokaż listę tematów';
    });

    targetH2.insertAdjacentElement('afterend', wrapper);
    targetH2.insertAdjacentElement('afterend', toggle);
}


function injectExamQuizCallout(container, articleId) {
    container.querySelector('.exam-quiz-cta')?.remove();
    if (articleId !== 'egzamin-teoretyczny') return;

    const target = container.querySelector('h1') || container.firstElementChild;
    if (!target) return;

    const box = document.createElement('section');
    box.className = 'exam-quiz-cta';
    box.innerHTML = `
        <div class="exam-quiz-cta-content">
            <span class="exam-quiz-badge"><i class="fa-solid fa-pen-to-square"></i> Test wiedzy</span>
            <h2>Sprawdź się w quizie ABCD</h2>
            <p>Przejdź do osobnej strony z pytaniami jednokrotnego wyboru i zobacz wynik po zakończeniu testu.</p>
            <a class="exam-quiz-button" href="test.html" aria-label="Przejdź do strony testu ABCD">
                <i class="fa-solid fa-circle-play"></i>
                Rozpocznij test
            </a>
        </div>
    `;
    target.insertAdjacentElement('afterend', box);
}

function wrapTables(container) {
    container.querySelectorAll('table').forEach(table => {
        if (table.closest('.table-wrapper')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}

function showError(msg) {
    const container = document.getElementById('wikiArticle');
    if (container) container.innerHTML = `<div class="wiki-error"><i class="fa-solid fa-triangle-exclamation"></i><p>${msg}</p></div>`;
}

function updateBreadcrumbs(id) {
    const crumbs = document.getElementById('breadcrumbs');
    const meta = METADATA[id];
    if (!crumbs || !meta) return;
    document.getElementById('currentCategory').textContent = meta.category;
    document.getElementById('currentArticle').textContent = meta.title;
    crumbs.style.display = 'flex';

    const logoIcon = document.getElementById('headerLogoIcon');
    if (logoIcon && meta.icon) {
        logoIcon.classList.remove(...Array.from(logoIcon.classList).filter(c => c.startsWith('fa-')));
        meta.icon.split(' ').forEach(cls => { if (cls) logoIcon.classList.add(cls); });
    }
}

function processInternalLinks(container) {
    container.querySelectorAll('a[href^="#wiki-"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.getAttribute('href').replace('#wiki-', '');
            navigateToArticle(id);
        });
    });
}

function addCopyButtons(container) {
    container.querySelectorAll('pre').forEach(pre => {
        const wrap = document.createElement('div');
        wrap.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj';
        btn.addEventListener('click', async () => {
            const code = pre.querySelector('code')?.textContent || pre.textContent;
            try {
                await navigator.clipboard.writeText(code);
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Skopiowano!';
                btn.classList.add('copied');
                setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj'; btn.classList.remove('copied'); }, 2000);
            } catch { btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Błąd'; }
        });
        wrap.appendChild(btn);
    });
}

function addReadingTime(container) {
    const mins = Math.ceil(container.textContent.trim().split(/\s+/).length / 200);
    const badge = document.createElement('div');
    badge.className = 'reading-time';
    badge.innerHTML = `<i class="fa-solid fa-clock"></i><span>${mins} min czytania</span>`;
    container.querySelector('h1')?.insertAdjacentElement('afterend', badge);
}

function generateTableOfContents(container) {
    const hs = container.querySelectorAll('h2, h3');
    if (hs.length < 3) return;
    const toc = document.createElement('div');
    toc.className = 'article-toc';
    toc.innerHTML = '<h3><i class="fa-solid fa-list"></i> Spis Treści</h3><ul></ul>';
    const ul = toc.querySelector('ul');
    hs.forEach((h, i) => {
        const id = `heading-${i}`;
        h.id = id;
        const li = document.createElement('li');
        li.style.paddingLeft = h.tagName === 'H3' ? '16px' : '0';
        li.innerHTML = `<a href="#${id}">${h.textContent}</a>`;
        ul.appendChild(li);
        li.querySelector('a').addEventListener('click', e => {
            e.preventDefault();
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    container.querySelector('h1')?.insertAdjacentElement('afterend', toc);
}
// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('wikiSidebar');
    toggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));
    document.addEventListener('click', e => {
        if (sidebar?.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !toggle?.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
});
