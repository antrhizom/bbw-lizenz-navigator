"use client";

import { useState } from "react";
import {
  ROLES,
  SYSTEM_CATEGORIES,
  POLICY_RULES,
  PROCESSES,
  type Role,
  type AccessLevel,
} from "@/data/roles";

/* ─── Access-Level Badge ─── */
const accessColors: Record<string, string> = {
  Admin: "bg-red-600 text-white font-bold",
  Autor: "bg-emerald-600 text-white",
  "Benutzerverw.": "bg-amber-600 text-white",
  Verwalter: "bg-amber-500 text-white",
  "Lesen/Schr.": "bg-teal-500 text-white",
  Lesen: "bg-teal-100 text-teal-800",
  Nutzer: "bg-blue-100 text-blue-800",
  Ausleihe: "bg-amber-100 text-amber-800",
  Gruppenarbeit: "bg-purple-100 text-purple-800",
  "via LP": "bg-gray-200 text-gray-700",
  "Teams-Adm.": "bg-blue-500 text-white",
  "SP-Admin": "bg-blue-500 text-white",
  "Exch.-Adm.": "bg-blue-500 text-white",
  "Benutzer-Adm.": "bg-blue-500 text-white",
  "Intune-Adm.": "bg-blue-500 text-white",
  "Lizenz-Adm.": "bg-blue-500 text-white",
  Helpdesk: "bg-sky-400 text-white",
  "Global Reader": "bg-green-200 text-green-800",
  "–": "bg-gray-50 text-gray-300",
};

function Badge({ level }: { level: AccessLevel }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] leading-tight whitespace-nowrap ${accessColors[level] || "bg-gray-100 text-gray-500"}`}
    >
      {level}
    </span>
  );
}

/* ─── Tab Navigation ─── */
type Tab = "matrix" | "rollen" | "regeln" | "prozesse";

const TABS: { id: Tab; label: string; icon: string }[] = [
  {
    id: "matrix",
    label: "Berechtigungsmatrix",
    icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h-7.5m8.625 0h7.5m-8.625 0c.621 0 1.125.504 1.125 1.125m-1.125 0c-.621 0-1.125.504-1.125 1.125",
  },
  {
    id: "rollen",
    label: "Rollen & Zuständigkeiten",
    icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  },
  {
    id: "regeln",
    label: "Grundsätze & Regeln",
    icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  },
  {
    id: "prozesse",
    label: "Prozesse",
    icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z",
  },
];

/* ─── Matrix Section ─── */
function MatrixSection({
  highlightRole,
}: {
  highlightRole: string | null;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "openolat"
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-xs font-bold text-bbw-muted uppercase tracking-wider mb-2">
          Legende
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            "Admin",
            "Autor",
            "Benutzerverw.",
            "Verwalter",
            "Lesen/Schr.",
            "Lesen",
            "Nutzer",
            "via LP",
            "Ausleihe",
            "Gruppenarbeit",
            "Helpdesk",
            "Global Reader",
            "–",
          ].map((l) => (
            <Badge key={l} level={l as AccessLevel} />
          ))}
        </div>
      </div>

      {SYSTEM_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategory === cat.id;
        return (
          <div
            key={cat.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() =>
                setExpandedCategory(isExpanded ? null : cat.id)
              }
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors`}
            >
              <div
                className={`${cat.accentColor} text-white p-2 rounded-lg shrink-0`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={cat.icon}
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{cat.title}</h3>
                <p className="text-xs text-bbw-muted truncate">
                  {cat.description}
                </p>
              </div>
              <span className="text-xs text-bbw-muted">
                {cat.systems.length} Systeme
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {/* Matrix Table */}
            {isExpanded && (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`${cat.accentBg}`}>
                      <th className="text-left p-2 pl-4 font-bold text-gray-700 min-w-[180px] sticky left-0 z-10" style={{ backgroundColor: 'inherit' }}>
                        System
                      </th>
                      {ROLES.map((r) => (
                        <th
                          key={r.id}
                          className={`p-2 text-center font-bold min-w-[72px] transition-colors ${highlightRole === r.id ? "bg-bbw-primary/10 text-bbw-primary" : "text-gray-600"}`}
                        >
                          <span className="hidden lg:inline">
                            {r.shortLabel}
                          </span>
                          <span className="lg:hidden">{r.shortLabel}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cat.systems.map((sys, i) => (
                      <tr
                        key={sys.name}
                        className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-bbw-primary-light/30 transition-colors`}
                      >
                        <td className="p-2 pl-4 sticky left-0 z-10" style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <div className="font-semibold text-gray-800">
                            {sys.name}
                          </div>
                          {sys.detail && (
                            <div className="text-[10px] text-gray-400 leading-tight">
                              {sys.detail}
                            </div>
                          )}
                        </td>
                        {ROLES.map((r) => (
                          <td
                            key={r.id}
                            className={`p-1.5 text-center transition-colors ${highlightRole === r.id ? "bg-bbw-primary/5" : ""}`}
                          >
                            <Badge level={sys.access[r.id] || "–"} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Rollen Section ─── */
function RollenSection({
  onSelectRole,
  highlightRole,
}: {
  onSelectRole: (id: string | null) => void;
  highlightRole: string | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {ROLES.map((role) => (
        <button
          key={role.id}
          onClick={() =>
            onSelectRole(highlightRole === role.id ? null : role.id)
          }
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-md ${
            highlightRole === role.id
              ? "border-bbw-primary shadow-md ring-2 ring-bbw-primary/20"
              : "border-transparent bg-white shadow-sm"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`${role.color} ${role.textColor} text-xs font-bold px-2 py-0.5 rounded-full`}
            >
              {role.shortLabel}
            </span>
            <h3 className="font-bold text-sm">{role.label}</h3>
          </div>
          <p className="text-xs text-bbw-muted mb-3">{role.description}</p>
          <ul className="space-y-1">
            {role.responsibilities.map((r) => (
              <li key={r} className="text-[11px] text-gray-600 flex gap-1.5">
                <span className="text-bbw-primary mt-0.5 shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
}

/* ─── Regeln Section ─── */
function RegelnSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {POLICY_RULES.map((rule) => (
          <div
            key={rule.id}
            className="bg-white rounded-xl shadow-sm p-5 border border-transparent hover:border-bbw-border transition-all"
          >
            <div className="flex items-start gap-3">
              <div className={`${rule.color} mt-0.5 shrink-0`}>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={rule.icon}
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">{rule.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prüfintervalle */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
          <h3 className="font-bold text-sm text-orange-800">
            Prüfintervalle
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 font-bold text-gray-600">
                  Prüfung
                </th>
                <th className="text-left p-3 font-bold text-gray-600">
                  Intervall
                </th>
                <th className="text-left p-3 font-bold text-gray-600">
                  Verantwortlich
                </th>
                <th className="text-left p-3 font-bold text-gray-600">
                  Umfang
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  check: "Mitarbeitende Berechtigungen",
                  interval: "Jährlich",
                  who: "PIKT-Leitung + TIKT-Leitung",
                  scope: "Alle Benutzerkonten und Rollenzuweisungen",
                },
                {
                  check: "Admin-Berechtigungen",
                  interval: "Halbjährlich",
                  who: "TIKT-Leitung",
                  scope:
                    "Alle Admin-Rollen in M365, OpenOlat und Lerntechnologien",
                },
                {
                  check: "Externe Zugänge",
                  interval: "Quartalsweise",
                  who: "TIKT-Leitung",
                  scope: "Zugänge externer Dienstleister und Partner",
                },
                {
                  check: "Lizenznutzung",
                  interval: "Halbjährlich",
                  who: "PIKT-Leitung",
                  scope:
                    "Auslastung begrenzter Lizenzen (Quizlet, Actionbound)",
                },
              ].map((row, i) => (
                <tr
                  key={row.check}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                >
                  <td className="p-3 font-semibold">{row.check}</td>
                  <td className="p-3">
                    <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {row.interval}
                    </span>
                  </td>
                  <td className="p-3">{row.who}</td>
                  <td className="p-3 text-gray-500">{row.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Prozesse Section ─── */
function ProzesseSection() {
  return (
    <div className="space-y-4">
      {PROCESSES.map((proc) => (
        <div
          key={proc.id}
          className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${proc.color}`}
        >
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm">{proc.title}</h3>
          </div>
          <div className="p-5">
            <div className="relative">
              {proc.steps.map((step, i) => (
                <div key={step.step} className="flex gap-4 mb-4 last:mb-0">
                  {/* Step number */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-bbw-primary text-white flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      {step.step}
                    </div>
                    {i < proc.steps.length - 1 && (
                      <div className="w-0.5 bg-bbw-primary/20 flex-1 mt-1" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-2">
                    <div className="text-xs font-bold text-bbw-primary mb-0.5">
                      {step.actor}
                    </div>
                    <div className="text-xs text-gray-600">{step.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ZugangPage() {
  const [activeTab, setActiveTab] = useState<Tab>("matrix");
  const [highlightRole, setHighlightRole] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      {/* Page Header */}
      <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="bg-bbw-primary text-white p-3 rounded-xl shrink-0">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-bbw-primary mb-1">
              Zugangs- und Berechtigungskonzept
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Übersicht über die Rollen, Berechtigungen und Prozesse für alle
              IKT-Systeme und Lerntechnologien der BBW. Basierend auf der
              kantonalen Vorlage und dem Need-to-know-Prinzip.
            </p>
          </div>
        </div>
      </section>

      {/* Role Filter (always visible) */}
      <section className="mb-4">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-bold text-bbw-muted mr-1">
            Rolle hervorheben:
          </span>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() =>
                setHighlightRole(highlightRole === r.id ? null : r.id)
              }
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                highlightRole === r.id
                  ? "bg-bbw-primary text-white shadow-sm"
                  : `${r.color} ${r.textColor} hover:ring-1 hover:ring-bbw-primary/30`
              }`}
            >
              {r.label}
            </button>
          ))}
          {highlightRole && (
            <button
              onClick={() => setHighlightRole(null)}
              className="text-[10px] text-red-500 hover:text-red-700 ml-1"
            >
              ✕ zurücksetzen
            </button>
          )}
        </div>
      </section>

      {/* Tabs */}
      <nav className="flex gap-1 mb-6 overflow-x-auto pb-1 no-print">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-bbw-primary text-white shadow-sm"
                : "bg-white text-bbw-muted hover:bg-gray-100 shadow-sm"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={tab.icon}
              />
            </svg>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      {activeTab === "matrix" && (
        <MatrixSection highlightRole={highlightRole} />
      )}
      {activeTab === "rollen" && (
        <RollenSection
          onSelectRole={setHighlightRole}
          highlightRole={highlightRole}
        />
      )}
      {activeTab === "regeln" && <RegelnSection />}
      {activeTab === "prozesse" && <ProzesseSection />}

      {/* Footer info */}
      <section className="mt-8 text-center">
        <p className="text-xs text-bbw-muted">
          Basierend auf: Kantonale Vorlage Rollen- und Berechtigungskonzept
          (V1.0, März 2025) · IKT Konzept BBW V07 · Nutzungsrichtlinie IKT BBW
          · Richtlinie BBW EdTech
        </p>
      </section>
    </div>
  );
}
