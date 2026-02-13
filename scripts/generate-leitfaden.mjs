import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType,
  Footer, Header, PageBreak, LevelFormat, convertMillimetersToTwip,
  ImageRun, VerticalAlign, TableLayoutType,
} from "docx";
import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// ── BBW Design tokens ──
const BLACK = "000000";
const GRAY = "696969";
const GRAY_LIGHT = "F5F5F5";
const WHITE = "FFFFFF";

// BBW Akzentfarben
const GREEN = "009645";
const GREEN_LIGHT = "E6F5EC";
const GREEN_LIGHTER = "F0FAF4";
const TEAL = "008B6B";
const TEAL_LIGHT = "E0F2EE";
const BLUE = "0069A9";
const BLUE_LIGHT = "E0EFF8";
const PURPLE = "964B8E";
const PURPLE_LIGHT = "F0E4EE";
const ORANGE = "E87C28";
const ORANGE_LIGHT = "FEF0E0";
const LIME = "84BF41";
const LIME_LIGHT = "F0F7E6";
const RED = "C9375A";
const RED_LIGHT = "FCE8ED";
const AMBER_BG = "FEF3C7";
const AMBER_TEXT = "92400E";

const FONT = "Arial";
const FONT_BOLD = "Arial Black";

// ── Lion logo ──
let lionImageData;
try {
  lionImageData = readFileSync(resolve(projectRoot, "public", "images", "bbw-lion.png"));
} catch (e) {
  console.warn("Lion logo not found at public/images/bbw-lion.png – generating without logo.");
  lionImageData = null;
}

// ── Helpers ──
const mm = (v) => convertMillimetersToTwip(v);

const NOBORDERS = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const hdr = (text, level = HeadingLevel.HEADING_1) => new Paragraph({
  heading: level,
  spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
  children: [new TextRun({ text, font: FONT_BOLD, size: level === HeadingLevel.HEADING_1 ? 24 : 21, bold: true, color: BLACK })],
});

const body = (text) => new Paragraph({
  spacing: { after: 100, line: 276 },
  children: [new TextRun({ text, font: FONT, size: 20, color: BLACK })],
});

const bodyBold = (b, n) => new Paragraph({
  spacing: { after: 100, line: 276 },
  children: [
    new TextRun({ text: b, font: FONT, size: 20, color: BLACK, bold: true }),
    new TextRun({ text: n, font: FONT, size: 20, color: BLACK }),
  ],
});

const gap = () => new Paragraph({ spacing: { after: 80 }, children: [] });

// ── Colored table-like row (2 columns: label | description) ──
const coloredRow = (label, desc, bgColor, accentColor = null) => {
  const cells = [];
  // Optional accent stripe
  if (accentColor) {
    cells.push(new TableCell({
      width: { size: 80, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: accentColor },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
      borders: NOBORDERS,
    }));
  }
  cells.push(new TableCell({
    width: { size: accentColor ? 28 : 30, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: bgColor },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 60, after: 60 },
      indent: { left: 80 },
      children: [new TextRun({ text: label, font: FONT, size: 19, bold: true, color: BLACK })],
    })],
    borders: NOBORDERS,
  }));
  cells.push(new TableCell({
    shading: { type: ShadingType.SOLID, color: bgColor },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 60, after: 60 },
      indent: { left: 80 },
      children: [new TextRun({ text: desc, font: FONT, size: 19, color: BLACK })],
    })],
    borders: NOBORDERS,
  }));
  return new TableRow({ children: cells });
};

// ── Section header row (full width, colored) ──
const sectionHeaderRow = (text, bgColor, cols = 3) => {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: cols,
        shading: { type: ShadingType.SOLID, color: bgColor },
        children: [new Paragraph({
          spacing: { before: 80, after: 80 },
          indent: { left: 80 },
          children: [new TextRun({ text, font: FONT_BOLD, size: 20, bold: true, color: WHITE })],
        })],
        borders: NOBORDERS,
      }),
    ],
  });
};

// ── Tool-Tabelle: eine Kategorie mit farbcodierten Zeilen ──
const toolCategory = (categoryTitle, accentColor, bgLight, tools) => {
  const rows = [
    sectionHeaderRow(categoryTitle, accentColor, 3),
    ...tools.map((t, i) => {
      const bg = i % 2 === 0 ? bgLight : WHITE;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 80, type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, color: accentColor },
            children: [new Paragraph("")],
            borders: NOBORDERS,
          }),
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: bg },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              spacing: { before: 50, after: 50 },
              indent: { left: 80 },
              children: [new TextRun({ text: t.name, font: FONT, size: 19, bold: true, color: BLACK })],
            })],
            borders: NOBORDERS,
          }),
          new TableCell({
            shading: { type: ShadingType.SOLID, color: bg },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              spacing: { before: 50, after: 50 },
              indent: { left: 80 },
              children: [new TextRun({ text: t.desc, font: FONT, size: 19, color: BLACK })],
            })],
            borders: NOBORDERS,
          }),
        ],
      });
    }),
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
};

// ── Info-box (green left border) ──
const infoBox = (title, text) => new Table({
  rows: [new TableRow({ children: [
    new TableCell({
      width: { size: 80, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: GREEN },
      children: [new Paragraph("")],
      borders: NOBORDERS,
    }),
    new TableCell({
      shading: { type: ShadingType.SOLID, color: GREEN_LIGHT },
      children: [
        new Paragraph({ spacing: { before: 60, after: 20 }, indent: { left: 100 },
          children: [new TextRun({ text: title, bold: true, size: 19, font: FONT, color: GREEN })] }),
        new Paragraph({ spacing: { after: 60 }, indent: { left: 100 },
          children: [new TextRun({ text, size: 19, font: FONT, color: BLACK })] }),
      ],
      borders: NOBORDERS,
    }),
  ] })],
  width: { size: 100, type: WidthType.PERCENTAGE },
});

// ── Warning box (amber) ──
const warnBox = (title, text) => new Table({
  rows: [new TableRow({ children: [
    new TableCell({
      width: { size: 80, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: "D97706" },
      children: [new Paragraph("")],
      borders: NOBORDERS,
    }),
    new TableCell({
      shading: { type: ShadingType.SOLID, color: AMBER_BG },
      children: [
        new Paragraph({ spacing: { before: 60, after: 20 }, indent: { left: 100 },
          children: [new TextRun({ text: title, bold: true, size: 19, font: FONT, color: AMBER_TEXT })] }),
        new Paragraph({ spacing: { after: 60 }, indent: { left: 100 },
          children: [new TextRun({ text, size: 19, font: FONT, color: BLACK })] }),
      ],
      borders: NOBORDERS,
    }),
  ] })],
  width: { size: 100, type: WidthType.PERCENTAGE },
});

// ── Process step table (farbcodierte Prozessschritte) ──
const processTable = (scenarioTitle, accentColor, bgLight, steps) => {
  const rows = [
    // Header
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          shading: { type: ShadingType.SOLID, color: accentColor },
          children: [new Paragraph({
            spacing: { before: 80, after: 80 },
            indent: { left: 100 },
            children: [new TextRun({ text: scenarioTitle, font: FONT_BOLD, size: 20, bold: true, color: WHITE })],
          })],
          borders: NOBORDERS,
        }),
      ],
    }),
    // Column headers
    new TableRow({
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: accentColor },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: "#", font: FONT, size: 18, bold: true, color: WHITE })],
          })],
          borders: NOBORDERS,
        }),
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: accentColor },
          children: [new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: 80 },
            children: [new TextRun({ text: "Schritt / Akteur", font: FONT, size: 18, bold: true, color: WHITE })],
          })],
          borders: NOBORDERS,
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: accentColor },
          children: [new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: 80 },
            children: [new TextRun({ text: "Beschreibung", font: FONT, size: 18, bold: true, color: WHITE })],
          })],
          borders: NOBORDERS,
        }),
      ],
    }),
    // Data rows
    ...steps.map((s, i) => {
      const bg = i % 2 === 0 ? bgLight : WHITE;
      return new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: bg },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 50, after: 50 },
              children: [new TextRun({ text: `${i + 1}`, font: FONT_BOLD, size: 20, bold: true, color: accentColor })],
            })],
            borders: NOBORDERS,
          }),
          new TableCell({
            shading: { type: ShadingType.SOLID, color: bg },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 50, after: 10 },
                indent: { left: 80 },
                children: [new TextRun({ text: s.title, font: FONT, size: 19, bold: true, color: BLACK })],
              }),
              new Paragraph({
                spacing: { after: 50 },
                indent: { left: 80 },
                children: [new TextRun({ text: s.actor, font: FONT, size: 17, color: accentColor, italics: true })],
              }),
            ],
            borders: NOBORDERS,
          }),
          new TableCell({
            shading: { type: ShadingType.SOLID, color: bg },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              spacing: { before: 50, after: 50 },
              indent: { left: 80 },
              children: [new TextRun({ text: s.description, font: FONT, size: 18, color: BLACK })],
            })],
            borders: NOBORDERS,
          }),
        ],
      });
    }),
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
};

// ── Schnellübersicht table ──
const quickOverviewTable = () => {
  const headers = ["Anliegen", "Anlaufstelle", "Bemerkung"];
  const data = [
    ["Kantonslizenz / M365", "Kein Antrag nötig", "Automatisch via Schulkonto"],
    ["Adobe Creative Cloud", "Kein Antrag nötig", "BBW-Login, Organisationszugang wählen"],
    ["Medienarchive", "Kein Antrag nötig", "Via digithek.ch mit Schulzugang"],
    ["Begrenzte Lizenz", "PIKT-Leitung", "Zuteilung nach Verfügbarkeit"],
    ["Einzellizenz", "PIKT-Team", "PIKT erstellt Inhalte / kurzer Zugang"],
    ["Umfrage mit Findmind", "PIKT-Team", "Zugang für einzelne Umfragen"],
    ["ChatGPT ausprobieren", "Lernlounge", "Ausleihbares Notebook"],
    ["Neues Tool gewünscht", "PIKT-Team", "Weiterleitung ans Kernteam"],
    ["Kostenlose Edu-Tools", "Selbstregistrierung", "Website oder PIKT fragen"],
  ];

  return new Table({
    rows: [
      // Header
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          width: { size: i === 0 ? 30 : (i === 1 ? 25 : 45), type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: GREEN },
          children: [new Paragraph({
            spacing: { before: 50, after: 50 },
            indent: { left: 80 },
            children: [new TextRun({ text: h, font: FONT, size: 19, bold: true, color: WHITE })],
          })],
          borders: NOBORDERS,
        })),
      }),
      // Data
      ...data.map((row, i) => {
        const bg = i % 2 === 0 ? GREEN_LIGHT : WHITE;
        return new TableRow({
          children: row.map((cell) => new TableCell({
            shading: { type: ShadingType.SOLID, color: bg },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              spacing: { before: 40, after: 40 },
              indent: { left: 80 },
              children: [new TextRun({ text: cell, font: FONT, size: 18, color: BLACK })],
            })],
            borders: NOBORDERS,
          })),
        });
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
};

// ── Header with Lion logo ──
const createHeader = () => {
  const headerChildren = [];

  if (lionImageData) {
    headerChildren.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [
        new ImageRun({
          data: lionImageData,
          transformation: { width: 90, height: 90 },
          type: "png",
        }),
      ],
    }));
  }
  headerChildren.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 0 },
    children: [new TextRun({ text: "BBW Berufsbildungsschule Winterthur", size: 16, font: FONT, color: GRAY, italics: true })],
  }));

  return new Header({ children: headerChildren });
};

// ── PROCESS DATA (from procurement.ts) ──
const processFlows = [
  {
    title: "Szenario A: Start bei Lehrperson",
    color: BLUE,
    bgLight: BLUE_LIGHT,
    steps: [
      { title: "Lizenz-Navigator prüfen", description: "Prüfen Sie im Lizenz-Navigator, ob das gewünschte Tool bereits vorhanden ist.", actor: "Lehrperson" },
      { title: "PIKT-Team kontaktieren", description: "Bei bestehenden Einzellizenzen fragen Sie nach Zugriff. Bei neuen Tools fragen Sie nach einer Anschaffung.", actor: "Lehrperson" },
      { title: "Weiterleitung ans Kernteam", description: "Das PIKT-Team-Mitglied leitet die Anfrage ans Kernteam weiter und traktandiert sie.", actor: "PIKT-Team" },
      { title: "Kernteam-Entscheidung", description: "Das Kernteam entscheidet über weitere Abklärungen. Falls nicht nötig, wird die Steuergruppe informiert.", actor: "Kernteam" },
      { title: "Prüfung bestehender Lizenzen", description: "Ein Kernteam-Mitglied klärt ab, ob bestehende Lizenzen die Funktionen abdecken.", actor: "Kernteam" },
      { title: "Kantonale Abklärung", description: "Das PIKT-Team klärt ab: Stellt der Kanton ein Tool zur Verfügung? Datenschutz/Urheberrecht?", actor: "PIKT-Team" },
      { title: "Informationssicherheit", description: "Die PIKT-Leitung analysiert, ob die Sicherheitsabklärung durch die BBW durchführbar ist.", actor: "PIKT-Leitung" },
      { title: "Entscheidung Steuergruppe", description: "Die Anschaffung wird in der Steuergruppe besprochen und entschieden.", actor: "Steuergruppe" },
    ],
  },
  {
    title: "Szenario B: Start bei PIKT-Team",
    color: ORANGE,
    bgLight: ORANGE_LIGHT,
    steps: [
      { title: "Handlungsbedarf erkennen", description: "Ein PIKT-Mitglied erkennt Handlungsbedarf und trägt das Anliegen ins Kernteam.", actor: "PIKT-Team" },
      { title: "Kernteam-Entscheidung", description: "Das Kernteam entscheidet über weitere Abklärungen.", actor: "Kernteam" },
      { title: "Prüfung bestehender Lizenzen", description: "Können bestehende Lizenzen die Funktionen abdecken?", actor: "Kernteam" },
      { title: "Kantonale Abklärung", description: "Stellt der Kanton ein entsprechendes Tool zur Verfügung?", actor: "PIKT-Team" },
      { title: "Informationssicherheit", description: "Ist die Sicherheitsabklärung durch die BBW durchführbar?", actor: "PIKT-Leitung" },
      { title: "Entscheidung Steuergruppe", description: "Die Steuergruppe entscheidet über die Anschaffung.", actor: "Steuergruppe" },
    ],
  },
  {
    title: "Szenario C: Start bei Steuergruppe",
    color: PURPLE,
    bgLight: PURPLE_LIGHT,
    steps: [
      { title: "Handlungsbedarf erkennen", description: "Die Steuergruppe sieht Handlungsbedarf und klärt weitere Schritte ab.", actor: "Steuergruppe" },
      { title: "Entscheid zur Anschaffung", description: "Die Steuergruppe informiert das Kernteam über eine mögliche Anschaffung.", actor: "Steuergruppe" },
      { title: "Review durch Kernteam", description: "Das Kernteam gibt eine Review-Meldung zuhanden der Steuergruppe ab.", actor: "Kernteam" },
      { title: "Besprechung & Entscheidung", description: "Das Review wird besprochen. Die Steuergruppe entscheidet.", actor: "Steuergruppe" },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// ██  DOCUMENT  ██
// ══════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [{
      reference: "bbw-bullets",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "\u2013",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: mm(6), hanging: mm(3) } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: FONT, size: 20, color: BLACK } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: mm(25), bottom: mm(27), left: mm(23), right: mm(22.5) },
        size: { width: mm(210), height: mm(297) },
      },
    },
    headers: { default: createHeader() },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Leitfaden Lerntechnologie-Lizenzen | PIKT BBW", size: 16, font: FONT, color: GRAY })],
        })],
      }),
    },
    children: [
      // ═══════ TITELSEITE ═══════
      gap(), gap(),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "BBW Berufsbildungsschule Winterthur", font: FONT, size: 20, color: GRAY })],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: "Leitfaden", font: FONT_BOLD, size: 48, bold: true, color: LIME })],
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: "Lerntechnologie-Lizenzen", font: FONT_BOLD, size: 36, bold: true, color: BLACK })],
      }),
      new Paragraph({
        spacing: { after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } },
        children: [new TextRun({ text: "Abklärung, Zugang & Anschaffung", font: FONT, size: 22, color: GRAY })],
      }),
      gap(),
      body("Dieser Leitfaden beschreibt, wie Lehrpersonen der BBW den Zugang zu bestehenden Lizenzen von Lerntechnologien erhalten und wie die Abklärung und Anschaffung neuer Tools geregelt ist."),
      gap(),
      bodyBold("PIKT – ", "Pädagogischer ICT-Support"),
      bodyBold("Stand: ", "Februar 2026"),
      gap(), gap(),
      infoBox("Lizenz-Navigator", "Alle verfügbaren Tools und Lizenzen sind online im Lizenz-Navigator BBW aufgeführt: bbw-lizenz-navigator.vercel.app"),

      // ═══════ 1. ZUGANG ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("1  Zugang zu bestehenden Lizenzen"),
      body("Je nach Lizenztyp unterscheidet sich der Zugang. Die folgenden Übersichten zeigen nach Farbkategorien gegliedert, wie Sie Zugang erhalten."),
      gap(),

      // 1.1 Kantonslizenzen (Teal)
      toolCategory("Kantonslizenzen – automatisch via Schulkonto", TEAL, TEAL_LIGHT, [
        { name: "fobizz", desc: "KI-Assistenz, Mediengestaltung, kollaborative Oberflächen" },
        { name: "to-teach.ai", desc: "KI-gestützte Unterrichtsmaterialgenerierung" },
        { name: "fellofish", desc: "Gamifizierte Lernumgebungen" },
        { name: "brain.study", desc: "Adaptives Lerntraining" },
      ]),
      gap(),

      // 1.2 Microsoft 365 (Blue)
      toolCategory("Microsoft 365 – Kanton + BBW, via Schulkonto", BLUE, BLUE_LIGHT, [
        { name: "Forms", desc: "Umfragen, Quizze und Abstimmungen" },
        { name: "Clipchamp", desc: "Videobearbeitung im Browser" },
        { name: "Copilot-Chat", desc: "KI-Assistent (Microsoft)" },
        { name: "Word / PowerPoint / Excel", desc: "Office-Standardanwendungen" },
        { name: "OneNote", desc: "Digitales Notizbuch" },
        { name: "Teams", desc: "Kommunikation und Zusammenarbeit" },
      ]),
      gap(),

      // 1.3 BBW-Schullizenzen (Green)
      toolCategory("BBW-Schullizenzen", GREEN, GREEN_LIGHT, [
        { name: "OpenOlat", desc: "Lernmanagementsystem – Login via Schulkonto" },
        { name: "Adobe Creative Cloud", desc: "Für alle LP zugänglich – BBW-Login, Organisationszugang wählen" },
      ]),
      gap(),

      // 1.4 Medienarchive (Purple)
      toolCategory("Medienarchive – via digithek.ch für alle zugänglich", PURPLE, PURPLE_LIGHT, [
        { name: "Statista", desc: "Statistiken und Infografiken" },
        { name: "swissdox", desc: "Schweizer Medienarchiv mit Volltextsuche" },
        { name: "E-Thek", desc: "Digitale Bibliothek (E-Books, Zeitschriften, Audio)" },
      ]),
      gap(),
      infoBox("Zugang Medienarchive", "www.digithek.ch → Schulzugang wählen. Anleitungen sind im Lizenz-Navigator hinterlegt."),
      gap(),

      // 1.5 Begrenzte Lizenzen (Orange)
      toolCategory("Begrenzte Schullizenzen – Anfrage an PIKT-Leitung", ORANGE, ORANGE_LIGHT, [
        { name: "Quizlet", desc: "24 Lizenzen – Karteikarten, Gruppenspiele" },
        { name: "Actionbound", desc: "38 Lizenzen – Interaktive Rallyes und Schnitzeljagden" },
      ]),
      gap(),

      // 1.6 Einzellizenzen (Red)
      toolCategory("Einzellizenzen – PIKT-Team, nicht teilbar", RED, RED_LIGHT, [
        { name: "Synthesia.io", desc: "KI-Videogenerator" },
        { name: "Mentimeter", desc: "Live-Umfragen, interaktive Präsentationen" },
        { name: "Padlet", desc: "Kollaborative digitale Pinnwände" },
        { name: "Findmind", desc: "Online-Umfragetool (Ausnahme: Zugang für einzelne Umfragen möglich)" },
        { name: "ChatGPT-Konto", desc: "Über ausleihbares Notebook (Lernlounge), auch für Gruppenarbeiten" },
      ]),
      gap(),
      warnBox(
        "Hinweis Einzellizenzen",
        "Diese Lizenzen können nicht geteilt werden. In der Regel erstellt das PIKT-Team gewünschte Inhalte oder gewährt ausnahmsweise für kurze Zeit Zugang. Ausnahme: Bei Findmind kann ein Zugang für einzelne Umfragen freigeschaltet werden."
      ),
      gap(),

      // 1.7 Kostenlose Edu-Tools (Lime)
      toolCategory("Kostenlose Edu-Tools – Selbstregistrierung", LIME, LIME_LIGHT, [
        { name: "learningapps.org", desc: "Interaktive Übungen erstellen (learningapps.org)" },
        { name: "lumi education", desc: "H5P-Lernbausteine (lumi.education)" },
        { name: "simpleshow", desc: "KI-Erklärvideos (simpleshow.com)" },
        { name: "Canva", desc: "Design (Edu, Zuweisung über BBW-Organisation)" },
      ]),

      // ═══════ 2. ABKLÄRUNG & ANSCHAFFUNG ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("2  Abklärung & Anschaffung neuer Lerntechnologien"),
      body("Wenn Sie eine Lerntechnologie benötigen, die nicht im Lizenz-Navigator aufgeführt ist, oder Zugang zu einer bestehenden Einzellizenz wünschen, gibt es drei Szenarien. Jedes Szenario ist als farbcodierter Prozess dargestellt."),
      gap(),

      // Szenario A (Blue)
      processTable(processFlows[0].title, processFlows[0].color, processFlows[0].bgLight, processFlows[0].steps),
      gap(), gap(),

      // Szenario B (Orange)
      processTable(processFlows[1].title, processFlows[1].color, processFlows[1].bgLight, processFlows[1].steps),
      gap(), gap(),

      // Szenario C (Purple)
      processTable(processFlows[2].title, processFlows[2].color, processFlows[2].bgLight, processFlows[2].steps),

      // ═══════ 3. SCHNELLÜBERSICHT ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("3  Schnellübersicht: Wer ist zuständig?"),
      body("Die folgende Tabelle zeigt auf einen Blick, an wen Sie sich bei welchem Anliegen wenden."),
      gap(),
      quickOverviewTable(),

      // ═══════ 4. KONTAKT ═══════
      gap(), gap(),
      hdr("4  Kontakt & Ressourcen"),

      new Table({
        rows: [
          new TableRow({ children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: GREEN },
              children: [new Paragraph({ spacing: { before: 50, after: 50 }, indent: { left: 80 },
                children: [new TextRun({ text: "Ressource", font: FONT, size: 19, bold: true, color: WHITE })] })],
              borders: NOBORDERS,
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: GREEN },
              children: [new Paragraph({ spacing: { before: 50, after: 50 }, indent: { left: 80 },
                children: [new TextRun({ text: "Details", font: FONT, size: 19, bold: true, color: WHITE })] })],
              borders: NOBORDERS,
            }),
          ] }),
          ...[
            ["Lizenz-Navigator", "bbw-lizenz-navigator.vercel.app"],
            ["Digithek", "www.digithek.ch"],
            ["PIKT-Team", "Kontaktieren Sie ein Mitglied des PIKT-Teams"],
            ["PIKT-Leitung", "Für begrenzte Lizenzen und Anschaffungsanträge"],
          ].map((row, i) => new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? GREEN_LIGHT : WHITE },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ spacing: { before: 40, after: 40 }, indent: { left: 80 },
                  children: [new TextRun({ text: row[0], font: FONT, size: 19, bold: true, color: BLACK })] })],
                borders: NOBORDERS,
              }),
              new TableCell({
                shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? GREEN_LIGHT : WHITE },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ spacing: { before: 40, after: 40 }, indent: { left: 80 },
                  children: [new TextRun({ text: row[1], font: FONT, size: 19, color: BLACK })] })],
                borders: NOBORDERS,
              }),
            ],
          })),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
      }),

      gap(), gap(),
      new Paragraph({
        spacing: { before: 200 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREEN } },
        children: [new TextRun({ text: "Bei Fragen wenden Sie sich an das PIKT-Team der BBW.", font: FONT, size: 20, color: GREEN, bold: true })],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
const outputPath = process.argv[2] || "Leitfaden_Lerntechnologie_Lizenzen_BBW.docx";
writeFileSync(outputPath, buffer);
console.log(`Erstellt: ${outputPath}`);
