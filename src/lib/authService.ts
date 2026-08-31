import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  reload,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase';
import { User, AdminEntry } from '../types';
import { PRIMARY_OWNER_EMAIL, isEmailAdmin, getAvatarUrl } from '../utils/googleAuth';

/**
 * Format a Firebase User into our application User object
 */
export function formatFirebaseUser(
  firebaseUser: FirebaseUser,
  adminList: AdminEntry[] = []
): User {
  const email = (firebaseUser.email || '').trim().toLowerCase();
  const isSuper = email === PRIMARY_OWNER_EMAIL.toLowerCase();
  const isAdmin = isSuper || isEmailAdmin(email, adminList);
  const name =
    firebaseUser.displayName?.trim() ||
    (isSuper
      ? 'bigteggs26 (Super Admin)'
      : email
      ? email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase())
      : 'Developer');

  const avatar =
    firebaseUser.photoURL ||
    getAvatarUrl(name, email);

  const isGoogle = firebaseUser.providerData.some(
    (p) => p.providerId === 'google.com'
  );

  return {
    id: firebaseUser.uid,
    name: name,
    email: email,
    avatar: avatar,
    role: isAdmin ? 'admin' : 'member',
    title: isSuper
      ? 'Super Administrator & Lead Reviewer'
      : isAdmin
      ? 'Platform Reviewer & Admin'
      : 'Software Engineer',
    badge: isSuper
      ? 'Super Admin'
      : isAdmin
      ? 'Team Admin'
      : isGoogle
      ? 'Google Verified'
      : firebaseUser.emailVerified
      ? 'Verified Member'
      : 'Member (Unverified)',
    authProvider: isGoogle ? 'google' : 'password',
    emailVerified: firebaseUser.emailVerified,
    isSuperAdmin: isSuper,
    lastSeenAt: new Date().toISOString(),
  };
}

/**
 * Sign up a new user with Email and Password
 * Automatically sends verification email
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: FirebaseUser; verificationSent: boolean }> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  const user = userCredential.user;

  if (displayName?.trim()) {
    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: getAvatarUrl(displayName.trim(), email.trim()),
      });
    } catch (e) {
      console.warn('Could not update profile name on signup:', e);
    }
  }

  let verificationSent = false;
  try {
    await sendEmailVerification(user);
    verificationSent = true;
  } catch (vErr) {
    console.warn('Could not send verification email immediately:', vErr);
  }

  return { user, verificationSent };
}

/**
 * Sign in existing user with Email and Password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  return userCredential.user;
}

/**
 * Resend Email Verification link to the currently signed-in user
 */
export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in to verify.');
  }
  await sendEmailVerification(user);
}

/**
 * Send Password Reset link to user's email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  return result.user;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Reload Firebase user to refresh token and emailVerified status
 */
export async function refreshCurrentUser(): Promise<FirebaseUser | null> {
  const user = auth.currentUser;
  if (user) {
    await reload(user);
    return auth.currentUser;
  }
  return null;
}

/**
 * Map Firebase Auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your spelling or create a new account.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password or credentials. Please try again or use "Forgot Password".';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters including letters and numbers.';
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed attempts. Please reset your password or try again later.';
    case 'auth/network-request-failed':
      return 'Network error occurred. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups or use email sign in.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is currently disabled in the Firebase Console. You can sign in with Google or enable Email/Password provider in the Firebase Authentication console.';
    default:
      return message || 'Authentication failed. Please check your details and try again.';
  }
}
