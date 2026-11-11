import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { auth, db, MASTER_ADMIN_UID } from "./firebase";
import { cancelUserDeletion, requestUserDeletion } from "./firestore";
import type { UserDeletionStatus } from "../types";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  blocked: boolean;
  createdAt?: unknown;
  // Аккаунтты жою сұранысының күйі және жойылу күні (миллисекунд)
  deletionStatus: UserDeletionStatus;
  deleteAt: number | null;
}

interface AuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
  requestAccountDeletion: () => Promise<void>;
  cancelAccountDeletion: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readDeletionInfo(savedData?: DocumentData): {
  deletionStatus: UserDeletionStatus;
  deleteAt: number | null;
} {
  const rawStatus = savedData?.deletionStatus;

  const deletionStatus: UserDeletionStatus =
    rawStatus === "requested" ||
    rawStatus === "approved" ||
    rawStatus === "held"
      ? rawStatus
      : "none";

  const rawDeleteAt = savedData?.deleteAt as
    | { toMillis?: () => number }
    | undefined;

  const deleteAt =
    rawDeleteAt && typeof rawDeleteAt.toMillis === "function"
      ? rawDeleteAt.toMillis()
      : null;

  return { deletionStatus, deleteAt };
}

function getAppUser(
  firebaseUser: FirebaseUser,
  savedData?: DocumentData,
): AppUser {
  const savedName =
    typeof savedData?.name === "string" ? savedData.name : "";
  const savedEmail =
    typeof savedData?.email === "string" ? savedData.email : "";
  const savedPhoto =
    typeof savedData?.photoURL === "string" ? savedData.photoURL : "";

  const { deletionStatus, deleteAt } = readDeletionInfo(savedData);

  return {
    uid: firebaseUser.uid,
    name:
      savedName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split("@")[0] ||
      "Қолданушы",
    email: firebaseUser.email || savedEmail,
    photoURL: firebaseUser.photoURL || savedPhoto,
    blocked: savedData?.blocked === true,
    createdAt: savedData?.createdAt,
    deletionStatus,
    deleteAt,
  };
}

function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "auth/popup-closed-by-user":
      return "Кіру терезесі жабылды. Қайта әрекет жасап көріңіз.";
    case "auth/popup-blocked":
      return "Браузер кіру терезесін бұғаттады. Қалқымалы терезелерге рұқсат беріңіз.";
    case "auth/cancelled-popup-request":
      return "Кіру әрекеті тоқтатылды. Қайта көріңіз.";
    case "auth/unauthorized-domain":
      return "Бұл домен Firebase ішінде рұқсат етілмеген.";
    case "auth/network-request-failed":
      return "Интернет байланысын тексеріңіз.";
    case "auth/operation-not-allowed":
      return "Firebase Console ішінде Google арқылы кіруді қосыңыз.";
    default:
      return "Google арқылы кіру сәтсіз аяқталды. Қайта әрекет жасап көріңіз.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnapshot = await getDoc(userRef);

        const savedData = userSnapshot.exists()
          ? userSnapshot.data()
          : undefined;

        if (savedData?.blocked === true) {
          await signOut(auth);
          if (active) setUser(null);
          return;
        }

        const appUser = getAppUser(firebaseUser, savedData);

        if (!userSnapshot.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            name: appUser.name,
            email: appUser.email,
            photoURL: appUser.photoURL,
            blocked: false,
            createdAt: serverTimestamp(),
          });
        }

        if (active) setUser(appUser);
      } catch (error) {
        console.error("Пайдаланушы профилін өңдеу қатесі:", error);

        if (active) {
          // Firestore профилін оқу сәтсіз болса да, Google аккаунты сақталады.
          setUser(getAppUser(firebaseUser));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      await signInWithPopup(auth, provider);

      return { success: true };
    } catch (error) {
      console.error("Google арқылы кіру қатесі:", error);

      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const updateProfile = useCallback(async (data: Partial<AppUser>) => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      throw new Error("Алдымен Google аккаунтымен кіріңіз.");
    }

    const allowedData: Partial<AppUser> = {};

    if (typeof data.name === "string") {
      allowedData.name = data.name.trim();
    }

    if (typeof data.photoURL === "string") {
      allowedData.photoURL = data.photoURL;
    }

    await setDoc(
      doc(db, "users", firebaseUser.uid),
      allowedData,
      { merge: true },
    );

    setUser((previous) =>
      previous ? { ...previous, ...allowedData } : previous,
    );
  }, []);

  // Профильдің соңғы күйін Firestore-дан қайта оқиды
  // (мысалы, әкімші жою сұранысын бекіткенін көру үшін).
  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) return;

    const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));

    if (!snapshot.exists()) return;

    const savedData = snapshot.data();

    if (savedData.blocked === true) {
      await signOut(auth);
      setUser(null);
      return;
    }

    setUser(getAppUser(firebaseUser, savedData));
  }, []);

  const requestAccountDeletion = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      throw new Error("Алдымен Google аккаунтымен кіріңіз.");
    }

    await requestUserDeletion(firebaseUser.uid);
    await refreshUser();
  }, [refreshUser]);

  const cancelAccountDeletion = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      throw new Error("Алдымен Google аккаунтымен кіріңіз.");
    }

    await cancelUserDeletion(firebaseUser.uid);
    await refreshUser();
  }, [refreshUser]);

  const isAdmin = user?.uid === MASTER_ADMIN_UID;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        loginWithGoogle,
        logout,
        updateProfile,
        requestAccountDeletion,
        cancelAccountDeletion,
        refreshUser,
      }}
    >
      {!isLoading ? (
        children
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth AuthProvider ішінде қолданылуы керек");
  }

  return context;
          }
