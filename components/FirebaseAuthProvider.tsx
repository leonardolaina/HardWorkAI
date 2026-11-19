'use client';

import React, {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '@/lib/firebase';

export interface HardWorkUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
}

interface FirebaseAuthContextValue {
  user: HardWorkUser | null;
  authReady: boolean;
  signingIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<HardWorkUser | null>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);
const pendingAccountSyncs = new Map<string, Promise<void>>();

function toHardWorkUser(fbUser: User): HardWorkUser {
  const email = (fbUser.email || '').trim().slice(0, 254);
  const rawName = (fbUser.displayName || '').trim();
  const displayName = (
    rawName ||
    email.split('@')[0] ||
    'Usuário HardWorkAI'
  ).slice(0, 120);
  const photoURL = (fbUser.photoURL || '').trim().slice(0, 512);
  return {
    uid: fbUser.uid.slice(0, 128),
    email,
    displayName,
    photoURL,
    emailVerified: fbUser.emailVerified,
  };
}

async function syncUserAccountDoc(user: HardWorkUser): Promise<void> {
  if (!user.emailVerified || !user.email) return;

  const existingPromise = pendingAccountSyncs.get(user.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const userPath = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const safePhotoURL =
    user.photoURL &&
    user.photoURL.length >= 10 &&
    user.photoURL.length <= 512 &&
    /^https:\/\/\S+$/.test(user.photoURL)
      ? user.photoURL
      : '';

  const syncPromise = (async () => {
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) {
          const payload: Record<string, unknown> = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (safePhotoURL) {
            payload.photoURL = safePhotoURL;
          }
          tx.set(ref, payload);
        } else {
          const patch: Record<string, unknown> = {
            displayName: user.displayName,
            updatedAt: serverTimestamp(),
          };
          if (safePhotoURL) {
            patch.photoURL = safePhotoURL;
          }
          tx.update(ref, patch);
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    } finally {
      pendingAccountSyncs.delete(user.uid);
    }
  })();

  pendingAccountSyncs.set(user.uid, syncPromise);
  return syncPromise;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class FirebaseErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Erro inesperado na aplicação.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center p-6 bg-[#FAF9F5] dark:bg-[#1B1A18] text-[#1F1E1C] dark:text-[#F2EFE9]">
          <div className="max-w-md w-full rounded-2xl border border-[#E5E1D8] dark:border-[#32302C] bg-white dark:bg-[#22211E] p-6 space-y-4">
            <h1 className="font-serif text-xl font-medium">
              Ocorreu um erro de sincronização
            </h1>
            <p className="text-xs text-[#6B675E] dark:text-[#A19C92] leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-[#C96442] hover:bg-[#B85737] text-white cursor-pointer"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function FirebaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<HardWorkUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const mapped = toHardWorkUser(fbUser);
        try {
          await syncUserAccountDoc(mapped);
          setUser(mapped);
        } catch (err) {
          setUser(mapped);
          setAuthError(
            err instanceof Error
              ? err.message
              : 'Não foi possível sincronizar o perfil da conta.'
          );
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<HardWorkUser | null> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await result.user.getIdToken();
      const mapped = toHardWorkUser(result.user);
      await syncUserAccountDoc(mapped);
      setUser(mapped);
      return mapped;
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError(null);
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'O navegador bloqueou a janela de login. Permita pop-ups para entrar na sua conta HardWorkAI.'
        );
      } else {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'Não foi possível concluir o login com Google.'
        );
      }
      return null;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
    setUser(null);
  }, []);

  const value = useMemo<FirebaseAuthContextValue>(
    () => ({
      user,
      authReady,
      signingIn,
      authError,
      signInWithGoogle,
      logout,
      clearAuthError: () => setAuthError(null),
    }),
    [user, authReady, signingIn, authError, signInWithGoogle, logout]
  );

  return (
    <FirebaseErrorBoundary>
      <FirebaseAuthContext.Provider value={value}>
        {children}
      </FirebaseAuthContext.Provider>
    </FirebaseErrorBoundary>
  );
}

export function useFirebaseAuth(): FirebaseAuthContextValue {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    throw new Error('useFirebaseAuth must be used inside FirebaseAuthProvider');
  }
  return ctx;
}
