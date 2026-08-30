import React, { useState } from 'react';
import { Bot, UserCheck, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { AiDetectionResult } from '../types';

interface AiDetectorCardProps {
  detection?: AiDetectionResult;
  isScanning?: boolean;
  onRunScan?: () => void;
  compact?: boolean;
}

export const AiDetectorCard: React.FC<AiDetectorCardProps> = ({
  detection,
  isScanning = false,
  onRunScan,
  compact = false,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(!compact);

  if (!detection && !isScanning) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Bot size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">AI Code Authenticity Scanner</h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Analyze code structure, entropy, and comments to detect synthetic LLM authorship.
            </p>
          </div>
        </div>

        {onRunScan && (
          <button
            type="button"
            id="run-ai-scan-btn"
            onClick={onRunScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Sparkles size={14} />
            <span>Scan for AI Code</span>
          </button>
        )}
      </div>
    );
  }

  if (isScanning) {
    return (
      <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-200 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
        <div className="p-3 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-300">
          <RefreshCw size={24} className="animate-spin" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-indigo-950">Analyzing Code Syntactic Entropy...</h4>
          <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
            Evaluating textbook predictability, comment density, and LLM signature patterns...
          </p>
        </div>
      </div>
    );
  }

  if (!detection) return null;

  const { aiProbability, classification, confidence, breakdown, detectedSignals, humanSignals, summary, lineHighlights } = detection;

  const isHighAi = aiProbability >= 75;
  const isMediumAi = aiProbability >= 40 && aiProbability < 75;
  const isHuman = aiProbability < 40;

  const badgeColor = isHighAi
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : isMediumAi
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const progressBg = isHighAi
    ? 'bg-rose-500'
    : isMediumAi
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden text-slate-900">
      {/* Header Bar */}
      <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${badgeColor}`}>
            {isHighAi ? <Bot size={18} /> : isMediumAi ? <Sparkles size={18} /> : <UserCheck size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900">AI Code Authenticity Report</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${badgeColor}`}>
                {classification}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Confidence: <strong className="text-slate-700">{confidence}</strong> • Scanned on {new Date(detection.analyzedAt || Date.now()).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRunScan && (
            <button
              type="button"
              id="rescan-ai-btn"
              onClick={onRunScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors"
            >
              <RefreshCw size={12} />
              <span>Re-Scan</span>
            </button>
          )}

          {compact && (
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {detailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Analysis Body */}
      {detailsOpen && (
        <div className="p-5 space-y-4">
          {/* Top Score Meter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Probability Gauge Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                AI Generation Probability
              </span>
              <div className="text-3xl font-black font-mono mt-1 text-slate-900 flex items-baseline gap-0.5">
                <span>{aiProbability}</span>
                <span className="text-lg text-slate-400 font-bold">%</span>
              </div>
              {/* Mini progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressBg}`}
                  style={{ width: `${aiProbability}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1.5">
                {isHighAi ? 'High Syntactic AI Marker Match' : isMediumAi ? 'Hybrid or Copilot Autocomplete' : 'Organic Human Code Patterns'}
              </span>
            </div>

            {/* Metric Bars */}
            <div className="md:col-span-3 space-y-2.5 p-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs">
              <div>
                <div className="flex justify-between font-medium text-[11px] text-slate-600 mb-1">
                  <span>Textbook / Canonical Predictability</span>
                  <span className="font-mono font-bold text-slate-900">{breakdown?.predictabilityScore || 50}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${breakdown?.predictabilityScore || 50}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-[11px] text-slate-600 mb-1">
                  <span>Comment Verbosity & Docstring Density</span>
                  <span className="font-mono font-bold text-slate-900">{breakdown?.verbosityScore || 40}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${breakdown?.verbosityScore || 40}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-[11px] text-slate-600 mb-1">
                  <span>Syntactic & Formatting Uniformity</span>
                  <span className="font-mono font-bold text-slate-900">{breakdown?.structureUniformity || 60}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${breakdown?.structureUniformity || 60}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary Text */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900 block mb-0.5">Syntactic Evaluation Summary:</strong>
            {summary}
          </div>

          {/* Key Hallmarks Detected */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* AI Markers */}
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-1.5">
              <h5 className="text-[11px] font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Bot size={13} className="text-rose-600" />
                Detected AI Markers ({detectedSignals?.length || 0})
              </h5>
              {detectedSignals && detectedSignals.length > 0 ? (
                <ul className="space-y-1">
                  {detectedSignals.map((sig, idx) => (
                    <li key={idx} className="text-xs text-rose-900 flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-rose-700 italic">No strong synthetic markers detected.</p>
              )}
            </div>

            {/* Human Markers */}
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1.5">
              <h5 className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                <UserCheck size={13} className="text-emerald-600" />
                Human Engineering Signals ({humanSignals?.length || 0})
              </h5>
              {humanSignals && humanSignals.length > 0 ? (
                <ul className="space-y-1">
                  {humanSignals.map((sig, idx) => (
                    <li key={idx} className="text-xs text-emerald-900 flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-emerald-700 italic">No distinct idiosyncratic human habits found.</p>
              )}
            </div>
          </div>

          {/* Line Highlights if any */}
          {lineHighlights && lineHighlights.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-500" />
                Specific Flagged Code Sections:
              </span>
              <div className="space-y-1.5">
                {lineHighlights.map((item, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px] border border-slate-200">
                        Line {item.lineStart}{item.lineEnd !== item.lineStart ? `-${item.lineEnd}` : ''}
                      </span>
                      <span className="text-slate-800 font-medium">{item.reason}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider ${
                        item.severity === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : item.severity === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
