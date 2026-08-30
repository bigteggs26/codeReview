import React from 'react';
import { Bot, UserCheck, Sparkles, HelpCircle } from 'lucide-react';
import { AiDetectionResult } from '../types';

interface AiDetectorBadgeProps {
  detection?: AiDetectionResult;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const AiDetectorBadge: React.FC<AiDetectorBadgeProps> = ({
  detection,
  onClick,
  size = 'md',
  showLabel = true,
}) => {
  if (!detection) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1 font-mono font-bold rounded-lg border transition-all ${
          onClick ? 'cursor-pointer hover:bg-slate-100 hover:border-slate-300' : ''
        } ${
          size === 'sm'
            ? 'text-[10px] px-2 py-0.5 bg-slate-50 text-slate-500 border-slate-200'
            : 'text-xs px-2.5 py-1 bg-slate-50 text-slate-600 border-slate-200'
        }`}
        title="AI authenticity not yet scanned"
      >
        <Bot size={size === 'sm' ? 12 : 14} className="text-slate-400" />
        {showLabel && <span>Unscanned</span>}
      </span>
    );
  }

  const { aiProbability, classification } = detection;

  let bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotClass = 'bg-emerald-500';
  let icon = <UserCheck size={size === 'sm' ? 12 : 14} className="text-emerald-600" />;
  let labelText = `${aiProbability}% Human Code`;

  if (aiProbability >= 75) {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    dotClass = 'bg-rose-500';
    icon = <Bot size={size === 'sm' ? 12 : 14} className="text-rose-600" />;
    labelText = `${aiProbability}% AI Generated`;
  } else if (aiProbability >= 40) {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
    dotClass = 'bg-amber-500';
    icon = <Sparkles size={size === 'sm' ? 12 : 14} className="text-amber-600" />;
    labelText = `${aiProbability}% AI Assisted`;
  } else {
    labelText = `${100 - aiProbability}% Human Written`;
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all ${
        onClick ? 'cursor-pointer hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${
        size === 'sm'
          ? 'text-[10px] px-2 py-0.5'
          : size === 'lg'
          ? 'text-sm px-3.5 py-1.5 font-bold'
          : 'text-xs px-2.5 py-1 font-semibold'
      } ${bgClass}`}
      title={`${classification} (${aiProbability}% AI probability)`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`} />
      {icon}
      {showLabel && <span className="font-mono">{labelText}</span>}
    </div>
  );
};
