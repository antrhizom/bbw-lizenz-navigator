import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { Tool, StoredTool } from "@/data/types";
import { TOOLS } from "@/data/tools";

export const TOOLS_COLLECTION = "tools";
export const ADMINS_COLLECTION = "admins";

export type ToolSource = "firestore" | "static";

/** Firestore akzeptiert keine `undefined`-Werte – vor dem Schreiben entfernen. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

/** Rohdaten aus Firestore in einen vollständigen Tool-Datensatz überführen. */
function normalize(id: string, raw: Record<string, unknown>): StoredTool {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v : fallback;
  const bool = (v: unknown) => v === true;

  const updatedAt =
    raw.updatedAt instanceof Timestamp
      ? raw.updatedAt.toDate().toISOString()
      : typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : undefined;

  return {
    id,
    name: str(raw.name, id),
    typ: str(raw.typ),
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
    updatedAt,
    updatedBy: typeof raw.updatedBy === "string" ? raw.updatedBy : undefined,
  };
}

function bySortIndex(a: Tool, b: Tool): number {
  const ai = a.sortIndex ?? Number.MAX_SAFE_INTEGER;
  const bi = b.sortIndex ?? Number.MAX_SAFE_INTEGER;
  if (ai !== bi) return ai - bi;
  return a.name.localeCompare(b.name, "de-CH");
}

/**
 * Alle Tools inkl. Entwürfe – für die Adminseite.
 * Wirft, wenn Firestore nicht erreichbar ist.
 */
export async function fetchAllTools(): Promise<StoredTool[]> {
  const snap = await getDocs(collection(getDb(), TOOLS_COLLECTION));
  return snap.docs
    .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
    .sort(bySortIndex);
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
    const all = await fetchAllTools();
    const visible = all.filter((t) => !t.hidden);
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
  const { id, ...rest } = tool;
  await setDoc(
    doc(getDb(), TOOLS_COLLECTION, id),
    stripUndefined({
      ...rest,
      updatedAt: Timestamp.now(),
      updatedBy: editorEmail,
    }),
    { merge: false }
  );
}

export async function deleteTool(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), TOOLS_COLLECTION, id));
}

export async function toolExists(id: string): Promise<boolean> {
  const snap = await getDoc(doc(getDb(), TOOLS_COLLECTION, id));
  return snap.exists();
}

/**
 * Einmalige Erstbefüllung: übernimmt die statischen Tools nach Firestore.
 * Bereits vorhandene Dokumente werden nicht überschrieben.
 */
export async function seedFromStatic(editorEmail: string): Promise<number> {
  const existing = new Set((await fetchAllTools()).map((t) => t.id));
  const batch = writeBatch(getDb());
  let written = 0;

  TOOLS.forEach((tool, index) => {
    if (existing.has(tool.id)) return;
    const { id, ...rest } = tool;
    batch.set(
      doc(getDb(), TOOLS_COLLECTION, id),
      stripUndefined({
        ...rest,
        sortIndex: rest.sortIndex ?? index,
        updatedAt: Timestamp.now(),
        updatedBy: editorEmail,
      })
    );
    written++;
  });

  if (written > 0) await batch.commit();
  return written;
}

/** Prüft, ob die E-Mail in der Admin-Whitelist (Collection `admins`) steht. */
export async function isAdminEmail(email: string): Promise<boolean> {
  const snap = await getDoc(
    doc(getDb(), ADMINS_COLLECTION, email.toLowerCase())
  );
  return snap.exists();
}
