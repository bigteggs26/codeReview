import React, { useState } from 'react';
import { X, Send, Code2, FileCode, Tag, Sparkles, RefreshCw } from 'lucide-react';
import { ProgrammingLanguage, Submission, User } from '../types';
import { CodeEditor } from './CodeEditor';
import { CODE_TEMPLATES } from '../data/initialData';

interface SubmitModalProps {
  currentUser: User;
  onClose: () => void;
  onSubmit: (submission: Omit<Submission, 'id' | 'submittedAt' | 'status'>, isResubmission?: boolean) => void;
  resubmissionTarget?: Submission;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  currentUser,
  onClose,
  onSubmit,
  resubmissionTarget,
}) => {
  const isResubmission = Boolean(resubmissionTarget);

  const [title, setTitle] = useState(
    isResubmission ? `[Revised] ${resubmissionTarget!.title.replace(/^\[Revised\]\s*/, '')}` : ''
  );
  const [language, setLanguage] = useState<ProgrammingLanguage>(
    resubmissionTarget?.language || 'typescript'
  );
  const [description, setDescription] = useState(
    resubmissionTarget ? `Revision addressing feedback: ${resubmissionTarget.description}` : ''
  );
  const [code, setCode] = useState(resubmissionTarget?.code || '');
  const [tagsInput, setTagsInput] = useState(
    resubmissionTarget?.tags?.join(', ') || 'CleanCode, Review'
  );

  const handleApplyTemplate = (lang: string) => {
    const template = CODE_TEMPLATES[lang];
    if (template) {
      setTitle(template.title);
      setDescription(template.desc);
      setCode(template.code);
      setLanguage(lang as ProgrammingLanguage);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !code.trim()) {
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    onSubmit(
      {
        memberId: currentUser.id,
        memberName: currentUser.name,
        memberAvatar: currentUser.avatar,
        title: title.trim(),
        language,
        description: description.trim(),
        code: code.trim(),
        tags,
      },
      isResubmission
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              {isResubmission ? <RefreshCw size={20} /> : <Code2 size={20} />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isResubmission ? 'Resubmit Revised Code' : 'Submit Code for Review'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Submitting as <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.title})
              </p>
            </div>
          </div>

          <button
            id="submit-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Starter Templates Picker */}
          {!isResubmission && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-600 flex items-center gap-1.5 font-bold">
                <Sparkles size={14} className="text-indigo-600" />
                Quick Starter Snippets:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('typescript')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 text-xs font-mono font-bold transition-all shadow-xs"
                >
                  TypeScript EventEmitter
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('python')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-mono font-bold transition-all shadow-xs"
                >
                  Python TTL Cache
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('rust')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-700 border border-slate-200 hover:border-amber-300 text-xs font-mono font-bold transition-all shadow-xs"
                >
                  Rust Ring Buffer
                </button>
              </div>
            </div>
          )}

          {/* Title & Language Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Submission Title *
              </label>
              <input
                id="submission-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Lock Manager with Redis TTL"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Language *
              </label>
              <select
                id="submission-language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 capitalize font-medium"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="sql">SQL</option>
                <option value="html_css">HTML / CSS</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Description & Context (What does this code do?)
            </label>
            <textarea
              id="submission-description-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly explain the design goals, target constraints, or specific areas where you want feedback..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 leading-relaxed font-medium"
            />
          </div>

          {/* Code Editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Code Snippet *
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Tab indentation supported
              </span>
            </div>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              minHeight="min-h-[220px]"
              maxHeight="max-h-[360px]"
              placeholder="// Paste your code here for peer review..."
              idPrefix="submission-form"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={13} className="text-indigo-600" />
              Tags (Comma separated)
            </label>
            <input
              id="submission-tags-input"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="React, Concurrency, Algorithms, Database"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="submit-code-action-btn"
              disabled={!title.trim() || !code.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send size={15} />
              <span>{isResubmission ? 'Submit Revised Version' : 'Send to Review Queue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
