import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType,
  Footer, Header, PageBreak, convertMillimetersToTwip,
  ImageRun, VerticalAlign, TableLayoutType, PageOrientation,
} from "docx";
import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── BBW Design tokens ──
const BLACK = "000000";
const GRAY = "696969";
const GRAY_LIGHT = "F5F5F5";
const WHITE = "FFFFFF";

// BBW Akzentfarben
const GREEN = "009645";
const GREEN_LIGHT = "E6F5EC";
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
  lionImageData = readFileSync(resolve(__dirname, "..", "public", "images", "bbw-lion.png"));
} catch (e) {
  try {
    lionImageData = readFileSync(resolve(__dirname, "bbw-lion.png"));
  } catch (e2) {
    console.warn("Lion logo not found – generating without logo.");
    lionImageData = null;
  }
}

const mm = (v) => convertMillimetersToTwip(v);

const NOBORDERS = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const THIN_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
};

// ── Helpers ──
const hdr = (text, level = HeadingLevel.HEADING_1) => new Paragraph({
  heading: level,
  spacing: { before: level === HeadingLevel.HEADING_1 ? 300 : 200, after: 100 },
  children: [new TextRun({ text, font: FONT_BOLD, size: level === HeadingLevel.HEADING_1 ? 22 : 19, bold: true, color: BLACK })],
});

const body = (text, opts = {}) => new Paragraph({
  spacing: { after: 80, line: 264 },
  ...opts,
  children: [new TextRun({ text, font: FONT, size: 18, color: BLACK })],
});

const bodyRuns = (runs, opts = {}) => new Paragraph({
  spacing: { after: 80, line: 264 },
  ...opts,
  children: runs.map(r => new TextRun({ font: FONT, size: 18, color: BLACK, ...r })),
});

const gap = () => new Paragraph({ spacing: { after: 60 }, children: [] });

// ── Table builder ──
const makeTable = (headerRow, dataRows, accentColor, colWidths = null) => {
  const headerCells = headerRow.map((h, i) => new TableCell({
    width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.SOLID, color: accentColor },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 50, after: 50 },
      indent: { left: 60 },
      children: [new TextRun({ text: h, font: FONT, size: 16, bold: true, color: WHITE })],
    })],
    borders: THIN_BORDER,
  }));

  const rows = [new TableRow({ children: headerCells })];

  for (let r = 0; r < dataRows.length; r++) {
    const bgColor = r % 2 === 0 ? WHITE : GRAY_LIGHT;
    const cells = dataRows[r].map((cellContent, i) => {
      const isArray = Array.isArray(cellContent);
      const children = isArray
        ? cellContent.map(item => new Paragraph({
            spacing: { before: 10, after: 10 },
            indent: { left: 60 },
            children: [new TextRun({ text: item, font: FONT, size: 15, color: BLACK })],
          }))
        : [new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: 60 },
            children: typeof cellContent === 'object' && cellContent.runs
              ? cellContent.runs.map(run => new TextRun({ font: FONT, size: 15, color: BLACK, ...run }))
              : [new TextRun({ text: String(cellContent), font: FONT, size: 15, color: BLACK })],
          })];

      return new TableCell({
        width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
        shading: { type: ShadingType.SOLID, color: bgColor },
        verticalAlign: VerticalAlign.TOP,
        children,
        borders: THIN_BORDER,
      });
    });
    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
};

// ── Role matrix table with checkmarks ──
const roleMatrix = (title, accentColor, bgLight, systems, roles, matrix) => {
  // Title row
  const headerRow = ["System / Anwendung", ...roles];
  const colWidths = [24, ...roles.map(() => Math.floor(76 / roles.length))];

  const headerCells = headerRow.map((h, i) => new TableCell({
    width: { size: colWidths[i], type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: accentColor },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 40, after: 40 },
      alignment: i > 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
      indent: i === 0 ? { left: 60 } : undefined,
      children: [new TextRun({ text: h, font: FONT, size: 14, bold: true, color: WHITE })],
    })],
    borders: THIN_BORDER,
  }));

  const rows = [
    // Section title
    new TableRow({
      children: [new TableCell({
        columnSpan: headerRow.length,
        shading: { type: ShadingType.SOLID, color: accentColor },
        children: [new Paragraph({
          spacing: { before: 50, after: 50 },
          indent: { left: 60 },
          children: [new TextRun({ text: title, font: FONT_BOLD, size: 17, bold: true, color: WHITE })],
        })],
        borders: THIN_BORDER,
      })],
    }),
    new TableRow({ children: headerCells }),
  ];

  for (let r = 0; r < systems.length; r++) {
    const bg = r % 2 === 0 ? bgLight : WHITE;
    const cells = [
      new TableCell({
        width: { size: colWidths[0], type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: bg },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          spacing: { before: 30, after: 30 },
          indent: { left: 60 },
          children: [new TextRun({ text: systems[r], font: FONT, size: 14, bold: true, color: BLACK })],
        })],
        borders: THIN_BORDER,
      }),
      ...matrix[r].map((val, i) => new TableCell({
        width: { size: colWidths[i + 1], type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: val === "Admin" ? accentColor : (val ? bg : bg) },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 30, after: 30 },
          children: [new TextRun({
            text: val || "–",
            font: FONT,
            size: 13,
            bold: val === "Admin",
            color: val === "Admin" ? WHITE : (val === "–" || !val ? "BBBBBB" : BLACK),
          })],
        })],
        borders: THIN_BORDER,
      })),
    ];
    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
};

// ── Info box ──
const infoBox = (title, text, color = GREEN) => new Table({
  rows: [new TableRow({ children: [
    new TableCell({
      width: { size: 60, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color },
      children: [new Paragraph("")],
      borders: NOBORDERS,
    }),
    new TableCell({
      shading: { type: ShadingType.SOLID, color: color === GREEN ? GREEN_LIGHT : (color === ORANGE ? ORANGE_LIGHT : BLUE_LIGHT) },
      children: [
        new Paragraph({ spacing: { before: 50, after: 15 }, indent: { left: 80 },
          children: [new TextRun({ text: title, bold: true, size: 16, font: FONT, color })] }),
        new Paragraph({ spacing: { after: 50 }, indent: { left: 80 },
          children: [new TextRun({ text, size: 16, font: FONT, color: BLACK })] }),
      ],
      borders: NOBORDERS,
    }),
  ] })],
  width: { size: 100, type: WidthType.PERCENTAGE },
});

// ── Header ──
const createHeader = () => {
  const children = [];
  if (lionImageData) {
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [new ImageRun({ data: lionImageData, transformation: { width: 70, height: 70 }, type: "png" })],
    }));
  }
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 0 },
    children: [new TextRun({ text: "BBW Berufsbildungsschule Winterthur", size: 15, font: FONT, color: GRAY, italics: true })],
  }));
  return new Header({ children });
};

// ══════════════════════════════════════════════════════════════
// ██  DOCUMENT CONTENT  ██
// ══════════════════════════════════════════════════════════════

// ── BBW-spezifische Rollen ──
const bbwRoles = [
  "Lernende",
  "Lehrperson (LP)",
  "Lernlounge",
  "PIKT-Team",
  "PIKT-Leitung",
  "TIKT-Team",
  "TIKT-Leitung",
];

// ── 1) OpenOlat Matrix ──
const ooSystems = [
  "Kursbereich (Lernorganisation)",
  "Intranet-Bereich (News, Infos)",
  "Autorentool (Kurse erstellen)",
  "Benutzerverwaltung",
  "Katalogverwaltung",
  "Curriculumverwaltung",
  "Systemkonfiguration",
  "Modulverwaltung & Caches",
];
const ooMatrix = [
  // Lernende,     LP,           Lernlounge,  PIKT-Team,    PIKT-Leit,    TIKT-Team,    TIKT-Leit
  ["Lesen",        "Lesen/Schr.", "–",         "Lesen",      "Lesen",      "–",          "Lesen"],
  ["Lesen",        "Lesen",       "–",         "Lesen/Schr.","Lesen/Schr.","–",          "Lesen"],
  ["–",            "Autor",       "–",         "Autor",      "Autor",      "–",          "Autor"],
  ["–",            "–",           "–",         "Benutzerverw.","Admin",    "–",          "Admin"],
  ["–",            "–",           "–",         "Verwalter",  "Admin",      "–",          "Admin"],
  ["–",            "–",           "–",         "Verwalter",  "Admin",      "–",          "Admin"],
  ["–",            "–",           "–",         "–",          "Admin",      "–",          "Admin"],
  ["–",            "–",           "–",         "–",          "Admin",      "–",          "Admin"],
];

// ── 2) Microsoft 365 Matrix ──
const m365Systems = [
  "Teams (Kommunikation)",
  "OneNote (Notizbücher)",
  "SharePoint / OneDrive",
  "Exchange Online (E-Mail)",
  "Word / PowerPoint / Excel",
  "Copilot-Chat",
  "Forms (Umfragen)",
  "Clipchamp (Video)",
  "M365 Admin Center",
  "Teams Admin Center",
  "SharePoint Admin Center",
  "Exchange Admin Center",
  "Entra ID (Benutzerverwaltung)",
  "Intune (Geräteverwaltung)",
  "Security & Compliance",
  "Lizenzverwaltung",
];
const m365Matrix = [
  // Lernende,     LP,           Lernlounge,  PIKT-Team,    PIKT-Leit,    TIKT-Team,    TIKT-Leit
  ["Nutzer",       "Nutzer",     "–",          "Nutzer",     "Nutzer",     "Nutzer",     "Admin"],
  ["Nutzer",       "Nutzer",     "–",          "Nutzer",     "Nutzer",     "Nutzer",     "Admin"],
  ["Nutzer",       "Nutzer",     "–",          "Nutzer",     "Nutzer",     "Nutzer",     "Admin"],
  ["Nutzer",       "Nutzer",     "–",          "Nutzer",     "Nutzer",     "Nutzer",     "Admin"],
  ["Nutzer",       "Nutzer",     "–",          "Nutzer",     "Nutzer",     "Nutzer",     "Nutzer"],
  ["Nutzer",       "Nutzer",     "–",          "Nutzer",     "Nutzer",     "Nutzer",     "Nutzer"],
  ["Nutzer",       "Nutzer",     "–",          "Nutzer",     "Nutzer",     "Nutzer",     "Nutzer"],
  ["Nutzer",       "Nutzer",     "–",          "Nutzer",     "Nutzer",     "Nutzer",     "Nutzer"],
  ["–",            "–",          "–",          "–",          "–",          "Helpdesk",   "Admin"],
  ["–",            "–",          "–",          "–",          "–",          "Teams-Adm.","Admin"],
  ["–",            "–",          "–",          "–",          "–",          "SP-Admin",   "Admin"],
  ["–",            "–",          "–",          "–",          "–",          "Exch.-Adm.", "Admin"],
  ["–",            "–",          "–",          "–",          "–",          "Benutzer-Adm.","Admin"],
  ["–",            "–",          "–",          "–",          "–",          "Intune-Adm.","Admin"],
  ["–",            "–",          "–",          "–",          "–",          "–",          "Admin"],
  ["–",            "–",          "–",          "–",          "–",          "Lizenz-Adm.","Admin"],
];

// ── 3) Lerntechnologien Matrix ──
const ltSystems = [
  "fobizz (Kantonslizenz)",
  "to-teach.ai (Kantonslizenz)",
  "fellofish (Kantonslizenz)",
  "brain.study (Kantonslizenz)",
  "Adobe Creative Cloud (BBW)",
  "Quizlet (begrenzt, 24 Liz.)",
  "Actionbound (begrenzt, 38 Liz.)",
  "Statista (Medienarchiv)",
  "swissdox (Medienarchiv)",
  "E-Thek (Medienarchiv)",
  "Synthesia (Einzellizenz)",
  "Mentimeter (Einzellizenz)",
  "Padlet (Einzellizenz)",
  "Findmind (Einzellizenz)",
  "ChatGPT-Konto (Einzellizenz)",
  "learningapps.org (kostenlos)",
  "simpleshow (kostenlos)",
  "lumi education (kostenlos)",
  "Canva Edu (kostenlos)",
];
const ltMatrix = [
  // Lernende,        LP,            Lernlounge,     PIKT-Team,       PIKT-Leit,      TIKT-Team,   TIKT-Leit
  ["via LP",          "Nutzer",      "–",             "Nutzer",        "Admin",        "–",          "–"],
  ["–",               "Nutzer",      "–",             "Nutzer",        "Admin",        "–",          "–"],
  ["–",               "–",           "–",             "Nutzer",        "Admin",        "–",          "–"],
  ["–",               "–",           "–",             "Nutzer",        "Admin",        "–",          "–"],
  ["–",               "Nutzer",      "–",             "Nutzer",        "Nutzer",       "–",          "Admin"],
  ["via LP",          "Nutzer",      "–",             "Nutzer",        "Admin",        "–",          "–"],
  ["via LP",          "Nutzer",      "Admin",         "Nutzer",        "Admin",        "–",          "–"],
  ["Nutzer",          "Nutzer",      "Admin",         "Nutzer",        "Admin",        "–",          "–"],
  ["Nutzer",          "Nutzer",      "Admin",         "Nutzer",        "Admin",        "–",          "–"],
  ["Nutzer",          "Nutzer",      "Admin",         "Nutzer",        "Admin",        "–",          "–"],
  ["–",               "–",           "–",             "Admin",         "Admin",        "–",          "–"],
  ["–",               "–",           "–",             "Admin",         "Admin",        "–",          "–"],
  ["–",               "–",           "–",             "Admin",         "Admin",        "–",          "–"],
  ["–",               "–",           "–",             "Admin",         "Admin",        "–",          "–"],
  ["Gruppenarbeit",   "–",           "Ausleihe",      "Admin",         "Admin",        "–",          "–"],
  ["Nutzer",          "Nutzer",      "–",             "Nutzer",        "Nutzer",       "–",          "–"],
  ["–",               "Nutzer",      "–",             "Nutzer",        "Nutzer",       "–",          "–"],
  ["Nutzer",          "Nutzer",      "–",             "Nutzer",        "Nutzer",       "–",          "–"],
  ["Nutzer",          "Nutzer",      "–",             "Nutzer",        "Admin",        "–",          "–"],
];

// ══════════════════════════════════════════════════════════════
const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 18, color: BLACK } } } },
  sections: [{
    properties: {
      page: {
        margin: { top: mm(20), bottom: mm(20), left: mm(18), right: mm(18) },
        size: { width: mm(297), height: mm(210), orientation: PageOrientation.LANDSCAPE },
      },
    },
    headers: { default: createHeader() },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Rollen- und Berechtigungskonzept | BBW Berufsbildungsschule Winterthur | PIKT", size: 14, font: FONT, color: GRAY })],
        })],
      }),
    },
    children: [
      // ═══════ TITELSEITE ═══════
      gap(),
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: "BBW Berufsbildungsschule Winterthur", font: FONT, size: 18, color: GRAY })],
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [new TextRun({ text: "Rollen- und Berechtigungskonzept", font: FONT_BOLD, size: 40, bold: true, color: LIME })],
      }),
      new Paragraph({
        spacing: { after: 150 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } },
        children: [new TextRun({ text: "IKT-Systeme und Lerntechnologien", font: FONT, size: 20, color: GRAY })],
      }),
      gap(),
      body("Dieses Dokument definiert die Rollen und Berechtigungen für alle IKT-Systeme und Lerntechnologien der BBW. Es basiert auf der kantonalen Vorlage und regelt den Zugang nach dem Need-to-know-Prinzip."),
      gap(),
      bodyRuns([
        { text: "Geltungsbereich: ", bold: true },
        { text: "Alle Mitarbeitenden und Lernenden der BBW Berufsbildungsschule Winterthur." },
      ]),
      bodyRuns([
        { text: "Grundlagen: ", bold: true },
        { text: "Kantonale Vorlage Rollen- und Berechtigungskonzept (V1.0, März 2025), IKT Konzept BBW V07, Nutzungsrichtlinie IKT BBW, Richtlinie BBW EdTech." },
      ]),
      bodyRuns([
        { text: "Stand: ", bold: true },
        { text: "Februar 2026" },
      ]),
      bodyRuns([
        { text: "Verantwortlich: ", bold: true },
        { text: "PIKT-Leitung / TIKT-Leitung BBW" },
      ]),
      gap(),
      infoBox("Need-to-know-Prinzip", "Jede Person erhält nur die Rechte, die für ihre Funktion und Tätigkeit erforderlich sind. Berechtigungen werden mindestens jährlich (Mitarbeitende) bzw. halbjährlich (Admin-Rechte) überprüft."),

      // ═══════ 1. ALLGEMEINE BESTIMMUNGEN ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("1  Allgemeine Bestimmungen"),
      hdr("1.1  Gegenstand und Zweck", HeadingLevel.HEADING_2),
      body("Das Rollen- und Berechtigungskonzept dient dem Schutz der Vertraulichkeit und der Integrität der IKT-Systeme der BBW. Es ist die Grundlage für die Implementierung der Berechtigungen."),
      gap(),
      body("Ziele:"),
      body("  \u2013  Klarheit und Einheitlichkeit bei der Vergabe von Rechten"),
      body("  \u2013  Übergreifende, verbindliche Definition der Berechtigungsvergabe"),
      body("  \u2013  Verringerung des administrativen Aufwands"),
      body("  \u2013  Nachvollziehbare Dokumentation der Zugriffsrechte"),
      gap(),
      hdr("1.2  Geltungsbereich", HeadingLevel.HEADING_2),
      body("Dieses Konzept gilt für alle Mitarbeitenden sowie Lernenden der BBW. Externe Auftragnehmende im IKT-Bereich werden zur Einhaltung der Anforderungen vertraglich verpflichtet."),
      gap(),
      hdr("1.3  Zugriffskontrolle", HeadingLevel.HEADING_2),
      body("Alle IKT-Systeme sind durch Zugriffskontrolle vor unerlaubter Nutzung zu schützen. Jeder Anwendende wird durch Identifikation und Passwort authentifiziert. Für kritische Systeme (Admin-Zugang) ist Multi-Faktor-Authentifizierung (MFA) erforderlich."),

      // ═══════ 2. FUNKTIONSROLLEN BBW ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("2  Funktionsrollen der BBW"),
      body("Die folgenden Funktionsrollen bilden die organisatorischen Zuständigkeiten der BBW ab:"),
      gap(),
      makeTable(
        ["Rolle", "Beschreibung", "Zuständigkeitsbereich"],
        [
          [
            { runs: [{ text: "Lernende", bold: true }] },
            "Schüler:innen der BBW. Zugang zu Lernplattformen und freigegebenen Tools.",
            "Nutzung von Lerninhalten, keine administrativen Rechte."
          ],
          [
            { runs: [{ text: "Lehrperson (LP)", bold: true }] },
            "Unterrichtende der BBW. Erstellen und verwalten Lerninhalte.",
            "Kursgestaltung, Bewertung, Nutzung von Lerntechnologien."
          ],
          [
            { runs: [{ text: "Lernlounge", bold: true }] },
            "Betreuungspersonen der Lernlounge. Verwalten Ausleihe und Medienarchiv-Zugänge.",
            "Verwaltung: Digithek, Actionbound, Statista, E-Thek, swissdox. Ausleihe ChatGPT-Notebook."
          ],
          [
            { runs: [{ text: "PIKT-Team", bold: true }] },
            "Pädagogischer ICT-Support. Unterstützt LP bei Lerntechnologien.",
            "Verwaltung von Einzellizenzen, Beratung, Inhalterstellung. Zugänge zu allen Lerntechnologien."
          ],
          [
            { runs: [{ text: "PIKT-Leitung", bold: true }] },
            "Leitung des pädagogischen ICT-Supports. Admin-Rechte für Lerntechnologien und OpenOlat.",
            "Administrator: OpenOlat, Kantonslizenzen, begrenzte Lizenzen, Einzellizenzen. Strategische Entscheide."
          ],
          [
            { runs: [{ text: "TIKT-Team", bold: true }] },
            "Technischer ICT-Support. Delegierte Admin-Rechte für Microsoft 365.",
            "Delegierte Admin-Rollen: Teams, SharePoint, Exchange, Benutzer, Lizenzen, Intune."
          ],
          [
            { runs: [{ text: "TIKT-Leitung", bold: true }] },
            "Leitung des technischen ICT-Supports. Globaler Admin Microsoft 365, Admin Adobe CC.",
            "Global Administrator M365, Entra ID, Security & Compliance. Vergibt delegierte Rollen an TIKT-Team."
          ],
        ],
        GREEN,
        [16, 42, 42]
      ),
      gap(),
      infoBox("Funktionstrennung", "Wenn mehrere Funktionen durch dieselbe Person wahrgenommen werden, sind mögliche Interessenkonflikte durch unterschiedliche Rollen zu verhindern (Segregation of Duties).", ORANGE),

      // ═══════ 3. BERECHTIGUNGSMATRIZEN ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("3  Berechtigungsmatrizen"),
      body("Die folgenden Matrizen zeigen die konkreten Berechtigungen pro Rolle und System. Legende: Nutzer = Standardnutzung, Autor = Inhalte erstellen, Admin = volle Verwaltung, – = kein Zugang."),
      gap(),

      // 3.1 OpenOlat
      roleMatrix("3.1  OpenOlat – Lernmanagement & Intranet", TEAL, TEAL_LIGHT, ooSystems, bbwRoles, ooMatrix),
      gap(),
      infoBox("OpenOlat-Rollen", "PIKT-Leitung und TIKT-Leitung sind System-Administratoren. Das PIKT-Team erhält die Rollen Benutzerverwalter, Kurs-Autor und Katalog-/Curriculumverwalter. Referenz: docs.openolat.org/de/manual_admin/administration/System/"),

      // 3.2 Microsoft 365
      new Paragraph({ children: [new PageBreak()] }),
      roleMatrix("3.2  Microsoft 365 – Office, Kommunikation & Verwaltung", BLUE, BLUE_LIGHT, m365Systems, bbwRoles, m365Matrix),
      gap(),
      infoBox("Microsoft 365 Delegation", "Die TIKT-Leitung hält den Global Administrator und vergibt feingranulare Rollen an das TIKT-Team nach dem Least-Privilege-Prinzip. Empfohlene delegierte Rollen: Teams Administrator, SharePoint Administrator, Exchange Administrator, User Administrator, License Administrator, Intune Administrator. Security & Compliance verbleibt bei der TIKT-Leitung.", BLUE),

      // 3.3 Lerntechnologien
      new Paragraph({ children: [new PageBreak()] }),
      roleMatrix("3.3  Lerntechnologien – Kantonslizenzen, Medienarchive & Einzellizenzen", PURPLE, PURPLE_LIGHT, ltSystems, bbwRoles, ltMatrix),
      gap(),
      infoBox("Lernlounge-Zuständigkeit", "Die Lernlounge verwaltet die Zugänge zu Digithek (Statista, swissdox, E-Thek), Actionbound und die Ausleihe des ChatGPT-Notebooks. Die PIKT-Leitung hat ebenfalls Zugang zu diesen Systemen.", PURPLE),

      // ═══════ 4. M365 DETAILLIERTE ROLLENDELEGATION ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("4  Microsoft 365: Detaillierte Rollendelegation"),
      body("Die folgende Tabelle zeigt, welche M365-Admin-Rollen bei der TIKT-Leitung verbleiben und welche an das TIKT-Team delegiert werden können."),
      gap(),
      makeTable(
        ["M365 Admin-Rolle", "Verbleibt bei", "Begründung"],
        [
          [
            { runs: [{ text: "Global Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Leitung", bold: true, color: RED }] },
            "Höchste Rechtstufe. Nur 2–4 Personen. Notfallzugang (Break-Glass-Konten)."
          ],
          [
            { runs: [{ text: "Security Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Leitung", bold: true, color: RED }] },
            "Sicherheitsrichtlinien, Bedrohungsschutz, Compliance. Zu kritisch für Delegation."
          ],
          [
            { runs: [{ text: "Privileged Auth. Admin", bold: true }] },
            { runs: [{ text: "TIKT-Leitung", bold: true, color: RED }] },
            "Kann Passwörter aller Admins zurücksetzen. Notfallrolle."
          ],
          [
            { runs: [{ text: "Compliance Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Leitung", bold: true, color: RED }] },
            "Datenschutz- und Compliance-Einstellungen. Regulatorische Verantwortung."
          ],
          [
            { runs: [{ text: "Teams Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Team", bold: true, color: BLUE }] },
            "Verwaltet Teams, Kanäle, Meetings, Richtlinien. Kein Zugriff auf andere Dienste."
          ],
          [
            { runs: [{ text: "SharePoint Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Team", bold: true, color: BLUE }] },
            "Verwaltet SharePoint-Sites, OneDrive-Speicher, Freigaben."
          ],
          [
            { runs: [{ text: "Exchange Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Team", bold: true, color: BLUE }] },
            "Verwaltet Postfächer, Mailfluss, Gruppen. Kein Zugriff auf Security."
          ],
          [
            { runs: [{ text: "User Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Team", bold: true, color: BLUE }] },
            "Erstellt/deaktiviert Benutzer, setzt Passwörter zurück, verwaltet Gruppen."
          ],
          [
            { runs: [{ text: "License Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Team", bold: true, color: BLUE }] },
            "Weist Lizenzen zu/entfernt sie. Kann keine Benutzer erstellen."
          ],
          [
            { runs: [{ text: "Intune Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Team", bold: true, color: BLUE }] },
            "Verwaltet Geräte, Richtlinien, App-Bereitstellung."
          ],
          [
            { runs: [{ text: "Helpdesk Administrator", bold: true }] },
            { runs: [{ text: "TIKT-Team", bold: true, color: BLUE }] },
            "Setzt Passwörter für Nicht-Admins zurück, verwaltet Service Requests."
          ],
          [
            { runs: [{ text: "Global Reader", bold: true }] },
            { runs: [{ text: "PIKT-Leitung", bold: true, color: GREEN }] },
            "Lesezugriff auf alle M365-Einstellungen. Keine Änderungsrechte. Für Übersicht und Berichterstattung."
          ],
        ],
        BLUE,
        [22, 18, 60]
      ),

      // ═══════ 5. VERANTWORTLICHKEITEN & PROZESSE ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("5  Verantwortlichkeiten und Prozesse"),
      hdr("5.1  Verantwortlichkeiten", HeadingLevel.HEADING_2),
      gap(),
      makeTable(
        ["Verantwortliche Stelle", "Aufgaben"],
        [
          ["PIKT-Leitung", "Admin-Zugang OpenOlat und Lerntechnologien. Zuweisung von Rollen für pädagogische Systeme. Entscheid über Anschaffung neuer Tools (mit Steuergruppe)."],
          ["TIKT-Leitung", "Global Admin M365. Vergibt delegierte Admin-Rollen an TIKT-Team. Verantwortlich für Security, Compliance, Entra ID. Prüft halbjährlich Admin-Berechtigungen."],
          ["TIKT-Team", "Delegierte Admin-Aufgaben M365 (Teams, SharePoint, Exchange, Benutzer, Lizenzen, Intune). Helpdesk für Passwort-Resets und Service Requests."],
          ["PIKT-Team", "Verwaltung von Einzellizenzen (Synthesia, Mentimeter, Padlet, Findmind). Beratung und Inhalterstellung für Lehrpersonen. Kontaktaufnahme für neue Tools."],
          ["Lernlounge", "Verwaltung Medienarchiv-Zugänge (Digithek: Statista, swissdox, E-Thek). Verwaltung Actionbound. Ausleihe ChatGPT-Notebook."],
          ["Personalverantwortliche", "Melden personeller Mutationen (Ein-/Austritt) an PIKT-Leitung und TIKT-Leitung."],
          ["Vorgesetzte / Rektorat", "Prüfen und Freigeben von Berechtigungsanträgen. Regelmässige Überprüfung der bestehenden Berechtigungen."],
        ],
        GREEN,
        [22, 78]
      ),

      gap(),
      hdr("5.2  Prozess: Einrichten / Ändern von Zugriffsberechtigungen", HeadingLevel.HEADING_2),
      gap(),
      makeTable(
        ["Schritt", "Akteur", "Aktion"],
        [
          ["1", "Personalverantwortliche/r", "Meldet personelle Mutation (Eintritt/Wechsel/Austritt) an die zuständige Stelle."],
          ["2", "Vorgesetzte/r", "Prüft und genehmigt den Berechtigungsantrag."],
          ["3", "TIKT-Leitung / PIKT-Leitung", "Richtet die Berechtigungen gemäss Rollenkonzept ein oder delegiert an Team-Mitglieder."],
          ["4", "TIKT-Team / PIKT-Team", "Setzt die Berechtigungen in den jeweiligen Systemen um."],
          ["5", "Mitarbeiter/in", "Erhält Zugang und Initialpasswort (persönliche Übergabe oder via gesicherten Kanal)."],
        ],
        TEAL,
        [8, 22, 70]
      ),

      gap(),
      hdr("5.3  Prozess: Löschen von Zugriffsberechtigungen", HeadingLevel.HEADING_2),
      gap(),
      makeTable(
        ["Schritt", "Akteur", "Aktion"],
        [
          ["1", "Personalverantwortliche/r", "Meldet den Austritt an TIKT-Leitung und PIKT-Leitung."],
          ["2", "TIKT-Leitung", "Deaktiviert M365-Konto, entzieht Lizenzen, sperrt Zugang."],
          ["3", "PIKT-Leitung", "Deaktiviert OpenOlat-Konto, entzieht Lerntechnologie-Zugänge."],
          ["4", "Lernlounge", "Prüft ob offene Ausleihen bestehen und schliesst diese ab."],
        ],
        RED,
        [8, 22, 70]
      ),

      gap(),
      hdr("5.4  Überprüfung der Berechtigungen", HeadingLevel.HEADING_2),
      gap(),
      makeTable(
        ["Prüfung", "Intervall", "Verantwortlich", "Umfang"],
        [
          ["Mitarbeitende Berechtigungen", "Jährlich", "PIKT-Leitung + TIKT-Leitung", "Alle Benutzerkonten und Rollenzuweisungen"],
          ["Admin-Berechtigungen", "Halbjährlich", "TIKT-Leitung", "Alle Admin-Rollen in M365, OpenOlat und Lerntechnologien"],
          ["Externe Zugänge", "Quartalsweise", "TIKT-Leitung", "Zugänge externer Dienstleister und Partner"],
          ["Lizenznutzung", "Halbjährlich", "PIKT-Leitung", "Auslastung begrenzter Lizenzen (Quizlet, Actionbound)"],
        ],
        ORANGE,
        [25, 15, 25, 35]
      ),

      // ═══════ 6. ANHANG ═══════
      new Paragraph({ children: [new PageBreak()] }),
      hdr("Anhang I: Rolle-Mitarbeiter-Zuteilung (dynamisch)"),
      body("Die folgende Tabelle wird laufend aktualisiert und enthält die konkrete Zuweisung der Rollen zu den Mitarbeitenden."),
      gap(),
      makeTable(
        ["Mitarbeiter/in", "Lernende", "LP", "Lernlounge", "PIKT-Team", "PIKT-Leitung", "TIKT-Team", "TIKT-Leitung"],
        [
          ["[Name, Vorname]", "", "", "", "", "", "", ""],
          ["[Name, Vorname]", "", "", "", "", "", "", ""],
          ["[Name, Vorname]", "", "", "", "", "", "", ""],
          ["[Name, Vorname]", "", "", "", "", "", "", ""],
          ["[Name, Vorname]", "", "", "", "", "", "", ""],
          ["...", "", "", "", "", "", "", ""],
        ],
        GREEN,
        [20, 10, 10, 12, 12, 12, 12, 12]
      ),
      gap(),
      body("Hinweis: Bei Mehrfachfunktionen können einer Person mehrere Rollen zugewiesen werden. Die Tabelle ist entsprechend mit X zu markieren."),

      gap(), gap(),
      new Paragraph({
        spacing: { before: 150 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREEN } },
        children: [new TextRun({ text: "Dieses Dokument ist vertraulich und nur für den internen Gebrauch der BBW bestimmt.", font: FONT, size: 16, color: GREEN, bold: true })],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
const outputPath = process.argv[2] || "Rollen_Berechtigungskonzept_BBW.docx";
writeFileSync(outputPath, buffer);
console.log(`Erstellt: ${outputPath} (Querformat A4)`);
