import React from 'react';
import { Shield, User as UserIcon, Code2, Trophy, ListOrdered, PlusCircle, Sparkles, LogIn, Settings, ShieldCheck, LogOut, UserCheck, Cloud, CloudOff, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { User, Role } from '../types';
import { PRIMARY_OWNER_EMAIL } from '../utils/googleAuth';

interface HeaderProps {
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: 'dashboard' | 'queue' | 'leaderboard';
  onSelectTab: (tab: 'dashboard' | 'queue' | 'leaderboard') => void;
  onOpenSubmitModal: () => void;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
  onOpenAdminManagement: () => void;
  onSignOut?: () => void;
  pendingCount: number;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeTab,
  onSelectTab,
  onOpenSubmitModal,
  onOpenAuthModal,
  onOpenAdminManagement,
  onSignOut,
  pendingCount,
  isCloudConnected = true,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isSuperAdmin =
    Boolean(currentUser?.isSuperAdmin) ||
    currentUser?.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
  const isGoogleAuth = currentUser?.authProvider === 'google';
  const isEmailVerified = currentUser?.emailVerified || isGoogleAuth;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-200 italic tracking-tight shrink-0">
              CR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                  Review<span className="text-indigo-600">.io</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border border-slate-200 hidden xs:inline-block">
                  Portal
                </span>
                <span
                  title={isCloudConnected ? 'Connected to Firebase Firestore (Realtime Sync)' : 'Reconnecting to cloud...'}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isCloudConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="hidden sm:inline">{isCloudConnected ? 'Live Cloud' : 'Connecting'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Team Code Review & Peer Scoring Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs - responsive scroll on small screens */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto max-w-[50vw] sm:max-w-none shrink-0 no-scrollbar">
            <button
              id="nav-tab-dashboard"
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <UserIcon size={14} />
              <span className="hidden sm:inline">{isAdmin ? 'Reviewer Desk' : 'My Submissions'}</span>
              <span className="sm:hidden">{isAdmin ? 'Reviews' : 'Mine'}</span>
            </button>

            {isAdmin && (
              <button
                id="nav-tab-queue"
                onClick={() => onSelectTab('queue')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 relative ${
                  activeTab === 'queue'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ListOrdered size={14} />
                <span className="hidden sm:inline">Review Queue</span>
                <span className="sm:hidden">Queue</span>
                {pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            <button
              id="nav-tab-leaderboard"
              onClick={() => onSelectTab('leaderboard')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'leaderboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Trophy size={14} />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Ranks</span>
            </button>
          </nav>

          {/* Right Action & User Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Submit Code button - visible on small & large */}
            <button
              id="header-submit-code-btn"
              onClick={onOpenSubmitModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle size={14} />
              <span className="hidden sm:inline">Submit Code</span>
              <span className="sm:hidden">Submit</span>
            </button>

            {/* Admin Management / Access Controls button */}
            {isAdmin && (
              <button
                id="header-admin-mgmt-btn"
                onClick={onOpenAdminManagement}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors"
                title="Manage Admins & Team Directory"
              >
                <ShieldCheck size={14} className="text-indigo-600" />
                <span className="hidden sm:inline">Admin Controls</span>
              </button>
            )}

            {!currentUser ? (
              /* If not logged in, show Sign In & Sign Up buttons */
              <div className="flex items-center gap-2">
                <button
                  id="header-login-btn"
                  onClick={() => onOpenAuthModal('signin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>
                <button
                  id="header-signup-btn"
                  onClick={() => onOpenAuthModal('signup')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            ) : (
              /* User Profile & Menu */
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="relative group">
                  <div className="flex items-center gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                    <div className="relative">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      {isGoogleAuth && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white rounded-full p-0.5 shadow-xs flex items-center justify-center border border-slate-200" title="Google Authenticated">
                          <svg className="w-full h-full" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {currentUser.name}
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider ${
                            isAdmin
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate max-w-[140px]">
                        {isEmailVerified ? (
                          <span className="text-emerald-600 flex items-center gap-0.5 font-medium">
                            <CheckCircle2 size={10} />
                            Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-0.5 font-medium">
                            <AlertCircle size={10} />
                            Unverified
                          </span>
                        )}
                        <span>•</span>
                        <span className="truncate">{currentUser.email || currentUser.title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 hidden group-hover:block hover:block z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/50">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {currentUser.email || 'Local User'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {isSuperAdmin && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                            Super Admin
                          </span>
                        )}
                        {isEmailVerified ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 size={9} />
                            Email Verified
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                            <AlertCircle size={9} />
                            Verify Email
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="p-1 border-b border-slate-100">
                        <button
                          onClick={onOpenAdminManagement}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-2 transition-colors"
                        >
                          <ShieldCheck size={14} />
                          <span>Manage Admins & User Directory</span>
                        </button>
                      </div>
                    )}

                    <div className="p-1 border-b border-slate-100">
                      <button
                        onClick={() => onOpenAuthModal('signin')}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
                      >
                        <LogIn size={14} className="text-indigo-600" />
                        <span>Switch or Add Account</span>
                      </button>
                    </div>

                    {onSignOut && (
                      <div className="p-1">
                        <button
                          id="header-signout-btn"
                          onClick={onSignOut}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


