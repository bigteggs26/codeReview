import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, CheckCircle2, User as UserIcon, Sparkles, Key, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { User, AdminEntry } from '../types';
import { PRIMARY_OWNER_EMAIL, isEmailAdmin, getAvatarUrl, parseJwt } from '../utils/googleAuth';

interface GoogleLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  adminList: AdminEntry[];
  currentUser?: User;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  onClose,
  onLoginSuccess,
  adminList,
  currentUser,
}) => {
  const [emailInput, setEmailInput] = useState(PRIMARY_OWNER_EMAIL);
  const [nameInput, setNameInput] = useState('Admin (bigteggs26)');
  const [titleInput, setTitleInput] = useState('Super Administrator & Lead Reviewer');
  const [customAvatar, setCustomAvatar] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwnerEmail = emailInput.trim().toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
  const isAdmin = isEmailAdmin(emailInput, adminList);

  // Initialize Google Identity Services if available
  useEffect(() => {
    const clientId = ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || '';
    const win = window as any;

    if (win.google?.accounts?.id && clientId) {
      try {
        win.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              const payload = parseJwt(response.credential);
              if (payload) {
                const userEmail = payload.email || emailInput;
                const userName = payload.name || payload.given_name || 'Google User';
                const userAvatar = payload.picture || getAvatarUrl(userName, userEmail);
                const hasAdmin = isEmailAdmin(userEmail, adminList);

                const googleUser: User = {
                  id: `google-${payload.sub || Date.now()}`,
                  name: userName,
                  email: userEmail,
                  avatar: userAvatar,
                  role: hasAdmin ? 'admin' : 'member',
                  title: hasAdmin ? (userEmail.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase() ? 'Super Administrator & Owner' : 'Reviewer Admin') : 'Software Engineer',
                  badge: hasAdmin ? 'Super Admin' : 'Verified Google Dev',
                  authProvider: 'google',
                  isSuperAdmin: userEmail.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase(),
                };

                onLoginSuccess(googleUser);
              }
            }
          },
        });

        const btnContainer = document.getElementById('g_id_signin_container');
        if (btnContainer) {
          win.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      } catch (err) {
        console.error('Google One Tap init error:', err);
      }
    }
  }, [adminList, onLoginSuccess, emailInput]);

  const handleQuickSignIn = (emailToUse: string, nameToUse?: string) => {
    setIsProcessing(true);
    setErrorMsg(null);

    setTimeout(() => {
      const email = emailToUse.trim();
      if (!email || !email.includes('@')) {
        setErrorMsg('Please enter a valid Google email address.');
        setIsProcessing(false);
        return;
      }

      const hasAdmin = isEmailAdmin(email, adminList);
      const isSuper = email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();

      const name = nameToUse || (isSuper ? 'Big Teggs (Owner)' : email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase()));
      const avatar = customAvatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

      const authenticatedUser: User = {
        id: `google-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: name,
        email: email,
        avatar: avatar,
        role: hasAdmin ? 'admin' : 'member',
        title: isSuper
          ? 'Super Administrator & Owner'
          : hasAdmin
          ? 'Platform Reviewer & Admin'
          : 'Software Engineer',
        badge: isSuper ? 'Owner & Super Admin' : hasAdmin ? 'Team Admin' : 'Google Verified',
        authProvider: 'google',
        isSuperAdmin: isSuper,
      };

      onLoginSuccess(authenticatedUser);
      setIsProcessing(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-2">
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
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Sign in with Google
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Access your code reviews & admin controls
              </p>
            </div>
          </div>
          <button
            id="close-google-login-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Owner Quick Auth Card */}
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-600" />
                Primary Owner Account
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(PRIMARY_OWNER_EMAIL)}&backgroundColor=b6e3f4`}
                alt="Owner"
                className="w-10 h-10 rounded-full border border-indigo-200 bg-white"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  Big Teggs (Super Admin)
                </div>
                <div className="text-xs text-slate-600 font-mono font-medium truncate">
                  {PRIMARY_OWNER_EMAIL}
                </div>
              </div>
            </div>
            <button
              type="button"
              id="google-quick-login-owner-btn"
              onClick={() => handleQuickSignIn(PRIMARY_OWNER_EMAIL, 'Big Teggs (Super Admin)')}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <LogIn size={15} />
              <span>Sign In as {PRIMARY_OWNER_EMAIL}</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or Sign In with Any Google Account
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* GIS Button Container if rendered */}
          <div id="g_id_signin_container" className="w-full flex justify-center"></div>

          {/* Custom Google Account Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuickSignIn(emailInput, nameInput);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Google Account Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  id="google-email-input"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your.email@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name / Display Name
              </label>
              <div className="relative">
                <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="google-name-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                />
              </div>
            </div>

            {/* Permission Preview Badge */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className={isAdmin ? 'text-indigo-600' : 'text-emerald-600'} />
                <span className="font-bold text-slate-700">Account Access Level:</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider border ${
                  isAdmin
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {isOwnerEmail ? 'Owner (Super Admin)' : isAdmin ? 'Admin Access' : 'Team Member'}
              </span>
            </div>

            <button
              type="submit"
              id="google-submit-login-btn"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <span>Authenticate with Google</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Google OAuth 2.0 Compatible
          </span>
          <span className="text-[10px] text-slate-400">Secure Session Storage</span>
        </div>
      </div>
    </div>
  );
};
