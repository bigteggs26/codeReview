import React, { useState } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, X, Sparkles, Crown } from 'lucide-react';
import { isValidAdminCode, MASTER_ADMIN_PASSCODES } from '../utils/authConfig';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isValidAdminCode(code)) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCode('');
        onSuccess();
        onClose();
      }, 700);
    } else {
      setError('Invalid admin passcode. Try: ADMIN777 or ROOT999');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-900">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Enter Admin Passcode</span>
                <Crown size={15} className="text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Unlock instant Super Admin & Reviewer controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Admin privileges granted! Loading reviewer suite...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Passcode Key
            </label>
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder="e.g. ADMIN777"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono font-black text-slate-900 tracking-widest uppercase focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-center"
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
            <div className="text-[11px] text-indigo-900 font-medium">
              Master Codes:
            </div>
            <div className="flex items-center gap-1.5">
              {MASTER_ADMIN_PASSCODES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCode(c)}
                  className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 hover:border-indigo-500 text-[10px] font-mono font-bold text-indigo-700 shadow-xs transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-1.5"
            >
              <ShieldCheck size={15} />
              <span>Verify & Activate Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
