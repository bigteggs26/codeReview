import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { User, AdminEntry } from '../types';
import { PRIMARY_OWNER_EMAIL, isEmailAdmin } from '../utils/googleAuth';
import {
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  signInWithGooglePopup,
  formatFirebaseUser,
  getAuthErrorMessage,
} from '../lib/authService';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  adminList: AdminEntry[];
  initialMode?: 'signin' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLoginSuccess,
  adminList,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);

  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State & Feedback
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-indigo-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  // Handle Email & Password Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const firebaseUser = await signInWithEmail(email, password);
      const appUser = formatFirebaseUser(firebaseUser, adminList);
      onLoginSuccess(appUser);
      onClose();
    } catch (err: any) {
      console.error('Sign In Error:', err);
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Email & Password Sign Up / Registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      setIsProcessing(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      setIsProcessing(false);
      return;
    }

    try {
      const { user: firebaseUser, verificationSent } = await signUpWithEmail(
        email,
        password,
        name
      );
      const appUser = formatFirebaseUser(firebaseUser, adminList);

      onLoginSuccess(appUser);
      onClose();
    } catch (err: any) {
      console.error('Sign Up Error:', err);
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Password Reset Request
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await sendPasswordReset(email);
      setSuccessMsg(
        `Password reset email sent to ${email}! Please check your inbox and follow the instructions.`
      );
    } catch (err: any) {
      console.error('Password Reset Error:', err);
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const firebaseUser = await signInWithGooglePopup();
      const appUser = formatFirebaseUser(firebaseUser, adminList);
      onLoginSuccess(appUser);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const isOwnerEmail = email.trim().toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
  const isAdminEmail = isEmailAdmin(email, adminList);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-xs flex items-center justify-center font-bold text-white italic text-lg">
              CR
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {mode === 'signin' && 'Sign In to Review.io'}
                {mode === 'signup' && 'Create Developer Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {mode === 'signin' && 'Access your isolated code reviews and rankings'}
                {mode === 'signup' && 'Real password auth with email verification'}
                {mode === 'forgot' && 'We will send a secure reset link to your email'}
              </p>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4 pb-1">
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              id="tab-mode-signin"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              id="tab-mode-signup"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus size={14} />
              <span>Sign Up</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 font-medium leading-relaxed">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 font-medium leading-relaxed">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    id="signin-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@company.com"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signin-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Role badge preview if matched */}
              {email.trim() && (
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <ShieldCheck size={13} className={isAdminEmail ? 'text-indigo-600' : 'text-emerald-600'} />
                    <span>Workspace Access:</span>
                  </div>
                  <span
                    className={`px-2 py-0.2 rounded font-bold text-[10px] uppercase tracking-wider border ${
                      isOwnerEmail
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isAdminEmail
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isOwnerEmail ? 'Super Admin (Owner)' : isAdminEmail ? 'Admin Reviewer' : 'Team Member'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                id="signin-submit-btn"
                disabled={isProcessing || !email.trim() || !password}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <LogIn size={15} />
                <span>{isProcessing ? 'Signing In...' : 'Sign In with Password'}</span>
              </button>
            </form>
          )}

          {/* MODE: SIGN UP (CREATE ACCOUNT) */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name / Developer Handle
                </label>
                <div className="relative">
                  <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    id="signup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    id="signup-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Sparkles size={11} className="text-indigo-600" />
                  A real verification link will be automatically sent to this address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="signup-submit-btn"
                disabled={isProcessing || !email.trim() || !password || !name.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                <UserPlus size={15} />
                <span>{isProcessing ? 'Creating Account...' : 'Create Account & Send Verification'}</span>
              </button>
            </form>
          )}

          {/* MODE: FORGOT / RESET PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enter Your Account Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    id="forgot-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@company.com"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="forgot-submit-btn"
                disabled={isProcessing || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <KeyRound size={15} />
                <span>{isProcessing ? 'Sending Link...' : 'Send Password Reset Link'}</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-600 hover:text-indigo-600 font-bold"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Divider & Google OAuth Alternative */}
          {mode !== 'forgot' && (
            <>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Or Instant Google Login
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                id="google-oauth-btn"
                onClick={handleGoogleSignIn}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Lock size={12} className="text-emerald-600" />
            Protected by Firebase Authentication
          </span>
          <span className="text-[10px] text-slate-400 font-medium">SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
};
