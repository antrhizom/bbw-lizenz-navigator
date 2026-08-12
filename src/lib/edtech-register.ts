import { ToolArt } from "@/data/types";

/**
 * Die beiden Register der Übersicht.
 *
 * Der Unterschied liegt nicht im Gegenstand, sondern in der Art des Zugangs:
 * Anwendungen sind über ein Nutzungsrecht (Lizenz) zugänglich, Geräte über
 * ihre Verfügbarkeit (Anzahl Exemplare, Ausleihe). Deshalb heisst das
 * Lizenzfeld bei Geräten «Verfügbarkeit».
 *
 * Alle Beschriftungen stehen hier an einer Stelle – Umbenennen ist eine
 * Änderung an dieser Datei, nicht an den Seiten.
 */
export interface RegisterDef {
  art: ToolArt;
  href: string;
  label: string;
  /** Erklärung beim Überfahren (title) und sichtbar unter dem Titel. */
  erklaerung: string;
  titel: string;
  untertitel: string;
  /** Beschriftung des Lizenz-/Verfügbarkeitsfelds und seines Filters. */
  lizenzLabel: string;
  leerText: string;
  pdfTitel: string;
}

/** Beschriftung des gemeinsamen Navigationseintrags über beide Register. */
export const UEBERSICHT = {
  label: "Bestand Lerntechnologien",
  href: "/",
  erklaerung:
    "Alle Anwendungen und Geräte der Lerntechnologie – unterteilt in EdTech Soft (Zugang über eine Lizenz) und EdTech Hard (Zugang über Verfügbarkeit und Ausleihe).",
};

export const REGISTER: RegisterDef[] = [
  {
    art: "anwendung",
    // Startseite: der Bestand ist der Haupteinstieg der Anwendung.
    href: "/",
    label: "EdTech Soft",
    erklaerung:
      "Software und Web-Dienste für den Unterricht – der Zugang läuft über ein Nutzungsrecht (Lizenz).",
    titel: "EdTech Soft",
    untertitel:
      "Anwendungen, Web-Dienste und Plattformen. Der Zugang läuft über ein Nutzungsrecht: Kantonslizenz, Schullizenz oder Einzellizenz.",
    lizenzLabel: "Lizenz",
    leerText: "Keine Anwendungen gefunden. Bitte passen Sie die Filter an.",
    pdfTitel: "BBW EdTech Soft – Anwendungen",
  },
  {
    art: "geraet",
    href: "/geraete",
    label: "EdTech Hard",
    erklaerung:
      "Geräte und technische Ausstattung – der Zugang läuft über die Verfügbarkeit (Anzahl Exemplare, Ausleihe).",
    titel: "EdTech Hard",
    untertitel:
      "Geräte und technische Ausstattung. Der Zugang läuft nicht über eine Lizenz, sondern über die Verfügbarkeit: Anzahl Exemplare und Ausleihe.",
    lizenzLabel: "Verfügbarkeit",
    leerText: "Keine Geräte gefunden. Bitte passen Sie die Filter an.",
    pdfTitel: "BBW EdTech Hard – Geräte",
  },
];

export function registerFuer(art: ToolArt): RegisterDef {
  return REGISTER.find((r) => r.art === art) ?? REGISTER[0];
}

/**
 * Gruppen für die leichte Gliederung der Bestandsliste.
 *
 * Die Zuordnung wird aus der Lizenzart abgeleitet – kein zusätzliches
 * Datenfeld, das gepflegt werden müsste. Wer ein Tool umgruppieren will,
 * passt in der Adminseite die Lizenzart an.
 *
 * Die Gliederung erscheint nur ungefiltert: sobald gefiltert wird, ist die
 * Trefferliste die Aussage, und Überschriften mit einzelnen Einträgen darunter
 * würden mehr stören als helfen.
 */
export interface GruppeDef {
  id: string;
  titel: string;
  erklaerung: string;
}

export const GRUPPEN: GruppeDef[] = [
  {
    id: "kanton",
    titel: "Kantonslizenzen",
    erklaerung: "Vom Kanton bezahlt, für alle verfügbar – Login mit dem Schulkonto.",
  },
  {
    id: "ms",
    titel: "MS-Dienste",
    erklaerung: "Microsoft 365 der Schule: Office-Programme, Teams, Forms und Copilot.",
  },
  {
    id: "schule",
    titel: "Schullizenzen",
    erklaerung: "Von der BBW beschafft; teils in begrenzter Zahl und auf Zuteilung.",
  },
  {
    id: "einzel",
    titel: "Einzellizenzen",
    erklaerung: "Einzelne Zugänge beim PIKT-Team – nicht beliebig teilbar.",
  },
  {
    id: "frei",
    titel: "Kostenlos nutzbar",
    erklaerung:
      "Gratis-Angebote. Achtung: teils mit eigenem Konto und ausserhalb des Schulangebots.",
  },
  {
    id: "weitere",
    titel: "Weitere",
    erklaerung: "Einträge, die in keine der obigen Gruppen fallen.",
  },
];

/** Gruppe eines Tools anhand seiner Lizenzart. */
export function gruppeVon(lizenz: string): string {
  const l = lizenz.toLowerCase();
  // Zuerst die Kombination prüfen: «Kantonslizenz + BBW-Schullizenz» sind die
  // Microsoft-365-Dienste, die über beide Wege lizenziert sind.
  if (l.includes("kanton") && l.includes("schullizenz")) return "ms";
  if (l.includes("kostenlos") || l.includes("eigenes konto")) return "frei";
  if (l.includes("einzellizenz")) return "einzel";
  if (l.includes("schullizenz") || l.includes("hardware")) return "schule";
  if (l.includes("kanton")) return "kanton";
  return "weitere";
}

/** Fehlt die Angabe am Tool, gilt es als Anwendung. */
export function artVon(tool: { art?: ToolArt }): ToolArt {
  return tool.art === "geraet" ? "geraet" : "anwendung";
}
