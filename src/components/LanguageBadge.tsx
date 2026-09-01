import React from 'react';

export type SupportedLanguage =
  | 'typescript'
  | 'python'
  | 'javascript'
  | 'rust'
  | 'go'
  | 'html'
  | 'css'
  | 'sql'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'json'
  | 'markdown'
  | string;

interface LanguageConfig {
  displayName: string;
  badgeClass: string;
  dotClass: string;
  accentClass: string;
}

export function getLanguageConfig(lang: string = ''): LanguageConfig {
  const normalized = lang.trim().toLowerCase();

  switch (normalized) {
    case 'typescript':
    case 'ts':
    case 'tsx':
      return {
        displayName: 'TypeScript',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300/80 font-bold',
        dotClass: 'bg-emerald-500 ring-emerald-300',
        accentClass: 'text-emerald-700',
      };

    case 'python':
    case 'py':
      return {
        displayName: 'Python',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-300/80 font-bold',
        dotClass: 'bg-sky-500 ring-sky-300',
        accentClass: 'text-sky-700',
      };

    case 'javascript':
    case 'js':
    case 'jsx':
      return {
        displayName: 'JavaScript',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300/80 font-bold',
        dotClass: 'bg-amber-500 ring-amber-300',
        accentClass: 'text-amber-700',
      };

    case 'rust':
    case 'rs':
      return {
        displayName: 'Rust',
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-300/80 font-bold',
        dotClass: 'bg-orange-500 ring-orange-300',
        accentClass: 'text-orange-700',
      };

    case 'go':
    case 'golang':
      return {
        displayName: 'Go',
        badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300/80 font-bold',
        dotClass: 'bg-cyan-500 ring-cyan-300',
        accentClass: 'text-cyan-700',
      };

    case 'sql':
    case 'postgres':
    case 'postgresql':
    case 'mysql':
      return {
        displayName: 'SQL',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300/80 font-bold',
        dotClass: 'bg-indigo-500 ring-indigo-300',
        accentClass: 'text-indigo-700',
      };

    case 'html':
    case 'html5':
    case 'css':
    case 'web':
      return {
        displayName: normalized.toUpperCase(),
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-300/80 font-bold',
        dotClass: 'bg-purple-500 ring-purple-300',
        accentClass: 'text-purple-700',
      };

    case 'java':
    case 'kotlin':
    case 'cpp':
    case 'c++':
    case 'csharp':
    case 'c#':
      return {
        displayName: normalized === 'cpp' ? 'C++' : normalized === 'csharp' ? 'C#' : normalized.toUpperCase(),
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-300/80 font-bold',
        dotClass: 'bg-rose-500 ring-rose-300',
        accentClass: 'text-rose-700',
      };

    default:
      return {
        displayName: lang ? lang.toUpperCase() : 'CODE',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
        dotClass: 'bg-slate-500 ring-slate-300',
        accentClass: 'text-slate-700',
      };
  }
}

interface LanguageBadgeProps {
  language: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  language,
  size = 'sm',
  showDot = true,
  className = '',
}) => {
  const config = getLanguageConfig(language);

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.2 gap-1 rounded',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 rounded-md',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg',
    lg: 'text-sm px-3 py-1.5 gap-2 rounded-lg',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center font-mono border tracking-wide uppercase transition-colors shrink-0 shadow-2xs ${config.badgeClass} ${sizeClasses[size]} ${className}`}
      title={`Language: ${config.displayName}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${config.dotClass} ${dotSizes[size]}`}
          aria-hidden="true"
        />
      )}
      <span>{config.displayName}</span>
    </span>
  );
};
