const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, TabStopType, TableOfContents, SimpleField, PageBreak
} = require('docx');
const fs = require('fs');

// ─── PALETA ──────────────────────────────────────────────────────────────────
const COL = {
  headerBg:    "1A2E44",
  h1Accent:    "027DFD",
  codeBg:      "F2F4F8",
  tipBg:       "E8F4FD",  warnBg:  "FFF8E8",
  taskBg:      "EDF3FC",  whyBg:   "FFF5EA",
  explBg:      "F0F4FF",  analoqBg:"F5EEFF",
  tipBorder:   "027DFD",  warnBorder: "C07A00",
  taskBorder:  "2563EB",  whyBorder:  "E07B00",
  explBorder:  "4F6EB0",  analoqBorder: "8B5CF6",
  codeBorder:  "9CA3AF",
};
const F  = "Arial";
const FC = "Consolas";
const PW = 11906 - 2 * 1080;

// ─── HELPERY ─────────────────────────────────────────────────────────────────
const sp = (n = 120) => new Paragraph({ spacing: { before: 0, after: n } });

const h1 = text => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font: F, size: 28, bold: true, color: "FFFFFF" })],
  shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: COL.h1Accent } },
  spacing: { before: 240, after: 160 }, indent: { left: 160 },
});
const h2 = text => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: F, size: 24, bold: true, color: COL.headerBg })],
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COL.h1Accent, space: 1 } },
  spacing: { before: 200, after: 120 },
});
const h3 = text => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, font: F, size: 22, bold: true, color: "374151" })],
  spacing: { before: 160, after: 80 },
});
const para = text => new Paragraph({
  children: [new TextRun({ text, font: F, size: 22, color: "1F2937" })],
  spacing: { before: 60, after: 80 },
});

function codeBlock(lines, label) {
  const labelRows = label ? [new TableRow({ children: [new TableCell({
    width: { size: PW, type: WidthType.DXA },
    borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} },
    shading: { type: ShadingType.CLEAR, fill: "D1E9FF" },
    margins: { top:40, bottom:40, left:160, right:80 },
    children: [new Paragraph({ children: [new TextRun({ text: label, font: F, size: 18, bold: true, color: "1A2E44" })] })]
  })] })] : [];
  const codeRows = lines.map(line => new TableRow({ children: [new TableCell({
    width: { size: PW, type: WidthType.DXA },
    borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.SINGLE,size:12,color:COL.codeBorder}, right:{style:BorderStyle.NONE} },
    shading: { type: ShadingType.CLEAR, fill: COL.codeBg },
    margins: { top:20, bottom:20, left:160, right:80 },
    children: [new Paragraph({ children: [new TextRun({ text: line||" ", font: FC, size: 18, color: "1A2E44" })] })]
  })] }));
  return new Table({ width: { size:PW, type:WidthType.DXA }, columnWidths:[PW], rows:[...labelRows,...codeRows] });
}

function infoBox(emoji, title, lines, bgColor, borderColor) {
  const mkRow = (borderCfg, text, bold, mt=20, mb=20) => new TableRow({ children: [new TableCell({
    width: { size:PW, type:WidthType.DXA },
    borders: { top: borderCfg.top||{style:BorderStyle.NONE}, bottom: borderCfg.bot||{style:BorderStyle.NONE}, left:{style:BorderStyle.SINGLE,size:16,color:borderColor}, right:{style:BorderStyle.NONE} },
    shading: { type:ShadingType.CLEAR, fill:bgColor },
    margins: { top:mt, bottom:mb, left:160, right:80 },
    children: [new Paragraph({ children: [new TextRun({ text:text||" ", font:F, size:bold?22:21, bold:!!bold, color:"1F2937" })] })]
  })] });
  const bdr = c => ({style:BorderStyle.SINGLE, size:8, color:c});
  return new Table({
    width:{size:PW,type:WidthType.DXA}, columnWidths:[PW],
    rows:[
      mkRow({top:bdr(borderColor)}, `${emoji} ${title}`, true, 80, 40),
      ...lines.map(l => mkRow({}, l, false)),
      mkRow({bot:bdr(borderColor)}, " ", false, 0, 40),
    ]
  });
}

const tip    = (t,l) => infoBox("💡",t,l,COL.tipBg,   COL.tipBorder);
const warn   = (t,l) => infoBox("⚠️",t,l,COL.warnBg,  COL.warnBorder);
const task   = (t,l) => infoBox("📋",t,l,COL.taskBg,  COL.taskBorder);
const why    = (t,l) => infoBox("❓",t,l,COL.whyBg,   COL.whyBorder);
const expl   = (t,l) => infoBox("🔍",t,l,COL.explBg,  COL.explBorder);
const analog = (t,l) => infoBox("🧩",t,l,COL.analoqBg,COL.analoqBorder);

function twoColTable(rows, w1, w2) {
  w1 = w1||3200; w2 = w2||PW-w1;
  const b4 = c => ({style:BorderStyle.SINGLE,size:4,color:c});
  const b2 = c => ({style:BorderStyle.SINGLE,size:2,color:c});
  return new Table({
    width:{size:w1+w2,type:WidthType.DXA}, columnWidths:[w1,w2],
    rows: rows.map((row,ri) => new TableRow({ tableHeader:ri===0, children: row.map((cell,ci) => new TableCell({
      width:{size:ci===0?w1:w2,type:WidthType.DXA},
      borders: ri===0 ? {top:b4("9CA3AF"),bottom:b4("9CA3AF"),left:b4("9CA3AF"),right:b4("9CA3AF")}
                      : {top:b2("D1D5DB"),bottom:b2("D1D5DB"),left:b2("D1D5DB"),right:b2("D1D5DB")},
      shading:{type:ShadingType.CLEAR,fill:ri===0?COL.headerBg:ri%2===1?"FFFFFF":"F9FAFB"},
      margins:{top:ri===0?80:60,bottom:ri===0?80:60,left:120,right:120},
      children:[new Paragraph({children:[new TextRun({text:cell,font:ci===0&&ri>0?FC:F,size:ri===0?20:(ci===0?19:20),bold:ri===0,color:ri===0?"FFFFFF":(ci===0&&ri>0?"1A2E44":"374151")})]})]
    })) }))
  });
}

function threeColTable(rows, w1, w2, w3) {
  const b4=c=>({style:BorderStyle.SINGLE,size:4,color:c});
  const b2=c=>({style:BorderStyle.SINGLE,size:2,color:c});
  return new Table({
    width:{size:w1+w2+w3,type:WidthType.DXA}, columnWidths:[w1,w2,w3],
    rows: rows.map((row,ri) => new TableRow({ tableHeader:ri===0, children: row.map((cell,ci) => new TableCell({
      width:{size:ci===0?w1:ci===1?w2:w3,type:WidthType.DXA},
      borders: ri===0?{top:b4("9CA3AF"),bottom:b4("9CA3AF"),left:b4("9CA3AF"),right:b4("9CA3AF")}:{top:b2("D1D5DB"),bottom:b2("D1D5DB"),left:b2("D1D5DB"),right:b2("D1D5DB")},
      shading:{type:ShadingType.CLEAR,fill:ri===0?COL.headerBg:ri%2===1?"FFFFFF":"F9FAFB"},
      margins:{top:ri===0?80:60,bottom:ri===0?80:60,left:120,right:120},
      children:[new Paragraph({children:[new TextRun({text:cell,font:F,size:ri===0?20:19,bold:ri===0,color:ri===0?"FFFFFF":"374151"})]})]
    })) }))
  });
}

function stepTable(header, steps) {
  const b4={style:BorderStyle.SINGLE,size:4,color:"9CA3AF"};
  const b2={style:BorderStyle.SINGLE,size:2,color:"D1D5DB"};
  return new Table({
    width:{size:PW,type:WidthType.DXA}, columnWidths:[800,PW-800],
    rows:[
      new TableRow({tableHeader:true,children:[
        new TableCell({width:{size:800,type:WidthType.DXA},borders:{top:b4,bottom:b4,left:b4,right:b4},shading:{type:ShadingType.CLEAR,fill:COL.headerBg},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:"#",font:F,size:20,bold:true,color:"FFFFFF"})]})]}),
        new TableCell({width:{size:PW-800,type:WidthType.DXA},borders:{top:b4,bottom:b4,left:b4,right:b4},shading:{type:ShadingType.CLEAR,fill:COL.headerBg},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:header,font:F,size:20,bold:true,color:"FFFFFF"})]})]})
      ]}),
      ...steps.map((step,i) => new TableRow({children:[
        new TableCell({width:{size:800,type:WidthType.DXA},borders:{top:b2,bottom:b2,left:b2,right:b2},shading:{type:ShadingType.CLEAR,fill:COL.h1Accent},margins:{top:60,bottom:60,left:120,right:120},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:String(i+1),font:F,size:22,bold:true,color:"FFFFFF"})]})]}),
        new TableCell({width:{size:PW-800,type:WidthType.DXA},borders:{top:b2,bottom:b2,left:b2,right:b2},shading:{type:ShadingType.CLEAR,fill:i%2===0?"FFFFFF":"F9FAFB"},margins:{top:60,bottom:60,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:step,font:F,size:20,color:"374151"})]})]})
      ]}))
    ]
  });
}

function annotatedCode(title, lines) {
  const W1=Math.floor(PW*0.52), W2=PW-W1;
  const b4h={style:BorderStyle.SINGLE,size:4,color:"9CA3AF"};
  const b1 ={style:BorderStyle.SINGLE,size:1,color:"E5E7EB"};
  const b2b={style:BorderStyle.SINGLE,size:2,color:"BFDBFE"};
  return new Table({
    width:{size:PW,type:WidthType.DXA}, columnWidths:[W1,W2],
    rows:[
      new TableRow({tableHeader:true,children:[
        new TableCell({width:{size:W1,type:WidthType.DXA},borders:{top:b4h,bottom:b4h,left:b4h,right:{style:BorderStyle.SINGLE,size:2,color:"D1D5DB"}},shading:{type:ShadingType.CLEAR,fill:COL.headerBg},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:title||"Kod",font:F,size:20,bold:true,color:"FFFFFF"})]})]})  ,
        new TableCell({width:{size:W2,type:WidthType.DXA},borders:{top:b4h,bottom:b4h,left:{style:BorderStyle.SINGLE,size:2,color:"D1D5DB"},right:b4h},shading:{type:ShadingType.CLEAR,fill:COL.headerBg},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:"Wyjaśnienie",font:F,size:20,bold:true,color:"FFFFFF"})]})]}),
      ]}),
      ...lines.map(([code,expl],i) => new TableRow({children:[
        new TableCell({width:{size:W1,type:WidthType.DXA},borders:{top:b1,bottom:b1,left:b4h,right:b2b},shading:{type:ShadingType.CLEAR,fill:COL.codeBg},margins:{top:40,bottom:40,left:120,right:80},children:[new Paragraph({children:[new TextRun({text:code||" ",font:FC,size:17,color:"1A2E44"})]})]})  ,
        new TableCell({width:{size:W2,type:WidthType.DXA},borders:{top:b1,bottom:b1,left:b2b,right:b4h},shading:{type:ShadingType.CLEAR,fill:i%2===0?"FFFFFF":"F8FAFF"},margins:{top:40,bottom:40,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:expl||" ",font:F,size:19,color:"374151"})]})]})
      ]}))
    ]
  });
}

function dayBanner(dayNum, title, description) {
  return [
    sp(200),
    new Table({
      width: { size: PW, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: PW, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: "001D3D" },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: COL.h1Accent }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              margins: { top: 140, bottom: 140, left: 240, right: 240 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `DZIEŃ ${dayNum}  ·  `, font: F, size: 26, bold: true, color: COL.h1Accent }),
                    new TextRun({ text: title, font: F, size: 26, bold: true, color: "FFFFFF" }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 60, after: 0 },
                  children: [new TextRun({ text: description, font: F, size: 19, color: "A0C4E8", italics: true })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    sp(160),
  ];
}

// ─── HEADER / FOOTER ─────────────────────────────────────────────────────────
const makeHeader = () => new Header({children:[new Paragraph({
  border:{bottom:{style:BorderStyle.SINGLE,size:6,color:COL.h1Accent,space:1}},
  tabStops:[{type:TabStopType.RIGHT,position:PW}],
  spacing:{before:0,after:120},
  children:[
    new TextRun({text:"Programowanie Aplikacji Mobilnych — Ćwiczenie Laboratoryjne Flutter 2",font:F,size:18,color:"1A2E44"}),
    new TextRun({text:"\tRiverpod, Animacje, Hive i Testy Widgetów",font:F,size:18,color:"6B7280",italics:true}),
  ]
})]});
const makeFooter = () => new Footer({children:[new Paragraph({
  border:{top:{style:BorderStyle.SINGLE,size:4,color:"9CA3AF",space:1}},
  tabStops:[{type:TabStopType.RIGHT,position:PW}],
  spacing:{before:100,after:0},
  children:[
    new TextRun({text:"Katedra Informatyki — Instrukcja Laboratoryjna Flutter 2",font:F,size:17,color:"6B7280"}),
    new TextRun({text:"\t",font:F,size:17}),
    new SimpleField("PAGE"),
  ]
})]});

// ─── OKŁADKA ─────────────────────────────────────────────────────────────────
function makeCover() {
  const w = Math.floor(PW/3);
  const infoData = [["Czas trwania","3 × 90 min"],["Poziom trudności","Średniozaawansowany"],["Punktacja","100 pkt"]];
  const infoCells = infoData.map(([label,value]) => new TableCell({
    width:{size:w,type:WidthType.DXA},
    borders:{top:{style:BorderStyle.SINGLE,size:4,color:"D1D5DB"},bottom:{style:BorderStyle.SINGLE,size:4,color:"D1D5DB"},left:{style:BorderStyle.SINGLE,size:4,color:"D1D5DB"},right:{style:BorderStyle.SINGLE,size:4,color:"D1D5DB"}},
    shading:{type:ShadingType.CLEAR,fill:"F3F4F6"},
    margins:{top:80,bottom:80,left:120,right:120},
    children:[
      new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:label,font:F,size:18,color:"6B7280"})]}),
      new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:value,font:F,size:22,bold:true,color:COL.headerBg})]}),
    ]
  }));
  return [
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:800,after:0},children:[new TextRun({text:"POLITECHNIKA",font:F,size:26,bold:true,color:COL.headerBg})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:600},children:[new TextRun({text:"KATEDRA INFORMATYKI",font:F,size:22,color:"6B7280"})]}),

    new Table({width:{size:PW,type:WidthType.DXA},columnWidths:[PW],rows:[new TableRow({children:[new TableCell({
      width:{size:PW,type:WidthType.DXA},
      borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
      shading:{type:ShadingType.CLEAR,fill:COL.h1Accent},margins:{top:120,bottom:120,left:200,right:200},
      children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"ĆWICZENIE LABORATORYJNE FLUTTER 2",font:F,size:22,bold:true,color:"FFFFFF"})]})]
    })]})]},

    new Table({width:{size:PW,type:WidthType.DXA},columnWidths:[PW],rows:[new TableRow({children:[new TableCell({
      width:{size:PW,type:WidthType.DXA},
      borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
      shading:{type:ShadingType.CLEAR,fill:COL.headerBg},margins:{top:200,bottom:200,left:200,right:200},
      children:[
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Riverpod, Animacje, Hive",font:F,size:44,bold:true,color:"FFFFFF"})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80,after:0},children:[new TextRun({text:"i Testy Widgetów",font:F,size:36,bold:true,color:"54C5F8"})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:100,after:0},children:[new TextRun({text:"Programowanie Aplikacji Mobilnych — moduł Flutter",font:F,size:20,color:"93C5FD",italics:true})]}),
      ]
    })]})]},

    sp(400),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Projekt: WeatherApp v2 — rozszerzenie projektu z Flutter Lab 1",font:F,size:22,color:"374151"})]}),
    sp(200),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Wymagania wstępne: ukończony Flutter Lab 1 (Dart, widgety, Provider, GoRouter, http)",font:F,size:20,color:"6B7280"})]}),
    sp(600),
    new Table({width:{size:PW,type:WidthType.DXA},columnWidths:[w,w,PW-2*w],rows:[new TableRow({children:infoCells})]}),
    new Paragraph({children:[new PageBreak()]}),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// TREŚĆ
// ════════════════════════════════════════════════════════════════════════════
const content = [
  ...makeCover(),

  // SPIS TREŚCI
  new Paragraph({
    heading:HeadingLevel.HEADING_1,
    children:[new TextRun({text:"Spis treści",font:F,size:28,bold:true,color:"FFFFFF"})],
    shading:{type:ShadingType.CLEAR,fill:COL.headerBg},
    border:{left:{style:BorderStyle.SINGLE,size:24,color:COL.h1Accent}},
    spacing:{before:0,after:160},indent:{left:160},
  }),
  new TableOfContents("Spis treści",{hyperlink:true,headingStyleRange:"1-3"}),
  new Paragraph({children:[new PageBreak()]}),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 1 — OD PROVIDER DO RIVERPOD
  // ═══════════════════════════════════════════════════════════════
  ...dayBanner(1, "Riverpod i lokalna baza danych Hive", "Sekcje 1–3 · ~90 minut · Migracja z Provider do Riverpod, typy providerów, persystencja danych offline z Hive"),
  h1("1. Od Provider do Riverpod — dlaczego warto przejść?"),
  para("W Flutter Lab 1 zarządzaliśmy stanem przy pomocy Provider i ChangeNotifier. Provider jest świetny na start, ale w miarę rozrostu aplikacji ujawnia ograniczenia: trudność z zależnościami między providerami, brak wsparcia dla asynchroniczności, konieczność ręcznego dispose(). Riverpod rozwiązuje te problemy i jest oficjalnie rekomendowanym następcą Providera przez tego samego autora — Rémi Rousselet."),
  sp(),

  h2("1.1 Problemy z Provider w dużych aplikacjach"),
  twoColTable([
    ["Problem z Provider","Jak Riverpod to rozwiązuje"],
    ["Zależności między providerami wymagają uważnej kolejności w drzewie widgetów. Błędna kolejność = brak dostępu.","Providery Riverpoda są globalne i mogą odczytywać siebie nawzajem bez zależności od drzewa widgetów."],
    ["ChangeNotifier musi być ręcznie dispose()owany. Zapomnienie to wyciek pamięci.","Riverpod automatycznie zarządza cyklem życia — niszczy providera gdy nikt go nie obserwuje."],
    ["Brak natywnego wsparcia dla Future/Stream w jednym providerze. Trzeba samemu obsługiwać loading/error.","AsyncNotifierProvider i FutureProvider wbudowują obsługę trzech stanów: loading, data, error (AsyncValue)."],
    ["Context.read() w callbackach może rzucić wyjątek jeśli widget jest nieaktywny.","ref.read() jest bezpieczne niezależnie od cyklu życia widgetu."],
    ["Trudne testowanie — trzeba owijać widgety w ProviderScope i dbać o kolejność.","Testy Riverpoda są proste: nadpisz jeden provider przez ProviderScope(overrides:[])."],
  ], 3400, PW-3400),
  sp(120),

  analog("Analogia: tablica ogłoszeń vs. radio na żywo","[PROVIDER]\nTablica ogłoszeń w korytarzu szkoły: ogłoszenia wiszą w konkretnym miejscu.\nMożesz je przeczytać tylko jeśli jesteś w tym korytarzu (kontekst!).\nJeśli zmienisz korytarz (przejdziesz do innego ekranu), musisz szukać innej tablicy.\n\n[RIVERPOD]\nRadio na żywo: możesz dostroić się do dowolnej stacji z dowolnego miejsca w domu.\nNie musisz wiedzieć gdzie jest nadajnik — po prostu podajesz nazwę stacji.\nRadio pamięta czy ktoś słucha — wyłącza się samo gdy nikt nie słucha (auto dispose).",[]),
  sp(120),

  h2("1.2 Konfiguracja Riverpod"),
  codeBlock([
    "# pubspec.yaml — zastąp lub dodaj obok provider:",
    "dependencies:",
    "  flutter_riverpod: ^2.5.1    # Riverpod dla Flutter (z integracją widgetów)",
    "  riverpod_annotation: ^2.3.5 # Opcjonalnie — generowanie kodu przez @riverpod",
    "",
    "dev_dependencies:",
    "  riverpod_generator: ^2.4.0  # Generuje providery z adnotacji (jak KSP w Androidzie)",
    "  build_runner: ^2.4.9        # Runner dla generatora",
    "",
    "# Uruchom po dodaniu:",
    "flutter pub get",
    "",
    "# Dla generatora kodu (riverpod_generator) — opcjonalne, ale wygodne:",
    "dart run build_runner watch --delete-conflicting-outputs",
  ],"pubspec.yaml — Riverpod"),
  sp(80),
  codeBlock([
    "// main.dart — owiń całą aplikację w ProviderScope",
    "void main() {",
    "  runApp(",
    "    const ProviderScope(   // WYMAGANE — rejestr wszystkich providerów Riverpoda",
    "      child: MyApp(),      // Bez ProviderScope: wyjątek MissingProviderScopeException",
    "    ),",
    "  );",
    "}",
    "",
    "// MyApp.dart — użyj ConsumerWidget zamiast StatelessWidget",
    "class MyApp extends ConsumerWidget {  // <- ConsumerWidget, nie StatelessWidget",
    "  const MyApp({super.key});",
    "",
    "  @override",
    "  Widget build(BuildContext context, WidgetRef ref) {  // <- dodany WidgetRef ref",
    "    // ref = dostęp do providerów (jak context w Provider, ale bezpieczniejszy)",
    "    return MaterialApp.router(routerConfig: appRouter, ...);",
    "  }",
    "}",
  ],"main.dart — konfiguracja ProviderScope"),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 2 — TYPY PROVIDERÓW RIVERPOD
  // ═══════════════════════════════════════════════════════════════
  h1("2. Typy providerów — kiedy którego użyć?"),
  para("Riverpod oferuje kilka wyspecjalizowanych typów providerów. Wybór właściwego jest kluczowy — błędny typ to nadmiarowy kod i trudne debugowanie. Poniżej: kompletna mapa decyzji."),
  sp(),

  twoColTable([
    ["Typ providera","Kiedy używać / Co przechowuje / Przykład"],
    ["Provider<T>","Wartości tylko do odczytu — stałe, konfiguracja, obiekty serwisów. Nie zmienia się w czasie. Przykład: Provider<WeatherService>((ref) => WeatherService())."],
    ["StateProvider<T>","Prosty stan mutable — licznik, przełącznik, wybrany indeks. Nie używaj dla złożonych obiektów. Przykład: StateProvider<String>((ref) => 'Warszawa')."],
    ["FutureProvider<T>","Dane asynchroniczne tylko do odczytu — jednorazowe żądanie API. Automatycznie zarządza AsyncValue (loading/data/error). Przykład: FutureProvider<WeatherData>((ref) => service.fetch())."],
    ["StreamProvider<T>","Dane asynchroniczne ze strumienia — WebSocket, Firestore real-time, sensor. Jak FutureProvider ale dla Stream<T>. Przykład: StreamProvider<double>((ref) => locationStream())."],
    ["NotifierProvider<N,T>","Złożony mutable stan z logiką. Klasa Notifier ma metody zmieniające stan. Synchroniczny odpowiednik ChangeNotifier. Przykład: lista zadań z add/remove/toggle."],
    ["AsyncNotifierProvider<N,T>","Jak NotifierProvider ale dla danych asynchronicznych. Build() zwraca Future<T>. Najlepszy do zarządzania danymi z API z możliwością odświeżania. Przykład: WeatherNotifier z metodą reload()."],
  ], 2400, PW-2400),
  sp(120),

  why("Dlaczego tyle typów? Czy nie wystarczyłby jeden?","Każdy typ jest zoptymalizowany dla swojego przypadku użycia.\nFutureProvider<T> automatycznie anuluje poprzednie żądanie gdy parametr się zmieni — Provider<Future<T>> tego nie robi.\nStateProvider<T> dla prostego inta jest szybszy niż NotifierProvider — mniej boilerplate.\nTypy są jak narzędzia: młotek, śrubokręt, klucz. Każde robi jedno dobrze, zamiast jedno robi wszystko średnio.",[]),
  sp(120),

  h2("2.1 NotifierProvider — przykład: ulubione miasta"),
  annotatedCode("favorites_provider.dart — NotifierProvider", [
    ["// Klasa Notifier — logika i stan"                                 ,"Notifier<T> = klasa przechowująca stan i metody go zmieniające"],
    ["class FavoritesNotifier extends Notifier<List<String>> {"          ,"Generyk T = typ stanu. Tu: Lista stringów (nazwy miast)"],
    ["  @override"                                                        ,""],
    ["  List<String> build() {"                                           ,"build() = tworzy stan początkowy. Wywoływane raz przy inicjalizacji."],
    ["    return ['Warszawa', 'Kraków'];  // stan domyślny"              ,"Możesz tu async ładować z Hive/SharedPreferences"],
    ["  }"                                                                ,""],
    [""                                                                   ,""],
    ["  void addCity(String city) {"                                      ,"Metoda publiczna — widgety wywołują ją przez ref.read"],
    ["    if (state.contains(city)) return;  // guard"                   ,"Sprawdź duplikat przed dodaniem"],
    ["    state = [...state, city];  // NIEZMIENNOŚĆ!"                   ,"state = nowa lista (nie mutuj istniejącej)! Riverpod powiadomi widgety."],
    ["  }"                                                                ,""],
    [""                                                                   ,""],
    ["  void removeCity(String city) {"                                   ,""],
    ["    state = state.where((c) => c != city).toList();"               ,"Filtruj przez where() zamiast remove() — zwraca nową listę"],
    ["  }"                                                                ,""],
    [""                                                                   ,""],
    ["  bool contains(String city) => state.contains(city);"             ,"Metoda pomocnicza — getter bez zmiany stanu"],
    ["}"                                                                  ,""],
    [""                                                                   ,""],
    ["// Definicja providera (globalna, poza klasą)"                     ,"Provider definiowany globalnie — dostępny z każdego miejsca"],
    ["final favoritesProvider ="                                          ,"final = przypisz raz (stały globalny)"],
    ["  NotifierProvider<FavoritesNotifier, List<String>>("              ,"Generyki: <KlasaNotifier, TypStanu>"],
    ["    FavoritesNotifier.new,"                                         ,"Przekaż konstruktor klasy (nie instancję)"],
    ["  );"                                                               ,""],
  ]),
  sp(120),

  h2("2.2 AsyncNotifierProvider — dane z API"),
  annotatedCode("weather_provider.dart — AsyncNotifierProvider", [
    ["class WeatherNotifier"                                              ,"AsyncNotifier<T> = Notifier z asynchronicznym build()"],
    ["    extends AsyncNotifier<WeatherData?> {"                         ,"T = WeatherData? (nullable — przed załadowaniem)"],
    [""                                                                   ,""],
    ["  @override"                                                        ,""],
    ["  Future<WeatherData?> build() async {"                            ,"build() jest async — zwraca Future. Riverpod auto-obsługuje loading/error."],
    ["    return null;  // stan początkowy: brak danych"                 ,"Null = nic nie załadowane. UI zobaczy AsyncValue.data(null)."],
    ["  }"                                                                ,""],
    [""                                                                   ,""],
    ["  Future<void> fetch(String city) async {"                         ,"Publiczna metoda — widgety wywołują ref.read(wp.notifier).fetch(city)"],
    ["    state = const AsyncLoading();  // pokaż spinner"              ,"AsyncLoading() = stan ładowania. UI zobaczy CircularProgressIndicator."],
    ["    state = await AsyncValue.guard(() async {"                     ,"AsyncValue.guard = try-catch który konwertuje wyjątek na AsyncError"],
    ["      final svc = ref.read(weatherServiceProvider);"              ,"ref.read() — odczytaj inny provider (wstrzyknięcie zależności!)"],
    ["      return svc.fetchWeather(city);"                              ,"Wywołaj serwis. Jeśli rzuci wyjątek, state = AsyncError automatycznie."],
    ["    });"                                                            ,""],
    ["  }"                                                                ,""],
    [""                                                                   ,""],
    ["  Future<void> reload() async {"                                   ,"Odśwież dane — wywołaj ref.invalidateSelf() lub re-fetch"],
    ["    final city = /* zapamiętaj ostatnie miasto */ _lastCity;"     ,"Przechowaj ostatnie miasto w polu klasy"],
    ["    if (city != null) await fetch(city);"                          ,""],
    ["  }"                                                                ,""],
    ["}"                                                                  ,""],
    [""                                                                   ,""],
    ["final weatherProvider ="                                            ,""],
    ["  AsyncNotifierProvider<WeatherNotifier, WeatherData?>(() =>"     ,""],
    ["    WeatherNotifier());"                                            ,"() => WeatherNotifier() — anonimowa fabryka (nie .new bo ma zależności)"],
  ]),
  sp(120),

  h2("2.3 Odczyt i modyfikacja stanu w widgetach"),
  codeBlock([
    "// ConsumerWidget — stateless widget z dostępem do ref",
    "class HomeScreen extends ConsumerWidget {",
    "  const HomeScreen({super.key});",
    "",
    "  @override",
    "  Widget build(BuildContext context, WidgetRef ref) {",
    "    // ref.watch() = obserwuj i przebuduj przy zmianie (jak context.watch<T>() w Provider)",
    "    final favorites = ref.watch(favoritesProvider);     // List<String>",
    "    final weatherAsync = ref.watch(weatherProvider);    // AsyncValue<WeatherData?>",
    "",
    "    return Scaffold(",
    "      body: weatherAsync.when(",
    "        // AsyncValue.when() = elegancki switch na wszystkie 3 stany",
    "        loading: () => const CircularProgressIndicator(),",
    "        error:   (err, stack) => ErrorWidget(message: err.toString()),",
    "        data:    (weather) => WeatherCard(weather: weather),",
    "      ),",
    "      floatingActionButton: FloatingActionButton(",
    "        // ref.read() = jednorazowy odczyt / akcja (nie subskrybuje zmian)",
    "        onPressed: () => ref.read(weatherProvider.notifier).fetch('Kraków'),",
    "        child: const Icon(Icons.refresh),",
    "      ),",
    "    );",
    "  }",
    "}",
    "",
    "// ConsumerStatefulWidget — stateful widget z ref",
    "class SearchScreen extends ConsumerStatefulWidget {",
    "  const SearchScreen({super.key});",
    "  @override",
    "  ConsumerState<SearchScreen> createState() => _SearchScreenState();",
    "}",
    "",
    "class _SearchScreenState extends ConsumerState<SearchScreen> {",
    "  // ref jest dostępne bezpośrednio (jak this.ref)",
    "  void _onSearch(String city) {",
    "    ref.read(weatherProvider.notifier).fetch(city);",
    "    ref.read(favoritesProvider.notifier).addCity(city);",
    "  }",
    "  // ...",
    "}",
  ],"ConsumerWidget i ConsumerStatefulWidget"),
  sp(120),

  warn("ref.watch() tylko w build() — nie w callbackach i initState()!","Zasada identyczna jak z context.watch() w Provider:\nref.watch() w onPressed() / initState() / didChangeDependencies() → wyjątek ProviderException.\nref.read()  = wywołaj w callbackach i initState() (jednorazowe działanie).\nref.listen() = obserwuj i reaguj na zmiany bez przebudowywania widgetu (np. wyświetl SnackBar).",[]),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 3 — HIVE — LOKALNA BAZA DANYCH
  // ═══════════════════════════════════════════════════════════════
  h1("3. Hive — lokalna baza danych NoSQL"),
  para("W Flutter Lab 1 wspomniano SharedPreferences do przechowywania prostych wartości (stringów, liczb). SharedPreferences jest odpowiedni dla ustawień. Do przechowywania złożonych obiektów (listy, zagnieżdżone dane, modele) znacznie lepszy jest Hive — lekka, wydajna baza NoSQL napisana w czystym Darcie."),
  sp(),

  h2("3.1 Hive kontra inne opcje przechowywania"),
  twoColTable([
    ["Rozwiązanie","Kiedy używać / Wady i zalety"],
    ["SharedPreferences","Proste wartości: bool, int, String, List<String>. Synchroniczne API. Nie nadaje się do złożonych obiektów ani dużych danych."],
    ["Hive","Obiekty Dart jako rekordy. Bardzo szybki (zapisy w mikros). Brak SQL — proste klucz→wartość i listy. Dobry do offline cache, ulubionych, historii."],
    ["Sqflite (SQLite)","Relacyjna baza danych. Dobra gdy potrzebne zapytania SQL, relacje, złożone filtry. Trudniejsze API niż Hive. Odpowiednik Room z Androida."],
    ["drift (dawniej moor)","Type-safe Dart wrapper na SQLite z generowaniem kodu. Jak Room dla Fluttera — bardziej ergonomiczny niż sqflite, ale więcej boilerplate."],
    ["Isar","Następca Hive od tego samego autora. Szybszy, z obsługą indeksów i zapytań. Wymaga więcej konfiguracji. Dobry wybór dla nowych projektów zamiast Hive."],
  ], 2400, PW-2400),
  sp(120),

  h2("3.2 Konfiguracja i inicjalizacja Hive"),
  codeBlock([
    "# pubspec.yaml",
    "dependencies:",
    "  hive: ^2.2.3               # Silnik Hive",
    "  hive_flutter: ^1.1.0       # Integracja z Flutter (Hive.initFlutter)",
    "  path_provider: ^2.1.3      # Ścieżka do katalogu danych aplikacji",
    "",
    "dev_dependencies:",
    "  hive_generator: ^2.0.1     # Generator TypeAdapter z @HiveType/@HiveField",
    "  build_runner: ^2.4.9       # Runner generatora (już dodany dla Riverpoda)",
  ],"pubspec.yaml — Hive"),
  sp(80),
  codeBlock([
    "// main.dart — inicjalizacja Hive PRZED runApp()",
    "Future<void> main() async {",
    "  // Wymagane przed Hive.initFlutter() i runApp()",
    "  WidgetsFlutterBinding.ensureInitialized();",
    "",
    "  // Inicjalizuj Hive z katalogiem danych aplikacji (DocumentsDirectory na iOS,",
    "  // AppData na Androidzie) — hive_flutter robi to automatycznie",
    "  await Hive.initFlutter();",
    "",
    "  // Zarejestruj adaptery dla niestandardowych typów (PRZED openBox!)",
    "  Hive.registerAdapter(WeatherDataAdapter());   // generowany przez build_runner",
    "  Hive.registerAdapter(CityGeoAdapter());",
    "",
    "  // Otwórz skrzynki (bazy) — nazwa = identyfikator, jak nazwa tabeli",
    "  await Hive.openBox<WeatherData>('weatherCache');   // cache pogody",
    "  await Hive.openBox<String>('favorites');            // ulubione miasta (String)",
    "",
    "  runApp(const ProviderScope(child: MyApp()));",
    "}",
  ],"main.dart — inicjalizacja Hive"),
  sp(120),

  h2("3.3 Model danych z adnotacjami Hive"),
  annotatedCode("weather_data.dart — model z @HiveType", [
    ["import 'package:hive/hive.dart';"                              ,"Import adnotacji Hive"],
    [""                                                               ,""],
    ["part 'weather_data.g.dart';  // GENEROWANY plik"              ,"part = część tego pliku (generowana przez build_runner)"],
    [""                                                               ,""],
    ["@HiveType(typeId: 0)         // typeId musi być unikalny!"    ,"typeId 0–223: unikalne ID dla każdej klasy. Nie zmieniaj po wdrożeniu!"],
    ["class WeatherData extends HiveObject {  // HiveObject!"       ,"HiveObject = metody .save() i .delete() na obiekcie"],
    ["  @HiveField(0)              // indeks pola"                   ,"HiveField(index): unikalne pole w klasie. Nie zmieniaj kolejności!"],
    ["  late String city;"                                           ,"late = inicjalizacja przez Hive przy odczycie (nie w konstruktorze)"],
    ["  @HiveField(1)"                                               ,""],
    ["  late double temperature;"                                    ,""],
    ["  @HiveField(2)"                                               ,""],
    ["  late int humidity;"                                          ,""],
    ["  @HiveField(3)"                                               ,""],
    ["  late DateTime updatedAt;"                                    ,"DateTime jest serializowany natywnie przez Hive"],
    [""                                                               ,""],
    ["  // Konstruktor domyślny (wymagany przez Hive)"               ,"Hive tworzy obiekty przez konstruktor domyślny (bezparametrowy)"],
    ["  WeatherData();"                                              ,""],
    [""                                                               ,""],
    ["  // Konstruktor fabryczny dla wygody"                         ,""],
    ["  factory WeatherData.from({"                                  ,""],
    ["    required String city,"                                     ,""],
    ["    required double temperature,"                              ,""],
    ["    required int humidity,"                                    ,""],
    ["  }) => WeatherData()"                                         ,""],
    ["    ..city = city"                                             ,"..city = cascade — przypisz pole i zwróć obiekt"],
    ["    ..temperature = temperature"                               ,""],
    ["    ..humidity = humidity"                                     ,""],
    ["    ..updatedAt = DateTime.now();"                             ,""],
    ["}"                                                             ,""],
  ]),
  sp(80),
  codeBlock([
    "# Generowanie kodu adaptera (uruchom w terminalu):",
    "dart run build_runner build --delete-conflicting-outputs",
    "",
    "# Lub w trybie watch (auto-generuje przy każdej zmianie):",
    "dart run build_runner watch --delete-conflicting-outputs",
    "",
    "# Efekt: plik weather_data.g.dart z klasą WeatherDataAdapter",
    "# Nie edytuj weather_data.g.dart — jest nadpisywany przy każdym build!",
  ],"Generowanie kodu Hive"),
  sp(120),

  h2("3.4 Operacje CRUD na skrzynce Hive"),
  annotatedCode("weather_cache_service.dart — operacje Hive", [
    ["class WeatherCacheService {"                                    ,"Serwis enkapsulujący operacje na Hive"],
    ["  // Pobierz otwarty Box (już otwarty w main())"               ,"Hive.box() — synchroniczny, Box musi być już otwarty"],
    ["  Box<WeatherData> get _box =>"                                ,""],
    ["    Hive.box<WeatherData>('weatherCache');"                    ,"Nie otwieraj Box w serwisie — otwieranie jest async, rób to w main()"],
    [""                                                               ,""],
    ["  // ZAPIS — klucz: nazwa miasta"                              ,""],
    ["  Future<void> cacheWeather(WeatherData data) async {"         ,"async mimo że Hive jest synchroniczny — dla spójności API"],
    ["    await _box.put(data.city.toLowerCase(), data);"            ,"put(key, value) — zapisz. Klucz: lowercase nazwa miasta"],
    ["  }"                                                            ,""],
    [""                                                               ,""],
    ["  // ODCZYT — zwróć null jeśli brak w cache"                  ,""],
    ["  WeatherData? getCached(String city) {"                       ,"Synchroniczny odczyt — Hive działa w pamięci"],
    ["    return _box.get(city.toLowerCase());"                      ,"get(key) — zwróć wartość lub null"],
    ["  }"                                                            ,""],
    [""                                                               ,""],
    ["  // SPRAWDŹ AKTUALNOŚĆ — starsze niż 30 minut = nieaktualne" ,""],
    ["  bool isFresh(String city) {"                                  ,""],
    ["    final cached = getCached(city);"                            ,""],
    ["    if (cached == null) return false;"                          ,""],
    ["    final age = DateTime.now().difference(cached.updatedAt);"  ,"difference() = Duration między dwoma DateTime"],
    ["    return age.inMinutes < 30;"                                 ,"Dane aktualne przez 30 minut"],
    ["  }"                                                            ,""],
    [""                                                               ,""],
    ["  // USUŃ jeden wpis"                                           ,""],
    ["  Future<void> remove(String city) async {"                    ,""],
    ["    await _box.delete(city.toLowerCase());"                    ,"delete(key) — usuń klucz"],
    ["  }"                                                            ,""],
    [""                                                               ,""],
    ["  // LISTA WSZYSTKICH KLUCZY (nazwy miast w cache)"            ,""],
    ["  List<String> get cachedCities =>"                            ,""],
    ["    _box.keys.cast<String>().toList();"                        ,"keys — Iterable<dynamic>, cast<String> — typed"],
    ["}"                                                              ,""],
  ]),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 4 — ANIMACJE NIEJAWNE
  // ═══════════════════════════════════════════════════════════════
  ...dayBanner(2, "Animacje i testowanie widgetów", "Sekcje 4–7 · ~90 minut · Animacje niejawne i jawne (AnimationController), testy widgetów z flutter_test i mockowanie z Mocktail"),
  h1("4. Animacje niejawne — Animated* widgety"),
  para("Flutter dzieli animacje na dwie kategorie. Animacje niejawne (implicit) obsługują proste przejścia automatycznie — wystarczy zmienić wartość a Flutter sam animuje przejście. Animacje jawne (explicit) dają pełną kontrolę nad czasem, przebiegiem i sekwencją. Zacznijmy od prostszych — niejawnych."),
  sp(),

  analog("Analogia: automatyczna skrzynia biegów vs. manualna","ANIMACJE NIEJAWNE (Animated*) = automatyczna skrzynia biegów:\nPodajesz docelową wartość (temperatura, pozycja, kolor). Auto płynnie przejdzie do celu.\nIdealny dla prostych stanów: pokaż/ukryj, powiększ/pomniejsz, zmień kolor.\n\nANIMACJE JAWNE (AnimationController) = manualna skrzynia biegów:\nKontrolujesz każdą milisekundę. Możesz cofnąć, zatrzymać, zapętlić, synchronizować.\nPotrzebne gdy animacja jest złożona, zależy od gestu użytkownika lub synchronizuje wiele elementów.",[]),
  sp(120),

  h2("4.1 Przegląd Animated* widgetów"),
  twoColTable([
    ["Widget","Co animuje i przykład użycia"],
    ["AnimatedContainer","Dowolna właściwość Containera: kolor, rozmiar, padding, margin, borderRadius. Najczęściej używany."],
    ["AnimatedOpacity","Przezroczystość (0.0–1.0). Efekt pokaż/ukryj. Zamień Opacity → AnimatedOpacity."],
    ["AnimatedPositioned","Pozycja w Stack (top, left, right, bottom). Animuje ruch elementu w obrębie Stack."],
    ["AnimatedSwitcher","Animowane przejście między RÓŻNYMI widgetami. Automatyczne fade/scale gdy child się zmieni."],
    ["AnimatedCrossFade","Płynne przejście między DWOMA konkretnymi widgetami (firstChild ↔ secondChild)."],
    ["AnimatedList","Animowane dodawanie i usuwanie elementów listy (slide + fade). Wymaga GlobalKey."],
    ["AnimatedAlign","Animuje wyrównanie widgetu (Alignment) wewnątrz rodzica."],
    ["TweenAnimationBuilder","Animuje dowolną wartość (int, double, Color, Offset) z własnym Tween. Wszystko co nie ma dedykowanego Animated* widgetu."],
  ], 2600, PW-2600),
  sp(120),

  h2("4.2 AnimatedContainer — płynne przejście właściwości"),
  annotatedCode("AnimatedContainer — karta pogody reagująca na stan", [
    ["class WeatherCard extends StatefulWidget { ... }"               ,"StatefulWidget — stan kontroluje animację"],
    [""                                                                ,""],
    ["// W _WeatherCardState:"                                         ,""],
    ["bool _isExpanded = false;  // stan karty"                       ,"Stan lokalny — rozwinięta/zwinięta karta"],
    [""                                                                ,""],
    ["@override Widget build(BuildContext context) {"                  ,""],
    ["  return GestureDetector("                                       ,"GestureDetector — detekcja dotyku bez ripple"],
    ["    onTap: () => setState(() => _isExpanded = !_isExpanded),"   ,"Zmień stan po tapnięciu → AnimatedContainer się uruchomi"],
    ["    child: AnimatedContainer("                                   ,"Zamiast Container → AnimatedContainer"],
    ["      duration: const Duration(milliseconds: 300),"             ,"Czas trwania animacji — 200–400ms to 'naturalne' przejście"],
    ["      curve: Curves.easeInOut,"                                  ,"Krzywa animacji: easeInOut = powoli start, powoli koniec"],
    ["      // Właściwości animowane — zmienią się płynnie:"          ,"Wszystkie właściwości będą interpolowane przez duration"],
    ["      height: _isExpanded ? 200.0 : 80.0,"                     ,"Wysokość: 80 → 200 dp (animacja rozwinięcia)"],
    ["      color: _isExpanded"                                        ,""],
    ["        ? Theme.of(context).colorScheme.primaryContainer"       ,"Kolor tła zmienia się wraz z rozwinięciem"],
    ["        : Theme.of(context).colorScheme.surface,"               ,""],
    ["      padding: EdgeInsets.all(_isExpanded ? 20.0 : 8.0),"      ,"Padding też animowany!"],
    ["      decoration: BoxDecoration("                                ,""],
    ["        borderRadius: BorderRadius.circular("                    ,""],
    ["          _isExpanded ? 24.0 : 12.0),"                          ,"Zaokrąglenie narożników animowane"],
    ["      ),"                                                         ,""],
    ["      child: WeatherInfo(isExpanded: _isExpanded),"             ,"Zawartość — nie animowana (tylko kontener)"],
    ["    ),"                                                           ,""],
    ["  );"                                                             ,""],
    ["}"                                                                ,""],
  ]),
  sp(120),

  h2("4.3 AnimatedSwitcher — przejście między widgetami"),
  annotatedCode("AnimatedSwitcher — zmiana ikony pogody", [
    ["AnimatedSwitcher("                                               ,"AnimatedSwitcher animuje gdy child się zmienia"],
    ["  duration: const Duration(milliseconds: 400),"                  ,""],
    ["  // Customowy przechód: fade + scale (zamiast domyślnego fade)"  ,""],
    ["  transitionBuilder: (child, animation) {"                       ,"transitionBuilder = jak animujesz stary i nowy child"],
    ["    return ScaleTransition("                                      ,"ScaleTransition = animacja skali"],
    ["      scale: animation,"                                          ,"animation: 0.0→1.0 dla nowego, 1.0→0.0 dla starego"],
    ["      child: FadeTransition(opacity: animation, child: child),"  ,"Combine scale + fade dla efektu 'popping in'"],
    ["    );"                                                           ,""],
    ["  },"                                                             ,""],
    ["  // KLUCZOWE: każdy child musi mieć unikalny Key!"              ,"Bez Key Flutter myśli że to ten sam widget → brak animacji!"],
    ["  child: Icon("                                                   ,""],
    ["    _getWeatherIcon(weatherCode),  // zmienia się"               ,"Gdy weatherCode się zmieni, zmieni się icon — AnimatedSwitcher to zauważy"],
    ["    key: ValueKey<int>(weatherCode),  // unikalny Key!"          ,"ValueKey(wartość) — identyfikuje unikalnie child dla AnimatedSwitcher"],
    ["    size: 64,"                                                    ,""],
    ["  ),"                                                             ,""],
    [")"                                                                ,""],
  ]),
  sp(120),

  warn("AnimatedSwitcher bez Key — najczęstszy błąd z animacjami!","Gdy child zmienia się ale Key NIE jest ustawiony, Flutter nie 'widzi' zmiany.\nMyśli że to ten sam widget o zmienionych właściwościach → brak animacji przejścia.\n\nZASADA: Każdy child AnimatedSwitcher MUSI mieć unikalny Key.\nDobre Keys: ValueKey(iconCode), ValueKey(weatherCode), ObjectKey(weatherData).\nZłe Keys: UniqueKey() — tworzy nowy Key przy każdym rebuild → zbyt częste animacje.",[]),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 5 — ANIMACJE JAWNE
  // ═══════════════════════════════════════════════════════════════
  h1("5. Animacje jawne — AnimationController"),
  para("Gdy Animated* widgety nie wystarczają — potrzebujesz pełnej kontroli nad animacją, możliwości jej zatrzymania, cofnięcia lub synchronizacji z gestem — sięgamy po AnimationController. To niskopoziomowe API, ale daje nieograniczone możliwości."),
  sp(),

  h2("5.1 AnimationController — podstawy"),
  annotatedCode("Pulsujący wskaźnik temperatury z AnimationController", [
    ["class PulsingTempIndicator extends StatefulWidget { ... }"      ,"StatefulWidget wymagany — AnimationController to mutable state"],
    [""                                                                ,""],
    ["class _PulsingTempState extends State<PulsingTempIndicator>"    ,""],
    ["    with SingleTickerProviderStateMixin {"                       ,"with SingleTickerProviderStateMixin — dostarcza vsync (takt animacji)"],
    [""                                                                ,"vsync synchronizuje animację z odświeżaniem ekranu (60fps)"],
    ["  late AnimationController _controller;"                        ,"late = inicjalizacja w initState (nie w konstruktorze)"],
    ["  late Animation<double> _scaleAnimation;"                      ,"Animation<T> = wartości w czasie (Tween zdefiniuje zakres)"],
    [""                                                                ,""],
    ["  @override void initState() {"                                  ,""],
    ["    super.initState();"                                          ,""],
    ["    _controller = AnimationController("                          ,"Twórz kontroler ZAWSZE w initState()"],
    ["      vsync: this,                  // provider taktu (this = mixin)"  ,"this = SingleTickerProviderStateMixin dostarcza vsync"],
    ["      duration: const Duration(seconds: 1),"                    ,"Czas jednego cyklu animacji (0→1)"],
    ["    );"                                                           ,""],
    [""                                                                ,""],
    ["    _scaleAnimation = Tween<double>("                            ,"Tween = interpolator: od begin do end"],
    ["      begin: 1.0,  // rozmiar normalny"                         ,"begin = wartość na początku animacji (controller = 0)"],
    ["      end: 1.2,    // 20% większy"                              ,"end = wartość na końcu animacji (controller = 1)"],
    ["    ).animate(CurvedAnimation("                                  ,"animate() = połącz Tween z kontrolerem i krzywą"],
    ["      parent: _controller,"                                      ,"parent = skąd bierzemy czas (0.0–1.0)"],
    ["      curve: Curves.easeInOut,"                                  ,"Krzywa kształtuje tempo: easeInOut = naturalne pulse"],
    ["    ));"                                                          ,""],
    [""                                                                ,""],
    ["    // Zapętl animację (pulsowanie)"                             ,""],
    ["    _controller.repeat(reverse: true);  // 0→1→0→1→..."        ,"reverse:true = animuj do końca, potem wstecz (ping-pong)"],
    ["  }"                                                             ,""],
    [""                                                                ,""],
    ["  @override void dispose() {"                                    ,""],
    ["    _controller.dispose();  // KONIECZNE!"                      ,"Brak dispose() = wyciek pamięci. AnimationController nie jest GC'owany."],
    ["    super.dispose();"                                            ,""],
    ["  }"                                                             ,""],
    [""                                                                ,""],
    ["  @override Widget build(BuildContext context) {"                ,""],
    ["    return ScaleTransition("                                      ,"ScaleTransition nasłuchuje _scaleAnimation automatycznie"],
    ["      scale: _scaleAnimation,"                                   ,"Nie potrzeba AnimatedBuilder — ScaleTransition jest gotowy"],
    ["      child: Text('\${widget.temp}°C',"                         ,"widget.temp = dostęp do pól StatefulWidget z State"],
    ["        style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold),"  ,""],
    ["      ),"                                                         ,""],
    ["    );"                                                           ,""],
    ["  }"                                                              ,""],
    ["}"                                                                ,""],
  ]),
  sp(120),

  h2("5.2 Krzywe animacji — Curves"),
  twoColTable([
    ["Krzywa","Zachowanie i kiedy stosować"],
    ["Curves.linear","Stała prędkość przez cały czas. Mechaniczne, nienatyczne. Używaj rzadko — tylko dla pasków postępu."],
    ["Curves.easeIn","Powoli startuje, przyspiesza. Dobry dla elementów wychodzących z ekranu (znikanie)."],
    ["Curves.easeOut","Szybki start, zwalnia na końcu. Dobry dla elementów wchodzących (pojawianie) — naturalne wyhamowanie."],
    ["Curves.easeInOut","Powoli start, przyspiesza w środku, zwalnia na końcu. Najbardziej 'naturalny'. Użyj dla większości animacji UI."],
    ["Curves.bounceOut","Efekt odbicia na końcu (sprężyna). Dobry dla elementów które 'lądują' na docelowej pozycji."],
    ["Curves.elasticOut","Efekt sprężyny — przekracza cel i wraca. Zabawny, do efektów pull-to-refresh, ikonografii."],
    ["Curves.decelerate","Szybki start, stopniowe wyhamowanie. Podobny do easeOut ale bardziej agresywny."],
    ["CubicBezier(x1,y1,x2,y2)","Własna krzywa Beziera — pełna kontrola. Przydatny gdy projekt ma niestandardowe krzywe (Material 3: Curves.fastOutSlowIn)."],
  ], 2600, PW-2600),
  sp(120),

  h2("5.3 Hero — animacja między ekranami"),
  para("Hero to specjalny widget który animuje element między dwoma ekranami — element 'przelatuje' ze swojego miejsca na liście do miejsca w widoku szczegółów. To jeden z najbardziej efektownych efektów UI we Flutterze i wymaga minimalnej konfiguracji."),
  sp(80),
  annotatedCode("Hero — implementacja w WeatherApp", [
    ["// Na EKRANIE LISTY (HomeScreen) — karta miasta:"              ,"Hero MUSI mieć identyczny tag na obu ekranach"],
    ["Hero("                                                           ,"Hero opakowuje widget który będzie animowany"],
    ["  tag: 'weather-icon-\$cityName', // UNIKALNY tag!"            ,"tag: unikalny identyfikator. Użyj danych (nie 'icon'!) dla unikalności."],
    ["  child: Image.asset("                                           ,"child = widget który 'przeleci' do DetailScreen"],
    ["    'assets/weather_\${weatherCode}.png',"                     ,""],
    ["    width: 48, height: 48,"                                     ,"Rozmiar może być inny niż na DetailScreen — Hero to interpoluje!"],
    ["  ),"                                                            ,""],
    ["),"                                                              ,""],
    [""                                                                ,""],
    ["// Na EKRANIE SZCZEGÓŁÓW (DetailScreen):"                      ,"Ten sam tag → Flutter wie że to 'ten sam' element"],
    ["Hero("                                                           ,""],
    ["  tag: 'weather-icon-\$cityName',  // ten sam tag!"            ,"Identyczny tag jak na liście — Flutter zsynchronizuje"],
    ["  child: Image.asset("                                           ,""],
    ["    'assets/weather_\${weatherCode}.png',"                     ,""],
    ["    width: 128, height: 128,  // większy rozmiar!"             ,"Flutter animuje ROZMIAR podczas lotu — od 48x48 do 128x128"],
    ["  ),"                                                            ,""],
    ["),"                                                              ,""],
    [""                                                                ,""],
    ["// Nawigacja — GoRouter automatycznie obsługuje Hero!"          ,"Hero działa ze wszystkimi systemami nawigacji (GoRouter, Navigator)"],
    ["context.push('/detail/\$cityName');  // Hero przeleci sam"     ,"Wystarczy nawigować normalnie — Hero resztą zajmie się sam"],
  ]),
  sp(120),

  tip("Trzy reguły Hero: unikalność, spójność i prostota","1. UNIKALNY TAG: Dwa Hero z tym samym tagiem na tym samym ekranie = błąd ('There are multiple heroes...').\n   Użyj danych w tagu: 'weather-icon-\$cityName' zamiast 'icon'.\n\n2. SPÓJNY CHILD TYPE: Hero na obu ekranach powinien zawierać podobne widgety (Image → Image).\n   Można animować między różnymi typami, ale wygląd może być niespójny.\n\n3. PROSTOTA: Hero najlepiej działa z obrazami i ikonami. Dla złożonych widgetów użyj customTransitionPage w GoRouter.",[]),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 6 — TESTY WIDGETÓW
  // ═══════════════════════════════════════════════════════════════
  h1("6. Testy widgetów — flutter_test"),
  para("Flutter ma wbudowaną bibliotekę flutter_test do testowania widgetów. W przeciwieństwie do testów instrumentowanych Androida (które wymagają emulatora), testy widgetów Fluttera uruchamiają się wyłącznie na JVM — są szybkie i nie wymagają żadnego urządzenia."),
  sp(),

  expl("Jak Flutter testuje widgety bez emulatora?","Flutter używa własnego silnika renderującego (Skia/Impeller). W trybie testowym Flutter\nuruchamia uproszczoną wersję tego silnika na maszynie deweloperskiej.\nWidgety są renderowane do bufora w pamięci — testy mogą sprawdzać drzewo semantyczne,\nwymiary, teksty i interakcje bez wyświetlania czegokolwiek na ekranie.\nJest to niezmiernie szybkie — całą suitę testów widgetów uruchamia się w sekundy.\n\nPorównanie:\n  Testy jednostkowe Dart: ~1ms per test\n  Testy widgetów Flutter: ~10–100ms per test (symulowany render)\n  Testy instrumentowane Android: ~5–30s per test (emulator)",[]),
  sp(120),

  h2("6.1 Anatomia testu widgetu"),
  annotatedCode("weather_card_test.dart — struktura testu", [
    ["import 'package:flutter_test/flutter_test.dart';"               ,"flutter_test: główna biblioteka testów widgetów (wbudowana)"],
    ["import 'package:flutter/material.dart';"                        ,"Material: potrzebne do MaterialApp i widgetów Material"],
    ["import '../lib/ui/widgets/weather_card.dart';"                  ,"Importuj testowany widget"],
    [""                                                                ,""],
    ["void main() {"                                                   ,"main() zawiera wszystkie testy — uruchamiany przez flutter test"],
    ["  // group() = logiczna grupa testów (jak describe w Jest)"     ,"group() = folder dla powiązanych testów. Opcjonalny ale zalecany."],
    ["  group('WeatherCard Widget Tests', () {"                       ,"Pierwszy argument = nazwa grupy (wyświetlana w raporcie)"],
    [""                                                                ,""],
    ["    // Dane testowe (fixture) — używane w wielu testach"        ,""],
    ["    final testWeather = WeatherData("                           ,"Przygotuj dane poza testami (DRY)"],
    ["      city: 'Warszawa',"                                        ,""],
    ["      temperature: 22.5,"                                       ,""],
    ["      humidity: 65,"                                            ,""],
    ["      weatherCode: 1,"                                          ,""],
    ["    );"                                                          ,""],
    [""                                                                ,""],
    ["    // testWidgets() = jeden test widgetu"                      ,"Jak @Test w JUnit — jeden przypadek testowy"],
    ["    testWidgets('shows city name', (WidgetTester tester) async {"  ,"tester: WidgetTester = narzędzie do interakcji z widgetem"],
    ["      // ARRANGE: zbuduj widget w środowisku testowym"          ,""],
    ["      await tester.pumpWidget("                                  ,"pumpWidget() = wyrenderuj widget w symulowanym środowisku"],
    ["        MaterialApp("                                            ,"Owiń w MaterialApp — większość widgetów tego wymaga (Theme, Directionality)"],
    ["          home: WeatherCard(weather: testWeather),"             ,"Testowany widget z danymi testowymi"],
    ["        ),"                                                      ,""],
    ["      );"                                                        ,""],
    [""                                                                ,""],
    ["      // ACT + ASSERT w jednym kroku (dla prostych przypadków)" ,""],
    ["      expect(find.text('Warszawa'), findsOneWidget);"           ,"find.text() = szukaj widgetu z tym tekstem. findsOneWidget = oczekuj dokładnie 1."],
    ["    });"                                                         ,""],
    [""                                                                ,""],
    ["    testWidgets('displays temperature with unit', (tester) async {"  ,""],
    ["      await tester.pumpWidget(MaterialApp(home: WeatherCard(weather: testWeather)));"  ,""],
    ["      // Sprawdź interpolowany string"                          ,""],
    ["      expect(find.text('22.5°C'), findsOneWidget);"             ,"Sprawdź dokładny tekst — jeśli format się zmieni test się złamie (dobra rzecz!)"],
    ["    });"                                                         ,""],
    ["  });"                                                           ,""],
    ["}"                                                               ,""],
  ]),
  sp(120),

  h2("6.2 Finders, Matchers i akcje — API testów widgetów"),
  twoColTable([
    ["API","Opis i przykład"],
    ["find.text('tekst')","Znajdź widget(y) zawierający(e) ten tekst. Domyślnie: dokładne dopasowanie. find.textContaining('War') dla partial."],
    ["find.byType(WeatherCard)","Znajdź widget o danym typie. Użyj gdy szukasz własnych widgetów."],
    ["find.byKey(Key('weather-card'))","Znajdź po Key. Najbardziej niezawodny selektor — jak testTag w Compose."],
    ["find.byIcon(Icons.thermostat)","Znajdź widget Icon z daną ikoną."],
    ["find.bySemanticsLabel('Temperatura')","Znajdź po etykiecie semantycznej (jak contentDescription w Androidzie). Testuje dostępność."],
    ["findsOneWidget","Matcher: oczekuj dokładnie 1 widget. Najczęstszy."],
    ["findsNothing","Matcher: oczekuj że widget NIE istnieje. Dla stanów ukrytych."],
    ["findsNWidgets(n)","Matcher: oczekuj dokładnie n widgetów. Dla list."],
    ["findsAtLeastNWidgets(1)","Matcher: oczekuj co najmniej n widgetów."],
    ["await tester.tap(finder)","Akcja: tapnij znaleziony widget. Jak performClick() w Compose Testing."],
    ["await tester.enterText(finder, 'tekst')","Akcja: wpisz tekst w TextField."],
    ["await tester.pump()","Obróć jeden klatka animacji / przetworz pending callbacki. Użyj po każdej akcji."],
    ["await tester.pumpAndSettle()","Poczekaj aż wszystkie animacje i Futurey się skończą. Jak waitUntilIdle() w Compose."],
  ], 2600, PW-2600),
  sp(120),

  h2("6.3 Testowanie interakcji i asynchroniczności"),
  annotatedCode("search_screen_test.dart — testy interakcji", [
    ["testWidgets('search triggers weather load', (tester) async {"   ,"Test interakcji: wpisz → submit → sprawdź efekt"],
    ["  // Arrange: przygotuj fake provider Riverpoda"                ,""],
    ["  await tester.pumpWidget("                                      ,""],
    ["    ProviderScope("                                              ,"ProviderScope na szczycie — wymagane dla Riverpoda"],
    ["      overrides: ["                                              ,"overrides = podmień providery na testowe wersje"],
    ["        // Podmień serwis pogody na fake"                       ,""],
    ["        weatherServiceProvider.overrideWithValue("              ,"overrideWithValue() = podaj konkretną instancję"],
    ["          FakeWeatherService(),"                                 ,"FakeWeatherService = implementacja testowa bez HTTP"],
    ["        ),"                                                      ,""],
    ["      ],"                                                        ,""],
    ["      child: const MaterialApp(home: HomeScreen()),"            ,""],
    ["    ),"                                                          ,""],
    ["  );"                                                            ,""],
    [""                                                                ,""],
    ["  // Act: znajdź TextField i wpisz miasto"                     ,""],
    ["  await tester.enterText("                                       ,"enterText = wpisz text w znalezionym TextField"],
    ["    find.byKey(const Key('search-field')),"                     ,"Szukamy po Key (ustawiony w SearchBar Modifier.key)"],
    ["    'Gdańsk',"                                                   ,"Wpisywany tekst"],
    ["  );"                                                            ,""],
    ["  await tester.testTextInput.receiveAction(TextInputAction.search);"  ,"Symuluj wciśnięcie klawisza Search na klawiaturze"],
    [""                                                                ,""],
    ["  // pumpAndSettle czeka na Future (ładowanie danych)"          ,""],
    ["  await tester.pumpAndSettle();"                                ,"Czekaj aż FutureProvider zakończy i UI się zaktualizuje"],
    [""                                                                ,""],
    ["  // Assert: sprawdź że wynik się pojawił"                     ,""],
    ["  expect(find.text('Gdańsk'), findsOneWidget);"                ,"Nazwa miasta widoczna w wynikach"],
    ["  expect(find.text('Ładowanie...'), findsNothing);"            ,"Spinner już zniknął"],
    ["  expect(find.byType(WeatherCard), findsOneWidget);"           ,"Karta pogody widoczna"],
    ["});"                                                             ,""],
  ]),
  sp(120),

  h2("6.4 Uruchamianie testów"),
  codeBlock([
    "# Uruchom wszystkie testy:",
    "flutter test",
    "",
    "# Uruchom konkretny plik:",
    "flutter test test/ui/widgets/weather_card_test.dart",
    "",
    "# Uruchom z verbose output (nazwa każdego testu):",
    "flutter test --reporter expanded",
    "",
    "# Uruchom z coverage (raport HTML):",
    "flutter test --coverage",
    "genhtml coverage/lcov.info -o coverage/html",
    "open coverage/html/index.html  # macOS/Linux",
    "",
    "# Filtruj po nazwie testu (--name = regex):",
    "flutter test --name 'shows city name'",
    "",
    "# Obserwuj i uruchamiaj przy zmianach (jak --watch w Jest):",
    "flutter test --watch  # wymaga flutter SDK >= 3.13",
  ],"flutter test — uruchamianie testów"),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 7 — MOCKTAIL — MOCKOWANIE W TESTACH FLUTTER
  // ═══════════════════════════════════════════════════════════════
  h1("7. Mocktail — mockowanie zależności"),
  para("W testach jednostkowych i widgetów często potrzebujemy zastąpić prawdziwe implementacje (serwis HTTP, baza danych) kontrolowanymi obiektami testowymi. Mocktail to biblioteka mockująca dla Dart — odpowiednik MockK z ekosystemu Kotlin."),
  sp(),

  h2("7.1 Konfiguracja Mocktail"),
  codeBlock([
    "dev_dependencies:",
    "  mocktail: ^1.0.4   # Mockowanie dla Dart (lepsze od mockito dla null safety)",
    "",
    "# Mocktail nie wymaga generowania kodu (w odróżnieniu od mockito).",
    "# Działa przez dziedziczenie i manual stubs.",
  ],"pubspec.yaml — Mocktail"),
  sp(120),

  h2("7.2 Tworzenie mocków i stubów"),
  annotatedCode("weather_provider_test.dart — Mocktail", [
    ["import 'package:mocktail/mocktail.dart';"                       ,"Import Mocktail"],
    [""                                                                ,""],
    ["// 1. Zdefiniuj klasę mocka — extends Mock + implementuj interfejs"  ,"Jak class MockRepo extends MockK w MockK (Kotlin)"],
    ["class MockWeatherService extends Mock implements WeatherService {}","Mock 'pusty' — wszystkie metody domyślnie rzucają wyjątek"],
    [""                                                                ,""],
    ["// 2. Zarejestruj fallback values dla typów niestandardowych"   ,"Wymagane gdy Mocktail nie zna typu argumentu"],
    ["setUpAll(() {"                                                   ,"setUpAll = raz przed wszystkimi testami (jak @BeforeAll w JUnit 5)"],
    ["  registerFallbackValue(FakeWeatherData());  // jeśli potrzebne","Zarejestruj 'pusty' obiekt jako domyślny dla any()"],
    ["});"                                                             ,""],
    [""                                                                ,""],
    ["void main() {"                                                   ,""],
    ["  late MockWeatherService mockService;"                          ,"late = inicjalizacja w setUp()"],
    ["  late WeatherNotifier notifier;"                                ,""],
    [""                                                                ,""],
    ["  setUp(() {"                                                    ,"setUp = przed każdym testem (jak @BeforeEach w JUnit 5)"],
    ["    mockService = MockWeatherService();"                         ,"Nowy mock dla każdego testu — izolacja"],
    ["    notifier = WeatherNotifier(service: mockService);"          ,"Wstrzyknij mock przez konstruktor"],
    ["  });"                                                           ,""],
    [""                                                                ,""],
    ["  test('fetch sets loading then data', () async {"              ,"test() = test jednostkowy (bez widgetu)"],
    ["    // STUB: zdefiniuj co mock zwróci"                          ,"when().thenAnswer() = jak coEvery {} returns w MockK"],
    ["    when(() => mockService.fetchWeather('Kraków'))"             ,"when() + strzałka = identyfikacja wywoływanej metody"],
    ["      .thenAnswer((_) async => fakeWeatherData);"               ,"thenAnswer() dla async. thenReturn() dla sync."],
    [""                                                                ,""],
    ["    // ACT: wywołaj metodę notifiera"                           ,""],
    ["    await notifier.fetch('Kraków');"                            ,""],
    [""                                                                ,""],
    ["    // ASSERT: stan po operacji"                                 ,""],
    ["    expect(notifier.state, isA<AsyncData<WeatherData?>>());"    ,"isA<T>() = sprawdź typ. AsyncData = sukces w Riverpod."],
    [""                                                                ,""],
    ["    // VERIFY: czy metoda została wywołana?"                    ,"verify() = sprawdź interakcję (jak coVerify w MockK)"],
    ["    verify(() => mockService.fetchWeather('Kraków')).called(1); ","called(1) = wywołana dokładnie 1 raz"],
    ["    verifyNever(() => mockService.fetchWeather('Gdańsk'));"     ,"verifyNever = nigdy nie wywołana z tym argumentem"],
    ["  });"                                                           ,""],
    ["}"                                                               ,""],
  ]),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 8 — ARCHITEKTURA CLEAN / FEATURE-FIRST
  // ═══════════════════════════════════════════════════════════════
  ...dayBanner(3, "Architektura, dostępność, DevTools i zadania", "Sekcje 8–13 · ~90 minut · Clean Architecture Feature-First, internacjonalizacja, Flutter DevTools, zadania projektowe i kryteria oceny"),
  h1("8. Architektura projektu — Feature-First i Clean Architecture"),
  para("W Flutter Lab 1 stosowaliśmy prostą strukturę lib/ z katalogami data/, providers/, ui/. To podejście działa dla małych projektów. Przy rozroście aplikacji lepsza jest architektura Feature-First — każda funkcjonalność ma swój własny, samodzielny moduł."),
  sp(),

  h2("8.1 Layer-first vs Feature-first"),
  twoColTable([
    ["Layer-first (Lab 1)","Feature-first (rekomendowany)"],
    ["lib/data/, lib/providers/, lib/ui/ — grupowanie po typie technicznym.\nDobrze dla < 5 ekranów. Problemy: plik weather_provider.dart jest 'sąsiadem' cart_provider.dart mimo że to różne funkcje.","lib/features/weather/, lib/features/favorites/ — grupowanie po funkcji biznesowej.\nKażda feature jest samowystarczalna: ma własne data, providers, ui."],
    ["Zmiana jednej funkcji dotyka wielu katalogów (data/, providers/, ui/).\nNaukowiec, który czyta kod, musi skakać między katalogami.","Zmiana jednej funkcji odbywa się w jednym miejscu (features/weather/).\nNaukowiec widzi od razu co należy do 'pogody'."],
  ], PW/2, PW/2),
  sp(120),

  h2("8.2 Struktura Feature-First dla WeatherApp v2"),
  codeBlock([
    "lib/",
    "├── main.dart",
    "├── core/                          ← Współdzielone przez wszystkie features",
    "│   ├── error/",
    "│   │   ├── exceptions.dart        ← Własne klasy wyjątków (WeatherException itp.)",
    "│   │   └── failures.dart          ← Sealed class Failure (NetworkFailure, CacheFailure)",
    "│   ├── network/",
    "│   │   └── api_client.dart        ← Wspólny http.Client z interceptorami",
    "│   ├── router/",
    "│   │   └── app_router.dart        ← GoRouter — cała nawigacja",
    "│   └── theme/",
    "│       └── app_theme.dart         ← ThemeData light i dark",
    "│",
    "├── features/",
    "│   ├── weather/                   ← Feature: aktualna pogoda",
    "│   │   ├── data/",
    "│   │   │   ├── models/",
    "│   │   │   │   ├── weather_dto.dart       ← DTO: parsowanie JSON z API",
    "│   │   │   │   └── weather_data.dart      ← Domain model + Hive @HiveType",
    "│   │   │   ├── services/",
    "│   │   │   │   └── weather_api_service.dart ← Wywołania HTTP",
    "│   │   │   └── repositories/",
    "│   │   │       └── weather_repository.dart  ← Łączy API + cache Hive",
    "│   │   ├── providers/",
    "│   │   │   ├── weather_provider.dart      ← AsyncNotifierProvider",
    "│   │   │   └── weather_service_provider.dart ← Provider<WeatherRepository>",
    "│   │   └── ui/",
    "│   │       ├── screens/",
    "│   │       │   └── detail_screen.dart",
    "│   │       └── widgets/",
    "│   │           ├── weather_card.dart",
    "│   │           └── forecast_tile.dart",
    "│   │",
    "│   └── favorites/                 ← Feature: ulubione miasta",
    "│       ├── data/",
    "│       │   └── repositories/",
    "│       │       └── favorites_repository.dart ← Hive Box<String>",
    "│       ├── providers/",
    "│       │   └── favorites_provider.dart     ← NotifierProvider",
    "│       └── ui/",
    "│           ├── screens/",
    "│           │   └── home_screen.dart",
    "│           └── widgets/",
    "│               └── city_tile.dart",
    "│",
    "└── shared/                        ← Widgety używane w wielu features",
    "    └── widgets/",
    "        ├── loading_widget.dart",
    "        └── error_widget.dart",
  ],"Struktura Feature-First projektu WeatherApp v2"),
  sp(120),

  h2("8.3 Repository Pattern — warstwa między API a UI"),
  annotatedCode("weather_repository.dart — offline-first z Hive + API", [
    ["class WeatherRepository {"                                       ,"Repository = orchestrator: API + cache. UI nie wie 'skąd' dane."],
    ["  final WeatherApiService _api;"                                ,"Wstrzyknięte przez konstruktor (dependency injection)"],
    ["  final WeatherCacheService _cache;"                            ,""],
    [""                                                                ,""],
    ["  const WeatherRepository({"                                    ,"named parameters — czytelne przy tworzeniu"],
    ["    required WeatherApiService api,"                            ,""],
    ["    required WeatherCacheService cache,"                        ,""],
    ["  }) : _api = api, _cache = cache;"                            ,": _api = api = inicjalizacja pola w liście inicjalizacyjnej"],
    [""                                                                ,""],
    ["  Future<WeatherData> getWeather(String city) async {"          ,"Główna metoda — cache-first"],
    ["    // KROK 1: Sprawdź czy cache jest świeży (< 30 min)"       ,"Offline-first: najpierw spróbuj lokalnie"],
    ["    if (_cache.isFresh(city)) {"                                ,""],
    ["      return _cache.getCached(city)!;  // z cache"             ,"! bezpieczne po isFresh() — gwarantuje non-null"],
    ["    }"                                                           ,""],
    [""                                                                ,""],
    ["    // KROK 2: Pobierz z API i zapisz do cache"                ,"Sieć: tylko gdy cache nieaktualne"],
    ["    try {"                                                       ,""],
    ["      final data = await _api.fetchWeather(city);"             ,""],
    ["      await _cache.cacheWeather(data);"                        ,"Zapisz do Hive — następne wywołanie pobierze z cache"],
    ["      return data;"                                             ,""],
    ["    } catch (e) {"                                              ,""],
    ["      // KROK 3: Błąd sieci — zwróć stary cache jeśli istnieje"  ,"Graceful degradation: stare dane lepsze niż błąd"],
    ["      final stale = _cache.getCached(city);"                   ,"getCached() = zwróć nieaktualne dane jeśli są"],
    ["      if (stale != null) return stale;"                        ,"Zwróć nawet stare dane (lepsza UX niż crash)"],
    ["      rethrow;  // Brak cache — propaguj błąd do UI"           ,"rethrow = rzuć ten sam wyjątek dalej (nie trać stack trace)"],
    ["    }"                                                           ,""],
    ["  }"                                                             ,""],
    ["}"                                                               ,""],
  ]),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 9 — DOSTĘPNOŚĆ I INTERNACJONALIZACJA
  // ═══════════════════════════════════════════════════════════════
  h1("9. Dostępność i internacjonalizacja"),
  para("Profesjonalna aplikacja mobilna musi być dostępna dla użytkowników z niepełnosprawnościami oraz działać w wielu językach. Flutter zapewnia wbudowane mechanizmy dla obu tych wymagań."),
  sp(),

  h2("9.1 Dostępność — Semantics widget"),
  para("Flutter generuje drzewo semantyczne automatycznie dla standardowych widgetów (Text, ElevatedButton, TextField). Dla niestandardowych widgetów i gestów musimy je opisać ręcznie przez widget Semantics."),
  sp(80),
  annotatedCode("Semantics — dostępność widgetu pogody", [
    ["// Karta temperatury z pełną semantyką TalkBack/VoiceOver"     ,""],
    ["Semantics("                                                      ,"Semantics = opisuje widget dla czytnika ekranu"],
    ["  label: 'Temperatura w Warszawie: 22.5 stopnia Celsjusza',"   ,"label = co czytnik ekranu przeczyta. Pełny opis, nie skrót."],
    ["  hint: 'Dwukrotnie stuknij, aby zobaczyć prognozę',"          ,"hint = instrukcja dla użytkownika. Co się stanie po tapnięciu."],
    ["  button: true,"                                                 ,"button: true = czytnik ogłasza 'przycisk' i pozwala aktywować"],
    ["  onTap: () => context.push('/detail/Warszawa'),"               ,"onTap w Semantics = jak onPressed — dostępny dla assistive tech"],
    ["  child: Container("                                             ,"Owiń widget który nie ma sam semantyki"],
    ["    child: Row(children: ["                                     ,""],
    ["      // excludeSemantics: true = ukryj przed czytnikiem"      ,""],
    ["      ExcludeSemantics("                                        ,"ExcludeSemantics = ikona dekoracyjna, czytnik pomija"],
    ["        child: Icon(Icons.thermostat, size: 32),"              ,"Ikona jest dekoracyjna — label Semantics już opisuje wszystko"],
    ["      ),"                                                        ,""],
    ["      Text('22.5°C', style: ...),"                             ,"Text ma automatyczną semantykę — czytnik przeczyta '22.5°C'"],
    ["    ]),"                                                         ,""],
    ["  ),"                                                            ,""],
    ["),"                                                              ,""],
  ]),
  sp(120),

  h2("9.2 Internacjonalizacja (i18n) — flutter_localizations"),
  codeBlock([
    "# pubspec.yaml",
    "dependencies:",
    "  flutter_localizations:      # wbudowana w Flutter SDK — bez wersji",
    "    sdk: flutter",
    "  intl: ^0.19.0               # Formatowanie liczb, dat, walut",
    "",
    "flutter:",
    "  generate: true              # Włącz generator plików .arb → .dart",
  ],"pubspec.yaml — i18n"),
  sp(80),
  codeBlock([
    "# lib/l10n/app_pl.arb — polskie tłumaczenia",
    "{",
    "  \"@@locale\": \"pl\",",
    "  \"appTitle\": \"Pogodynka\",",
    "  \"searchHint\": \"Wpisz nazwę miasta...\",",
    "  \"temperatureLabel\": \"Temperatura: {temp}°C\",",
    "  \"@temperatureLabel\": {",
    "    \"placeholders\": { \"temp\": { \"type\": \"double\", \"format\": \"decimalPattern\" } }",
    "  },",
    "  \"humidity\": \"Wilgotność: {value}%\",",
    "  \"@humidity\": {",
    "    \"placeholders\": { \"value\": { \"type\": \"int\" } }",
    "  }",
    "}",
    "",
    "# lib/l10n/app_en.arb — angielskie tłumaczenia",
    "{",
    "  \"@@locale\": \"en\",",
    "  \"appTitle\": \"Weather App\",",
    "  \"searchHint\": \"Enter city name...\",",
    "  \"temperatureLabel\": \"Temperature: {temp}°C\",",
    "  \"humidity\": \"Humidity: {value}%\"",
    "}",
    "",
    "# Generuj klasy Dart z plików .arb:",
    "flutter gen-l10n",
    "",
    "# Użycie w kodzie (po generacji):",
    "# Text(AppLocalizations.of(context)!.appTitle)",
    "# Text(AppLocalizations.of(context)!.temperatureLabel(22.5))",
  ],"Pliki ARB — tłumaczenia"),
  sp(120),

  codeBlock([
    "// main.dart — konfiguracja lokalizacji",
    "MaterialApp.router(",
    "  // Delegaci lokalizacji — MUSZĄ być ustawione",
    "  localizationsDelegates: const [",
    "    AppLocalizations.delegate,          // Własne tłumaczenia (generowane)",
    "    GlobalMaterialLocalizations.delegate, // Material widgets (daty, przyciski OK/Cancel)",
    "    GlobalWidgetsLocalizations.delegate,  // Podstawowe widgety (kierunek tekstu LTR/RTL)",
    "    GlobalCupertinoLocalizations.delegate,// iOS-style widgets",
    "  ],",
    "  // Obsługiwane języki",
    "  supportedLocales: const [",
    "    Locale('pl', 'PL'),  // Polski (Polska)",
    "    Locale('en', 'US'),  // Angielski (USA)",
    "  ],",
    "  // Domyślna lokalizacja gdy system nie pasuje do żadnej obsługiwanej",
    "  locale: const Locale('pl', 'PL'),",
    "  routerConfig: appRouter,",
    ")",
  ],"MaterialApp — konfiguracja lokalizacji"),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 10 — FLUTTER DEVTOOLS
  // ═══════════════════════════════════════════════════════════════
  h1("10. Flutter DevTools — diagnostyka i profilowanie"),
  para("Flutter DevTools to zaawansowane narzędzie debugowania uruchamiane w przeglądarce. Dostarcza wizualizację drzewa widgetów na żywo, narzędzie do profilowania wydajności, inspektor sieci i debugger pamięci. Znajomość DevTools jest niezbędna przy optymalizacji aplikacji."),
  sp(),

  stepTable("Uruchomienie Flutter DevTools", [
    "Uruchom aplikację w trybie debug: flutter run (lub przez Android Studio przycisk Debug).",
    "W terminalu pojawi się URL DevTools, np.: 'An Observatory debugger and profiler on...'. Wpisz w przeglądarce lub kliknij link.",
    "Alternatywnie: w Android Studio otwórz View → Tool Windows → Flutter Inspector. DevTools otworzy się w panelu bocznym.",
    "Możesz też uruchomić DevTools niezależnie: dart devtools — otworzy się serwer, wklej URL aplikacji.",
  ]),
  sp(120),

  twoColTable([
    ["Panel DevTools","Do czego służy"],
    ["Flutter Inspector","Drzewo widgetów na żywo. Zaznaczaj widgety w aplikacji i inspektor pokaże je w drzewie. Wyświetla rozmiary, padding, margin. Poszukaj 'Debug Paint' — pokaże granice widgetów."],
    ["Performance","Timeline renderowania — każda klatka, czas CPU i GPU. Szukaj czerwonych/żółtych klatek (> 16ms). Nagrywaj profile dla konkretnych akcji."],
    ["CPU Profiler","Nagrywanie call stack w czasie. Sprawdź co zajmuje czas CPU podczas ładowania danych lub renderowania listy."],
    ["Memory","Użycie pamięci w czasie. Wykrywanie wycieków pamięci — obserwuj czy pamięć rośnie po wielokrotnych akcjach bez powrotu do baseline."],
    ["Network","Wszystkie żądania HTTP. Czas odpowiedzi, kody statusu, nagłówki, ciało odpowiedzi. Idealne do debugowania API calls bez Postmana."],
    ["Logging","Logi aplikacji z filtrami. Wyświetla print(), debugPrint() i wyjątki. Lepsze niż terminal gdy jest wiele logów."],
    ["App Size","Analiza rozmiaru APK/IPA. Pokaże co zajmuje miejsce (assets, paczki, kod). Uruchom przez: flutter build apk --analyze-size."],
  ], 2400, PW-2400),
  sp(120),

  tip("Repaint Rainbow — znajdź zbędne przebudowania widgetów","W Flutter Inspector włącz 'Highlight Repaints' (przełącznik u góry).\nWidgety które się przebudowują będą migać kolorowymi ramkami.\nCzęste miganie = zbędny rebuild — optymalizuj przez:\n1. const konstruktory na widgetach które się nie zmieniają.\n2. Zmiana watch() na select() w Riverpod — subskrybuj tylko część stanu.\n3. Wydziel często zmieniający się widget do osobnej klasy (mniejszy zakres rebuilda).",[]),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 11 — ZADANIA
  // ═══════════════════════════════════════════════════════════════
  h1("11. Zadania do wykonania"),
  para("Zadania są kontynuacją projektu WeatherApp z Flutter Lab 1. Kod z Lab 1 służy jako punkt startowy — migrujemy go do nowej architektury i rozbudowujemy o nowe funkcje."),
  sp(),

  task("Zadanie 1 (20 pkt) — Migracja na Riverpod i Hive", [
    "1.1 Dodaj paczki do pubspec.yaml: flutter_riverpod, hive, hive_flutter, hive_generator, build_runner.",
    "1.2 Owiń aplikację w ProviderScope w main.dart. Zainicjalizuj Hive przez Hive.initFlutter() przed runApp().",
    "1.3 Dodaj adnotacje @HiveType i @HiveField do klasy WeatherData. Uruchom build_runner,",
    "      zarejestruj wygenerowany adapter w main.dart, otwórz Box<WeatherData>('weatherCache').",
    "1.4 Zmigruj WeatherProvider z ChangeNotifier (Provider) na AsyncNotifierProvider (Riverpod).",
    "      Zmigruj FavoritesProvider na NotifierProvider<FavoritesNotifier, List<String>>.",
    "1.5 Zmień HomeScreen i DetailScreen: zastąp Consumer<T> przez ConsumerWidget (WidgetRef ref).",
    "WERYFIKACJA: Aplikacja działa identycznie jak po Lab 1. Brak importów package:provider.",
  ]),
  sp(120),

  task("Zadanie 2 (25 pkt) — Offline-first z Hive i Repository Pattern", [
    "2.1 Wdrożenie WeatherCacheService: metody cacheWeather(), getCached(), isFresh() (30 min TTL), remove().",
    "2.2 Wdrożenie WeatherRepository łączącego API + cache: cache-first, fallback na stary cache przy błędzie sieci.",
    "      Provider<WeatherRepository> zarejestrowany w Riverpodzie.",
    "2.3 Zmodyfikuj WeatherNotifier aby używał WeatherRepository (ref.read(repositoryProvider)) zamiast bezpośrednio serwisu.",
    "2.4 Przetestuj offline-first: załaduj pogodę → wyłącz internet → uruchom ponownie aplikację → dane nadal widoczne.",
    "2.5 Wyświetl w DetailScreen znacznik czasu ostatniej aktualizacji danych (weather.updatedAt — sformatowany przez intl).",
    "WERYFIKACJA: Screenshot z danymi widocznymi przy wyłączonym locie samolotowym. Timestamp widoczny w UI.",
  ]),
  sp(120),

  task("Zadanie 3 (30 pkt) — Animacje", [
    "3.1 AnimatedContainer na karcie miasta w HomeScreen: tapnięcie rozszerza kartę (h: 80→180dp) z efektem animowanego koloru tła. Czas: 350ms, Curves.easeInOut.",
    "3.2 AnimatedSwitcher dla ikony pogody w WeatherCard: zmiana weatherCode animuje ikonę (ScaleTransition + FadeTransition). Pamiętaj o ValueKey(weatherCode).",
    "3.3 Hero między HomeScreen a DetailScreen: ikona pogody (64×64 na liście, 128×128 w szczegółach). Tag: 'weather-icon-\$city'. Sprawdź płynne przejście.",
    "3.4 Animacja wejścia listy w HomeScreen: ListView z animowanym pojawianiem się kart (SlideTransition + FadeTransition). Każda karta przesuwa się od prawej ze staggered delay (karta_n × 50ms opóźnienia).",
    "WERYFIKACJA: Demo animacji na AVD przy 60fps (flutter run --release dla lepszego pomiaru).",
  ]),
  sp(120),

  task("Zadanie 4 (25 pkt) — Testy widgetów i jednostkowe", [
    "4.1 Napisz min. 4 testy jednostkowe (flutter test, bez widgetów): WeatherData.fromJson() dla poprawnych danych, pustego JSON, JSON z nullem w wymaganym polu, przeliczenie temperatury z K na °C.",
    "4.2 Napisz min. 3 testy widgetu WeatherCard (testWidgets): wyświetlanie nazwy miasta, temperatury z jednostką, ikony pogody dla weatherCode == 0 (słonecznie).",
    "4.3 Napisz test interakcji SearchBar: wpisz 'Gdańsk' → wciśnij Search → sprawdź że FakeWeatherService.fetchWeather() wywołane z 'Gdańsk'.",
    "      Użyj Mocktail do mockowania WeatherService i ProviderScope(overrides:[]) do wstrzyknięcia mocka.",
    "4.4 Uruchom flutter test --coverage. Uzyskaj pokrycie > 60% dla pliku weather_card.dart.",
    "WERYFIKACJA: flutter test uruchamia się bez błędów. Raport coverage w coverage/html/index.html.",
  ]),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 12 — KRYTERIA
  // ═══════════════════════════════════════════════════════════════
  h1("12. Kryteria oceniania"),
  sp(),

  threeColTable([
    ["Zadanie","Punkty","Co weryfikuje prowadzący"],
    ["Zad. 1: Riverpod + Hive","20 pkt","Brak package:provider. ProviderScope. Hive inicjalizacja + adapter. AsyncNotifierProvider i NotifierProvider działają."],
    ["Zad. 2: Offline-first","25 pkt","Dane widoczne przy wyłączonym internecie. Timestamp w UI. Repository Pattern (API + cache oddzielone)."],
    ["Zad. 3: Animacje","30 pkt","AnimatedContainer (expand). AnimatedSwitcher z ValueKey. Hero między ekranami. Staggered list entry."],
    ["Zad. 4: Testy","25 pkt","Min. 7 testów (4 jednostkowe + 3 widgetów). Mocktail mock. Coverage > 60% dla WeatherCard."],
    ["RAZEM","100 pkt",""],
  ], 1400, 1000, PW-2400),
  sp(120),

  h2("12.1 Skala ocen"),
  twoColTable([
    ["Ocena","Punkty / Wymagania"],
    ["5.0","90–100 pkt — Wszystkie zadania. Animacje płynne w release. Coverage > 70%. Mocktail z verify()."],
    ["4.5","80–89 pkt — Zadania 1–3 kompletne. Min. 5 testów. Hero działa. Offline-first."],
    ["4.0","70–79 pkt — Zadania 1–2 + AnimatedContainer i AnimatedSwitcher. Min. 3 testy widgetu."],
    ["3.5","60–69 pkt — Zadania 1–2. Riverpod i Hive działają. Brak animacji. Min. 4 testy jednostkowe."],
    ["3.0","50–59 pkt — Zadanie 1: migracja na Riverpod działa. Dane z Hive persystują."],
    ["2.0","0–49 pkt — Projekt nie kompiluje lub Riverpod nie działa."],
  ], 900, PW-900),
  sp(200),

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 13 — NAJCZĘSTSZE BŁĘDY
  // ═══════════════════════════════════════════════════════════════
  h1("13. Najczęstsze błędy i ich rozwiązania"),
  sp(),

  twoColTable([
    ["Błąd / Objaw","Przyczyna i rozwiązanie"],
    ["MissingProviderScopeException / ProviderNotFoundException","Brak ProviderScope w drzewie widgetów. Owiń całą aplikację: runApp(ProviderScope(child: MyApp()))."],
    ["HiveError: 'Box not found. Did you forget to call Hive.openBox?'","Box nie został otwarty przed użyciem. Hive.openBox() MUSI być wywołane w main() przed runApp(). Nie otwieraj Box w konstruktorze klasy serwisu."],
    ["Bad state: already registered typeId 0","Dwa adaptery mają ten sam typeId. Każda klasa @HiveType musi mieć unikalny typeId (0, 1, 2...). Sprawdź wszystkie @HiveType w projekcie."],
    ["AnimatedSwitcher nie animuje przy zmianie child","Brak unikalnego Key w child. Dodaj ValueKey(unikalnaWartość) do każdego child AnimatedSwitcher."],
    ["Hero: 'There are multiple heroes that share the same tag'","Dwa widgety Hero z tym samym tagiem na tym samym ekranie. Użyj unikalnych tagów: 'weather-icon-\$cityName' zamiast 'weather-icon'."],
    ["AnimationController nie zwalnia pamięci (wyciek)","Brak _controller.dispose() w metodzie dispose() State. Zawsze: @override void dispose() { _controller.dispose(); super.dispose(); }"],
    ["ref.watch() throws ProviderException poza build()","ref.watch() wywołane w initState(), onPressed() lub async callback. Zamień na ref.read() dla akcji poza build()."],
    ["Mocktail: MissingStubError — no stub for method","Metoda mocka wywołana bez wcześniejszego when(). Dodaj when(() => mock.method()).thenAnswer((_) async => result) przed wywołaniem kodu testowanego."],
    ["flutter test — Cannot find widget with type X","Widget nie jest wyrenderowany w testowym drzewie. Sprawdź czy pumpWidget() zawiera MaterialApp jako korzeń i czy widget jest w strukturze children."],
    ["Hive: 'Cannot write to a closed box'","Box zamknięty przed zapisem lub operacja po dispose(). Upewnij się że Box jest otwarty przez cały czas życia aplikacji."],
  ], 3000, PW-3000),
  sp(80),

  tip("Debugging Riverpod — ProviderObserver","Riverpod umożliwia obserwowanie wszystkich zmian stanu przez ProviderObserver.\nDodaj do ProviderScope(observers: [LoggingObserver()]) gdzie:\n\nclass LoggingObserver extends ProviderObserver {\n  void didUpdateProvider(provider, prev, next, container) {\n    debugPrint('[Riverpod] \${provider.name}: \$prev → \$next');\n  }\n}\n\nTo pokaże w logach każdą zmianę każdego providera — bezcenne podczas debugowania.",[]),
  sp(200),

  // ─── STOPKA ──────────────────────────────────────────────────────────────
  new Table({
    width:{size:PW,type:WidthType.DXA}, columnWidths:[PW],
    rows:[new TableRow({children:[new TableCell({
      width:{size:PW,type:WidthType.DXA},
      borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
      shading:{type:ShadingType.CLEAR,fill:COL.headerBg},
      margins:{top:120,bottom:120,left:200,right:200},
      children:[
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Instrukcja Laboratoryjna Flutter 2 — Riverpod, Animacje, Hive i Testy Widgetów",font:F,size:20,bold:true,color:"FFFFFF"})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Programowanie Aplikacji Mobilnych | Katedra Informatyki",font:F,size:18,color:"54C5F8"})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80,after:0},children:[new TextRun({text:"Następne ćwiczenie: Flutter 3 — Publikacja aplikacji, CI/CD z GitHub Actions, Flavors",font:F,size:18,italics:true,color:"6EE7B7"})]}),
      ]
    })]})]
  }),
];

// ─── DOKUMENT ────────────────────────────────────────────────────────────────
const doc = new Document({
  styles:{
    default:{document:{run:{font:F,size:22,color:"1F2937"}}},
    paragraphStyles:[
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:28,bold:true,font:F,color:"FFFFFF"},paragraph:{spacing:{before:240,after:160},outlineLevel:0}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:24,bold:true,font:F,color:COL.headerBg},paragraph:{spacing:{before:200,after:120},outlineLevel:1}},
      {id:"Heading3",name:"Heading 3",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:22,bold:true,font:F,color:"374151"},paragraph:{spacing:{before:160,after:80},outlineLevel:2}},
    ]
  },
  numbering:{config:[]},
  sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1080,right:1080,bottom:1080,left:1080}}},
    headers:{default:makeHeader()},
    footers:{default:makeFooter()},
    children:content,
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/claude/FlutterLab2_PAM_Instrukcja.docx", buf);
  console.log("DONE — /home/claude/FlutterLab2_PAM_Instrukcja.docx");
}).catch(err => { console.error("BŁĄD:", err); process.exit(1); });
