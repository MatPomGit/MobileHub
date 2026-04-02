# Termux — terminal emulator with packages

## 1. Czym jest Termux?

**Termux** to emulator terminala dla Androida połączony z menedżerem pakietów, który pozwala uruchamiać narzędzia linuksowe bez roota (w standardowych scenariuszach). W praktyce daje środowisko zbliżone do lekkiej dystrybucji Linux bezpośrednio na telefonie lub tablecie.

Najważniejsze cechy:

- shell i typowe narzędzia CLI (np. `bash`, `zsh`, `git`, `ssh`, `python`, `nodejs`),
- instalacja pakietów przez `pkg` / `apt`,
- możliwość budowania skryptowych workflow automatyzacji,
- integracja z pamięcią urządzenia i (opcjonalnie) zewnętrznymi edytorami.

---

## 2. Jak działa Termux od strony technicznej?

Termux tworzy przestrzeń użytkownika w katalogu aplikacji Android i udostępnia:

1. binaria skompilowane dla architektur ARM/ARM64/x86,
2. bibliotekę systemową kompatybilną z Android/Bionic,
3. własne repozytoria pakietów,
4. warstwę dostępu do API Androida (przez dodatkowe moduły i integracje).

W odróżnieniu od klasycznego Linuxa desktopowego:

- nie mamy pełnej kontroli nad jądrem,
- obowiązuje sandbox aplikacji,
- dostęp do części zasobów jest limitowany przez politykę Androida i uprawnienia.

---

## 3. Instalacja i pierwsza konfiguracja

## 3.1 Instalacja

Najczęściej rekomendowane jest pobranie Termux z repozytorium F-Droid (aktualniejsze buildy niż w wielu mirrorach sklepów). Po instalacji warto od razu wykonać:

```bash
pkg update && pkg upgrade -y
```

## 3.2 Podstawowe pakiety startowe

```bash
pkg install -y git curl wget vim openssh python nodejs
```

## 3.3 Dostęp do pamięci współdzielonej Androida

```bash
termux-setup-storage
```

Polecenie tworzy skróty do typowych katalogów użytkownika i pozwala wygodniej pracować na plikach.

---

## 4. Menedżer pakietów: `pkg` i `apt`

W Termux najczęściej używa się `pkg`, który jest wygodnym wrapperem nad `apt`.

Przykłady:

- wyszukanie pakietu: `pkg search nazwa`,
- instalacja: `pkg install nazwa`,
- usunięcie: `pkg uninstall nazwa`,
- aktualizacja list i pakietów: `pkg update && pkg upgrade`.

Dzięki temu Termux jest dobrym środowiskiem do nauki administracji CLI i pracy z zależnościami.

---

## 5. Typowe use-case’y mobilne

## 5.1 Programowanie i prototypowanie

- szybkie uruchamianie skryptów Python/Node,
- testowanie API przez `curl`,
- lokalne narzędzia developerskie bez komputera.

## 5.2 Automatyzacja

- backup i synchronizacja plików,
- harmonogramy zadań (w połączeniu z narzędziami Android),
- przetwarzanie tekstu i logów (`awk`, `sed`, `grep`, `jq`).

## 5.3 DevOps „on the go”

- łączenie po SSH z serwerami,
- proste operacje Git,
- diagnostyka usług i endpointów.

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

---

## 7. Integracja z narzędziami terminalowymi

Termux dobrze współpracuje z:

- **tmux** (sesje i splity terminala),
- **vim/neovim** (edycja kodu),
- **git** (wersjonowanie),
- **openssh** (zdalna administracja),
- **rclone/rsync** (synchronizacja danych).

W zastosowaniach edukacyjnych można budować cały pipeline „CLI-first”, ucząc dobrych praktyk pracy w shellu.

---

## 8. Ograniczenia i bezpieczeństwo

## 8.1 Ograniczenia platformowe

- brak pełnego systemd i klasycznych daemonów jak na desktopie,
- ograniczenia działania w tle przez polityki oszczędzania energii,
- różnice między wersjami Androida i producentami urządzeń.

## 8.2 Bezpieczeństwo

Zalecenia:

1. aktualizować pakiety regularnie,
2. używać kluczy SSH zamiast haseł,
3. unikać uruchamiania niezweryfikowanych skryptów,
4. chronić tokeny/API keys (np. przez zmienne środowiskowe i `.gitignore`).

---

## 9. Termux w dydaktyce mobilnej

Termux świetnie sprawdza się na zajęciach z:

- podstaw systemów operacyjnych i shell scriptingu,
- sieci komputerowych (SSH, HTTP, DNS, diagnostyka),
- automatyzacji i CI-like workflow,
- podstaw cyberbezpieczeństwa (higiena kluczy, uprawnień i sekretów).

Zaletą jest niski próg wejścia: wystarczy telefon i klawiatura ekranowa (lub BT).

---

## 10. Dobre praktyki pracy

- używaj aliasów i pliku `~/.bashrc` / `~/.zshrc`,
- trzymaj projekty w czytelnej strukturze katalogów,
- zapisuj gotowe procedury jako skrypty `.sh`,
- stosuj repozytorium Git nawet dla małych projektów,
- dokumentuj środowisko (`README`, lista pakietów, instrukcja setupu).

---

## 11. Podsumowanie

**Termux** to praktyczne środowisko „Linux-like” na Androidzie: lekkie, elastyczne i bardzo przydatne do nauki programowania, automatyzacji oraz pracy administratorskiej w trybie mobilnym. Dla kursów aplikacji mobilnych jest to świetne narzędzie uzupełniające — szczególnie tam, gdzie liczy się szybkie prototypowanie i praca w terminalu.
