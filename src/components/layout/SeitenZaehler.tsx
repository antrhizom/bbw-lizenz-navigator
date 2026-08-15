"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { zaehle } from "@/lib/statistik";

/** Sekunden sichtbarer Verweildauer, ab denen ein Aufruf ohne Interaktion zählt. */
const MINDESTDAUER = 10;

/**
 * Zählt Seitenaufrufe – aber erst, wenn die Seite tatsächlich benutzt wird.
 *
 * Hintergrund: Der erste Entwurf zählte bei jedem Laden. Dadurch dominierten
 * Suchmaschinen- und KI-Crawler die Statistik (über 1000 Aufrufe der
 * Startseite gegenüber einer Handvoll auf den Unterseiten). Bots laden eine
 * Seite und verschwinden: sie scrollen nicht, tippen nicht und bleiben nicht.
 *
 * Gezählt wird deshalb beim Ersten von beidem:
 *   • einer echten Interaktion (scrollen, klicken, tippen, wischen)
 *   • zehn Sekunden sichtbarer Verweildauer
 *
 * Die Adminseite bleibt ausgenommen, damit die eigene Redaktionsarbeit die
 * Zahlen nicht verfälscht.
 */
export function SeitenZaehler() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    // Automatisierte Browser (Testwerkzeuge, viele Bots) melden sich selbst.
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    let erledigt = false;
    let sichtbareSekunden = 0;
    const ereignisse = ["scroll", "pointerdown", "keydown", "touchstart"];

    const aufraeumen = () => {
      window.clearInterval(ticker);
      ereignisse.forEach((e) => window.removeEventListener(e, jetztZaehlen));
    };

    function jetztZaehlen() {
      if (erledigt) return;
      if (document.visibilityState !== "visible") return;
      erledigt = true;
      aufraeumen();
      zaehle("seite", pathname);
    }

    const ticker = window.setInterval(() => {
      // Nur sichtbare Zeit zählt – ein Hintergrund-Tab ist keine Nutzung.
      if (document.visibilityState !== "visible") return;
      sichtbareSekunden++;
      if (sichtbareSekunden >= MINDESTDAUER) jetztZaehlen();
    }, 1000);

    ereignisse.forEach((e) =>
      window.addEventListener(e, jetztZaehlen, { passive: true })
    );

    return aufraeumen;
  }, [pathname]);

  return null;
}
