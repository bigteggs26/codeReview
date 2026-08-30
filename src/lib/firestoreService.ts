import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Submission, AdminEntry } from '../types';
import { PRIMARY_OWNER_EMAIL, DEFAULT_ADMIN_LIST } from '../utils/googleAuth';
import { PRIMARY_OWNER_USER } from '../data/initialData';

const USERS_COLLECTION = 'users';
const SUBMISSIONS_COLLECTION = 'submissions';
const ADMINS_COLLECTION = 'admins';

/**
 * Real-time listener for Users
 */
export function subscribeToUsers(
  onUpdate: (users: User[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const usersRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as User);
      });

      // If empty in cloud, initialize with primary owner
      if (users.length === 0) {
        saveUserToCloud(PRIMARY_OWNER_USER).catch(console.error);
        onUpdate([PRIMARY_OWNER_USER]);
      } else {
        // Sort with Super Admin / primary owner first, then alphabetically
        users.sort((a, b) => {
          if (a.isSuperAdmin) return -1;
          if (b.isSuperAdmin) return 1;
          return a.name.localeCompare(b.name);
        });
        onUpdate(users);
      }
    },
    (err) => {
      console.error('Firestore Users listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Submissions
 */
export function subscribeToSubmissions(
  onUpdate: (submissions: Submission[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
  return onSnapshot(
    submissionsRef,
    (snapshot) => {
      const submissions: Submission[] = [];
      snapshot.forEach((docSnap) => {
        submissions.push(docSnap.data() as Submission);
      });
      // Sort newest first
      submissions.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      onUpdate(submissions);
    },
    (err) => {
      console.error('Firestore Submissions listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Admin Whitelist
 */
export function subscribeToAdmins(
  onUpdate: (admins: AdminEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const adminsRef = collection(db, ADMINS_COLLECTION);
  return onSnapshot(
    adminsRef,
    (snapshot) => {
      const admins: AdminEntry[] = [];
      snapshot.forEach((docSnap) => {
        admins.push(docSnap.data() as AdminEntry);
      });

      if (admins.length === 0) {
        // Seed default primary owner admin entry
        DEFAULT_ADMIN_LIST.forEach((admin) => {
          saveAdminToCloud(admin).catch(console.error);
        });
        onUpdate(DEFAULT_ADMIN_LIST);
      } else {
        onUpdate(admins);
      }
    },
    (err) => {
      console.error('Firestore Admins listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Update a user in cloud database
 */
export async function saveUserToCloud(user: User): Promise<void> {
  if (!user.id) return;
  const userRef = doc(db, USERS_COLLECTION, user.id);
  const dataToSave: User = {
    ...user,
    lastSeenAt: new Date().toISOString(),
  };
  await setDoc(userRef, dataToSave, { merge: true });
}

/**
 * Delete a user from cloud database
 */
export async function deleteUserFromCloud(userId: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(userRef);
}

/**
 * Save / Update a submission in cloud database
 */
export async function saveSubmissionToCloud(submission: Submission): Promise<void> {
  if (!submission.id) return;
  const subRef = doc(db, SUBMISSIONS_COLLECTION, submission.id);
  await setDoc(subRef, submission, { merge: true });
}

/**
 * Delete a submission from cloud database
 */
export async function deleteSubmissionFromCloud(submissionId: string): Promise<void> {
  const subRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
  await deleteDoc(subRef);
}

/**
 * Save / Update an admin entry in cloud database
 */
export async function saveAdminToCloud(admin: AdminEntry): Promise<void> {
  if (!admin.id) return;
  const adminRef = doc(db, ADMINS_COLLECTION, admin.id);
  await setDoc(adminRef, admin, { merge: true });
}

/**
 * Remove an admin from cloud database
 */
export async function removeAdminFromCloud(adminId: string): Promise<void> {
  const adminRef = doc(db, ADMINS_COLLECTION, adminId);
  await deleteDoc(adminRef);
}

/**
 * Purge all users and demo records, preserving the super admin owner
 */
export async function clearAllUsersFromCloud(preserveUser: User): Promise<void> {
  const usersRef = collection(db, USERS_COLLECTION);
  const snapshot = await getDocs(usersRef);
  const batch = writeBatch(db);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as User;
    if (
      data.email?.toLowerCase() !== PRIMARY_OWNER_EMAIL.toLowerCase() &&
      data.id !== preserveUser.id
    ) {
      batch.delete(docSnap.ref);
    }
  });

  // Ensure owner is preserved
  const ownerRef = doc(db, USERS_COLLECTION, preserveUser.id);
  batch.set(ownerRef, preserveUser, { merge: true });

  await batch.commit();
}
