import React from 'react';
import { UserCheck, Shield, Users, RefreshCw, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { User } from '../types';
import { PRIMARY_OWNER_EMAIL } from '../utils/googleAuth';

interface RoleSwitcherProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onResetData: () => void;
  onOpenGoogleLogin?: () => void;
  onOpenAdminManagement?: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onResetData,
  onOpenGoogleLogin,
  onOpenAdminManagement,
}) => {
  const admins = allUsers.filter((u) => u.role === 'admin');
  const members = allUsers.filter((u) => u.role === 'member');
  const isSuperAdmin =
    currentUser.isSuperAdmin ||
    currentUser.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();

  return (
    <div className="bg-white border-t border-slate-200 py-2.5 px-4 text-xs shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-500 font-medium flex-wrap">
          <UserCheck size={15} className="text-indigo-600 shrink-0" />
          <span className="font-extrabold text-slate-900">Active Profile:</span>
          <span className="text-slate-800 font-bold">{currentUser.name}</span>
          <span className="text-[11px] text-slate-400 font-mono">({currentUser.email || 'local'})</span>
          {currentUser.authProvider === 'google' && (
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Google Verified
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Google Login Fast Trigger */}
          {onOpenGoogleLogin && (
            <button
              id="role-switch-google-btn"
              onClick={onOpenGoogleLogin}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24">
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
              <span>Sign In with Google</span>
            </button>
          )}

          {/* Admin Management Trigger */}
          {onOpenAdminManagement && currentUser.role === 'admin' && (
            <button
              id="role-switch-admin-mgmt-btn"
              onClick={onOpenAdminManagement}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <ShieldCheck size={12} />
              <span>Manage Admins & Users</span>
            </button>
          )}

          {admins.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-extrabold text-purple-700 px-2 flex items-center gap-1">
                <Shield size={11} /> Admin:
              </span>
              {admins.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  id={`role-switch-${u.id}`}
                  onClick={() => onSelectUser(u)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    currentUser.id === u.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {members.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-extrabold text-emerald-700 px-2 flex items-center gap-1">
                <Users size={11} /> Member:
              </span>
              {members.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  id={`role-switch-${u.id}`}
                  onClick={() => onSelectUser(u)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    currentUser.id === u.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          <button
            id="reset-portal-data-btn"
            onClick={onResetData}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 text-[11px] font-bold"
            title="Reset sample data"
          >
            <RefreshCw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

