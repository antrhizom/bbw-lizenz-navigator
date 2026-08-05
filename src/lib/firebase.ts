import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Firebase-Web-Konfiguration des Projekts «bbw-lizenzen-ffbef».
// Diese Werte sind öffentliche Kennungen (sie landen ohnehin im Browser-Bundle)
// und stehen deshalb direkt im Code – so ist die Live-Version nicht von
// Umgebungsvariablen in Vercel abhängig. Der Schutz der Daten erfolgt über die
// Firestore-Regeln (siehe firestore.rules) und die Admin-Whitelist.
const firebaseConfig = {
  apiKey: "AIzaSyCrynmgmp91ZQPpj6I4PVZB2J9JPK859w0",
  authDomain: "bbw-lizenzen-ffbef.firebaseapp.com",
  projectId: "bbw-lizenzen-ffbef",
  storageBucket: "bbw-lizenzen-ffbef.firebasestorage.app",
  messagingSenderId: "169372272845",
  appId: "1:169372272845:web:41c67823e2c31cba674184",
};

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let analyticsInstance: Analytics | null = null;

export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window !== "undefined" && (await isSupported())) {
    if (!analyticsInstance) {
      try {
        analyticsInstance = getAnalytics(app);
      } catch {
        // Ohne measurementId ist Analytics nicht verfügbar – kein Grund,
        // die Seite scheitern zu lassen.
        return null;
      }
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
