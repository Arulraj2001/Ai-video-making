import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider, ADMIN_EMAIL, isFirebaseConfigured, checkIsAdmin } from "../lib/firebase";
import { formatAuthError } from "../utils/authErrors";
import { firestoreService } from "../services/firestoreService";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  adminEmail: string;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          firestoreService.syncUserProfile(firebaseUser).catch((e) => {
            console.warn("[ScenoraEdits] Background user sync notice:", e);
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("[ScenoraEdits] Auth state change error:", err);
        setError(formatAuthError(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string): Promise<void> => {
    clearError();
    if (!auth) {
      const msg = "Firebase is not configured. Add VITE_FIREBASE_* keys to your frontend/.env.";
      setError(msg);
      throw new Error(msg);
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: unknown) {
      const friendly = formatAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string): Promise<void> => {
    clearError();
    if (!auth) {
      const msg = "Firebase is not configured. Add VITE_FIREBASE_* keys to your frontend/.env.";
      setError(msg);
      throw new Error(msg);
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName && displayName.trim().length > 0 && cred.user) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
        // Trigger local user state update with the newly set displayName
        setUser({ ...cred.user, displayName: displayName.trim() } as User);
      }
    } catch (err: unknown) {
      const friendly = formatAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    clearError();
    if (!auth || !googleProvider) {
      const msg = "Firebase Google Sign-In is not configured. Add VITE_FIREBASE_* keys to your frontend/.env.";
      setError(msg);
      throw new Error(msg);
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const friendly = formatAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const signOutUser = async (): Promise<void> => {
    clearError();
    if (!auth) {
      setUser(null);
      return;
    }
    try {
      await fbSignOut(auth);
      setUser(null);
    } catch (err: unknown) {
      const friendly = formatAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    clearError();
    if (!auth) {
      const msg = "Firebase is not configured. Add VITE_FIREBASE_* keys to your frontend/.env.";
      setError(msg);
      throw new Error(msg);
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: unknown) {
      const friendly = formatAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const isAdmin = checkIsAdmin(user?.email);
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAdmin,
        isAuthenticated,
        isConfigured: isFirebaseConfigured,
        adminEmail: ADMIN_EMAIL,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOutUser,
        sendPasswordReset,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
