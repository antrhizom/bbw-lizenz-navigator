import {
  deleteDocument,
  FsTimestamp,
  getDocument,
  listDocuments,
  setDocument,
} from "./firestore-rest";
import { Tool, StoredTool } from "@/data/types";
import { TOOLS } from "@/data/tools";

export const TOOLS_COLLECTION = "tools";
export const ADMINS_COLLECTION = "admins";

export type ToolSource = "firestore" | "static";

/**
 * Alle Feldnamen eines Tool-Dokuments. Wird als updateMask verwendet, damit
 * beim Speichern weggelassene Felder auch wirklich verschwinden.
 */
const TOOL_FELDER = [
  "name",
  "typ",
  "art",
  "ki",
  "kiDetail",
  "lernende",
  "lernendeDetail",
  "lp",
  "lizenz",
  "lizenzDetail",
  "funcs",
  "features",
  "zugang",
  "einzellizenzInfo",
  "website",
  "anleitungPdfs",
  "beherrschen",
  "lernen",
  "lpOrg",
  "lpVorb",
  "behDesc",
  "lernDesc",
  "lpOrgDesc",
  "lpVorbDesc",
  "hidden",
  "sortIndex",
  "updatedAt",
  "updatedBy",
];

/** Rohdaten aus Firestore in einen vollständigen Tool-Datensatz überführen. */
function normalize(id: string, raw: Record<string, unknown>): StoredTool {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v : fallback;
  const bool = (v: unknown) => v === true;

  return {
    id,
    name: str(raw.name, id),
    typ: str(raw.typ),
    art: raw.art === "geraet" ? "geraet" : "anwendung",
    ki: bool(raw.ki),
    kiDetail: typeof raw.kiDetail === "string" ? raw.kiDetail : undefined,
    lernende: bool(raw.lernende),
    lernendeDetail:
      typeof raw.lernendeDetail === "string" ? raw.lernendeDetail : undefined,
    lp: bool(raw.lp),
    lizenz: str(raw.lizenz),
    lizenzDetail: str(raw.lizenzDetail),
    funcs: str(raw.funcs),
    features: Array.isArray(raw.features)
      ? raw.features.filter((f): f is string => typeof f === "string")
      : [],
    zugang: str(raw.zugang),
    einzellizenzInfo:
      typeof raw.einzellizenzInfo === "string"
        ? raw.einzellizenzInfo
        : undefined,
    website: typeof raw.website === "string" ? raw.website : undefined,
    anleitungPdfs: Array.isArray(raw.anleitungPdfs)
      ? (raw.anleitungPdfs as unknown[])
          .filter(
            (p): p is { label: string; path: string } =>
              !!p &&
              typeof p === "object" &&
              typeof (p as { label?: unknown }).label === "string" &&
              typeof (p as { path?: unknown }).path === "string"
          )
          .map((p) => ({ label: p.label, path: p.path }))
      : undefined,
    beherrschen: bool(raw.beherrschen),
    lernen: bool(raw.lernen),
    lpOrg: bool(raw.lpOrg),
    lpVorb: bool(raw.lpVorb),
    behDesc: str(raw.behDesc),
    lernDesc: str(raw.lernDesc),
    lpOrgDesc: str(raw.lpOrgDesc),
    lpVorbDesc: str(raw.lpVorbDesc),
    hidden: bool(raw.hidden),
    sortIndex: typeof raw.sortIndex === "number" ? raw.sortIndex : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    updatedBy: typeof raw.updatedBy === "string" ? raw.updatedBy : undefined,
  };
}

function bySortIndex(a: Tool, b: Tool): number {
  const ai = a.sortIndex ?? Number.MAX_SAFE_INTEGER;
  const bi = b.sortIndex ?? Number.MAX_SAFE_INTEGER;
  if (ai !== bi) return ai - bi;
  return a.name.localeCompare(b.name, "de-CH");
}

/** Tool-Felder für das Schreiben aufbereiten (ohne id, mit Metadaten). */
function toFelder(tool: Tool, editorEmail: string): Record<string, unknown> {
  const felder: Record<string, unknown> = {
    ...tool,
    // Immer explizit schreiben, damit gespeicherte und gelesene Daten
    // übereinstimmen (normalize setzt fehlende Werte auf "anwendung").
    art: tool.art ?? "anwendung",
    updatedAt: FsTimestamp.jetztIso(),
    updatedBy: editorEmail,
  };
  // Die ID ist der Dokumentname, kein Feld im Dokument.
  delete felder.id;
  return felder;
}

/**
 * Alle Tools inkl. Entwürfe – für die Adminseite.
 * Wirft, wenn Firestore nicht erreichbar ist.
 */
export async function fetchAllTools(): Promise<StoredTool[]> {
  const docs = await listDocuments(TOOLS_COLLECTION);
  return docs.map((d) => normalize(d.id, d.fields)).sort(bySortIndex);
}

/**
 * Tools für die öffentliche Übersicht: Entwürfe werden ausgefiltert.
 * Fällt auf die statischen Daten aus `src/data/tools.ts` zurück, wenn
 * Firestore leer oder nicht erreichbar ist.
 */
export async function fetchPublicTools(): Promise<{
  tools: Tool[];
  source: ToolSource;
}> {
  try {
    // Ohne Anmeldung lesen – die Regeln erlauben öffentlichen Lesezugriff.
    const docs = await listDocuments(TOOLS_COLLECTION, { authentisiert: false });
    const visible = docs
      .map((d) => normalize(d.id, d.fields))
      .filter((t) => !t.hidden)
      .sort(bySortIndex);
    if (visible.length > 0) {
      return { tools: visible, source: "firestore" };
    }
  } catch (err) {
    console.warn("Firestore nicht erreichbar – nutze statische Tool-Daten", err);
  }
  return { tools: [...TOOLS].sort(bySortIndex), source: "static" };
}

/** Tool anlegen oder aktualisieren. Die Tool-ID ist die Dokument-ID. */
export async function saveTool(tool: Tool, editorEmail: string): Promise<void> {
  await setDocument(
    TOOLS_COLLECTION,
    tool.id,
    toFelder(tool, editorEmail),
    TOOL_FELDER
  );
}

export async function deleteTool(id: string): Promise<void> {
  await deleteDocument(TOOLS_COLLECTION, id);
}

export async function toolExists(id: string): Promise<boolean> {
  return (await getDocument(TOOLS_COLLECTION, id)) !== null;
}

/**
 * Einmalige Erstbefüllung: übernimmt die statischen Tools nach Firestore.
 * Bereits vorhandene Dokumente werden nicht überschrieben.
 */
export async function seedFromStatic(editorEmail: string): Promise<number> {
  const existing = new Set((await fetchAllTools()).map((t) => t.id));
  let written = 0;

  for (const [index, tool] of TOOLS.entries()) {
    if (existing.has(tool.id)) continue;
    await setDocument(
      TOOLS_COLLECTION,
      tool.id,
      toFelder({ ...tool, sortIndex: tool.sortIndex ?? index }, editorEmail),
      TOOL_FELDER
    );
    written++;
  }

  return written;
}

/** Ein Tool, dessen Inhalt in Firestore von der Projektdatei abweicht. */
export interface Abweichung {
  id: string;
  name: string;
  felder: string[];
}

/** Felder, die beim Abgleich verglichen werden (ohne Metadaten). */
const VERGLEICHSFELDER = TOOL_FELDER.filter(
  (f) => f !== "updatedAt" && f !== "updatedBy"
);

function gleich(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) =>
    v === undefined || v === null || v === "" || v === false ? null : v;
  const na = norm(a);
  const nb = norm(b);
  if (na === null && nb === null) return true;
  return JSON.stringify(na) === JSON.stringify(nb);
}

/**
 * Vergleicht Firestore mit der Projektdatei und listet auf, welche Tools
 * abweichen – damit vor dem Überschreiben sichtbar ist, was sich ändert.
 */
export async function findeAbweichungen(): Promise<{
  abweichend: Abweichung[];
  fehlend: string[];
  ueberzaehlig: string[];
}> {
  const vorhanden = new Map(
    (await fetchAllTools()).map((t) => [t.id, t as unknown as Record<string, unknown>])
  );
  const abweichend: Abweichung[] = [];
  const fehlend: string[] = [];

  for (const tool of TOOLS) {
    const ist = vorhanden.get(tool.id);
    if (!ist) {
      fehlend.push(tool.id);
      continue;
    }
    // art wie beim Schreiben vorbelegen, sonst meldet der Vergleich für jedes
    // Tool ohne ausdrückliche Angabe eine Abweichung.
    const soll = { ...tool, art: tool.art ?? "anwendung" } as unknown as Record<
      string,
      unknown
    >;
    const felder = VERGLEICHSFELDER.filter((f) => !gleich(ist[f], soll[f]));
    if (felder.length > 0) {
      abweichend.push({ id: tool.id, name: tool.name, felder });
    }
  }

  const inDatei = new Set(TOOLS.map((t) => t.id));
  const ueberzaehlig = [...vorhanden.keys()].filter((id) => !inDatei.has(id));

  return { abweichend, fehlend, ueberzaehlig };
}

/**
 * Überträgt die Tools aus der Projektdatei nach Firestore und überschreibt
 * abweichende Inhalte. Tools, die es nur in Firestore gibt, bleiben unberührt.
 * Gibt die IDs der geschriebenen Tools zurück.
 */
export async function syncFromStatic(editorEmail: string): Promise<string[]> {
  const { abweichend, fehlend } = await findeAbweichungen();
  const ids = [...abweichend.map((a) => a.id), ...fehlend];

  for (const id of ids) {
    const tool = TOOLS.find((t) => t.id === id);
    if (!tool) continue;
    const index = TOOLS.indexOf(tool);
    await setDocument(
      TOOLS_COLLECTION,
      id,
      toFelder({ ...tool, sortIndex: tool.sortIndex ?? index }, editorEmail),
      TOOL_FELDER
    );
  }

  return ids;
}

/** Prüft, ob die E-Mail in der Admin-Whitelist (Collection `admins`) steht. */
export async function isAdminEmail(email: string): Promise<boolean> {
  const doc = await getDocument(ADMINS_COLLECTION, email.toLowerCase());
  return doc !== null;
}
