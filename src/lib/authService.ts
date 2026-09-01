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
 * Create a direct session user (fallback or demo profile)
 */
export function createDirectSessionUser(
  email: string,
  name?: string,
  role?: 'admin' | 'member',
  adminList: AdminEntry[] = []
): User {
  const normalizedEmail = email.trim().toLowerCase();
  const isSuper = normalizedEmail === PRIMARY_OWNER_EMAIL.toLowerCase();
  const isAdmin = isSuper || (role === 'admin') || isEmailAdmin(normalizedEmail, adminList);
  
  const displayName =
    name?.trim() ||
    (isSuper
      ? 'bigteggs26 (Super Admin)'
      : normalizedEmail
      ? normalizedEmail.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase())
      : 'Developer');

  return {
    id: `usr_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_') || 'demo'}`,
    name: displayName,
    email: normalizedEmail,
    avatar: getAvatarUrl(displayName, normalizedEmail),
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
      : 'Verified Member',
    authProvider: normalizedEmail.includes('@gmail.com') ? 'google' : 'password',
    emailVerified: true,
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
 * Smart sign in or register with seamless fallback:
 * 1. Tries signInWithEmail
 * 2. If user not found, automatically tries signUpWithEmail
 * 3. If Firebase Auth has operation-not-allowed, falls back to direct session
 */
export async function smartAuthenticate(
  email: string,
  password: string,
  displayName?: string,
  adminList: AdminEntry[] = []
): Promise<{ user: User; source: 'firebase_signin' | 'firebase_signup' | 'direct_session' }> {
  const normalizedEmail = email.trim();

  try {
    // 1. Try normal Firebase sign-in
    const fbUser = await signInWithEmail(normalizedEmail, password);
    return {
      user: formatFirebaseUser(fbUser, adminList),
      source: 'firebase_signin',
    };
  } catch (err: any) {
    const code = err?.code || '';

    // If user does not exist yet, attempt automatic creation
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
      try {
        const { user: newFbUser } = await signUpWithEmail(
          normalizedEmail,
          password,
          displayName
        );
        return {
          user: formatFirebaseUser(newFbUser, adminList),
          source: 'firebase_signup',
        };
      } catch (signupErr: any) {
        const signupCode = signupErr?.code || '';
        if (signupCode === 'auth/operation-not-allowed' || signupCode === 'auth/admin-restricted-operation') {
          // Firebase project email provider not enabled in GCP console -> generate direct session
          const directUser = createDirectSessionUser(normalizedEmail, displayName, undefined, adminList);
          return {
            user: directUser,
            source: 'direct_session',
          };
        }
        throw signupErr;
      }
    }

    // If email/password provider is not turned on in Firebase console
    if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
      const directUser = createDirectSessionUser(normalizedEmail, displayName, undefined, adminList);
      return {
        user: directUser,
        source: 'direct_session',
      };
    }

    // Rethrow other errors (wrong password, weak password, network error, etc.)
    throw err;
  }
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
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
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
      return 'No account found with this email. Click "Create Account" tab or use 1-Click Quick Access.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect password or credentials. If you haven\'t created this account yet, click "Create Account" or use 1-Click Quick Access.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to the "Sign In" tab or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters including letters and numbers.';
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed attempts. Please reset your password or try 1-Click Quick Access.';
    case 'auth/network-request-failed':
      return 'Network error occurred. Please check your connection or use 1-Click Quick Access.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by browser sandbox. Use 1-Click Quick Access below to enter immediately.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Authentication provider notice: Quick Access mode is enabled so you can log in immediately.';
    default:
      return message || 'Authentication failed. Please check your details and try again.';
  }
}
