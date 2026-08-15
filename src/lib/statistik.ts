import {
  deleteDocument,
  getDocument,
  incrementFields,
  listDocuments,
} from "./firestore-rest";

/**
 * Einfache Nutzungsstatistik.
 *
 * Gezählt werden ausschliesslich anonyme Summen pro Monat – keine Kennungen,
 * keine Sitzungen, keine Zuordnung zu Personen. Ein Dokument pro Monat
 * (`statistik/2026-08`) enthält ein Feld `zaehler` mit Schlüssel-Zähler-Paaren.
 *
 * Firebase Analytics wäre die Alternative, liesse sich aber nicht in der
 * Adminseite anzeigen: dafür bräuchte es serverseitige Google-Zugangsdaten.
 */

export const STATISTIK_COLLECTION = "statistik";

export type Kategorie = "seite" | "tool" | "funktion";

/** Zählerschlüssel: «kategorie:wert», z. B. «seite:/geraete». */
function schluessel(kategorie: Kategorie, wert: string): string {
  // Backticks und Zeilenumbrüche würden den Firestore-Feldpfad zerstören.
  const sauber = wert.replace(/[`\n\r]/g, "").slice(0, 120);
  return `${kategorie}:${sauber}`;
}

function monatsId(datum = new Date()): string {
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, "0")}`;
}

/** Damit eine dauerhafte Fehlkonfiguration nicht die Konsole flutet. */
let fehlerGemeldet = false;

/**
 * Zählt ein Ereignis. Fehler stören die Bedienung nie, werden aber einmal pro
 * Sitzung in der Konsole gemeldet: ein stilles Scheitern hatte schon einmal
 * dazu geführt, dass wochenlang nichts gezählt wurde, ohne dass es auffiel.
 */
export function zaehle(kategorie: Kategorie, wert: string): void {
  if (typeof window === "undefined" || !wert) return;
  const pfad = "zaehler.`" + schluessel(kategorie, wert) + "`";
  void incrementFields(STATISTIK_COLLECTION, monatsId(), [pfad]).catch(
    (err) => {
      if (!fehlerGemeldet) {
        fehlerGemeldet = true;
        console.warn("Nutzungsstatistik konnte nicht gezählt werden:", err);
      }
    }
  );
}

export interface MonatsStatistik {
  monat: string;
  zaehler: Record<string, number>;
}

/** Alle Monatsdokumente lesen – nur für die Adminseite. */
export async function ladeStatistik(): Promise<MonatsStatistik[]> {
  const docs = await listDocuments(STATISTIK_COLLECTION);
  return docs
    .map((d) => {
      const roh = (d.fields.zaehler ?? {}) as Record<string, unknown>;
      const zaehler: Record<string, number> = {};
      for (const [k, v] of Object.entries(roh)) {
        if (typeof v === "number") zaehler[k] = v;
      }
      return { monat: d.id, zaehler };
    })
    .sort((a, b) => b.monat.localeCompare(a.monat));
}

/** Einzelnen Monat lesen. */
export async function ladeMonat(
  monat = monatsId()
): Promise<MonatsStatistik | null> {
  const doc = await getDocument(STATISTIK_COLLECTION, monat);
  if (!doc) return null;
  const roh = (doc.fields.zaehler ?? {}) as Record<string, unknown>;
  const zaehler: Record<string, number> = {};
  for (const [k, v] of Object.entries(roh)) {
    if (typeof v === "number") zaehler[k] = v;
  }
  return { monat, zaehler };
}

/**
 * Löscht die Zahlen eines Monats (oder aller Monate) – nur für Admin-Konten,
 * die Regeln lassen das Löschen sonst nicht zu.
 */
export async function loescheStatistik(monat?: string): Promise<number> {
  const monate = monat
    ? [monat]
    : (await listDocuments(STATISTIK_COLLECTION)).map((d) => d.id);
  for (const m of monate) {
    await deleteDocument(STATISTIK_COLLECTION, m);
  }
  return monate.length;
}

/** Zähler einer Kategorie, absteigend sortiert. */
export function nachKategorie(
  zaehler: Record<string, number>,
  kategorie: Kategorie
): { wert: string; anzahl: number }[] {
  const prefix = `${kategorie}:`;
  return Object.entries(zaehler)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, anzahl]) => ({ wert: k.slice(prefix.length), anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl);
}

/** Mehrere Monate zu einer Summe zusammenfassen. */
export function summiere(
  monate: MonatsStatistik[]
): Record<string, number> {
  const summe: Record<string, number> = {};
  for (const m of monate) {
    for (const [k, v] of Object.entries(m.zaehler)) {
      summe[k] = (summe[k] ?? 0) + v;
    }
  }
  return summe;
}
