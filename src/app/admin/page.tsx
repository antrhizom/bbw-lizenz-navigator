"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { firebaseKonfiguriert, getAuthClient } from "@/lib/firebase";
import {
  deleteTool,
  fetchAllTools,
  isAdminEmail,
  saveTool,
  seedFromStatic,
  toolExists,
} from "@/lib/tools-repo";
import { StoredTool, Tool } from "@/data/types";
import { TOOLS } from "@/data/tools";

const LIZENZ_VORSCHLAEGE = [
  "Kantonslizenz",
  "BBW-Schullizenz",
  "BBW-Schullizenz begrenzt",
  "Einzellizenz BBW",
  "Einzellizenz BBW (PIKT-Team)",
  "Kostenlos",
];

/** Bereits im Projekt vorhandene Anleitungs-PDFs als Auswahlhilfe. */
const PDF_PFADE = Array.from(
  new Set(
    TOOLS.flatMap((t) => (t.anleitungPdfs ?? []).map((p) => p.path))
  )
).sort();

const TYP_VORSCHLAEGE = Array.from(
  new Set(TOOLS.flatMap((t) => t.typ.split(",").map((s) => s.trim())))
)
  .filter(Boolean)
  .sort();

interface Draft {
  id: string;
  name: string;
  typ: string;
  ki: boolean;
  kiDetail: string;
  lernende: boolean;
  lernendeDetail: string;
  lp: boolean;
  lizenz: string;
  lizenzDetail: string;
  funcs: string;
  featuresText: string;
  zugang: string;
  einzellizenzInfo: string;
  website: string;
  anleitungPdfs: { label: string; path: string }[];
  beherrschen: boolean;
  behDesc: string;
  lernen: boolean;
  lernDesc: string;
  lpOrg: boolean;
  lpOrgDesc: string;
  lpVorb: boolean;
  lpVorbDesc: string;
  hidden: boolean;
  sortIndex: string;
}

const emptyDraft: Draft = {
  id: "",
  name: "",
  typ: "",
  ki: false,
  kiDetail: "",
  lernende: false,
  lernendeDetail: "",
  lp: true,
  lizenz: "",
  lizenzDetail: "",
  funcs: "",
  featuresText: "",
  zugang: "",
  einzellizenzInfo: "",
  website: "",
  anleitungPdfs: [],
  beherrschen: false,
  behDesc: "",
  lernen: false,
  lernDesc: "",
  lpOrg: false,
  lpOrgDesc: "",
  lpVorb: false,
  lpVorbDesc: "",
  hidden: false,
  sortIndex: "",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDraft(tool: StoredTool): Draft {
  return {
    id: tool.id,
    name: tool.name,
    typ: tool.typ,
    ki: tool.ki,
    kiDetail: tool.kiDetail ?? "",
    lernende: tool.lernende,
    lernendeDetail: tool.lernendeDetail ?? "",
    lp: tool.lp,
    lizenz: tool.lizenz,
    lizenzDetail: tool.lizenzDetail ?? "",
    funcs: tool.funcs,
    featuresText: tool.features.join("\n"),
    zugang: tool.zugang,
    einzellizenzInfo: tool.einzellizenzInfo ?? "",
    website: tool.website ?? "",
    anleitungPdfs: (tool.anleitungPdfs ?? []).map((p) => ({ ...p })),
    beherrschen: tool.beherrschen,
    behDesc: tool.behDesc,
    lernen: tool.lernen,
    lernDesc: tool.lernDesc,
    lpOrg: tool.lpOrg,
    lpOrgDesc: tool.lpOrgDesc,
    lpVorb: tool.lpVorb,
    lpVorbDesc: tool.lpVorbDesc,
    hidden: tool.hidden ?? false,
    sortIndex: tool.sortIndex !== undefined ? String(tool.sortIndex) : "",
  };
}

function toTool(draft: Draft): Tool {
  const trimmed = (v: string) => v.trim();
  const optional = (v: string) => (trimmed(v) ? trimmed(v) : undefined);
  const pdfs = draft.anleitungPdfs
    .map((p) => ({ label: trimmed(p.label), path: trimmed(p.path) }))
    .filter((p) => p.label && p.path);
  const sortIndex = Number.parseInt(draft.sortIndex, 10);

  return {
    id: slugify(draft.id),
    name: trimmed(draft.name),
    typ: trimmed(draft.typ),
    ki: draft.ki,
    kiDetail: optional(draft.kiDetail),
    lernende: draft.lernende,
    lernendeDetail: optional(draft.lernendeDetail),
    lp: draft.lp,
    lizenz: trimmed(draft.lizenz),
    lizenzDetail: trimmed(draft.lizenzDetail),
    funcs: trimmed(draft.funcs),
    features: draft.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean),
    zugang: trimmed(draft.zugang),
    einzellizenzInfo: optional(draft.einzellizenzInfo),
    website: optional(draft.website),
    anleitungPdfs: pdfs.length > 0 ? pdfs : undefined,
    beherrschen: draft.beherrschen,
    lernen: draft.lernen,
    lpOrg: draft.lpOrg,
    lpVorb: draft.lpVorb,
    behDesc: trimmed(draft.behDesc),
    lernDesc: trimmed(draft.lernDesc),
    lpOrgDesc: trimmed(draft.lpOrgDesc),
    lpVorbDesc: trimmed(draft.lpVorbDesc),
    hidden: draft.hidden,
    sortIndex: Number.isFinite(sortIndex) ? sortIndex : undefined,
  };
}

function validate(draft: Draft): string[] {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Name ist erforderlich.");
  if (!slugify(draft.id)) errors.push("Kurz-ID ist erforderlich.");
  if (!draft.lizenz.trim()) errors.push("Lizenzart ist erforderlich.");
  if (!draft.typ.trim()) errors.push("Tooltyp ist erforderlich.");
  if (draft.website.trim() && !/^https?:\/\//.test(draft.website.trim()))
    errors.push("Website muss mit http:// oder https:// beginnen.");
  draft.anleitungPdfs.forEach((p, i) => {
    if (p.path.trim() && !p.label.trim())
      errors.push(`Anleitung ${i + 1}: Bezeichnung fehlt.`);
    if (p.label.trim() && !p.path.trim())
      errors.push(`Anleitung ${i + 1}: Pfad fehlt.`);
  });
  return errors;
}

/* ---------------------------------------------------------------- Bausteine */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-bbw-text mb-1">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[0.65rem] text-bbw-muted mt-1">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-bbw-border rounded-lg text-sm outline-none focus:border-bbw-primary transition-colors bg-white";

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-bbw-primary"
      />
      {label}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border border-bbw-border rounded-xl p-4">
      <legend className="px-2 text-xs font-bold text-bbw-primary uppercase tracking-wide">
        {title}
      </legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

/** Firebase-Auth-Fehlercodes in verständliche Meldungen übersetzen. */
function authFehler(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-Mail oder Passwort ist falsch.";
    case "auth/invalid-email":
      return "Bitte eine gültige E-Mail-Adresse eingeben.";
    case "auth/missing-password":
      return "Bitte das Passwort eingeben.";
    case "auth/user-disabled":
      return "Dieses Konto ist deaktiviert.";
    case "auth/too-many-requests":
      return "Zu viele Fehlversuche. Bitte einige Minuten warten.";
    case "auth/network-request-failed":
      return "Keine Verbindung zum Anmeldedienst.";
    case "auth/operation-not-allowed":
      return "Die Anmeldung mit E-Mail und Passwort ist im Firebase-Projekt nicht aktiviert.";
    default:
      return `Anmeldung fehlgeschlagen${code ? ` (${code})` : ""}.`;
  }
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await signInWithEmailAndPassword(
        getAuthClient(),
        email.trim().toLowerCase(),
        password
      );
    } catch (err) {
      setError(authFehler(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Bitte zuerst die E-Mail-Adresse eingeben.");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await sendPasswordResetEmail(getAuthClient(), email.trim().toLowerCase());
      setInfo(
        "Falls für diese Adresse ein Konto besteht, wurde eine E-Mail zum Zurücksetzen verschickt."
      );
    } catch (err) {
      setError(authFehler(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-xl shadow-sm p-8 space-y-4"
      >
        <div>
          <h2 className="text-xl font-bold text-bbw-primary">Administration</h2>
          <p className="text-sm text-bbw-muted mt-1">
            Anmeldung für berechtigte Personen. Konten werden vom PIKT-Team
            eingerichtet.
          </p>
        </div>

        <Field label="E-Mail">
          <input
            type="email"
            autoComplete="username"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field label="Passwort">
          <input
            type="password"
            autoComplete="current-password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {info && (
          <p className="text-xs text-bbw-primary bg-bbw-primary-light rounded-lg px-3 py-2">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-bbw-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-bbw-primary-dark disabled:opacity-50 transition-colors"
        >
          {busy ? "Anmelden…" : "Anmelden"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={busy}
          className="w-full text-xs text-bbw-muted hover:text-bbw-primary hover:underline disabled:opacity-50"
        >
          Passwort vergessen?
        </button>
      </form>
    </div>
  );
}

function PasswortAendern({ onClose }: { onClose: () => void }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1.length < 10) {
      setError("Das Passwort muss mindestens 10 Zeichen lang sein.");
      return;
    }
    if (pw1 !== pw2) {
      setError("Die beiden Passwörter stimmen nicht überein.");
      return;
    }
    const current = getAuthClient().currentUser;
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      await updatePassword(current, pw1);
      setDone(true);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      setError(
        code === "auth/requires-recent-login"
          ? "Die Anmeldung ist zu lange her. Bitte abmelden, neu anmelden und erneut versuchen."
          : code === "auth/weak-password"
            ? "Das Passwort ist zu schwach."
            : `Änderung fehlgeschlagen${code ? ` (${code})` : ""}.`
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="bg-bbw-primary-light rounded-xl px-4 py-3 mb-4 text-sm text-bbw-primary flex items-center gap-3">
        Das Passwort wurde geändert.
        <button onClick={onClose} className="ml-auto text-xs font-semibold hover:underline">
          Schliessen
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-5 mb-4 space-y-3 max-w-md"
    >
      <h3 className="text-sm font-bold">Passwort ändern</h3>
      <Field label="Neues Passwort" hint="Mindestens 10 Zeichen.">
        <input
          type="password"
          autoComplete="new-password"
          className={inputClass}
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          required
        />
      </Field>
      <Field label="Neues Passwort wiederholen">
        <input
          type="password"
          autoComplete="new-password"
          className={inputClass}
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          required
        />
      </Field>
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="bg-bbw-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-bbw-primary-dark disabled:opacity-50 transition-colors"
        >
          {busy ? "Speichern…" : "Passwort speichern"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-bbw-muted hover:underline"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------- Seite */

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [adminFehler, setAdminFehler] = useState<string | null>(null);
  const [tools, setTools] = useState<StoredTool[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showPasswort, setShowPasswort] = useState(false);

  useEffect(() => {
    if (!firebaseKonfiguriert) {
      setAuthReady(true);
      return;
    }
    return onAuthStateChanged(getAuthClient(), (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  const loadTools = useCallback(async () => {
    try {
      setTools(await fetchAllTools());
    } catch (err) {
      setMessage({
        kind: "err",
        text: `Tools konnten nicht geladen werden: ${(err as Error).message}`,
      });
    }
  }, []);

  useEffect(() => {
    if (!user?.email) {
      setAdmin(null);
      setAdminFehler(null);
      return;
    }
    let active = true;
    setAdminFehler(null);
    isAdminEmail(user.email)
      .then((ok) => {
        if (!active) return;
        setAdmin(ok);
        if (ok) loadTools();
      })
      .catch((err) => {
        if (!active) return;
        // Wichtig: ein fehlgeschlagener Aufruf ist NICHT dasselbe wie «nicht
        // freigeschaltet». Den Originalfehler zeigen, sonst ist die Ursache
        // (Regeln, Verbindung, Projekt) nicht auffindbar.
        setAdmin(false);
        const code = err instanceof FirebaseError ? err.code : "";
        setAdminFehler(
          `${code || "Fehler"}: ${(err as Error).message ?? String(err)}`
        );
      });
    return () => {
      active = false;
    };
  }, [user, loadTools]);

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.typ.toLowerCase().includes(q) ||
        t.lizenz.toLowerCase().includes(q)
    );
  }, [tools, search]);

  const patch = (changes: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...changes } : d));

  const startNew = () => {
    setDraft({ ...emptyDraft, sortIndex: String(tools.length) });
    setIsNew(true);
    setErrors([]);
    setMessage(null);
  };

  const startEdit = (tool: StoredTool) => {
    setDraft(toDraft(tool));
    setIsNew(false);
    setErrors([]);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!draft || !user?.email) return;
    const found = validate(draft);
    if (found.length > 0) {
      setErrors(found);
      return;
    }
    const tool = toTool(draft);
    setBusy(true);
    try {
      if (isNew && (await toolExists(tool.id))) {
        setErrors([
          `Die Kurz-ID «${tool.id}» ist bereits vergeben. Bitte anpassen.`,
        ]);
        return;
      }
      await saveTool(tool, user.email);
      await loadTools();
      setDraft(null);
      setErrors([]);
      setMessage({
        kind: "ok",
        text: `«${tool.name}» wurde gespeichert.${tool.hidden ? " (Entwurf – noch nicht öffentlich sichtbar)" : ""}`,
      });
    } catch (err) {
      setMessage({ kind: "err", text: `Speichern fehlgeschlagen: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (tool: StoredTool) => {
    if (
      !window.confirm(
        `«${tool.name}» wirklich unwiderruflich löschen? Der Eintrag verschwindet aus der Lizenzübersicht.`
      )
    )
      return;
    setBusy(true);
    try {
      await deleteTool(tool.id);
      await loadTools();
      if (draft?.id === tool.id) setDraft(null);
      setMessage({ kind: "ok", text: `«${tool.name}» wurde gelöscht.` });
    } catch (err) {
      setMessage({ kind: "err", text: `Löschen fehlgeschlagen: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const handleSeed = async () => {
    if (!user?.email) return;
    if (
      !window.confirm(
        `Die ${TOOLS.length} bestehenden Tools aus der Projektdatei nach Firestore übernehmen? Vorhandene Einträge bleiben unverändert.`
      )
    )
      return;
    setBusy(true);
    try {
      const count = await seedFromStatic(user.email);
      await loadTools();
      setMessage({
        kind: "ok",
        text:
          count > 0
            ? `${count} Tool(s) übernommen.`
            : "Alle Tools sind bereits in Firestore vorhanden.",
      });
    } catch (err) {
      setMessage({ kind: "err", text: `Import fehlgeschlagen: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleHidden = async (tool: StoredTool) => {
    if (!user?.email) return;
    setBusy(true);
    try {
      await saveTool({ ...tool, hidden: !tool.hidden }, user.email);
      await loadTools();
    } catch (err) {
      setMessage({ kind: "err", text: `Änderung fehlgeschlagen: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------- Anmeldung */

  if (!firebaseKonfiguriert) {
    return (
      <div className="max-w-md mx-auto px-5 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm">
          <h2 className="font-bold text-amber-900 mb-2">
            Firebase ist nicht konfiguriert
          </h2>
          <p className="text-amber-800">
            Die Umgebungsvariablen <code>NEXT_PUBLIC_FIREBASE_*</code> fehlen.
            Lokal gehören sie in <code>.env.local</code>, für die Live-Version in
            die Vercel-Projekteinstellungen (Settings → Environment Variables).
            Danach ist ein erneuter Deploy nötig, weil die Werte beim Build
            eingesetzt werden.
          </p>
          <p className="text-amber-800 mt-2">
            Die Lizenzübersicht funktioniert weiterhin – sie zeigt in diesem
            Zustand die im Code hinterlegte Tool-Liste.
          </p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-16 text-sm text-bbw-muted">
        Anmeldestatus wird geprüft…
      </div>
    );
  }

  if (!user) {
    return <LoginCard />;
  }

  if (admin === null) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-16 text-sm text-bbw-muted">
        Berechtigung wird geprüft…
      </div>
    );
  }

  if (admin === false) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {adminFehler ? (
            <>
              <h2 className="text-xl font-bold text-bbw-text mb-2">
                Berechtigung konnte nicht geprüft werden
              </h2>
              <p className="text-sm text-bbw-muted">
                Die Abfrage von <code>admins/{user.email?.toLowerCase()}</code>{" "}
                in Firestore ist fehlgeschlagen. Das heisst <em>nicht</em>, dass
                das Konto nicht freigeschaltet ist – die Prüfung selbst kam nicht
                durch.
              </p>
              <p className="mt-3 text-xs font-mono bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-800 break-words">
                {adminFehler}
              </p>
              <ul className="mt-3 text-xs text-bbw-muted space-y-1">
                <li>
                  • <code>permission-denied</code>: Die Firestore-Regeln lassen
                  den Lesezugriff auf das eigene <code>admins</code>-Dokument
                  nicht zu.
                </li>
                <li>
                  • <code>unavailable</code> / <code>failed-precondition</code>:
                  Firestore ist im Projekt nicht erreichbar oder nicht angelegt.
                </li>
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-bbw-text mb-2">
                Kein Zugriff
              </h2>
              <p className="text-sm text-bbw-muted">
                Die Prüfung war erfolgreich, aber für{" "}
                <strong>{user.email}</strong> existiert kein Dokument{" "}
                <code>admins/{user.email?.toLowerCase()}</code>. Die
                Freischaltung erfolgt durch das PIKT-Team.
              </p>
            </>
          )}
          <button
            onClick={() => signOut(getAuthClient())}
            className="mt-6 text-sm text-bbw-primary font-semibold hover:underline"
          >
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- Adminview */

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-bbw-primary">
          Administration – Tools &amp; Lizenzen
        </h2>
        <div className="ml-auto flex items-center gap-3 text-xs text-bbw-muted">
          <span>{user.email}</span>
          <button
            onClick={() => setShowPasswort((v) => !v)}
            className="text-bbw-primary font-semibold hover:underline"
          >
            Passwort ändern
          </button>
          <button
            onClick={() => signOut(getAuthClient())}
            className="text-bbw-primary font-semibold hover:underline"
          >
            Abmelden
          </button>
        </div>
      </div>

      {showPasswort && (
        <PasswortAendern onClose={() => setShowPasswort(false)} />
      )}

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.kind === "ok"
              ? "bg-bbw-primary-light text-bbw-primary"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {tools.length === 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-amber-900 mb-1">
            Noch keine Tools in der Datenbank
          </h3>
          <p className="text-xs text-amber-800 mb-3">
            Die Lizenzübersicht zeigt momentan die {TOOLS.length} Tools aus der
            Projektdatei an. Übernimm sie einmalig nach Firestore, damit sie hier
            bearbeitet werden können.
          </p>
          <button
            onClick={handleSeed}
            disabled={busy}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {TOOLS.length} bestehende Tools übernehmen
          </button>
        </div>
      )}

      {/* Liste */}
      {!draft && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Tool suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} max-w-xs`}
            />
            <span className="text-xs text-bbw-muted">
              {filteredTools.length} von {tools.length}
            </span>
            <button
              onClick={startNew}
              className="ml-auto bg-bbw-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-bbw-primary-dark transition-colors"
            >
              + Neues Tool erfassen
            </button>
          </div>

          {filteredTools.length === 0 ? (
            <p className="text-sm text-bbw-muted py-8 text-center">
              Keine Einträge gefunden.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-bbw-muted border-b border-bbw-border">
                    <th className="py-2 pr-3 font-semibold">Name</th>
                    <th className="py-2 pr-3 font-semibold">Typ</th>
                    <th className="py-2 pr-3 font-semibold">Lizenz</th>
                    <th className="py-2 pr-3 font-semibold">Zielgruppe</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 font-semibold text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.map((tool) => (
                    <tr
                      key={tool.id}
                      className="border-b border-bbw-border last:border-0 hover:bg-bbw-bg"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold flex items-center gap-1.5">
                          {tool.name}
                          {tool.ki && (
                            <span className="text-[0.55rem] px-1 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                              KI
                            </span>
                          )}
                        </div>
                        <div className="text-[0.65rem] text-bbw-muted">
                          {tool.id}
                          {tool.updatedBy && ` · ${tool.updatedBy}`}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-bbw-muted max-w-[14rem]">
                        {tool.typ}
                      </td>
                      <td className="py-2.5 pr-3 text-xs">{tool.lizenz}</td>
                      <td className="py-2.5 pr-3 text-xs">
                        {[tool.lernende && "Lernende", tool.lp && "LP"]
                          .filter(Boolean)
                          .join(", ") || "–"}
                      </td>
                      <td className="py-2.5 pr-3">
                        <button
                          onClick={() => handleToggleHidden(tool)}
                          disabled={busy}
                          title="Sichtbarkeit umschalten"
                          className={`text-[0.65rem] px-2 py-0.5 rounded-full font-semibold disabled:opacity-50 ${
                            tool.hidden
                              ? "bg-gray-200 text-gray-700"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {tool.hidden ? "Entwurf" : "öffentlich"}
                        </button>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => startEdit(tool)}
                          className="text-xs text-bbw-primary font-semibold hover:underline"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(tool)}
                          disabled={busy}
                          className="ml-3 text-xs text-red-700 font-semibold hover:underline disabled:opacity-50"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tools.length > 0 && (
            <div className="mt-4 pt-4 border-t border-bbw-border">
              <button
                onClick={handleSeed}
                disabled={busy}
                className="text-xs text-bbw-muted hover:text-bbw-primary hover:underline disabled:opacity-50"
              >
                Fehlende Tools aus der Projektdatei nachimportieren
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formular */}
      {draft && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">
              {isNew ? "Neues Tool erfassen" : `«${draft.name}» bearbeiten`}
            </h3>
            <button
              onClick={() => {
                setDraft(null);
                setErrors([]);
              }}
              className="ml-auto text-xs text-bbw-muted hover:underline"
            >
              Abbrechen
            </button>
          </div>

          {errors.length > 0 && (
            <ul className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700 space-y-1">
              {errors.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          )}

          <Section title="Grunddaten">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name *">
                <input
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    patch(
                      isNew ? { name, id: slugify(name) } : { name }
                    );
                  }}
                  placeholder="z. B. Canva für Bildung"
                />
              </Field>
              <Field
                label="Kurz-ID *"
                hint={
                  isNew
                    ? "Wird automatisch aus dem Namen gebildet, nur Kleinbuchstaben und Bindestriche."
                    : "Die ID kann nach dem Anlegen nicht mehr geändert werden."
                }
              >
                <input
                  className={`${inputClass} ${!isNew ? "bg-gray-100 text-bbw-muted" : ""}`}
                  value={draft.id}
                  disabled={!isNew}
                  onChange={(e) => patch({ id: e.target.value })}
                />
              </Field>
            </div>

            <Field
              label="Tooltyp *"
              hint="Mehrere Kategorien mit Komma trennen – sie erscheinen als Filter in der Übersicht."
            >
              <input
                className={inputClass}
                value={draft.typ}
                list="typ-vorschlaege"
                onChange={(e) => patch({ typ: e.target.value })}
                placeholder="z. B. Mediengestaltung, KI-Assistenz"
              />
              <datalist id="typ-vorschlaege">
                {TYP_VORSCHLAEGE.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>

            <Field label="Kurzbeschrieb der Funktionen">
              <input
                className={inputClass}
                value={draft.funcs}
                onChange={(e) => patch({ funcs: e.target.value })}
                placeholder="z. B. Grafiken erstellen, Präsentationen, Videoschnitt"
              />
            </Field>

            <Field label="Website">
              <input
                className={inputClass}
                value={draft.website}
                onChange={(e) => patch({ website: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          </Section>

          <Section title="Lizenz & Zugang">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Lizenzart *" hint="Steuert die Filterkategorie in der Übersicht.">
                <input
                  className={inputClass}
                  value={draft.lizenz}
                  list="lizenz-vorschlaege"
                  onChange={(e) => patch({ lizenz: e.target.value })}
                  placeholder="z. B. BBW-Schullizenz"
                />
                <datalist id="lizenz-vorschlaege">
                  {LIZENZ_VORSCHLAEGE.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </Field>
              <Field label="Hinweis zur Lizenz">
                <input
                  className={inputClass}
                  value={draft.lizenzDetail}
                  onChange={(e) => patch({ lizenzDetail: e.target.value })}
                  placeholder="z. B. begrenzte Anzahl Plätze"
                />
              </Field>
            </div>

            <Field label="Wie erhält man Zugang?">
              <textarea
                className={inputClass}
                rows={2}
                value={draft.zugang}
                onChange={(e) => patch({ zugang: e.target.value })}
                placeholder="z. B. Anmeldung beim PIKT-Team, Login via Schulkonto"
              />
            </Field>

            <Field
              label="Hinweis Einzellizenz"
              hint="Erscheint als gelber Warnhinweis – nur bei nicht teilbaren Einzellizenzen ausfüllen."
            >
              <textarea
                className={inputClass}
                rows={2}
                value={draft.einzellizenzInfo}
                onChange={(e) => patch({ einzellizenzInfo: e.target.value })}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Check
                  label="Nutzt KI"
                  checked={draft.ki}
                  onChange={(ki) => patch({ ki })}
                />
                {draft.ki && (
                  <input
                    className={inputClass}
                    value={draft.kiDetail}
                    onChange={(e) => patch({ kiDetail: e.target.value })}
                    placeholder="KI-Detail (optional)"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Check
                  label="Für Lernende"
                  checked={draft.lernende}
                  onChange={(lernende) => patch({ lernende })}
                />
                {draft.lernende && (
                  <input
                    className={inputClass}
                    value={draft.lernendeDetail}
                    onChange={(e) => patch({ lernendeDetail: e.target.value })}
                    placeholder="Bedingung (optional)"
                  />
                )}
              </div>
              <Check
                label="Für Lehrpersonen"
                checked={draft.lp}
                onChange={(lp) => patch({ lp })}
              />
            </div>
          </Section>

          <Section title="Funktionsliste">
            <Field label="Features" hint="Eine Funktion pro Zeile.">
              <textarea
                className={`${inputClass} font-mono text-xs`}
                rows={7}
                value={draft.featuresText}
                onChange={(e) => patch({ featuresText: e.target.value })}
                placeholder={"Vorlagen für Präsentationen\nKollaboratives Bearbeiten\nExport als PDF"}
              />
            </Field>
          </Section>

          <Section title="Anleitungen (PDF)">
            <p className="text-[0.65rem] text-bbw-muted">
              PDFs liegen im Projekt unter <code>public/anleitungen/</code>. Der
              Pfad beginnt mit <code>/anleitungen/</code>. Neue PDF-Dateien
              müssen weiterhin im Repository abgelegt und deployt werden.
            </p>
            {draft.anleitungPdfs.map((pdf, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-start">
                <input
                  className={`${inputClass} flex-1 min-w-[12rem]`}
                  value={pdf.label}
                  onChange={(e) => {
                    const next = [...draft.anleitungPdfs];
                    next[i] = { ...next[i], label: e.target.value };
                    patch({ anleitungPdfs: next });
                  }}
                  placeholder="Bezeichnung"
                />
                <input
                  className={`${inputClass} flex-1 min-w-[12rem]`}
                  value={pdf.path}
                  list="pdf-pfade"
                  onChange={(e) => {
                    const next = [...draft.anleitungPdfs];
                    next[i] = { ...next[i], path: e.target.value };
                    patch({ anleitungPdfs: next });
                  }}
                  placeholder="/anleitungen/datei.pdf"
                />
                <button
                  onClick={() =>
                    patch({
                      anleitungPdfs: draft.anleitungPdfs.filter(
                        (_, idx) => idx !== i
                      ),
                    })
                  }
                  className="text-xs text-red-700 font-semibold hover:underline py-2"
                >
                  Entfernen
                </button>
              </div>
            ))}
            <datalist id="pdf-pfade">
              {PDF_PFADE.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <button
              onClick={() =>
                patch({
                  anleitungPdfs: [
                    ...draft.anleitungPdfs,
                    { label: "", path: "" },
                  ],
                })
              }
              className="text-xs text-bbw-primary font-semibold hover:underline"
            >
              + Anleitung hinzufügen
            </button>
          </Section>

          <Section title="Kompetenzen (Zugang & Rollen)">
            <div className="space-y-3">
              {(
                [
                  ["beherrschen", "behDesc", "Lernende müssen es beherrschen"],
                  ["lernen", "lernDesc", "Lernende lernen damit"],
                  ["lpOrg", "lpOrgDesc", "LP: Unterrichtsorganisation"],
                  ["lpVorb", "lpVorbDesc", "LP: Unterrichtsvorbereitung"],
                ] as const
              ).map(([flag, descKey, label]) => (
                <div key={flag} className="space-y-2">
                  <Check
                    label={label}
                    checked={draft[flag]}
                    onChange={(v) => patch({ [flag]: v } as Partial<Draft>)}
                  />
                  {draft[flag] && (
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={draft[descKey]}
                      onChange={(e) =>
                        patch({ [descKey]: e.target.value } as Partial<Draft>)
                      }
                      placeholder="Beschreibung"
                    />
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Veröffentlichung">
            <div className="grid gap-3 sm:grid-cols-2">
              <Check
                label="Als Entwurf behalten (nicht öffentlich sichtbar)"
                checked={draft.hidden}
                onChange={(hidden) => patch({ hidden })}
              />
              <Field
                label="Sortierposition"
                hint="Leer lassen für alphabetische Einordnung am Ende."
              >
                <input
                  className={inputClass}
                  type="number"
                  value={draft.sortIndex}
                  onChange={(e) => patch({ sortIndex: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-bbw-border">
            <button
              onClick={handleSave}
              disabled={busy}
              className="bg-bbw-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-bbw-primary-dark disabled:opacity-50 transition-colors"
            >
              {busy ? "Speichern…" : "Speichern"}
            </button>
            <button
              onClick={() => {
                setDraft(null);
                setErrors([]);
              }}
              className="text-sm text-bbw-muted hover:underline"
            >
              Abbrechen
            </button>
            <span className="text-xs text-bbw-muted ml-auto">
              Änderungen sind sofort in der Lizenzübersicht sichtbar.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
