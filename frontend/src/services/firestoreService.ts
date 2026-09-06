import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../lib/firebase";
import type { Project } from "../types";

export interface FirestoreUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLoginAt: string;
  updatedAt: string;
}

export class FirestoreService {
  private getDb(): Firestore | null {
    return db;
  }

  /**
   * Synchronize authenticated user profile to Firestore `users/{uid}`
   */
  async syncUserProfile(user: User): Promise<void> {
    const firestore = this.getDb();
    if (!firestore) return;

    try {
      const userRef = doc(firestore, "users", user.uid);
      const profileData: FirestoreUserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, profileData, { merge: true });
    } catch (error) {
      console.warn("[ScenoraEdits] Failed to sync user profile to Firestore:", error);
    }
  }

  /**
   * Save or update a Project in Firestore under `users/{userId}/projects/{projectId}`
   */
  async saveProject(project: Project, userId: string): Promise<void> {
    const firestore = this.getDb();
    if (!firestore) return;

    try {
      // User-scoped subcollection (enforced by Firestore rules)
      const projectRef = doc(firestore, "users", userId, "projects", project.id);
      const payload = {
        ...project,
        ownerId: userId,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(projectRef, payload, { merge: true });

      // Also update root projects collection for backward compatibility if allowed
      try {
        const rootRef = doc(firestore, "projects", project.id);
        await setDoc(rootRef, payload, { merge: true });
      } catch {
        // Root fallback non-fatal
      }
    } catch (error) {
      console.warn("[ScenoraEdits] Failed to save project to Firestore:", error);
      throw error;
    }
  }

  /**
   * Retrieve all projects owned by the authenticated user from `users/{userId}/projects`
   */
  async getProjects(userId: string): Promise<Project[]> {
    const firestore = this.getDb();
    if (!firestore) return [];

    try {
      // Read from user-scoped subcollection
      const userProjectsCol = collection(firestore, "users", userId, "projects");
      const snapshot = await getDocs(userProjectsCol);

      const projects: Project[] = [];
      snapshot.forEach((docSnap) => {
        projects.push(docSnap.data() as Project);
      });

      // If user subcollection is empty, check root collection for legacy projects
      if (projects.length === 0) {
        try {
          const rootCol = collection(firestore, "projects");
          const q = query(rootCol, where("ownerId", "==", userId));
          const rootSnap = await getDocs(q);
          rootSnap.forEach((docSnap) => {
            projects.push(docSnap.data() as Project);
          });
        } catch {
          // Ignore
        }
      }

      return projects;
    } catch (error) {
      console.warn("[ScenoraEdits] Failed to fetch projects from Firestore:", error);
      return [];
    }
  }

  /**
   * Delete a project from Firestore
   */
  async deleteProject(projectId: string, userId?: string): Promise<void> {
    const firestore = this.getDb();
    if (!firestore) return;

    try {
      if (userId) {
        const userProjectRef = doc(firestore, "users", userId, "projects", projectId);
        await deleteDoc(userProjectRef);
      }
      try {
        const projectRef = doc(firestore, "projects", projectId);
        await deleteDoc(projectRef);
      } catch {
        // Non-fatal
      }
    } catch (error) {
      console.warn("[ScenoraEdits] Failed to delete project from Firestore:", error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();
