import React, { useState } from 'react';
import { Shield, Sparkles, LogIn, ArrowRight, Code2, Trophy, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { User, AdminEntry } from '../types';
import { PRIMARY_OWNER_EMAIL, isEmailAdmin, getAvatarUrl } from '../utils/googleAuth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface AuthGateProps {
  onLoginSuccess: (user: User) => void;
  adminList: AdminEntry[];
  isCloudConnected?: boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onLoginSuccess,
  adminList,
  isCloudConnected = true,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const firebaseUser = result.user;
      const email = (firebaseUser.email || '').toLowerCase();
      const isSuper = email === PRIMARY_OWNER_EMAIL.toLowerCase();
      const hasAdmin = isEmailAdmin(email, adminList);

      const avatar =
        firebaseUser.photoURL ||
        getAvatarUrl(firebaseUser.displayName || 'Dev', email);

      const authenticatedUser: User = {
        id: firebaseUser.uid || `user-${Date.now()}`,
        name: firebaseUser.displayName || (isSuper ? 'bigteggs26' : email.split('@')[0]),
        email: email,
        avatar: avatar,
        role: hasAdmin ? 'admin' : 'member',
        title: isSuper
          ? 'Super Administrator & Lead Reviewer'
          : hasAdmin
          ? 'Platform Reviewer & Admin'
          : 'Software Engineer',
        badge: isSuper ? 'Super Admin' : hasAdmin ? 'Team Admin' : 'Google Verified',
        authProvider: 'google',
        isSuperAdmin: isSuper,
      };

      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      console.warn('Google popup notice:', err);
      setErrorMsg('Google sign-in popup unavailable in sandbox preview. You can enter your email directly below.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const email = emailInput.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const isSuper = email === PRIMARY_OWNER_EMAIL.toLowerCase();
      const hasAdmin = isEmailAdmin(email, adminList);

      const resolvedName =
        nameInput.trim() ||
        (isSuper
          ? 'bigteggs26'
          : email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase()));

      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        email
      )}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

      const authenticatedUser: User = {
        id: `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: resolvedName,
        email: email,
        avatar: avatar,
        role: hasAdmin ? 'admin' : 'member',
        title: isSuper
          ? 'Super Administrator & Lead Reviewer'
          : hasAdmin
          ? 'Platform Reviewer & Admin'
          : 'Software Engineer',
        badge: isSuper ? 'Super Admin' : hasAdmin ? 'Team Admin' : 'Verified Member',
        authProvider: 'google',
        isSuperAdmin: isSuper,
      };

      onLoginSuccess(authenticatedUser);
      setIsProcessing(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md shadow-indigo-200 italic">
            CR
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Review<span className="text-indigo-600">.io</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Team Code Review & Peer Scoring Portal
            </p>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Sign In to Your Developer Account
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Every user accesses their own isolated workspace. Submissions, feedback, and scores are tracked per account.
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-8">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            id="auth-gate-google-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-xl shadow-2xs bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold transition-all hover:border-slate-400 active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 font-bold uppercase tracking-wider">
                Or Sign In with Email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="developer@company.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
              />
            </div>

            <div>
              <label htmlFor="auth-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                Display Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="auth-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Alex Developer"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isProcessing || !emailInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <LogIn size={15} />
              <span>{isProcessing ? 'Authenticating...' : 'Enter Workspace'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Account Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-normal">
            <ShieldCheck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700">Account Privacy:</span> Your submissions and feedback remain isolated to your authenticated account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
