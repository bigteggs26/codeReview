import React, { useMemo } from 'react';
import {
  Trophy,
  Award,
  TrendingUp,
  Sparkles,
  Flame,
  Star,
  CheckCircle2,
  Code,
  Sliders,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Submission, TeamMemberRanking } from '../types';

interface TeamLeaderboardProps {
  users: User[];
  submissions: Submission[];
  onSelectMember: (user: User) => void;
}

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({
  users,
  submissions,
  onSelectMember,
}) => {
  // Compute rankings for team members
  const memberRankings: TeamMemberRanking[] = useMemo(() => {
    // Only rank members
    const members = users.filter((u) => u.role === 'member');

    const list = members.map((member) => {
      const memberSubs = submissions.filter((s) => s.memberId === member.id);
      const reviewed = memberSubs.filter((s) => s.status === 'reviewed' && s.review);

      const scores = reviewed.map((s) => s.review!.score);
      const correctnessScores = reviewed.map((s) => s.review!.rubric?.correctness || 0);
      const styleScores = reviewed.map((s) => s.review!.rubric?.style || 0);
      const efficiencyScores = reviewed.map((s) => s.review!.rubric?.efficiency || 0);

      const averageScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const avgCorrectness = correctnessScores.length
        ? Math.round((correctnessScores.reduce((a, b) => a + b, 0) / correctnessScores.length) * 10) / 10
        : 0;

      const avgStyle = styleScores.length
        ? Math.round((styleScores.reduce((a, b) => a + b, 0) / styleScores.length) * 10) / 10
        : 0;

      const avgEfficiency = efficiencyScores.length
        ? Math.round((efficiencyScores.reduce((a, b) => a + b, 0) / efficiencyScores.length) * 10) / 10
        : 0;

      const highestScore = scores.length ? Math.max(...scores) : 0;

      const lastActive = memberSubs.length
        ? memberSubs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0].submittedAt
        : new Date().toISOString();

      return {
        user: member,
        totalSubmissions: memberSubs.length,
        reviewedSubmissions: reviewed.length,
        averageScore,
        highestScore,
        lastActive,
        rank: 0,
        avgCorrectness,
        avgStyle,
        avgEfficiency,
      };
    });

    // Sort by average score descending, then by reviewed count
    list.sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.reviewedSubmissions - a.reviewedSubmissions;
    });

    // Assign 1-indexed ranks
    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  }, [users, submissions]);

  const topThree = memberRankings.slice(0, 3);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-widest flex items-center gap-1">
              <Trophy size={13} className="text-amber-600" />
              Team Benchmarks
            </span>
            <span className="text-xs text-slate-500 font-medium">• Leaderboard</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            Engineering Quality Leaderboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ranked by overall average score across peer and reviewer evaluations.
          </p>
        </div>

        <button
          id="celebrate-leaderboard-btn"
          onClick={triggerConfetti}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm hover:scale-105"
        >
          <Sparkles size={16} />
          <span>Celebrate Top Performers</span>
        </button>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 2nd Place */}
          {topThree[1] && (
            <div
              onClick={() => onSelectMember(topThree[1].user)}
              className="order-2 md:order-1 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center cursor-pointer hover:border-slate-400 hover:shadow-md transition-all hover:scale-[1.02] relative overflow-hidden"
            >
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-bold border border-slate-200">
                #2 Silver
              </div>
              <div className="relative mt-2">
                <img
                  src={topThree[1].user.avatar}
                  alt={topThree[1].user.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200 shadow-sm"
                />
                <div className="absolute -bottom-2 -right-1 bg-slate-700 text-slate-100 p-1 rounded-full ring-2 ring-white">
                  <Award size={14} />
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-3">
                {topThree[1].user.name}
              </h4>
              <p className="text-[11px] text-slate-500">{topThree[1].user.title}</p>
              <div className="mt-3 py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 w-full flex items-center justify-around">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Score</div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {topThree[1].averageScore} <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reviewed</div>
                  <div className="text-base font-black text-slate-700 font-mono">
                    {topThree[1].reviewedSubmissions}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1st Place (Gold Champion) */}
          {topThree[0] && (
            <div
              onClick={() => onSelectMember(topThree[0].user)}
              className="order-1 md:order-2 rounded-2xl bg-white border-2 border-amber-400 p-6 shadow-md flex flex-col items-center text-center cursor-pointer hover:border-amber-500 hover:shadow-lg transition-all hover:scale-[1.03] relative overflow-hidden md:-mt-2"
            >
              <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-xs font-mono font-black shadow-xs flex items-center gap-1">
                <Crown size={12} />
                #1 Gold
              </div>
              <div className="relative mt-2">
                <img
                  src={topThree[0].user.avatar}
                  alt={topThree[0].user.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-amber-300 shadow-md"
                />
                <div className="absolute -bottom-2 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-full ring-2 ring-white">
                  <Trophy size={16} />
                </div>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mt-3 flex items-center gap-1.5">
                {topThree[0].user.name}
              </h4>
              <p className="text-xs text-amber-700 font-bold">{topThree[0].user.title}</p>
              <div className="mt-4 py-2 px-4 rounded-xl bg-amber-50/60 border border-amber-200 w-full flex items-center justify-around">
                <div>
                  <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Avg Score</div>
                  <div className="text-xl font-black text-amber-700 font-mono">
                    {topThree[0].averageScore} <span className="text-xs font-normal text-amber-900/60">/100</span>
                  </div>
                </div>
                <div className="h-7 w-px bg-amber-200" />
                <div>
                  <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Submissions</div>
                  <div className="text-xl font-black text-slate-800 font-mono">
                    {topThree[0].reviewedSubmissions}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div
              onClick={() => onSelectMember(topThree[2].user)}
              className="order-3 md:order-3 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center cursor-pointer hover:border-slate-400 hover:shadow-md transition-all hover:scale-[1.02] relative overflow-hidden"
            >
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-mono font-bold border border-amber-200">
                #3 Bronze
              </div>
              <div className="relative mt-2">
                <img
                  src={topThree[2].user.avatar}
                  alt={topThree[2].user.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-200 shadow-sm"
                />
                <div className="absolute -bottom-2 -right-1 bg-amber-600 text-white p-1 rounded-full ring-2 ring-white">
                  <Award size={14} />
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-3">
                {topThree[2].user.name}
              </h4>
              <p className="text-[11px] text-slate-500">{topThree[2].user.title}</p>
              <div className="mt-3 py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 w-full flex items-center justify-around">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Score</div>
                  <div className="text-base font-black text-amber-800 font-mono">
                    {topThree[2].averageScore} <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reviewed</div>
                  <div className="text-base font-black text-slate-700 font-mono">
                    {topThree[2].reviewedSubmissions}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-indigo-600" />
            Complete Team Standings & Category Metrics
          </h3>
          <span className="text-xs text-slate-500">
            Click any member to switch into their dashboard view
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4 text-center">Submissions</th>
                <th className="py-3 px-4 text-center">Avg Correctness (40)</th>
                <th className="py-3 px-4 text-center">Avg Style (30)</th>
                <th className="py-3 px-4 text-center">Avg Efficiency (30)</th>
                <th className="py-3 px-4 text-center">Peak Score</th>
                <th className="py-3 px-4 text-right">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberRankings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center text-slate-500">
                    <Trophy size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No member rankings yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add team members and submit code submissions to generate rankings.
                    </p>
                  </td>
                </tr>
              ) : (
                memberRankings.map((item) => {
                  const isFirst = item.rank === 1;
                  const isSecond = item.rank === 2;
                  const isThird = item.rank === 3;

                  return (
                    <tr
                      key={item.user.id}
                      id={`leaderboard-row-${item.user.id}`}
                      onClick={() => onSelectMember(item.user)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        {isFirst ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                            🏆 1
                          </span>
                        ) : isSecond ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-800 border border-slate-300 font-bold">
                            🥈 2
                          </span>
                        ) : isThird ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">#{item.rank}</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.user.avatar}
                            alt={item.user.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {item.user.name}
                              {item.user.badge && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                  {item.user.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{item.user.title}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center text-slate-700 font-mono font-medium">
                        {item.reviewedSubmissions} <span className="text-slate-400 font-normal">/ {item.totalSubmissions}</span>
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-emerald-700">
                        {item.avgCorrectness ? `${item.avgCorrectness}` : '—'}
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-indigo-700">
                        {item.avgStyle ? `${item.avgStyle}` : '—'}
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-blue-700">
                        {item.avgEfficiency ? `${item.avgEfficiency}` : '—'}
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-700">
                        {item.highestScore ? `${item.highestScore}` : '—'}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold text-xs">
                          <Award size={13} className="text-indigo-600" />
                          {item.averageScore > 0 ? `${item.averageScore}/100` : 'No data'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
