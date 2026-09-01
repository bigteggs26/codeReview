import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Calendar,
  Code,
  FileText,
  GitCompare,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Bot,
  Sparkles,
  Eye,
  Monitor
} from 'lucide-react';
import { Submission, User, SubmissionStatus } from '../types';
import { DiffViewer } from './DiffViewer';
import { CodeEditor } from './CodeEditor';
import { AiDetectorCard } from './AiDetectorCard';
import { AiDetectorBadge } from './AiDetectorBadge';
import { CodeLivePreview, isRenderableCode } from './CodeLivePreview';
import { LanguageBadge } from './LanguageBadge';

interface SubmissionDetailModalProps {
  submission: Submission;
  currentUser: User;
  onClose: () => void;
  onResubmit?: (sub: Submission) => void;
  onOpenReviewModal?: (sub: Submission) => void;
  onUpdateSubmissionAiDetection?: (submissionId: string, detection: any) => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  currentUser,
  onClose,
  onResubmit,
  onOpenReviewModal,
  onUpdateSubmissionAiDetection,
}) => {
  const isWebCode = isRenderableCode(submission.code, submission.language);
  const review = submission.review;
  
  const [activeTab, setActiveTab] = useState<'preview' | 'diff' | 'original' | 'rubric' | 'ai_detector'>(
    isWebCode ? 'preview' : (submission.review ? 'diff' : 'original')
  );
  const [previewVersion, setPreviewVersion] = useState<'original' | 'corrected'>(
    review?.correctedCode ? 'corrected' : 'original'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [isScanningAi, setIsScanningAi] = useState(false);

  const isOwner = currentUser.id === submission.memberId;
  const isAdmin = currentUser.role === 'admin';

  const dateStr = new Date(submission.submittedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleRunAiScan = async () => {
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

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Reviewed & Graded
          </span>
        );
      case 'needs_resubmission':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
            <AlertCircle size={13} className="text-rose-600" />
            Needs Action
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
            <Clock size={13} className="text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  const copyShareInfo = () => {
    const text = `[CodeScore] ${submission.title} (${submission.language}) - Status: ${submission.status}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={submission.memberAvatar}
              alt={submission.memberName}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <LanguageBadge language={submission.language} size="xs" />
                {getStatusBadge(submission.status)}
                <AiDetectorBadge
                  detection={submission.aiDetection}
                  size="sm"
                  onClick={() => setActiveTab('ai_detector')}
                />
                <span className="text-xs text-slate-500 font-medium">
                  by <strong className="text-slate-900">{submission.memberName}</strong>
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 truncate mt-1">
                {submission.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-submission-info-btn"
              onClick={copyShareInfo}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Copy snippet details"
            >
              {copiedLink ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
            </button>

            <button
              id="submission-detail-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs - responsive horizontal scrolling for mobile */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto w-full sm:w-auto shrink-0 pb-1 sm:pb-0">
            {/* Live Web Result Tab */}
            <button
              id="tab-live-preview-btn"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Eye size={14} />
              <span>Live Result Preview</span>
              {isWebCode && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {review && (
              <button
                id="tab-diff-view-btn"
                onClick={() => setActiveTab('diff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'diff'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <GitCompare size={14} />
                <span>Side-by-Side Diff</span>
              </button>
            )}

            <button
              id="tab-original-code-btn"
              onClick={() => setActiveTab('original')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'original'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Code size={14} />
              <span>Code Source</span>
            </button>

            {review && (
              <button
                id="tab-rubric-card-btn"
                onClick={() => setActiveTab('rubric')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'rubric'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Award size={14} />
                <span>Scorecard & Feedback</span>
              </button>
            )}

            <button
              id="tab-ai-detector-btn"
              onClick={() => setActiveTab('ai_detector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'ai_detector'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Bot size={14} />
              <span>AI Code Scan</span>
              {submission.aiDetection && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold">
                  {submission.aiDetection.aiProbability}%
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-2 shrink-0">
            <Calendar size={13} />
            <span>Submitted {dateStr}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Always show compact AI detector report badge if available */}
          {submission.aiDetection && activeTab !== 'ai_detector' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Bot size={16} className="text-indigo-600" />
                <span className="font-semibold text-slate-700">
                  AI Code Authenticity:
                </span>
                <AiDetectorBadge detection={submission.aiDetection} size="sm" />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ai_detector')}
                className="text-xs font-bold text-indigo-700 hover:underline"
              >
                View Full AI Analysis →
              </button>
            </div>
          )}

          {/* Submission Description */}
          {submission.description && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] block mb-1">
                Context & Description
              </span>
              <p className="leading-relaxed">{submission.description}</p>
            </div>
          )}

          {/* Review Score Summary Banner (if reviewed) */}
          {review && (
            <div className="rounded-xl bg-slate-50 p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={review.reviewerAvatar}
                  alt={review.reviewerName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-200"
                />
                <div>
                  <div className="text-xs text-slate-500">
                    Reviewed by <strong className="text-slate-900">{review.reviewerName}</strong>
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {new Date(review.reviewedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {/* Score Breakdown Pill */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Rubric Score</div>
                  <div className="text-2xl font-black text-indigo-700 font-mono">
                    {review.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Correctness</div>
                    <div className="font-bold text-emerald-700 font-mono">{review.rubric?.correctness ?? 0}/40</div>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Style</div>
                    <div className="font-bold text-indigo-700 font-mono">{review.rubric?.style ?? 0}/30</div>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Efficiency</div>
                    <div className="font-bold text-blue-700 font-mono">{review.rubric?.efficiency ?? 0}/30</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 0: Live Visual Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              {review?.correctedCode && (
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    Preview Target:
                  </span>
                  <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setPreviewVersion('original')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        previewVersion === 'original'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Original Submitted UI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewVersion('corrected')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        previewVersion === 'corrected'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      Reviewer Corrected UI ✨
                    </button>
                  </div>
                </div>
              )}

              <CodeLivePreview
                code={
                  review?.correctedCode && previewVersion === 'corrected'
                    ? review.correctedCode
                    : submission.code
                }
                language={submission.language}
                title={
                  review?.correctedCode && previewVersion === 'corrected'
                    ? `Reviewer Corrected Output: ${submission.title}`
                    : `Live Result: ${submission.title}`
                }
                minHeight="min-h-[380px]"
                maxHeight="max-h-[520px]"
              />
            </div>
          )}

          {/* Tab 1: Diff View */}
          {activeTab === 'diff' && review && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  Original Code vs. Reviewer Corrected Version
                </span>
                <span>Inspect additions (+) and deletions (-)</span>
              </div>
              <DiffViewer
                originalCode={submission.code}
                correctedCode={review.correctedCode}
                language={submission.language}
                maxHeight="max-h-[460px]"
              />
            </div>
          )}

          {/* Tab 2: Original Code View */}
          {activeTab === 'original' && (
            <div className="space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-xs block">
                Submitted Code
              </span>
              <CodeEditor
                value={submission.code}
                language={submission.language}
                readOnly={true}
                minHeight="min-h-[260px]"
                maxHeight="max-h-[460px]"
                idPrefix="detail-original-code"
              />
            </div>
          )}

          {/* Tab 3: Detailed Feedback and Rubrics */}
          {activeTab === 'rubric' && review && (
            <div className="space-y-4">
              {/* Written Feedback Note */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  Reviewer Explanation
                </span>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {review.feedbackText}
                </p>
              </div>

              {/* Strengths and Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {review.strengths && review.strengths.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Key Strengths
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                      {review.strengths.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {review.improvements && review.improvements.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      Areas for Improvement
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                      {review.improvements.map((i, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: AI Authenticity Detector Report */}
          {activeTab === 'ai_detector' && (
            <div className="space-y-4">
              <AiDetectorCard
                detection={submission.aiDetection}
                isScanning={isScanningAi}
                onRunScan={handleRunAiScan}
              />
            </div>
          )}

          {/* Action Callouts for Resubmission */}
          {submission.status === 'needs_resubmission' && isOwner && onResubmit && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle size={15} />
                  Resubmission Requested
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  The reviewer requested updates. You can resubmit an updated version based on the feedback above.
                </p>
              </div>
              <button
                id="detail-resubmit-now-btn"
                onClick={() => {
                  onClose();
                  onResubmit(submission);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <RefreshCw size={14} />
                <span>Resubmit Revised Code</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono font-medium">
            {submission.tags && submission.tags.map((t) => `#${t}`).join(' ')}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenReviewModal && (
              <button
                id="edit-review-from-detail-btn"
                onClick={() => {
                  onClose();
                  onOpenReviewModal(submission);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                {review ? 'Update Review & Score' : 'Review & Grade Code'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

