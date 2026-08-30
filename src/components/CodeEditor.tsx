import React, { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';
import { ProgrammingLanguage } from '../types';

interface CodeEditorProps {
  value: string;
  onChange?: (val: string) => void;
  language: ProgrammingLanguage;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  placeholder?: string;
  idPrefix?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  minHeight = 'min-h-[220px]',
  maxHeight = 'max-h-[420px]',
  placeholder = 'Write or paste code here...',
  idPrefix = 'code-editor'
}) => {
  const [copied, setCopied] = useState(false);

  const lines = value ? value.split('\n') : [''];
  const lineCount = Math.max(lines.length, 6);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly || !onChange) return;
    
    // Tab key indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      // Restore cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-950 overflow-hidden shadow-xs flex flex-col font-mono text-xs">
      {/* Editor top status bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-indigo-400" />
          <span className="font-bold text-slate-200 capitalize font-sans text-xs">{language}</span>
          <span className="text-[11px] text-slate-500 font-mono">• {lines.length} lines</span>
        </div>

        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold font-sans uppercase tracking-wider border border-slate-700">
              Read-only
            </span>
          )}
          <button
            type="button"
            id={`${idPrefix}-copy-btn`}
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-[11px] font-bold font-sans border border-slate-700"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Area with Line Numbers */}
      <div className={`flex overflow-auto ${minHeight} ${maxHeight} bg-slate-950 text-slate-200`}>
        {/* Line Numbers column */}
        <div className="select-none py-3 px-3 text-right bg-slate-900/60 text-slate-600 border-r border-slate-800/80 font-mono text-xs leading-5 shrink-0 min-w-[40px]">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Input/Display Textarea */}
        <div className="flex-1 relative">
          <textarea
            id={`${idPrefix}-textarea`}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            className={`w-full h-full p-3 font-mono text-xs leading-5 bg-transparent resize-none outline-none text-slate-100 placeholder-slate-600 ${
              readOnly ? 'cursor-default' : 'cursor-text'
            }`}
            style={{
              tabSize: 2,
              whiteSpace: 'pre',
            }}
          />
        </div>
      </div>
    </div>
  );
};
