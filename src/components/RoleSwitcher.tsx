import React from 'react';
import { UserCheck, Shield, Users, RefreshCw, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { User } from '../types';
import { PRIMARY_OWNER_EMAIL } from '../utils/authConfig';

interface RoleSwitcherProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onResetData: () => void;
  onOpenAdminManagement?: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onResetData,
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

