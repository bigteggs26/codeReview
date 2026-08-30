import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Code,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  FileCode,
  Calendar,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  RefreshCw,
  GitPullRequest
} from 'lucide-react';
import { Submission, User, SubmissionStatus } from '../types';

interface MemberDashboardProps {
  currentUser: User;
  submissions: Submission[];
  onOpenSubmitModal: (prefilledSubmission?: Submission) => void;
  onViewSubmission: (sub: Submission) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  currentUser,
  submissions,
  onOpenSubmitModal,
  onViewSubmission,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter submissions for this current member
  const memberSubmissions = useMemo(() => {
    return submissions.filter((s) => s.memberId === currentUser.id);
  }, [submissions, currentUser.id]);

  // Member metrics calculations
  const stats = useMemo(() => {
    const reviewed = memberSubmissions.filter((s) => s.status === 'reviewed' && s.review);
    const pending = memberSubmissions.filter((s) => s.status === 'pending');
    const needsResubmission = memberSubmissions.filter((s) => s.status === 'needs_resubmission');

    const scores = reviewed.map((s) => s.review!.score);
    const averageScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;

    return {
      total: memberSubmissions.length,
      reviewedCount: reviewed.length,
      pendingCount: pending.length,
      needsResubmissionCount: needsResubmission.length,
      averageScore,
      highestScore,
      lowestScore,
    };
  }, [memberSubmissions]);

  // Chart data for score progression over time
  const chartData = useMemo(() => {
    const reviewed = memberSubmissions
      .filter((s) => s.review)
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    if (reviewed.length === 0) {
      return [];
    }

    return reviewed.map((sub, idx) => {
      const date = new Date(sub.submittedAt);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return {
        name: `Sub #${idx + 1}`,
        date: formattedDate,
        fullTitle: sub.title,
        score: sub.review?.score || 0,
        correctness: sub.review?.rubric?.correctness || 0,
        style: sub.review?.rubric?.style || 0,
        efficiency: sub.review?.rubric?.efficiency || 0,
        language: sub.language,
      };
    });
  }, [memberSubmissions]);

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return memberSubmissions
      .filter((s) => {
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            s.title.toLowerCase().includes(q) ||
            s.language.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [memberSubmissions, statusFilter, searchQuery]);

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Member Banner */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-100 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, {currentUser.name}
                </h2>
                {currentUser.badge && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 uppercase tracking-wider">
                    {currentUser.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {currentUser.title} • Submit code, inspect reviewer rubric scoring, and explore side-by-side corrected diffs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="member-submit-cta-btn"
              onClick={() => onOpenSubmitModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle size={15} />
              <span>Submit Code for Review</span>
            </button>
          </div>
        </div>

        {/* Geometric Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Submissions</span>
              <FileCode size={14} className="text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.reviewedCount} reviewed • {stats.pendingCount} pending
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Avg Score</span>
              <Award size={14} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
              {stats.averageScore > 0 ? `${stats.averageScore}` : '—'}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across reviewed snippets
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Peak Score</span>
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {stats.highestScore > 0 ? `${stats.highestScore}` : '—'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Personal best rating
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Action Items</span>
              <AlertCircle size={14} className="text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono mt-1">
              {stats.needsResubmissionCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Needs resubmission
            </div>
          </div>
        </div>
      </div>

      {/* Score Trend Over Time Chart */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" />
              Score Progression Over Time
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical review performance across code iterations (0–100 scale)
            </p>
          </div>
          {chartData.length > 0 && (
            <div className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold font-mono">
              Latest: {chartData[chartData.length - 1].score} pts
            </div>
          )}
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-slate-900 text-white border border-slate-800 p-3 shadow-xl text-xs space-y-1.5 font-sans">
                          <p className="font-bold text-white">{data.fullTitle}</p>
                          <p className="text-slate-400 text-[11px] font-mono">
                            {data.date} • {data.language}
                          </p>
                          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-4">
                            <span className="text-slate-300">Overall Score:</span>
                            <span className="font-black text-indigo-400 text-sm font-mono">
                              {data.score} / 100
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex justify-between gap-3 pt-0.5">
                            <span>Correctness: {data.correctness}/40</span>
                            <span>Style: {data.style}/30</span>
                            <span>Efficiency: {data.efficiency}/30</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" opacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#4F46E5', strokeWidth: 2, stroke: '#FFFFFF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            <Sparkles size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-700">No reviewed submissions yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Submit your first snippet of code to have reviewers evaluate and build your score progression chart.
            </p>
            <button
              onClick={() => onOpenSubmitModal()}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-colors shadow-sm"
            >
              Submit First Snippet
            </button>
          </div>
        )}
      </div>

      {/* Submissions List & Filter Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCode size={16} className="text-indigo-600" />
              My Submissions History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review history, numeric rubric ratings, feedback notes, and side-by-side diffs
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-member-submissions"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search snippets..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                id="filter-all-btn"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({memberSubmissions.length})
              </button>
              <button
                id="filter-reviewed-btn"
                onClick={() => setStatusFilter('reviewed')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  statusFilter === 'reviewed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Reviewed
              </button>
              <button
                id="filter-pending-btn"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
              <button
                id="filter-resubmit-btn"
                onClick={() => setStatusFilter('needs_resubmission')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  statusFilter === 'needs_resubmission'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Needs Action
              </button>
            </div>
          </div>
        </div>

        {/* Submissions Cards */}
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

              return (
                <div
                  key={sub.id}
                  id={`submission-row-${sub.id}`}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                        {sub.language}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-md">
                        {sub.title}
                      </h4>
                      {getStatusBadge(sub.status)}
                    </div>

                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                      {sub.description}
                    </p>

                    <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <Calendar size={12} />
                        {dateStr}
                      </span>
                      {sub.tags && sub.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {sub.tags.map((t) => (
                            <span key={t} className="text-slate-500 font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Score & Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    {sub.review ? (
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border font-black text-sm font-mono ${getScoreColor(
                            sub.review.score
                          )}`}
                        >
                          <Award size={14} />
                          {sub.review.score}
                          <span className="text-[10px] font-normal opacity-80">/100</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          By {sub.review.reviewerName.split(' ')[0]}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 italic">In Queue</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {sub.status === 'needs_resubmission' && (
                        <button
                          id={`resubmit-btn-${sub.id}`}
                          onClick={() => onOpenSubmitModal(sub)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs"
                        >
                          <RefreshCw size={13} />
                          <span>Resubmit</span>
                        </button>
                      )}

                      <button
                        id={`view-submission-btn-${sub.id}`}
                        onClick={() => onViewSubmission(sub)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors border border-slate-300 shadow-xs"
                      >
                        <span>{sub.review ? 'View Review & Diff' : 'View Code'}</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500">
              <FileCode size={36} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">No submissions matching criteria</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? 'Try clearing your search filters' : 'Ready to submit your first code snippet?'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
