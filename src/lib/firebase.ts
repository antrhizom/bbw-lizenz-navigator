import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";

// Firebase-Web-Konfiguration des Projekts «bbw-lizenzen-42».
// Die Werte kommen aus Umgebungsvariablen: lokal aus .env.local, auf Vercel aus
// den Projekt-Einstellungen (Settings → Environment Variables). Sie sind zwar
// keine Geheimnisse – NEXT_PUBLIC_* landet im Browser-Bundle –, gehören aber
// nicht ins öffentliche Repository. Der Schutz der Daten erfolgt über die
// Firestore-Regeln (siehe firestore.rules) und die Admin-Whitelist.
/**
 * Umgebungswerte bereinigen: beim Einfügen in Vercel gerät leicht ein
 * Zeilenumbruch ans Ende. In URLs entfernt ihn der Browser stillschweigend, in
 * JSON-Nutzdaten jedoch nicht – dort führte er zu
 * «Invalid project ID(bbw-lizenzen-42\n)» und liess das Zählen scheitern.
 */
const env = (wert: string | undefined): string | undefined => wert?.trim();

const firebaseConfig = {
  apiKey: env(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: env(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: env(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: env(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: env(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: env(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: env(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
};

/** Bereinigte Werte für die REST-Zugriffe – eine gemeinsame Quelle. */
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_API_KEY = firebaseConfig.apiKey;

/** Ist die Firebase-Konfiguration überhaupt vorhanden? */
export const firebaseKonfiguriert = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let analyticsInstance: Analytics | null = null;

export async function initAnalytics(): Promise<Analytics | null> {
  // Ohne measurementId versucht getAnalytics() dennoch, sich bei Firebase zu
  // registrieren, und schlägt dann asynchron mit einem Konsolenfehler fehl –
  // das lässt sich nicht per try/catch abfangen. Deshalb hier gar nicht erst
  // starten, solange kein Google-Analytics-Datenstream verknüpft ist.
  if (!firebaseConfig.measurementId) return null;
  if (typeof window !== "undefined" && (await isSupported())) {
    if (!analyticsInstance) {
      analyticsInstance = getAnalytics(app);
    }
    return analyticsInstance;
  }
  return null;
}

// Firestore wird bewusst nicht über das SDK angesprochen, sondern über die
// REST-Schnittstelle (siehe src/lib/firestore-rest.ts): das SDK bekam im
// BBW-Netz seine Verbindung nicht auf und meldete «client is offline», auch mit
// erzwungenem Long Polling. Gewöhnliche HTTPS-Requests funktionieren dort.

let authInstance: Auth | null = null;

/** Firebase-Auth – nur im Browser verwenden. */
export function getAuthClient(): Auth {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}
