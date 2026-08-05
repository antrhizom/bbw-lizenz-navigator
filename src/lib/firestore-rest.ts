/**
 * Minimaler Firestore-Zugriff über die REST-Schnittstelle.
 *
 * Warum nicht das Firestore-SDK? Im BBW-Netz bekommt das SDK seine
 * Verbindung nicht auf und meldet «Failed to get document because the client
 * is offline» (Code `unavailable`) – auch mit erzwungenem Long Polling.
 * Gewöhnliche HTTPS-Requests auf `firestore.googleapis.com` funktionieren dort
 * dagegen nachweislich. Diese App braucht keine Live-Updates, deshalb genügt
 * REST vollständig.
 *
 * Authentisierung: das Firebase-ID-Token des angemeldeten Kontos wird als
 * Bearer-Token mitgeschickt. Die Firestore-Regeln greifen damit unverändert
 * (`request.auth.token.email`).
 */

import { getAuthClient } from "./firebase";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** Fehler mit Firebase-ähnlichem Code, damit die Oberfläche ihn benennen kann. */
export class FirestoreRestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "FirestoreRestError";
    this.code = code;
  }
}

type FsValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue: { values?: FsValue[] } }
  | { mapValue: { fields?: Record<string, FsValue> } };

export interface FsDocument {
  id: string;
  fields: Record<string, unknown>;
}

/** Marker, damit ein Wert als Firestore-Zeitstempel geschrieben wird. */
export class FsTimestamp {
  constructor(public readonly iso: string) {}
  static jetztIso(): FsTimestamp {
    return new FsTimestamp(new Date().toISOString());
  }
}

function encode(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof FsTimestamp) return { timestampValue: value.iso };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encode) } };
  }
  if (typeof value === "object") {
    const fields: Record<string, FsValue> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) fields[key] = encode(val);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function decode(value: unknown): unknown {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) {
    const inner = (v.arrayValue as { values?: unknown[] })?.values ?? [];
    return inner.map(decode);
  }
  if ("mapValue" in v) {
    const fields =
      (v.mapValue as { fields?: Record<string, unknown> })?.fields ?? {};
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) out[key] = decode(val);
    return out;
  }
  return undefined;
}

function decodeFields(fields: Record<string, unknown> | undefined) {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields ?? {})) out[key] = decode(val);
  return out;
}

/** ID-Token des angemeldeten Kontos, oder null für öffentliche Zugriffe. */
async function idToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const user = getAuthClient().currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (err) {
    throw new FirestoreRestError(
      "unauthenticated",
      `Anmeldetoken konnte nicht abgerufen werden: ${(err as Error).message}`
    );
  }
}

async function request(
  pfad: string,
  init: RequestInit & { authentisiert?: boolean } = {}
): Promise<unknown> {
  if (!PROJECT_ID) {
    throw new FirestoreRestError(
      "failed-precondition",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID ist nicht gesetzt."
    );
  }

  const { authentisiert = true, headers, ...rest } = init;
  const kopf: Record<string, string> = {
    "Content-Type": "application/json",
    ...((headers as Record<string, string>) ?? {}),
  };

  if (authentisiert) {
    const token = await idToken();
    if (token) kopf.Authorization = `Bearer ${token}`;
  }

  const trenner = pfad.includes("?") ? "&" : "?";
  const url = `${BASE}${pfad}${API_KEY ? `${trenner}key=${encodeURIComponent(API_KEY)}` : ""}`;

  let antwort: Response;
  try {
    antwort = await fetch(url, { ...rest, headers: kopf });
  } catch (err) {
    throw new FirestoreRestError(
      "unavailable",
      `Keine Verbindung zu Firestore: ${(err as Error).message}`
    );
  }

  if (antwort.status === 404) return null;

  const text = await antwort.text();
  const daten = text ? JSON.parse(text) : {};

  if (!antwort.ok) {
    const fehler = (daten as { error?: { status?: string; message?: string } })
      .error;
    const status = fehler?.status ?? String(antwort.status);
    const code =
      status === "PERMISSION_DENIED"
        ? "permission-denied"
        : status === "UNAUTHENTICATED"
          ? "unauthenticated"
          : status === "NOT_FOUND"
            ? "not-found"
            : status === "UNAVAILABLE"
              ? "unavailable"
              : "unknown";
    throw new FirestoreRestError(
      code,
      fehler?.message ?? `HTTP ${antwort.status}`
    );
  }

  return daten;
}

/** Alle Dokumente einer Collection lesen (mit Seitenwechsel). */
export async function listDocuments(
  collection: string,
  options: { authentisiert?: boolean } = {}
): Promise<FsDocument[]> {
  const alle: FsDocument[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "300" });
    if (pageToken) query.set("pageToken", pageToken);
    const daten = (await request(`/${collection}?${query}`, {
      method: "GET",
      authentisiert: options.authentisiert ?? true,
    })) as {
      documents?: { name: string; fields?: Record<string, unknown> }[];
      nextPageToken?: string;
    } | null;

    for (const doc of daten?.documents ?? []) {
      alle.push({
        id: decodeURIComponent(doc.name.split("/").pop() ?? ""),
        fields: decodeFields(doc.fields),
      });
    }
    pageToken = daten?.nextPageToken;
  } while (pageToken);

  return alle;
}

/** Einzelnes Dokument lesen; null, wenn es nicht existiert. */
export async function getDocument(
  collection: string,
  id: string
): Promise<FsDocument | null> {
  const daten = (await request(
    `/${collection}/${encodeURIComponent(id)}`,
    { method: "GET" }
  )) as { name: string; fields?: Record<string, unknown> } | null;
  if (!daten) return null;
  return { id, fields: decodeFields(daten.fields) };
}

/**
 * Dokument schreiben. `felder` ersetzt den Inhalt vollständig: alle Namen aus
 * `bekannteFelder` stehen in der updateMask, damit weggelassene Felder auch
 * tatsächlich entfernt werden (entspricht setDoc ohne merge).
 */
export async function setDocument(
  collection: string,
  id: string,
  felder: Record<string, unknown>,
  bekannteFelder: string[]
): Promise<void> {
  const maske = bekannteFelder
    .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join("&");

  const fields: Record<string, FsValue> = {};
  for (const [key, val] of Object.entries(felder)) {
    if (val !== undefined) fields[key] = encode(val);
  }

  await request(`/${collection}/${encodeURIComponent(id)}?${maske}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

export async function deleteDocument(
  collection: string,
  id: string
): Promise<void> {
  await request(`/${collection}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
