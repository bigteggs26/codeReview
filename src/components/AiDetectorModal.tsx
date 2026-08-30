import React, { useState } from 'react';
import { X, Bot, Sparkles, RefreshCw, Code2, AlertTriangle, ShieldCheck, CheckCircle2, Copy, Check } from 'lucide-react';
import { ProgrammingLanguage, AiDetectionResult } from '../types';
import { CodeEditor } from './CodeEditor';
import { AiDetectorCard } from './AiDetectorCard';
import { AI_DETECTOR_PRESETS } from '../data/initialData';

interface AiDetectorModalProps {
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: ProgrammingLanguage;
  initialTitle?: string;
}

export const AiDetectorModal: React.FC<AiDetectorModalProps> = ({
  onClose,
  initialCode = '',
  initialLanguage = 'typescript',
  initialTitle = '',
}) => {
  const [code, setCode] = useState(
    initialCode || AI_DETECTOR_PRESETS[0]?.code || ''
  );
  const [language, setLanguage] = useState<ProgrammingLanguage>(
    initialLanguage || 'typescript'
  );
  const [title, setTitle] = useState(
    initialTitle || AI_DETECTOR_PRESETS[0]?.name || 'Prefix Tree Trie'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [detectionResult, setDetectionResult] = useState<AiDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (presetId: string) => {
    const preset = AI_DETECTOR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCode(preset.code);
      setTitle(preset.name);
      setLanguage(preset.language as ProgrammingLanguage);
      setDetectionResult(null);
      setError(null);
    }
  };

  const handleScanCode = async () => {
    if (!code.trim()) {
      setError('Please provide code to analyze.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-detect-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          language,
          title: title.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const data = await response.json();
      setDetectionResult(data);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError('Failed to scan code snippet. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  AI Code Authenticity Detector
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 uppercase tracking-wider">
                  Neural Entropy Scanner
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Detect whether code was written by ChatGPT, Copilot, or human engineers.
              </p>
            </div>
          </div>

          <button
            id="ai-detector-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Benchmark Preset Buttons */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles size={14} className="text-indigo-600" />
                Try Benchmark Samples:
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Click any preset to populate and test the detector
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {AI_DETECTOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  id={`preset-${preset.id}`}
                  onClick={() => handleSelectPreset(preset.id)}
                  className="p-2.5 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left transition-all group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 truncate">
                      {preset.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                        preset.expectedType === 'AI'
                          ? 'bg-rose-100 text-rose-700'
                          : preset.expectedType === 'Human'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {preset.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">
                      {preset.language}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Snippet Meta Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Snippet Context / Title
              </label>
              <input
                id="detector-snippet-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. In-memory Trie data structure"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Language
              </label>
              <select
                id="detector-snippet-language"
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

          {/* Code Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Code Snippet to Analyze *
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {code.split('\n').length} lines • {code.length} characters
              </span>
            </div>
            <CodeEditor
              value={code}
              onChange={(val) => {
                setCode(val);
                if (detectionResult) setDetectionResult(null);
              }}
              language={language}
              minHeight="min-h-[220px]"
              maxHeight="max-h-[320px]"
              placeholder="// Paste or write any code here to test for AI authorship..."
              idPrefix="detector-studio"
            />
          </div>

          {/* Scan Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 font-medium">
              Evaluates token probability, comment verbosity, and generative AI templates.
            </div>

            <button
              type="button"
              id="ai-detector-scan-action"
              onClick={handleScanCode}
              disabled={isScanning || !code.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isScanning ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Scanning Code Authenticity...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Run AI Authenticity Scan</span>
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Area */}
          {(detectionResult || isScanning) && (
            <div className="pt-4 border-t border-slate-200">
              <AiDetectorCard
                detection={detectionResult || undefined}
                isScanning={isScanning}
                onRunScan={handleScanCode}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Powered by Deep Syntactic Analysis & Gemini AI Scanner
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
