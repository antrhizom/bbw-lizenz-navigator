"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { zaehle } from "@/lib/statistik";

/**
 * Zählt Seitenaufrufe. Die Adminseite selbst wird ausgenommen – sonst würde
 * die eigene Arbeit an den Inhalten die Statistik verfälschen.
 */
export function SeitenZaehler() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    zaehle("seite", pathname);
  }, [pathname]);

  return null;
}
