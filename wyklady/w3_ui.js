javascript
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Projektowanie UI/UX dla Urządzeń Mobilnych";

// ─── Color palette (dark navy style matching previous lectures) ───────────────
const C = {
  bg:        "0D1B2A",
  bgLight:   "F0F4F8",
  panel:     "0A253A",
  panelBrd:  "162840",
  title:     "FFFFFF",
  subtitle:  "A8C4D8",
  body:      "C8DCE8",
  bodyDim:   "7A9BAD",
  accent1:   "00BCD4",   // cyan
  accent2:   "E91E8C",   // magenta
  accent3:   "4CAF50",   // green
  accent4:   "9C27B0",   // purple
  accent5:   "FF9800",   // orange
  code:      "0A1929",
  codeTxt:   "A8D8A8",
  white:     "FFFFFF",
};

const BARS = [C.accent1, C.accent2, C.accent3, C.accent4, C.accent5];

function darkSlide() {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  return s;
}

function addFooter(s, pageNum, totalPages) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.35, w: 10, h: 0.28,
    fill: { color: "071420" }, line: { color: "071420" }
  });
  s.addText("Projektowanie UI/UX dla Urządzeń Mobilnych | Informatyka", {
    x: 0.3, y: 5.36, w: 7, h: 0.22,
    fontSize: 8, color: C.bodyDim, fontFace: "Calibri", valign: "middle"
  });
  s.addText(`${pageNum}/${totalPages}`, {
    x: 9.3, y: 5.36, w: 0.6, h: 0.22,
    fontSize: 8, color: C.bodyDim, fontFace: "Calibri", align: "right", valign: "middle"
  });
}

function addSectionTitle(s, text, color) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.72,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 0.72,
    fill: { color: color }, line: { color: color }
  });
  s.addText(text, {
    x: 0.35, y: 0, w: 9.5, h: 0.72,
    fontSize: 22, bold: true, color: C.white, fontFace: "Calibri", valign: "middle", margin: 0
  });
}

function addCard(s, x, y, w, h, title, body, accentColor, fontSize) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.07, h,
    fill: { color: accentColor }, line: { color: accentColor }
  });
  s.addText([
    { text: title + "\n", options: { bold: true, fontSize: fontSize || 11, color: C.white, breakLine: true } },
    { text: body, options: { fontSize: (fontSize || 11) - 0.5, color: C.body } }
  ], {
    x: x + 0.13, y, w: w - 0.17, h,
    valign: "middle", fontFace: "Calibri", margin: 5
  });
}

function addCode(s, x, y, w, h, lang, code) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.code }, line: { color: "1E3A50" }
  });
  s.addText(lang, {
    x: x + w - 1.0, y: y + 0.02, w: 0.95, h: 0.22,
    fontSize: 8, color: C.bodyDim, fontFace: "Consolas", align: "right", margin: 0
  });
  s.addText(code, {
    x: x + 0.1, y: y + 0.05, w: w - 0.15, h: h - 0.1,
    fontSize: 7.8, color: C.codeTxt, fontFace: "Consolas", valign: "top", margin: 0
  });
}

function addStatBox(s, x, y, w, h, value, label, color) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText(value, {
    x, y: y + 0.04, w, h: h * 0.58,
    fontSize: 28, bold: true, color: color, fontFace: "Calibri",
    align: "center", valign: "bottom", margin: 0
  });
  s.addText(label, {
    x, y: y + h * 0.6, w, h: h * 0.35,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri",
    align: "center", valign: "top", margin: 0
  });
}

// Section divider slide (dark, large number)
function addSectionDivider(s, num, title, subtitle, color) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.5, h: 5.625,
    fill: { color: color }, line: { color: color }
  });
  s.addText(num, {
    x: 0.7, y: 0.4, w: 3, h: 2.0,
    fontSize: 110, bold: true, color: color, fontFace: "Calibri",
    transparency: 15
  });
  s.addText(title, {
    x: 0.7, y: 2.5, w: 9, h: 1.2,
    fontSize: 40, bold: true, color: C.white, fontFace: "Calibri"
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 3.75, w: 1.5, h: 0.05,
    fill: { color: color }, line: { color: color }
  });
  s.addText(subtitle, {
    x: 0.7, y: 3.9, w: 8, h: 0.5,
    fontSize: 15, color: C.subtitle, fontFace: "Calibri"
  });
}

const TOTAL = 45;
let slideNum = 0;
function ns() { return ++slideNum; }

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.22, h: 5.625,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });
  s.addText("WYKŁAD 3", {
    x: 0.45, y: 0.45, w: 5.5, h: 0.35,
    fontSize: 11, bold: true, color: C.accent1, fontFace: "Calibri", charSpacing: 4
  });
  s.addText("Projektowanie\nUI/UX dla\nUrządzeń Mobilnych", {
    x: 0.45, y: 0.85, w: 6.5, h: 2.8,
    fontSize: 36, bold: true, color: C.white, fontFace: "Calibri"
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 3.7, w: 1.5, h: 0.05,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });
  s.addText("Programowanie Aplikacji Mobilnych — Studia Magisterskie", {
    x: 0.45, y: 3.85, w: 6, h: 0.26,
    fontSize: 11, color: C.subtitle, fontFace: "Calibri"
  });
  s.addText("dr inż. Mateusz Pomianek", {
    x: 0.45, y: 4.15, w: 6, h: 0.26,
    fontSize: 13, bold: true, color: C.accent2, fontFace: "Calibri"
  });
  s.addText("2026", {
    x: 0.45, y: 4.45, w: 2, h: 0.22,
    fontSize: 11, color: C.bodyDim, fontFace: "Calibri"
  });
  // Right panel — topic overview
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.2, y: 0.5, w: 2.6, h: 4.7,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("PLAN WYKŁADU", {
    x: 7.35, y: 0.65, w: 2.3, h: 0.3,
    fontSize: 9, bold: true, color: C.accent1, fontFace: "Calibri", charSpacing: 2
  });
  const topics = [
    "01 Wprowadzenie UI/UX",
    "02 Rodzaje Interfejsów",
    "03 Zasady Projektowania",
    "04 Standardy Branżowe",
    "05 Dobór Kolorów",
    "06 Typografia",
    "07 Dźwięki i Haptyka",
    "08 Projektowanie Emocjonalne",
    "09 Hierarchia Wizualna",
    "10 Narzędzia UI/UX",
  ];
  topics.forEach((t, i) => {
    s.addText(t, {
      x: 7.35, y: 1.05 + i * 0.38, w: 2.3, h: 0.32,
      fontSize: 9.5, color: i % 2 === 0 ? C.body : C.subtitle, fontFace: "Calibri"
    });
  });
  addFooter(s, n, TOTAL);
  s.addNotes("Slajd tytułowy wykładu nr 3 z cyklu Programowanie Aplikacji Mobilnych. Tematyka UI/UX jest kluczowa dla każdego programisty mobilnego – piękny kod nie wystarczy, jeśli aplikacja jest nieprzyjazna dla użytkownika. Dzisiaj omówimy 10 kluczowych obszarów: od definicji i historii, przez konkretne zasady i standardy platform, aż po narzędzia stosowane w branży.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Spis treści
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "Zakres Prezentacji", C.accent1);
  // Two columns of 5 topics each
  const left = [
    ["01", "Wprowadzenie do UI/UX", "Definicje, ewolucja, specyfika mobilna"],
    ["02", "Rodzaje Interfejsów", "GUI, VUI, NUI, TUI, CLI/CUI"],
    ["03", "Zasady Projektowania", "Heurystyki, prawa projektowania"],
    ["04", "Standardy Branżowe", "iOS HIG, Material Design, WCAG"],
    ["05", "Dobór Kolorów", "Teoria kolorów, psychologia, dark mode"],
  ];
  const right = [
    ["06", "Typografia Mobilna", "Wybór czcionek, hierarchia, dostępność"],
    ["07", "Dźwięki i Haptyka", "Projektowanie dźwiękowe, feedback dotykowy"],
    ["08", "Projektowanie Emocjonalne", "Model Normana, mikrointerakcje"],
    ["09", "Hierarchia Wizualna", "Zasady, Gestalt, kierowanie uwagą"],
    ["10", "Narzędzia UI/UX", "Figma, Sketch, proces projektowy"],
  ];
  const colors = [C.accent1, C.accent2, C.accent3, C.accent4, C.accent5];
  left.forEach(([num, title, sub], i) => {
    const y = 0.85 + i * 0.88;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y, w: 4.55, h: 0.76,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y, w: 0.07, h: 0.76,
      fill: { color: colors[i] }, line: { color: colors[i] }
    });
    s.addText(num, {
      x: 0.45, y: y + 0.06, w: 0.5, h: 0.3,
      fontSize: 16, bold: true, color: colors[i], fontFace: "Calibri", margin: 0
    });
    s.addText(title, {
      x: 0.95, y: y + 0.06, w: 3.7, h: 0.3,
      fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(sub, {
      x: 0.95, y: y + 0.38, w: 3.7, h: 0.26,
      fontSize: 9.5, color: C.bodyDim, fontFace: "Calibri", margin: 0
    });
  });
  right.forEach(([num, title, sub], i) => {
    const y = 0.85 + i * 0.88;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.15, y, w: 4.55, h: 0.76,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.15, y, w: 0.07, h: 0.76,
      fill: { color: colors[i] }, line: { color: colors[i] }
    });
    s.addText(num, {
      x: 5.3, y: y + 0.06, w: 0.5, h: 0.3,
      fontSize: 16, bold: true, color: colors[i], fontFace: "Calibri", margin: 0
    });
    s.addText(title, {
      x: 5.8, y: y + 0.06, w: 3.7, h: 0.3,
      fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(sub, {
      x: 5.8, y: y + 0.38, w: 3.7, h: 0.26,
      fontSize: 9.5, color: C.bodyDim, fontFace: "Calibri", margin: 0
    });
  });
  addFooter(s, n, TOTAL);
  s.addNotes("Prezentacja podzielona jest na 10 modułów tematycznych. Pierwsze cztery rozdziały mają charakter bardziej koncepcyjny i standardyzacyjny. Rozdziały 5–7 dotyczą konkretnych elementów interfejsu: kolorów, typografii i sprzężeń zwrotnych. Rozdziały 8–10 skupiają się na zaawansowanych aspektach: psychologii, hierarchii oraz narzędziach zawodowych. Warto zaznajomić się z całością – każdy z tych obszarów będzie przydatny w praktyce zawodowej.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 01 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "01", "Wprowadzenie do UI/UX", "Fundamenty projektowania interfejsów i doświadczeń użytkownika", C.accent1);
  addFooter(s, n, TOTAL);
  s.addNotes("Pierwsza sekcja wykładu: fundamenty UI/UX. Zanim przejdziemy do konkretnych technik i narzędzi, musimy ustalić wspólny język i zrozumieć, czym w istocie jest UI, czym UX i jak te dyscypliny się różnią. Historia projektowania mobilnego jest zaskakująco krótka – zaledwie kilkanaście lat – ale tempo zmian jest niesamowite.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 4 — UI vs UX
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "01 • Definicja UI i UX — Różnice i Zależności", C.accent1);

  // Two large cards
  // UI card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 3.9,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 0.07, h: 3.9,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });
  s.addText("UI", {
    x: 0.5, y: 0.95, w: 1, h: 0.45,
    fontSize: 28, bold: true, color: C.accent1, fontFace: "Calibri", margin: 0
  });
  s.addText("User Interface", {
    x: 0.5, y: 1.45, w: 3.8, h: 0.28,
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("warstwa wizualna i interaktywna aplikacji", {
    x: 0.5, y: 1.72, w: 3.8, h: 0.26,
    fontSize: 10, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  const uiItems = [
    "Elementy wizualne: kolory, typografia, ikony",
    "Układ i kompozycja elementów na ekranie",
    "Responsywność i adaptacja do ekranów",
    "Mikrointerakcje i animacje",
  ];
  uiItems.forEach((item, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.1 + i * 0.42, w: 0.07, h: 0.28,
      fill: { color: C.accent1 }, line: { color: C.accent1 }
    });
    s.addText(item, {
      x: 0.65, y: 2.1 + i * 0.42, w: 3.65, h: 0.28,
      fontSize: 10, color: C.body, fontFace: "Calibri", valign: "middle", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 4.5, w: 4.5, h: 0.25,
    fill: { color: "071E30" }, line: { color: C.panelBrd }
  });
  s.addText("Pytanie: Jak to wygląda?", {
    x: 0.5, y: 4.51, w: 4.1, h: 0.22,
    fontSize: 9.5, bold: true, color: C.accent1, fontFace: "Calibri", valign: "middle", margin: 0
  });

  // UX card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 0.85, w: 4.5, h: 3.9,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 0.85, w: 0.07, h: 3.9,
    fill: { color: C.accent2 }, line: { color: C.accent2 }
  });
  s.addText("UX", {
    x: 5.4, y: 0.95, w: 1, h: 0.45,
    fontSize: 28, bold: true, color: C.accent2, fontFace: "Calibri", margin: 0
  });
  s.addText("User Experience", {
    x: 5.4, y: 1.45, w: 3.8, h: 0.28,
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("całościowe doświadczenie użytkownika", {
    x: 5.4, y: 1.72, w: 3.8, h: 0.26,
    fontSize: 10, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  const uxItems = [
    "Łatwość użycia i intuicyjność nawigacji",
    "Satysfakcja i emocje podczas użytkowania",
    "Efektywność w realizacji celów użytkownika",
    "Dostępność i inkluzywność",
  ];
  uxItems.forEach((item, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.4, y: 2.1 + i * 0.42, w: 0.07, h: 0.28,
      fill: { color: C.accent2 }, line: { color: C.accent2 }
    });
    s.addText(item, {
      x: 5.55, y: 2.1 + i * 0.42, w: 3.65, h: 0.28,
      fontSize: 10, color: C.body, fontFace: "Calibri", valign: "middle", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 4.5, w: 4.5, h: 0.25,
    fill: { color: "071E30" }, line: { color: C.panelBrd }
  });
  s.addText("Pytanie: Jakie to daje uczucie?", {
    x: 5.4, y: 4.51, w: 4.1, h: 0.22,
    fontSize: 9.5, bold: true, color: C.accent2, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("UI to warstwa wizualna – to, co użytkownik widzi i dotyka. UX to całościowe doświadczenie – jak się czuje korzystając z produktu. Kluczowa relacja: UI jest częścią UX. Można mieć piękne UI i złe UX (np. app wyglądająca świetnie, ale niemożliwa do nawigacji) oraz proste UI z doskonałym UX (np. Google Search). Analogia: UI to estetyka restauracji, UX to całe doświadczenie: od rezerwacji, przez obsługę, jedzenie, do rachunku.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — Ewolucja projektowania mobilnego
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "01 • Ewolucja Projektowania Mobilnego", C.accent1);

  const eras = [
    { year: "1990s–2006", title: "Era Przedsmartfonowa", body: "Telefony z fizycznymi klawiaturami, małe ekrany. Nokia, Motorola — proste menu tekstowe i ikonowe. Ograniczone możliwości interfejsu.", color: C.accent5 },
    { year: "2007", title: "Rewolucja iPhone", body: "Wielodotykowy ekran, gesty, nowa era projektowania dotykowego. Początek skeuomorfizmu — elementy imitujące realne obiekty.", color: C.accent1 },
    { year: "2014", title: "Material Design", body: "Google wprowadza Material Design — jednolity język wizualny dla Android. Flat design, cienie, animacje jako informacja.", color: C.accent3 },
    { year: "2020+", title: "Współczesność", body: "Neumorfizm, Dark Mode, AI-driven design, personalizacja, dostępność jako priorytet. Design Systems i automatyzacja.", color: C.accent2 },
  ];

  eras.forEach((era, i) => {
    const x = 0.3 + i * 2.38;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85, w: 2.2, h: 4.3,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85, w: 2.2, h: 0.06,
      fill: { color: era.color }, line: { color: era.color }
    });
    s.addText(era.year, {
      x: x + 0.12, y: 1.0, w: 1.96, h: 0.3,
      fontSize: 10, bold: true, color: era.color, fontFace: "Calibri", margin: 0
    });
    s.addText(era.title, {
      x: x + 0.12, y: 1.35, w: 1.96, h: 0.5,
      fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(era.body, {
      x: x + 0.12, y: 1.9, w: 1.96, h: 2.8,
      fontSize: 10, color: C.body, fontFace: "Calibri", valign: "top", margin: 0
    });
    // Timeline dot
    if (i < 3) {
      s.addShape(pres.shapes.OVAL, {
        x: x + 2.2, y: 0.85 + 4.3/2 - 0.12, w: 0.18, h: 0.18,
        fill: { color: era.color }, line: { color: era.color }
      });
    }
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Ewolucja projektowania mobilnego to tylko około 30 lat historii, ale tempo zmian jest zawrotne. Kluczowy przełom: iPhone 2007 — zmienił wszystko. Przed nim projektowanie mobile oznaczało komórki z klawiaturami. Po nim: dotyk, gesty, ekrany jako główny interfejs. Material Design z 2014 roku do dziś jest fundamentem projektowania na Android. Warto obserwować trend: od skeuomorfizmu (imitowanie rzeczywistości) przez flat design do neumorfizmu i adaptacyjnego AI design.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 6 — Specyfika mobilna
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "01 • Specyfika Projektowania dla Urządzeń Mobilnych", C.accent1);

  const cards = [
    { title: "Ograniczona Przestrzeń", body: "Ekrany 4–7 cali wymagają priorytetyzacji treści i minimalistycznego podejścia. Mniej miejsca = większa odpowiedzialność projektanta.", color: C.accent1 },
    { title: "Interakcje Dotykowe", body: "Projektowanie pod palce, nie kursor. Precyzja dotykowa jest niższa — wymaga większych celów min. 44-48px i odpowiednich odstępów.", color: C.accent2 },
    { title: "Zmienne Warunki", body: "Użytkownicy korzystają w ruchu, w słońcu, w deszczu. Interfejs musi być czytelny w każdych warunkach środowiskowych.", color: C.accent3 },
  ];

  cards.forEach((card, i) => {
    addCard(s, 0.3 + i * 3.15, 0.85, 3.0, 3.0, card.title, card.body, card.color, 12);
  });

  // Bottom two wider cards
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 4.0, w: 4.5, h: 1.12,
    fill: { color: "071420" }, line: { color: C.accent4 }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 4.0, w: 0.07, h: 1.12,
    fill: { color: C.accent4 }, line: { color: C.accent4 }
  });
  s.addText("Kontekst Użycia", {
    x: 0.45, y: 4.05, w: 4.1, h: 0.28,
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Użytkownicy mobilni są często rozproszeni, pośpieszni, multitaskują. Aplikacje muszą dostarczać wartość natychmiast — w ciągu 3–5 sekund od otwarcia.", {
    x: 0.45, y: 4.35, w: 4.1, h: 0.65,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 4.0, w: 4.5, h: 1.12,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 4.0, w: 0.07, h: 1.12,
    fill: { color: C.accent5 }, line: { color: C.accent5 }
  });
  s.addText("Fragmentacja Urządzeń", {
    x: 5.35, y: 4.05, w: 4.1, h: 0.28,
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Setki rozmiarów ekranów, rozdzielczości, proporcji. Responsywność i elastyczność layoutów są kluczowe dla spójnego doświadczenia.", {
    x: 5.35, y: 4.35, w: 4.1, h: 0.65,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Projektowanie mobilne ma unikalne wyzwania. Ograniczona przestrzeń ekranu to wymóg surowej selekcji treści — każdy element musi zarabiać na swoje miejsce. Interakcje dotykowe są mniej precyzyjne niż kursor myszy — stąd minimalne rozmiary celów dotykowych 44px iOS / 48dp Android. Zmienne warunki oznaczają, że aplikacja musi działać zarówno w słoneczny dzień jak i w ciemnym pokoju. Kontekst użycia to jedno z najważniejszych pojęć: mobilni użytkownicy rzadko skupiają się w 100% na aplikacji.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 02 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "02", "Rodzaje Interfejsów Użytkownika", "Klasyfikacja i charakterystyka różnych typów interfejsów", C.accent2);
  addFooter(s, n, TOTAL);
  s.addNotes("Sekcja druga: rodzaje interfejsów użytkownika. GUI to nie jedyny typ interfejsu — w erze głosowych asystentów, AR i chatbotów warto znać cały ekosystem. Omówimy pięć głównych typów: GUI, VUI, NUI, TUI oraz CLI/CUI.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 8 — GUI
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "02 • GUI — Graphical User Interface", C.accent2);

  // Left: Charakterystyka
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Charakterystyka", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Graficzne interfejsy użytkownika to najpopularniejszy typ w aplikacjach mobilnych. Wykorzystują elementy wizualne do reprezentacji funkcji i nawigacji.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.7,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  const guiComponents = [
    ["Okna", "Kontenery treści, modale, bottom sheets"],
    ["Ikony", "Wizualne reprezentacje funkcji i akcji"],
    ["Menu", "Nawigacja, hamburger menu, tab bars"],
    ["Przyciski", "CTA, akcje, interaktywne elementy"],
  ];
  guiComponents.forEach(([title, body], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.1 + i * 0.65, w: 3.9, h: 0.56,
      fill: { color: "0D2035" }, line: { color: "1A3050" }
    });
    s.addText(title, {
      x: 0.65, y: 2.15 + i * 0.65, w: 1.2, h: 0.22,
      fontSize: 10.5, bold: true, color: C.accent2, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 0.65, y: 2.37 + i * 0.65, w: 3.6, h: 0.22,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right: Zalety GUI
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Zalety GUI", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const zalety = [
    ["1", "Intuicyjność", "Użytkownicy rozumieją interfejs bez szkolenia dzięki metaforom rzeczywistości."],
    ["2", "Niski próg wejścia", "Odpowiedni dla wszystkich poziomów zaawansowania."],
    ["3", "Wizualizacja danych", "Prezentacja złożonych informacji w przystępny graficzny sposób."],
    ["4", "Spójność", "Łatwość utrzymania spójnego doświadczenia na różnych platformach."],
  ];
  zalety.forEach(([num, title, body], i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.3, y: 1.38 + i * 0.78, w: 0.32, h: 0.32,
      fill: { color: C.accent2 }, line: { color: C.accent2 }
    });
    s.addText(num, {
      x: 5.3, y: 1.38 + i * 0.78, w: 0.32, h: 0.32,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    s.addText(title, {
      x: 5.72, y: 1.38 + i * 0.78, w: 3.8, h: 0.24,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 5.72, y: 1.62 + i * 0.78, w: 3.8, h: 0.46,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Bottom note
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.88, w: 4.6, h: 0.27,
    fill: { color: "071420" }, line: { color: C.accent2 }
  });
  s.addText("Przykłady: Instagram, Facebook, Gmail, bankowość mobilna", {
    x: 5.25, y: 4.89, w: 4.3, h: 0.25,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("GUI (Graphical User Interface) to dominujący paradygmat w aplikacjach mobilnych. Kluczowe elementy GUI to: okna i kontenery, ikony, menu nawigacyjne i przyciski. Zalety GUI wynikają z intuicyjności — ludzie rozumieją metafory wizualne. Przykłady: kosz na śmieci oznacza usunięcie, lupa wyszukiwanie. Warto wspomnieć historyczny kontekst: przed GUI mieliśmy CLI (command line) — GUI zdemokratyzował technologię, czyniąc ją dostępną dla masowego użytkownika.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 9 — VUI
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "02 • VUI — Voice User Interface", C.accent2);

  // Left
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Interfejsy Głosowe", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Interfejsy głosowe rewolucjonizują interakcję z technologią. Wykorzystują rozpoznawanie mowy i przetwarzanie języka naturalnego (NLP).", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.65,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  const vuiComponents = [
    ["Asystenci Głosowi", "Siri, Google Assistant, Alexa"],
    ["Rozpoznawanie Mowy", "Konwersja głosu na tekst w czasie rzeczywistym"],
    ["Przetwarzanie Języka", "Rozumienie kontekstu i intencji (NLP)"],
  ];
  vuiComponents.forEach(([title, body], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.1 + i * 0.72, w: 3.9, h: 0.62,
      fill: { color: "0D2035" }, line: { color: "1A3050" }
    });
    s.addText(title, {
      x: 0.65, y: 2.15 + i * 0.72, w: 3.6, h: 0.25,
      fontSize: 11, bold: true, color: C.accent2, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 0.65, y: 2.4 + i * 0.72, w: 3.6, h: 0.25,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  addStatBox(s, 0.5, 4.3, 1.8, 0.72, "95%", "Dokładność rozpoznawania mowy", C.accent1);
  addStatBox(s, 2.5, 4.3, 1.8, 0.72, "3×", "Szybsze od pisania (doświadcz.)", C.accent3);

  // Right: Zalety i Wyzwania
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Zalety i Wyzwania", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const vuiPros = ["Obsługa hands-free", "Dostępność dla niepełnosprawnych", "Szybkość w odpowiednich kontekstach", "Naturalność interakcji"];
  const vuiCons = ["Dokładność w hałaśliwym otoczeniu", "Kontekst językowy i akcenty", "Prywatność i bezpieczeństwo danych", "Brak wizualnej informacji zwrotnej"];
  s.addText("✓ Zalety", {
    x: 5.3, y: 1.35, w: 2, h: 0.26,
    fontSize: 11, bold: true, color: C.accent3, fontFace: "Calibri", margin: 0
  });
  vuiPros.forEach((item, i) => {
    s.addText("— " + item, {
      x: 5.3, y: 1.65 + i * 0.38, w: 2.1, h: 0.32,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addText("✗ Wyzwania", {
    x: 7.35, y: 1.35, w: 2.2, h: 0.26,
    fontSize: 11, bold: true, color: C.accent5, fontFace: "Calibri", margin: 0
  });
  vuiCons.forEach((item, i) => {
    s.addText("— " + item, {
      x: 7.35, y: 1.65 + i * 0.38, w: 2.2, h: 0.32,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.88, w: 4.6, h: 0.27,
    fill: { color: "071420" }, line: { color: C.accent2 }
  });
  s.addText("Zastosowania: nawigacja, smart home, bankowość głosowa, dyktowanie tekstu", {
    x: 5.25, y: 4.89, w: 4.3, h: 0.25,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("VUI to coraz ważniejszy paradygmat. Siri, Google Assistant, Amazon Alexa — wszystkie bazują na NLP. 95% dokładność rozpoznawania mowy to imponujący wynik, ale w hałaśliwym środowisku spada drastycznie. Kluczowe wyzwanie: brak wizualnej informacji zwrotnej. Użytkownik nie wie, czy system go zrozumiał, dopóki nie usłyszy odpowiedzi. Dla programistów mobilnych: iOS oferuje SiriKit, Android — Speech Recognition API i Google Assistant Actions. Trendy: asystenci kontekstowi, offline speech recognition (On-Device ML).");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 10 — NUI
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "02 • NUI — Natural User Interface", C.accent2);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Naturalne Interakcje", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("NUI wykorzystują naturalne ludzkie zachowania — gesty, ruchy, dotyk — do interakcji z technologią. Eliminują barierę między człowiekiem a maszyną.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.65,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  const gestures = ["Swipe", "Pinch", "Rotate", "Scroll", "Shake"];
  s.addText("Gestury:", {
    x: 0.5, y: 2.05, w: 1, h: 0.28,
    fontSize: 10.5, bold: true, color: C.accent2, fontFace: "Calibri", margin: 0
  });
  gestures.forEach((g, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5 + i * 0.76, y: 2.35, w: 0.65, h: 0.3,
      fill: { color: "1A3A50" }, line: { color: C.accent2 }, rectRadius: 0.05
    });
    s.addText(g, {
      x: 0.5 + i * 0.76, y: 2.35, w: 0.65, h: 0.3,
      fontSize: 9, color: C.accent1, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
  });
  const nuiItems = [
    ["Śledzenie Wzroku", "Kontrola poprzez patrzenie na elementy. Używane w VR/AR i dostępności."],
    ["AR/VR", "Immersyjne doświadczenia w rzeczywistości rozszerzonej i wirtualnej."],
  ];
  nuiItems.forEach(([title, body], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 2.78 + i * 1.0, w: 0.07, h: 0.85,
      fill: { color: C.accent2 }, line: { color: C.accent2 }
    });
    s.addText(title, {
      x: 0.5, y: 2.8 + i * 1.0, w: 4.1, h: 0.25,
      fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 0.5, y: 3.07 + i * 1.0, w: 4.1, h: 0.4,
      fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right: Technologie NUI
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Technologie NUI", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const nuiTech = [
    { t: "Rozpoznawanie Gestów", b: "Kamery i czujniki śledzące ruchy ciała i dłoni", c: C.accent1 },
    { t: "Eye Tracking", b: "Śledzenie kierunku wzroku użytkownika", c: C.accent2 },
    { t: "AR/VR Headsets", b: "Urządzenia do immersyjnych doświadczeń", c: C.accent3 },
    { t: "Czujniki Mobilne", b: "Akcelerometr, żyroskop, czujnik zbliżeniowy", c: C.accent4 },
  ];
  nuiTech.forEach((tech, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 5.3 + col * 2.2;
    const y = 1.4 + row * 1.65;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.0, h: 1.48,
      fill: { color: "0D2035" }, line: { color: "1A3050" }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h: 1.48,
      fill: { color: tech.c }, line: { color: tech.c }
    });
    s.addText(tech.t, {
      x: x + 0.13, y: y + 0.12, w: 1.78, h: 0.45,
      fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(tech.b, {
      x: x + 0.13, y: y + 0.58, w: 1.78, h: 0.75,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.88, w: 4.6, h: 0.27,
    fill: { color: "071420" }, line: { color: C.accent2 }
  });
  s.addText("Przykłady: Pokemon GO, AR nawigacja, filtry social media", {
    x: 5.25, y: 4.89, w: 4.3, h: 0.25,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("NUI to przyszłość interakcji mobilnych, szczególnie w kontekście AR/VR i urządzeń wearable. Gesty to najpopularniejszy typ NUI na smartfonach: swipe, pinch, rotate są dziś standardem. Eye tracking wchodzi do mainstreamu — używany w Apple Vision Pro i Samsung Galaxy do scrollowania wzrokiem. Dla programistów: ARCore (Android) i ARKit (iOS) to frameworki do budowania NUI w augmented reality. Shake gesture to klasyczny przykład NUI: potrząśnięcie telefonem = undo.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 11 — TUI
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "02 • TUI — Touch User Interface", C.accent2);

  // Gestures grid
  const gestures = [
    { name: "Tap", desc: "Pojedyncze dotknięcie" },
    { name: "Swipe", desc: "Przesunięcie palcem" },
    { name: "Pinch", desc: "Szczypty do skalowania" },
    { name: "Long Press", desc: "Przytrzymanie" },
  ];
  gestures.forEach((g, i) => {
    const x = 0.3 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85, w: 2.1, h: 1.3,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addText(g.name, {
      x, y: 1.05, w: 2.1, h: 0.4,
      fontSize: 16, bold: true, color: C.accent2, fontFace: "Calibri", align: "center", margin: 0
    });
    s.addText(g.desc, {
      x, y: 1.5, w: 2.1, h: 0.3,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", align: "center", margin: 0
    });
  });

  // Zasady projektowania
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 2.3, w: 4.5, h: 2.85,
    fill: { color: "071420" }, line: { color: C.accent2 }
  });
  s.addText("Zasady Projektowania Dotykowego", {
    x: 0.5, y: 2.42, w: 4.1, h: 0.3,
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const zasady = [
    ["Strefa Kciuka", "Umieszczaj kluczowe elementy w zasięgu kciuka"],
    ["Rozmiar Celu", "Min. 44px (iOS) lub 48dp (Android)"],
    ["Feedback Dotykowy", "Haptyka i animacje potwierdzają akcje"],
  ];
  zasady.forEach(([t, b], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.82 + i * 0.72, w: 0.06, h: 0.55,
      fill: { color: C.accent2 }, line: { color: C.accent2 }
    });
    s.addText(t, {
      x: 0.65, y: 2.84 + i * 0.72, w: 3.9, h: 0.24,
      fontSize: 11, bold: true, color: C.accent2, fontFace: "Calibri", margin: 0
    });
    s.addText(b, {
      x: 0.65, y: 3.1 + i * 0.72, w: 3.9, h: 0.22,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right: Strefa kciuka
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Strefa Kciuka", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Użytkownicy trzymają telefon jedną ręką — kciuk obsługuje ekran. Trzy strefy dostępności:", {
    x: 5.3, y: 1.3, w: 4.1, h: 0.55,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  const zones = [
    { num: "1", label: "Łatwy Zasięg", desc: "Dolna część ekranu — najczęściej używane elementy", color: C.accent3 },
    { num: "2", label: "Strefa Rozciągania", desc: "Środkowa część — wymaga wysiłku, ale osiągalna", color: C.accent5 },
    { num: "3", label: "Trudny Zasięg", desc: "Górna część ekranu — rzadko używane funkcje", color: C.accent2 },
  ];
  zones.forEach((z, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.3, y: 2.0 + i * 0.96, w: 0.36, h: 0.36,
      fill: { color: z.color }, line: { color: z.color }
    });
    s.addText(z.num, {
      x: 5.3, y: 2.0 + i * 0.96, w: 0.36, h: 0.36,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    s.addText(z.label, {
      x: 5.75, y: 2.0 + i * 0.96, w: 3.8, h: 0.24,
      fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(z.desc, {
      x: 5.75, y: 2.26 + i * 0.96, w: 3.8, h: 0.6,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  addStatBox(s, 5.3, 4.3, 2.0, 0.72, "44px", "Min. cel dotykowy iOS", C.accent1);
  addStatBox(s, 7.5, 4.3, 2.0, 0.72, "48dp", "Min. cel dotykowy Android", C.accent3);

  addFooter(s, n, TOTAL);
  s.addNotes("TUI to podstawa każdej aplikacji mobilnej. Cztery podstawowe gesty: tap (najczęstszy), swipe (nawigacja, usuwanie), pinch (zoom), long press (menu kontekstowe). Strefa kciuka (thumb zone) to fundamentalne pojęcie w mobile UX — Steven Hoober zbadał, że 49% użytkowników trzyma telefon jedną ręką. Minimum rozmiary celów dotykowych: 44px na iOS (zgodnie z HIG Apple), 48dp na Android (Material Design). Analogia do świata fizycznego: klamki drzwiowe, przyciski w windzie — wszystko jest zaprojektowane pod ludzką rękę.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 12 — CLI i CUI
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "02 • CLI i CUI w Kontekście Mobilnym", C.accent2);

  // CLI card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 0.07, h: 4.3,
    fill: { color: C.accent4 }, line: { color: C.accent4 }
  });
  s.addText("CLI", {
    x: 0.5, y: 0.96, w: 1, h: 0.4,
    fontSize: 22, bold: true, color: C.accent4, fontFace: "Calibri", margin: 0
  });
  s.addText("Command Line Interface", {
    x: 0.5, y: 1.4, w: 4.1, h: 0.26,
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Interfejs tekstowy oparty na komendach. W aplikacjach mobilnych rzadki, ale istotny dla specjalistów.", {
    x: 0.5, y: 1.68, w: 4.1, h: 0.5,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });
  s.addText("Zastosowania mobilne:", {
    x: 0.5, y: 2.25, w: 4.1, h: 0.24,
    fontSize: 10.5, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  ["Termius, iSH — aplikacje terminalowe", "Narzędzia dla deweloperów", "Zarządzanie serwerami zdalnymi"].forEach((item, i) => {
    s.addText("— " + item, {
      x: 0.5, y: 2.52 + i * 0.32, w: 4.1, h: 0.28,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  addCode(s, 0.5, 3.52, 3.9, 1.2, "Terminal",
    "$ ssh user@server\n$ git commit -m \"update\"\n$ npm run build");

  // CUI card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 0.07, h: 4.3,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });
  s.addText("CUI", {
    x: 5.3, y: 0.96, w: 1, h: 0.4,
    fontSize: 22, bold: true, color: C.accent1, fontFace: "Calibri", margin: 0
  });
  s.addText("Conversational User Interface", {
    x: 5.3, y: 1.4, w: 4.1, h: 0.26,
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Interfejs konwersacyjny oparty na dialogu tekstowym. Chatboty i asystenci AI w aplikacjach mobilnych.", {
    x: 5.3, y: 1.68, w: 4.1, h: 0.5,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });
  s.addText("Zastosowania mobilne:", {
    x: 5.3, y: 2.25, w: 4.1, h: 0.24,
    fontSize: 10.5, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  ["Chatboty w aplikacjach bankowych", "Wsparcie techniczne (Zendesk, Intercom)", "Asystenci zakupowi w e-commerce", "Rezerwacje i umawianie wizyt"].forEach((item, i) => {
    s.addText("— " + item, {
      x: 5.3, y: 2.52 + i * 0.32, w: 4.1, h: 0.28,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  // Chat bubble
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.3, y: 3.75, w: 3.9, h: 0.45, rectRadius: 0.08,
    fill: { color: "1A3050" }, line: { color: "1A3050" }
  });
  s.addText("U: Chcę zresetować hasło", {
    x: 5.45, y: 3.78, w: 3.6, h: 0.36,
    fontSize: 10, color: C.white, fontFace: "Calibri", valign: "middle", margin: 0
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.3, y: 4.28, w: 3.9, h: 0.45, rectRadius: 0.08,
    fill: { color: "071E30" }, line: { color: "071E30" }
  });
  s.addText("B: Wyślę link resetujący na Twój email.", {
    x: 5.45, y: 4.31, w: 3.6, h: 0.36,
    fontSize: 10, color: C.accent1, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("CLI w mobile to nisza, ale ważna — Termius czy iSH są popularne wśród deweloperów. CUI (chatboty) to natomiast dynamicznie rozwijający się obszar — ChatGPT spopularyzował konwersacyjne interfejsy. Kluczowy trend: interfejsy hybrydowe GUI + CUI. Przykład: WhatsApp — typowe GUI, ale z elementami CUI w Business API. Dla programistów mobilnych: warto znać Dialogflow (Google), Wit.ai (Meta) lub OpenAI API do budowania CUI. Duże LLM rewolucjonizują ten obszar.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 03 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "03", "Zasady Projektowania UI/UX", "Fundamentalne reguły i heurystyki projektowania", C.accent3);
  addFooter(s, n, TOTAL);
  s.addNotes("Sekcja trzecia: zasady projektowania. To serce wykładu — naukowe i empiryczne podstawy, na których opiera się każdy dobry projekt interfejsu. Heurystyki Nielsena, prawo Hicka, zasada Fittsa, podejście Mobile First. Znając te zasady, podejmujesz lepsze decyzje projektowe, nawet bez wieloletniego doświadczenia.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 14 — 10 heurystyk Nielsena
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "03 • 10 Heurystyk Nielsena w Projektowaniu Mobilnym", C.accent3);

  const heuristics = [
    ["1", "Widoczność Statusu", "Użytkownik musi wiedzieć, co się dzieje. Loadery, toasty, paski postępu."],
    ["2", "Dopasowanie do Świata", "Używaj języka użytkownika. Realne metafory (kosz = usuwanie)."],
    ["3", "Kontrola i Wolność", "Użytkownik może cofnąć akcje. Undo, Cancel, Back button."],
    ["4", "Spójność i Standardy", "Podobne elementy działają podobnie. Platformowe wzorce iOS/Android."],
    ["5", "Zapobieganie Błędom", "Projektuj tak, by błędy były niemożliwe. Potwierdzenia destrukcyjnych akcji."],
    ["6", "Rozpoznawanie", "Użytkownik rozpoznaje, nie pamięta. Widoczne opcje, nie komendy."],
    ["7", "Elastyczność", "Skróty dla zaawansowanych. Gestury, gesty wielopalca."],
    ["8", "Estetyka i Minimalizm", "Tylko niezbędne elementy. Brak zbędnych elementów wizualnych."],
    ["9", "Pomoc w Błędach", "Jasne komunikaty błędów i rozwiązania. Nie \"Error 404\"."],
    ["10", "Dokumentacja", "Pomoc i dokumentacja. Onboarding, tooltips, FAQ."],
  ];

  const cols = 5;
  heuristics.forEach((h, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.3 + col * 1.88;
    const y = 0.88 + row * 2.2;
    const color = BARS[i % BARS.length];
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 1.75, h: 2.08,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.1, y: y + 0.1, w: 0.36, h: 0.36,
      fill: { color: color }, line: { color: color }
    });
    s.addText(h[0], {
      x: x + 0.1, y: y + 0.1, w: 0.36, h: 0.36,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText(h[1], {
      x: x + 0.12, y: y + 0.54, w: 1.51, h: 0.52,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(h[2], {
      x: x + 0.12, y: y + 1.08, w: 1.51, h: 0.88,
      fontSize: 8.5, color: C.body, fontFace: "Calibri", valign: "top", margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("10 heurystyk Nielsena z 1994 roku to nadal najważniejsze zasady projektowania interfejsów — potwierdzone dziesiątkami lat badań. Jakob Nielsen i Rolf Molich opracowali je analizując systemy desktopowe, ale doskonale przekładają się na mobile. Najważniejsze dla mobile to #1 (widoczność statusu — spinner, progress bar), #4 (spójność z platformą — nie wymyślaj na nowo), #5 (zapobieganie błędom — dialog \"Czy na pewno usunąć?\") i #8 (minimalizm — mniejszy ekran wymaga surowszej selekcji treści).");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 15 — Prawo Hicka
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "03 • Prawo Hicka w Projektowaniu Mobilnym", C.accent3);

  // Left
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Hick's Law", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 15, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Czas decyzji rośnie wraz z liczbą opcji. Im więcej wyborów, tym dłużej użytkownik potrzebuje na podjęcie decyzji.", {
    x: 0.5, y: 1.32, w: 4.1, h: 0.6,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  // Formula
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.0, w: 3.9, h: 1.0,
    fill: { color: C.code }, line: { color: "1E3A50" }
  });
  s.addText("Formuła matematyczna:", {
    x: 0.65, y: 2.07, w: 3.5, h: 0.24,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  s.addText("T = b × log₂(n + 1)", {
    x: 0.65, y: 2.32, w: 3.5, h: 0.42,
    fontSize: 20, bold: true, color: C.accent1, fontFace: "Calibri", margin: 0
  });
  s.addText("T = czas decyzji  |  n = liczba opcji  |  b = stała", {
    x: 0.65, y: 2.78, w: 3.5, h: 0.2,
    fontSize: 8.5, color: C.bodyDim, fontFace: "Consolas", margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 3.1, w: 0.07, h: 0.65,
    fill: { color: C.accent3 }, line: { color: C.accent3 }
  });
  s.addText("Wniosek: Podwojenie opcji nie podwaja czasu decyzji, ale zwiększa go logarytmicznie. W UX każda milisekunda ma znaczenie dla konwersji.", {
    x: 0.5, y: 3.12, w: 4.1, h: 0.62,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });

  addStatBox(s, 0.5, 3.9, 1.2, 0.72, "3–5", "Opt. liczba opcji w menu", C.accent3);
  addStatBox(s, 1.85, 3.9, 1.2, 0.72, "7±2", "Max elementów (Miller)", C.accent1);
  addStatBox(s, 3.2, 3.9, 1.2, 0.72, "30%", "Redukcja błędów (mniej opcji)", C.accent5);

  // Right: Praktyczne zastosowanie
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Praktyczne Zastosowanie", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const hickApps = [
    ["1", "Ograniczanie Opcji w Menu", "Pokazuj tylko najważniejsze opcje. Resztę ukryj w \"Więcej\" lub podmenu."],
    ["2", "Progresywne Ujawnianie", "Pokazuj zaawansowane opcje tylko gdy użytkownik ich potrzebuje."],
    ["3", "Grupowanie Opcji", "Organizuj opcje w kategorie — zmniejsza pozorną liczbę wyborów."],
    ["4", "Domyślne Wartości", "Ustawiaj sensowne wartości domyślne, redukując konieczność wyboru."],
  ];
  hickApps.forEach(([num, title, body], i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.3, y: 1.38 + i * 0.78, w: 0.32, h: 0.32,
      fill: { color: C.accent3 }, line: { color: C.accent3 }
    });
    s.addText(num, {
      x: 5.3, y: 1.38 + i * 0.78, w: 0.32, h: 0.32,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText(title, {
      x: 5.72, y: 1.38 + i * 0.78, w: 3.8, h: 0.24,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 5.72, y: 1.62 + i * 0.78, w: 3.8, h: 0.46,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  // Examples
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.5, w: 4.6, h: 0.65,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Przykłady: Google Search — jedno pole  |  Netflix — 6 kategorii na ekranie  |  Amazon — stopniowe filtry", {
    x: 5.25, y: 4.55, w: 4.3, h: 0.52,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Prawo Hicka (William Edmund Hick, 1952) jest fundamentem projektowania nawigacji mobilnej. Kluczowy insight: Tab Bar na iOS ma maksymalnie 5 pozycji — to nie przypadek, to zastosowanie prawa Hicka. Analogia: menu restauracji — im grubsze menu, tym trudniej wybrać. Najlepsze restauracje mają krótkie, skomponowane karty. Google Search to najbardziej ekstremalny przykład: jeden element na stronie — czas decyzji = 0. Magic number 7±2 George'a Millera dotyczy pamięci operacyjnej, ale jest powiązany koncepcyjnie.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 16 — Zasada Fittsa
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "03 • Prawo Fittsa i Projektowanie Dotykowe", C.accent3);

  // Left
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Fitts's Law", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 15, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Czas dotarcia do celu zależy od jego wielkości i odległości. Im większy cel i bliżej użytkownika, tym szybciej w niego trafi.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.6,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.0, w: 3.9, h: 1.0,
    fill: { color: C.code }, line: { color: "1E3A50" }
  });
  s.addText("Formuła matematyczna:", {
    x: 0.65, y: 2.07, w: 3.5, h: 0.24,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  s.addText("T = a + b × log₂(2D/W)", {
    x: 0.65, y: 2.32, w: 3.5, h: 0.42,
    fontSize: 18, bold: true, color: C.accent1, fontFace: "Calibri", margin: 0
  });
  s.addText("T = czas ruchu  |  D = odległość  |  W = szerokość celu", {
    x: 0.65, y: 2.78, w: 3.5, h: 0.2,
    fontSize: 8.5, color: C.bodyDim, fontFace: "Consolas", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 3.1, w: 0.07, h: 0.65,
    fill: { color: C.accent3 }, line: { color: C.accent3 }
  });
  s.addText("Wniosek: Większe cele są łatwiejsze do trafienia. Elementy często używane powinny być większe i bliżej naturalnej pozycji palca.", {
    x: 0.5, y: 3.12, w: 4.1, h: 0.62,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  addStatBox(s, 0.5, 3.9, 1.8, 0.72, "44px", "Min. cel dotykowy iOS", C.accent1);
  addStatBox(s, 2.5, 3.9, 1.8, 0.72, "48dp", "Min. cel dotykowy Android", C.accent3);

  // Right
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Implikacje dla Mobile", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const fittsApps = [
    ["1", "Rozmiar Celów Dotykowych", "Interaktywne elementy min. 44–48px. Ikony mogą być mniejsze, ale obszar dotykowy musi być wystarczający."],
    ["2", "Strefa Kciuka", "Umieszczaj kluczowe elementy w dolnej połowie ekranu. Górna część dla rzadziej używanych funkcji."],
    ["3", "Odstępy Między Elementami", "Min. 8px między celami dotykowymi — zapobiega przypadkowym dotknięciom."],
    ["4", "Rozmieszczenie CTA", "Główne przyciski akcji duże i w dolnej części ekranu — łatwy dostęp kciukiem."],
  ];
  fittsApps.forEach(([num, title, body], i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.3, y: 1.38 + i * 0.78, w: 0.32, h: 0.32,
      fill: { color: C.accent3 }, line: { color: C.accent3 }
    });
    s.addText(num, {
      x: 5.3, y: 1.38 + i * 0.78, w: 0.32, h: 0.32,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText(title, {
      x: 5.72, y: 1.38 + i * 0.78, w: 3.8, h: 0.24,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 5.72, y: 1.62 + i * 0.78, w: 3.8, h: 0.46,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.5, w: 4.6, h: 0.65,
    fill: { color: "071420" }, line: { color: C.accent5 }
  });
  s.addText("Edge Swiping: Systemowe gesty z krawędzi ekranu mają priorytet. Unikaj ważnych elementów przy krawędziach — zostaw marginesy bezpieczeństwa.", {
    x: 5.25, y: 4.55, w: 4.3, h: 0.52,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Prawo Fittsa (Paul Fitts, 1954) pochodzi z psychologii motorycznej i perfekcyjnie opisuje interakcje dotykowe. Kluczowa implikacja: przyciski CTA powinny być duże i na dole ekranu — dokładnie tak robi Apple Pay, Google Pay, większość aplikacji zakupowych. Paradoks narożnika: narożniki i krawędzie ekranu mają efektywnie nieskończoną szerokość (nie możesz przesunąć palca za ekran), ale iOS/Android zarezerwowały te obszary dla systemowych gestów.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 17 — Mobile First
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "03 • Mobile First Design Principles", C.accent3);

  // Top: two comparison blocks
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 2.1,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 0.07, h: 2.1,
    fill: { color: C.accent3 }, line: { color: C.accent3 }
  });
  s.addText("Progressive Enhancement", {
    x: 0.5, y: 0.95, w: 4.1, h: 0.3,
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Zacznij od podstaw, dodawaj funkcje dla większych ekranów. Solidna podstawa + rozszerzenia. Nowoczesne podejście — zalecane.", {
    x: 0.5, y: 1.28, w: 4.1, h: 0.7,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.18, w: 0.6, h: 0.24,
    fill: { color: C.accent3 }, line: { color: C.accent3 }
  });
  s.addText("✓ Zalecane", {
    x: 0.5, y: 2.18, w: 0.6, h: 0.24,
    fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 0.85, w: 4.5, h: 2.1,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 0.85, w: 0.07, h: 2.1,
    fill: { color: C.bodyDim }, line: { color: C.bodyDim }
  });
  s.addText("Graceful Degradation", {
    x: 5.4, y: 0.95, w: 4.1, h: 0.3,
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Zacznij od pełnej wersji desktop, upraszczaj dla mniejszych ekranów. Starsze podejście — mniej efektywne i kosztowne.", {
    x: 5.4, y: 1.28, w: 4.1, h: 0.7,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.4, y: 2.18, w: 0.6, h: 0.24,
    fill: { color: "444444" }, line: { color: "444444" }
  });
  s.addText("Starsze", {
    x: 5.4, y: 2.18, w: 0.6, h: 0.24,
    fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
  });

  // Stat bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 3.1, w: 9.4, h: 0.5,
    fill: { color: "071420" }, line: { color: C.accent3 }
  });
  s.addText("Dlaczego Mobile First? — 58% ruchu internetowego pochodzi z urządzeń mobilnych. Projektując od desktopu, pomijasz większość użytkowników.", {
    x: 0.5, y: 3.17, w: 9.1, h: 0.36,
    fontSize: 10, color: C.body, fontFace: "Calibri", valign: "middle", margin: 0
  });

  // 4 principles
  const principles = [
    { num: "1", title: "Priorytetyzacja Treści", body: "Pokaż tylko to, co niezbędne. Każdy element musi mieć jasny cel.", color: C.accent1 },
    { num: "2", title: "Progressive Enhancement", body: "Dodawaj funkcje i treści w miarę wzrostu dostępnej przestrzeni.", color: C.accent3 },
    { num: "3", title: "Responsive Layout", body: "Elastyczne siatki, obrazy i media queries dla różnych breakpointów.", color: C.accent2 },
    { num: "4", title: "Touch-Friendly UI", body: "Projektuj pod dotyk, nie myszkę. Odpowiednie rozmiary i odstępy.", color: C.accent4 },
  ];
  principles.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3 + i * 2.38, y: 3.72, w: 2.2, h: 1.44,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.OVAL, {
      x: 0.45 + i * 2.38, y: 3.83, w: 0.32, h: 0.32,
      fill: { color: p.color }, line: { color: p.color }
    });
    s.addText(p.num, {
      x: 0.45 + i * 2.38, y: 3.83, w: 0.32, h: 0.32,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    s.addText(p.title, {
      x: 0.45 + i * 2.38, y: 4.22, w: 2.0, h: 0.3,
      fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(p.body, {
      x: 0.45 + i * 2.38, y: 4.54, w: 2.0, h: 0.55,
      fontSize: 9, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Mobile First to filozofia, nie tylko technika. Luke Wroblewski spopularyzował pojęcie w 2009 roku. Kluczowe przesłanie: ograniczenia mobilne wymuszają lepsze decyzje projektowe. Gdy masz mało miejsca, musisz wybrać, co jest naprawdę ważne. Statystyki są nieubłagane: w Polsce ponad 60% ruchu webowego pochodzi z mobile (dane GUS 2025). Progressive Enhancement to nie tylko teoria — oznacza, że baseline funkcja działa na najsłabszym urządzeniu, a bogatsza wersja na mocniejszym.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 04 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "04", "Standardy Branżowe", "Oficjalne wytyczne i guidelines platform mobilnych", C.accent4);
  addFooter(s, n, TOTAL);
  s.addNotes("Sekcja czwarta: standardy branżowe. Każda platforma mobilna ma własny zestaw wytycznych projektowych. iOS HIG (Human Interface Guidelines), Material Design dla Android oraz WCAG dla dostępności — to dokumenty, które każdy programista mobilny powinien znać. Są nie tylko zaleceniami estetykami, ale często warunkiem przyjęcia aplikacji do App Store.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 19 — iOS HIG
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "04 • iOS Human Interface Guidelines", C.accent4);

  // Three pillars
  const pillars = [
    { title: "Clarity (Klarowność)", body: "Tekst czytelny, ikony precyzyjne, grafika ostra. Użytkownik rozumie interfejs na pierwszy rzut oka.", tags: ["Czytelna typografia", "Precyzyjne ikony"] },
    { title: "Deference (Ustępowanie)", body: "Interfejs nie dominuje nad treścią. Treść jest na pierwszym planie, UI wspiera i nie rozprasza.", tags: ["Minimalizm", "Transparentność"] },
    { title: "Depth (Głębia)", body: "Warstwy wizualne i realistyczne ruchy tworzą hierarchię i sens przestrzenny.", tags: ["Warstwy", "Animacje"] },
  ];
  pillars.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 0.85 + i * 1.28, w: 4.5, h: 1.18,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 0.85 + i * 1.28, w: 0.07, h: 1.18,
      fill: { color: C.accent4 }, line: { color: C.accent4 }
    });
    s.addText(p.title, {
      x: 0.5, y: 0.95 + i * 1.28, w: 4.1, h: 0.28,
      fontSize: 12.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(p.body, {
      x: 0.5, y: 1.26 + i * 1.28, w: 4.1, h: 0.52,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
    p.tags.forEach((tag, j) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.5 + j * 1.4, y: 1.73 + i * 1.28, w: 1.2, h: 0.22, rectRadius: 0.04,
        fill: { color: "1A3050" }, line: { color: C.accent4 }
      });
      s.addText(tag, {
        x: 0.5 + j * 1.4, y: 1.73 + i * 1.28, w: 1.2, h: 0.22,
        fontSize: 8, color: C.accent4, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
      });
    });
  });

  // Right: Kluczowe elementy
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Kluczowe Elementy", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const higItems = [
    ["Systemowe Komponenty UI", "Używaj natywnych komponentów iOS — UIButton, UITableView, SwiftUI components"],
    ["Gestury", "Swipe back, pull-to-refresh, pinch-to-zoom — standardowe gesty iOS"],
    ["Dark Mode", "Wsparcie dla trybu ciemnego od iOS 13. Dynamiczne kolory systemowe."],
    ["Adaptacja do Rozmiarów", "Auto Layout, Size Classes — responsywność na iPhone i iPad"],
    ["San Francisco Font", "Systemowa czcionka zoptymalizowana dla czytelności na ekranach Apple"],
  ];
  higItems.forEach(([title, body], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 1.38 + i * 0.64, w: 0.06, h: 0.5,
      fill: { color: C.accent4 }, line: { color: C.accent4 }
    });
    s.addText(title, {
      x: 5.45, y: 1.4 + i * 0.64, w: 4.05, h: 0.22,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 5.45, y: 1.64 + i * 0.64, w: 4.05, h: 0.22,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.6, w: 4.6, h: 0.55,
    fill: { color: "071420" }, line: { color: C.accent2 }
  });
  s.addText("Najczęstsze Błędy:  Ignorowanie systemowych gestów  |  Niestandardowe komponenty bez potrzeby  |  Brak Dark Mode", {
    x: 5.25, y: 4.65, w: 4.3, h: 0.42,
    fontSize: 9, color: C.accent2, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("iOS HIG to biblia projektowania na platformę Apple. Trzy filary (Clarity, Deference, Depth) definiują filozofię Apple od ponad dekady. Ważna praktyczna wskazówka: App Store Review odrzuca aplikacje naruszające HIG. Recenzenci sprawdzają m.in.: czy swipe back działa (Deference — użytkownik musi mieć kontrolę), czy ikony są skalowalne, czy obsługiwany jest Dynamic Type. Aktualna wersja HIG jest dostępna na developer.apple.com/design — i jest regularnie aktualizowana z każdą wersją iOS.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 20 — Material Design
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "04 • Material Design Guidelines", C.accent4);

  // Left: filozofia
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Filozofia Material Design", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Material Design to język wizualny stworzony przez Google, inspirowany fizycznymi właściwościami materiałów — głębią, cieniami, oświetleniem.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.65,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  const mdPrinciples = [
    ["Material jako Metafory", "Elementy UI mają grubość, rzucają cienie, reagują na światło — realistyczna hierarchia."],
    ["Pogrubione, Graficzne, Celowe", "Typografia, kolor i przestrzeń tworzą wyraźną hierarchię. Każdy element ma cel."],
    ["Ruch Daje Znaczenie", "Animacje nie są dekoracją — informują o zmianach stanu i relacjach między elementami."],
  ];
  mdPrinciples.forEach(([title, body], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.1 + i * 1.0, w: 3.9, h: 0.88,
      fill: { color: "0D2035" }, line: { color: "1A3050" }
    });
    s.addText(title, {
      x: 0.65, y: 2.15 + i * 1.0, w: 3.6, h: 0.28,
      fontSize: 11, bold: true, color: C.accent4, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 0.65, y: 2.45 + i * 1.0, w: 3.6, h: 0.45,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right: Kluczowe elementy
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Kluczowe Elementy", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const mdItems = [
    ["Elevation (Wysokość)", "Cienie tworzą hierarchię. Im wyżej element, tym większy cień (0–24dp)."],
    ["Kolorystyka", "Primary, Secondary, Surface, Background, Error — system kolorów z rolami."],
    ["Typografia Roboto", "6 stylów: Headline, Subtitle, Body, Caption, Button, Overline."],
    ["Komponenty Material", "Cards, Buttons, Text Fields, Chips, Bottom Navigation — gotowe komponenty."],
    ["Dark Theme", "Wsparcie dla ciemnego motywu od Material Design 2.0 — Material You 3."],
  ];
  mdItems.forEach(([title, body], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 1.38 + i * 0.64, w: 0.06, h: 0.5,
      fill: { color: C.accent4 }, line: { color: C.accent4 }
    });
    s.addText(title, {
      x: 5.45, y: 1.4 + i * 0.64, w: 4.05, h: 0.22,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 5.45, y: 1.64 + i * 0.64, w: 4.05, h: 0.22,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.6, w: 4.6, h: 0.55,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("iOS vs Material: iOS płaski i minimalistyczny  |  Material: głębia, cienie, animacje  |  Dokumentacja: material.io", {
    x: 5.25, y: 4.65, w: 4.3, h: 0.42,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Material Design wprowadzono w 2014 roku jako Google I/O keynote. Material You (Material Design 3) z 2021 roku wprowadził dynamiczne kolory — palette generowana z wallpapera użytkownika. To duże przejście: z jednolitego brandingu do personalizacji. Dla Kotlin/Compose: biblioteka Material3 w Compose jest oficjalną implementacją. Warto wspomnieć, że Material Design jest open source i używany nie tylko na Android — Gmail web, Google Docs, Google Maps — wszystkie używają Material.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 21 — WCAG
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "04 • WCAG i Dostępność w Aplikacjach Mobilnych", C.accent4);

  // POUR zasady
  const pour = [
    { letter: "P", full: "Perceivable (Postrzegalny)", body: "Użytkownik może postrzegać informacje. Kontrast, alternatywny tekst, podpisy dla multimediów.", color: C.accent1 },
    { letter: "O", full: "Operable (Operatywny)", body: "Interfejs można obsługiwać. Rozmiar celów, gesty, wystarczający czas na akcje.", color: C.accent3 },
    { letter: "U", full: "Understandable (Zrozumiały)", body: "Treść i nawigacja są zrozumiałe. Język, spójność, pomoc w błędach.", color: C.accent5 },
    { letter: "R", full: "Robust (Solidny)", body: "Działa z różnymi technologiami. Kompatybilność z czytnikami ekranu VoiceOver/TalkBack.", color: C.accent2 },
  ];
  pour.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 0.85 + i * 1.1, w: 4.5, h: 0.95,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 0.85 + i * 1.1, w: 0.55, h: 0.95,
      fill: { color: p.color }, line: { color: p.color }
    });
    s.addText(p.letter, {
      x: 0.3, y: 0.85 + i * 1.1, w: 0.55, h: 0.95,
      fontSize: 32, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText(p.full, {
      x: 0.98, y: 0.92 + i * 1.1, w: 3.7, h: 0.26,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(p.body, {
      x: 0.98, y: 1.2 + i * 1.1, w: 3.7, h: 0.48,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right: Wymagania
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Wymagania Konkretne", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });

  // Contrast
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 1.35, w: 4.1, h: 1.0,
    fill: { color: "0D2035" }, line: { color: "1A3050" }
  });
  s.addText("Kontrast Kolorów", {
    x: 5.5, y: 1.42, w: 3.7, h: 0.26,
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("4.5:1 — tekst normalny   |   3:1 — duży tekst (18pt+)   |   3:1 — elementy interfejsu", {
    x: 5.5, y: 1.7, w: 3.7, h: 0.22,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });
  addStatBox(s, 5.5, 1.98, 1.7, 0.35, "4.5:1", "Tekst normalny", C.accent3);
  addStatBox(s, 7.35, 1.98, 1.7, 0.35, "3:1", "Duży tekst / UI", C.accent5);

  // Touch targets
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 2.42, w: 4.1, h: 0.8,
    fill: { color: "0D2035" }, line: { color: "1A3050" }
  });
  s.addText("Rozmiar Celów Dotykowych", {
    x: 5.5, y: 2.5, w: 3.7, h: 0.24,
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("24×24px — minimalny (WCAG 2.2)   |   44×44px — zalecany (iOS HIG)", {
    x: 5.5, y: 2.76, w: 3.7, h: 0.22,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });

  // Dynamic text
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 3.3, w: 4.1, h: 0.75,
    fill: { color: "0D2035" }, line: { color: "1A3050" }
  });
  s.addText("Dynamiczny Tekst", {
    x: 5.5, y: 3.37, w: 3.7, h: 0.24,
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Aplikacja musi wspierać ustawienia systemowe dla rozmiaru tekstu (do 200%). iOS: Dynamic Type, Android: Scalable Text.", {
    x: 5.5, y: 3.63, w: 3.7, h: 0.38,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });

  // Tools
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.13, w: 4.6, h: 1.02,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Narzędzia Testujące:", {
    x: 5.3, y: 4.2, w: 2, h: 0.24,
    fontSize: 10, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  ["Accessibility Scanner (Android)", "Xcode Accessibility Inspector", "Stark Plugin (Figma)", "axe DevTools"].forEach((tool, i) => {
    s.addText("— " + tool, {
      x: 5.3 + (i % 2) * 2.3, y: 4.47 + Math.floor(i / 2) * 0.32, w: 2.2, h: 0.28,
      fontSize: 9, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("WCAG (Web Content Accessibility Guidelines) wydane przez W3C — standard globalny, stosowany również do aplikacji mobilnych. WCAG 2.2 to aktualna wersja z 2023 roku, WCAG 3.0 jest w fazie opracowywania. Dostępność to nie tylko kwestia etyczna — w UE dyrektywa o dostępności cyfrowej (EAA 2025) zobowiązuje firmy do spełnienia standardów dostępności pod karą finansową. Praktyczna wskazówka: Xcode Accessibility Inspector pozwala testować VoiceOver bez fizycznego urządzenia. Android Studio ma podobne narzędzia.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 05 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "05", "Dobór Kolorów i Psychologia Barw", "Teoria kolorów i jej zastosowanie w projektowaniu mobilnym", C.accent5);
  addFooter(s, n, TOTAL);
  s.addNotes("Sekcja piąta: kolory. Kolor to jeden z najsilniejszych narzędzi projektowych. Wpływa na emocje, hierarchię, dostępność i tożsamość marki. Omówimy teorię kolorów, psychologię barw, dark mode oraz systemy kolorystyczne.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 23 — Teoria kolorów
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "05 • Teoria Kolorów w Projektowaniu Mobilnym", C.accent5);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Podstawy Teorii Kolorów", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Koło Kolorów:", {
    x: 0.5, y: 1.35, w: 4.1, h: 0.24,
    fontSize: 11, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  s.addText("3 podstawowe (czerwony, niebieski, żółty), 3 pochodne (pomarańczowy, zielony, fioletowy), 6 trzeciorzędowych.", {
    x: 0.5, y: 1.6, w: 4.1, h: 0.42,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });
  // Color circles
  const colors = ["E53935", "1E88E5", "FDD835", "FB8C00", "43A047", "8E24AA"];
  colors.forEach((c, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 0.5 + i * 0.66, y: 2.08, w: 0.52, h: 0.52,
      fill: { color: c }, line: { color: c }
    });
  });

  const schemes = [
    ["Monochromatyczny", "Wariacje jednego koloru"],
    ["Analogiczny", "Kolory sąsiadujące na kole"],
    ["Komplementarny", "Kolory przeciwne na kole"],
    ["Triadowy", "Trzy równomiernie rozłożone"],
  ];
  s.addText("Schematy Kolorystyczne:", {
    x: 0.5, y: 2.72, w: 4.1, h: 0.24,
    fontSize: 11, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  schemes.forEach(([t, b], i) => {
    s.addText(t + ": ", {
      x: 0.5, y: 3.0 + i * 0.32, w: 1.5, h: 0.26,
      fontSize: 10, bold: true, color: C.accent5, fontFace: "Calibri", margin: 0
    });
    s.addText(b, {
      x: 2.0, y: 3.0 + i * 0.32, w: 2.6, h: 0.26,
      fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  addStatBox(s, 0.5, 4.3, 1.8, 0.72, "60–30–10", "Zasada proporcji kolorów", C.accent5);
  addStatBox(s, 2.5, 4.3, 1.8, 0.72, "Adobe Color", "Narzędzie do doboru", C.accent1);

  // Right
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Zastosowanie w Mobile", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const colorApps = [
    { t: "Tożsamość Marki", b: "Kolory budują rozpoznawalność. Spójność kolorystyczna we wszystkich punktach styku.", c: C.accent1 },
    { t: "Kierowanie Uwagą", b: "Kontrastowe kolory przyciągają do kluczowych elementów (CTA, powiadomienia).", c: C.accent2 },
    { t: "Tworzenie Nastroju", b: "Kolory wpływają na emocje. Niebieski = spokój, czerwony = pilność i działanie.", c: C.accent3 },
    { t: "Dostępność", b: "Odpowiedni kontrast dla osób z wadami wzroku. Nie polegaj tylko na kolorze!", c: C.accent4 },
  ];
  colorApps.forEach((item, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 1.4 + i * 0.72, w: 0.06, h: 0.55,
      fill: { color: item.c }, line: { color: item.c }
    });
    s.addText(item.t, {
      x: 5.45, y: 1.42 + i * 0.72, w: 4.05, h: 0.24,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(item.b, {
      x: 5.45, y: 1.68 + i * 0.72, w: 4.05, h: 0.38,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.35, w: 4.6, h: 0.8,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Narzędzia: Coolors.co  |  Color Hunt  |  Material Palette  |  Stark (kontrast)", {
    x: 5.25, y: 4.42, w: 4.3, h: 0.65,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Zasada 60-30-10 to prosta heurystyka: 60% dominujący kolor tła, 30% kolor uzupełniający, 10% kolor akcentu/CTA. Modele kolorów istotne dla deweloperów: RGB (ekrany), HSL (programowanie, Compose Color), HEX (web/design). W Compose: Color(0xFF0071E3). Ważna zasada dostępności: nie przekazuj informacji WYŁĄCZNIE przez kolor — zawsze dodaj ikonę, tekst lub kształt jako drugi kanał informacji (color-blind users stanowią ok. 8% mężczyzn).");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 24 — Psychologia kolorów
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "05 • Psychologia Kolorów i Emocje", C.accent5);

  const colorsData = [
    { name: "Czerwień", hex: "E53935", emocje: "Podekscytowanie, pilność, pasja", zastosowanie: "CTA, alerty, promocje", przyklad: "YouTube, Netflix, Coca-Cola", note: "Zwiększa tętno, pobudza do działania" },
    { name: "Niebieski", hex: "1E88E5", emocje: "Zaufanie, spokój, profesjonalizm", zastosowanie: "Bankowość, technologia", przyklad: "Facebook, LinkedIn, PayPal", note: "Najbardziej lubiany kolor globalnie" },
    { name: "Zieleń", hex: "43A047", emocje: "Natura, wzrost, sukces, harmonia", zastosowanie: "Ekologia, zdrowie, finanse", przyklad: "WhatsApp, Spotify, Starbucks", note: "Relaksujący dla oczu, symbolizuje wzrost" },
    { name: "Żółty", hex: "FDD835", emocje: "Optymizm, energia, kreatywność", zastosowanie: "Ostrzeżenia, promocje", przyklad: "Snapchat, IKEA, McDonald's", note: "Przyciąga uwagę, ale może męczyć" },
    { name: "Pomarańczowy", hex: "FB8C00", emocje: "Entuzjazm, kreatywność, przyjaźń", zastosowanie: "CTA, akcje, zabawa", przyklad: "Amazon, Firefox, Fanta", note: "Mniej agresywny niż czerwień" },
    { name: "Fiolet", hex: "8E24AA", emocje: "Luksus, kreatywność, duchowość", zastosowanie: "Luksusowe marki, beauty", przyklad: "Twitch, Yahoo, Cadbury", note: "Historycznie kolor królewski" },
  ];

  colorsData.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 3.15;
    const y = 0.85 + row * 2.2;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.0, h: 2.08,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.12, y: y + 0.12, w: 0.52, h: 0.52,
      fill: { color: c.hex }, line: { color: c.hex }
    });
    s.addText(c.name, {
      x: x + 0.75, y: y + 0.16, w: 2.12, h: 0.36,
      fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText("Emocje: ", {
      x: x + 0.15, y: y + 0.75, w: 0.7, h: 0.22,
      fontSize: 9, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
    });
    s.addText(c.emocje, {
      x: x + 0.82, y: y + 0.75, w: 2.05, h: 0.22,
      fontSize: 9, color: C.body, fontFace: "Calibri", margin: 0
    });
    s.addText("Zastosowanie: ", {
      x: x + 0.15, y: y + 1.0, w: 0.9, h: 0.22,
      fontSize: 9, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
    });
    s.addText(c.zastosowanie, {
      x: x + 1.02, y: y + 1.0, w: 1.85, h: 0.22,
      fontSize: 9, color: C.body, fontFace: "Calibri", margin: 0
    });
    s.addText("Przykłady: ", {
      x: x + 0.15, y: y + 1.25, w: 0.7, h: 0.22,
      fontSize: 9, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
    });
    s.addText(c.przyklad, {
      x: x + 0.82, y: y + 1.25, w: 2.05, h: 0.22,
      fontSize: 9, color: C.body, fontFace: "Calibri", margin: 0
    });
    s.addText(c.note, {
      x: x + 0.15, y: y + 1.6, w: 2.72, h: 0.36,
      fontSize: 8.5, color: C.bodyDim, fontFace: "Calibri", italic: true, margin: 0
    });
  });

  // Bottom note
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 5.1, w: 9.4, h: 0.28,
    fill: { color: "071420" }, line: { color: C.accent5 }
  });
  s.addText("Uwaga kulturowa: Kolory mają różne znaczenia w różnych kulturach — biały = żałoba w Azji, czerwień = szczęście w Chinach. Projektując globalnie, badaj kontekst kulturowy.", {
    x: 0.5, y: 5.12, w: 9.1, h: 0.24,
    fontSize: 8.5, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Psychologia kolorów to nauka z ponad stuletnią historią. Ciekawostka: badania pokazują, że czerwony kolor przycisków CTA może zwiększyć konwersję o 21% w porównaniu do zielonego — choć kontekst ma ogromne znaczenie. Niebieski jest najczęściej wybieranym kolorem aplikacji finansowych (zaufanie, bezpieczeństwo). Zielony dla potwierdzenia i sukcesu to konwencja tak głęboko zakorzeniona, że jej zmiana jest zawsze ryzykowna. Warto wspomnieć o color blindness: ok. 8% mężczyzn ma problem z rozróżnianiem czerwieni i zieleni.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 25 — Dark Mode
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "05 • Tryb Jasny i Ciemny — Best Practices", C.accent5);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Projektowanie Dark Mode", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const darkRules = [
    { t: "Unikaj Czystej Czerni", b: "#000000 jest zbyt mocny. Używaj ciemnoszarych: #121212, #1E1E1E, #2D2D2D" },
    { t: "Kontrast i Dostępność", b: "Zachowaj te same wymagania kontrastu co w trybie jasnym (4.5:1 dla tekstu)." },
    { t: "Desaturacja Kolorów", b: "Nasycone kolory wibrują na ciemnym tle. Używaj wersji z niższą saturacją." },
    { t: "Elevation przez Jasność", b: "Zamiast cieni (niewidocznych na czerni), używaj jaśniejszych odcieni dla wyższych warstw." },
  ];
  darkRules.forEach(([, obj], i) => {
    const rule = darkRules[i];
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 1.38 + i * 0.8, w: 0.07, h: 0.65,
      fill: { color: C.accent5 }, line: { color: C.accent5 }
    });
    s.addText(rule.t, {
      x: 0.5, y: 1.4 + i * 0.8, w: 4.1, h: 0.26,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(rule.b, {
      x: 0.5, y: 1.68 + i * 0.8, w: 4.1, h: 0.38,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right: comparison + tips
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Porównanie Trybów", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  // Light mode mock
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 1.35, w: 1.9, h: 1.5,
    fill: { color: "F5F5F5" }, line: { color: "DDDDDD" }
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.42, y: 1.45, w: 1.66, h: 0.28, fill: { color: "DDDDDD" }, line: { color: "DDDDDD" } });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.42, y: 1.82, w: 1.66, h: 0.28, fill: { color: "EEEEEE" }, line: { color: "EEEEEE" } });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.42, y: 2.18, w: 1.66, h: 0.48, fill: { color: "E8E8E8" }, line: { color: "E8E8E8" } });
  s.addText("Light Mode", {
    x: 5.3, y: 2.9, w: 1.9, h: 0.24,
    fontSize: 9.5, color: C.bodyDim, fontFace: "Calibri", align: "center", margin: 0
  });

  // Dark mode mock
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.4, y: 1.35, w: 1.9, h: 1.5,
    fill: { color: "1E1E1E" }, line: { color: "333333" }
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.52, y: 1.45, w: 1.66, h: 0.28, fill: { color: "2D2D2D" }, line: { color: "2D2D2D" } });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.52, y: 1.82, w: 1.66, h: 0.28, fill: { color: "383838" }, line: { color: "383838" } });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.52, y: 2.18, w: 1.66, h: 0.48, fill: { color: "252525" }, line: { color: "252525" } });
  s.addText("Dark Mode", {
    x: 7.4, y: 2.9, w: 1.9, h: 0.24,
    fontSize: 9.5, color: C.bodyDim, fontFace: "Calibri", align: "center", margin: 0
  });

  const lightDarkTips = [
    ["Unikaj Czystej Bieli", "Używaj #FFFFFF tylko dla najważniejszego tekstu. Standard: #E0E0E0–#FFFFFF."],
    ["Testuj na OLED", "Ekrany OLED renderują kolory inaczej niż LCD. Testuj na obu typach."],
    ["Respektuj Ustawienia", "Aplikacja powinna automatycznie dostosować się do ustawień systemowych."],
  ];
  lightDarkTips.forEach(([t, b], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 3.2 + i * 0.52, w: 0.06, h: 0.42,
      fill: { color: C.accent5 }, line: { color: C.accent5 }
    });
    s.addText(t, {
      x: 5.45, y: 3.22 + i * 0.52, w: 4.05, h: 0.2,
      fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(b, {
      x: 5.45, y: 3.43 + i * 0.52, w: 4.05, h: 0.22,
      fontSize: 9, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.75, w: 4.6, h: 0.4,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Zalety Dark Mode: Oszczędność baterii (OLED)  |  Mniejsze zmęczenie wzroku  |  Lepszy nocny użytek", {
    x: 5.25, y: 4.78, w: 4.3, h: 0.34,
    fontSize: 8.5, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Dark Mode to nie tylko trend estetyczny. Na ekranach OLED (iPhone X+, Samsung Galaxy, większość flagowców Android) każdy czarny piksel dosłownie zużywa zero energii — YouTube zaoszczędził do 60% energii ekranu przy Dark Mode. Implementacja w Compose: MaterialTheme z DarkColorScheme, isSystemInDarkTheme(). W iOS: semantyczne kolory systemowe (Color(.label), Color(.systemBackground)) automatycznie dostosowują się do trybu. Błąd: używanie hardcoded koloru #000000 jako tła w dark mode — jest zbyt kontrastowy i 'twardy' dla wzroku.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 26 — Design Tokens
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "05 • Systemy Kolorów i Palety w Aplikacjach", C.accent5);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Budowanie Systemu Kolorów", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const colorRoles = [
    { t: "Kolory Podstawowe (Primary)", b: "Główne kolory marki. CTA, aktywne stany. Zazwyczaj 1–2 kolory.", c: C.accent1 },
    { t: "Kolory Drugorzędne (Secondary)", b: "Uzupełniające primary. Mniej dominujące, wspierają hierarchię.", c: C.accent2 },
    { t: "Kolory Funkcjonalne", b: "Sukces (zielony), Błąd (czerwony), Ostrzeżenie (żółty), Informacja (niebieski).", c: C.accent3 },
    { t: "Kolory Neutralne", b: "Szarości dla tekstu, tła, obramowań. Zazwyczaj 8–10 odcieni szarości.", c: C.bodyDim },
  ];
  colorRoles.forEach((role, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 1.4 + i * 0.82, w: 0.07, h: 0.7,
      fill: { color: role.c }, line: { color: role.c }
    });
    s.addText(role.t, {
      x: 0.5, y: 1.42 + i * 0.82, w: 4.1, h: 0.26,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(role.b, {
      x: 0.5, y: 1.7 + i * 0.82, w: 4.1, h: 0.38,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right: Design Tokens
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Design Tokens", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Design Tokens to zmienne przechowujące wartości wizualne. Umożliwiają spójność i łatwą aktualizację w całym projekcie.", {
    x: 5.3, y: 1.3, w: 4.1, h: 0.55,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  addCode(s, 5.3, 1.9, 4.1, 1.5, "Design Tokens",
    "// Przykład Design Tokens\n$color-primary: #0071E3;\n$color-text-primary: #1D1D1D;\n$color-background: #FAFAFA;\n$spacing-md: 16px;\n$border-radius: 8px;");

  const tokenBenefits = [
    { t: "Spójność", b: "Jedno źródło prawdy dla wszystkich platform (iOS, Android, Web).", c: C.accent1 },
    { t: "Skalowalność", b: "Łatwa aktualizacja — zmiana w jednym miejscu propaguje się wszędzie.", c: C.accent3 },
    { t: "Handoff", b: "Automatyczna synchronizacja z kodem przez Figma Variables lub Style Dictionary.", c: C.accent5 },
  ];
  tokenBenefits.forEach((b, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 3.48 + i * 0.52, w: 0.06, h: 0.42,
      fill: { color: b.c }, line: { color: b.c }
    });
    s.addText(b.t, {
      x: 5.45, y: 3.5 + i * 0.52, w: 4.05, h: 0.2,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(b.b, {
      x: 5.45, y: 3.72 + i * 0.52, w: 4.05, h: 0.22,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 5.02, w: 4.6, h: 0.13,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Design tokens to koncept zapożyczony ze świata web development. W Compose odpowiednikiem są MaterialTheme.colorScheme i custom Color objects. Kluczowa zaleta: jeden token primaryColor = zmiana we wszystkich miejscach jednocześnie. W praktyce: Figma Variables synchronizują się z kodem przez pluginy jak Tokens Studio. Zasada 60-30-10: 60% kolor dominujący (zwykle tło i duże powierzchnie), 30% kolor uzupełniający, 10% akcent (CTA, linki, podkreślenia).");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 06 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "06", "Typografia w Projektowaniu Mobilnym", "Zasady doboru i stosowania czcionek w aplikacjach mobilnych", C.accent1);
  addFooter(s, n, TOTAL);
  s.addNotes("Sekcja szósta: typografia. Tekst to fundament większości aplikacji mobilnych. Dobra typografia sprawia, że treść jest przejrzysta, czytelna i dostępna. Omówimy fundamenty typografii mobilnej, wybór czcionek, hierarchię typograficzną oraz dostępność.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 28 — Fundamenty typografii
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "06 • Fundamenty Typografii Mobilnej", C.accent1);

  const principles = [
    { t: "Readability (Czytelność)", b: "Szybkie i bezwysiłkowe czytanie tekstu — kluczowe dla mobilnych warunków. Odpowiedni rozmiar, kontrast, interlinia.", tags: ["Min. 16px", "Kontrast 4.5:1", "Interlinia 1.4–1.6"] },
    { t: "Hierarchy (Hierarchia)", b: "Prowadzi wzrok i pokazuje ważność elementów. Rozmiar, waga fontu i kolor tworzą porządek.", tags: ["Rozmiar", "Waga", "Kolor"] },
    { t: "Consistency (Spójność)", b: "Spójne użycie typografii buduje profesjonalny wizerunek i ułatwia nawigację po aplikacji.", tags: ["Style guide", "Design system"] },
  ];

  principles.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 0.85 + i * 1.42, w: 4.5, h: 1.32,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 0.85 + i * 1.42, w: 0.07, h: 1.32,
      fill: { color: C.accent1 }, line: { color: C.accent1 }
    });
    s.addText(p.t, {
      x: 0.5, y: 0.95 + i * 1.42, w: 4.1, h: 0.3,
      fontSize: 12.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(p.b, {
      x: 0.5, y: 1.27 + i * 1.42, w: 4.1, h: 0.52,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
    p.tags.forEach((tag, j) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.5 + j * 1.3, y: 1.83 + i * 1.42, w: 1.18, h: 0.22, rectRadius: 0.04,
        fill: { color: "1A3050" }, line: { color: C.accent1 }
      });
      s.addText(tag, {
        x: 0.5 + j * 1.3, y: 1.83 + i * 1.42, w: 1.18, h: 0.22,
        fontSize: 8, color: C.accent1, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
      });
    });
  });

  // Right: Elementy składowe
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Elementy Składowe", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const typoElements = [
    ["A", "Wybór Kroju Pisma", "Czcionki zaprojektowane dla ekranów. Unikaj dekoracyjnych do treści."],
    ["B", "Waga i Styl", "Regular, Medium, Semibold, Bold. Różne wagi do hierarchii."],
    ["◉", "Kolor i Kontrast", "Min. 4.5:1 dla tekstu normalnego. Testuj w różnych warunkach."],
    ["↔", "Odstępy", "Tracking (między literami), kerning (par liter), line-height."],
    ["↕", "Interlinia", "1.4–1.6× rozmiar czcionki dla tekstu ciągłego. Więcej dla nagłówków."],
  ];
  typoElements.forEach(([icon, title, body], i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.3, y: 1.4 + i * 0.6, w: 0.3, h: 0.3,
      fill: { color: "1A3050" }, line: { color: C.accent1 }
    });
    s.addText(icon, {
      x: 5.3, y: 1.4 + i * 0.6, w: 0.3, h: 0.3,
      fontSize: 9, bold: true, color: C.accent1, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    s.addText(title, {
      x: 5.72, y: 1.4 + i * 0.6, w: 3.8, h: 0.22,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 5.72, y: 1.64 + i * 0.6, w: 3.8, h: 0.24,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.42, w: 4.6, h: 0.73,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Wyzwania mobilne:  Małe ekrany = ograniczona przestrzeń  |  Zmienne oświetlenie = kontrast kluczowy  |  Ruch = większa typografia", {
    x: 5.25, y: 4.48, w: 4.3, h: 0.6,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Trzy zasady typografii mobilnej można zapamiętać jako R-H-C: Readability, Hierarchy, Consistency. Czytelność jest szczególnie krytyczna na mobile: użytkownicy czytają w ruchu, w różnym oświetleniu, często w pośpiechu. Badania eye-tracking pokazują, że użytkownicy mobilni skanują treść zamiast czytać — hierarchia typograficzna jest więc ważniejsza niż na desktop. Praktyczny problem: tekst 12px wygląda dobrze na dużym monitorze projektanta, ale na telefonie w słońcu jest nieczytelny.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 29 — Wybór czcionek
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "06 • Wybór Czcionek dla Aplikacji Mobilnych", C.accent1);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Złota Zasada: System Fonts", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Używaj czcionek systemowych tam, gdzie to możliwe. Są zoptymalizowane dla danej platformy, szybciej się ładują i zapewniają natywne doświadczenie.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.6,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  // iOS SF
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 2.0, w: 0.07, h: 0.9,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });
  s.addText("iOS: San Francisco", {
    x: 0.5, y: 2.02, w: 4.1, h: 0.26,
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Czcionka systemowa Apple. Zoptymalizowana dla czytelności na ekranach Retina. Warianty: SF Pro, SF Compact.", {
    x: 0.5, y: 2.3, w: 4.1, h: 0.5,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });
  // Android Roboto
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 3.05, w: 0.07, h: 0.9,
    fill: { color: C.accent3 }, line: { color: C.accent3 }
  });
  s.addText("Android: Roboto / Noto", {
    x: 0.5, y: 3.07, w: 4.1, h: 0.26,
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Czcionka systemowa Google. Zaprojektowana dla Android. Noto dla języków nieobsługiwanych przez Roboto.", {
    x: 0.5, y: 3.35, w: 4.1, h: 0.5,
    fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
  });

  addStatBox(s, 0.5, 4.1, 1.8, 0.72, "16px", "Min. rozmiar tekstu", C.accent1);
  addStatBox(s, 2.5, 4.1, 1.8, 0.72, "1.5", "Optymalna interlinia", C.accent5);

  // Right: Cechy dobrych czcionek
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Cechy Dobrych Czcionek Mobilnych", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const fontFeatures = [
    ["1", "Niski Kontrast Linii", "Unikaj czcionek z dużym kontrastem między grubymi a cienkimi liniami — trudne w małych rozmiarach."],
    ["2", "Otwarta Apertura", "Otwarte przestrzenie w literach (a, e, s) poprawiają czytelność w małych rozmiarach."],
    ["3", "Wyraźne Różnice", "Litery powinny być łatwo rozróżnialne (I vs l vs 1, O vs 0) — krytyczne dla dostępności."],
    ["4", "Duża X-Height", "Wysokość małych liter proporcjonalnie duża — lepsza czytelność przy małym rozmiarze."],
  ];
  fontFeatures.forEach(([num, title, body], i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.3, y: 1.38 + i * 0.78, w: 0.32, h: 0.32,
      fill: { color: C.accent1 }, line: { color: C.accent1 }
    });
    s.addText(num, {
      x: 5.3, y: 1.38 + i * 0.78, w: 0.32, h: 0.32,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText(title, {
      x: 5.72, y: 1.38 + i * 0.78, w: 3.8, h: 0.24,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 5.72, y: 1.62 + i * 0.78, w: 3.8, h: 0.46,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.55, w: 4.6, h: 0.6,
    fill: { color: "071420" }, line: { color: C.accent5 }
  });
  s.addText("Czcionki niestandardowe: używaj ostrożnie. Wpływają na wydajność (czas ładowania), wymagają licencji, mogą nie renderować poprawnie. Zawsze testuj na rzeczywistych urządzeniach.", {
    x: 5.25, y: 4.6, w: 4.3, h: 0.52,
    fontSize: 9, color: C.accent5, fontFace: "Calibri", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("San Francisco (Apple) i Roboto (Google) to efekty wieloletnich badań użyteczności i czytelności. Nie bez powodu są czcionkami systemowymi — zostały zaprojektowane specjalnie pod ekrany o wysokiej gęstości pikseli. Dla Compose: MaterialTheme.typography używa Roboto automatycznie. Dla SwiftUI: Font.system() i Font.custom(). Popularne czcionki niestandardowe dla mobile: Inter, DM Sans, Nunito — wszystkie mają dużą x-height i otwartą aperturę. Nigdy nie używaj czcionek dekoracyjnych do długich tekstów — only dla krótkich nagłówków, maksymalnie.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 30 — Hierarchia typograficzna
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "06 • Hierarchia Typograficzna i Skalowanie", C.accent1);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Tworzenie Hierarchii", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Hierarchia typograficzna prowadzi użytkownika przez treść, pokazując co jest ważne, co powiązane, co można pominąć.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.52,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  const typoHierarchy = [
    { t: "Nagłówki (Headings)", b: "H1 dla tytułów ekranów, H2 dla sekcji, H3+ dla podsekcji.", fs: 11.5 },
    { t: "Tekst Podstawowy (Body)", b: "Min. 16px, Regular weight, interlinia 1.4–1.6.", fs: 10 },
    { t: "Podpisy i Etykiety", b: "12–14px dla metadanych, opisów, etykiet formularzy.", fs: 9 },
    { t: "Przyciski i CTA", b: "Medium lub Semibold weight, Title Case lub UPPERCASE.", fs: 9 },
  ];
  typoHierarchy.forEach((item, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 1.95 + i * 0.72, w: 0.07, h: 0.6,
      fill: { color: C.accent1 }, line: { color: C.accent1 }
    });
    s.addText(item.t, {
      x: 0.5, y: 1.97 + i * 0.72, w: 4.1, h: 0.24,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(item.b, {
      x: 0.5, y: 2.23 + i * 0.72, w: 4.1, h: 0.22,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Skalowanie i Responsive Typography", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });

  // Type scale
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 1.35, w: 4.1, h: 1.5,
    fill: { color: C.code }, line: { color: "1E3A50" }
  });
  s.addText("Typowa Skala", {
    x: 5.45, y: 1.42, w: 2, h: 0.24,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  const scale = ["H1: 32px", "H2: 28px  (÷1.14)", "H3: 24px  (÷1.17)", "Body: 16px", "Caption: 12px"];
  scale.forEach((line, i) => {
    s.addText(line, {
      x: 5.45, y: 1.68 + i * 0.22, w: 3.8, h: 0.2,
      fontSize: 8.5, color: C.codeTxt, fontFace: "Consolas", margin: 0
    });
  });

  const scaleNotes = [
    { t: "Jednostki Względne", b: "Używaj sp (scalable pixels) zamiast px. Pozwala to na dostępność i responsywność." },
    { t: "Optymalna Długość Wiersza", b: "50–75 znaków na wiersz. Zbyt długie = trudne śledzenie. Zbyt krótkie = ciągłe przenoszenie wzroku." },
    { t: "Dynamic Type (iOS) / Scalable Text (Android)", b: "Aplikacja musi wspierać ustawienia systemowe rozmiaru tekstu. Testuj z maksymalnymi ustawieniami." },
  ];
  scaleNotes.forEach((note, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 2.93 + i * 0.68, w: 0.06, h: 0.55,
      fill: { color: C.accent1 }, line: { color: C.accent1 }
    });
    s.addText(note.t, {
      x: 5.45, y: 2.95 + i * 0.68, w: 4.05, h: 0.22,
      fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(note.b, {
      x: 5.45, y: 3.19 + i * 0.68, w: 4.05, h: 0.36,
      fontSize: 9, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Skala typograficzna oparta na proporcji matematycznej (najczęściej Major Third 1.25 lub Perfect Fourth 1.333) zapewnia wizualną harmonię. Narzędzie typescale.com pozwala generować skale. Krytyczna zasada dostępności: testuj z Large Text accessibility. W Xcode: zmień Dynamic Type na Accessibility Extra Extra Extra Large i sprawdź, czy layout się nie rozpada. W Android: w Accessibility settings ustaw największy rozmiar czcionki i sprawdź overflow.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 07 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "07", "Dźwięki i Haptyka", "Projektowanie dźwiękowe i sprzężenie zwrotne dotykowe", C.accent2);
  addFooter(s, n, TOTAL);
  s.addNotes("Sekcja siódma: dźwięki i haptyka. To często zaniedbywany obszar projektowania, a może mieć ogromny wpływ na jakość doświadczenia. Haptyka (precyzyjne wibracje) to wyróżnik Apple Taptic Engine i nowoczesnych telefonów Android. Dobra haptyka sprawia, że UI \"czuje się\" solidniej.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 32 — Dźwięki
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "07 • Projektowanie Dźwiękowe w Aplikacjach Mobilnych", C.accent2);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Rola Dźwięku w UX", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Dźwięk jest często pomijanym, ale ważnym elementem UX. Wspiera wizualny feedback, buduje atmosferę, informuje o zdarzeniach.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.55,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  const soundRoles = [
    { t: "Potwierdzenie Akcji", b: "Krótkie dźwięki potwierdzają wykonanie akcji (wysłanie wiadomości, zapisanie).", c: C.accent3 },
    { t: "Informowanie o Zdarzeniach", b: "Powiadomienia o nowych wiadomościach, alertach, błędach. Dźwięk gdy nie patrzysz.", c: C.accent1 },
    { t: "Budowanie Atmosfery", b: "Dźwięki ambientowe w grach, aplikacjach medytacyjnych, edukacyjnych.", c: C.accent4 },
    { t: "Wsparcie Dostępności", b: "Dźwięki pomagają osobom niewidomym w nawigacji po interfejsie.", c: C.accent5 },
  ];
  soundRoles.forEach((role, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 2.0 + i * 0.75, w: 0.07, h: 0.62,
      fill: { color: role.c }, line: { color: role.c }
    });
    s.addText(role.t, {
      x: 0.5, y: 2.02 + i * 0.75, w: 4.1, h: 0.24,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(role.b, {
      x: 0.5, y: 2.28 + i * 0.75, w: 4.1, h: 0.38,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Rodzaje i Zasady", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const soundTypes = [
    { t: "Systemowe", b: "Wbudowane w system iOS/Android. Zalecane dla spójności z platformą." },
    { t: "Niestandardowe", b: "Unikalne dźwięki marki. Wymagają projektowania dźwiękowego i testowania." },
    { t: "Ambientowe", b: "Tło dźwiękowe w grach, aplikacjach relaksacyjnych. Opcjonalne, zawsze wyłączalne." },
  ];
  soundTypes.forEach(([, obj], i) => {
    const type = soundTypes[i];
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 1.38 + i * 0.72, w: 4.1, h: 0.62,
      fill: { color: "0D2035" }, line: { color: "1A3050" }
    });
    s.addText(type.t, {
      x: 5.45, y: 1.44 + i * 0.72, w: 3.8, h: 0.24,
      fontSize: 11, bold: true, color: C.accent2, fontFace: "Calibri", margin: 0
    });
    s.addText(type.b, {
      x: 5.45, y: 1.7 + i * 0.72, w: 3.8, h: 0.24,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 3.57, w: 4.6, h: 1.58,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Zasady Projektowania Dźwiękowego", {
    x: 5.3, y: 3.65, w: 4.1, h: 0.26,
    fontSize: 11, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  const soundRules = ["Krótkość: Maksymalnie 0.5–1 sekundy", "Subtelność: Nie dominuj nad treścią", "Spójność: Podobne akcje = podobne dźwięki", "Wyłączalność: Użytkownik musi mieć kontrolę"];
  soundRules.forEach((rule, i) => {
    s.addText("— " + rule, {
      x: 5.3, y: 3.95 + i * 0.28, w: 4.1, h: 0.24,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Dźwięk w aplikacjach to cichy bohater UX. Przykłady dobrze zaprojektowanych dźwięków: wysłanie wiadomości w iMessage (charakterystyczny dźwięk), powiadomienie WhatsApp, dźwięk płatności Apple Pay. Kluczowa zasada: zawsze respektuj ustawienie systemowe 'Dźwięki UI' i 'tryb cichy'. Testuj na urządzeniu z włączonymi headphones — dźwięki mogą brzmieć inaczej. Dostępność: dźwięki powinny zawsze towarzyszyć wizualnym wskazówkom, nigdy nie być jedynym sygnałem.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 33 — Haptyka
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "07 • Haptyka i Sprzężenie Zwrotne Dotykowe", C.accent2);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Wibracje vs Haptyka", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Haptyka to precyzyjne, kontrolowane sprzężenie zwrotne dotykowe — to nie zwykła wibracja, to komunikacja przez dotyk.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.52,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  s.addText("Rodzaje Haptyki (iOS):", {
    x: 0.5, y: 1.88, w: 4.1, h: 0.24,
    fontSize: 11, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  const hapticTypes = [
    ["Impact:", "Light, Medium, Heavy — dla różnej intensywności"],
    ["Selection:", "Delikatny feedback przy zmianie wyboru"],
    ["Notification:", "Success, Warning, Error — dla różnych stanów"],
  ];
  hapticTypes.forEach(([label, desc], i) => {
    s.addText(label, {
      x: 0.5, y: 2.15 + i * 0.38, w: 0.8, h: 0.32,
      fontSize: 10, bold: true, color: C.accent2, fontFace: "Calibri", margin: 0
    });
    s.addText(desc, {
      x: 1.3, y: 2.15 + i * 0.38, w: 3.3, h: 0.32,
      fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addText("Konteksty Zastosowania:", {
    x: 0.5, y: 3.35, w: 4.1, h: 0.24,
    fontSize: 11, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  const contexts = ["Potwierdzenie akcji: tapnięcie przycisku", "Granice: koniec listy, limit znaków", "Błędy: nieprawidłowe hasło, walidacja", "Zmiana stanu: włączenie/wyłączenie toggle"];
  contexts.forEach((c, i) => {
    s.addText("— " + c, {
      x: 0.5, y: 3.62 + i * 0.32, w: 4.1, h: 0.28,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });

  // Right
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Implementacja Haptyki", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const hapticImpl = [
    { t: "Ustawienia Użytkownika", b: "Zawsze szanuj ustawienia systemowe. Jeśli użytkownik wyłączył haptykę — nie używaj.", c: C.accent3 },
    { t: "Integracja z Dźwiękiem", b: "Haptyka + dźwięk = silniejszy feedback. Używaj razem dla kluczowych akcji.", c: C.accent1 },
    { t: "Testowanie na Urządzeniach", b: "Silniki haptyczne różnią się między modelami telefonów. Zawsze testuj na fizycznym urządzeniu.", c: C.accent5 },
    { t: "Unikaj Nadmiernego Użycia", b: "Haptyka dla każdego dotknięcia jest męcząca. Używaj celowo i oszczędnie.", c: C.accent2 },
  ];
  hapticImpl.forEach((item, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 1.38 + i * 0.72, w: 4.1, h: 0.62,
      fill: { color: "0D2035" }, line: { color: "1A3050" }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 1.38 + i * 0.72, w: 0.07, h: 0.62,
      fill: { color: item.c }, line: { color: item.c }
    });
    s.addText(item.t, {
      x: 5.45, y: 1.44 + i * 0.72, w: 3.8, h: 0.24,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(item.b, {
      x: 5.45, y: 1.7 + i * 0.72, w: 3.8, h: 0.24,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.27, w: 4.6, h: 0.88,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Przykłady dobrej haptyki:", {
    x: 5.3, y: 4.33, w: 4.1, h: 0.24,
    fontSize: 10, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  s.addText("iPhone Taptic Engine — lajkowanie w Instagram  |  Feedback klawiatury  |  Apple Pay potwierdzenie", {
    x: 5.3, y: 4.59, w: 4.1, h: 0.52,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Apple Taptic Engine (od iPhone 6S) to rewolucja w haptyce — zamiast prostego silniczka, liniowy aktuator pozwala na precyzyjne wzorce wibracji. W Swift: UIImpactFeedbackGenerator, UISelectionFeedbackGenerator. W Kotlin/Compose: VibrationEffect (API 26+) lub Vibrator.vibrate(). Ciekawostka: badania pokazują, że haptyka zwiększa poczucie 'fizyczności' interfejsu — użytkownicy opisują przyciski z haptyką jako 'solidniejsze'. Ważne: nie wszystkie urządzenia Android mają dobry silnik haptyczny — zawsze sprawdź hasFeatureHapticFeedback.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 08 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "08", "Projektowanie Emocjonalne", "Tworzenie połączeń emocjonalnych poprzez design", C.accent3);
  addFooter(s, n, TOTAL);
  s.addNotes("Sekcja ósma: projektowanie emocjonalne. Don Norman w książce 'Emotional Design' (2004) zaproponował model trzech poziomów przetwarzania emocjonalnego: visceral, behavioral i reflective. To framework, który wyjaśnia, dlaczego niektóre produkty są 'lubiane' mimo niedoskonałości, a inne odrzucane mimo technicznej perfekcji.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 35 — Model Normana
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "08 • Trzy Poziomy Projektowania Emocjonalnego", C.accent3);

  const levels = [
    {
      name: "Visceral", subtitle: "Pierwsze wrażenie",
      body: "Natychmiastowy, instynktowny poziom reakcji na wygląd produktu.",
      items: ["Estetyka — kolory, typografia, layout", "Prezentacja — jakość grafiki, animacje", "Tożsamość Marki — rozpoznawalność"],
      question: "Pytanie: Czy to wygląda atrakcyjnie?",
      color: C.accent1
    },
    {
      name: "Behavioral", subtitle: "Użyteczność",
      body: "Poziom funkcjonalny — jak produkt działa, jak łatwo się go używa.",
      items: ["Funkcjonalność — czy robi co obiecuje?", "Łatwość Użycia — intuicyjność, efektywność", "Feedback — informacja o akcjach"],
      question: "Pytanie: Czy to działa dobrze?",
      color: C.accent3
    },
    {
      name: "Reflective", subtitle: "Znaczenie",
      body: "Poziom refleksyjny — osobista wartość, wspomnienia, tożsamość.",
      items: ["Tożsamość Osobista — pasuje do mnie?", "Wspomnienia — emocjonalne powiązania", "Znaczenie Kulturowe — status, wartości"],
      question: "Pytanie: Czy to pasuje do mnie?",
      color: C.accent2
    },
  ];

  levels.forEach((level, i) => {
    const x = 0.3 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85, w: 3.0, h: 4.3,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85, w: 3.0, h: 0.06,
      fill: { color: level.color }, line: { color: level.color }
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.12, y: 0.98, w: 0.5, h: 0.5,
      fill: { color: level.color }, line: { color: level.color }
    });
    s.addText(level.name, {
      x: x + 0.72, y: 1.0, w: 2.1, h: 0.3,
      fontSize: 18, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(level.subtitle, {
      x: x + 0.12, y: 1.55, w: 2.76, h: 0.24,
      fontSize: 12, bold: true, color: level.color, fontFace: "Calibri", margin: 0
    });
    s.addText(level.body, {
      x: x + 0.12, y: 1.82, w: 2.76, h: 0.6,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
    level.items.forEach((item, j) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.12, y: 2.55 + j * 0.4, w: 0.06, h: 0.3,
        fill: { color: level.color }, line: { color: level.color }
      });
      s.addText(item, {
        x: x + 0.25, y: 2.56 + j * 0.4, w: 2.65, h: 0.28,
        fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
      });
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.12, y: 4.6, w: 2.76, h: 0.3,
      fill: { color: "071420" }, line: { color: level.color }
    });
    s.addText(level.question, {
      x: x + 0.15, y: 4.62, w: 2.7, h: 0.26,
      fontSize: 9, bold: true, color: level.color, fontFace: "Calibri", valign: "middle", margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Model Normana jest doskonałym narzędziem do analizy, dlaczego pewne produkty 'działają' emocjonalnie. Przykład: iPhone. Visceral — premium design, szkło i metal. Behavioral — iOS jest intuicyjny i spójny. Reflective — posiadanie iPhone'a stało się symbolem statusu i identyfikatorem kulturowym. Inne przykłady: Duolingo ma świetny Visceral (zielona sowa) i wyjątkowy Behavioral (gamifikacja), co buduje głęboki Reflective (poczucie osiągnięcia). Zastosowanie: przy projektowaniu pytaj o wszystkie trzy poziomy dla Twojej aplikacji.");

}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 36 — Mikrointerakcje
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "08 • Mikrointerakcje i Delight w UX", C.accent3);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Znaczenie Mikrointerakcji", {
    x: 0.5, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  s.addText("Mikrointerakcje to małe animacje i efekty wizualne, które wzbogacają doświadczenie użytkownika. Tworzą momenty \"delight\" — radości z użytkowania.", {
    x: 0.5, y: 1.3, w: 4.1, h: 0.65,
    fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
  });
  s.addText("Przykłady Mikrointerakcji:", {
    x: 0.5, y: 2.05, w: 4.1, h: 0.24,
    fontSize: 11, bold: true, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });
  const microExamples = [
    "Pulsowanie serca przy lajkowaniu (Instagram)",
    "Pull-to-refresh z animacją odświeżania",
    "Checkmark po zakończeniu zadania",
    "Kreatywne animacje ładowania (skeleton screens)",
    "Efekty naciśnięcia przycisków (ripple effect)",
  ];
  microExamples.forEach((ex, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 0.5, y: 2.36 + i * 0.38, w: 0.18, h: 0.18,
      fill: { color: C.accent3 }, line: { color: C.accent3 }
    });
    s.addText(ex, {
      x: 0.78, y: 2.33 + i * 0.38, w: 3.9, h: 0.28,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 4.3, w: 4.5, h: 0.85,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Dlaczego działają? Aktywują system nagrody w mózgu (dopamina), tworzą pozytywne skojarzenia z produktem, zwiększają zaangażowanie i lojalność.", {
    x: 0.5, y: 4.36, w: 4.1, h: 0.72,
    fontSize: 9.5, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });

  // Right
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.85, w: 4.6, h: 4.3,
    fill: { color: C.panel }, line: { color: C.panelBrd }
  });
  s.addText("Zasady Projektowania Mikrointerakcji", {
    x: 5.3, y: 0.98, w: 4.1, h: 0.3,
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", margin: 0
  });
  const microPrinciples = [
    ["1", "Spójność", "Mikrointerakcje spójne z językiem wizualnym marki. Nie używaj losowych animacji."],
    ["2", "Subtelność", "Wzbogacają, nie dominują. Animacje 0.2–0.5 sekundy — nie dłużej."],
    ["3", "Celowość", "Każda mikrointerakcja musi mieć cel — informować, potwierdzać lub bawić."],
    ["4", "Natychmiastowość", "Feedback musi być natychmiastowy. Opóźnienia frustrują użytkowników."],
    ["5", "Respektuj Preferencje", "Szanuj prefers-reduced-motion / Reduce Motion — nie każdy toleruje animacje."],
  ];
  microPrinciples.forEach(([num, title, body], i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.3, y: 1.38 + i * 0.6, w: 0.28, h: 0.28,
      fill: { color: C.accent3 }, line: { color: C.accent3 }
    });
    s.addText(num, {
      x: 5.3, y: 1.38 + i * 0.6, w: 0.28, h: 0.28,
      fontSize: 9, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText(title, {
      x: 5.68, y: 1.38 + i * 0.6, w: 3.85, h: 0.22,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(body, {
      x: 5.68, y: 1.62 + i * 0.6, w: 3.85, h: 0.28,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.42, w: 4.6, h: 0.73,
    fill: { color: "071420" }, line: { color: C.panelBrd }
  });
  s.addText("Najlepsze przykłady: Instagram — pulsowanie serca  |  Slack — animacja wysłania  |  Duolingo — celebracja sukcesu", {
    x: 5.25, y: 4.48, w: 4.3, h: 0.6,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Dan Saffer w książce 'Microinteractions' opisał anatomię mikrointerakcji: trigger → rules → feedback → loops & modes. Trigger wyzwala mikrointerakcję (np. tapnięcie). Rules definiują co się dzieje. Feedback komunikuje wynik. Loops/modes zarządzają powtarzaniem i stanami. Ważna uwaga dla deweloperów: Accessibility — iOS posiada ustawienie 'Reduce Motion' w Accessibility, Android ma 'Remove animations'. Aplikacja musi respektować te ustawienia — prefers-reduced-motion w CSS, AccessibilityManager.isAnimationEnabled() w Android.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 09 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "09", "Hierarchia Wizualna", "Kierowanie uwagą użytkownika poprzez design", C.accent4);
  addFooter(s, n, TOTAL);
  s.addNotes("Sekcja dziewiąta: hierarchia wizualna. To zestaw technik pozwalający projektantowi kontrolować, w jakiej kolejności użytkownik przetwarza informacje na ekranie. Rozmiar, kolor, kontrast, biała przestrzeń, typografia — wszystkie te narzędzia służą jednemu celowi: prowadzić wzrok do najważniejszych informacji.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 38 — Zasady hierarchii wizualnej
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "09 • Zasady Hierarchii Wizualnej", C.accent4);

  const principles = [
    {
      title: "Rozmiar i Skala",
      body: "Większe elementy przyciągają uwagę. Rozmiar to najsilniejszy wskaźnik hierarchii.",
      demo: [
        { text: "H1 — Najważniejszy", size: 18, color: C.white },
        { text: "H2 — Mniej ważny", size: 13, color: C.subtitle },
        { text: "Body text", size: 10, color: C.body },
      ],
      color: C.accent4
    },
    {
      title: "Kolor i Kontrast",
      body: "Jasne, nasycone kolory dominują. Wysoki kontrast przyciąga, niski cofa w tło.",
      demo: [
        { text: "Primary CTA", size: 11, color: C.accent1 },
        { text: "Secondary", size: 11, color: C.body },
        { text: "Tertiary", size: 11, color: C.bodyDim },
      ],
      color: C.accent1
    },
    {
      title: "Typografia",
      body: "Waga, rozmiar i styl tworzą hierarchię tekstową. Bold > Regular > Light.",
      demo: [
        { text: "Bold Heading", size: 13, color: C.white, bold: true },
        { text: "Regular body text", size: 10, color: C.body },
        { text: "Light caption", size: 9, color: C.bodyDim },
      ],
      color: C.accent2
    },
  ];

  principles.forEach((p, i) => {
    const x = 0.3 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85, w: 3.0, h: 4.3,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.12, y: 0.95, w: 0.5, h: 0.5,
      fill: { color: p.color }, line: { color: p.color }
    });
    s.addText(p.title, {
      x: x + 0.72, y: 1.0, w: 2.1, h: 0.35,
      fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(p.body, {
      x: x + 0.12, y: 1.55, w: 2.76, h: 0.6,
      fontSize: 10, color: C.body, fontFace: "Calibri", margin: 0
    });
    // Demo area
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.12, y: 2.25, w: 2.76, h: 1.5,
      fill: { color: "0D2035" }, line: { color: "1A3050" }
    });
    p.demo.forEach((d, j) => {
      s.addText(d.text, {
        x: x + 0.2, y: 2.38 + j * 0.42, w: 2.6, h: 0.38,
        fontSize: d.size, bold: d.bold || false,
        color: d.color, fontFace: "Calibri", margin: 0
      });
    });
    // Two bottom info boxes
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.12, y: 3.9, w: 1.2, h: 0.5,
      fill: { color: C.code }, line: { color: p.color }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 1.56, y: 3.9, w: 1.32, h: 0.5,
      fill: { color: C.code }, line: { color: p.color }
    });
  });

  // Bottom: Biała przestrzeń + Bliskość
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 5.05, w: 4.5, h: 0.28,
    fill: { color: "071420" }, line: { color: C.accent4 }
  });
  s.addText("Biała Przestrzeń: Elementy otoczone przestrzenią wydają się ważniejsze — izolacja skupia uwagę.", {
    x: 0.5, y: 5.07, w: 4.1, h: 0.24,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 5.05, w: 4.5, h: 0.28,
    fill: { color: "071420" }, line: { color: C.accent2 }
  });
  s.addText("Bliskość i Wyrównanie: Elementy blisko siebie tworzą relacje. Wyrównanie tworzy porządek i strukturę.", {
    x: 5.4, y: 5.07, w: 4.1, h: 0.24,
    fontSize: 9, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Hierarchia wizualna to nie estetyka — to architektura informacji. Badania eye-tracking pokazują, że użytkownicy mobilni przeglądają ekran w wzorcach F lub Z (podobnie jak na webowych stronach). Projektant powinien świadomie prowadzić wzrok do najważniejszych informacji. Praktyczne ćwiczenie: squint test — przymruż oczy patrząc na ekran. Elementy, które nadal widzisz (duże, kontrastowe) to elementy najwyżej w hierarchii wizualnej. Jeśli nie widzisz CTA — hierarchia jest nieprawidłowa.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 39 — Gestalt
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "09 • Zasady Gestalt w Projektowaniu Mobilnym", C.accent4);

  const gestaltPrinciples = [
    { num: "1", name: "Podobieństwo", body: "Elementy podobne wizualnie są grupowane. Używaj spójnych stylów dla podobnych funkcji.", note: "Wszystkie przyciski akcji w tym samym kolorze", color: C.accent4 },
    { num: "2", name: "Bliskość", body: "Elementy blisko siebie tworzą grupy. Odstępy definiują relacje między elementami.", note: "Powiązane elementy blisko siebie", color: C.accent1 },
    { num: "3", name: "Zamknięcie", body: "Mózg uzupełnia brakujące elementy. Używaj sugestii zamiast pełnych form.", note: "Ikony i miniatury kart", color: C.accent3 },
    { num: "4", name: "Figura-Tło", body: "Mózg rozdziela pierwszy plan i tło. Kontrast i rozmiar definiują co jest figurą.", note: "Modalne okna dialogowe", color: C.accent2 },
    { num: "5", name: "Kontynuacja", body: "Oko podąża za liniami i kształtami. Używaj linii do prowadzenia wzroku użytkownika.", note: "Timeline, steppery, progres bary", color: C.accent5 },
    { num: "6", name: "Symetria i Porządek", body: "Preferujemy symetryczne kompozycje. Symetria tworzy harmonię i porządek.", note: "Symetryczne layouty", color: C.accent4 },
  ];

  gestaltPrinciples.forEach((gp, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 3.15;
    const y = 0.85 + row * 2.3;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.0, h: 2.18,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.12, y: y + 0.12, w: 0.38, h: 0.38,
      fill: { color: gp.num === "1" || gp.num === "4" || gp.num === "6" ? C.accent4 : BARS[(i+1) % BARS.length] }, line: { color: "transparent" }
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.12, y: y + 0.12, w: 0.38, h: 0.38,
      fill: { color: gp.color }, line: { color: gp.color }
    });
    s.addText(gp.num, {
      x: x + 0.12, y: y + 0.12, w: 0.38, h: 0.38,
      fontSize: 12, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText(gp.name, {
      x: x + 0.6, y: y + 0.15, w: 2.27, h: 0.32,
      fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(gp.body, {
      x: x + 0.12, y: y + 0.6, w: 2.76, h: 0.75,
      fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
    });
    s.addText(gp.note, {
      x: x + 0.12, y: y + 1.8, w: 2.76, h: 0.26,
      fontSize: 8.5, color: C.bodyDim, fontFace: "Calibri", italic: true, margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Zasady Gestalt (niem. Gestaltpsychologie, Berlin School of Experimental Psychology, ok. 1920) opisują, jak mózg organizuje percepcję wizualną. Każda z zasad ma bezpośrednie zastosowanie w projektowaniu. Bliskość: grupy kart (np. ProductCard w RecyclerView) — odstęp między kartami większy niż wewnątrz karty sygnalizuje grupowanie. Zamknięcie: ikona search to lupa z niepełnym okręgiem — mózg uzupełnia. Kontynuacja: horizontal scroll carousel — częściowo widoczna karta sygnalizuje, że jest więcej elementów.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10 — DIVIDER
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionDivider(s, "10", "Narzędzia Projektowania UI/UX", "Przegląd profesjonalnych narzędzi do projektowania", C.accent5);
  addFooter(s, n, TOTAL);
  s.addNotes("Ostatnia sekcja: narzędzia UI/UX. Dobry projektant powinien znać co najmniej jedno narzędzie do prototypowania. Dla programistów mobilnych szczególnie ważna jest umiejętność odczytywania specyfikacji designu i rozumienia design handoff. Omówimy główne narzędzia: Figma, Sketch, Adobe XD oraz cały ekosystem wspierający.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 41 — Narzędzia do projektowania
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "10 • Narzędzia do Projektowania Interfejsów", C.accent5);

  const tools = [
    {
      name: "Figma", color: C.accent1,
      features: ["Przeglądarkowy — działa na każdym systemie", "Współpraca — real-time multiplayer editing", "Dev Mode — inspect mode, CSS, design tokens", "Design Systems — komponenty, warianty, biblioteki", "Pluginy — 1000+ pluginów (Stark, Unsplash)"],
      badge: "77%", badgeLabel: "Udział w rynku", badgeColor: C.accent1
    },
    {
      name: "Sketch", color: C.bodyDim,
      features: ["macOS Only — natywna aplikacja dla Mac", "Wydajność — lepsza praca z dużymi plikami", "Pluginy — dojrzały ekosystem (ale malejący)", "Offline — pełna funkcjonalność bez internetu", "Cena — $99 jednorazowo lub $9/mies."],
      badge: "Mac", badgeLabel: "Najlepszy dla Mac Teams", badgeColor: C.bodyDim
    },
    {
      name: "Adobe XD", color: C.accent2,
      features: ["Creative Cloud — integracja z Photoshop, Illustrator", "Animacje — Auto-Animate, voice prototyping", "Platformy — macOS i Windows", "Cena — wliczone w Creative Cloud", "Uwaga: Przyszłość niepewna po próbie przejęcia"],
      badge: "?", badgeLabel: "Status niepewny", badgeColor: C.accent2
    },
  ];

  tools.forEach((tool, i) => {
    const x = 0.3 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85, w: 3.0, h: 4.3,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85, w: 3.0, h: 0.06,
      fill: { color: tool.color }, line: { color: tool.color }
    });
    s.addText(tool.name, {
      x: x + 0.12, y: 1.0, w: 2.76, h: 0.38,
      fontSize: 20, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    tool.features.forEach((feat, j) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.12, y: 1.48 + j * 0.5, w: 0.06, h: 0.36,
        fill: { color: tool.color }, line: { color: tool.color }
      });
      s.addText(feat, {
        x: x + 0.25, y: 1.5 + j * 0.5, w: 2.65, h: 0.36,
        fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
      });
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.12, y: 4.4, w: 2.76, h: 0.52,
      fill: { color: "071420" }, line: { color: tool.color }
    });
    s.addText(tool.badge, {
      x: x + 0.12, y: 4.42, w: 1.1, h: 0.48,
      fontSize: 18, bold: true, color: tool.color, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    s.addText(tool.badgeLabel, {
      x: x + 1.25, y: 4.47, w: 1.6, h: 0.38,
      fontSize: 9, color: C.bodyDim, fontFace: "Calibri", valign: "middle", margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Figma zdominował rynek projektowania UI — 77% designerów według badań Uxtools 2024. Powody: bezpłatny plan (do 3 projektów), działa w przeglądarce (brak instalacji), współpraca real-time jak Google Docs. Dev Mode w Figma to bardzo przydatna funkcja dla programistów: pokazuje CSS/SwiftUI/Kotlin kod, wymiary, kolory w dowolnym formacie, eksport zasobów. Sketch wciąż jest popularny w firmach Apple-centric (szczególnie iOS-only teams). Adobe XD po próbie przejęcia przez Figma (zablokowanej przez Komisję Europejską w 2023) jest w niejasnej sytuacji.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 42 — Narzędzia wspierające
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "10 • Narzędzia Wspierające Proces Projektowy", C.accent5);

  const toolGroups = [
    {
      cat: "Prototypowanie", color: C.accent1,
      items: ["Principle — zaawansowane animacje, microinteractions", "ProtoPie — wysokiej wierności prototypy, sensors", "Framer — prototypowanie z kodem, React"],
    },
    {
      cat: "Testowanie", color: C.accent2,
      items: ["Maze — testy użyteczności, heatmapy, analytics", "UserTesting — zdalne testy z użytkownikami", "Lookback — sesje testowe, nagrywanie ekranu"],
    },
    {
      cat: "Zarządzanie", color: C.accent3,
      items: ["Jira — Agile project management, backlog", "Trello — Kanban boards, prostsze projekty", "Linear — nowoczesne zarządzanie zespołem"],
    },
    {
      cat: "Design Systems", color: C.accent4,
      items: ["Storybook — dokumentacja komponentów UI", "Zeroheight — dokumentacja design systemów", "Figma Variables — design tokens w Figma"],
    },
    {
      cat: "Kolaboracja", color: C.accent5,
      items: ["Miro — wirtualna tablica, warsztaty UX", "FigJam — whiteboard zintegrowany z Figma", "Notion — dokumentacja, wiki, baza wiedzy"],
    },
    {
      cat: "Dostępność", color: C.accent1,
      items: ["Stark — plugin Figma/Sketch — kontrast", "axe DevTools — automatyczne testy dostępności", "WebAIM — kontrast checker online"],
    },
  ];

  toolGroups.forEach((group, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 3.15;
    const y = 0.85 + row * 2.3;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.0, h: 2.18,
      fill: { color: C.panel }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.12, y: y + 0.12, w: 0.4, h: 0.4,
      fill: { color: group.color }, line: { color: group.color }
    });
    s.addText(group.cat, {
      x: x + 0.62, y: y + 0.15, w: 2.25, h: 0.32,
      fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    group.items.forEach((item, j) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.12, y: y + 0.6 + j * 0.5, w: 0.06, h: 0.4,
        fill: { color: group.color }, line: { color: group.color }
      });
      s.addText(item, {
        x: x + 0.25, y: y + 0.62 + j * 0.5, w: 2.65, h: 0.38,
        fontSize: 9.5, color: C.body, fontFace: "Calibri", margin: 0
      });
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Dla programistów mobilnych szczególnie istotne narzędzia to: Figma (czytanie specyfikacji designu), Miro (warsztaty, user journey maps), Maze/UserTesting (rozumienie badań UX) i Accessibility Scanner/Xcode Inspector (testowanie dostępności). Warto wspomnieć o Storybooku — popularny w React Native i Flutter do izolowanego prezentowania komponentów UI. Zeroheight integruje się z Figma i Storybook, tworząc living style guide — projekt dokumentacji komponentów dostępny dla całego zespołu.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 43 — Proces projektowania
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "10 • Proces Projektowania UI/UX — Od Pomysłu do Produktu", C.accent5);

  const phases = [
    { num: "1", name: "Research i Discovery", body: "Analiza użytkowników, konkurencji, rynku. User interviews, surveys, competitive analysis.", color: C.accent1 },
    { num: "2", name: "Definicja i Wymagania", body: "Personas, user stories, journey maps. Definiowanie problemu i celów projektowych.", color: C.accent2 },
    { num: "3", name: "Ideacja i Wireframing", body: "Brainstorming, sketching, low-fidelity wireframes. Szybkie iteracje koncepcji.", color: C.accent3 },
    { num: "4", name: "Projektowanie Wizualne", body: "High-fidelity mockups, design system, komponenty. Kolory, typografia, ikony.", color: C.accent4 },
    { num: "5", name: "Prototypowanie i Testowanie", body: "Interaktywne prototypy, usability testing, iteracje. Maze, UserTesting, A/B tests.", color: C.accent5 },
    { num: "6", name: "Handoff i Wdrożenie", body: "Dev handoff (Figma Dev Mode), design tokens, QA. Współpraca z deweloperami.", color: C.accent1 },
  ];

  // Funnel visual
  const funnelW = [8.5, 7.5, 6.5, 5.5, 4.5, 3.5];
  phases.forEach((phase, i) => {
    const w = funnelW[i];
    const x = (10 - w) / 2;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85 + i * 0.7, w, h: 0.6,
      fill: { color: i % 2 === 0 ? C.panel : "071E30" }, line: { color: C.panelBrd }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.85 + i * 0.7, w: 0.4, h: 0.6,
      fill: { color: phase.color }, line: { color: phase.color }
    });
    s.addText(`Faza ${phase.num}`, {
      x: x + 0.5, y: 0.87 + i * 0.7, w: 0.8, h: 0.22,
      fontSize: 8, bold: true, color: phase.color, fontFace: "Calibri", margin: 0
    });
    s.addText(phase.name, {
      x: x + 0.5, y: 1.07 + i * 0.7, w: 2.5, h: 0.22,
      fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri", margin: 0
    });
    s.addText(phase.body, {
      x: x + 3.2, y: 0.88 + i * 0.7, w: w - 3.6, h: 0.48,
      fontSize: 9, color: C.body, fontFace: "Calibri", valign: "middle", margin: 0
    });
  });

  addFooter(s, n, TOTAL);
  s.addNotes("Proces projektowania UI/UX nie jest liniowy — to iteracyjna pętla. Po fazie testowania często wracamy do ideacji lub nawet redefiniujemy wymagania. Design Thinking (Stanford d.school) to popularna metodologia: Empathize, Define, Ideate, Prototype, Test — bardzo zbliżona do tego diagramu. Dla programistów ważna jest faza 6 (Handoff): Figma Dev Mode generuje kod SwiftUI, Compose i CSS. Warto być aktywnym uczestnikiem faz Research i Testowania — programiści widzą ograniczenia techniczne, które designerzy mogą przeoczyć.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 44 — Podsumowanie
// ═══════════════════════════════════════════════════════════════════════════
{
  const n = ns();
  const s = darkSlide();
  addSectionTitle(s, "Podsumowanie i Wnioski", C.accent1);

  const summaryItems = [
    { t: "Użytkownik w Centrum", b: "Projektowanie zaczyna się od zrozumienia potrzeb, celów i kontekstu użytkownika. Research i testowanie są niezbędne.", c: C.accent1 },
    { t: "Spójność i Dostępność", b: "Spójny design system i dostępność dla wszystkich użytkowników to fundament profesjonalnego produktu mobilnego.", c: C.accent3 },
    { t: "Testowanie i Iteracja", b: "Projektowanie to proces iteracyjny. Testuj wcześnie i często. Dane i badania > własne założenia.", c: C.accent2 },
    { t: "Myślenie Projektowe", b: "Narzędzia są ważne, ale design thinking jest kluczowe — rozumiej problemy, nie tylko rysuj interfejsy.", c: C.accent4 },
    { t: "Przyszłość Projektowania", b: "AI-driven design, AR/VR, personalizacja i dostępność. Projektowanie ewoluuje — bądź na bieżąco z trendami.", c: C.accent5 },
    { t: "Ciągła Nauka", b: "UI/UX to dziedzina w ciągłym rozwoju. Ucz się, eksperymentuj, dziel się wiedzą"}
  ]
}

