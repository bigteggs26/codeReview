import React, { useState } from 'react';
import {
  X,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  FileCode,
  Sliders,
  MessageSquare,
  GitCompare,
  Plus,
  Trash2,
  HelpCircle,
  ArrowRight,
  Bot
} from 'lucide-react';
import { Submission, User, RubricScores, Review } from '../types';
import { CodeEditor } from './CodeEditor';
import { DiffViewer } from './DiffViewer';
import { AiDetectorBadge } from './AiDetectorBadge';
import { AiDetectorCard } from './AiDetectorCard';

interface ReviewModalProps {
  submission: Submission;
  currentUser: User;
  onClose: () => void;
  onSaveReview: (submissionId: string, review: Review, statusOutcome: 'reviewed' | 'needs_resubmission') => void;
  onUpdateSubmissionAiDetection?: (submissionId: string, detection: any) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  submission,
  currentUser,
  onClose,
  onSaveReview,
  onUpdateSubmissionAiDetection,
}) => {
  const existing = submission.review;

  const [correctness, setCorrectness] = useState<number>(
    existing?.rubric?.correctness ?? 35
  );
  const [style, setStyle] = useState<number>(
    existing?.rubric?.style ?? 25
  );
  const [efficiency, setEfficiency] = useState<number>(
    existing?.rubric?.efficiency ?? 25
  );

  const [feedbackText, setFeedbackText] = useState<string>(
    existing?.feedbackText ?? ''
  );
  const [strengths, setStrengths] = useState<string[]>(
    existing?.strengths?.length ? existing.strengths : ['Clean structure and clear intent']
  );
  const [improvements, setImprovements] = useState<string[]>(
    existing?.improvements?.length ? existing.improvements : ['Consider handling edge cases and input validation']
  );

  const [correctedCode, setCorrectedCode] = useState<string>(
    existing?.correctedCode ?? submission.code
  );

  const [statusOutcome, setStatusOutcome] = useState<'reviewed' | 'needs_resubmission'>(
    existing?.statusOutcome ?? 'reviewed'
  );

  const [activeTab, setActiveTab] = useState<'editor' | 'diff'>('editor');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [showAiCard, setShowAiCard] = useState(false);
  const [isScanningAi, setIsScanningAi] = useState(false);

  // Total score calculation
  const totalScore = Math.min(100, Math.max(0, correctness + style + efficiency));

  const getGradeBadge = (score: number) => {
    if (score >= 95) return { grade: 'A+', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black' };
    if (score >= 90) return { grade: 'A', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black' };
    if (score >= 80) return { grade: 'B', color: 'bg-blue-50 text-blue-800 border-blue-300 font-black' };
    if (score >= 70) return { grade: 'C', color: 'bg-amber-50 text-amber-800 border-amber-300 font-black' };
    return { grade: 'Needs Work', color: 'bg-rose-50 text-rose-800 border-rose-300 font-black' };
  };

  const grade = getGradeBadge(totalScore);

  const handleAddStrength = () => {
    setStrengths([...strengths, '']);
  };

  const handleUpdateStrength = (idx: number, val: string) => {
    const next = [...strengths];
    next[idx] = val;
    setStrengths(next);
  };

  const handleRemoveStrength = (idx: number) => {
    setStrengths(strengths.filter((_, i) => i !== idx));
  };

  const handleAddImprovement = () => {
    setImprovements([...improvements, '']);
  };

  const handleUpdateImprovement = (idx: number, val: string) => {
    const next = [...improvements];
    next[idx] = val;
    setImprovements(next);
  };

  const handleRemoveImprovement = (idx: number) => {
    setImprovements(improvements.filter((_, i) => i !== idx));
  };

  const handleCopyOriginalToCorrected = () => {
    setCorrectedCode(submission.code);
  };

  const handleScanAi = async () => {
    setIsScanningAi(true);
    try {
      const response = await fetch('/api/ai-detect-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: submission.code,
          language: submission.language,
          title: submission.title,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (onUpdateSubmissionAiDetection) {
          onUpdateSubmissionAiDetection(submission.id, data);
        }
      }
    } catch (e) {
      console.error('Error scanning AI authenticity:', e);
    } finally {
      setIsScanningAi(false);
    }
  };

  // AI Assistant Review helper
  const handleAiAssist = async () => {
    try {
      setIsAiLoading(true);
      setAiMessage('Generating AI review insights & suggestions...');

      const res = await fetch('/api/ai-review-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: submission.code,
          language: submission.language,
          description: submission.description,
        }),
      });

      const data = await res.json();
      if (data.rubric) {
        setCorrectness(data.rubric.correctness || 35);
        setStyle(data.rubric.style || 25);
        setEfficiency(data.rubric.efficiency || 25);
      }
      if (data.feedbackText) {
        setFeedbackText(data.feedbackText);
      }
      if (data.strengths && Array.isArray(data.strengths)) {
        setStrengths(data.strengths);
      }
      if (data.improvements && Array.isArray(data.improvements)) {
        setImprovements(data.improvements);
      }
      if (data.correctedCode) {
        setCorrectedCode(data.correctedCode);
      }

      setAiMessage('AI suggestions populated! Review & customize them below.');
      setTimeout(() => setAiMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setAiMessage('Could not reach AI assistant. You can continue manual review.');
      setTimeout(() => setAiMessage(null), 4000);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();

    const rubric: RubricScores = {
      correctness,
      style,
      efficiency,
      total: totalScore,
    };

    const review: Review = {
      id: existing?.id || `rev-${Date.now()}`,
      submissionId: submission.id,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      reviewerAvatar: currentUser.avatar,
      score: totalScore,
      rubric,
      feedbackText: feedbackText.trim() || 'Review complete.',
      strengths: strengths.filter((s) => s.trim().length > 0),
      improvements: improvements.filter((i) => i.trim().length > 0),
      correctedCode: correctedCode.trim() || submission.code,
      statusOutcome,
      reviewedAt: new Date().toISOString(),
    };

    onSaveReview(submission.id, review, statusOutcome);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={submission.memberAvatar}
              alt={submission.memberName}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200 uppercase">
                  {submission.language}
                </span>
                <span className="text-xs text-slate-500">
                  Submitted by <strong className="text-slate-800">{submission.memberName}</strong>
                </span>
                <AiDetectorBadge
                  detection={submission.aiDetection}
                  size="sm"
                  onClick={() => setShowAiCard(!showAiCard)}
                />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 truncate mt-0.5">
                Review: {submission.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Assistant Button */}
            <button
              type="button"
              id="review-ai-assist-btn"
              onClick={handleAiAssist}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all border border-indigo-200 disabled:opacity-50"
              title="Generate review suggestions with AI"
            >
              <Sparkles size={14} className={isAiLoading ? 'animate-spin text-indigo-600' : 'text-indigo-600'} />
              <span>{isAiLoading ? 'Analyzing...' : 'AI Copilot Assist'}</span>
            </button>

            <button
              id="review-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* AI Notification pill if active */}
        {aiMessage && (
          <div className="bg-indigo-50 text-indigo-900 border-b border-indigo-200 px-4 py-2 text-xs flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-600" />
              {aiMessage}
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitReview} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Submission Description & AI Authenticity Banner */}
          <div className="grid grid-cols-1 gap-3">
            {submission.description && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] block mb-1">
                  Author's Description
                </span>
                {submission.description}
              </div>
            )}

            {/* Expandable AI Authenticity Panel */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={15} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    AI Code Authenticity Detector:
                  </span>
                  <AiDetectorBadge detection={submission.aiDetection} size="sm" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiCard(!showAiCard)}
                  className="text-xs font-bold text-indigo-700 hover:underline"
                >
                  {showAiCard ? 'Hide Full Report' : 'Show Full Breakdown'}
                </button>
              </div>

              {showAiCard && (
                <div className="p-4 bg-slate-50/50">
                  <AiDetectorCard
                    detection={submission.aiDetection}
                    isScanning={isScanningAi}
                    onRunScan={handleScanAi}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Original Code View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode size={14} className="text-indigo-600" />
                Submitted Code (Original)
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Read-only reference</span>
            </div>
            <CodeEditor
              value={submission.code}
              language={submission.language}
              readOnly={true}
              minHeight="min-h-[160px]"
              maxHeight="max-h-[260px]"
              idPrefix="original-code"
            />
          </div>

          {/* Scoring Rubric Section */}
          <div className="rounded-xl bg-slate-50 p-5 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <Sliders size={16} className="text-indigo-600" />
                  Rubric Scoring System
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign points across three foundational engineering metrics
                </p>
              </div>

              {/* Total Score Display */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Score</div>
                  <div className="text-2xl font-black text-indigo-700 font-mono">
                    {totalScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${grade.color}`}>
                  {grade.grade}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Correctness Slider */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 shadow-xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">1. Correctness & Logic</span>
                  <span className="font-mono font-black text-emerald-700">{correctness} / 40</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Bug-free logic, edge cases, error guards.
                </p>
                <input
                  id="rubric-correctness-slider"
                  type="range"
                  min="0"
                  max="40"
                  value={correctness}
                  onChange={(e) => setCorrectness(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Style Slider */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 shadow-xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">2. Code Style & Cleanliness</span>
                  <span className="font-mono font-black text-indigo-700">{style} / 30</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Readability, naming, formatting, modularity.
                </p>
                <input
                  id="rubric-style-slider"
                  type="range"
                  min="0"
                  max="30"
                  value={style}
                  onChange={(e) => setStyle(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Efficiency Slider */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 shadow-xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">3. Efficiency & Architecture</span>
                  <span className="font-mono font-black text-blue-700">{efficiency} / 30</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Big-O complexity, memory, thread safety.
                </p>
                <input
                  id="rubric-efficiency-slider"
                  type="range"
                  min="0"
                  max="30"
                  value={efficiency}
                  onChange={(e) => setEfficiency(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Feedback & Review Explanations */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <MessageSquare size={14} className="text-indigo-600" />
                Review Summary & Explanation
              </label>
              <textarea
                id="review-feedback-textarea"
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Provide constructive feedback, explain architectural trade-offs, and highlight areas for improvement..."
                className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 leading-relaxed"
                required
              />
            </div>

            {/* Strengths & Improvements 2-Column List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Key Strengths
                  </span>
                  <button
                    type="button"
                    onClick={handleAddStrength}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                <div className="space-y-1.5">
                  {strengths.map((st, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={st}
                        onChange={(e) => handleUpdateStrength(idx, e.target.value)}
                        placeholder="e.g. Excellent generic type constraints"
                        className="flex-1 px-2.5 py-1 rounded bg-white border border-emerald-300 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStrength(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <AlertCircle size={13} />
                    Areas to Improve
                  </span>
                  <button
                    type="button"
                    onClick={handleAddImprovement}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                <div className="space-y-1.5">
                  {improvements.map((imp, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={imp}
                        onChange={(e) => handleUpdateImprovement(idx, e.target.value)}
                        placeholder="e.g. Guard against null pointers in loop"
                        className="flex-1 px-2.5 py-1 rounded bg-white border border-amber-300 text-xs text-slate-800 focus:outline-none focus:border-amber-600 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImprovement(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Corrected Version & Live Diff Preview */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GitCompare size={14} className="text-indigo-600" />
                  Reviewer's Corrected Version
                </label>
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`px-2.5 py-0.5 rounded font-bold transition-colors ${
                      activeTab === 'editor'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Edit Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('diff')}
                    className={`px-2.5 py-0.5 rounded font-bold transition-colors ${
                      activeTab === 'diff'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Live Diff Preview
                  </button>
                </div>
              </div>

              <button
                type="button"
                id="copy-original-base-btn"
                onClick={handleCopyOriginalToCorrected}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
              >
                <Copy size={12} />
                Reset with Original Code
              </button>
            </div>

            {activeTab === 'editor' ? (
              <CodeEditor
                value={correctedCode}
                onChange={setCorrectedCode}
                language={submission.language}
                minHeight="min-h-[220px]"
                maxHeight="max-h-[360px]"
                placeholder="Paste or refine the corrected, production-ready code snippet..."
                idPrefix="corrected-code"
              />
            ) : (
              <DiffViewer
                originalCode={submission.code}
                correctedCode={correctedCode}
                language={submission.language}
                maxHeight="max-h-[360px]"
              />
            )}
          </div>

          {/* Final Status Decision */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Review Status Outcome
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  statusOutcome === 'reviewed'
                    ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="statusOutcome"
                  value="reviewed"
                  checked={statusOutcome === 'reviewed'}
                  onChange={() => setStatusOutcome('reviewed')}
                  className="mt-1 accent-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Approve & Complete Review
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Score is final and member can inspect full review feedback and side-by-side diff.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  statusOutcome === 'needs_resubmission'
                    ? 'bg-rose-50/70 border-rose-500 ring-1 ring-rose-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="statusOutcome"
                  value="needs_resubmission"
                  checked={statusOutcome === 'needs_resubmission'}
                  onChange={() => setStatusOutcome('needs_resubmission')}
                  className="mt-1 accent-rose-600"
                />
                <div>
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1">
                    <AlertCircle size={14} className="text-rose-600" />
                    Request Resubmission
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Flag back to member with feedback to fix critical bugs or rework before re-scoring.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Modal Footer Actions */}
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
              id="submit-review-action-btn"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Publish Review & Score</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
