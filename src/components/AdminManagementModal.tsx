import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Trash2,
  Users,
  AlertTriangle,
  Mail,
  User as UserIcon,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Award
} from 'lucide-react';
import { User, AdminEntry } from '../types';
import { PRIMARY_OWNER_EMAIL, getAvatarUrl } from '../utils/googleAuth';

interface AdminManagementModalProps {
  currentUser: User;
  users: User[];
  adminList: AdminEntry[];
  onClose: () => void;
  onAddAdmin: (email: string, name: string, title?: string) => void;
  onRemoveAdmin: (adminId: string, email: string) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserRole: (userId: string, newRole: 'admin' | 'member') => void;
  onRemoveAllUsers: (preserveCurrentUser: boolean) => void;
  onAddTeamMember: (member: Omit<User, 'id'>) => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  currentUser,
  users,
  adminList,
  onClose,
  onAddAdmin,
  onRemoveAdmin,
  onDeleteUser,
  onToggleUserRole,
  onRemoveAllUsers,
  onAddTeamMember,
}) => {
  const [activeTab, setActiveTab] = useState<'admins' | 'users' | 'add_member' | 'danger_zone'>('admins');

  // Form states for adding admin
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminTitle, setNewAdminTitle] = useState('Code Reviewer & Staff Admin');
  const [adminAddSuccess, setAdminAddSuccess] = useState<string | null>(null);

  // Form states for adding generic team member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberTitle, setNewMemberTitle] = useState('Software Engineer');
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'admin'>('member');
  const [newMemberBadge, setNewMemberBadge] = useState('Core Dev');

  // Confirmation state for "Remove All Users"
  const [confirmWipeModal, setConfirmWipeModal] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  const isSuperAdmin =
    currentUser.isSuperAdmin ||
    currentUser.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();

  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) return;

    onAddAdmin(
      newAdminEmail.trim().toLowerCase(),
      newAdminName.trim() || newAdminEmail.split('@')[0],
      newAdminTitle.trim()
    );

    setAdminAddSuccess(`Added ${newAdminEmail} as an Authorized Admin!`);
    setNewAdminEmail('');
    setNewAdminName('');
    setTimeout(() => setAdminAddSuccess(null), 4000);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const avatar = getAvatarUrl(newMemberName, newMemberEmail);

    onAddTeamMember({
      name: newMemberName.trim(),
      email: newMemberEmail.trim().toLowerCase(),
      role: newMemberRole,
      avatar,
      title: newMemberTitle.trim() || 'Software Engineer',
      badge: newMemberBadge.trim() || 'Team Member',
      isCustomUser: true,
    });

    setNewMemberName('');
    setNewMemberEmail('');
    setActiveTab('users');
  };

  const handleConfirmWipe = () => {
    if (wipeConfirmText.toLowerCase() === 'remove all users') {
      onRemoveAllUsers(true);
      setConfirmWipeModal(false);
      setWipeConfirmText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Admin & User Access Control
                </h3>
                {isSuperAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold uppercase tracking-wider border border-indigo-200">
                    Super Admin Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Manage authorized admins, team membership, and user directory
              </p>
            </div>
          </div>

          <button
            id="close-admin-mgmt-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'admins'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield size={14} />
            <span>Admin Whitelist ({adminList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>All Users Directory ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add_member')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'add_member'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus size={14} />
            <span>Add Member</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('danger_zone')}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'danger_zone'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-rose-600'
              }`}
            >
              <AlertTriangle size={14} />
              <span>Remove All Users</span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: ADMIN WHITELIST */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              {/* Add New Admin Section */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus size={15} className="text-indigo-600" />
                    Authorize New Administrator
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Authorized Google accounts will immediately have full Admin review, rubric grading, and management access upon signing in.
                  </p>
                </div>

                {adminAddSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-700" />
                    <span>{adminAddSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAddAdminSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Admin Google Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="e.g. colleague@gmail.com"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      id="submit-add-admin-btn"
                      className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} />
                      <span>Grant Admin Access</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of current authorized admins */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Current Authorized Admins ({adminList.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Primary Owner: <strong className="text-slate-700">{PRIMARY_OWNER_EMAIL}</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  {adminList.map((admin) => {
                    const isOwner =
                      admin.isPrimaryOwner ||
                      admin.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();

                    return (
                      <div
                        key={admin.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={getAvatarUrl(admin.name, admin.email)}
                            alt={admin.name}
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {admin.name}
                              </span>
                              {isOwner ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  Primary Owner & Super Admin
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono truncate">
                              {admin.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOwner ? (
                            <span className="text-xs text-slate-400 font-medium italic">
                              Permanent Owner
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRemoveAdmin(admin.id, admin.email)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Revoke Admin Access"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL USERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Active User Accounts ({users.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Switch roles, grant permissions, or remove individual accounts
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('add_member')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <UserPlus size={13} />
                    <span>Add Member</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setConfirmWipeModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Remove All Users</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                {users.map((u) => {
                  const isOwner = u.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <div
                      key={u.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {u.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                You
                              </span>
                            )}
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{u.email || 'No email'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.title}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Role toggle button */}
                        {!isOwner && (
                          <button
                            type="button"
                            onClick={() =>
                              onToggleUserRole(u.id, u.role === 'admin' ? 'member' : 'admin')
                            }
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                          >
                            Set as {u.role === 'admin' ? 'Member' : 'Admin'}
                          </button>
                        )}

                        {/* Delete button */}
                        {!isOwner && (
                          <button
                            type="button"
                            onClick={() => onDeleteUser(u.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ADD NEW TEAM MEMBER */}
          {activeTab === 'add_member' && (
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <UserPlus size={20} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">Add Team Member</h4>
                <p className="text-xs text-slate-500">
                  Create a custom engineer or reviewer profile in your portal
                </p>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="e.g. jordan.lee@company.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Job Title / Role Description
                  </label>
                  <input
                    type="text"
                    value={newMemberTitle}
                    onChange={(e) => setNewMemberTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Portal Role
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as 'member' | 'admin')}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-medium"
                    >
                      <option value="member">Member (Submitter)</option>
                      <option value="admin">Admin (Reviewer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Member Badge
                    </label>
                    <input
                      type="text"
                      value={newMemberBadge}
                      onChange={(e) => setNewMemberBadge(e.target.value)}
                      placeholder="e.g. Python Lead"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus size={15} />
                  <span>Create Team Member</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: REMOVE ALL USERS (DANGER ZONE) */}
          {activeTab === 'danger_zone' && (
            <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-rose-900">
                    Remove All Users / Clear Demo Users
                  </h4>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    This action will purge all placeholder demo users (Elena, Marcus, Alex, Priya, Devon, Kaito) and leave only your authenticated Google Administrator account (<strong className="font-bold">{PRIMARY_OWNER_EMAIL}</strong>).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-rose-200 space-y-3">
                <p className="text-xs font-bold text-slate-800">
                  What happens when you click "Remove All Users":
                </p>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                  <li>All sample mock accounts are permanently removed.</li>
                  <li>Your Google account (<strong className="text-indigo-700">{PRIMARY_OWNER_EMAIL}</strong>) is preserved as the sole Super Admin.</li>
                  <li>You can then add your real developers and colleagues cleanly via the Add Member tab or Google Sign In.</li>
                </ul>

                <button
                  type="button"
                  id="trigger-remove-all-users-btn"
                  onClick={() => setConfirmWipeModal(true)}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>Purge Demo Users & Start Clean Slate</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Logged in as: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.email})</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Wipe All Users */}
      {confirmWipeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Confirm Purge All Users
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove all demo users? Your current Google account (<strong className="text-slate-900">{PRIMARY_OWNER_EMAIL}</strong>) will be kept as the owner so you maintain full admin access.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Type <span className="font-mono text-rose-600 font-black">remove all users</span> to confirm:
              </label>
              <input
                type="text"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="remove all users"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmWipeModal(false);
                  setWipeConfirmText('');
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-wipe-execute-btn"
                disabled={wipeConfirmText.toLowerCase() !== 'remove all users'}
                onClick={handleConfirmWipe}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-40"
              >
                Confirm & Wipe Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
