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

export const REGISTER: RegisterDef[] = [
  {
    art: "anwendung",
    href: "/lizenzen",
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

/** Fehlt die Angabe am Tool, gilt es als Anwendung. */
export function artVon(tool: { art?: ToolArt }): ToolArt {
  return tool.art === "geraet" ? "geraet" : "anwendung";
}
