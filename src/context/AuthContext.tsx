import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { createParentAccount, needsParentConsent, saveParentConsent, type SignUpDetails } from '@/lib/auth';
import { auth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  // True until Firebase has checked whether someone is already logged in.
  initializing: boolean;
  // True for a first-time Google parent who hasn't ticked the consent box yet.
  needsConsent: boolean;
  signUp: (details: SignUpDetails) => Promise<void>;
  giveConsent: () => Promise<void>;
};

// React Context shares a value with every screen, without passing it through
// each component. Here it shares who is logged in.
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [needsConsent, setNeedsConsent] = useState(false);

  // Firebase reports the new login before the parent's name and profile are saved.
  // While signing up we ignore that report, so the Dashboard only opens when
  // everything is ready (and never opens at all if saving fails).
  const signingUp = useRef(false);

  useEffect(() => {
    // Runs now, and again every time someone logs in or out.
    return onAuthStateChanged(auth, async (nextUser) => {
      if (signingUp.current) return;

      const consentMissing = nextUser ? await needsParentConsent(nextUser) : false;
      // If the login changed during that check, a newer report will handle it.
      if (auth.currentUser?.uid !== nextUser?.uid) return;

      setNeedsConsent(consentMissing);
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  const signUp = async (details: SignUpDetails) => {
    signingUp.current = true;
    try {
      await createParentAccount(details);
    } finally {
      signingUp.current = false;
      setUser(auth.currentUser);
    }
  };

  const giveConsent = async () => {
    if (!user) return;
    await saveParentConsent(user);
    setNeedsConsent(false);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, needsConsent, signUp, giveConsent }}>
      {children}
    </AuthContext.Provider>
  );
}

// Use this in any screen: const { user } = useAuth();
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
