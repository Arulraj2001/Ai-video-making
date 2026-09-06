import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const config: FirebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const ADMIN_EMAIL: string = (
  import.meta.env.VITE_ADMIN_EMAIL || "sridharparthasarathy2002@gmail.com"
).trim().toLowerCase();

export const ADMIN_EMAILS: string[] = [
  ADMIN_EMAIL,
  "sridharparthasarathy2002@gmail.com",
  "samuelarul2001@gmail.com",
  "admin@scenoraedits.com",
];

export function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Check if the minimum required Firebase configuration fields are provided.
 */
export const isFirebaseConfigured: boolean = Boolean(
  config.apiKey &&
  config.authDomain &&
  config.projectId &&
  config.apiKey.length > 5 &&
  !config.apiKey.includes("your-api-key")
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(config as Record<string, string>) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (error) {
    console.error("[ScenoraEdits] Failed to initialize Firebase Services:", error);
    app = null;
    auth = null;
    db = null;
    googleProvider = null;
  }
} else {
  console.info(
    "[ScenoraEdits] Firebase is in demo/local mode. Set VITE_FIREBASE_* in frontend/.env to connect scenora-46cfe."
  );
}

export { app, auth, db, googleProvider };
