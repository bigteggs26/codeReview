import React, { useState } from 'react';
import { X, Send, Code2, FileCode, Tag, Sparkles, RefreshCw, Eye, Columns, Monitor } from 'lucide-react';
import { ProgrammingLanguage, Submission, User } from '../types';
import { CodeEditor } from './CodeEditor';
import { CodeLivePreview, isRenderableCode } from './CodeLivePreview';
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
    resubmissionTarget?.language || 'html_css'
  );
  const [description, setDescription] = useState(
    resubmissionTarget ? `Revision addressing feedback: ${resubmissionTarget.description}` : ''
  );
  const [code, setCode] = useState(resubmissionTarget?.code || '');
  const [tagsInput, setTagsInput] = useState(
    resubmissionTarget?.tags?.join(', ') || 'UI, HTML, CSS'
  );
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('editor');

  const isWebCode = isRenderableCode(code, language);

  const handleApplyTemplate = (templateKey: string) => {
    const template = CODE_TEMPLATES[templateKey];
    if (template) {
      setTitle(template.title);
      setDescription(template.desc);
      setCode(template.code);
      setLanguage(template.language);
      if (template.language === 'html_css') {
        setTagsInput('HTML, CSS, Component, UI');
      }
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
      <div className={`bg-white border border-slate-200 rounded-2xl w-full ${viewMode === 'split' ? 'max-w-6xl' : 'max-w-4xl'} max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 transition-all`}>
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
              <span className="text-xs text-slate-700 flex items-center gap-1.5 font-bold">
                <Sparkles size={14} className="text-indigo-600" />
                Featured Snippets & Demos:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('html_css_card')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold transition-all shadow-xs flex items-center gap-1"
                >
                  <Eye size={12} />
                  <span>HTML/CSS Pricing Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('html_css_widget')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold transition-all shadow-xs flex items-center gap-1"
                >
                  <Eye size={12} />
                  <span>HTML/JS Review Widget</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('typescript')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold transition-all shadow-xs"
                >
                  TypeScript EventBus
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('python')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold transition-all shadow-xs"
                >
                  Python Cache
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
                placeholder="e.g. Modern Responsive Glassmorphism Card"
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
                <option value="html_css">HTML / CSS (Live Preview Ready)</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="sql">SQL</option>
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
              placeholder="Briefly explain the design goals, UI responsiveness, or specific areas where you want peer feedback..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 leading-relaxed font-medium"
            />
          </div>

          {/* Code Section with Live Preview & View Mode Switcher */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Code Snippet *
                </label>
                {isWebCode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Web Preview Active
                  </span>
                )}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  id="btn-view-editor"
                  onClick={() => setViewMode('editor')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'editor'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileCode size={13} />
                  <span>Editor</span>
                </button>

                <button
                  type="button"
                  id="btn-view-preview"
                  onClick={() => setViewMode('preview')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'preview'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <Eye size={13} />
                  <span>Live Result</span>
                </button>

                <button
                  type="button"
                  id="btn-view-split"
                  onClick={() => setViewMode('split')}
                  className={`hidden md:flex px-2.5 py-1 rounded-md text-xs font-bold transition-all items-center gap-1.5 ${
                    viewMode === 'split'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <Columns size={13} />
                  <span>Side-by-Side</span>
                </button>
              </div>
            </div>

            {/* Render View Modes */}
            {viewMode === 'editor' && (
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                minHeight="min-h-[240px]"
                maxHeight="max-h-[380px]"
                placeholder="<!-- Paste or type HTML, CSS, or script code here. Live preview will automatically render. -->"
                idPrefix="submission-form"
              />
            )}

            {viewMode === 'preview' && (
              <CodeLivePreview
                code={code}
                language={language}
                title="Live UI Output Preview"
                minHeight="min-h-[340px]"
                maxHeight="max-h-[460px]"
              />
            )}

            {viewMode === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Source Code
                  </span>
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    language={language}
                    minHeight="min-h-[340px]"
                    maxHeight="max-h-[420px]"
                    placeholder="Type HTML/CSS..."
                    idPrefix="submission-split"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Live Rendering Output
                  </span>
                  <CodeLivePreview
                    code={code}
                    language={language}
                    title="Rendered Result"
                    minHeight="min-h-[340px]"
                    maxHeight="max-h-[420px]"
                  />
                </div>
              </div>
            )}
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
              placeholder="HTML, CSS, Tailwind, Responsive, Cards"
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

