"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ZUGANG_OEFFENTLICH } from "@/lib/feature-flags";
import { REGISTER, UEBERSICHT } from "@/lib/edtech-register";
import { useIstAdmin } from "@/lib/use-admin";
import { KONTAKT, mailtoLink } from "@/lib/kontakt";
import { zaehle } from "@/lib/statistik";

const NAV_ITEMS: {
  href: string;
  label: string;
  titel?: string;
  /** Weitere Pfade, bei denen dieser Eintrag als aktiv gilt. */
  aktivPfade?: string[];
  nurAdmin?: boolean;
}[] = [
  {
    href: UEBERSICHT.href,
    label: UEBERSICHT.label,
    titel: UEBERSICHT.erklaerung,
    // Die Unterscheidung Soft/Hard erfolgt über die Register auf der Seite –
    // der Menüeintrag bleibt einer, gilt aber für beide Routen als aktiv.
    aktivPfade: REGISTER.map((r) => r.href),
  },
  { href: "/abklaerung", label: "Abklärung & Anschaffung" },
  { href: "/paedagogik", label: "Pädagogik / Didaktik" },
  // Noch in Überarbeitung: erst sichtbar, wenn ZUGANG_OEFFENTLICH gesetzt ist.
  { href: "/zugang", label: "Zugang & Rollen", nurAdmin: !ZUGANG_OEFFENTLICH },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { status } = useIstAdmin();

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.nurAdmin || status === "admin"),
    [status]
  );

  const istAktiv = (item: (typeof NAV_ITEMS)[number]) =>
    item.aktivPfade ? item.aktivPfade.includes(pathname) : pathname === item.href;

  return (
    <header className="bg-gradient-to-br from-bbw-primary-dark to-bbw-primary text-white">
      <div className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="hover:opacity-90">
              <h1 className="text-xl font-bold tracking-tight">
                Lizenz-Navigator
              </h1>
              <p className="text-sm opacity-80 mt-0.5">
                Berufsbildungsschule Winterthur
              </p>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.titel}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  istAktiv(item)
                    ? "bg-white/20 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={mailtoLink()}
              title={KONTAKT.erklaerung}
              onClick={() => zaehle("funktion", "support-knopf")}
              className="ml-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-bbw-primary hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              {KONTAKT.label}
            </a>
          </nav>

          {/* Mobile Burger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Navigation öffnen"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.titel}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  istAktiv(item)
                    ? "bg-white/20 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={mailtoLink()}
              onClick={() => {
                zaehle("funktion", "support-knopf");
                setMenuOpen(false);
              }}
              className="mt-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-bbw-primary text-center"
            >
              {KONTAKT.label} – Anfrage per E-Mail
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
