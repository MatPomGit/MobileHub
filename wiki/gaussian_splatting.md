Poniżej znajduje się rozbudowana wersja artykułu, przygotowana w formacie Markdown, gotowa do zapisu jako plik `.md`.

---

# 3D Gaussian Splatting: Kompletny Przewodnik po Rewolucji w Grafice 3D

## Wstęp: Koniec ery wielokątów?
Przez ostatnie trzy dekady grafika komputerowa opierała się głównie na siatkach trójkątów (**polygonal meshes**). Choć metoda ta doskonale sprawdza się w projektowaniu obiektów od zera, zawodzi przy próbie wiernego oddania skomplikowanych, organicznych scen rzeczywistych, takich jak dym, włosy czy rozproszone odbicia światła.

**3D Gaussian Splatting (3DGS)** to paradygmatyczny zwrot w stronę jawnej, punktowej reprezentacji objętościowej. Pozwala ona na renderowanie fotorealistycznych scen z prędkością przekraczającą **100 FPS**, co wcześniej wydawało się nieosiągalne dla tak wysokiej jakości wizualnej przy zachowaniu pełnej swobody ruchu kamery.

---

## 1. Architektura i Fundamenty Matematyczne

W przeciwieństwie do metod niejawnych (jak NeRF), które chowają geometrię wewnątrz wag sieci neuronowej, 3DGS reprezentuje świat za pomocą milionów elipsoidalnych cząsteczek.

### Geometria Elipsoidy i Kowariancja
Pojedynczy "Splat" jest funkcją gęstości prawdopodobieństwa Gaussa. Kluczowym wyzwaniem jest rzutowanie tych funkcji na ekran 2D w procesie rasteryzacji. Matematycznie kowariancja $\Sigma$ w przestrzeni 3D jest rzutowana na przestrzeń 2D za pomocą transformacji:

$$\Sigma' = J W \Sigma W^T J^T$$

Gdzie $W$ to macierz widoku, a $J$ to macierz Jakobianu. Aby zapewnić, że macierz $\Sigma$ pozostanie dodatnio określona, stosuje się rozkład na macierz rotacji $R$ i skalowania $S$:
$$\Sigma = RSS^TR^T$$

### Harmoniki Sferyczne (Spherical Harmonics)
Aby oddać zjawiska zależne od kąta patrzenia, jak **połysk czy opalescencja**, kolor nie jest stałą wartością RGB. Wykorzystuje się **Harmoniki Sferyczne**, co pozwala modelowi "pamiętać", że dany punkt wygląda inaczej w zależności od perspektywy obserwatora.

---

## 2. Cykl Życia Sceny 3DGS: Pipeline Techniczny

Proces tworzenia modelu 3DGS to wyrafinowany ciąg operacji wizji komputerowej:

### Krok 1: SfM (Structure from Motion)
Proces zaczyna się od analizy zdjęć lub wideo (od 20 do kilkuset ujęć). Algorytmy takie jak **COLMAP** identyfikują punkty wspólne i wyznaczają:
* Pozycję i rotację kamery dla każdego ujęcia.
* Parametry soczewki (pole widzenia, dystorsja).
* Rzadką chmurę punktów (**Sparse Point Cloud**), która służy jako "szkielet" dla Gaussów.

### Krok 2: Optymalizacja i "Densenification"
W miejscu każdego punktu inicjowany jest Gauss. Następnie system stosuje strategię **Adaptive Density Control**:
* **Splitting (Podział):** Jeśli obszar ma dużą rekonstrukcję błędów, duże Gaussy są dzielone na mniejsze.
* **Cloning (Klonowanie):** Jeśli brakuje detali w małych obszarach, Gaussy są duplikowane.
* **Pruning (Przycinanie):** Gaussy o bardzo niskiej przezroczystości ($\alpha \approx 0$) są usuwane, aby oszczędzać pamięć GPU.

### Krok 3: Rasteryzacja kafelkowa (Tile-based)
To serce wydajności 3DGS. Ekran dzielony jest na kafle o rozmiarze 16x16 pikseli. Algorytm sortuje Gaussy według głębokości tylko dla konkretnych kafli. Dzięki temu GPU przetwarza tylko te cząsteczki, które faktycznie widzi dany fragment ekranu, co drastycznie redukuje liczbę obliczeń.

---

## 3. Pogłębione Porównanie: 3DGS vs. NeRF

| Cecha | Neural Radiance Fields (NeRF) | 3D Gaussian Splatting |
| :--- | :--- | :--- |
| **Model bazowy** | MLP (Perceptron wielowarstwowy) | Chmura elipsoid (Dane jawne) |
| **Przechowywanie** | Wagi sieci neuronowej (kilkanaście MB) | Atrybuty punktów (setki MB / GB) |
| **Renderowanie** | Ray marching (odpytywanie sieci) | Rasteryzacja (rzutowanie punktów) |
| **Interaktywność** | Wysoki koszt obliczeniowy (opóźnienia) | Natychmiastowa (płynność gier) |
| **Możliwość edycji** | Niemal zerowa | Wysoka (możliwość przesuwania obiektów) |

---

## 4. Zaawansowane Wyzwania i Optymalizacja

Mimo sukcesu, technologia boryka się z wyzwaniami, nad którymi pracują zespoły badawcze:

* **Pamięć VRAM:** Przechowywanie milionów Gaussów (z danymi o pozycji, skali, rotacji, kolorze SH i przezroczystości) wymaga ogromnej ilości pamięci GPU.
* **Aliasing:** Przy oddalaniu kamery małe Gaussy mogą stawać się mniejsze niż piksel, powodując migotanie obrazu. Rozwiązaniem są techniki takie jak **Mip-Splatting**.
* **Kompresja:** Standardowe pliki mogą ważyć setki megabajtów. Nowoczesne metody (kwantyzacja wag) pozwalają zredukować rozmiar do 20-50 MB bez widocznej utraty jakości.

---

## 5. Ekosystem i Przyszłość

Technologia 3DGS szybko wykracza poza sferę akademicką:
* **Narzędzia mobilne:** Platformy takie jak **Luma AI** czy **Polycam** pozwalają na tworzenie Splatów prosto z telefonu.
* **Edycja:** Narzędzia takie jak **Splatana** czy **Postshot** umożliwiają czyszczenie scen i animowanie Gaussów.
* **Silniki Gier:** Unity i Unreal Engine posiadają już nieoficjalne wsparcie dla 3DGS, co pozwoli na umieszczanie fotorealistycznych lokacji w grach.

### Podsumowanie
3D Gaussian Splatting to przełom, który demokratyzuje tworzenie treści 3D. Dzięki niemu proces digitalizacji rzeczywistości przestaje być domeną studiów z ogromnymi farmami renderującymi, a staje się dostępny dla każdego posiadacza smartfona i komputera z przyzwoitą kartą graficzną.

---
*Artykuł opracowany na podstawie publikacji "3D Gaussian Splatting for Real-Time Radiance Field Rendering" (Kerbl et al., 2023).*
