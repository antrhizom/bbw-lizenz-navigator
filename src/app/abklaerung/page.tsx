"use client";

import { useState } from "react";
import { processFlows } from "@/data/procurement";

export default function AbklaerungPage() {
  const [activeFlow, setActiveFlow] = useState("lehrperson");

  const currentFlow = processFlows.find((f) => f.id === activeFlow)!;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      {/* Intro */}
      <section className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-bbw-primary mb-4">
          Abklärung &amp; Anschaffung von Lerntechnologien
        </h2>
        <div className="text-sm text-gray-700 leading-relaxed space-y-3">
          <p>
            Die Anschaffung neuer Lerntechnologien an der BBW Winterthur folgt
            einem strukturierten Prozess, der Qualität, Datenschutz und
            Informationssicherheit gewährleistet. Je nach Ausgangslage gibt es
            drei mögliche Startpunkte für den Beschaffungsprozess.
          </p>
          <p>
            Das <strong>PIKT-Team</strong> (Pädagogik, ICT, Kommunikation,
            Technologie) koordiniert die Evaluation und arbeitet eng mit dem{" "}
            <strong>Kernteam</strong> und der <strong>Steuergruppe</strong>{" "}
            zusammen, um sicherzustellen, dass neue Tools sowohl pädagogisch
            sinnvoll als auch technisch und rechtlich unbedenklich sind.
          </p>
        </div>
      </section>

      {/* Flow Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 no-print">
        {processFlows.map((flow) => (
          <button
            key={flow.id}
            onClick={() => setActiveFlow(flow.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeFlow === flow.id
                ? "text-white shadow-md"
                : "bg-white text-bbw-muted border border-bbw-border hover:border-gray-400"
            }`}
            style={
              activeFlow === flow.id
                ? { backgroundColor: flow.color }
                : undefined
            }
          >
            {flow.title.replace("Ausgangslage: ", "")}
          </button>
        ))}
      </div>

      {/* Process Timeline */}
      <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: currentFlow.color }}
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
                d={currentFlow.icon}
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold">{currentFlow.title}</h3>
        </div>

        <div className="relative ml-5">
          {/* Vertical line */}
          <div
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
            style={{ backgroundColor: currentFlow.color + "30" }}
          />

          <div className="space-y-0">
            {currentFlow.steps.map((step, i) => (
              <div key={i} className="relative pl-8 pb-8 last:pb-0">
                {/* Dot */}
                <div
                  className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 -translate-x-[5px]"
                  style={{
                    borderColor: currentFlow.color,
                    backgroundColor:
                      i === currentFlow.steps.length - 1
                        ? currentFlow.color
                        : "white",
                  }}
                />

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm">{step.title}</h4>
                    <span
                      className="text-[0.65rem] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: currentFlow.color + "15",
                        color: currentFlow.color,
                      }}
                    >
                      {step.actor}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Box */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
        <h3 className="font-bold text-sm text-blue-900 mb-2">
          Hinweis für Lehrpersonen
        </h3>
        <p className="text-xs text-blue-800 leading-relaxed">
          Der erste Schritt ist immer der Blick in den{" "}
          <strong>Lizenz-Navigator</strong>. Dort sehen Sie, welche Tools
          bereits zur Verfügung stehen. Wenn Sie ein bestimmtes Tool benötigen,
          das noch nicht vorhanden ist, wenden Sie sich an das PIKT-Team. Dieses
          begleitet Sie durch den gesamten Abklärungsprozess.
        </p>
      </section>
    </div>
  );
}
