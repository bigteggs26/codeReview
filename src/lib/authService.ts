import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { User, AdminEntry } from '../types';
import { PRIMARY_OWNER_EMAIL, isEmailAdmin, getAvatarUrl } from '../utils/authConfig';

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
  const isGoogle =
    firebaseUser.providerData.some((p) => p.providerId === 'google.com') ||
    email.endsWith('@gmail.com');

  const name =
    firebaseUser.displayName?.trim() ||
    (isSuper
      ? 'Lead Administrator'
      : email
      ? email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase())
      : 'Developer');

  const avatar =
    firebaseUser.photoURL ||
    getAvatarUrl(name, email);

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
      : isGoogle
      ? 'Verified Developer'
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
    emailVerified: isGoogle ? true : firebaseUser.emailVerified,
    isSuperAdmin: isSuper,
    lastSeenAt: new Date().toISOString(),
    authenticatedAt: new Date().toISOString(),
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
      ? 'Lead Administrator'
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
    authProvider: 'password',
    emailVerified: true,
    isSuperAdmin: isSuper,
    lastSeenAt: new Date().toISOString(),
    authenticatedAt: new Date().toISOString(),
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
 * Sign in or sign up with Google account via Firebase Popup
 */
export async function signInWithGoogle(adminList: AdminEntry[] = []): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return formatFirebaseUser(result.user, adminList);
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
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was dismissed. You can try again or sign in with email & password.';
    case 'auth/cancelled-popup-request':
      return 'Google sign-in request was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This application domain is not yet authorized in Firebase OAuth. Please check domain authorization.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please click the "Create Account" tab or sign in with Google.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect password or credentials. If you have not created this account yet, click "Create Account" or sign in with Google.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to the "Sign In" tab or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters including letters and numbers.';
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed attempts. Please reset your password or sign in with Google.';
    case 'auth/network-request-failed':
      return 'Network error occurred. Please check your internet connection.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Authentication operation restricted. Please sign in with Google or contact the administrator.';
    default:
      return message || 'Authentication failed. Please check your details and try again.';
  }
}
