import { getFirestore, type Firestore } from "firebase/firestore";
import { app } from "./firebase";

let db: Firestore | null = null;

export function getDb(): Firestore | null {
  if (!app) return null;
  return db ?? (db = getFirestore(app));
}
