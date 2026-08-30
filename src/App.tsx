import React, { useState, useEffect } from 'react';
import { User, Submission, Review, SubmissionStatus, AdminEntry } from './types';
import { INITIAL_USERS, INITIAL_SUBMISSIONS } from './data/initialData';
import { Header } from './components/Header';
import { MemberDashboard } from './components/MemberDashboard';
import { AdminQueue } from './components/AdminQueue';
import { TeamLeaderboard } from './components/TeamLeaderboard';
import { SubmitModal } from './components/SubmitModal';
import { ReviewModal } from './components/ReviewModal';
import { SubmissionDetailModal } from './components/SubmissionDetailModal';
import { RoleSwitcher } from './components/RoleSwitcher';
import { GoogleLoginModal } from './components/GoogleLoginModal';
import { AdminManagementModal } from './components/AdminManagementModal';
import {
  DEFAULT_ADMIN_LIST,
  PRIMARY_OWNER_EMAIL,
  isEmailAdmin,
  getAvatarUrl,
} from './utils/googleAuth';
import { CheckCircle2, Info } from 'lucide-react';

const STORAGE_KEY_SUBMISSIONS = 'codescore_portal_submissions_v1';
const STORAGE_KEY_USERS = 'codescore_portal_users_v1';
const STORAGE_KEY_CURRENT_USER = 'codescore_portal_active_user_v1';
const STORAGE_KEY_ADMIN_LIST = 'codescore_portal_admins_v1';

export default function App() {
  // Initialize admin list state with localStorage persistence
  const [adminList, setAdminList] = useState<AdminEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_LIST);
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_LIST;
    } catch {
      return DEFAULT_ADMIN_LIST;
    }
  });

  // Initialize users state with localStorage persistence
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        const exists = users.find((u) => u.id === parsed.id || u.email === parsed.email);
        if (exists) return exists;
      }
      return users[0] || INITIAL_USERS[0];
    } catch {
      return users[0] || INITIAL_USERS[0];
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
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

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_LIST, JSON.stringify(adminList));
    } catch (e) {
      console.error(e);
    }
  }, [adminList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
    } catch (e) {
      console.error(e);
    }
  }, [submissions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const showToast = (title: string, desc?: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    showToast(`Switched user to ${user.name}`, `Active role: ${user.role.toUpperCase()}`);
    // If switching from admin to member, ensure they are on a valid view
    if (user.role === 'member' && activeTab === 'queue') {
      setActiveTab('dashboard');
    }
  };

  // Google Login Success Handler
  const handleGoogleLoginSuccess = (googleUser: User) => {
    // Check if user is in admin list
    const isAdmin = isEmailAdmin(googleUser.email, adminList);
    const updatedUser: User = {
      ...googleUser,
      role: isAdmin ? 'admin' : 'member',
      isSuperAdmin:
        googleUser.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase() ||
        googleUser.isSuperAdmin,
    };

    // Add or update in users list
    setUsers((prev) => {
      const existingIdx = prev.findIndex(
        (u) =>
          u.email?.toLowerCase() === updatedUser.email?.toLowerCase() ||
          u.id === updatedUser.id
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...updatedUser };
        return copy;
      }
      return [updatedUser, ...prev];
    });

    setCurrentUser(updatedUser);
    setGoogleLoginModalOpen(false);

    showToast(
      `Welcome, ${updatedUser.name}!`,
      `Signed in with Google as ${updatedUser.role.toUpperCase()}${
        updatedUser.isSuperAdmin ? ' (Primary Owner & Super Admin)' : ''
      }`
    );
  };

  // Admin Management Handlers
  const handleAddAdmin = (email: string, name: string, title?: string) => {
    const newEntry: AdminEntry = {
      id: `admin-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      addedAt: new Date().toISOString(),
      roleTitle: title || 'Code Reviewer & Staff Admin',
    };

    setAdminList((prev) => {
      if (prev.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        return prev;
      }
      return [...prev, newEntry];
    });

    // Also update user in user list if already present
    setUsers((prev) =>
      prev.map((u) => {
        if (u.email?.toLowerCase() === email.toLowerCase()) {
          return { ...u, role: 'admin' };
        }
        return u;
      })
    );

    // If current user is this person, elevate role
    if (currentUser.email?.toLowerCase() === email.toLowerCase()) {
      setCurrentUser((prev) => ({ ...prev, role: 'admin' }));
    }

    showToast('Admin Authorized', `${email} now has full Reviewer & Admin privileges.`);
  };

  const handleRemoveAdmin = (adminId: string, email: string) => {
    if (email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) {
      showToast('Cannot Remove Owner', 'The Primary Owner account cannot be removed from admins.');
      return;
    }

    setAdminList((prev) => prev.filter((a) => a.id !== adminId && a.email.toLowerCase() !== email.toLowerCase()));

    // Demote in user list
    setUsers((prev) =>
      prev.map((u) => {
        if (u.email?.toLowerCase() === email.toLowerCase()) {
          return { ...u, role: 'member' };
        }
        return u;
      })
    );

    if (currentUser.email?.toLowerCase() === email.toLowerCase()) {
      setCurrentUser((prev) => ({ ...prev, role: 'member' }));
    }

    showToast('Admin Removed', `${email} was removed from the admin whitelist.`);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target?.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) {
      showToast('Cannot Delete Owner', 'Primary Owner cannot be deleted.');
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));

    // If current user was deleted, switch to another user or owner
    if (currentUser.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUser(remaining[0]);
      }
    }

    showToast('User Deleted', `${target?.name || 'User'} removed from portal.`);
  };

  const handleToggleUserRole = (userId: string, newRole: 'admin' | 'member') => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (target.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase() && newRole === 'member') {
      showToast('Cannot Demote Owner', 'Primary Owner must retain Admin privileges.');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }

    // Sync admin list
    if (newRole === 'admin' && target.email) {
      handleAddAdmin(target.email, target.name, target.title);
    }

    showToast('Role Updated', `${target.name} is now a ${newRole.toUpperCase()}.`);
  };

  // Remove all demo users and start with clean slate, keeping current admin/owner
  const handleRemoveAllUsers = (preserveCurrentUser: boolean) => {
    // Ensure primary owner or current logged in user is preserved
    const ownerUser: User = {
      id: currentUser.id || 'owner-user',
      name: currentUser.name || 'Owner Administrator',
      email: currentUser.email || PRIMARY_OWNER_EMAIL,
      role: 'admin',
      isSuperAdmin: true,
      avatar: currentUser.avatar || getAvatarUrl('Admin Owner', PRIMARY_OWNER_EMAIL),
      title: 'Principal Architect & Admin',
      badge: 'Super Admin',
      authProvider: currentUser.authProvider || 'google',
    };

    setUsers([ownerUser]);
    setCurrentUser(ownerUser);

    showToast(
      'All Demo Users Removed',
      'Portal cleared. Only your Super Admin account remains.'
    );
  };

  // Add custom team member
  const handleAddTeamMember = (member: Omit<User, 'id'>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...member,
    };

    setUsers((prev) => [...prev, newUser]);
    showToast('Team Member Created', `${newUser.name} was added to the portal.`);
  };

  // Submit new code or revised code
  const handleSubmitCode = (
    submissionData: Omit<Submission, 'id' | 'submittedAt' | 'status'>,
    isResubmission?: boolean
  ) => {
    if (isResubmission && resubmissionTarget) {
      // Update the existing submission with new code and reset status to pending
      setSubmissions((prev) =>
        prev.map((s) => {
          if (s.id === resubmissionTarget.id) {
            return {
              ...s,
              title: submissionData.title,
              language: submissionData.language,
              description: submissionData.description,
              code: submissionData.code,
              tags: submissionData.tags,
              status: 'pending' as SubmissionStatus,
              submittedAt: new Date().toISOString(),
              resubmissionCount: (s.resubmissionCount || 0) + 1,
            };
          }
          return s;
        })
      );
      showToast('Revised code submitted!', 'Moved to the review queue for re-evaluation.');
    } else {
      // Create new submission
      const newSub: Submission = {
        id: `sub-${Date.now()}`,
        ...submissionData,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      setSubmissions((prev) => [newSub, ...prev]);
      showToast('Code submitted successfully!', 'Reviewers have been notified in the queue.');
    }

    setSubmitModalOpen(false);
    setResubmissionTarget(undefined);
  };

  // Save review from admin
  const handleSaveReview = (
    submissionId: string,
    review: Review,
    statusOutcome: 'reviewed' | 'needs_resubmission'
  ) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          return {
            ...s,
            status: statusOutcome,
            review,
          };
        }
        return s;
      })
    );

    setReviewingSubmission(null);
    showToast(
      statusOutcome === 'reviewed' ? 'Review & Score Published!' : 'Resubmission Requested!',
      `Score: ${review.score}/100 • Feedback and diff saved.`
    );
  };

  // Update AI detection result on a submission
  const handleUpdateSubmissionAiDetection = (
    submissionId: string,
    aiDetection: any
  ) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          return {
            ...s,
            aiDetection,
          };
        }
        return s;
      })
    );

    // Also update if currently viewing or reviewing
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

  // Reset sample dataset
  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY_SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem(STORAGE_KEY_ADMIN_LIST);
    setAdminList(DEFAULT_ADMIN_LIST);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setSubmissions(INITIAL_SUBMISSIONS);
    setActiveTab('dashboard');
    showToast('Reset to original sample data', 'All team submissions and reviews re-seeded.');
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

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
        pendingCount={pendingCount}
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

      {/* Bottom Sticky Role Switcher Bar */}
      <RoleSwitcher
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={handleSelectUser}
        onResetData={handleResetData}
        onOpenGoogleLogin={() => setGoogleLoginModalOpen(true)}
        onOpenAdminManagement={() => setAdminManagementModalOpen(true)}
      />

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

