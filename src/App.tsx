import React, { useState, useEffect } from 'react';
import { User, Submission, Review, SubmissionStatus, AdminEntry } from './types';
import { INITIAL_USERS, INITIAL_SUBMISSIONS, PRIMARY_OWNER_USER } from './data/initialData';
import { Header } from './components/Header';
import { MemberDashboard } from './components/MemberDashboard';
import { AdminQueue } from './components/AdminQueue';
import { TeamLeaderboard } from './components/TeamLeaderboard';
import { SubmitModal } from './components/SubmitModal';
import { ReviewModal } from './components/ReviewModal';
import { SubmissionDetailModal } from './components/SubmissionDetailModal';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { AdminManagementModal } from './components/AdminManagementModal';
import {
  DEFAULT_ADMIN_LIST,
  PRIMARY_OWNER_EMAIL,
  isPrimaryOwner,
  isEmailAdmin,
  getAvatarUrl,
} from './utils/authConfig';
import {
  subscribeToUsers,
  subscribeToSubmissions,
  subscribeToAdmins,
  subscribeToAuthPolicy,
  broadcastForceRelogin,
  saveUserToCloud,
  deleteUserFromCloud,
  saveSubmissionToCloud,
  deleteSubmissionFromCloud,
  saveAdminToCloud,
  removeAdminFromCloud,
  clearAllUsersFromCloud,
  purgeAllUsersFromCloud,
} from './lib/firestoreService';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { signOutUser, formatFirebaseUser } from './lib/authService';
import { CheckCircle2, CloudCheck, CloudOff, Info } from 'lucide-react';

const STORAGE_KEY_CURRENT_USER = 'codescore_portal_active_user_v6';
const STORAGE_KEY_FORCE_RELOGIN_APPLIED = 'codescore_force_relogin_v20260902_epoch1';

export default function App() {
  const [adminList, setAdminList] = useState<AdminEntry[]>(DEFAULT_ADMIN_LIST);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Forced Re-login Enforcement:
  // Purge any stale, cached, or automatically granted sessions so all users are required to sign in freshly.
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const hasAppliedRevocation = localStorage.getItem(STORAGE_KEY_FORCE_RELOGIN_APPLIED);
      if (!hasAppliedRevocation) {
        // Purge all legacy stored session keys
        const legacyKeys = [
          'codescore_portal_active_user_v1',
          'codescore_portal_active_user_v2',
          'codescore_portal_active_user_v3',
          'codescore_portal_active_user_v4',
          'codescore_portal_active_user_v5',
          'codescore_portal_active_user',
          'codescore_portal_auth_session_v1',
          'codescore_portal_google_auth_session_v1',
          STORAGE_KEY_CURRENT_USER,
        ];
        legacyKeys.forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(STORAGE_KEY_FORCE_RELOGIN_APPLIED, 'true');
        signOutUser().catch(() => {});
        return null;
      }

      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.authenticatedAt) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'leaderboard'>('dashboard');

  // Modals state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [resubmissionTarget, setResubmissionTarget] = useState<Submission | undefined>(undefined);

  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [adminManagementModalOpen, setAdminManagementModalOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string } | null>(null);

  // Persist current session locally
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      const hasAppliedRevocation = localStorage.getItem(STORAGE_KEY_FORCE_RELOGIN_APPLIED);
      if (!hasAppliedRevocation) {
        await signOutUser().catch(() => {});
        setCurrentUser(null);
        return;
      }

      if (firebaseUser) {
        const appUser = formatFirebaseUser(firebaseUser, adminList);
        setCurrentUser(appUser);
        try {
          await saveUserToCloud(appUser);
        } catch (e) {
          console.error('Error saving user on auth state change:', e);
        }
      }
    });

    return () => unsubscribeAuth();
  }, [adminList]);

  // Real-time listener for global session revocation / security policies
  useEffect(() => {
    const unsubPolicy = subscribeToAuthPolicy((policy) => {
      if (!policy?.forceReloginAt) return;
      const revocationTime = new Date(policy.forceReloginAt).getTime();

      setCurrentUser((prev) => {
        if (!prev) return null;
        const sessionTime = prev.authenticatedAt ? new Date(prev.authenticatedAt).getTime() : 0;
        if (sessionTime < revocationTime) {
          signOutUser().catch(() => {});
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          showToast(
            'Session Expired',
            'All active sessions were revoked by the administrator. Please log in again.'
          );
          return null;
        }
        return prev;
      });
    });

    return () => unsubPolicy();
  }, []);

  // Real-time Firestore Cloud Synchronization
  useEffect(() => {
    // 1. Subscribe to Cloud Users
    const unsubUsers = subscribeToUsers(
      (cloudUsers) => {
        setIsCloudConnected(true);
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(cloudUsers);
          // Keep current logged-in user in sync with updated roles/badges in cloud
          setCurrentUser((prev) => {
            if (!prev) return null;
            const matched = cloudUsers.find(
              (u) =>
                u.id === prev.id ||
                (u.email && prev.email && u.email.toLowerCase() === prev.email.toLowerCase())
            );
            if (matched) return { ...prev, ...matched };
            return prev;
          });
        }
      },
      (err) => {
        console.error('Failed to sync users with cloud:', err);
        setIsCloudConnected(false);
      }
    );

    // 2. Subscribe to Cloud Submissions
    const unsubSubs = subscribeToSubmissions(
      (cloudSubs) => {
        setSubmissions(cloudSubs);
      },
      (err) => {
        console.error('Failed to sync submissions with cloud:', err);
      }
    );

    // 3. Subscribe to Cloud Admin Whitelist
    const unsubAdmins = subscribeToAdmins(
      (cloudAdmins) => {
        setAdminList(cloudAdmins);
      },
      (err) => {
        console.error('Failed to sync admins with cloud:', err);
      }
    );

    return () => {
      unsubUsers();
      unsubSubs();
      unsubAdmins();
    };
  }, []);

  const showToast = (title: string, desc?: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    showToast(`Switched user to ${user.name}`, `Active role: ${user.role.toUpperCase()}`);
    if (user.role === 'member' && activeTab === 'queue') {
      setActiveTab('dashboard');
    }
  };

  // Sign out user and return to authentication portal
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('Signed Out', 'You have been signed out. Please sign in to continue.');
  };

  // Force all users across all devices to re-login by publishing a session revocation timestamp to Firestore
  const handleForceReloginAll = async () => {
    try {
      const revokedBy = currentUser?.email || PRIMARY_OWNER_EMAIL;
      await broadcastForceRelogin(revokedBy, 'Administrator triggered global forced re-login.');
      await signOutUser().catch(() => {});
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      setCurrentUser(null);
      showToast('All Sessions Revoked', 'Forced all users to re-login across all active devices.');
    } catch (e) {
      console.error('Error broadcasting force relogin:', e);
      showToast('Action Failed', 'Could not broadcast global relogin policy.');
    }
  };

  // Login Success Handler
  const handleLoginSuccess = async (authUser: User) => {
    const isSuper = isPrimaryOwner(authUser.email) || Boolean(authUser.isSuperAdmin);
    const isAdmin = isSuper || isEmailAdmin(authUser.email, adminList);
    const updatedUser: User = {
      ...authUser,
      role: isAdmin ? 'admin' : 'member',
      isSuperAdmin: isSuper,
      lastSeenAt: new Date().toISOString(),
      authenticatedAt: authUser.authenticatedAt || new Date().toISOString(),
    };

    // Save to Cloud Firestore so all users and devices instantly see this account
    try {
      await saveUserToCloud(updatedUser);
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }

    setCurrentUser(updatedUser);
    setAuthModalOpen(false);

    showToast(
      `Welcome, ${updatedUser.name}!`,
      `Signed in as ${updatedUser.role.toUpperCase()}${
        updatedUser.isSuperAdmin ? ' (Super Admin)' : ''
      } • Cloud Synced`
    );
  };

  // Admin Management Handlers
  const handleAddAdmin = async (email: string, name: string, title?: string) => {
    const newEntry: AdminEntry = {
      id: `admin-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      addedAt: new Date().toISOString(),
      roleTitle: title || 'Code Reviewer & Staff Admin',
    };

    try {
      await saveAdminToCloud(newEntry);
      // Also elevate user in cloud database if they exist
      const existingUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        await saveUserToCloud({ ...existingUser, role: 'admin' });
      }
    } catch (e) {
      console.error(e);
    }

    if (currentUser?.email?.toLowerCase() === email.toLowerCase()) {
      setCurrentUser((prev) => (prev ? { ...prev, role: 'admin' } : null));
    }

    showToast('Admin Authorized', `${email} now has full Reviewer & Admin privileges (Saved to Cloud).`);
  };

  const handleRemoveAdmin = async (adminId: string, email: string) => {
    if (isPrimaryOwner(email)) {
      showToast('Cannot Remove Owner', 'The Primary Owner account cannot be removed from admins.');
      return;
    }

    try {
      await removeAdminFromCloud(adminId);
      const existingUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        await saveUserToCloud({ ...existingUser, role: 'member' });
      }
    } catch (e) {
      console.error(e);
    }

    if (currentUser?.email?.toLowerCase() === email.toLowerCase()) {
      setCurrentUser((prev) => (prev ? { ...prev, role: 'member' } : null));
    }

    showToast('Admin Removed', `${email} was removed from the admin whitelist.`);
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (isPrimaryOwner(target?.email || '')) {
      showToast('Cannot Delete Owner', 'Primary Owner cannot be deleted.');
      return;
    }

    try {
      await deleteUserFromCloud(userId);
    } catch (e) {
      console.error(e);
    }

    if (currentUser?.id === userId) {
      handleSignOut();
    }

    showToast('User Deleted', `${target?.name || 'User'} removed from cloud database.`);
  };

  const handleToggleUserRole = async (userId: string, newRole: 'admin' | 'member') => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (isPrimaryOwner(target.email || '') && newRole === 'member') {
      showToast('Cannot Demote Owner', 'Primary Owner must retain Admin privileges.');
      return;
    }

    const updated = { ...target, role: newRole };
    try {
      await saveUserToCloud(updated);
      if (newRole === 'admin' && target.email) {
        await handleAddAdmin(target.email, target.name, target.title);
      }
    } catch (e) {
      console.error(e);
    }

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }

    showToast('Role Updated', `${target.name} is now a ${newRole.toUpperCase()} in Cloud DB.`);
  };

  // Remove all demo users and start with clean slate in Firestore
  const handleRemoveAllUsers = async (preserveCurrentUser: boolean) => {
    const ownerUser: User = {
      id: currentUser?.id || 'user-owner',
      name: currentUser?.name || 'Lead Admin',
      email: currentUser?.email || PRIMARY_OWNER_EMAIL,
      role: 'admin',
      isSuperAdmin: true,
      avatar: currentUser?.avatar || getAvatarUrl('Lead Admin', PRIMARY_OWNER_EMAIL),
      title: 'Lead Administrator & Reviewer',
      badge: 'Super Admin',
      authProvider: 'password',
    };

    try {
      await clearAllUsersFromCloud(ownerUser);
    } catch (e) {
      console.error(e);
    }

    setCurrentUser(ownerUser);
    showToast(
      'All Non-Owner Users Removed',
      'Cloud database cleared. Only your Super Admin account remains.'
    );
  };

  // Complete wipe of ALL accounts including current user
  const handleTotalPurge = async () => {
    try {
      await purgeAllUsersFromCloud();
    } catch (e) {
      console.error(e);
    }
    handleSignOut();
    showToast(
      'All Accounts Cleared',
      'Database wiped. Primary owner accounts maintain Super Admin access upon signing in.'
    );
  };

  // Add custom team member to cloud database
  const handleAddTeamMember = async (member: Omit<User, 'id'>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...member,
    };

    try {
      await saveUserToCloud(newUser);
      showToast('Team Member Created', `${newUser.name} was added to the central cloud database.`);
    } catch (e) {
      console.error(e);
      showToast('Error saving user', 'Could not sync with cloud database.');
    }
  };

  // Submit new code or revised code to cloud database
  const handleSubmitCode = async (
    submissionData: Omit<Submission, 'id' | 'submittedAt' | 'status'>,
    isResubmission?: boolean
  ) => {
    if (isResubmission && resubmissionTarget) {
      const revisedSub: Submission = {
        ...resubmissionTarget,
        title: submissionData.title,
        language: submissionData.language,
        description: submissionData.description,
        code: submissionData.code,
        tags: submissionData.tags,
        status: 'pending' as SubmissionStatus,
        submittedAt: new Date().toISOString(),
        resubmissionCount: (resubmissionTarget.resubmissionCount || 0) + 1,
      };

      try {
        await saveSubmissionToCloud(revisedSub);
        showToast('Revised code submitted!', 'Synced to reviewers in real-time.');
      } catch (e) {
        console.error(e);
      }
    } else {
      const newSub: Submission = {
        id: `sub-${Date.now()}`,
        ...submissionData,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      try {
        await saveSubmissionToCloud(newSub);
        showToast('Code submitted successfully!', 'Reviewers notified across all active devices.');
      } catch (e) {
        console.error(e);
      }
    }

    setSubmitModalOpen(false);
    setResubmissionTarget(undefined);
  };

  // Save review from admin to cloud database
  const handleSaveReview = async (
    submissionId: string,
    review: Review,
    statusOutcome: 'reviewed' | 'needs_resubmission'
  ) => {
    const existing = submissions.find((s) => s.id === submissionId);
    if (!existing) return;

    const updated: Submission = {
      ...existing,
      status: statusOutcome,
      review,
    };

    try {
      await saveSubmissionToCloud(updated);
      showToast(
        statusOutcome === 'reviewed' ? 'Review & Score Published!' : 'Resubmission Requested!',
        `Score: ${review.score}/100 • Feedback and diff saved in real-time.`
      );
    } catch (e) {
      console.error(e);
    }

    setReviewingSubmission(null);
  };

  // Update AI detection result on a submission in cloud database
  const handleUpdateSubmissionAiDetection = async (
    submissionId: string,
    aiDetection: any
  ) => {
    const existing = submissions.find((s) => s.id === submissionId);
    if (!existing) return;

    const updated: Submission = {
      ...existing,
      aiDetection,
    };

    try {
      await saveSubmissionToCloud(updated);
    } catch (e) {
      console.error(e);
    }

    setViewingSubmission((prev) =>
      prev && prev.id === submissionId ? { ...prev, aiDetection } : prev
    );
    setReviewingSubmission((prev) =>
      prev && prev.id === submissionId ? { ...prev, aiDetection } : prev
    );

    showToast(
      'AI Analysis Complete',
      `Probability: ${aiDetection.aiProbability}% • ${aiDetection.verdict}`
    );
  };

  const handleResetData = async () => {
    try {
      await clearAllUsersFromCloud(PRIMARY_OWNER_USER);
      setCurrentUser(PRIMARY_OWNER_USER);
      setActiveTab('dashboard');
      showToast('Reset to clean database', 'Database refreshed.');
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <AuthGate
          onLoginSuccess={handleLoginSuccess}
          adminList={adminList}
          isCloudConnected={isCloudConnected}
        />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="rounded-xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-4 flex items-start gap-3 max-w-sm">
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{toastMessage.title}</p>
                {toastMessage.desc && (
                  <p className="text-[11px] text-slate-300 mt-0.5">{toastMessage.desc}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={handleSelectUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSubmitModal={() => {
          setResubmissionTarget(undefined);
          setSubmitModalOpen(true);
        }}
        onOpenAuthModal={(mode = 'signin') => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenAdminManagement={() => setAdminManagementModalOpen(true)}
        onSignOut={handleSignOut}
        pendingCount={pendingCount}
        isCloudConnected={isCloudConnected}
      />

      {/* Email Verification Alert Banner (if logged in with unverified password account) */}
      <EmailVerificationBanner
        currentUser={currentUser}
        onUserUpdated={(updated) => {
          setCurrentUser(updated);
          showToast('Email Verified!', 'Your account email has been confirmed.');
        }}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <MemberDashboard
            currentUser={currentUser}
            submissions={submissions}
            onOpenSubmitModal={(subToResubmit) => {
              setResubmissionTarget(subToResubmit);
              setSubmitModalOpen(true);
            }}
            onViewSubmission={(sub) => setViewingSubmission(sub)}
          />
        )}

        {activeTab === 'queue' && currentUser.role === 'admin' && (
          <AdminQueue
            currentUser={currentUser}
            submissions={submissions}
            onReviewSubmission={(sub) => setReviewingSubmission(sub)}
            onViewSubmission={(sub) => setViewingSubmission(sub)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <TeamLeaderboard
            users={users}
            submissions={submissions}
            onSelectMember={(member) => {
              handleSelectUser(member);
              setActiveTab('dashboard');
            }}
          />
        )}
      </main>

      {/* Authentication Modal (Sign In / Sign Up / Reset Password) */}
      {authModalOpen && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          adminList={adminList}
        />
      )}

      {/* Admin & User Directory Management Modal */}
      {adminManagementModalOpen && (
        <AdminManagementModal
          currentUser={currentUser}
          users={users}
          adminList={adminList}
          onClose={() => setAdminManagementModalOpen(false)}
          onAddAdmin={handleAddAdmin}
          onRemoveAdmin={handleRemoveAdmin}
          onDeleteUser={handleDeleteUser}
          onToggleUserRole={handleToggleUserRole}
          onRemoveAllUsers={handleRemoveAllUsers}
          onWipeEverything={handleTotalPurge}
          onAddTeamMember={handleAddTeamMember}
          onForceReloginAll={handleForceReloginAll}
        />
      )}

      {/* Submit Code Modal */}
      {submitModalOpen && (
        <SubmitModal
          currentUser={currentUser}
          onClose={() => {
            setSubmitModalOpen(false);
            setResubmissionTarget(undefined);
          }}
          onSubmit={handleSubmitCode}
          resubmissionTarget={resubmissionTarget}
        />
      )}

      {/* Review Modal (Admin) */}
      {reviewingSubmission && (
        <ReviewModal
          submission={reviewingSubmission}
          currentUser={currentUser}
          onClose={() => setReviewingSubmission(null)}
          onSaveReview={handleSaveReview}
          onUpdateSubmissionAiDetection={handleUpdateSubmissionAiDetection}
        />
      )}

      {/* View Submission Details & Diff Modal */}
      {viewingSubmission && (
        <SubmissionDetailModal
          submission={viewingSubmission}
          currentUser={currentUser}
          onClose={() => setViewingSubmission(null)}
          onResubmit={(sub) => {
            setViewingSubmission(null);
            setResubmissionTarget(sub);
            setSubmitModalOpen(true);
          }}
          onOpenReviewModal={(sub) => {
            setViewingSubmission(null);
            setReviewingSubmission(sub);
          }}
          onUpdateSubmissionAiDetection={handleUpdateSubmissionAiDetection}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="rounded-xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-4 flex items-start gap-3 max-w-sm">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{toastMessage.title}</p>
              {toastMessage.desc && (
                <p className="text-[11px] text-slate-300 mt-0.5">{toastMessage.desc}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

