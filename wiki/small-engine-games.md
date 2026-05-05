# Gry mobilne na małych silnikach

Małe silniki gier (*small game engines*, *fantasy consoles*) to narzędzia oferujące celowo ograniczone środowisko twórcze: niska rozdzielczość, ograniczona paleta barw, prosty interfejs skryptowania. Paradoksalnie te ograniczenia pobudzają kreatywność i sprzyjają tworzeniu kompletnych gier przez jedną osobę lub mały zespół. Doskonale sprawdzają się na urządzeniach mobilnych dzięki minimalnym wymaganiom sprzętowym i możliwości eksportu na Android i iOS.

---

## Czym są małe silniki gier?

Małe silniki gier to kategoria narzędzi wyróżniająca się:

| Cecha | Opis |
|-------|------|
| **Prostota API** | Kilkadziesiąt funkcji wystarczy do stworzenia pełnej gry |
| **Ograniczenia techniczne** | Niska rozdzielczość (np. 128×128 px), ograniczona liczba kolorów, mało pamięci |
| **Szybki prototyping** | Od pomysłu do grywalnego prototypu w kilka godzin |
| **Eksport mobilny** | Większość obsługuje eksport na Android/iOS lub działa w przeglądarce |
| **Niski próg wejścia** | Idealne do nauki programowania gier |

Najważniejsze reprezentanty tej kategorii to: **Pico-8**, **TIC-80**, **LÖVE (Love2D)**, **Defold**, **Pyxel** i **GB Studio**.

---

## Pico-8 - fantasy console

Pico-8 to „wyobraźniowa konsola" (*fantasy console*) stworzona przez Lexaloffle Games. Symuluje fikcyjny sprzęt z lat 80., oferując skrajnie ograniczone środowisko:

| Parametr | Wartość |
|----------|---------|
| Rozdzielczość | 128 × 128 pikseli |
| Paleta kolorów | 16 kolorów |
| Pamięć RAM (symulowana) | 32 KB |
| Mapa | 128 × 64 kafle |
| Język | Lua (podzbiór) |
| Dźwięk | 4 kanały, 64 wzorce |
| Sprite'y | 256 (8×8 px każdy) |

### Podstawy skryptowania w Pico-8

Gra w Pico-8 składa się z trzech funkcji wywoływanych przez środowisko:

```lua
-- _init() - wywoływana raz na starcie gry
function _init()
  gracz = {
    x = 64, y = 64,
    vx = 0, vy = 0,
    sp = 1          -- numer sprite'a
  }
  wynik = 0
  poziom = 1
end

-- _update() - logika gry (30 razy/sekundę)
function _update()
  -- Wejście: btn(0)=lewo, btn(1)=prawo, btn(2)=góra, btn(3)=dół
  gracz.vx = 0
  if btn(0) then gracz.vx = -2 end
  if btn(1) then gracz.vx =  2 end
  if btn(2) then gracz.vy = -2 end
  if btn(3) then gracz.vy =  2 end

  gracz.x = mid(0, gracz.x + gracz.vx, 120)
  gracz.y = mid(0, gracz.y + gracz.vy, 120)
end

-- _draw() - renderowanie (30 razy/sekundę)
function _draw()
  cls(0)                          -- czyść ekran (kolor tła = 0)
  spr(gracz.sp, gracz.x, gracz.y) -- rysuj sprite gracza
  print("wynik:"..wynik, 2, 2, 7) -- tekst w kolorze 7 (biały)
end
```

### Detekcja kolizji z mapą

```lua
-- Sprawdź, czy kafle w rogach bounding boxa są solidne
-- Flaga 0 w sprite oznacza kolizję
function solidny(x, y)
  return fget(mget(x \ 8, y \ 8), 0)
end

function kolizja_z_mapa(obj)
  local x, y = obj.x, obj.y
  local w, h = 7, 7  -- rozmiar obiektu - 1
  return solidny(x,   y  ) or solidny(x+w, y  )
      or solidny(x,   y+h) or solidny(x+w, y+h)
end
```

### Eksport Pico-8 na mobile

Pico-8 pozwala eksportować gry jako:
- **HTML5** - działa w każdej przeglądarce mobilnej
- **Natywne** - wymaga licencji lub użycia narzędzi zewnętrznych

Najczęstszą ścieżką do mobile jest eksport HTML5, a następnie opakowanie w PWA lub użycie Capacitor/Cordova:

```bash
# Eksport do HTML5 z poziomu Pico-8
# (w konsoli Pico-8)
export nazwa_gry.html

# Opakowanie w PWA - manifest.json
{
  "name": "Moja gra Pico-8",
  "short_name": "Gra",
  "start_url": "./index.html",
  "display": "fullscreen",
  "orientation": "portrait",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## TIC-80 - otwarty odpowiednik Pico-8

TIC-80 to darmowa, otwartoźródłowa alternatywa dla Pico-8. Oferuje podobne ograniczenia, ale wspiera więcej języków skryptowania:

| Cecha | TIC-80 | Pico-8 |
|-------|--------|--------|
| Cena | Darmowy (open source) | Płatny ($15) |
| Języki | Lua, MoonScript, JavaScript, Fennel, Wren, Squirrel | Lua (podzbiór) |
| Rozdzielczość | 240 × 136 px | 128 × 128 px |
| Paleta | 16 kolorów (konfigurowalna) | 16 kolorów (stała) |
| Eksport | HTML5, Android, Windows, Linux, macOS | HTML5, Windows, Linux, macOS |
| Źródła | GitHub (otwarty) | Zamknięty |

### Przykład w TIC-80 (JavaScript)

```javascript
// TIC-80 - skrypt JavaScript
var x = 96, y = 68;

function TIC() {
  // Wejście
  if (btn(2)) y -= 2;  // góra
  if (btn(3)) y += 2;  // dół
  if (btn(0)) x -= 2;  // lewo
  if (btn(1)) x += 2;  // prawo

  // Granice ekranu
  x = Math.max(0, Math.min(232, x));
  y = Math.max(0, Math.min(128, y));

  // Renderowanie
  cls(0);
  spr(1, x, y, 0, 1, 0, 0, 2, 2);  // sprite 1, transparentny kolor 0
  print("TIC-80 na mobile!", 84, 2, 12);
}
```

---

## LÖVE (Love2D) - framework Lua dla 2D

LÖVE to framework do tworzenia gier 2D w języku Lua. W odróżnieniu od Pico-8/TIC-80 nie narzuca ograniczeń technicznych - jest pełnoprawnym silnikiem 2D z obsługą OpenGL.

### Dlaczego LÖVE na mobile?

- Oficjalne wsparcie dla **Android** (APK) i **iOS** (IPA)
- Lekki runtime (< 10 MB)
- Pełne Lua 5.1 / LuaJIT
- Bogata biblioteka modułów (networking, threading, shaders)

### Struktura projektu LÖVE

```
moja-gra/
├── main.lua        ← punkt wejścia
├── conf.lua        ← konfiguracja okna
├── assets/
│   ├── images/
│   └── sounds/
└── modules/
    ├── player.lua
    └── enemies.lua
```

### Podstawy LÖVE

```lua
-- conf.lua - konfiguracja okna
function love.conf(t)
  t.title = "Moja gra mobilna"
  t.window.width  = 480
  t.window.height = 854   -- typowe proporcje mobile (portrait)
  t.window.resizable = true
  t.modules.joystick = true  -- gamepad / kontroler
end
```

```lua
-- main.lua - logika gry
local gracz = { x = 240, y = 700, sz = 32, speed = 300 }
local pociski = {}
local ostatniStrzal = 0

function love.load()
  -- Załaduj zasoby
  gracz.img = love.graphics.newImage("assets/images/ship.png")
  love.window.setMode(480, 854, { fullscreen = false, resizable = true })
end

function love.update(dt)
  -- Obsługa dotyku (mobilna)
  local touches = love.touch.getTouches()
  for _, id in ipairs(touches) do
    local tx, ty = love.touch.getPosition(id)
    gracz.x = tx - gracz.sz / 2
  end

  -- Strzał - ogranicznik czasowy
  local teraz = love.timer.getTime()
  if teraz - ostatniStrzal > 0.3 then
    table.insert(pociski, { x = gracz.x + gracz.sz/2, y = gracz.y, vy = -500 })
    ostatniStrzal = teraz
  end

  -- Aktualizacja pocisków
  for i = #pociski, 1, -1 do
    pociski[i].y = pociski[i].y + pociski[i].vy * dt
    if pociski[i].y < -10 then
      table.remove(pociski, i)
    end
  end
end

function love.draw()
  love.graphics.setBackgroundColor(0.05, 0.05, 0.1)
  love.graphics.draw(gracz.img, gracz.x, gracz.y, 0, 1, 1)
  love.graphics.setColor(1, 1, 0)
  for _, p in ipairs(pociski) do
    love.graphics.circle("fill", p.x, p.y, 4)
  end
  love.graphics.setColor(1, 1, 1)
end
```

### Budowanie LÖVE na Android

```bash
# Wymagania: Android SDK, Java 17+, love-android (z GitHub)

# 1. Sklonuj love-android
git clone https://github.com/love2d/love-android.git
cd love-android

# 2. Umieść grę w app/src/embed/assets/
cp -r ../moja-gra/* app/src/embed/assets/

# 3. Zbuduj APK
./gradlew assembleRelease

# Wynikowy APK:
# app/build/outputs/apk/embed/release/app-embed-release.apk
```

---

## Defold - silnik gier od King

Defold to darmowy silnik 2D/3D stworzony przez firmę King (twórca Candy Crush). Oferuje wbudowane wsparcie dla iOS i Android bez dodatkowych narzędzi.

### Kluczowe cechy Defold

- **Język**: Lua 5.1
- **Eksport**: Android, iOS, HTML5, Desktop (Windows/macOS/Linux), Nintendo Switch, PlayStation
- **Rozmiar runtime**: < 1 MB skompresowany (rekordowo mały dla gier mobilnych)
- **Narzędzie**: wbudowany edytor (Java/Eclipse), działa bez instalacji SDK/NDK
- **Model**: darmowy, otwartoźródłowy (od 2020)

### Przykład skryptu Defold

```lua
-- player.script - komponent gracza
local SPEED = 300

function init(self)
  self.velocity = vmath.vector3(0, 0, 0)
  msg.post(".", "acquire_input_focus")  -- przejmij wejście
end

function update(self, dt)
  local pos = go.get_position()
  pos = pos + self.velocity * dt
  -- Ogranicz do ekranu
  local w, h = 480, 854
  pos.x = math.max(16, math.min(w - 16, pos.x))
  pos.y = math.max(16, math.min(h - 16, pos.y))
  go.set_position(pos)
  self.velocity = vmath.vector3(0, 0, 0)
end

function on_input(self, action_id, action)
  -- Obsługa dotyku
  if action_id == hash("touch") then
    self.velocity.x = (action.x - go.get_position().x) * 5
    self.velocity.y = (action.y - go.get_position().y) * 5
  end
  -- Akcelerometr
  if action_id == hash("tilt") then
    self.velocity.x = action.x * SPEED
  end
end
```

---

## Pyxel - Python fantasy console

Pyxel to fantasy console napisana w Pythonie, inspirowana Pico-8. Idealna dla osób zaczynających przygodę z tworzeniem gier, szczególnie jeśli już znają Pythona.

| Parametr | Wartość |
|----------|---------|
| Rozdzielczość | do 256 × 256 px |
| Paleta | 16 kolorów |
| Języki | Python 3, (Rust wewnętrznie) |
| Eksport | Web (Pyxel Web), desktop |
| Platforma | Windows, macOS, Linux |

```python
import pyxel

class Gra:
    def __init__(self):
        pyxel.init(128, 128, title="Pyxel Mobile")
        self.x = 64
        self.y = 64
        pyxel.run(self.update, self.draw)

    def update(self):
        # Obsługa klawiatury (desktop) / symulacja mobile
        if pyxel.btn(pyxel.KEY_LEFT):  self.x -= 2
        if pyxel.btn(pyxel.KEY_RIGHT): self.x += 2
        if pyxel.btn(pyxel.KEY_UP):    self.y -= 2
        if pyxel.btn(pyxel.KEY_DOWN):  self.y += 2
        # Ogranicz do ekranu
        self.x = max(0, min(120, self.x))
        self.y = max(0, min(120, self.y))

    def draw(self):
        pyxel.cls(0)
        pyxel.circ(self.x, self.y, 4, 11)
        pyxel.text(2, 2, "Pyxel!", 7)

Gra()
```

### Eksport Pyxel do sieci (mobile-friendly)

```bash
# Eksport do HTML5 (Pyxel Web)
pip install pyxel
pyxel package moja_gra moja_gra.py
pyxel app2html moja_gra.pyxapp

# Wynik: moja_gra.html - gotowy do hostowania
# Działa na mobile w przeglądarce bez instalacji
```

---

## GB Studio - gry w stylu Game Boy

GB Studio to wizualny silnik do tworzenia gier w stylu Game Boy (ROMs). Eksportuje m.in. do HTML5, co umożliwia uruchamianie na mobile.

| Cecha | Wartość |
|-------|---------|
| Ograniczenia | Game Boy Color (160×144 px, 4 kolory na warstwę) |
| Edytor | Wizualny (drag & drop, bez kodowania) |
| Eksport | ROM (.gb), HTML5, Windows/macOS/Linux |
| Język skryptów | Wizualny, opcjonalnie GBVM (assembler) |
| Użytkownicy | Debiutanci, twórcy retro |

---

## Porównanie silników

| Silnik | Język | Mobilny eksport | Ograniczenia | Najlepszy dla |
|--------|-------|----------------|--------------|---------------|
| **Pico-8** | Lua | HTML5 (→ PWA) | Tak (celowe) | Fantasy games, jam |
| **TIC-80** | Lua/JS/inne | HTML5, Android | Tak (celowe) | Open-source lovers |
| **LÖVE** | Lua | Android, iOS natywnie | Nie | 2D indie mobile |
| **Defold** | Lua | Android, iOS natywnie | Nie | Profesjonalne mobile |
| **Pyxel** | Python | HTML5 | Tak (celowe) | Uczniowie Pythona |
| **GB Studio** | Wizualny | HTML5 | Tak (Game Boy) | Retro/edukacja |

---

## Wzorce projektowe w małych silnikach

### Game Loop z fixed timestep

Małe silniki często używają uproszczonego game loop, ale na mobile ważny jest **fixed timestep**, który uniezależnia fizykę od klatek:

```lua
-- Wzorzec fixed timestep (LÖVE)
local FIXED_DT = 1/60   -- 60 aktualizacji/s
local akumulator = 0

function love.update(dt)
  akumulator = akumulator + dt
  while akumulator >= FIXED_DT do
    fizyka_update(FIXED_DT)    -- stały krok fizyki
    akumulator = akumulator - FIXED_DT
  end
  -- Interpolacja stanu do renderowania
  local alpha = akumulator / FIXED_DT
  stan_render = interpoluj(stan_poprzedni, stan_obecny, alpha)
end
```

### Object Pool - recycling obiektów

Na urządzeniach mobilnych alokacja obiektów jest kosztowna. Object Pool wielokrotnie używa tych samych instancji:

```lua
-- Pula pocisków (Pico-8 / LÖVE compatible)
local Pula = {}
Pula.__index = Pula

function Pula.nowa(rozmiar, fabryka)
  local p = setmetatable({}, Pula)
  p.dostepne = {}
  p.aktywne  = {}
  for i = 1, rozmiar do
    table.insert(p.dostepne, fabryka())
  end
  return p
end

function Pula:pobierz(x, y, vx, vy)
  local obj = table.remove(self.dostepne)
  if not obj then return nil end  -- pula wyczerpana
  obj.x, obj.y   = x, y
  obj.vx, obj.vy = vx, vy
  obj.aktywny    = true
  table.insert(self.aktywne, obj)
  return obj
end

function Pula:zwroc(obj)
  obj.aktywny = false
  for i, o in ipairs(self.aktywne) do
    if o == obj then
      table.remove(self.aktywne, i)
      table.insert(self.dostepne, obj)
      return
    end
  end
end
```

### State Machine - zarządzanie stanami gry

```lua
-- Maszyna stanów dla scen gry (Pico-8)
local stany = {}
local stan_aktualny = nil

function dodaj_stan(nazwa, init_fn, update_fn, draw_fn)
  stany[nazwa] = { init = init_fn, update = update_fn, draw = draw_fn }
end

function zmien_stan(nazwa)
  if stany[nazwa] then
    stan_aktualny = stany[nazwa]
    if stan_aktualny.init then stan_aktualny.init() end
  end
end

-- Definicja stanów
dodaj_stan("menu",
  function() -- init
    wybrany = 1
  end,
  function() -- update
    if btnp(2) then wybrany = max(1, wybrany - 1) end
    if btnp(3) then wybrany = min(2, wybrany + 1) end
    if btnp(4) then zmien_stan("gra") end  -- btn(4) = Z/O
  end,
  function() -- draw
    cls(0)
    print("gra mobilna", 40, 40, 7)
    print(wybrany == 1 and ">start" or " start", 40, 60, 11)
    print(wybrany == 2 and ">opcje" or " opcje", 40, 70, 11)
  end
)

-- Pico-8 callback
function _init() zmien_stan("menu") end
function _update() if stan_aktualny then stan_aktualny.update() end end
function _draw()   if stan_aktualny then stan_aktualny.draw()   end end
```

---

## Optymalizacja na urządzeniach mobilnych

### Ograniczenia i wskazówki

| Problem | Rozwiązanie w małym silniku |
|---------|----------------------------|
| Mały ekran | Skaluj UI relatywnie do `love.graphics.getDimensions()` |
| Obsługa dotyku | Użyj `love.touch` / TIC-80 `btn()` na dotykowe przyciski |
| Bateria | Ogranicz FPS do 30 (wystarczy dla pixel art) |
| Pamięć | Object Pool, unikaj dynamicznych alokacji w `update()` |
| Dźwięk | Krótkie samples PCM w silniku, brak streamingu |

### Responsywne sterowanie dotykowe (LÖVE)

```lua
-- Wirtualny gamepad dla mobile
local dpad = {
  lewo  = { x=30,  y=780, r=40, wcisniety=false },
  prawo = { x=110, y=780, r=40, wcisniety=false },
  gora  = { x=70,  y=740, r=40, wcisniety=false },
  dol   = { x=70,  y=820, r=40, wcisniety=false },
  a     = { x=430, y=780, r=40, wcisniety=false },
}

function love.touchpressed(id, x, y, dx, dy, pressure)
  for nazwa, btn in pairs(dpad) do
    local dist = math.sqrt((x-btn.x)^2 + (y-btn.y)^2)
    if dist <= btn.r then btn.wcisniety = true end
  end
end

function love.touchreleased(id, x, y, dx, dy, pressure)
  for _, btn in pairs(dpad) do
    btn.wcisniety = false
  end
end

function rysuj_dpad()
  for nazwa, btn in pairs(dpad) do
    love.graphics.setColor(1, 1, 1, btn.wcisniety and 0.8 or 0.3)
    love.graphics.circle("fill", btn.x, btn.y, btn.r)
  end
  love.graphics.setColor(1, 1, 1)
end
```

---

## Zasoby i społeczność

- **Lexaloffle BBS** - oficjalne forum Pico-8, tysiące gier do pobrania i nauki
- **itch.io** - największa platforma dystrybucji gier indie, w tym małych silników
- **Ludum Dare** - game jam co dwa miesiące, wiele gier tworzonych w Pico-8/LÖVE
- **LÖVE forum** - love2d.org/forums - aktywna społeczność, gotowe biblioteki
- **Defold forum** - forum.defold.com - wsparcie oficjalnego zespołu King
- **Game Off (GitHub)** - roczny game jam promujący open source
