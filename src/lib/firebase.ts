import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Firebase-Web-Konfiguration des Projekts «bbw-lizenzen-42».
// Die Werte kommen aus Umgebungsvariablen: lokal aus .env.local, auf Vercel aus
// den Projekt-Einstellungen (Settings → Environment Variables). Sie sind zwar
// keine Geheimnisse – NEXT_PUBLIC_* landet im Browser-Bundle –, gehören aber
// nicht ins öffentliche Repository. Der Schutz der Daten erfolgt über die
// Firestore-Regeln (siehe firestore.rules) und die Admin-Whitelist.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

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

let dbInstance: Firestore | null = null;

/** Firestore-Instanz (lazy, damit beim SSR nichts unnötig initialisiert wird). */
export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

let authInstance: Auth | null = null;

/** Firebase-Auth – nur im Browser verwenden. */
export function getAuthClient(): Auth {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}
