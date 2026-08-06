"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { firebaseKonfiguriert, getAuthClient } from "./firebase";
import { isAdminEmail } from "./tools-repo";

export type AdminStatus = "pruefe" | "admin" | "kein-admin";

/**
 * Prüft, ob das angemeldete Konto in der Admin-Whitelist steht.
 *
 * Gedacht zum Ein- und Ausblenden von Inhalten, die noch nicht öffentlich
 * sind. Das ist eine Anzeige-Entscheidung im Browser, kein Zugriffsschutz:
 * wer die Seite gezielt aufruft, kann den ausgelieferten Seiteninhalt im
 * Quelltext lesen. Für echten Schutz müssten die Inhalte serverseitig oder
 * hinter den Firestore-Regeln liegen.
 */
export function useIstAdmin(): { status: AdminStatus; user: User | null } {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AdminStatus>("pruefe");

  useEffect(() => {
    if (!firebaseKonfiguriert) {
      setStatus("kein-admin");
      return;
    }

    // Zählt Anmeldewechsel mit, damit eine verspätete Antwort einer früheren
    // Prüfung das Ergebnis der aktuellen nicht überschreibt.
    let lauf = 0;

    return onAuthStateChanged(getAuthClient(), (u) => {
      const eigenerLauf = ++lauf;
      setUser(u);

      if (!u?.email) {
        setStatus("kein-admin");
        return;
      }

      setStatus("pruefe");
      isAdminEmail(u.email)
        .then((ok) => {
          if (eigenerLauf === lauf) setStatus(ok ? "admin" : "kein-admin");
        })
        .catch(() => {
          if (eigenerLauf === lauf) setStatus("kein-admin");
        });
    });
  }, []);

  return { status, user };
}
