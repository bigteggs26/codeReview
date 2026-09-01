import React, { useState, useMemo } from 'react';
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  Code,
  User as UserIcon,
  Sparkles,
  Calendar,
  Award,
  ChevronRight,
  Send,
  Eye,
  Bot
} from 'lucide-react';
import { Submission, User, SubmissionStatus, ProgrammingLanguage } from '../types';
import { AiDetectorBadge } from './AiDetectorBadge';
import { isRenderableCode } from './CodeLivePreview';
import { LanguageBadge } from './LanguageBadge';

interface AdminQueueProps {
  currentUser: User;
  submissions: Submission[];
  onReviewSubmission: (sub: Submission) => void;
  onViewSubmission: (sub: Submission) => void;
  onScanAi?: (sub: Submission) => void;
}

export const AdminQueue: React.FC<AdminQueueProps> = ({
  currentUser,
  submissions,
  onReviewSubmission,
  onViewSubmission,
  onScanAi,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('pending');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [aiFilter, setAiFilter] = useState<'all' | 'ai_flagged' | 'human_only'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'member' | 'ai_score'>('newest');

  // Metrics
  const metrics = useMemo(() => {
    const pending = submissions.filter((s) => s.status === 'pending');
    const reviewed = submissions.filter((s) => s.status === 'reviewed');
    const needsResubmission = submissions.filter((s) => s.status === 'needs_resubmission');
    const aiFlagged = submissions.filter((s) => (s.aiDetection?.aiProbability || 0) >= 70);
    
    const scores = reviewed.map((s) => s.review?.score || 0).filter(Boolean);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      pendingCount: pending.length,
      reviewedCount: reviewed.length,
      needsResubmissionCount: needsResubmission.length,
      aiFlaggedCount: aiFlagged.length,
      totalCount: submissions.length,
      avgScore,
    };
  }, [submissions]);

  // Filtered & Sorted Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((s) => {
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (languageFilter !== 'all' && s.language !== languageFilter) return false;
        if (aiFilter === 'ai_flagged') {
          if ((s.aiDetection?.aiProbability || 0) < 70) return false;
        } else if (aiFilter === 'human_only') {
          if ((s.aiDetection?.aiProbability || 0) >= 40) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            s.title.toLowerCase().includes(q) ||
            s.memberName.toLowerCase().includes(q) ||
            s.language.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        if (sortBy === 'member') {
          return a.memberName.localeCompare(b.memberName);
        }
        if (sortBy === 'ai_score') {
          return (b.aiDetection?.aiProbability || 0) - (a.aiDetection?.aiProbability || 0);
        }
        return 0;
      });
  }, [submissions, statusFilter, languageFilter, aiFilter, searchQuery, sortBy]);

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Reviewed
          </span>
        );
      case 'needs_resubmission':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
            <AlertCircle size={12} className="text-rose-600" />
            Needs Action
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
            <Clock size={12} className="text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Reviewer Header Card */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-widest">
                Admin & Reviewer Queue
              </span>
              <span className="text-xs text-slate-500 font-medium">• Live Team Feed</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
              Code Submissions Queue
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Inspect submitted code, check AI authenticity flags, grade via rubric (Correctness, Style, Efficiency), and provide corrected code diffs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Queue Status</div>
              <div className="text-sm font-bold text-amber-700 flex items-center gap-1 justify-end mt-0.5">
                <Clock size={14} className="text-amber-600" />
                {metrics.pendingCount} Pending Triage
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center">
              <span>Pending Action</span>
              <Clock size={14} className="text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              {metrics.pendingCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting reviewer feedback</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center">
              <span>Total Reviewed</span>
              <CheckCircle2 size={14} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {metrics.reviewedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Graded and diffs merged</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center">
              <span>AI Flagged (≥70%)</span>
              <Bot size={14} className="text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700 font-mono mt-1">
              {metrics.aiFlaggedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Potential AI generated code</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center">
              <span>Team Avg Score</span>
              <Award size={14} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
              {metrics.avgScore}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Overall team standard</div>
          </div>
        </div>
      </div>

      {/* Filter and Queue Container */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              id="admin-filter-pending-btn"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock size={13} />
              Pending Queue ({metrics.pendingCount})
            </button>
            <button
              id="admin-filter-all-btn"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({metrics.totalCount})
            </button>
            <button
              id="admin-filter-reviewed-btn"
              onClick={() => setStatusFilter('reviewed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'reviewed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Reviewed ({metrics.reviewedCount})
            </button>
            <button
              id="admin-filter-needs-resubmission-btn"
              onClick={() => setStatusFilter('needs_resubmission')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'needs_resubmission'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Needs Action ({metrics.needsResubmissionCount})
            </button>
          </div>

          {/* AI Filter, Search, Language & Sort */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* AI Authenticity Selector */}
            <select
              id="admin-ai-filter"
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-medium"
            >
              <option value="all">🤖 All Authenticity</option>
              <option value="ai_flagged">🚩 Flagged AI (≥70%)</option>
              <option value="human_only">🧑 Human Authored (&lt;40%)</option>
            </select>

            <div className="relative flex-1 sm:w-36">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-admin-queue"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <select
              id="admin-language-filter"
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 capitalize font-medium"
            >
              <option value="all">All Languages</option>
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
              <option value="sql">SQL</option>
            </select>

            <select
              id="admin-sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-medium"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="ai_score">Sort: Highest AI %</option>
              <option value="member">Sort: Member Name</option>
            </select>
          </div>
        </div>

        {/* Queue Submissions List */}
        <div className="divide-y divide-slate-100">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map((sub) => {
              const dateStr = new Date(sub.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isPending = sub.status === 'pending';

              return (
                <div
                  key={sub.id}
                  id={`admin-queue-item-${sub.id}`}
                  className={`p-5 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isPending
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Left Metadata & Member info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <img
                      src={sub.memberAvatar}
                      alt={sub.memberName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0 mt-0.5"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {sub.memberName}
                        </span>
                        <LanguageBadge language={sub.language} size="xs" />
                        {getStatusBadge(sub.status)}

                        {isRenderableCode(sub.code, sub.language) && (
                          <span
                            title="Interactive Live Web Result Preview Available"
                            className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            onClick={() => onViewSubmission(sub)}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live UI
                          </span>
                        )}

                        {/* AI Authenticity Badge */}
                        <AiDetectorBadge
                          detection={sub.aiDetection}
                          onClick={() => onViewSubmission(sub)}
                          size="sm"
                        />
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                        {sub.title}
                      </h4>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {sub.description}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <Calendar size={12} />
                          Submitted {dateStr}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-500 font-medium">
                          <Code size={12} />
                          {sub.code.split('\n').length} lines of code
                        </span>
                        {sub.resubmissionCount ? (
                          <span className="text-amber-700 font-semibold">
                            Revision #{sub.resubmissionCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    {sub.review && (
                      <div className="text-right mr-2 hidden sm:block">
                        <div className="text-xs font-bold text-indigo-700 font-mono">
                          Score: {sub.review.score}/100
                        </div>
                        <div className="text-[10px] text-slate-400">
                          by {sub.review.reviewerName.split(' ')[0]}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        id={`admin-view-btn-${sub.id}`}
                        onClick={() => onViewSubmission(sub)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors border border-slate-300 shadow-xs"
                        title="View submission details and AI report"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Details</span>
                      </button>

                      <button
                        id={`admin-review-btn-${sub.id}`}
                        onClick={() => onReviewSubmission(sub)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                          isPending
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <Send size={14} />
                        <span>{isPending ? 'Review & Score' : 'Edit Review'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-bold text-slate-700">No submissions matching filter</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search criteria or AI authenticity filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

