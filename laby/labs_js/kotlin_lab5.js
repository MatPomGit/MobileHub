const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign,
  TabStopType, TabStopPosition, TableOfContents, SimpleField, PageBreak
} = require('docx');
const fs = require('fs');

// ─── PALETA KOLORÓW (identyczna jak Lab 1-4) ─────────────────────────────────
const COL = {
  headerBg:   "1A3A5C",
  h1Bg:       "00C47A",
  codeBg:     "F2F4F8",
  tipBg:      "EAF8F2",
  warnBg:     "FFF8E8",
  taskBg:     "EDF3FC",
  whyBg:      "FFF5EA",
  explBg:     "F0F4FF",
  analoqBg:   "F5EEFF",
  tipBorder:  "00C47A",
  warnBorder: "C07A00",
  taskBorder: "2563EB",
  whyBorder:  "E07B00",
  explBorder: "4F6EB0",
  analoqBorder:"8B5CF6",
  codeBorder: "9CA3AF",
};
const F  = "Arial";
const FC = "Consolas";
const PW = 11906 - 2 * 1080; // ~9746 DXA (A4, marginesy 1080)

// ─── HELPERY ─────────────────────────────────────────────────────────────────

function sp(n) { n = (n === undefined) ? 120 : n; return new Paragraph({ spacing: { before: 0, after: n } }); }

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: text, font: F, size: 28, bold: true, color: "FFFFFF" })],
    shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: COL.h1Bg } },
    spacing: { before: 240, after: 160 },
    indent: { left: 160 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: text, font: F, size: 24, bold: true, color: COL.headerBg })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COL.h1Bg, space: 1 } },
    spacing: { before: 200, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text: text, font: F, size: 22, bold: true, color: "374151" })],
    spacing: { before: 160, after: 80 },
  });
}

function para(text) {
  return new Paragraph({
    children: [new TextRun({ text: text, font: F, size: 22 })],
    spacing: { before: 60, after: 80 },
  });
}

function codeBlock(lines, label) {
  var labelRows = [];
  if (label) {
    labelRows.push(new TableRow({
      children: [new TableCell({
        width: { size: PW, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        shading: { type: ShadingType.CLEAR, fill: "E2E8F0" },
        margins: { top: 40, bottom: 40, left: 160, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: label, font: F, size: 18, bold: true, color: "475569" })] })]
      })]
    }));
  }
  var codeRows = lines.map(function(line) {
    return new TableRow({
      children: [new TableCell({
        width: { size: PW, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.SINGLE, size: 12, color: COL.codeBorder },
          right: { style: BorderStyle.NONE, size: 0 }
        },
        shading: { type: ShadingType.CLEAR, fill: COL.codeBg },
        margins: { top: 20, bottom: 20, left: 160, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: line || " ", font: FC, size: 18, color: "1A3A5C" })] })]
      })]
    });
  });
  return new Table({
    width: { size: PW, type: WidthType.DXA },
    columnWidths: [PW],
    rows: labelRows.concat(codeRows),
    margins: { top: 80, bottom: 80 }
  });
}

function infoBox(emoji, title, lines, bgColor, borderColor) {
  var titleRow = new TableRow({
    children: [new TableCell({
      width: { size: PW, type: WidthType.DXA },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 8, color: borderColor },
        bottom: { style: BorderStyle.NONE },
        left:   { style: BorderStyle.SINGLE, size: 16, color: borderColor },
        right:  { style: BorderStyle.NONE }
      },
      shading: { type: ShadingType.CLEAR, fill: bgColor },
      margins: { top: 80, bottom: 40, left: 160, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: emoji + " " + title, font: F, size: 22, bold: true, color: "1F2937" })] })]
    })]
  });
  var bodyRows = lines.map(function(line) {
    return new TableRow({
      children: [new TableCell({
        width: { size: PW, type: WidthType.DXA },
        borders: {
          top:    { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left:   { style: BorderStyle.SINGLE, size: 16, color: borderColor },
          right:  { style: BorderStyle.NONE }
        },
        shading: { type: ShadingType.CLEAR, fill: bgColor },
        margins: { top: 20, bottom: 20, left: 160, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: line || " ", font: F, size: 21, color: "374151" })] })]
      })]
    });
  });
  var bottomRow = new TableRow({
    children: [new TableCell({
      width: { size: PW, type: WidthType.DXA },
      borders: {
        top:    { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
        left:   { style: BorderStyle.SINGLE, size: 16, color: borderColor },
        right:  { style: BorderStyle.NONE }
      },
      shading: { type: ShadingType.CLEAR, fill: bgColor },
      margins: { top: 0, bottom: 40, left: 160, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: " ", font: F, size: 10 })] })]
    })]
  });
  return new Table({
    width: { size: PW, type: WidthType.DXA },
    columnWidths: [PW],
    rows: [titleRow].concat(bodyRows).concat([bottomRow]),
  });
}

var tip    = function(t,l){ return infoBox("💡", t, l, COL.tipBg,    COL.tipBorder); };
var warn   = function(t,l){ return infoBox("⚠️", t, l, COL.warnBg,   COL.warnBorder); };
var task   = function(t,l){ return infoBox("📋", t, l, COL.taskBg,   COL.taskBorder); };
var why    = function(t,l){ return infoBox("❓", t, l, COL.whyBg,    COL.whyBorder); };
var expl   = function(t,l){ return infoBox("🔍", t, l, COL.explBg,   COL.explBorder); };
var analog = function(t,l){ return infoBox("🍽️", t, l, COL.analoqBg, COL.analoqBorder); };

function twoColTable(rows, w1, w2) {
  w1 = w1 || 3600; w2 = w2 || 6000;
  var border2 = function(c){ return { style: BorderStyle.SINGLE, size: 2, color: c }; };
  var border4 = function(c){ return { style: BorderStyle.SINGLE, size: 4, color: c }; };
  var allBorders4 = { top: border4("9CA3AF"), bottom: border4("9CA3AF"), left: border4("9CA3AF"), right: border4("9CA3AF") };
  var allBorders2 = function(ri){ return { top: border2("D1D5DB"), bottom: border2("D1D5DB"), left: border2("D1D5DB"), right: border2("D1D5DB") }; };

  var headerRow = new TableRow({
    tableHeader: true,
    children: rows[0].map(function(cell, i) {
      return new TableCell({
        width: { size: i === 0 ? w1 : w2, type: WidthType.DXA },
        borders: allBorders4,
        shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: cell, font: F, size: 20, bold: true, color: "FFFFFF" })] })]
      });
    })
  });

  var bodyRows = rows.slice(1).map(function(row, ri) {
    return new TableRow({
      children: row.map(function(cell, i) {
        return new TableCell({
          width: { size: i === 0 ? w1 : w2, type: WidthType.DXA },
          borders: allBorders2(ri),
          shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? "FFFFFF" : "F9FAFB" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, font: i === 0 ? FC : F, size: i === 0 ? 19 : 20, color: i === 0 ? "1A3A5C" : "374151" })] })]
        });
      })
    });
  });

  return new Table({
    width: { size: w1 + w2, type: WidthType.DXA },
    columnWidths: [w1, w2],
    rows: [headerRow].concat(bodyRows),
  });
}

function threeColTable(rows, w1, w2, w3) {
  var total = w1 + w2 + w3;
  var b4 = function(){ return { style: BorderStyle.SINGLE, size: 4, color: "9CA3AF" }; };
  var b2 = function(){ return { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB" }; };

  var headerRow = new TableRow({
    tableHeader: true,
    children: rows[0].map(function(cell, i) {
      var w = i === 0 ? w1 : (i === 1 ? w2 : w3);
      return new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders: { top: b4(), bottom: b4(), left: b4(), right: b4() },
        shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: cell, font: F, size: 20, bold: true, color: "FFFFFF" })] })]
      });
    })
  });

  var bodyRows = rows.slice(1).map(function(row, ri) {
    return new TableRow({
      children: row.map(function(cell, i) {
        var w = i === 0 ? w1 : (i === 1 ? w2 : w3);
        return new TableCell({
          width: { size: w, type: WidthType.DXA },
          borders: { top: b2(), bottom: b2(), left: b2(), right: b2() },
          shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? "FFFFFF" : "F9FAFB" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, font: i === 0 ? FC : F, size: i === 0 ? 18 : 19, color: "374151" })] })]
        });
      })
    });
  });

  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: [w1, w2, w3],
    rows: [headerRow].concat(bodyRows),
  });
}

function stepTable(header, steps) {
  var b4 = { style: BorderStyle.SINGLE, size: 4, color: "9CA3AF" };
  var b2 = { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB" };

  var headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 800, type: WidthType.DXA },
        borders: { top: b4, bottom: b4, left: b4, right: b4 },
        shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "#", font: F, size: 20, bold: true, color: "FFFFFF" })] })]
      }),
      new TableCell({
        width: { size: PW - 800, type: WidthType.DXA },
        borders: { top: b4, bottom: b4, left: b4, right: b4 },
        shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: header, font: F, size: 20, bold: true, color: "FFFFFF" })] })]
      })
    ]
  });

  var bodyRows = steps.map(function(step, i) {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 800, type: WidthType.DXA },
          borders: { top: b2, bottom: b2, left: b2, right: b2 },
          shading: { type: ShadingType.CLEAR, fill: "2563EB" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + 1), font: F, size: 22, bold: true, color: "FFFFFF" })] })]
        }),
        new TableCell({
          width: { size: PW - 800, type: WidthType.DXA },
          borders: { top: b2, bottom: b2, left: b2, right: b2 },
          shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "FFFFFF" : "F9FAFB" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: step, font: F, size: 20, color: "374151" })] })]
        })
      ]
    });
  });

  return new Table({
    width: { size: PW, type: WidthType.DXA },
    columnWidths: [800, PW - 800],
    rows: [headerRow].concat(bodyRows),
  });
}

function annotatedCode(title, lines) {
  var W1 = Math.floor(PW * 0.52);
  var W2 = PW - W1;
  var b4h = { style: BorderStyle.SINGLE, size: 4, color: "9CA3AF" };
  var b1  = { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" };
  var b2b = { style: BorderStyle.SINGLE, size: 2, color: "BFDBFE" };

  var titleRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: W1, type: WidthType.DXA },
        borders: { top: b4h, bottom: b4h, left: b4h, right: { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB" } },
        shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: title || "Kod", font: F, size: 20, bold: true, color: "FFFFFF" })] })]
      }),
      new TableCell({
        width: { size: W2, type: WidthType.DXA },
        borders: { top: b4h, bottom: b4h, left: { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB" }, right: b4h },
        shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "Wyjaśnienie", font: F, size: 20, bold: true, color: "FFFFFF" })] })]
      })
    ]
  });

  var bodyRows = lines.map(function(pair, i) {
    var code = pair[0]; var explanation = pair[1];
    return new TableRow({
      children: [
        new TableCell({
          width: { size: W1, type: WidthType.DXA },
          borders: { top: b1, bottom: b1, left: b4h, right: b2b },
          shading: { type: ShadingType.CLEAR, fill: COL.codeBg },
          margins: { top: 40, bottom: 40, left: 120, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: code || " ", font: FC, size: 17, color: "1A3A5C" })] })]
        }),
        new TableCell({
          width: { size: W2, type: WidthType.DXA },
          borders: { top: b1, bottom: b1, left: b2b, right: b4h },
          shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "FFFFFF" : "F8FAFF" },
          margins: { top: 40, bottom: 40, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: explanation || " ", font: F, size: 19, color: "374151" })] })]
        })
      ]
    });
  });

  return new Table({
    width: { size: PW, type: WidthType.DXA },
    columnWidths: [W1, W2],
    rows: [titleRow].concat(bodyRows),
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
              shading: { type: ShadingType.CLEAR, fill: "003366" },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: COL.h1Bg }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              margins: { top: 140, bottom: 140, left: 240, right: 240 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `DZIEŃ ${dayNum}  ·  `, font: F, size: 26, bold: true, color: COL.h1Bg }),
                    new TextRun({ text: title, font: F, size: 26, bold: true, color: "FFFFFF" }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 60, after: 0 },
                  children: [new TextRun({ text: description, font: F, size: 19, color: "A0B8D0", italics: true })],
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

function makeHeader() {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COL.h1Bg, space: 1 } },
        tabStops: [{ type: TabStopType.RIGHT, position: PW }],
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({ text: "Programowanie Aplikacji Mobilnych \u2014 \u00c6wiczenie Laboratoryjne Nr 5", font: F, size: 18, color: "1A3A5C" }),
          new TextRun({ text: "\tHilt, Testy Jednostkowe i Instrumentacyjne", font: F, size: 18, color: "6B7280", italics: true }),
        ]
      })
    ]
  });
}

function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "9CA3AF", space: 1 } },
        tabStops: [{ type: TabStopType.RIGHT, position: PW }],
        spacing: { before: 100, after: 0 },
        children: [
          new TextRun({ text: "Katedra Informatyki \u2014 Instrukcja Laboratoryjna Nr 5", font: F, size: 17, color: "6B7280" }),
          new TextRun({ text: "\t", font: F, size: 17 }),
          new SimpleField("PAGE"),
        ]
      })
    ]
  });
}

// ─── OKŁADKA ─────────────────────────────────────────────────────────────────

function makeCover() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 0 },
      children: [new TextRun({ text: "POLITECHNIKA", font: F, size: 26, bold: true, color: COL.headerBg })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [new TextRun({ text: "KATEDRA INFORMATYKI", font: F, size: 22, color: "6B7280" })]
    }),
    new Table({
      width: { size: PW, type: WidthType.DXA },
      columnWidths: [PW],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: PW, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        shading: { type: ShadingType.CLEAR, fill: COL.h1Bg },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0106WICZENIE LABORATORYJNE NR 5", font: F, size: 22, bold: true, color: "FFFFFF" })] })]
      })] })]
    }),
    new Table({
      width: { size: PW, type: WidthType.DXA },
      columnWidths: [PW],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: PW, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Hilt, Testy Jednostkowe i Instrumentacyjne", font: F, size: 38, bold: true, color: "FFFFFF" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 0 }, children: [new TextRun({ text: "Programowanie Aplikacji Mobilnych (Android / Kotlin / Jetpack Compose)", font: F, size: 22, color: "93C5FD", italics: true })] }),
        ]
      })] })]
    }),
    sp(400),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Projekty: TaskApp (Hilt) + PokeApp (testy) \u2014 rozszerzenie Lab 2\u20134", font: F, size: 22, color: "374151" })] }),
    sp(200),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Wymagania wst\u0119pne: uko\u0144czone Lab 1\u20134 (Room, ViewModel, Navigation, Retrofit, Coroutines)", font: F, size: 20, color: "6B7280" })] }),
    sp(600),
    (function() {
      var coverData = [
        ["Czas trwania", "3 \u00d7 90 min"],
        ["Poziom trudno\u015bci", "Zaawansowany"],
        ["Punktacja", "100 pkt"]
      ];
      var w = Math.floor(PW / 3);
      var cells = coverData.map(function(pair) {
        return new TableCell({
          width: { size: w, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" }
          },
          shading: { type: ShadingType.CLEAR, fill: "F3F4F6" },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: pair[0], font: F, size: 18, color: "6B7280" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: pair[1], font: F, size: 22, bold: true, color: COL.headerBg })] }),
          ]
        });
      });
      return new Table({
        width: { size: PW, type: WidthType.DXA },
        columnWidths: [w, w, PW - 2 * w],
        rows: [new TableRow({ children: cells })]
      });
    })(),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// TREŚĆ GŁÓWNA
// ════════════════════════════════════════════════════════════════════════════

var content = [].concat(
  makeCover(),

  // ─── SPIS TREŚCI ────────────────────────────────────────────────────────
  [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Spis tre\u015bci", font: F, size: 28, bold: true, color: "FFFFFF" })],
      shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
      border: { left: { style: BorderStyle.SINGLE, size: 24, color: COL.h1Bg } },
      spacing: { before: 0, after: 160 },
      indent: { left: 160 },
    }),
    new TableOfContents("Spis tre\u015bci", {
      hyperlink: true,
      headingStyleRange: "1-3",
      stylesWithLevels: [
        { styleName: "Heading1", level: 1 },
        { styleName: "Heading2", level: 2 },
        { styleName: "Heading3", level: 3 },
      ]
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 1 — CZYM JEST DEPENDENCY INJECTION?
  // ═══════════════════════════════════════════════════════════════
  [
    ...dayBanner(1, "Dependency Injection i Hilt", "Sekcje 1–4 · ~90 minut · Zrozumienie DI, konfiguracja Hilt, moduły i zakresy cyklu życia"),
    h1("1. Czym jest Dependency Injection?"),
    para("Zanim poznamy Hilt, musimy dok\u0142adnie zrozumie\u0107 problem, kt\u00f3ry rozwi\u0105zuje. Dependency Injection (DI) to jeden z tych wzorców projektowych, kt\u00f3ry \u0142atwo zrozumie\u0107 po zobaczeiu kodu bez niego \u2014 jest po prostu nieczytelny i kruchy."),
    sp(),

    h2("1.1 \u015awiat bez DI \u2014 problem twardych zale\u017cno\u015bci"),
    para("Wyobra\u017a sobie, \u017ce piszesz ViewModel, kt\u00f3ry potrzebuje Repository, kt\u00f3re potrzebuje DAO i ApiService. Bez DI ka\u017cda klasa tworzy swoje zale\u017cno\u015bci samodzielnie:"),
    sp(80),
    codeBlock([
      "// BEZ DI \u2014 jak NIE nale\u017cy robi\u0107:",
      "class TaskViewModel : ViewModel() {",
      "  // ViewModel sam tworzy Database \u2014 hardcoded 'new'",
      "  private val db = Room.databaseBuilder(        // Wymaga Context!",
      "    MyApp.instance,                             // Singleton aplikacji \u2014 anty-wzorzec",
      "    TaskDatabase::class.java, \"tasks.db\"",
      "  ).build()",
      "  private val dao        = db.taskDao()         // Hardcoded zale\u017cno\u015b\u0107",
      "  private val apiService = RetrofitClient.api   // Singleton \u2014 nie mo\u017cna zamockowa\u0107!",
      "  private val repository = TaskRepository(dao, apiService)",
      "",
      "  // Problem 1: W te\u015bcie nie mo\u017cna podmieni\u0107 prawdziwej bazy na fake",
      "  // Problem 2: Zmiana implementacji bazy = zmiana w ViewModelu",
      "  // Problem 3: ViewModel tworzy Room \u2014 narusza Single Responsibility",
      "}",
    ], "Anty-wzorzec: twarde zale\u017cno\u015bci"),
    sp(120),

    analog("Analogia: budowa domu i podwykonawcy", [
      "Wyobra\u017a sobie budow\u0119 domu. Architekt (ViewModel) potrzebuje elektryka, hydraulika i murarza.",
      "",
      "TWARDY ZALE\u017bNO\u015a\u0106 (z\u0142y spos\u00f3b): Architekt sam szuka elektryka, dzwoni\u0105c do konkretnego Pana Jana.",
      "Je\u015bli Pan Jan jest chory, budowa stoi. Je\u015bli chcemy zmieni\u0107 elektryka \u2014 musimy zmieni\u0107 ca\u0142y projekt.",
      "",
      "DEPENDENCY INJECTION (dobry spos\u00f3b): Architekt m\u00f3wi tylko 'potrzebuj\u0119 elektryka'.",
      "KIEROWNIK BUDOWY (Hilt) dostarcza odpowiedniego fachowca. Mo\u017ce to by\u0107 Pan Jan, albo Pani Anna,",
      "albo na czas test\u00f3w \u2014 aktor kt\u00f3ry udaje elektryka (mock). Architekt nie wie i nie musi wiedzie\u0107.",
      "",
      "Korzy\u015bci: \u0142atwa wymiana implementacji, testowalno\u015b\u0107, single responsibility, brak cykli zale\u017cno\u015bci.",
    ]),
    sp(120),

    h2("1.2 Trzy sposoby wstrzykiwania"),
    twoColTable([
      ["Typ wstrzykiwania", "Opis i kiedy u\u017cywac"],
      ["Constructor Injection\n(preferowany)", "Zale\u017cno\u015bci przekazywane przez konstruktor. Najbardziej czytelny, obowi\u0105zkowy dla klas nie-Android (Repository, UseCase, Mapper). Hilt automatycznie dostarcza argumenty."],
      ["Field Injection\n(@Inject lateinit var)", "Dla klas tworzone przez Android (Activity, Fragment, ViewModel). Hilt wstrzykuje pola oznaczone @Inject automatycznie po @AndroidEntryPoint."],
      ["Method Injection\n(@Inject fun)", "Rzadko u\u017cywany. Wywo\u0142ywany po constructor injection. Przydatny gdy zale\u017cno\u015b\u0107 potrzebna dopiero po cz\u0119\u015bciowej inicjalizacji."],
    ], 2800, PW - 2800),
    sp(120),

    why("Dlaczego w\u0142a\u015bnie Hilt, a nie r\u0119czne DI lub pure Dagger?", [
      "RECZNE DI: Skaluje si\u0119 do oko\u0142o 10 klas. Przy 50+ klasach 'fabryki zale\u017cno\u015bci' staj\u0105 si\u0119 koszmarem \u2014 ka\u017cda zmiana to lawina edit\u00f3w.",
      "",
      "PURE DAGGER 2: Pot\u0119\u017cny, ale wymaga r\u0119cznego pisania Component\u00f3w, Module\u00f3w i Subcomponent\u00f3w.",
      "Krzywa uczenia si\u0119 jest bardzo stroma. Tysi\u0105ce linii boilerplate kodu.",
      "",
      "HILT = Dagger 2 + gotowe komponenty dla Android + zero boilerplate komponent\u00f3w.",
      "Hilt wie o cyklu \u017cycia Activity, Fragment, ViewModel, Service \u2014 sam tworzy odpowiednie zakresy.",
      "Mniej kodu do napisania, pe\u0142na moc Dagger 2 'pod spodem'.",
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 2 — HILT: KONFIGURACJA
  // ═══════════════════════════════════════════════════════════════
  [
    h1("2. Hilt \u2014 konfiguracja projektu"),
    para("Hilt wymaga konfiguracji na trzech poziomach: wtyczka Gradle (procesor adnotacji), zale\u017cno\u015bci biblioteki, oraz adnotacja @HiltAndroidApp na klasie Application. Bez kt\u00f3regokolwiek z tych element\u00f3w Hilt nie dzia\u0142a."),
    sp(),

    h2("2.1 Wtyczka i zale\u017cno\u015bci"),
    codeBlock([
      "# gradle/libs.versions.toml",
      "[versions]",
      "hilt            = \"2.51.1\"    # Hilt \u2014 zawsze u\u017cyj tej samej wersji dla wszystkich artefakt\u00f3w!",
      "ksp             = \"2.0.21-1.0.25\"   # KSP \u2014 Kotlin Symbol Processing (szybszy ni\u017c kapt)",
      "",
      "[libraries]",
      "hilt-android    = { module = \"com.google.dagger:hilt-android\",           version.ref = \"hilt\" }",
      "hilt-compiler   = { module = \"com.google.dagger:hilt-compiler\",          version.ref = \"hilt\" }",
      "hilt-nav-compose= { module = \"androidx.hilt:hilt-navigation-compose\",    version = \"1.2.0\" }",
      "hilt-testing    = { module = \"com.google.dagger:hilt-android-testing\",   version.ref = \"hilt\" }",
      "",
      "[plugins]",
      "hilt            = { id = \"com.google.dagger.hilt.android\", version.ref = \"hilt\" }",
      "ksp             = { id = \"com.google.devtools.ksp\",         version.ref = \"ksp\" }",
    ], "gradle/libs.versions.toml"),
    sp(120),

    codeBlock([
      "// build.gradle.kts (project level)",
      "plugins {",
      "  alias(libs.plugins.hilt)  apply false  // Deklaruj, nie stosuj na poziomie projektu",
      "  alias(libs.plugins.ksp)   apply false",
      "}",
      "",
      "// app/build.gradle.kts",
      "plugins {",
      "  id(\"com.android.application\")",
      "  id(\"org.jetbrains.kotlin.android\")",
      "  alias(libs.plugins.hilt)   // Wtyczka Hilt \u2014 musi by\u0107 przed dependencies!",
      "  alias(libs.plugins.ksp)    // KSP generuje kod w czasie kompilacji",
      "}",
      "",
      "dependencies {",
      "  implementation(libs.hilt.android)         // Runtime Hilt",
      "  ksp(libs.hilt.compiler)                   // Procesor adnotacji \u2014 generuje kod DI",
      "  implementation(libs.hilt.nav.compose)      // hiltViewModel() w Compose",
      "",
      "  // Dla test\u00f3w:",
      "  testImplementation(libs.hilt.testing)      // HiltAndroidRule w JVM testach",
      "  androidTestImplementation(libs.hilt.testing)  // HiltAndroidRule w Instrumented testach",
      "  kspTest(libs.hilt.compiler)               // Generowanie kodu DI dla test\u00f3w",
      "  kspAndroidTest(libs.hilt.compiler)         // Generowanie kodu DI dla Android test\u00f3w",
      "}",
    ], "Konfiguracja build.gradle.kts"),
    sp(120),

    warn("Wersja hilt-compiler MUSI by\u0107 identyczna z hilt-android!", [
      "Hilt u\u017cywa procesora adnotacji (KSP) do generowania kodu w czasie kompilacji.",
      "Je\u015bli wersja kompilatora r\u00f3\u017cni si\u0119 od wersji runtime, Hilt wygeneruje niepoprawny kod.",
      "",
      "B\u0141\u0104D: hilt-android = 2.51.1 + hilt-compiler = 2.48 \u2192 b\u0142\u0105d kompilacji, trudny do zdebugowania.",
      "POPRAWNIE: Obie zale\u017cno\u015bci wskazuj\u0105 na version.ref = \"hilt\" w libs.versions.toml.",
      "",
      "Ten sam problem dotyczy par: room-runtime + room-compiler, lifecycle-viewmodel + lifecycle-compiler.",
      "Zawsze u\u017cyj jednej zmiennej wersji dla wszystkich artefakt\u00f3w tej samej biblioteki.",
    ]),
    sp(120),

    h2("2.2 Klasa Application z @HiltAndroidApp"),
    annotatedCode("MyApp.kt \u2014 punkt wej\u015bcia Hilt", [
      ["@HiltAndroidApp", "@HiltAndroidApp uruchamia generator kodu Hilt dla ca\u0142ej aplikacji"],
      ["class MyApp : Application() {", "Dziedziczy po Application \u2014 nadpisuje klasa bazowa Androida"],
      ["  // Hilt automatycznie tworzy", "Nie musisz nic pisac! Hilt generuje komponent App w tle."],
      ["  // AppComponent pod spodem.", ""],
      ["}", ""],
      ["", ""],
      ["// W AndroidManifest.xml:", "Musisz zarejestrowa\u0107 klase Application w Manife\u015bcie!"],
      ["<application", ""],
      ["  android:name=\".MyApp\"", "Bez tej linii Android u\u017cyje domy\u015blnej klasy Application"],
      ["  ...>", "Brak .MyApp = Hilt nie inicjalizuje si\u0119 = crash przy @Inject"],
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 3 — MODUŁY HILT
  // ═══════════════════════════════════════════════════════════════
  [
    h1("3. Modu\u0142y Hilt \u2014 jak dostarcza\u0107 zale\u017cno\u015bci"),
    para("Hilt musi wiedzie\u0107, jak stworzy\u0107 ka\u017cd\u0105 zale\u017cno\u015b\u0107. Je\u015bli klasa ma konstruktor oznaczony @Inject \u2014 Hilt poradzi sobie sam. Ale co je\u015bli musimy dostarczy\u0107 interfejs, lub obiekt tworzony przez builder (jak Retrofit lub Room)? Tu w\u0142a\u015bnie potrzebujemy Modu\u0142\u00f3w."),
    sp(),

    h2("3.1 Kiedy potrzebny jest @Module?"),
    twoColTable([
      ["Sytuacja", "Dlaczego potrzebny modu\u0142?"],
      ["Interfejs (np. PokemonRepository)", "Hilt nie wie kt\u00f3r\u0105 implementacj\u0119 wybra\u0107. @Binds wskazuje konkretn\u0105 klas\u0119."],
      ["Zewn\u0119trzna biblioteka (Retrofit, Room, Gson)", "Nie mo\u017cesz doda\u0107 @Inject do klasy zewn\u0119trznej. @Provides opis opisuje jak j\u0105 stworzy\u0107."],
      ["Skomplikowana inicjalizacja (Builder pattern)", "Tworzenie przez builder (Retrofit.Builder()) wymaga kodu \u2014 Hilt sam tego nie ogarnie."],
      ["Klasa tworzona fabryk\u0105 (OkHttpClient.Builder)", "Trzeba skonfigurowa\u0107 timeouty, interceptory \u2014 @Provides to miejsce na t\u0119 logik\u0119."],
    ], 2800, PW - 2800),
    sp(120),

    h2("3.2 @Provides \u2014 jak dostarczy\u0107 zewn\u0119trzne klasy"),
    annotatedCode("NetworkModule.kt \u2014 @Provides dla Retrofit i OkHttp", [
      ["@Module", "@Module informuje Hilt, \u017ce ta klasa zawiera przepisy na tworzenie obiekt\u00f3w"],
      ["@InstallIn(SingletonComponent::class)", "Okre\u015bla zakres: Singleton = jeden egzemplarz na ca\u0142\u0105 aplikacj\u0119"],
      ["object NetworkModule {", "object (nie class) \u2014 funkcje @Provides mog\u0105 by\u0107 statyczne, to szybsze"],
      ["", ""],
      ["  @Provides", "@Provides = ta funkcja tworzy obiekt dla Hilt"],
      ["  @Singleton", "@Singleton = stw\u00f3rz raz, reedytuj ten sam egzemplarz wszyscie"],
      ["  fun provideOkHttpClient(): OkHttpClient {", "Hilt wywo\u0142a t\u0119 funkcj\u0119 gdy kto\u015b poprosi o OkHttpClient"],
      ["    return OkHttpClient.Builder()", "Builder pattern \u2014 nie mo\u017cna tego zrobi\u0107 przez @Inject"],
      ["      .connectTimeout(10, TimeUnit.SECONDS)", "Konfiguracja timeoutu"],
      ["      .build()", ""],
      ["  }", ""],
      ["", ""],
      ["  @Provides @Singleton", "Dwie adnotacje na jednej linii \u2014 poprawna sk\u0142adnia"],
      ["  fun provideRetrofit(", "Hilt widzi OkHttpClient w parametrze \u2014 wstrzykuje automatycznie!"],
      ["    client: OkHttpClient    // <- wstrzyknij!", "Hilt u\u017cyje provideOkHttpClient() aby da\u0107 ten parametr"],
      ["  ): PokemonApiService {", "Zwracamy interfejs \u2014 Retrofit wygeneruje implementacj\u0119"],
      ["    return Retrofit.Builder()", ""],
      ["      .baseUrl(\"https://pokeapi.co/api/v2/\")", ""],
      ["      .client(client)", "Przekazujemy wstrzykni\u0119ty klient"],
      ["      .addConverterFactory(GsonConverterFactory.create())", ""],
      ["      .build()", ""],
      ["      .create(PokemonApiService::class.java)", "Dynamic Proxy \u2014 implementacja interfejsu"],
      ["  }", ""],
      ["}", ""],
    ]),
    sp(120),

    h2("3.3 @Binds \u2014 jak powi\u0105za\u0107 interfejs z implementacj\u0105"),
    annotatedCode("RepositoryModule.kt \u2014 @Binds dla interfejsu", [
      ["@Module", ""],
      ["@InstallIn(SingletonComponent::class)", ""],
      ["abstract class RepositoryModule {", "MUSI by\u0107 abstract class (nie object) gdy u\u017cywasz @Binds"],
      ["", ""],
      ["  @Binds", "@Binds jest szybszy od @Provides \u2014 nie tworzy klasy po\u015bredniej"],
      ["  @Singleton", "Jeden egzemplarz repository na app"],
      ["  abstract fun bindPokemonRepository(", "@Binds: Hilt widzi \u017ce impl = PokemonRepositoryImpl"],
      ["    impl: PokemonRepositoryImpl     // <- konkretna klasa", "PokemonRepositoryImpl musi mie\u0107 @Inject constructor"],
      ["  ): PokemonRepository              // <- interfejs", "Gdy kto\u015b poprosi o PokemonRepository \u2014 dostanie impl"],
      ["}", ""],
    ]),
    sp(120),

    expl("@Provides vs @Binds \u2014 kt\u00f3rego kiedy?", [
      "@BINDS \u2014 gdy masz interfejs + klas\u0119 z @Inject constructor. Tylko mapowanie interfejs\u2192implementacja.",
      "Hilt generuje prostszy, szybszy kod. Wymaga abstract class (nie object).",
      "Przyk\u0142ad: interface PokemonRepository \u2190 @Binds \u2014 PokemonRepositoryImpl",
      "",
      "@PROVIDES \u2014 gdy musisz wykona\u0107 kod tworzenia obiektu (Builder pattern, fabryka, external lib).",
      "Funkcja mo\u017ce by\u0107 nieabstrakcyjna, mo\u017ce by\u0107 w object (statyczna = szybsza).",
      "Przyk\u0142ad: OkHttpClient.Builder() + timeout + interceptory = potrzebujesz kodu \u2190 u\u017cij @Provides.",
      "",
      "ZASADA: preferuj @Binds gdy si\u0119 da, u\u017cyj @Provides gdy musisz wykona\u0107 kod tworzenia.",
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 4 — ZAKRESY (SCOPES)
  // ═══════════════════════════════════════════════════════════════
  [
    h1("4. Zakresy (Scopes) \u2014 cykl \u017cycia zale\u017cno\u015bci"),
    para("Zakres (scope) okre\u015bla, jak d\u0142ugo istnieje wstrzykni\u0119ty obiekt. To kluczowe poj\u0119cie: zb\u0119dne singleton\u00f3w prowadzi do wyciek\u00f3w pami\u0119ci, a zbyt kr\u00f3tki czas \u017cycia do wydajno\u015bciowych problem\u00f3w."),
    sp(),

    analog("Analogia: okresy wa\u017cno\u015bci bilet\u00f3w", [
      "Wyobra\u017a sobie r\u00f3\u017cne rodzaje bilet\u00f3w:",
      "",
      "@Singleton = Karta sta\u0142ego klienta \u2014 wa\u017cna przez ca\u0142y czas korzystania z us\u0142ugi (life of app).",
      "Jeden egzemplarz. Wszystkie miejsca dostaj\u0105 t\u0119 sam\u0105 kart\u0119. Przyk\u0142ady: Database, Retrofit.",
      "",
      "@ActivityRetainedScoped = Bilet tygodniowy \u2014 przetrwa obr\u00f3t ekranu (ViewModel jest ActivityRetained).",
      "ViewModel Hilt automatycznie u\u017cywa tego zakresu.",
      "",
      "@ViewModelScoped = Bilet na jedn\u0105 jazd\u0119 w obie strony \u2014 \u017cyje dopiero do zniszczenia ViewModela.",
      "U\u017cywaj dla UseCase i helper\u00f3w, kt\u00f3re powinny by\u0107 unikalne dla ka\u017cdego ViewModela.",
      "",
      "@ActivityScoped = Bilet dzienny \u2014 wa\u017cny tylko w obr\u0119bie jednej Activity (nie przetrwa rotacji!).",
    ]),
    sp(120),

    h2("4.1 Tabela zakres\u00f3w Hilt"),
    twoColTable([
      ["Adnotacja zakresu", "Komponent / Czas \u017cycia / Zastosowanie"],
      ["@Singleton", "SingletonComponent. \u017byje przez ca\u0142\u0105 aplikacj\u0119. U\u017cyj dla: Database, Retrofit, OkHttpClient, Repository."],
      ["@ActivityRetainedScoped", "ActivityRetainedComponent. Przetrwa rotacj\u0119 ekranu (tak jak ViewModel). U\u017cyj dla: ViewModel-level helper\u00f3w."],
      ["@ViewModelScoped", "ViewModelComponent. \u017byje przez czas \u017cycia konkretnego ViewModela. U\u017cyj dla: UseCase zwi\u0105zanych z jednym VM."],
      ["@ActivityScoped", "ActivityComponent. \u017byje wraz z Activity \u2014 umiera przy rotacji. U\u017cyj dla: helper\u00f3w UI specyficznych dla Activity."],
      ["@FragmentScoped", "FragmentComponent. \u017byje wraz z Fragmentem. Rzadko potrzebny w Compose (brak Fragment\u00f3w)."],
      ["(brak adnotacji)", "Ka\u017cde wstrzykni\u0119cie tworzy NOWY egzemplarz. U\u017cyj dla: lekkich, bezstanowych helper\u00f3w."],
    ], 2600, PW - 2600),
    sp(120),

    warn("@Singleton w ViewModelu to wyciek pami\u0119ci!", [
      "Je\u015bli wstrzykniesz @Singleton obiekt do Activity (nie przez ViewModel), ten singleton",
      "b\u0119dzie trzyma\u0107 referencj\u0119 do Activity \u2014 nawet po jej zniszczeniu.",
      "",
      "Przyk\u0142ad: @Singleton class UserPreferences(@Inject val context: Context) \u2014 Je\u015bli context to",
      "ActivityContext (nie ApplicationContext), masz wyciek pami\u0119ci.",
      "",
      "ZASADA: Obiekty @Singleton mog\u0105 trzyma\u0107 jedynie ApplicationContext.",
      "U\u017cyj @ApplicationContext zamiast Context tam gdzie to konieczne.",
    ]),
    sp(120),

    h2("4.2 Hilt i ViewModel \u2014 @HiltViewModel"),
    annotatedCode("TaskViewModel.kt z Hilt", [
      ["@HiltViewModel", "@HiltViewModel rejestruje VM w systemie Hilt \u2014 Hilt zarz\u0105dza tworzeniem"],
      ["class TaskViewModel @Inject constructor(", "@Inject constructor = tutaj Hilt wstrzykuje zale\u017cno\u015bci"],
      ["  private val repository: TaskRepository,", "Hilt dostarczy implementacj\u0119 (z @Binds lub @Provides)"],
      ["  private val savedStateHandle: SavedStateHandle", "SavedStateHandle \u2014 Hilt wie jak to dostarczy\u0107 automatycznie!"],
      [") : ViewModel() {", ""],
      ["  val tasks = repository.getAllTasks()", "Korzystamy z wstrzykni\u0119tego repozytorium"],
      ["}", ""],
      ["", ""],
      ["// W Compose UI \u2014 dost\u0119p do HiltViewModel:", ""],
      ["@Composable fun TaskScreen(", ""],
      ["  viewModel: TaskViewModel = hiltViewModel()", "hiltViewModel() \u2014 z libs.hilt.nav.compose"],
      [") {", "hiltViewModel() = Hilt tworzy VM lub zwraca istniej\u0105cy z zakresu"],
      ["  val tasks by viewModel.tasks.collectAsStateWithLifecycle()", ""],
      ["}", ""],
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 5 — FILOZOFIA TESTOWANIA
  // ═══════════════════════════════════════════════════════════════
  [
    ...dayBanner(2, "Testowanie — filozofia, JUnit i MockK", "Sekcje 5–8 · ~90 minut · Piramida testów, testy jednostkowe z MockK, testy integracyjne Room i testy Compose UI"),
    h1("5. Filozofia testowania \u2014 piramida test\u00f3w"),
    para("Testy to nie opcja \u2014 to gwarancja, \u017ce refaktoryzacja nie psuje istniej\u0105cych funkcjonalno\u015bci, a nowy kod robi to co powinien. Dobry projekt testowy opiera si\u0119 na 'piramidzie test\u00f3w'."),
    sp(),

    analog("Piramida test\u00f3w \u2014 metafora budownictwa", [
      "Wyobra\u017a sobie budynek: solidne fundamenty (wiele ma\u0142ych test\u00f3w) utrzymuj\u0105 \u015bciany (mniej test\u00f3w integracyjnych),",
      "a dach (nieliczne testy E2E) zamyka ca\u0142o\u015b\u0107. Odwrotna piramida (du\u017co E2E, ma\u0142o unit) = krucha budowla.",
      "",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588  DAch: Testy E2E / UI (5%) \u2014 wolne, kruche, kosztowne utrzymania",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588  \u015aciany: Testy integracyjne (25%) \u2014 Room + API + ViewModel razem",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588  Fundamenty: Testy jednostkowe (70%) \u2014 szybkie, izolowane, tanie",
      "",
      "Google rekomenduje: 70% unit \u2014 20% integration \u2014 10% E2E.",
    ]),
    sp(120),

    h2("5.1 Podzia\u0142 test\u00f3w w projekcie Android"),
    twoColTable([
      ["Typ testu", "Lokalizacja / Charakterystyka / Narz\u0119dzia"],
      ["Unit tests\n(testy jednostkowe)", "src/test/ \u2014 JVM only, bez Androida. Milisekundy na test. Testuj: mapper\u00f3w, ViewModel logiki, use case\u00f3w, util klas. Narz\u0119dzia: JUnit 5, MockK, Turbine, kotlinx-coroutines-test."],
      ["Integration tests\n(testy integracyjne)", "src/test/ lub src/androidTest/ \u2014 Room InMemory + Fake Repository. Testuj: DAO queries, Repository flow, VM + Repository razem. Narz\u0119dzia: Room + JUnit 5."],
      ["Instrumented tests\n(UI testy)", "src/androidTest/ \u2014 wymagaj\u0105 emulatora/urz\u0105dzenia. Sekundy do minut. Testuj: Compose UI interakcje, nawigacj\u0119, dost\u0119pno\u015b\u0107. Narz\u0119dzia: Compose Testing, Espresso, Hilt Testing."],
    ], 2200, PW - 2200),
    sp(120),

    h2("5.2 Zale\u017cno\u015bci testowe \u2014 co doda\u0107 do build.gradle.kts"),
    codeBlock([
      "// app/build.gradle.kts \u2014 sekcja dependencies",
      "dependencies {",
      "  // JUnit 5 \u2014 modern framework do test\u00f3w jednostkowych",
      "  testImplementation(\"org.junit.jupiter:junit-jupiter:5.10.2\")",
      "  testImplementation(\"org.junit.jupiter:junit-jupiter-params:5.10.2\")  // @ParameterizedTest",
      "",
      "  // MockK \u2014 mocking framework dla Kotlin (zamiast Mockito)",
      "  testImplementation(\"io.mockk:mockk:1.13.12\")",
      "",
      "  // Turbine \u2014 testowanie Flow (od Cash App)",
      "  testImplementation(\"app.cash.turbine:turbine:1.1.0\")",
      "",
      "  // Coroutines test support",
      "  testImplementation(\"org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1\")",
      "",
      "  // Compose Testing (Instrumented)",
      "  androidTestImplementation(\"androidx.compose.ui:ui-test-junit4\")",
      "  debugImplementation(\"androidx.compose.ui:ui-test-manifest\")  // Wymagany manifest dla test\u00f3w",
      "",
      "  // Hilt Testing",
      "  androidTestImplementation(libs.hilt.testing)",
      "  kspAndroidTest(libs.hilt.compiler)",
      "}",
      "",
      "// Kt\u00f3ry JUnit runner? Dla JUnit 5 potrzebny dodatkowy plugin:",
      "tasks.withType<Test> { useJUnitPlatform() }  // W bloku android {} lub tasks",
    ], "Zale\u017cno\u015bci testowe"),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 6 — TESTY JEDNOSTKOWE Z MOCKK
  // ═══════════════════════════════════════════════════════════════
  [
    h1("6. Testy jednostkowe \u2014 JUnit 5 + MockK"),
    para("Test jednostkowy (unit test) testuje jedn\u0105 klas\u0119 w izolacji. Wszystkie zale\u017cno\u015bci zast\u0119pujemy obiektami pozorowanymi (mock). Dlatego Dependency Injection jest kluczowy dla testowalno\u015bci!"),
    sp(),

    why("Dlaczego MockK zamiast Mockito dla Kotlin?", [
      "Mockito powsta\u0142 dla Javy i ma kilka problem\u00f3w z Kotlinem:",
      "1. Klasy final \u2014 w Kotlinie wszystkie klasy s\u0105 domy\u015blnie final. Mockito nie mo\u017ce ich mockowa\u0107 bez hack\u00f3w.",
      "2. Kotlin coroutines i suspend functions \u2014 Mockito nie wspiera natywnie, wymaga obej\u015b\u0107.",
      "3. Kotlin-specific API (companion object, extension functions, top-level functions) \u2014 Mockito nie obs\u0142uguje.",
      "",
      "MockK zosta\u0142 stworzony dla Kotlin od podstaw:",
      "+ Mockuje klasy final natywnie (przez inline mocking).",
      "+ Natywne wsparcie dla suspend functions (coEvery, coVerify).",
      "+ Mocki companion object\u00f3w, object singleton\u00f3w, extension functions.",
    ]),
    sp(120),

    h2("6.1 Anatomia testu jednostkowego"),
    annotatedCode("PokemonMapperTest.kt \u2014 test mappera", [
      ["class PokemonMapperTest {", "Zwyk\u0142a klasa Kotlin \u2014 bez @RunWith, bez Android"],
      ["", ""],
      ["  @Test", "@Test \u2014 adnotacja JUnit 5 (import org.junit.jupiter.api.Test)"],
      ["  fun `height in decimeters is converted to meters`() {", "Nazwa testu jako backtick string \u2014 czytelna dokumentacja"],
      ["    // GIVEN \u2014 przygotuj dane", "Sekcja Given: co mamy na wej\u015bciu (Arrange)"],
      ["    val dto = fakePokemonDetailDto(height = 7)", "Tworzymy DTO z wysoko\u015bci\u0105 7 dm (= 0.7m)"],
      ["", ""],
      ["    // WHEN \u2014 wykonaj testowane dzia\u0142anie", "Sekcja When: co testujemy (Act)"],
      ["    val result = dto.toDomainModel()", "Wywo\u0142ujemy mapper \u2014 to jest SUT (System Under Test)"],
      ["", ""],
      ["    // THEN \u2014 zweryfikuj wynik", "Sekcja Then: co oczekujemy (Assert)"],
      ["    assertThat(result.heightMeters).isEqualTo(0.7)", "Google Truth: czytelniejsze ni\u017c assertEquals"],
      ["  }", ""],
      ["", ""],
      ["  @Test", ""],
      ["  fun `hidden abilities are filtered out`() {", ""],
      ["    val dto = fakePokemonDetailDto(", ""],
      ["      abilities = listOf(", ""],
      ["        fakeAbility(\"static\", isHidden = false),", "Widoczna zdolno\u015b\u0107 \u2014 powinna pojawi\u0107 si\u0119 w wyniku"],
      ["        fakeAbility(\"lightning-rod\", isHidden = true)", "Ukryta zdolno\u015b\u0107 \u2014 powinna by\u0107 odfiltrowana"],
      ["      )", ""],
      ["    )", ""],
      ["    val result = dto.toDomainModel()", ""],
      ["    assertThat(result.abilities).containsExactly(\"Static\")", "Tylko 'static' (z wielk\u0105 liter\u0105 po capitalize)"],
      ["  }", ""],
      ["}", ""],
    ]),
    sp(120),

    h2("6.2 Testowanie ViewModelu z MockK i Coroutines"),
    annotatedCode("PokemonListViewModelTest.kt", [
      ["@ExtendWith(", "@ExtendWith \u2014 JUnit 5, nie @RunWith (JUnit 4)"],
      ["  CoroutinesTestExtension::class,  // <- niestandardowe", "Instaluje TestCoroutineDispatcher jako Main dispatcher"],
      ["  MockKExtension::class", "MockK extension automatycznie inicjalizuje @MockK pola"],
      [")", ""],
      ["class PokemonListViewModelTest {", ""],
      ["", ""],
      ["  @MockK", "@MockK tworzy mock repozytorium \u2014 nie prawdziwa implementacja!"],
      ["  private lateinit var repository: PokemonRepository", "lateinit bo MockK inicjalizuje przez refleksj\u0119"],
      ["", ""],
      ["  private lateinit var viewModel: PokemonListViewModel", "SUT \u2014 System Under Test"],
      ["", ""],
      ["  @BeforeEach", "@BeforeEach \u2014 wywo\u0142ywane PRZED ka\u017cdym @Test (JUnit 5, nie @Before!)"],
      ["  fun setUp() {", ""],
      ["    viewModel = PokemonListViewModel(repository)", "Tworzymy VM przez constructor injection \u2014 dlatego DI jest wa\u017cne!"],
      ["  }", ""],
      ["", ""],
      ["  @Test", ""],
      ["  fun `loading state is emitted first`() = runTest {", "runTest \u2014 z kotlinx-coroutines-test. Kontroluje czas coroutine."],
      ["    // GIVEN", ""],
      ["    coEvery { repository.getPokemonList() } returns", "coEvery = mockK dla suspend fun. 'co' = coroutine"],
      ["      flowOf(listOf(fakePokemon()))", "Mo\u017cemy zwr\u00f3ci\u0107 Flow z dan\u0105 warto\u015bci\u0105"],
      ["", ""],
      ["    // WHEN + THEN z Turbine", "Turbine: .test() na Flow zbiera emisje"],
      ["    viewModel.uiState.test {", ""],
      ["      assertThat(awaitItem()).isInstanceOf(", "awaitItem() = poczekaj na nast\u0119pn\u0105 emisj\u0119"],
      ["        UiState.Loading::class.java)", "Pierwszy emitowany stan: Loading"],
      ["      assertThat(awaitItem()).isInstanceOf(", ""],
      ["        UiState.Success::class.java)", "Drugi stan po za\u0142adowaniu: Success"],
      ["      cancelAndIgnoreRemainingEvents()", "Anuluj test Flow \u2014 oczyszczenie"],
      ["    }", ""],
      ["  }", ""],
      ["}", ""],
    ]),
    sp(120),

    h2("6.3 Wzorzec Given-When-Then i testy parametryczne"),
    para("Dobry test sk\u0142ada si\u0119 z trzech sekcji: Given (co mamy), When (co robimy), Then (co oczekujemy). Ten wz\u00f3r \u2014 znany te\u017c jako Arrange-Act-Assert \u2014 sprawia, \u017ce testy s\u0105 samodokumentuj\u0105ce."),
    sp(80),
    annotatedCode("ParameterizedTest dla mappera", [
      ["@ParameterizedTest", "@ParameterizedTest = jeden test, wiele danych wej\u015bciowych"],
      ["@CsvSource(", "@CsvSource: dane w formacie CSV wprost w adnotacji"],
      ["  \"4, 0.4\",   // 4 dm -> 0.4 m", "Ka\u017cda linia to jeden przypadek testowy"],
      ["  \"10, 1.0\",  // 10 dm -> 1.0 m", ""],
      ["  \"0, 0.0\",   // 0 dm -> 0.0 m (kraw\u0119d\u017a)", ""],
      ["  \"999, 99.9\" // du\u017ca warto\u015b\u0107", ""],
      [")", ""],
      ["fun `height conversion from decimeters to meters`(", "Parametry test\u00f3w jako argumenty funkcji"],
      ["  heightDm: Int, expectedM: Double", "JUnit 5 automatycznie wstrzykuje z @CsvSource"],
      [") {", ""],
      ["  val dto = fakePokemonDetailDto(height = heightDm)", ""],
      ["  val result = dto.toDomainModel()", ""],
      ["  assertThat(result.heightMeters).isEqualTo(expectedM)", ""],
      ["}", ""],
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 7 — TESTY INTEGRACYJNE ROOM
  // ═══════════════════════════════════════════════════════════════
  [
    h1("7. Testy integracyjne \u2014 Room InMemory"),
    para("Testy integracyjne sprawdzaj\u0105, czy wiele komponent\u00f3w dzia\u0142a ze sob\u0105 poprawnie. W kontekcie Room testujemy DAO queries z prawdziw\u0105 baz\u0105 danych \u2014 ale bazuj\u0105c\u0105 na pami\u0119ci RAM zamiast dysku."),
    sp(),

    expl("Dlaczego Room InMemory do test\u00f3w?", [
      "Testy na prawdziwej bazie SQLite mia\u0142yby kilka problem\u00f3w:",
      "1. STAN mi\u0119dzy testami \u2014 dane z poprzedniego testu widoczne w nast\u0119pnym. Testy musz\u0105 by\u0107 izolowane.",
      "2. SZYBKO\u015a\u0106 \u2014 operacje dyskowe s\u0105 powolne. Testy powinny by\u0107 szybkie.",
      "3. Sprz\u0105tanie \u2014 po ka\u017cdym te\u015bcie trzeba r\u0119cznie usuwa\u0107 plik bazy.",
      "",
      "Room InMemory Database:",
      "+ Ka\u017cde @BeforeEach tworzy NOW\u0104 baz\u0119 w pami\u0119ci. Zerowy stan pocz\u0105tkowy.",
      "+ @AfterEach zamknie baz\u0119 i pami\u0119\u0107 zwalnia automatycznie.",
      "+ Identyczne zachowanie jak SQLite, ale b\u0142yskawicznie szybka.",
      "+ Nie wymaga emulatora \u2014 mo\u017cna uruchomi\u0107 w src/test/ (JVM) z robolectric.",
    ]),
    sp(120),

    h2("7.1 Test DAO z Room InMemory"),
    annotatedCode("PokemonDaoTest.kt", [
      ["@RunWith(AndroidJUnit4::class)", "AndroidJUnit4 \u2014 uruchamia test z prawdziwym Android runtime (na emulatorze)"],
      ["class PokemonDaoTest {", "Lub u\u017cyj @RunWith(RobolectricTestRunner) dla JVM"],
      ["", ""],
      ["  private lateinit var database: PokemonDatabase", "Baza testowa \u2014 tworzona na nowo przed ka\u017cdym testem"],
      ["  private lateinit var dao: PokemonDao", ""],
      ["", ""],
      ["  @Before", "@Before (JUnit 4) lub @BeforeEach (JUnit 5)"],
      ["  fun setUp() {", ""],
      ["    database = Room.inMemoryDatabaseBuilder(", "KLUCZOWE: inMemoryDatabaseBuilder zamiast databaseBuilder"],
      ["      ApplicationProvider.getApplicationContext(),", "Kontekst aplikacji z test\u00f3w Android"],
      ["      PokemonDatabase::class.java", "Ta sama klasa Database co w produkcji!"],
      ["    ).allowMainThreadQueries()  // Tylko w testach!", "Normalne Room blokuje Main thread. W testach to OK."],
      ["    .build()", ""],
      ["    dao = database.pokemonDao()", "DAO dost\u0119pny po stworzeniu bazy"],
      ["  }", ""],
      ["", ""],
      ["  @After", "@After = sprz\u0105tanie po ka\u017cdym te\u015bcie"],
      ["  fun tearDown() { database.close() }", "Zamknij baz\u0119 \u2014 zwolnij pami\u0119\u0107"],
      ["", ""],
      ["  @Test", ""],
      ["  fun `upsert and retrieve pokemon`() = runTest {", "runTest dla suspend DAO queries"],
      ["    // GIVEN", ""],
      ["    val entity = fakePokemonEntity(id = 25, name = \"pikachu\")", ""],
      ["    // WHEN", ""],
      ["    dao.upsert(entity)", "Zapisz do bazy (w pami\u0119ci)"],
      ["    val result = dao.getPokemonById(25).first()", ".first() pobiera pierwszy element z Flow i ko\u0144czy"],
      ["    // THEN", ""],
      ["    assertThat(result?.name).isEqualTo(\"pikachu\")", ""],
      ["  }", ""],
      ["}", ""],
    ]),
    sp(120),

    h2("7.2 Fake vs Mock \u2014 kt\u00f3rego u\u017cywa\u0107?"),
    twoColTable([
      ["Podej\u015bcie", "Kiedy u\u017cywa\u0107 i dlaczego"],
      ["Mock (MockK / Mockito)", "Gdy chcesz ZWERYFIKOWA\u0107 interakcje (czy by\u0142o wywo\u0142ane? z jakimi argumentami?). Szybki w tworzeniu. Ryzyko: testy sprawdzaj\u0105 implementacj\u0119, nie zachowanie \u2014 b\u0119d\u0105 si\u0119 psu\u0107 przy refaktoryzacji."],
      ["Fake (r\u0119czna implementacja)", "Gdy chcesz przetestowa\u0107 ZACHOWANIE z lekk\u0105 implementacj\u0105. FakeRepository trzyma dane w pami\u0119ci. Testy s\u0105 mniej kruche \u2014 nie zale\u017c\u0105 od kolejno\u015bci wywo\u0142a\u0144. Przyk\u0142ad: FakePokemonRepository z MutableList."],
      ["Room InMemory", "Gdy testujesz DAO i SQL queries. Prawdziwa logika bazodanowa, \u017cerowa konfiguracja. Jedyne sensowne podej\u015bcie dla test\u00f3w bazy danych."],
      ["Spy (MockK spyk)", "Gdy chcesz cz\u0119\u015bciowo mockowa\u0107 prawdziwy obiekt. Rzadko potrzebny \u2014 cz\u0119sto sygnalizuje problem z architektur\u0105."],
    ], 2200, PW - 2200),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 8 — TESTY COMPOSE UI
  // ═══════════════════════════════════════════════════════════════
  [
    h1("8. Testy instrumentowane \u2014 Compose UI Testing"),
    para("Testy instrumentowane uruchamiaj\u0105 si\u0119 na prawdziwym urz\u0105dzeniu lub emulatorze i mog\u0105 testowa\u0107 zachowanie UI. Jetpack Compose dostarcza dedykowan\u0105 bibliotek\u0119 do testowania komponent\u00f3w i ekran\u00f3w."),
    sp(),

    h2("8.1 Semantyka \u2014 jak Compose Testing widzi UI"),
    para("Compose Testing nie operuje na View hierarchii (jak Espresso), lecz na drzewie semantycznym. Ka\u017cdy Composable mo\u017ce ujawnia\u0107 w\u0142a\u015bciwo\u015bci semantyczne: etykiet\u0119, rol\u0119, stan (zaznaczony/niezaznaczony), warto\u015b\u0107."),
    sp(80),

    expl("Drzewo semantyczne \u2014 czego nie widzi test", [
      "Compose Testing dzia\u0142a na DRZEWIE SEMANTYCZNYM, nie wizualnym layoutcie.",
      "Drzewo semantyczne to 'opis dla narz\u0119dzi dost\u0119pno\u015bci' \u2014 TalkBack i testy widz\u0105 to samo.",
      "",
      "Konsekwencje dla test\u00f3w:",
      "+ Szukasz element\u00f3w przez contentDescription, text, role \u2014 nie przez ID widok\u00f3w (jak w XML/Espresso).",
      "+ onNodeWithText(\"Pikachu\") znajdzie dowolny Text composable z tym tekstem.",
      "+ onNodeWithContentDescription(\"sprite\") znajdzie AsyncImage z tym contentDescription.",
      "",
      "WAZNE: Je\u015bli composable nie ma ustawionej semantyki (Modifier.semantics), test go nie znajdzie!",
      "Dlatego contentDescription jest tak wa\u017cny \u2014 nie tylko dla TalkBack, ale i dla test\u00f3w.",
    ]),
    sp(120),

    h2("8.2 Anatomia testu Compose"),
    annotatedCode("PokemonListScreenTest.kt", [
      ["@HiltAndroidTest", "@HiltAndroidTest = Hilt obs\u0142uguje DI w tym te\u015bcie instrumentowanym"],
      ["class PokemonListScreenTest {", ""],
      ["", ""],
      ["  @get:Rule(order = 0)", "Order 0 \u2014 HiltRule MUSI by\u0107 pierwsza (inicjalizuje Hilt przed reguł\u0105 Compose)"],
      ["  val hiltRule = HiltAndroidRule(this)", "HiltAndroidRule inicjalizuje Hilt dla ka\u017cdego testu"],
      ["", ""],
      ["  @get:Rule(order = 1)", "Order 1 \u2014 po inicjalizacji Hilt"],
      ["  val composeTestRule = createAndroidComposeRule<MainActivity>()", "createAndroidComposeRule startuje Activity z Hilt"],
      ["", ""],
      ["  @Before", ""],
      ["  fun setUp() { hiltRule.inject() }", "hiltRule.inject() \u2014 wstrzykuje @Inject pola w klasie testowej"],
      ["", ""],
      ["  @Test", ""],
      ["  fun `pokemon list shows items after loading`() {", ""],
      ["    composeTestRule.apply {", ""],
      ["      // Poczekaj a\u017c Loading zniknie (maks 5 sekund)"],
      ["      waitUntilDoesNotExist(", "waitUntil \u2014 poczekaj na warunek asynchronicznie"],
      ["        hasTestTag(\"loading_indicator\"),", "TestTag \u2014 pewniejsze ni\u017c szukanie po tek\u015bcie"],
      ["        timeoutMillis = 5_000", ""],
      ["      )", ""],
      ["      // Sprawd\u017a, \u017ce lista zawiera co najmniej jeden element", ""],
      ["      onNodeWithTag(\"pokemon_list\")", "Znajd\u017a element po testTag"],
      ["        .assertIsDisplayed()", "Zweryfikuj \u017ce jest widoczny"],
      ["      onAllNodesWithTag(\"pokemon_card\")", "onAllNodes = wiele element\u00f3w"],
      ["        .assertCountAtLeast(1)", "Co najmniej 1 karta Pokemon"],
      ["    }", ""],
      ["  }", ""],
      ["}", ""],
    ]),
    sp(120),

    h2("8.3 Selektory i akcje \u2014 API Compose Testing"),
    twoColTable([
      ["Selector / Akcja", "Opis i przyk\u0142ad"],
      ["onNodeWithText(\"text\")", "Znajd\u017a node z danym tekstem. Domy\u015blnie: substring match. Dodaj substring=false dla dok\u0142adnego."],
      ["onNodeWithContentDescription(\"opis\")", "Znajd\u017a po contentDescription. Niezb\u0119dne dla obraz\u00f3w i ikon."],
      ["onNodeWithTag(\"tag\")", "Znajd\u017a po Modifier.testTag(). Najbardziej stabilny selektor \u2014 nie zmienia si\u0119 przy t\u0142umaczeniach."],
      ["onAllNodesWithTag(\"tag\")", "Zwraca SemanticsNodeInteractionCollection. U\u017cyj [index] lub assertCountAtLeast()."],
      [".performClick()", "Akcja: klikni\u0119cie na element."],
      [".performTextInput(\"text\")", "Akcja: wpisanie tekstu w TextField."],
      [".performScrollTo()", "Akcja: przewini\u0119cie do elementu (w LazyColumn)."],
      [".assertIsDisplayed()", "Asercja: element widoczny na ekranie."],
      [".assertTextEquals(\"text\")", "Asercja: tekst elementu jest dok\u0142adnie 'text'."],
      [".assertIsEnabled() / Disabled()", "Asercja: czy przycisk jest aktywny/nieaktywny."],
    ], 2800, PW - 2800),
    sp(120),

    h2("8.4 TestTag \u2014 klucz do stabilnych test\u00f3w"),
    annotatedCode("Dodawanie testTag\u00f3w w Compose", [
      ["// W komponencie produkcyjnym:", ""],
      ["LazyVerticalGrid(", ""],
      ["  modifier = Modifier.testTag(\"pokemon_list\")", "testTag identyfikuje element dla test\u00f3w"],
      [") {", ""],
      ["  items(pokemons) { pokemon ->", ""],
      ["    PokemonCard(", ""],
      ["      pokemon = pokemon,", ""],
      ["      modifier = Modifier.testTag(\"pokemon_card\")", "Ka\u017cda karta ma ten sam tag \u2014 u\u017cyj onAllNodes"],
      ["    )", ""],
      ["  }", ""],
      ["}", ""],
      ["", ""],
      ["CircularProgressIndicator(", ""],
      ["  modifier = Modifier.testTag(\"loading_indicator\")", "Tag na spinnerze \u2014 czekamy a\u017c zniknie"],
      [")", ""],
    ]),
    sp(120),

    warn("testTag nie powinien trafi\u0107 do release APK w produkcji (opcjonalnie)", [
      "Modifier.testTag() nie zwalnia pami\u0119ci, ale dodaje semantyk\u0119 \u2014 potencjalnie dost\u0119pn\u0105 dla reverse engineeringu.",
      "W produkcie korporacyjnym rozwa\u017c u\u017cyciae semanticsRole lub warunkowego testTag:",
      "",
      "modifier = if (BuildConfig.DEBUG) Modifier.testTag(\"pokemon_list\") else Modifier",
      "",
      "W projektach akademickich i wi\u0119kszo\u015bci komercyjnych jest to akceptowalne wprost w kodzie produkcyjnym.",
      "Google w\u0142asne Sample Apps (Jetpack Compose Samples) u\u017cywa testTag bez warunkowania.",
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 9 — HILT W TESTACH
  // ═══════════════════════════════════════════════════════════════
  [
    ...dayBanner(3, "Hilt w testach, Coroutines i strategia testowania", "Sekcje 9–14 · ~90 minut · Podmienianie zależności w testach, testy koroutyn, strategia projektu i przegląd typowych błędów"),
    h1("9. Hilt w testach \u2014 podmienianie zale\u017cno\u015bci"),
    para("Kluczow\u0105 zalet\u0105 Hilt jest mo\u017cliwo\u015b\u0107 podmieniania prawdziwych implementacji na testowe (fake/stub) bez zmiany kodu produkcyjnego. Hilt oferuje dwa mechanizmy: @TestInstallIn i @UninstallModules."),
    sp(),

    h2("9.1 Podmienianie modu\u0142\u00f3w w testach"),
    annotatedCode("FakeRepositoryModule.kt \u2014 modu\u0142 testowy", [
      ["@TestInstallIn(", "@TestInstallIn zamienia modu\u0142 produkcyjny na testowy"],
      ["  components = [SingletonComponent::class],", "W kt\u00f3rym komponencie? Singleton \u2014 tak jak orygina\u0142"],
      ["  replaces = [RepositoryModule::class]", "Kt\u00f3ry modu\u0142 produkcyjny zast\u0119pujemy?"],
      [")", ""],
      ["@Module", ""],
      ["abstract class FakeRepositoryModule {", ""],
      ["", ""],
      ["  @Binds @Singleton", ""],
      ["  abstract fun bindRepository(", "Zamiast PokemonRepositoryImpl, Hilt wstrzyknie FakeRepository"],
      ["    fake: FakePokemonRepository", "FakePokemonRepository musi mie\u0107 @Inject constructor"],
      ["  ): PokemonRepository", "Interfejs jest ten sam \u2014 ViewModel nie wie o zamianie!"],
      ["}", ""],
      ["", ""],
      ["// FakePokemonRepository.kt:", ""],
      ["class FakePokemonRepository @Inject constructor(", ""],
      ["  // Brak sieci! Lista w pami\u0119ci jako 'baza'"],
      [") : PokemonRepository {", "Implementuje ten sam interfejs"],
      ["  private val pokemons = MutableList<Pokemon>(", ""],
      ["    mutableListOf(fakePokemon(25, \"pikachu\"))", "Predefiniowane dane testowe"],
      ["  )", ""],
      ["  override fun getPokemonList() =", ""],
      ["    flowOf(pokemons.toList())", "Zwraca Flow z danymi testowymi"],
      ["}", ""],
    ]),
    sp(120),

    expl("Jak Hilt scala modu\u0142y w testach?", [
      "W normalnej aplikacji: Hilt \u0142aduje NetworkModule + RepositoryModule \u2014 prawdziwy Retrofit + Room.",
      "",
      "W te\u015bcie z @TestInstallIn:",
      "1. Hilt widzi \u017ce FakeRepositoryModule ma replaces = [RepositoryModule::class].",
      "2. RepositoryModule jest IGNOROWANY \u2014 jego @Provides/@Binds nie s\u0105 rejestrowane.",
      "3. FakeRepositoryModule jest za\u0142adowany zamiast niego.",
      "4. Reszta modu\u0142\u00f3w (NetworkModule) nadal dzia\u0142a \u2014 tylko podmieniony modu\u0142 jest zast\u0105piony.",
      "",
      "@UninstallModules (alternatywa, per-test): Adnotacja na klasie testowej. Pozwala podmieni\u0107 modu\u0142",
      "tylko dla jednego testu. @TestInstallIn = globalnie dla wszystkich test\u00f3w w tym sourceset.",
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 10 — COROUTINES W TESTACH
  // ═══════════════════════════════════════════════════════════════
  [
    h1("10. Testowanie Coroutines \u2014 TestDispatcher i Turbine"),
    para("Coroutines s\u0105 asynchroniczne \u2014 test musi umie\u0107 kontrolowa\u0107 czas ich wykonania. Bez tego testy b\u0119d\u0105 niestabilne (flaky) \u2014 czasem zaliczone, czasem nie, bez zmiany kodu."),
    sp(),

    h2("10.1 Problem z asynchroniczno\u015bci\u0105 w testach"),
    codeBlock([
      "// Bez TestDispatcher \u2014 test B\u0141\u0118DY:",
      "class BrokenViewModelTest {",
      "  @Test",
      "  fun `data loads correctly`() {",
      "    viewModel.loadData()          // Uruchamia coroutine NA PRAWDZIWYM IO dispatcher",
      "    // Coroutine jest ASYNCHRONICZNA \u2014 wynik nie jest jeszcze gotowy!",
      "    assertThat(viewModel.uiState.value)",
      "      .isInstanceOf(UiState.Success::class.java)  // FAIL: nadal Loading",
      "  }",
      "}",
      "",
      "// Rozwi\u0105zanie: StandardTestDispatcher + advanceUntilIdle()",
      "class FixedViewModelTest {",
      "  private val testDispatcher = StandardTestDispatcher()  // Kontrolowany scheduler",
      "",
      "  @BeforeEach fun setUp() {",
      "    Dispatchers.setMain(testDispatcher)  // Podmie\u0144 Main dispatcher na testowy",
      "  }",
      "",
      "  @AfterEach fun tearDown() {",
      "    Dispatchers.resetMain()              // Przywr\u00f3\u0107 po te\u015bcie",
      "  }",
      "",
      "  @Test",
      "  fun `data loads correctly`() = runTest(testDispatcher) {",
      "    viewModel.loadData()           // Coroutine ZAPLANOWANA, ale nie uruchomiona",
      "    advanceUntilIdle()             // Uruchom WSZYSTKIE oczekuj\u0105ce coroutines",
      "    assertThat(viewModel.uiState.value)",
      "      .isInstanceOf(UiState.Success::class.java)  // OK: coroutine zako\u0144czona",
      "  }",
      "}",
    ], "TestDispatcher \u2014 kontrola czasu coroutine"),
    sp(120),

    h2("10.2 Turbine \u2014 testowanie Flow"),
    para("Testowanie Flow bez Turbine wymaga boilerplate kodu: uruchom kolektor w tle, zbieraj do listy, anuluj, por\u00f3wnaj. Turbine upraszcza to do kilku czytelnych wywo\u0142a\u0144."),
    sp(80),
    annotatedCode("Turbine \u2014 asercje na Flow", [
      ["viewModel.uiState.test {", ".test { } \u2014 Turbine blokuje i zbiera emisje Flow"],
      ["  // awaitItem() czeka na nast\u0119pn\u0105 emisj\u0119 (suspend \u2014 poczeka!)", ""],
      ["  val first = awaitItem()", "Pierwsza emisja: oczekujemy Loading"],
      ["  assertThat(first).isInstanceOf(UiState.Loading::class.java)", ""],
      ["", ""],
      ["  val second = awaitItem()", "Druga emisja: po za\u0142adowaniu danych"],
      ["  assertThat(second).isInstanceOf(UiState.Success::class.java)", ""],
      ["  assertThat((second as UiState.Success).data)", "Cast do Success, sprawd\u017a dane"],
      ["    .hasSize(20)", "20 Pokemon\u00f3w na pierwszej stronie"],
      ["", ""],
      ["  // Anuluj \u2014 nie czekamy na kolejne emisje (Flow mo\u017ce by\u0107 niesko\u0144czony)", ""],
      ["  cancelAndIgnoreRemainingEvents()", "Bezpieczne zako\u0144czenie testu Flow"],
      ["}", ""],
      ["", ""],
      ["// Alternatywnie dla b\u0142\u0119d\u00f3w:", ""],
      ["viewModel.uiState.test {", ""],
      ["  awaitItem()  // Loading", ""],
      ["  val errorState = awaitItem()", ""],
      ["  assertThat(errorState).isInstanceOf(UiState.Error::class.java)", ""],
      ["  assertThat((errorState as UiState.Error).message)", ""],
      ["    .contains(\"Brak po\u0142\u0105czenia\")", ""],
      ["  cancelAndIgnoreRemainingEvents()", ""],
      ["}", ""],
    ]),
    sp(120),

    tip("Test Doubles \u2014 s\u0142ownik termin\u00f3w", [
      "Dummy: obiekt przekazany ale niewywo\u0142ywany (wype\u0142niacz parametru).",
      "Stub: zwraca predefiniowane warto\u015bci, nie weryfikuje wywo\u0142a\u0144. Prostszy ni\u017c Mock.",
      "Fake: lekka implementacja (np. in-memory repository). Zachowuje logik\u0119 ale bez zewn\u0119trznych zale\u017cno\u015bci.",
      "Mock: weryfikuje interakcje (czy by\u0142o wywo\u0142ane? ile razy? z jakimi args?). Mo\u017ce te\u017c stubbowa\u0107.",
      "Spy: opakowuje prawdziwy obiekt, pozwala obserwowa\u0107 wywo\u0142ania i cz\u0119\u015bciowo mockowa\u0107.",
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 11 — STRATEGIA TESTOWANIA PROJEKTU
  // ═══════════════════════════════════════════════════════════════
  [
    h1("11. Strategia testowania \u2014 co testowa\u0107 w projekcie"),
    para("Wiedza o technikach to jedno \u2014 wa\u017cniejsza jest odpowied\u017a na pytanie: kt\u00f3re cz\u0119\u015bci kodu WARTO testowa\u0107? Nie wszystko wymaga test\u00f3w. Koncentruj si\u0119 tam, gdzie b\u0142\u0119dy s\u0105 kosztowne lub trudne do zauwa\u017cenia."),
    sp(),

    h2("11.1 Priorytety testowania"),
    twoColTable([
      ["Co testowa\u0107 (wysoki priorytet)", "Co mo\u017cna pomin\u0105\u0107 lub testowa\u0107 r\u0119cznie"],
      ["Mappery (DTO \u2192 Domain) \u2014 przeliczenia jednostek, nullable, capitalize, filtrowanie", "Proste gettery/settery \u2014 brak logiki = brak test\u00f3w"],
      ["ViewModel logika \u2014 kolejno\u015b\u0107 stan\u00f3w (Loading\u2192Success\u2192Error), paginacja, retry", "Activity / Fragment boilerplate \u2014 Hilt\u00f3w@AndroidEntryPoint"],
      ["DAO queries \u2014 upsert, delete, flow emissions, migracje Room", "Compose composable\u00f3w bez logiki \u2014 czyste UI kt\u00f3re tylko wy\u015bwietla dane"],
      ["safeApiCall \u2014 obsługa każdego typu wyjątku (IOException, HttpException, Gson)", "Konfiguracja Hilt modu\u0142\u00f3w \u2014 kompilator sprawdza poprawno\u015b\u0107"],
      ["U\u017cytkowe funkcje biznesowe \u2014 walidacja formularzy, obliczenia, parsowanie dat", "Trzecie party biblioteki \u2014 nie testujesz Retrofit, Coil, Room"],
    ], 4000, PW - 4000),
    sp(120),

    h2("11.2 Sekwencja pisania test\u00f3w TDD"),
    stepTable("Test Driven Development \u2014 Red, Green, Refactor", [
      "RED: Napisz test, kt\u00f3ry FAILUJE. Opisz co chcesz osi\u0105gn\u0105\u0107 (Given-When-Then). Uruchom \u2014 test musi by\u0107 czerwony.",
      "GREEN: Napisz MINIMALNY kod produkcyjny, kt\u00f3ry sprawi, \u017ce test przechodzi. Nie optymalizuj. Nie przewiduj. Napisz dos\u0142ownie minimum.",
      "REFACTOR: Ulepsz kod produkcyjny (i test!) bez zmiany zachowania. Testy s\u0105 siatk\u0105 bezpiecze\u0144stwa \u2014 je\u015bli po refaktoryzacji s\u0105 zielone, refaktoryzacja by\u0142a bezpieczna.",
      "POWTARZAJ: Ka\u017cda nowa funkcjonalno\u015b\u0107 = nowy test = nowy cykl Red-Green-Refactor.",
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 12 — ZADANIA
  // ═══════════════════════════════════════════════════════════════
  [
    h1("12. Zadania do wykonania"),
    para("Zadania podzielone s\u0105 na dwie cz\u0119\u015bci: integracja Hilt do istniej\u0105cych projekt\u00f3w (TaskApp + PokeApp) oraz pisanie test\u00f3w weryfikuj\u0105cych logik\u0119 biznesow\u0105 i interfejs u\u017cytkownika."),
    sp(),

    task("Zadanie 1 (25 pkt) \u2014 Migracja TaskApp do Hilt", [
      "1.1 Dodaj wtyczk\u0119 Hilt i KSP do build.gradle.kts. Dodaj zale\u017cno\u015bci (hilt-android, hilt-compiler, hilt-navigation-compose).",
      "1.2 Stw\u00f3rz klas\u0119 TaskApp z adnotacj\u0105 @HiltAndroidApp i zarejestruj j\u0105 w AndroidManifest.xml.",
      "1.3 Napisz DatabaseModule (@Module, @InstallIn(SingletonComponent::class)) dostarczaj\u0105cy TaskDatabase i TaskDao przez @Provides @Singleton.",
      "1.4 Zmie\u0144 TaskRepository na klas\u0119 z @Inject constructor. Dostosuj TaskViewModel do @HiltViewModel @Inject constructor.",
      "1.5 Dodaj @AndroidEntryPoint do MainActivity. Zast\u0105p viewModel() na hiltViewModel() w TaskListScreen.",
      "WERYFIKACJA: Aplikacja kompiluje si\u0119 i dzia\u0142a identycznie jak przed migracj\u0105. Brak singleton\u00f3w r\u0119cznych.",
    ]),
    sp(120),

    task("Zadanie 2 (20 pkt) \u2014 Testy jednostkowe mappera i safeApiCall", [
      "2.1 Napisz min. 5 test\u00f3w jednostkowych dla PokemonMapper (JUnit 5, bez Androida, bez MockK):",
      "      a) przeliczenie decymetr\u00f3w na metry, b) przeliczenie hektogram\u00f3w na kilogramy,",
      "      c) capitalize nazwy, d) filtrowanie ukrytych zdolno\u015bci, e) fallback dla null baseExperience.",
      "2.2 Napisz testy @ParameterizedTest dla przelicze\u0144 jednostek z co najmniej 4 przypadkami.",
      "2.3 Napisz min. 3 testy dla safeApiCall() u\u017cywaj\u0105c MockK (coEvery):",
      "      a) sukces (Result.Success), b) HttpException \u2192 Result.Error z kodem, c) IOException \u2192 Result.Error.",
      "WERYFIKACJA: ./gradlew test ko\u0144czy si\u0119 bez b\u0142\u0119d\u00f3w. Pokrycie kodu mappera \u2265 80% (sprawdzone w Android Studio).",
    ]),
    sp(120),

    task("Zadanie 3 (30 pkt) \u2014 Testy integracyjne i ViewModelu", [
      "3.1 Napisz min. 3 testy DAO (Room InMemory, AndroidJUnit4 lub Robolectric):",
      "      a) upsert + pobranie, b) usuni\u0119cie + weryfikacja braku, c) Flow emituje aktualizacj\u0119 po upsert.",
      "3.2 Stw\u00f3rz FakePokemonRepository implementuj\u0105cy PokemonRepository (dane w MutableList, Flow z SharedFlow).",
      "3.3 Napisz min. 4 testy PokemonListViewModel (runTest, Turbine, MockK):",
      "      a) kolejno\u015b\u0107 stan\u00f3w Loading\u2192Success, b) b\u0142\u0105d sieci \u2192 UiState.Error z komunikatem,",
      "      c) retry po b\u0142\u0119dzie \u2192 ponowna pr\u00f3ba (verify coVerify), d) paginacja \u2014 loadMore zwraca wi\u0119cej element\u00f3w.",
      "WERYFIKACJA: ./gradlew test ko\u0144czy si\u0119 bez b\u0142\u0119d\u00f3w. Wszystkie 10+ test\u00f3w zielone.",
    ]),
    sp(120),

    task("Zadanie 4 (25 pkt) \u2014 Testy instrumentowane Compose UI", [
      "4.1 Dodaj testTag do kluczowych komponent\u00f3w: pokemon_list, pokemon_card, loading_indicator, error_message, retry_button.",
      "4.2 Skonfiguruj FakeRepositoryModule (@TestInstallIn) podmieniaj\u0105cy PokemonRepository na FakePokemonRepository.",
      "4.3 Napisz min. 3 testy instrumentowane (createAndroidComposeRule, @HiltAndroidTest):",
      "      a) lista wy\u015bwietla karty po za\u0142adowaniu, b) klikni\u0119cie karty otwiera ekran szczeg\u00f3\u0142\u00f3w (nawigacja),",
      "      c) FakeRepository zwracaj\u0105cy b\u0142\u0105d \u2192 widoczny ErrorScreen z przyciskiem 'Spr\u00f3buj ponownie'.",
      "4.4 Uruchom testy na emulatorze: ./gradlew connectedAndroidTest. Wszystkie zielone.",
      "WERYFIKACJA: Demonstracja uruchomienia test\u00f3w na emulatorze prowadz\u0105cemu. Raport HTML z wynikami.",
    ]),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 13 — KRYTERIA OCENIANIA
  // ═══════════════════════════════════════════════════════════════
  [
    h1("13. Kryteria oceniania"),
    sp(),

    h2("13.1 Punktacja zada\u0144"),
    threeColTable([
      ["Zadanie", "Punkty", "Co weryfikuje prowadz\u0105cy"],
      ["Zad. 1: Hilt w TaskApp", "25 pkt", "Kompilacja bez b\u0142\u0119d\u00f3w. Brak r\u0119cznych singleton\u00f3w. @HiltViewModel + hiltViewModel(). DatabaseModule poprawny."],
      ["Zad. 2: Testy mappera + safeApiCall", "20 pkt", "./gradlew test zielony. Min. 5 test\u00f3w JUnit 5. @ParameterizedTest. Testy safeApiCall z MockK (coEvery)."],
      ["Zad. 3: Testy integracyjne + ViewModel", "30 pkt", "Room InMemory DAO test. FakeRepository. Turbine dla Flow. Testy VM z verify/coVerify."],
      ["Zad. 4: Testy Compose UI", "25 pkt", "FakeRepositoryModule @TestInstallIn. Testy instrumentowane na emulatorze. Raport HTML."],
      ["RAZEM", "100 pkt", ""],
    ], 1400, PW / 2 - 700, PW / 2 - 700),
    sp(120),

    h2("13.2 Skala ocen"),
    threeColTable([
      ["Ocena", "Punkty", "Wymagania"],
      ["5.0", "90\u2013100 pkt", "Wszystkie 4 zadania. Min. 15 test\u00f3w. Testy instrumentowane na emulatorze. Pokrycie \u226580%."],
      ["4.5", "80\u201389 pkt", "Zadania 1\u20133 kompletne. Testy instrumentowane \u2014 min. 1 test UI przechodzi na emulatorze."],
      ["4.0", "70\u201379 pkt", "Zadania 1\u20133. Hilt dzia\u0142a. Min. 8 test\u00f3w jednostkowych i integracyjnych."],
      ["3.5", "60\u201369 pkt", "Zadanie 1 kompletne + zadanie 2 (min. 5 test\u00f3w jednostkowych). Brak test\u00f3w VM lub DAO."],
      ["3.0", "50\u201359 pkt", "Hilt skonfigurowany (@HiltAndroidApp, @HiltViewModel). Min. 3 testy jednostkowe mappera."],
      ["2.0", "0\u201349 pkt", "Projekt nie kompiluje si\u0119 z Hilt, lub brak jakichkolwiek test\u00f3w."],
    ], 900, 1200, PW - 2100),
    sp(200),
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEKCJA 14 — NAJCZĘSTSZE BŁĘDY
  // ═══════════════════════════════════════════════════════════════
  [
    h1("14. Najcz\u0119stsze b\u0142\u0119dy i ich rozwi\u0105zania"),
    para("Hilt i testy maj\u0105 swoje specyficzne pu\u0142apki. Poni\u017csza tabela zbiera b\u0142\u0119dy, kt\u00f3re studenci napotykaj\u0105 najcz\u0119\u015bciej. Sprawd\u017a j\u0105 zanim zaczniesz szuka\u0107 w internecie."),
    sp(),

    twoColTable([
      ["Komunikat b\u0142\u0119du / objaw", "Przyczyna i rozwi\u0105zanie"],
      ["[Hilt] ... is not an @AndroidEntryPoint", "Klasa Activity/Fragment/ViewModel nie ma adnotacji. Dodaj @AndroidEntryPoint do MainActivity i @HiltViewModel do ViewModela."],
      ["[Hilt] ... cannot be provided without @Inject or @Provides", "Hilt nie wie jak stworzy\u0107 tej klasy. Dodaj @Inject constructor() do klasy LUB napisz @Provides w Module LUB @Binds dla interfejsu."],
      ["Expected single matching node but found 0", "Compose Testing nie znalaz\u0142 elementu. Sprawd\u017a: testTag pasuje? Element na ekranie? Dodaj Modifier.testTag(). U\u017cyj printToLog() do debug."],
      ["CancellationException w te\u015bcie ViewModela", "Nie u\u017cyto runTest lub brakuje advanceUntilIdle(). Uruchom logik\u0119 VM w runTest { } i wywo\u0142aj advanceUntilIdle() przed asercj\u0105."],
      ["MockKException: no answer found for ...", "Nie skonfigurowa\u0142e\u015b coEvery dla wywo\u0142anej metody. Dodaj coEvery { repo.method() } returns ... PRZED wywo\u0142aniem kodu testowanego."],
      ["Cannot access database on the main thread", "Brakuje allowMainThreadQueries() w Room InMemory dla test\u00f3w. LUB: Nie u\u017cywasz runTest dla suspend queries."],
      ["@TestInstallIn not replacing module", "FakeModule musi by\u0107 w src/androidTest/ (dla test\u00f3w instrumentowanych) LUB src/test/ (dla JVM test\u00f3w). Z\u0142y katalog = modu\u0142 nie jest widoczny."],
      ["Hilt rule must be first in @get:Rule order", "HiltAndroidRule musi mie\u0107 order=0, ComposeTestRule order=1. Hilt inicjalizuje si\u0119 przed innymi regu\u0142ami."],
      ["ViewModel is not initialized (Hilt)", "Brakuje @HiltAndroidApp na klasie Application LUB klasa Application nie jest zarejestrowana w Manifeście android:name=\".MyApp\"."],
    ], 3000, PW - 3000),
    sp(200),
  ],

  // ─── STOPKA DOKUMENTU ─────────────────────────────────────────────────────
  [
    new Table({
      width: { size: PW, type: WidthType.DXA },
      columnWidths: [PW],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: PW, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        shading: { type: ShadingType.CLEAR, fill: COL.headerBg },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Instrukcja Laboratoryjna Nr 5 \u2014 Hilt, Testy Jednostkowe i Instrumentacyjne", font: F, size: 20, bold: true, color: "FFFFFF" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Programowanie Aplikacji Mobilnych | Katedra Informatyki", font: F, size: 18, color: "93C5FD" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 0 }, children: [new TextRun({ text: "Nast\u0119pne \u0107wiczenie: Lab 6 \u2014 WorkManager, Powiadomienia Push i DataStore Preferences", font: F, size: 18, italics: true, color: "6EE7B7" })] }),
        ]
      })] })]
    }),
  ]
);

// ─── DOKUMENT ────────────────────────────────────────────────────────────────

var doc = new Document({
  styles: {
    default: {
      document: { run: { font: F, size: 22, color: "1F2937" } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: F, color: "FFFFFF" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: F, color: COL.headerBg },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: F, color: "374151" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: { config: [] },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: { default: makeHeader() },
    footers: { default: makeFooter() },
    children: content,
  }]
});

Packer.toBuffer(doc).then(function(buf) {
  fs.writeFileSync("/home/claude/Lab5_PAM_Instrukcja.docx", buf);
  console.log("DONE \u2014 plik zapisany: /home/claude/Lab5_PAM_Instrukcja.docx");
}).catch(function(err) {
  console.error("B\u0141\u0104D:", err);
  process.exit(1);
});
