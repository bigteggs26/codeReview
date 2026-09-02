import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Send, X, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { resendVerificationEmail, refreshCurrentUser, formatFirebaseUser } from '../lib/authService';

interface EmailVerificationBannerProps {
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onSignOut?: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  currentUser,
  onUserUpdated,
  onSignOut,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If already verified, don't show the banner
  if (currentUser.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    setMessage(null);
    try {
      await resendVerificationEmail();
      setMessage({
        type: 'success',
        text: `Verification link sent to ${currentUser.email}! Please check your spam folder if not received in a few minutes.`,
      });
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err?.message || 'Could not send verification email. Please try again in a few moments.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setMessage(null);
    try {
      const refreshedUser = await refreshCurrentUser();
      if (refreshedUser && refreshedUser.emailVerified) {
        const updated = formatFirebaseUser(refreshedUser);
        onUserUpdated(updated);
        setMessage({
          type: 'success',
          text: 'Email verified successfully! Thank you for confirming your account.',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Email not verified yet. Please make sure you clicked the verification link in your inbox.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: 'Failed to refresh verification status. Please try again.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-amber-100 text-amber-700 shrink-0">
            <Mail size={16} />
          </div>
          <div>
            <span className="font-bold text-amber-950">Verify your email: </span>
            <span>
              Please verify <strong className="font-mono text-amber-950">{currentUser.email}</strong> to unlock full peer review privileges and badges.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          {message && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                message.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {message.text}
            </span>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold transition-all text-xs flex items-center gap-1 shadow-2xs disabled:opacity-50"
          >
            <Send size={12} />
            <span>
              {isResending
                ? 'Sending...'
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend Email'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="px-2.5 py-1 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold transition-all text-xs flex items-center gap-1 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'Checking...' : "I've Verified"}</span>
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-950 underline px-1"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
