// Everything the app does with Firebase Authentication lives here.
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { isRunningInExpoGo } from 'expo';

import { auth, db } from '@/lib/firebase';
import { forgetThisDevice } from '@/lib/notifications';

export type SignUpDetails = {
  name: string;
  email: string;
  password: string;
};

// Stops the spinner running forever if Firestore can't be reached.
function failAfter(ms: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timed out saving the parent profile')), ms);
  });
}

// Creates the login, saves the parent's name, and writes parents/{uid}.
// If the profile can't be saved we remove the login again, so a parent is
// never left with a half-created account. They can simply try again.
export async function createParentAccount({ name, email, password }: SignUpDetails) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  try {
    await updateProfile(user, { displayName: name });
    await Promise.race([
      setDoc(doc(db, 'parents', user.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
        // The sign-up form can't be submitted without ticking the consent box.
        consentAt: serverTimestamp(),
      }),
      failAfter(15_000),
    ]);
  } catch (err) {
    await deleteUser(user).catch(() => signOut(auth));
    throw err;
  }
}

export async function logIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

function usesProvider(user: User, providerId: string) {
  return user.providerData.some((provider) => provider.providerId === providerId);
}

// Parents who signed in only with Google have no password to change.
export function hasPassword(user: User) {
  return usesProvider(user, 'password');
}

export async function logOut() {
  // Must happen first: removing this phone from the account needs the login.
  if (auth.currentUser) await forgetThisDevice(auth.currentUser.uid);

  // Also leave Google, so the account picker appears next time.
  if (auth.currentUser && usesProvider(auth.currentUser, 'google.com') && canUseGoogleSignIn) {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    await GoogleSignin.signOut().catch(() => {});
  }
  await signOut(auth);
}

// Google sign-in needs custom native code that Expo Go doesn't include.
export const canUseGoogleSignIn = !isRunningInExpoGo();

// Shows Google's account picker, then logs in to Firebase with the result.
// Returns false if the parent closed the picker. The library is loaded here,
// only when needed, because loading it in Expo Go would crash the app.
export async function signInWithGoogle() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) throw new Error('Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env');

  const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return false;
  if (!response.data.idToken) throw new Error('Google did not return an ID token');

  await signInWithCredential(auth, GoogleAuthProvider.credential(response.data.idToken));
  return true;
}

// Google sign-in skips the sign-up form, so a first-time Google parent hasn't
// agreed to the terms yet. If we can't check, we ask rather than assume.
export async function needsParentConsent(user: User) {
  if (!usesProvider(user, 'google.com')) return false;
  try {
    const profile = await getDoc(doc(db, 'parents', user.uid));
    return !profile.exists();
  } catch {
    return true;
  }
}

export async function saveParentConsent(user: User) {
  await Promise.race([
    setDoc(doc(db, 'parents', user.uid), {
      name: user.displayName ?? '',
      email: user.email ?? '',
      createdAt: serverTimestamp(),
      consentAt: serverTimestamp(),
    }),
    failAfter(15_000),
  ]);
}

// Emails a reset link. An unknown email counts as success, so this screen
// can't be used to find out who has an account.
export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    if (err instanceof FirebaseError && err.code === 'auth/user-not-found') return;
    throw err;
  }
}

// Firebase needs proof it's really the parent before changing a password,
// so we check the current password first ("re-authenticate").
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Nobody is logged in');

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export function isWrongPasswordError(err: unknown) {
  return (
    err instanceof FirebaseError &&
    (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password')
  );
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/weak-password': 'Please choose a stronger password.',
  'auth/invalid-credential': 'That email or password isn’t right.',
  'auth/wrong-password': 'That email or password isn’t right.',
  'auth/user-not-found': 'That email or password isn’t right.',
  'auth/user-disabled': 'This account has been turned off.',
  'auth/too-many-requests': 'Too many tries. Please wait a little and try again.',
  'auth/network-request-failed': 'Please check your internet connection and try again.',
};

// Turns a Firebase error into a message that's safe to show on screen.
export function friendlyAuthError(err: unknown) {
  const message = err instanceof FirebaseError ? FRIENDLY_MESSAGES[err.code] : undefined;
  return message ?? 'Something went wrong. Please try again.';
}

// A simple shape check. Firebase does the real check when the form is sent.
export function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
