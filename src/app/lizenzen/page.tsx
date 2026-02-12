"use client";

import { useState, useMemo } from "react";
import { TOOLS } from "@/data/tools";
import { Tool } from "@/data/types";
import { generateLicensePdf } from "@/lib/pdf-generator";
import { trackEvent } from "@/lib/analytics";

// Extract unique license categories
const LICENSE_CATEGORIES = [
  "Kantonslizenz",
  "BBW-Schullizenz",
  "BBW-Schullizenz begrenzt",
  "Einzellizenz BBW",
  "Kostenlos",
] as const;

function getLicenseCategory(lizenz: string): string {
  if (lizenz.toLowerCase().includes("kostenlos")) return "Kostenlos";
  if (lizenz.toLowerCase().includes("einzellizenz")) return "Einzellizenz BBW";
  if (lizenz.toLowerCase().includes("begrenzt"))
    return "BBW-Schullizenz begrenzt";
  if (
    lizenz.toLowerCase().includes("schullizenz") ||
    lizenz.toLowerCase().includes("bbw (lp)") ||
    lizenz.toLowerCase().includes("hardware")
  )
    return "BBW-Schullizenz";
  if (lizenz.toLowerCase().includes("kanton")) return "Kantonslizenz";
  return lizenz;
}

// Extract unique tool types
const TOOL_TYPES = Array.from(
  new Set(
    TOOLS.flatMap((t) =>
      t.typ.split(",").map((s) => s.trim())
    )
  )
).sort();

interface Filters {
  search: string;
  lizenzKategorie: string | null;
  ki: boolean | null;
  lernende: boolean | null;
  lp: boolean | null;
  toolTyp: string | null;
}

const initialFilters: Filters = {
  search: "",
  lizenzKategorie: null,
  ki: null,
  lernende: null,
  lp: null,
  toolTyp: null,
};

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-bbw-border p-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="font-bold text-sm">{tool.name}</h3>
        {tool.ki && (
          <span className="text-[0.6rem] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold tracking-wide">
            KI
          </span>
        )}
      </div>

      <p className="text-xs text-bbw-muted mb-2">{tool.typ}</p>

      <div className="flex flex-wrap gap-1 mb-2">
        {tool.lernende && (
          <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
            Lernende
          </span>
        )}
        {tool.lp && (
          <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
            Lehrpersonen
          </span>
        )}
        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
          {tool.lizenz}
        </span>
      </div>

      {tool.funcs && (
        <p className="text-xs text-gray-700">
          <strong>Funktionen:</strong> {tool.funcs}
        </p>
      )}

      {tool.lizenzDetail && (
        <p className="text-[0.68rem] text-bbw-muted mt-2 pt-2 border-t border-bbw-border">
          {tool.lizenzDetail}
        </p>
      )}
    </div>
  );
}

export default function LizenzenPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const updateFilter = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== "search") {
      trackEvent("filter_applied", {
        filter_type: key,
        filter_value: String(value ?? "alle"),
      });
    }
  };

  const toggleFilter = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const filteredTools = useMemo(() => {
    return TOOLS.filter((t) => {
      if (
        filters.search &&
        !t.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !t.typ.toLowerCase().includes(filters.search.toLowerCase()) &&
        !t.funcs.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;

      if (
        filters.lizenzKategorie &&
        getLicenseCategory(t.lizenz) !== filters.lizenzKategorie
      )
        return false;

      if (filters.ki === true && !t.ki) return false;
      if (filters.ki === false && t.ki) return false;

      if (filters.lernende === true && !t.lernende) return false;
      if (filters.lp === true && !t.lp) return false;

      if (filters.toolTyp && !t.typ.toLowerCase().includes(filters.toolTyp.toLowerCase()))
        return false;

      return true;
    });
  }, [filters]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.lizenzKategorie) labels.push(filters.lizenzKategorie);
    if (filters.ki === true) labels.push("Mit KI");
    if (filters.ki === false) labels.push("Ohne KI");
    if (filters.lernende) labels.push("Lernende");
    if (filters.lp) labels.push("Lehrpersonen");
    if (filters.toolTyp) labels.push(filters.toolTyp);
    if (filters.search) labels.push(`"${filters.search}"`);
    return labels;
  }, [filters]);

  const hasActiveFilters =
    filters.search ||
    filters.lizenzKategorie ||
    filters.ki !== null ||
    filters.lernende ||
    filters.lp ||
    filters.toolTyp;

  const handlePdfExport = () => {
    generateLicensePdf(filteredTools, activeFilterLabels.join(", "));
    trackEvent("pdf_exported", {
      tools_count: filteredTools.length,
      active_filters: activeFilterLabels.join(", "),
    });
  };

  const handleSearchChange = (value: string) => {
    updateFilter("search", value);
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h2 className="text-2xl font-bold text-bbw-red mb-6">
        Lizenzübersicht
      </h2>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 no-print">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tool suchen (Name, Typ oder Funktion)..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-bbw-border rounded-lg text-sm outline-none focus:border-bbw-red transition-colors"
          />
        </div>

        {/* Lizenztyp */}
        <div className="mb-3">
          <span className="text-xs font-semibold text-bbw-muted mr-2">
            Lizenztyp:
          </span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            {LICENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleFilter("lizenzKategorie", cat)}
                className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                  filters.lizenzKategorie === cat
                    ? "bg-bbw-red text-white border-bbw-red"
                    : "bg-white text-bbw-muted border-bbw-border hover:border-bbw-red hover:bg-bbw-red-light"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Zugang */}
        <div className="mb-3">
          <span className="text-xs font-semibold text-bbw-muted mr-2">
            Zugang:
          </span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            <button
              onClick={() =>
                toggleFilter("lernende", true)
              }
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                filters.lernende
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-bbw-muted border-bbw-border hover:border-green-600 hover:bg-green-50"
              }`}
            >
              Lernende
            </button>
            <button
              onClick={() =>
                toggleFilter("lp", true)
              }
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                filters.lp
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-bbw-muted border-bbw-border hover:border-amber-600 hover:bg-amber-50"
              }`}
            >
              Lehrpersonen
            </button>
          </div>
        </div>

        {/* KI */}
        <div className="mb-3">
          <span className="text-xs font-semibold text-bbw-muted mr-2">
            KI:
          </span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            <button
              onClick={() => toggleFilter("ki", true)}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                filters.ki === true
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-bbw-muted border-bbw-border hover:border-blue-600 hover:bg-blue-50"
              }`}
            >
              Mit KI
            </button>
            <button
              onClick={() => toggleFilter("ki", false)}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                filters.ki === false
                  ? "bg-gray-600 text-white border-gray-600"
                  : "bg-white text-bbw-muted border-bbw-border hover:border-gray-600 hover:bg-gray-50"
              }`}
            >
              Ohne KI
            </button>
          </div>
        </div>

        {/* Tooltyp */}
        <div className="mb-3">
          <span className="text-xs font-semibold text-bbw-muted mr-2">
            Tooltyp:
          </span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            {TOOL_TYPES.map((typ) => (
              <button
                key={typ}
                onClick={() => toggleFilter("toolTyp", typ)}
                className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                  filters.toolTyp === typ
                    ? "bg-bbw-purple text-white border-bbw-purple"
                    : "bg-white text-bbw-muted border-bbw-border hover:border-bbw-purple hover:bg-purple-50"
                }`}
              >
                {typ}
              </button>
            ))}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-bbw-border">
          <div className="text-xs text-bbw-muted">
            <strong className="text-bbw-text">{filteredTools.length}</strong> von{" "}
            {TOOLS.length} Tools
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => setFilters(initialFilters)}
              className="text-xs text-bbw-red font-semibold hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}

          <div className="ml-auto">
            <button
              onClick={handlePdfExport}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-2"
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              PDF exportieren ({filteredTools.length} Tools)
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 no-print">
          <span className="text-xs text-bbw-muted self-center mr-1">
            Aktive Filter:
          </span>
          {activeFilterLabels.map((label) => (
            <span
              key={label}
              className="text-[0.65rem] px-2.5 py-1 rounded-full bg-bbw-red-light text-bbw-red font-semibold"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-bbw-muted text-sm">
            Keine Tools gefunden. Bitte passen Sie die Filter an.
          </p>
          <button
            onClick={() => setFilters(initialFilters)}
            className="mt-3 text-sm text-bbw-red font-semibold hover:underline"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}
