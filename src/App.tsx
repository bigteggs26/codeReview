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
import { GoogleLoginModal } from './components/GoogleLoginModal';
import { AdminManagementModal } from './components/AdminManagementModal';
import { AuthGate } from './components/AuthGate';
import {
  DEFAULT_ADMIN_LIST,
  PRIMARY_OWNER_EMAIL,
  isEmailAdmin,
  getAvatarUrl,
} from './utils/googleAuth';
import {
  subscribeToUsers,
  subscribeToSubmissions,
  subscribeToAdmins,
  saveUserToCloud,
  deleteUserFromCloud,
  saveSubmissionToCloud,
  deleteSubmissionFromCloud,
  saveAdminToCloud,
  removeAdminFromCloud,
  clearAllUsersFromCloud,
} from './lib/firestoreService';
import { CheckCircle2, CloudCheck, CloudOff, Info } from 'lucide-react';

const STORAGE_KEY_CURRENT_USER = 'codescore_portal_active_user_v2';

export default function App() {
  const [adminList, setAdminList] = useState<AdminEntry[]>(DEFAULT_ADMIN_LIST);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Require explicit login so visitors do NOT inherit the owner's Super Admin account by default
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && !parsed.email.endsWith('@teamdev.internal')) {
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

  const [googleLoginModalOpen, setGoogleLoginModalOpen] = useState(false);
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
            if (matched) return matched;
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

  // Sign out user and clear storage
  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('Signed Out', 'You have been signed out of your developer workspace.');
  };

  // Google Login Success Handler
  const handleGoogleLoginSuccess = async (googleUser: User) => {
    const isAdmin = isEmailAdmin(googleUser.email, adminList);
    const updatedUser: User = {
      ...googleUser,
      role: isAdmin ? 'admin' : 'member',
      isSuperAdmin:
        googleUser.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase() ||
        googleUser.isSuperAdmin,
      lastSeenAt: new Date().toISOString(),
    };

    // Save to Cloud Firestore so all users and devices instantly see this account
    try {
      await saveUserToCloud(updatedUser);
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }

    setCurrentUser(updatedUser);
    setGoogleLoginModalOpen(false);

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
    if (email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) {
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
    if (target?.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) {
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

    if (target.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase() && newRole === 'member') {
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
      name: currentUser?.name || 'bigteggs26',
      email: currentUser?.email || PRIMARY_OWNER_EMAIL,
      role: 'admin',
      isSuperAdmin: true,
      avatar: currentUser?.avatar || getAvatarUrl('bigteggs26', PRIMARY_OWNER_EMAIL),
      title: 'Lead Administrator & Reviewer',
      badge: 'Super Admin',
      authProvider: currentUser?.authProvider || 'google',
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

  // If user is not authenticated, render the dedicated AuthGate so no unauthorized user inherits owner data
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
        <AuthGate
          onLoginSuccess={handleGoogleLoginSuccess}
          adminList={adminList}
          isCloudConnected={isCloudConnected}
        />
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
        onOpenGoogleLogin={() => setGoogleLoginModalOpen(true)}
        onOpenAdminManagement={() => setAdminManagementModalOpen(true)}
        onSignOut={handleSignOut}
        pendingCount={pendingCount}
        isCloudConnected={isCloudConnected}
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

      {/* Google Login Modal */}
      {googleLoginModalOpen && (
        <GoogleLoginModal
          onClose={() => setGoogleLoginModalOpen(false)}
          onLoginSuccess={handleGoogleLoginSuccess}
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
          onAddTeamMember={handleAddTeamMember}
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

