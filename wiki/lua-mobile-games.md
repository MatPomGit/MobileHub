# Lua w grach mobilnych — silniki i frameworki

Lua to lekki, skryptowy język programowania stworzony w 1993 r. na Pontifícia Universidade Católica do Rio de Janeiro. Zaprojektowany jako język osadzalny (*embeddable*), idealnie nadaje się do skryptowania logiki gry — interpreter zajmuje kilkadziesiąt kilobajtów, wykonanie jest szybkie, a integracja z kodem C/C++ jest natywna. Dziś Lua jest jednym z najpopularniejszych języków w branży gamedev, stosowanym w grach takich jak **World of Warcraft**, **Roblox**, **Angry Birds** czy **LÖVE**.

---

## Dlaczego Lua w grach mobilnych?

| Cecha | Opis |
|-------|------|
| **Rozmiar** | Interpreter < 300 KB, idealny dla urządzeń mobilnych |
| **Szybkość** | LuaJIT osiąga wydajność zbliżoną do C |
| **Prostota** | Mała liczba słów kluczowych, łatwa do nauki |
| **Integracja C/C++** | Natywne API C do osadzania Lua w silniku |
| **Dynamiczne ładowanie** | Kod gry można aktualizować bez rekompilacji (hot reload) |
| **Skryptowanie logiki** | Oddzielenie silnika (C++) od logiki gry (Lua) |

---

## Podstawy języka Lua

### Typy danych i zmienne

```lua
-- Lua jest dynamicznie typowanym językiem
-- Typy: nil, boolean, number, string, function, table, userdata, thread

local imie = "Gracz"          -- string
local punkty = 0              -- number (IEEE 754 double)
local zyje = true             -- boolean
local nic = nil               -- nil

-- Komentarz jednolinijkowy
--[[
  Komentarz
  wielolinijkowy
]]
```

### Tabele — podstawowa struktura danych

W Lua nie ma tablic, klas ani słowników w tradycyjnym sensie — wszystko to realizują **tabele**:

```lua
-- Tablica (indeksy od 1!)
local pozycje = {10, 20, 30, 40}
print(pozycje[1])  -- 10

-- Słownik (hash map)
local gracz = {
    imie = "Ala",
    hp = 100,
    mana = 50,
    poziom = 1
}
print(gracz.imie)     -- Ala
print(gracz["hp"])    -- 100

-- Zagnieżdżone tabele
local mapa = {
    wrogow = { {x=10, y=5}, {x=20, y=15} },
    skrzynek = 3
}
```

### Funkcje

```lua
-- Definicja funkcji
local function dodaj(a, b)
    return a + b
end

-- Funkcja anonimowa (closure)
local pomnoz = function(a, b)
    return a * b
end

-- Wiele wartości zwracanych
local function minMax(tab)
    local min, max = tab[1], tab[1]
    for _, v in ipairs(tab) do
        if v < min then min = v end
        if v > max then max = v end
    end
    return min, max
end

local mi, ma = minMax({3, 1, 4, 1, 5, 9, 2, 6})
print(mi, ma)  -- 1  9
```

### Pętle i kontrola przepływu

```lua
-- for numeryczny
for i = 1, 10 do
    print(i)
end

-- for generyczny (ipairs = tablica, pairs = słownik)
local owoce = {"jabłko", "gruszka", "śliwka"}
for i, owoc in ipairs(owoce) do
    print(i, owoc)
end

-- while
local licznik = 0
while licznik < 5 do
    licznik = licznik + 1
end

-- repeat...until
repeat
    licznik = licznik - 1
until licznik == 0

-- if / elseif / else
if gracz.hp <= 0 then
    print("Koniec gry")
elseif gracz.hp < 20 then
    print("Niskie HP!")
else
    print("HP: " .. gracz.hp)
end
```

### Programowanie obiektowe przez metatables

Lua nie ma wbudowanych klas, ale mechanizm **metatabel** pozwala emulować OOP:

```lua
-- "Klasa" Gracz
local Gracz = {}
Gracz.__index = Gracz

function Gracz.new(imie, hp)
    local self = setmetatable({}, Gracz)
    self.imie = imie
    self.hp = hp
    self.maxHp = hp
    return self
end

function Gracz:zadajObrazenia(ilosc)
    self.hp = math.max(0, self.hp - ilosc)
    if self.hp == 0 then
        print(self.imie .. " został pokonany!")
    end
end

function Gracz:leczenie(ilosc)
    self.hp = math.min(self.maxHp, self.hp + ilosc)
end

function Gracz:status()
    return string.format("%s: %d/%d HP", self.imie, self.hp, self.maxHp)
end

-- Użycie
local bohater = Gracz.new("Ala", 100)
bohater:zadajObrazenia(30)
print(bohater:status())    -- Ala: 70/100 HP
bohater:leczenie(10)
print(bohater:status())    -- Ala: 80/100 HP
```

---

## LÖVE 2D — najpopularniejszy silnik Lua na mobile

[LÖVE](https://love2d.org/) (Love2D) to darmowy, otwartoźródłowy framework 2D napisany w C++, skryptowany w Lua. Obsługuje Android, iOS, Windows, macOS i Linux.

### Struktura projektu LÖVE

```
mygame/
├── main.lua       ← główny plik gry
├── conf.lua       ← konfiguracja (opcjonalnie)
├── assets/
│   ├── images/
│   ├── sounds/
│   └── fonts/
└── src/
    ├── player.lua
    ├── enemy.lua
    └── utils.lua
```

### Trzy główne callbacki

```lua
-- main.lua

-- Inicjalizacja (wywołana raz)
function love.load()
    -- Ładowanie zasobów, inicjalizacja zmiennych
    gracz = {
        x = 100, y = 300,
        vx = 0, vy = 0,
        szerokosc = 32, wysokosc = 48,
        predkosc = 200
    }
    tlo = love.graphics.newImage("assets/images/tlo.png")
    skok = love.audio.newSource("assets/sounds/skok.wav", "static")
end

-- Aktualizacja logiki (wywołana co klatkę, dt = delta time w sekundach)
function love.update(dt)
    -- Ruch gracza
    if love.keyboard.isDown("left") or love.keyboard.isDown("a") then
        gracz.vx = -gracz.predkosc
    elseif love.keyboard.isDown("right") or love.keyboard.isDown("d") then
        gracz.vx = gracz.predkosc
    else
        gracz.vx = 0
    end

    gracz.x = gracz.x + gracz.vx * dt
    gracz.y = gracz.y + gracz.vy * dt

    -- Grawitacja
    gracz.vy = gracz.vy + 600 * dt
    if gracz.y > 400 then
        gracz.y = 400
        gracz.vy = 0
    end
end

-- Renderowanie (wywołana co klatkę)
function love.draw()
    love.graphics.draw(tlo, 0, 0)

    -- Rysowanie gracza (prostokąt dla uproszczenia)
    love.graphics.setColor(0.2, 0.6, 1.0)
    love.graphics.rectangle("fill", gracz.x, gracz.y, gracz.szerokosc, gracz.wysokosc)

    -- HUD
    love.graphics.setColor(1, 1, 1)
    love.graphics.print("Pozycja: " .. math.floor(gracz.x) .. ", " .. math.floor(gracz.y), 10, 10)
end

-- Obsługa klawiszy
function love.keypressed(key)
    if key == "space" and gracz.y >= 400 then
        gracz.vy = -400  -- skok
        skok:play()
    end
    if key == "escape" then
        love.event.quit()
    end
end
```

### Obsługa dotyku (Android/iOS)

```lua
-- Dotyk na ekranie mobilnym
function love.touchpressed(id, x, y, dx, dy, pressure)
    -- Skok po dotknięciu prawej połowy ekranu
    if x > love.graphics.getWidth() / 2 then
        if gracz.y >= 400 then
            gracz.vy = -400
        end
    else
        -- Lewa połowa: ruch w lewo
        gracz.kierunek = "lewo"
    end
end

function love.touchreleased(id, x, y, dx, dy, pressure)
    gracz.kierunek = nil
end

-- Wirtualny d-pad (przykład)
local function rysujDpad()
    local alpha = 0.4
    love.graphics.setColor(1, 1, 1, alpha)
    -- Lewy przycisk
    love.graphics.circle("fill", 80, love.graphics.getHeight() - 80, 40)
    -- Prawy przycisk
    love.graphics.circle("fill", 200, love.graphics.getHeight() - 80, 40)
    -- Przycisk skoku
    love.graphics.circle("fill", love.graphics.getWidth() - 80, love.graphics.getHeight() - 80, 50)
    love.graphics.setColor(1, 1, 1, 1)
end
```

### Konfiguracja dla Androida — conf.lua

```lua
function love.conf(t)
    t.title = "Moja Gra"
    t.version = "11.4"
    t.window.width = 0    -- 0 = pełny ekran
    t.window.height = 0
    t.window.fullscreen = true
    t.window.resizable = false
    t.window.vsync = 1

    -- Moduły (wyłącz nieużywane, by zmniejszyć APK)
    t.modules.joystick = false
    t.modules.physics = true
    t.modules.video = false
end
```

### Budowanie APK z LÖVE (Android)

```bash
# 1. Spakuj projekt do .love
zip -9 -r mygame.love main.lua conf.lua assets/ src/

# 2. Pobierz LÖVE Android template (z love2d.org/releases)
# 3. Osadź .love w APK:
cat love-11.4-android.apk mygame.love > mygame-unsigned.apk

# 4. Podpisz i wyrównaj (align)
zipalign -v 4 mygame-unsigned.apk mygame-aligned.apk
apksigner sign --ks mykeystore.jks mygame-aligned.apk
```

---

## Solar2D (Corona SDK) — Lua dla mobile

[Solar2D](https://solar2d.com/) (dawniej Corona SDK) to silnik 2D skupiony wyłącznie na mobile (Android/iOS). Oferuje szeroki ekosystem pluginów i bardzo szybki workflow.

### Przykład: scena z fizyką Box2D

```lua
-- main.lua — Solar2D

local physics = require("physics")
physics.start()
physics.setGravity(0, 9.8)

-- Tło
local tlo = display.newImageRect("tlo.png", display.contentWidth, display.contentHeight)
tlo.x = display.contentCenterX
tlo.y = display.contentCenterY

-- Podłoże (statyczne)
local podloze = display.newRect(display.contentCenterX, display.contentHeight - 20,
                                display.contentWidth, 40)
podloze:setFillColor(0.3, 0.8, 0.3)
physics.addBody(podloze, "static", {friction=0.5})

-- Gracz (dynamiczny)
local gracz = display.newImageRect("gracz.png", 40, 60)
gracz.x = display.contentCenterX
gracz.y = 100
physics.addBody(gracz, "dynamic", {density=1.0, friction=0.3, bounce=0.1})

-- Obsługa dotyku — skok
local function onTap(event)
    gracz:setLinearVelocity(0, -400)
    return true
end
Runtime:addEventListener("tap", onTap)

-- Kolekcja monet
local function dodajMonete(x, y)
    local moneta = display.newCircle(x, y, 15)
    moneta:setFillColor(1, 0.85, 0)
    physics.addBody(moneta, "static", {isSensor=true})

    moneta.collision = function(self, event)
        if event.phase == "began" and event.other == gracz then
            punkty = (punkty or 0) + 10
            display.remove(self)
        end
    end
    moneta:addEventListener("collision")
end

dodajMonete(150, 300)
dodajMonete(280, 200)
dodajMonete(420, 250)
```

### System scen (Composer)

```lua
-- scene_menu.lua
local composer = require("composer")
local scene = composer.newScene()

function scene:create(event)
    local group = self.view

    local tytul = display.newText({
        parent = group,
        text = "MOJA GRA",
        x = display.contentCenterX,
        y = 150,
        fontSize = 48,
        font = native.systemFontBold
    })
    tytul:setFillColor(1, 0.8, 0)

    local btnStart = display.newRect(group, display.contentCenterX, 300, 200, 60)
    btnStart:setFillColor(0.2, 0.6, 1)

    local txtStart = display.newText({
        parent = group, text = "GRAJ",
        x = display.contentCenterX, y = 300,
        fontSize = 28
    })

    btnStart:addEventListener("tap", function()
        composer.gotoScene("scene_game", {effect="slideLeft", time=400})
    end)
end

scene:addEventListener("create", scene)
return scene
```

---

## Defold — silnik od King (Candy Crush)

[Defold](https://defold.com/) to darmowy silnik 2D/3D, całkowicie skryptowany w Lua. Stworzony przez firmę King (twórcy Candy Crush Saga), dziś zarządzany przez Defold Foundation.

### Architektura Defold

```
Collection (scena)
├── Game Object (obiekt gry)
│   ├── Sprite Component   (grafika)
│   ├── Script Component   (skrypt Lua)
│   ├── Collision Object   (fizyka)
│   └── Sound Component    (dźwięk)
└── GUI (interfejs)
    ├── Box Node
    ├── Text Node
    └── Script Component
```

### Skrypt gracza w Defold

```lua
-- player.script

-- Inicjalizacja obiektu
function init(self)
    self.speed = 200
    self.jumping = false
    self.velocity = vmath.vector3(0, 0, 0)

    -- Włącz odbiór inputu
    msg.post(".", "acquire_input_focus")
end

-- Aktualizacja co klatkę
function update(self, dt)
    -- Grawitacja
    self.velocity.y = self.velocity.y - 800 * dt

    -- Ogranicz prędkość spadania
    self.velocity.y = math.max(self.velocity.y, -600)

    -- Przesuń obiekt
    local pos = go.get_position()
    pos = pos + self.velocity * dt
    go.set_position(pos)

    -- Sprawdź podłoże
    if pos.y <= 100 then
        pos.y = 100
        self.velocity.y = 0
        self.jumping = false
        go.set_position(pos)
    end
end

-- Obsługa inputu
function on_input(self, action_id, action)
    if action_id == hash("left") and action.value > 0 then
        self.velocity.x = -self.speed
    elseif action_id == hash("right") and action.value > 0 then
        self.velocity.x = self.speed
    else
        self.velocity.x = 0
    end

    if action_id == hash("jump") and action.pressed and not self.jumping then
        self.velocity.y = 500
        self.jumping = true
        msg.post("/sound#jump", "play_sound")
    end
end

-- Odbiór wiadomości (komunikacja między obiektami)
function on_message(self, message_id, message, sender)
    if message_id == hash("collected_coin") then
        msg.post("/gui#hud", "update_score", {delta = 10})
    end
end
```

### Kolizje w Defold

```lua
-- Obsługa kolizji
function on_message(self, message_id, message, sender)
    if message_id == hash("collision_response") then
        if message.group == hash("enemy") then
            -- Gracz trafiony przez wroga
            msg.post("/game_manager", "player_hit")
        elseif message.group == hash("coin") then
            -- Zebranie monety
            go.delete(message.other_id)
            msg.post("/gui#hud", "update_score", {delta = 10})
        elseif message.group == hash("ground") then
            -- Lądowanie
            self.jumping = false
            self.velocity.y = 0
        end
    end
end
```

---

## Gideros Mobile — lekki silnik Lua

[Gideros](http://giderosmobile.com/) to lekki silnik 2D z podejściem zdarzeniowym (event-driven), zbliżonym do AS3/Flash. Bardzo szybki prototyping, dobra integracja z OpenGL ES.

```lua
-- Gideros — main.lua

-- Sprite z teksturą
local texture = Texture.new("gracz.png")
local gracz = Bitmap.new(texture)
gracz:setPosition(100, 200)
stage:addChild(gracz)

-- Animacja klatkowa (sprite sheet)
local sheet = TextureRegion.new(Texture.new("sprites.png"))
local frames = {}
for i = 0, 7 do
    frames[i+1] = TextureRegion.new(Texture.new("sprites.png"), i*64, 0, 64, 64)
end
local animacja = MovieClip.new({
    {1, 4, frames},    -- klatki 1-4, czas 4
})
animacja:setLoop(true)
stage:addChild(animacja)

-- Obsługa dotyku
stage:addEventListener(Event.TOUCHES_BEGIN, function(e)
    local touch = e.allTouches[1]
    print("Dotknięto:", touch.x, touch.y)
    gracz:setPosition(touch.x - 32, touch.y - 32)
end)

-- Timer
Timer.delayedCall(3000, function()
    print("3 sekundy minęły!")
end)
```

---

## Roblox — Lua w największej platformie gier mobilnych

Roblox używa zmodyfikowanej wersji Lua zwanej **Luau** (z opcjonalną statyczną typizacją). To jedna z najważniejszych platform do tworzenia gier mobilnych przez społeczność.

### Luau — statyczna typizacja

```luau
-- Luau (Roblox) z typami
type Player = {
    Name: string,
    Points: number,
    Level: number,
}

local function calculateScore(player: Player, bonus: number): number
    return player.Points * player.Level + bonus
end

-- RemoteEvent — komunikacja serwer-klient
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CoinEvent = ReplicatedStorage:WaitForChild("CoinCollected")

-- Skrypt serwera (ServerScript)
CoinEvent.OnServerEvent:Connect(function(player, coinValue)
    local leaderstats = player:FindFirstChild("leaderstats")
    if leaderstats then
        leaderstats.Coins.Value += coinValue
    end
end)

-- Skrypt klienta (LocalScript)
local function onCoinTouch(coin)
    CoinEvent:FireServer(coin:GetAttribute("Value"))
    coin:Destroy()
end
```

---

## LuaJIT — wydajność Lua na mobilnych CPU

[LuaJIT](https://luajit.org/) to JIT-kompilator Lua oferujący kilkukrotnie wyższą wydajność niż standardowy interpreter. Wiele silników gier (Corona/Solar2D, niektóre wersje Defold) używa LuaJIT.

```lua
-- Benchmark: obliczenia numeryczne
local ffi = require("ffi")  -- LuaJIT FFI

-- Bezpośrednie wywołanie funkcji C przez FFI
ffi.cdef[[
    double sin(double x);
    double cos(double x);
    double sqrt(double x);
]]

local function updateParticles(particles, dt)
    for i = 1, #particles do
        local p = particles[i]
        -- LuaJIT kompiluje tę pętlę do natywnego kodu maszynowego
        p.x = p.x + p.vx * dt
        p.y = p.y + p.vy * dt
        p.vy = p.vy + 9.8 * dt
        p.life = p.life - dt
    end
end
```

---

## Porównanie silników Lua dla mobile

| Silnik | Platforma | Język | Główna cecha | Licencja |
|--------|-----------|-------|--------------|---------|
| **LÖVE** | Android, iOS, Desktop | Lua 5.4 | Framework 2D, open source | MIT |
| **Solar2D** | Android, iOS | Lua 5.1 + LuaJIT | Duży ekosystem pluginów | MIT |
| **Defold** | Android, iOS, HTML5, Desktop | Lua 5.1 | Komponent-based, od King | Bezpłatny |
| **Gideros** | Android, iOS, Desktop | Lua 5.1 | Event-driven, szybki prototyping | MIT |
| **Roblox/Luau** | Mobile, PC | Luau | Ogromna społeczność | Platforma |

---

## Wzorce projektowe w grach Lua

### Entity-Component (bez zewnętrznych bibliotek)

```lua
-- Prosty system ECS w Lua

local World = {}
World.__index = World

function World.new()
    return setmetatable({
        entities = {},
        systems = {},
        nextId = 1
    }, World)
end

function World:newEntity(components)
    local id = self.nextId
    self.nextId = id + 1
    self.entities[id] = components or {}
    self.entities[id]._id = id
    return id
end

function World:addSystem(system)
    table.insert(self.systems, system)
end

function World:update(dt)
    for _, system in ipairs(self.systems) do
        system(self.entities, dt)
    end
end

-- Systemy
local function movementSystem(entities, dt)
    for _, e in pairs(entities) do
        if e.position and e.velocity then
            e.position.x = e.position.x + e.velocity.x * dt
            e.position.y = e.position.y + e.velocity.y * dt
        end
    end
end

local function gravitySystem(entities, dt)
    for _, e in pairs(entities) do
        if e.velocity and e.gravity then
            e.velocity.y = e.velocity.y + 9.8 * dt
        end
    end
end

-- Użycie
local world = World.new()
world:addSystem(gravitySystem)
world:addSystem(movementSystem)

local graczId = world:newEntity({
    position = {x=100, y=50},
    velocity = {x=0, y=0},
    gravity = true
})
```

### State Machine — maszyna stanów postaci

```lua
local StateMachine = {}
StateMachine.__index = StateMachine

function StateMachine.new(owner)
    return setmetatable({
        owner = owner,
        current = nil,
        states = {}
    }, StateMachine)
end

function StateMachine:addState(name, state)
    self.states[name] = state
end

function StateMachine:change(name, ...)
    if self.current and self.current.exit then
        self.current:exit(self.owner)
    end
    self.current = self.states[name]
    if self.current and self.current.enter then
        self.current:enter(self.owner, ...)
    end
end

function StateMachine:update(dt)
    if self.current and self.current.update then
        self.current:update(self.owner, dt)
    end
end

-- Stany gracza
local IdleState = {
    enter = function(self, player)
        player.animacja = "idle"
    end,
    update = function(self, player, dt)
        if player.vx ~= 0 then
            player.fsm:change("run")
        end
        if player.skacze then
            player.fsm:change("jump")
        end
    end
}

local RunState = {
    enter = function(self, player)
        player.animacja = "run"
    end,
    update = function(self, player, dt)
        if player.vx == 0 then
            player.fsm:change("idle")
        end
    end
}
```

---

## Dobre praktyki w Lua (mobile)

### Zarządzanie pamięcią

```lua
-- Używaj local dla zmiennych (szybsze wyszukiwanie)
local math_floor = math.floor   -- keszuj globale w lokalnych
local table_insert = table.insert

-- Unikaj tworzenia tabel w pętli gry (garbage collection)
-- ŹLE:
function love.update(dt)
    local wektor = {x=0, y=1}  -- nowa tabela co klatkę!
    gracz.x = gracz.x + wektor.x * predkosc * dt
end

-- DOBRZE:
local tempWektor = {x=0, y=0}  -- zaalokowane raz
function love.update(dt)
    tempWektor.x = 0
    tempWektor.y = 1
    gracz.x = gracz.x + tempWektor.x * predkosc * dt
end

-- Pool obiektów dla pocisków / cząsteczek
local PociskPool = {pula = {}, aktywne = {}}

function PociskPool:pobierz()
    return table.remove(self.pula) or {x=0, y=0, vx=0, vy=0, aktywny=false}
end

function PociskPool:zwroc(pocisk)
    pocisk.aktywny = false
    table.insert(self.pula, pocisk)
end
```

### Profilowanie

```lua
-- Prosty pomiar czasu w LÖVE
local function profiluj(nazwa, fn)
    local start = love.timer.getTime()
    fn()
    local czas = love.timer.getTime() - start
    print(string.format("[%s] %.3f ms", nazwa, czas * 1000))
end

profiluj("aktualizacja wrogów", function()
    for _, wrog in ipairs(wrogowie) do
        wrog:update(dt)
    end
end)
```

---

## Podsumowanie

Lua jest doskonałym wyborem do tworzenia gier mobilnych dzięki małemu śladowi pamięci, szybkości wykonania (LuaJIT) i łatwości integracji z silnikami C/C++. Główne silniki to:

- **LÖVE** — idealny do nauki i prototypów 2D, open source,
- **Solar2D** — dojrzały ekosystem, bezpłatny,
- **Defold** — profesjonalne narzędzie od King, doskonałe do 2D mobile,
- **Gideros** — szybki prototyping z podejściem zdarzeniowym,
- **Roblox/Luau** — platforma z największą społecznością.

Niezależnie od silnika, kluczowe w Lua dla mobile to: zarządzanie garbage collectorem (object pools), keszowanie globalnych funkcji w lokalnych zmiennych, oddzielenie logiki od renderowania i testowanie na prawdziwym urządzeniu, gdzie CPU i GPU mają inne charakterystyki niż desktop.
