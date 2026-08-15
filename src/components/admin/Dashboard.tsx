"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ladeStatistik,
  loescheStatistik,
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

/** Rohe Funktionsschlüssel in lesbare Bezeichnungen übersetzen. */
const FILTER_NAMEN: Record<string, string> = {
  lizenzKategorie: "Lizenz / Verfügbarkeit",
  ki: "KI",
  lernende: "Lernende",
  lp: "Lehrpersonen",
  toolTyp: "Tooltyp",
  search: "Suchfeld",
};

function funktionsName(schluessel: string): string {
  const [art, rest] = schluessel.split(/:(.+)/);
  switch (art) {
    case "pdf-export":
      return `PDF-Export (${rest})`;
    case "filter":
      return `Filter: ${FILTER_NAMEN[rest] ?? rest}`;
    case "register":
      return `Register gewechselt: ${rest}`;
    case "suche":
      return "Suche benutzt";
    case "support-knopf":
      return "Support-Knopf";
    case "anfrage-individuelle-loesung":
      return "Anfrage «individuelle Lösung»";
    case "nutzungsrichtlinie-geoeffnet":
      return "Nutzungsrichtlinie geöffnet";
    default:
      return schluessel;
  }
}

export function Dashboard({ tools }: { tools: StoredTool[] }) {
  const [monate, setMonate] = useState<MonatsStatistik[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [auswahl, setAuswahl] = useState<string>("alle");
  const [loeschtGerade, setLoeschtGerade] = useState(false);

  const zahlenLoeschen = async () => {
    const was = auswahl === "alle" ? "alle Monate" : auswahl;
    if (
      !window.confirm(
        `Die Nutzungszahlen für ${was} unwiderruflich löschen? Die Zählung startet danach bei null.`
      )
    )
      return;
    setLoeschtGerade(true);
    try {
      await loescheStatistik(auswahl === "alle" ? undefined : auswahl);
      setMonate(await ladeStatistik());
      setAuswahl("alle");
    } catch (err) {
      setFehler((err as Error).message);
    } finally {
      setLoeschtGerade(false);
    }
  };

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

  /**
   * Tool-Schlüssel sind «toolId:aktion». Eine Zeile pro Tool mit einer Spalte
   * je Aktion – so ist sichtbar, ob ein Tool nur angeschaut oder auch geöffnet
   * wurde. Die frühere Trennung in zwei Listen liess genau das offen.
   */
  const toolZeilen = useMemo(() => {
    const proTool: Record<
      string,
      { features: number; link: number; anleitung: number; total: number }
    > = {};
    for (const e of nachKategorie(zaehler, "tool")) {
      const [id, aktion] = e.wert.split(/:(.+)/);
      const zeile = (proTool[id] ??= {
        features: 0,
        link: 0,
        anleitung: 0,
        total: 0,
      });
      if (aktion === "features") zeile.features += e.anzahl;
      else if (aktion === "link") zeile.link += e.anzahl;
      else if (aktion === "anleitung") zeile.anleitung += e.anzahl;
      zeile.total += e.anzahl;
    }
    return Object.entries(proTool)
      .map(([id, z]) => ({ id, name: toolName(id), ...z }))
      .sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zaehler, tools]);

  const aktionsSummen = useMemo(() => {
    const s = { features: 0, link: 0, anleitung: 0 };
    for (const z of toolZeilen) {
      s.features += z.features;
      s.link += z.link;
      s.anleitung += z.anleitung;
    }
    return s;
  }, [toolZeilen]);

  const funktionen = useMemo(
    () =>
      nachKategorie(zaehler, "funktion").map((e) => ({
        label: funktionsName(e.wert),
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
        <button
          onClick={zahlenLoeschen}
          disabled={loeschtGerade || monate.length === 0}
          title="Löscht die gezählten Werte des gewählten Zeitraums. Die Tools und Einstellungen bleiben unberührt."
          className="ml-auto text-xs text-bbw-muted hover:text-red-700 hover:underline disabled:opacity-40"
        >
          {loeschtGerade ? "Wird gelöscht…" : "Zahlen zurücksetzen"}
        </button>
        <select
          value={auswahl}
          onChange={(e) => setAuswahl(e.target.value)}
          className="px-2 py-1 border border-bbw-border rounded-lg text-xs bg-white"
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
        <>
          <div className="grid gap-5 md:grid-cols-2 mb-6">
            <div>
              <h4 className="text-xs font-bold text-bbw-muted uppercase tracking-wide mb-2">
                Seiten
              </h4>
              <Balken eintraege={seiten} leerText="Noch keine Aufrufe." />
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

          <h4 className="text-xs font-bold text-bbw-muted uppercase tracking-wide mb-2">
            Tools im Einzelnen
          </h4>

          {toolZeilen.length === 0 ? (
            <p className="text-xs text-bbw-muted py-2">
              Noch keine Tool-Interaktionen.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-bbw-muted border-b border-bbw-border">
                    <th className="py-1.5 pr-3 font-semibold">Tool</th>
                    <th
                      className="py-1.5 px-2 font-semibold text-right"
                      title="Wie oft die Feature-Liste aufgeklappt wurde"
                    >
                      Features
                    </th>
                    <th
                      className="py-1.5 px-2 font-semibold text-right"
                      title="Klicks auf einen Link des Tools"
                    >
                      Links
                    </th>
                    <th
                      className="py-1.5 px-2 font-semibold text-right"
                      title="Geöffnete Anleitungs-PDFs"
                    >
                      Anleitungen
                    </th>
                    <th className="py-1.5 pl-2 font-semibold text-right">
                      Total
                    </th>
                    <th className="py-1.5 pl-3 w-1/4"></th>
                  </tr>
                </thead>
                <tbody>
                  {toolZeilen.map((z) => (
                    <tr
                      key={z.id}
                      className="border-b border-bbw-border last:border-0"
                    >
                      <td className="py-1.5 pr-3 font-semibold">{z.name}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">
                        {z.features || <span className="text-gray-300">–</span>}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums">
                        {z.link || <span className="text-gray-300">–</span>}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums">
                        {z.anleitung || (
                          <span className="text-gray-300">–</span>
                        )}
                      </td>
                      <td className="py-1.5 pl-2 text-right font-bold tabular-nums">
                        {z.total}
                      </td>
                      <td className="py-1.5 pl-3">
                        <div className="h-1.5 bg-bbw-bg rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-blue-600"
                            style={{
                              width: `${(z.features / toolZeilen[0].total) * 100}%`,
                            }}
                            title={`${z.features}× Features`}
                          />
                          <div
                            className="h-full bg-bbw-primary"
                            style={{
                              width: `${(z.link / toolZeilen[0].total) * 100}%`,
                            }}
                            title={`${z.link}× Link`}
                          />
                          <div
                            className="h-full bg-red-600"
                            style={{
                              width: `${(z.anleitung / toolZeilen[0].total) * 100}%`,
                            }}
                            title={`${z.anleitung}× Anleitung`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-bbw-border text-bbw-muted">
                    <td className="py-1.5 pr-3 font-semibold">
                      Alle {toolZeilen.length} Tools
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {aktionsSummen.features}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {aktionsSummen.link}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {aktionsSummen.anleitung}
                    </td>
                    <td className="py-1.5 pl-2 text-right font-bold tabular-nums">
                      {aktionsSummen.features +
                        aktionsSummen.link +
                        aktionsSummen.anleitung}
                    </td>
                    <td className="py-1.5 pl-3 text-[0.6rem]">
                      <span className="inline-block w-2 h-2 rounded-sm bg-blue-600 mr-1" />
                      Features
                      <span className="inline-block w-2 h-2 rounded-sm bg-bbw-primary ml-2 mr-1" />
                      Links
                      <span className="inline-block w-2 h-2 rounded-sm bg-red-600 ml-2 mr-1" />
                      Anleitungen
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      <p className="text-[0.65rem] text-bbw-muted mt-4 pt-3 border-t border-bbw-border">
        Gezählt werden anonyme Summen pro Monat – keine Kennungen, keine
        Sitzungen, keine Zuordnung zu Personen. Ein Seitenaufruf zählt erst bei
        tatsächlicher Nutzung: nach einer Interaktion oder zehn Sekunden
        Verweildauer. Das hält Suchmaschinen- und KI-Crawler draussen, die eine
        Seite nur laden und sofort wieder verschwinden. Aufrufe der Adminseite
        zählen nicht mit.
      </p>
    </div>
  );
}
