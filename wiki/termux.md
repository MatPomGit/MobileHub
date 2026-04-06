# Termux — terminal emulator with packages

## 1. Czym jest Termux?

**Termux** to emulator terminala dla Androida połączony z menedżerem pakietów, który pozwala uruchamiać narzędzia linuksowe bez roota (w standardowych scenariuszach). W praktyce daje środowisko zbliżone do lekkiej dystrybucji Linux bezpośrednio na telefonie lub tablecie.

Najważniejsze cechy:

- shell i typowe narzędzia CLI (np. `bash`, `zsh`, `git`, `ssh`, `python`, `nodejs`),
- instalacja pakietów przez `pkg` / `apt`,
- możliwość budowania skryptowych workflow automatyzacji,
- integracja z pamięcią urządzenia i (opcjonalnie) zewnętrznymi edytorami,
- dostęp do API Androida poprzez pakiet **Termux:API** (powiadomienia, aparat, wibracje, kontakty),
- serwer SSH umożliwiający zdalny dostęp do telefonu z komputera stacjonarnego.

---

## 2. Jak działa Termux od strony technicznej?

Termux tworzy przestrzeń użytkownika w katalogu aplikacji Android i udostępnia:

1. binaria skompilowane dla architektur ARM/ARM64/x86,
2. bibliotekę systemową kompatybilną z Android/Bionic,
3. własne repozytoria pakietów,
4. warstwę dostępu do API Androida (przez dodatkowe moduły i integracje).

Katalog domowy Termux to `/data/data/com.termux/files/home` (`~`), a prefiks instalacyjny to `/data/data/com.termux/files/usr`. Standardowe ścieżki systemu Linux, takie jak `/usr/bin`, nie istnieją — zamiast nich Termux używa własnych odpowiedników w prefiksie.

W odróżnieniu od klasycznego Linuxa desktopowego:

- nie mamy pełnej kontroli nad jądrem,
- obowiązuje sandbox aplikacji,
- dostęp do części zasobów jest limitowany przez politykę Androida i uprawnienia,
- procesy w tle mogą być ubijane przez system zarządzania energią (szczególnie po wygaszeniu ekranu).

---

## 3. Instalacja i pierwsza konfiguracja

### 3.1 Instalacja

Najczęściej rekomendowane jest pobranie Termux z repozytorium **F-Droid** (aktualniejsze buildy niż w wielu mirrorach sklepów). Wersja z Google Play jest przestarzała i nie powinna być używana. Po instalacji warto od razu wykonać:

```bash
pkg update && pkg upgrade -y
```

### 3.2 Podstawowe pakiety startowe

```bash
pkg install -y git curl wget vim openssh python nodejs
```

Opcjonalnie, do bardziej zaawansowanej pracy w terminalu:

```bash
pkg install -y tmux zsh neovim jq ripgrep
```

### 3.3 Dostęp do pamięci współdzielonej Androida

```bash
termux-setup-storage
```

Polecenie tworzy symboliczne dowiązania w katalogu `~/storage/` do typowych katalogów użytkownika:

| Skrót | Katalog na urządzeniu |
|---|---|
| `~/storage/shared` | Katalog główny karty/pamięci wewnętrznej |
| `~/storage/dcim` | Zdjęcia i nagrania |
| `~/storage/downloads` | Pobrane pliki |
| `~/storage/music` | Muzyka |

Dzięki temu można wygodnie czytać i zapisywać pliki dostępne z innych aplikacji.

---

## 4. Menedżer pakietów: `pkg` i `apt`

W Termux najczęściej używa się `pkg`, który jest wygodnym wrapperem nad `apt`.

Przykłady:

- wyszukanie pakietu: `pkg search nazwa`,
- instalacja: `pkg install nazwa`,
- usunięcie: `pkg uninstall nazwa`,
- aktualizacja list i pakietów: `pkg update && pkg upgrade`,
- lista zainstalowanych pakietów: `pkg list-installed`.

Dostępne repozytoria można sprawdzić i zmienić poleceniem:

```bash
termux-change-repo
```

Dzięki temu Termux jest dobrym środowiskiem do nauki administracji CLI i pracy z zależnościami. Dla pakietów Pythona używa się standardowo `pip`, a dla Node.js — `npm` lub `yarn`.

---

## 5. Typowe use-case'y mobilne

### 5.1 Programowanie i prototypowanie

- szybkie uruchamianie skryptów Python/Node,
- testowanie API przez `curl` lub `httpie`,
- lokalne narzędzia developerskie bez komputera,
- uruchamianie prostych serwerów HTTP do testowania frontendu.

### 5.2 Automatyzacja

- backup i synchronizacja plików (rclone, rsync),
- harmonogramy zadań (cron, termux-job-scheduler),
- przetwarzanie tekstu i logów (`awk`, `sed`, `grep`, `jq`),
- automatyczne powiadomienia i raporty przez Termux:API.

### 5.3 DevOps „on the go"

- łączenie po SSH z serwerami,
- proste operacje Git — `pull`, `push`, `commit`,
- diagnostyka usług i endpointów (`ping`, `nmap`, `curl`),
- zdalny dostęp do telefonu jako serwera SSH z komputera.

---

## 6. Termux + Git + Python — mini workflow

Przykładowy scenariusz laboratoryjny:

```bash
git clone <repo-url>
cd <repo>
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

To pozwala studentom wykonać pełny cykl: pobranie projektu, instalacja zależności i uruchomienie aplikacji bez użycia desktopa.

### 6.1 Wirtualne środowiska Pythona w Termux

Praca z wirtualnym środowiskiem (`venv`) jest szczególnie ważna, gdy na jednym urządzeniu rozwijamy kilka projektów o różnych zależnościach:

```bash
# Stworzenie środowiska
python -m venv ~/projekty/moj-projekt/.venv

# Aktywacja
source ~/projekty/moj-projekt/.venv/bin/activate

# Instalacja zależności
pip install flask requests pandas

# Wyeksportowanie zależności
pip freeze > requirements.txt

# Dezaktywacja
deactivate
```

### 6.2 Prosty serwer HTTP w Node.js

Termux z Node.js pozwala uruchomić lokalny serwer webowy dostępny w sieci Wi-Fi:

```bash
pkg install nodejs

mkdir ~/serwer && cd ~/serwer
npm init -y
npm install express
```

Plik `app.js`:

```javascript
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Witaj z Termux na Androidzie!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serwer dziala na http://0.0.0.0:${PORT}`);
});
```

```bash
node app.js
```

Serwer jest teraz dostępny dla innych urządzeń w tej samej sieci Wi-Fi pod adresem IP telefonu na porcie 3000.

---

## 7. Konfiguracja serwera SSH

Jedną z najpotężniejszych funkcji Termux jest możliwość uruchomienia serwera SSH, dzięki czemu można łączyć się z telefonem z komputera jak z zdalnym serwerem.

### 7.1 Instalacja i uruchomienie sshd

```bash
pkg install openssh

# Uruchomienie serwera SSH (domyślny port 8022)
sshd
```

Termux używa niestandardowego portu **8022**, ponieważ standardowy port 22 wymaga uprawnień roota.

### 7.2 Konfiguracja autoryzacji kluczem

Na komputerze stacjonarnym (Windows/macOS/Linux):

```bash
# Generowanie pary kluczy (jesli jeszcze nie masz)
ssh-keygen -t ed25519 -C "moj-komputer"

# Skopiowanie klucza publicznego do Termux
ssh-copy-id -p 8022 -i ~/.ssh/id_ed25519.pub <IP_TELEFONU>
```

Alternatywnie — bezpośrednio w Termux:

```bash
# Utworz katalog .ssh i plik authorized_keys
mkdir -p ~/.ssh && chmod 700 ~/.ssh
# Wklej zawartosc swojego klucza publicznego
echo "ssh-ed25519 AAAA... moj-komputer" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 7.3 Łączenie z telefonu z komputera

```bash
# Polaczenie (zastap adresem IP telefonu)
ssh -p 8022 <IP_TELEFONU>
```

Adres IP telefonu można sprawdzić poleceniem:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# lub
ip addr show wlan0
```

### 7.4 Wygodna konfiguracja po stronie klienta

Dodaj wpis do `~/.ssh/config` na komputerze:

```
Host moj-telefon
    HostName 192.168.1.100
    Port 8022
    User u0_a123
    IdentityFile ~/.ssh/id_ed25519
```

Następnie wystarczy: `ssh moj-telefon`.

> **Uwaga bezpieczeństwa:** Serwer SSH w Termux uruchamiaj tylko w zaufanych sieciach. Wyłącz go po zakończeniu pracy: `pkill sshd`.

---

## 8. Termux:API — dostęp do funkcji Androida

Pakiet **Termux:API** umożliwia interakcję z systemem Android bezpośrednio z linii poleceń: wysyłanie powiadomień, obsługę aparatu, wibracji, czytanie kontaktów i wiele więcej.

### 8.1 Instalacja

1. Zainstaluj aplikację **Termux:API** z F-Droid.
2. W Termux zainstaluj pakiet CLI:

```bash
pkg install termux-api
```

### 8.2 Powiadomienia systemowe

```bash
# Wyslij powiadomienie
termux-notification --title "Zadanie zakonczone" --content "Skrypt backup.sh wykonal sie poprawnie."

# Powiadomienie z ikoną i dzwiekiem
termux-notification \
  --title "Alert" \
  --content "Wykryto zmiane pliku!" \
  --sound \
  --vibrate 500,200,500
```

### 8.3 Wibracje

```bash
# Wibracja 1 sekundy
termux-vibrate -d 1000

# Wzorzec wibracji (ms): wibruj 300ms, przerwa 200ms, wibruj 500ms
termux-vibrate -d 300 && sleep 0.2 && termux-vibrate -d 500
```

### 8.4 Aparat i latarka

```bash
# Zrob zdjecie tylnym aparatem i zapisz do pliku
termux-camera-photo -c back ~/storage/dcim/foto_$(date +%Y%m%d_%H%M%S).jpg

# Wlacz latarke
termux-torch on

# Wylacz latarke
termux-torch off
```

### 8.5 Kontakty i SMS

```bash
# Lista kontaktow (JSON)
termux-contact-list | jq '.[].name'

# Wyslanie SMS (wymaga uprawnien)
termux-sms-send -n "+48123456789" "Wiadomosc testowa z Termux"

# Odczyt ostatnich SMS-ow
termux-sms-list -l 10 | jq '.[].body'
```

### 8.6 Informacje o baterii i sieci

```bash
# Stan baterii
termux-battery-status | jq '.percentage, .status'

# Informacje o Wi-Fi
termux-wifi-connectioninfo | jq '.ssid, .ip'
```

---

## 9. Zaawansowane skrypty shell i automatyzacja

### 9.1 Prosty skrypt automatyzacji

Przykładowy skrypt `backup.sh`, który kompresuje katalog projektów i wysyła powiadomienie:

```bash
#!/data/data/com.termux/files/usr/bin/bash

BACKUP_DIR=~/storage/downloads/backups
PROJEKTY=~/projekty
DATA=$(date +%Y%m%d_%H%M%S)
PLIK="$BACKUP_DIR/backup_$DATA.tar.gz"

mkdir -p "$BACKUP_DIR"
tar -czf "$PLIK" "$PROJEKTY"

if [ $? -eq 0 ]; then
  termux-notification \
    --title "Backup OK" \
    --content "Zapisano: backup_$DATA.tar.gz"
else
  termux-notification \
    --title "Backup BLAD" \
    --content "Backup nie powiodl sie!"
fi
```

Nadanie uprawnień wykonania i uruchomienie:

```bash
chmod +x ~/backup.sh
~/backup.sh
```

### 9.2 Harmonogram zadań — cron

Termux obsługuje crona przez pakiet `cronie`:

```bash
pkg install cronie

# Uruchomienie demona cron
crond

# Edycja harmonogramu (crontab)
crontab -e
```

Przykładowe wpisy w crontab:

```cron
# Backup co dobe o 23:00
0 23 * * * ~/backup.sh

# Powiadomienie przypominajace o commitcie co godzine w godzinach pracy
0 9-17 * * 1-5 termux-notification --title "Pamietaj o git commit!" --content "Czy zapisales postepy?"

# Synchronizacja z chmura co 30 minut
*/30 * * * * rclone sync ~/projekty remote:MojeDysk/projekty
```

### 9.3 termux-job-scheduler

Alternatywą dla crona jest **termux-job-scheduler**, który lepiej integruje się z systemem zarządzania energią Androida:

```bash
# Zaplanuj uruchomienie skryptu co 15 minut
termux-job-scheduler --script ~/backup.sh --period-ms 900000

# Lista zaplanowanych zadan
termux-job-scheduler --pending

# Anulowanie zadan
termux-job-scheduler --cancel-all
```

### 9.4 Monitorowanie i alerty

Skrypt sprawdzający dostępność serwisu i wysyłający alert:

```bash
#!/data/data/com.termux/files/usr/bin/bash

URL="https://moja-aplikacja.pl"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$HTTP_CODE" != "200" ]; then
  termux-notification \
    --title "ALERT: Serwis niedostepny" \
    --content "$URL zwrocil kod $HTTP_CODE" \
    --sound \
    --vibrate 1000
fi
```

---

## 10. Praca z plikami w Termux

### 10.1 Struktura katalogów

Po wykonaniu `termux-setup-storage` struktura wygląda następująco:

```
~/ (katalog domowy Termux)
├── storage/
│   ├── shared/        → /sdcard (cala pamiec wewnetrzna)
│   ├── dcim/          → /sdcard/DCIM
│   ├── downloads/     → /sdcard/Download
│   ├── movies/        → /sdcard/Movies
│   └── music/         → /sdcard/Music
├── projekty/
└── .ssh/
```

### 10.2 Synchronizacja z chmurą — rclone

`rclone` pozwala synchronizować pliki z Google Drive, Dropbox, OneDrive i innymi serwisami:

```bash
pkg install rclone

# Konfiguracja (interaktywna)
rclone config

# Synchronizacja lokalnego katalogu do chmury
rclone sync ~/projekty remote:Termux-Backup

# Pobieranie plikow z chmury
rclone copy remote:Termux-Backup ~/projekty

# Montowanie dysku w chmurze jako lokalny katalog
mkdir -p ~/chmura
rclone mount remote: ~/chmura --daemon
```

### 10.3 Przesyłanie plików przez SSH

Mając uruchomiony serwer SSH w Termux, można przesyłać pliki z komputera:

```bash
# Kopiowanie pliku z komputera na telefon
scp -P 8022 projekt.zip <IP_TELEFONU>:~/

# Kopiowanie katalogu
scp -P 8022 -r ~/MojProjekt <IP_TELEFONU>:~/projekty/

# Uzycie rsync dla efektywnej synchronizacji
rsync -avz -e "ssh -p 8022" ~/MojProjekt/ <IP_TELEFONU>:~/projekty/MojProjekt/
```

### 10.4 Archiwizacja i kompresja

```bash
# Kompresja katalogu
tar -czf archiwum.tar.gz ~/projekty/moj-projekt/

# Rozpakowanie
tar -xzf archiwum.tar.gz

# Kompresja zip
zip -r archiwum.zip ~/projekty/moj-projekt/

# Sprawdzenie rozmiaru katalogow
du -sh ~/projekty/*/
```

---

## 11. Integracja z narzędziami terminalowymi

Termux dobrze współpracuje z:

- **tmux** — sesje i splity terminala; pozwala utrzymać uruchomione procesy nawet gdy aplikacja przejdzie w tło,
- **vim/neovim** — edycja kodu z obsługą pluginów,
- **git** — wersjonowanie projektów,
- **openssh** — zdalna administracja i serwer SSH,
- **rclone/rsync** — synchronizacja danych z chmurą i innymi urządzeniami.

Przydatna konfiguracja tmux (`~/.tmux.conf`):

```bash
# Zmiana prefiksu na Ctrl+a (latwiej osiagalne na klawiaturze mobilnej)
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Podzial poziomy i pionowy
bind | split-window -h
bind - split-window -v

# Wlaczenie myszy
set -g mouse on
```

W zastosowaniach edukacyjnych można budować cały pipeline „CLI-first", ucząc dobrych praktyk pracy w shellu.

---

## 12. Ograniczenia i bezpieczeństwo

### 12.1 Ograniczenia platformowe

- brak pełnego systemd i klasycznych daemonów jak na desktopie,
- ograniczenia działania w tle przez polityki oszczędzania energii (Android może ubijać procesy),
- różnice między wersjami Androida i producentami urządzeń,
- brak `/proc/sys` i innych interfejsów jądra dostępnych na desktopie.

Aby zapobiec ubijaniu Termux przez system, warto:

1. Wyłączyć optymalizację baterii dla Termux w ustawieniach Androida,
2. Uruchomić sesję tmux — procesy przetrwają nawet zamknięcie aplikacji,
3. Uruchomić Termux jako usługę na pierwszym planie (opcja w menu powiadomień).

### 12.2 Bezpieczeństwo

Zalecenia:

1. Aktualizować pakiety regularnie: `pkg update && pkg upgrade`,
2. Używać kluczy SSH zamiast haseł — wygeneruj parę kluczy poleceniem `ssh-keygen -t ed25519`,
3. Unikać uruchamiania niezweryfikowanych skryptów ze źródeł zewnętrznych,
4. Chronić tokeny/API keys przez zmienne środowiskowe i `.gitignore`,
5. Wyłączać serwer SSH gdy nie jest potrzebny: `pkill sshd`,
6. Przechowywać wrażliwe dane poza katalogiem `~/storage/shared`, który jest dostępny dla innych aplikacji.

---

## 13. Termux w dydaktyce mobilnej

Termux świetnie sprawdza się na zajęciach z:

- podstaw systemów operacyjnych i shell scriptingu,
- sieci komputerowych (SSH, HTTP, DNS, diagnostyka),
- automatyzacji i CI-like workflow,
- podstaw cyberbezpieczeństwa (higiena kluczy, uprawnień i sekretów),
- programowania w Pythonie i Node.js.

Zaletą jest niski próg wejścia: wystarczy telefon i klawiatura ekranowa (lub Bluetooth). Studenci mogą w prosty sposób zademonstrować działanie serwera HTTP, skryptu automatyzacji czy połączenia SSH — bez potrzeby konfigurowania maszyn wirtualnych.

Przykładowe ćwiczenia laboratoryjne:

1. Uruchom serwer SSH na telefonie i połącz się z nim z komputera kolegi,
2. Napisz skrypt monitorujący dostępność strony internetowej i wysyłający powiadomienie,
3. Skonfiguruj harmonogram crona wykonujący backup ważnych plików,
4. Utwórz wirtualne środowisko Pythona i uruchom w nim prostą aplikację Flask,
5. Użyj `termux-camera-photo` i prześlij zdjęcie na serwer HTTP napisany w Node.js.

---

## 14. Dobre praktyki pracy

- Używaj aliasów i pliku `~/.bashrc` / `~/.zshrc` — np. `alias ll='ls -la'`,
- Trzymaj projekty w czytelnej strukturze katalogów (`~/projekty/nazwa-projektu/`),
- Zapisuj gotowe procedury jako skrypty `.sh` z komentarzami,
- Stosuj repozytorium Git nawet dla małych projektów i commituj regularnie,
- Dokumentuj środowisko (`README`, lista pakietów, instrukcja setupu),
- Używaj tmux do zarządzania sesjami — pozwala wracać do przerwanej pracy,
- Rób regularne backupy danych z Termux do chmury lub komputera.

---

## 15. Podsumowanie

**Termux** to praktyczne środowisko „Linux-like" na Androidzie: lekkie, elastyczne i bardzo przydatne do nauki programowania, automatyzacji oraz pracy administratorskiej w trybie mobilnym. Dzięki pakietowi **Termux:API** studenci mogą eksplorować możliwości platformy Android bezpośrednio z terminala, a wbudowany serwer SSH umożliwia wygodną pracę zdalną.

Dla kursów aplikacji mobilnych Termux jest świetnym narzędziem uzupełniającym — szczególnie tam, gdzie liczy się szybkie prototypowanie, praca w terminalu i zrozumienie, jak warstwa systemowa Androida udostępnia swoje zasoby zewnętrznym narzędziom.
