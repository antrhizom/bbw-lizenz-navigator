"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ladeStatistik,
  MonatsStatistik,
  nachKategorie,
  summiere,
} from "@/lib/statistik";
import { StoredTool } from "@/data/types";

/** Balkenliste – zeigt Verhältnisse ohne Diagrammbibliothek. */
function Balken({
  eintraege,
  leerText,
  farbe = "bg-bbw-primary",
}: {
  eintraege: { label: string; anzahl: number; zusatz?: string }[];
  leerText: string;
  farbe?: string;
}) {
  if (eintraege.length === 0) {
    return <p className="text-xs text-bbw-muted py-2">{leerText}</p>;
  }
  const max = Math.max(...eintraege.map((e) => e.anzahl));

  return (
    <ul className="space-y-1.5">
      {eintraege.map((e) => (
        <li key={e.label}>
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate" title={e.label}>
              {e.label}
              {e.zusatz && (
                <span className="text-bbw-muted"> · {e.zusatz}</span>
              )}
            </span>
            <span className="font-bold tabular-nums shrink-0">{e.anzahl}</span>
          </div>
          <div className="h-1.5 bg-bbw-bg rounded-full mt-0.5 overflow-hidden">
            <div
              className={`h-full ${farbe} rounded-full`}
              style={{ width: `${Math.max(3, (e.anzahl / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const SEITEN_NAMEN: Record<string, string> = {
  "/": "EdTech Soft (Startseite)",
  "/geraete": "EdTech Hard",
  "/paedagogik": "Pädagogik / Didaktik",
  "/abklaerung": "Abklärung & Anschaffung",
  "/zugang": "Zugang & Rollen",
};

const AKTION_NAMEN: Record<string, string> = {
  features: "Features aufgeklappt",
  link: "Link geöffnet",
  anleitung: "Anleitung geöffnet",
};

export function Dashboard({ tools }: { tools: StoredTool[] }) {
  const [monate, setMonate] = useState<MonatsStatistik[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [auswahl, setAuswahl] = useState<string>("alle");

  useEffect(() => {
    ladeStatistik()
      .then(setMonate)
      .catch((err) => setFehler((err as Error).message));
  }, []);

  const zaehler = useMemo(() => {
    if (!monate) return {};
    const gewaehlt =
      auswahl === "alle" ? monate : monate.filter((m) => m.monat === auswahl);
    return summiere(gewaehlt);
  }, [monate, auswahl]);

  const toolName = (id: string) => tools.find((t) => t.id === id)?.name ?? id;

  const seiten = useMemo(
    () =>
      nachKategorie(zaehler, "seite").map((e) => ({
        label: SEITEN_NAMEN[e.wert] ?? e.wert,
        anzahl: e.anzahl,
      })),
    [zaehler]
  );

  // Tool-Schlüssel sind «toolId:aktion» – für die Rangliste pro Tool summieren.
  const toolSummen = useMemo(() => {
    const summe: Record<string, number> = {};
    for (const e of nachKategorie(zaehler, "tool")) {
      const id = e.wert.split(":")[0];
      summe[id] = (summe[id] ?? 0) + e.anzahl;
    }
    return Object.entries(summe)
      .map(([id, anzahl]) => ({ label: toolName(id), anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl)
      .slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zaehler, tools]);

  const aktionen = useMemo(() => {
    const summe: Record<string, number> = {};
    for (const e of nachKategorie(zaehler, "tool")) {
      const aktion = e.wert.split(":")[1] ?? "unbekannt";
      summe[aktion] = (summe[aktion] ?? 0) + e.anzahl;
    }
    return Object.entries(summe)
      .map(([a, anzahl]) => ({ label: AKTION_NAMEN[a] ?? a, anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl);
  }, [zaehler]);

  const funktionen = useMemo(
    () =>
      nachKategorie(zaehler, "funktion").map((e) => ({
        label: e.wert,
        anzahl: e.anzahl,
      })),
    [zaehler]
  );

  const seitenTotal = seiten.reduce((s, e) => s + e.anzahl, 0);

  if (fehler) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h3 className="text-sm font-bold mb-1">Nutzung</h3>
        <p className="text-xs text-red-700">
          Statistik konnte nicht geladen werden: {fehler}
        </p>
        <p className="text-[0.65rem] text-bbw-muted mt-1">
          Falls «permission-denied»: die aktualisierten Firestore-Regeln sind
          noch nicht veröffentlicht.
        </p>
      </div>
    );
  }

  if (!monate) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 text-xs text-bbw-muted">
        Nutzungsdaten werden geladen…
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="text-sm font-bold">Nutzung</h3>
        <span className="text-xs text-bbw-muted">
          {seitenTotal} Seitenaufrufe
        </span>
        <select
          value={auswahl}
          onChange={(e) => setAuswahl(e.target.value)}
          className="ml-auto px-2 py-1 border border-bbw-border rounded-lg text-xs bg-white"
        >
          <option value="alle">Alle Monate</option>
          {monate.map((m) => (
            <option key={m.monat} value={m.monat}>
              {m.monat}
            </option>
          ))}
        </select>
      </div>

      {seitenTotal === 0 && funktionen.length === 0 ? (
        <p className="text-xs text-bbw-muted">
          Noch keine Daten. Gezählt wird ab dem nächsten Besuch der Seiten –
          Aufrufe der Adminseite werden bewusst nicht mitgezählt.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="text-xs font-bold text-bbw-muted uppercase tracking-wide mb-2">
              Seiten
            </h4>
            <Balken eintraege={seiten} leerText="Noch keine Aufrufe." />
          </div>

          <div>
            <h4 className="text-xs font-bold text-bbw-muted uppercase tracking-wide mb-2">
              Meistgenutzte Tools
            </h4>
            <Balken
              eintraege={toolSummen}
              leerText="Noch keine Tool-Interaktionen."
              farbe="bg-bbw-purple"
            />
          </div>

          <div>
            <h4 className="text-xs font-bold text-bbw-muted uppercase tracking-wide mb-2">
              Art der Tool-Nutzung
            </h4>
            <Balken
              eintraege={aktionen}
              leerText="Noch keine Tool-Interaktionen."
              farbe="bg-blue-600"
            />
          </div>

          <div>
            <h4 className="text-xs font-bold text-bbw-muted uppercase tracking-wide mb-2">
              Funktionen
            </h4>
            <Balken
              eintraege={funktionen}
              leerText="Noch keine Funktionsnutzung."
              farbe="bg-amber-600"
            />
          </div>
        </div>
      )}

      <p className="text-[0.65rem] text-bbw-muted mt-4 pt-3 border-t border-bbw-border">
        Gezählt werden anonyme Summen pro Monat – keine Kennungen, keine
        Sitzungen, keine Zuordnung zu Personen. Aufrufe der Adminseite zählen
        nicht mit.
      </p>
    </div>
  );
}
