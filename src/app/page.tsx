import { TOOLS } from "@/data/tools";
import Link from "next/link";

const stats = [
  { num: TOOLS.length, label: "Tools gesamt" },
  { num: TOOLS.filter((t) => t.ki).length, label: "mit KI-Funktion" },
  { num: TOOLS.filter((t) => t.lernende).length, label: "für Lernende" },
  { num: TOOLS.filter((t) => t.lp).length, label: "für Lehrpersonen" },
];

const goals = [
  {
    title: "Lernaktivitäten fördern",
    desc: "Lerntechnologien ermöglichen vielfältige, aktivierende Lernformen: von interaktiven Übungen über kollaboratives Arbeiten bis hin zu immersiven VR-Erfahrungen.",
    icon: "M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5",
    color: "text-bbw-green",
    bg: "bg-green-50",
  },
  {
    title: "Komplexität reduzieren",
    desc: "KI-gestützte Tools und intelligente Lernplattformen helfen, komplexe Inhalte aufzubereiten, individualisierte Lernpfade anzubieten und Lernergebnisse verständlich zu machen.",
    icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    color: "text-bbw-blue",
    bg: "bg-blue-50",
  },
  {
    title: "Organisation vereinfachen",
    desc: "Von der Kursverwaltung über Aufgabenverteilung bis zum Feedback-Sammeln: Digitale Tools strukturieren den Unterrichtsalltag und sparen wertvolle Zeit.",
    icon: "M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25m0 0 5.571 3 5.571-3",
    color: "text-bbw-orange",
    bg: "bg-orange-50",
  },
  {
    title: "Kooperation strukturieren",
    desc: "Kollaborative Plattformen, gemeinsame Notizbücher und interaktive Pinnwände schaffen Räume für strukturierte Zusammenarbeit zwischen Lehrpersonen und Lernenden.",
    icon: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
    color: "text-bbw-purple",
    bg: "bg-purple-50",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      {/* Hero */}
      <section className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-bbw-red mb-4">
          Pädagogik, Didaktik und Lerntechnologien
        </h2>
        <div className="text-sm text-gray-700 leading-relaxed space-y-3">
          <p>
            Pädagogik und Didaktik stehen in einem fortlaufenden
            Beziehungsverhältnis mit Lerntechnologien. Digitale Werkzeuge sind
            keine isolierten Hilfsmittel, sondern integraler Bestandteil
            zeitgemässer Lehr- und Lernprozesse. Sie eröffnen neue Wege der
            Wissensvermittlung, der Zusammenarbeit und der individuellen
            Förderung.
          </p>
          <p>
            An der BBW Winterthur verfolgen wir das Ziel, mit Lerntechnologien
            die <strong>Lernaktivitäten der Lernenden zu fördern</strong>, die{" "}
            <strong>Komplexität des Lernens zu reduzieren</strong>, die{" "}
            <strong>Organisation des Lernens zu vereinfachen</strong> und die{" "}
            <strong>
              Kooperation und Kollaboration unter Lehrpersonen und Lernenden zu
              strukturieren
            </strong>
            .
          </p>
          <p>
            Der Lizenz-Navigator gibt Lehrpersonen einen vollständigen Überblick
            über die verfügbaren Lerntechnologien, deren Lizenzmodelle und
            Einsatzmöglichkeiten. So wird sichtbar, welche Tools bereits
            lizenziert sind und wie der Beschaffungsprozess für neue
            Technologien abläuft.
          </p>
        </div>
      </section>

      {/* Ziele */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-bbw-text mb-4">
          Ziele des Technologieeinsatzes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((g) => (
            <div
              key={g.title}
              className={`${g.bg} rounded-xl p-5 border border-transparent hover:border-gray-200 transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className={`${g.color} mt-0.5 shrink-0`}>
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
                      d={g.icon}
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{g.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {g.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Statistiken */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-bbw-text mb-4">
          Toollandschaft auf einen Blick
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl shadow-sm border border-bbw-border p-4 text-center"
            >
              <div className="text-3xl font-extrabold text-bbw-red">
                {s.num}
              </div>
              <div className="text-xs text-bbw-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white rounded-xl shadow-sm p-6 text-center">
        <h2 className="text-lg font-bold mb-2">Zur Lizenzübersicht</h2>
        <p className="text-sm text-bbw-muted mb-4">
          Alle {TOOLS.length} Tools mit smarten Filterfunktionen und PDF-Export
          entdecken.
        </p>
        <Link
          href="/lizenzen"
          className="inline-block bg-bbw-red text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-bbw-red-dark transition-colors"
        >
          Lizenzübersicht öffnen
        </Link>
      </section>
    </div>
  );
}
