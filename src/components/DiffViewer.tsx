import React, { useState, useMemo } from 'react';
import { diffLines, Change } from 'diff';
import { Columns, AlignJustify, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface DiffViewerProps {
  originalCode: string;
  correctedCode: string;
  language?: string;
  maxHeight?: string;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'empty';
  content: string;
  originalLineNum?: number;
  correctedLineNum?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  correctedCode,
  language = 'typescript',
  maxHeight = 'max-h-[500px]'
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [copiedType, setCopiedType] = useState<'original' | 'corrected' | null>(null);
  const [collapseUnchanged, setCollapseUnchanged] = useState<boolean>(false);

  // Compute line diff
  const { splitRows, unifiedRows, additionsCount, deletionsCount } = useMemo(() => {
    const changes: Change[] = diffLines(originalCode || '', correctedCode || '');
    
    let additions = 0;
    let deletions = 0;

    // Build unified lines
    let origNum = 1;
    let corrNum = 1;
    const unified: DiffLine[] = [];

    // Build split lines
    const leftCol: DiffLine[] = [];
    const rightCol: DiffLine[] = [];

    changes.forEach((part) => {
      const lines = part.value.replace(/\n$/, '').split('\n');
      if (part.added) {
        additions += lines.length;
        lines.forEach((line) => {
          unified.push({
            type: 'added',
            content: line,
            correctedLineNum: corrNum++,
          });
          rightCol.push({
            type: 'added',
            content: line,
            correctedLineNum: corrNum - 1,
          });
        });
      } else if (part.removed) {
        deletions += lines.length;
        lines.forEach((line) => {
          unified.push({
            type: 'removed',
            content: line,
            originalLineNum: origNum++,
          });
          leftCol.push({
            type: 'removed',
            content: line,
            originalLineNum: origNum - 1,
          });
        });
      } else {
        lines.forEach((line) => {
          unified.push({
            type: 'unchanged',
            content: line,
            originalLineNum: origNum++,
            correctedLineNum: corrNum++,
          });
          leftCol.push({
            type: 'unchanged',
            content: line,
            originalLineNum: origNum - 1,
          });
          rightCol.push({
            type: 'unchanged',
            content: line,
            correctedLineNum: corrNum - 1,
          });
        });
      }
    });

    // Align split columns row by row
    const split: { left: DiffLine; right: DiffLine }[] = [];
    let lIdx = 0;
    let rIdx = 0;

    while (lIdx < leftCol.length || rIdx < rightCol.length) {
      const left = leftCol[lIdx];
      const right = rightCol[rIdx];

      if (left && right && left.type === 'unchanged' && right.type === 'unchanged') {
        split.push({ left, right });
        lIdx++;
        rIdx++;
      } else if (left && left.type === 'removed' && right && right.type === 'added') {
        split.push({ left, right });
        lIdx++;
        rIdx++;
      } else if (left && left.type === 'removed') {
        split.push({
          left,
          right: { type: 'empty', content: '' }
        });
        lIdx++;
      } else if (right && right.type === 'added') {
        split.push({
          left: { type: 'empty', content: '' },
          right
        });
        rIdx++;
      } else if (left) {
        split.push({ left, right: { type: 'empty', content: '' } });
        lIdx++;
      } else if (right) {
        split.push({ left: { type: 'empty', content: '' }, right });
        rIdx++;
      }
    }

    return {
      splitRows: split,
      unifiedRows: unified,
      additionsCount: additions,
      deletionsCount: deletions,
    };
  }, [originalCode, correctedCode]);

  const copyToClipboard = (text: string, type: 'original' | 'corrected') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-950 overflow-hidden shadow-sm text-xs font-mono">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-white tracking-wide font-sans text-xs uppercase flex items-center gap-2">
            Code Difference
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono font-bold uppercase border border-slate-700">
              {language}
            </span>
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded font-bold font-mono">
              +{additionsCount} lines
            </span>
            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded font-bold font-mono">
              -{deletionsCount} lines
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              id="diff-split-view-btn"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns size={13} />
              Side-by-Side
            </button>
            <button
              id="diff-unified-view-btn"
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'unified'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlignJustify size={13} />
              Unified
            </button>
          </div>

          {/* Copy Action Buttons */}
          <button
            id="copy-corrected-code-btn"
            onClick={() => copyToClipboard(correctedCode, 'corrected')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors text-xs font-bold font-sans"
            title="Copy corrected code"
          >
            {copiedType === 'corrected' ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Corrected</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diff Table View */}
      <div className={`overflow-auto ${maxHeight} divide-y divide-slate-800/60`}>
        {viewMode === 'split' ? (
          <div className="min-w-[700px]">
            {/* Column Titles */}
            <div className="grid grid-cols-2 bg-slate-900/90 text-slate-400 text-[10px] font-sans font-bold uppercase tracking-wider border-b border-slate-800">
              <div className="px-4 py-1.5 border-r border-slate-800 flex items-center justify-between">
                <span>Original Submitted Code</span>
                <span className="text-slate-500 font-normal">Before</span>
              </div>
              <div className="px-4 py-1.5 flex items-center justify-between text-emerald-400">
                <span>Reviewer Corrected Code</span>
                <span className="text-emerald-500 font-normal">After</span>
              </div>
            </div>

            {/* Split Rows */}
            <div className="font-mono text-[12px] leading-relaxed">
              {splitRows.map((row, idx) => {
                const isLeftRemoved = row.left.type === 'removed';
                const isRightAdded = row.right.type === 'added';

                return (
                  <div key={idx} className="grid grid-cols-2 hover:bg-slate-900/60">
                    {/* Left Pane (Original) */}
                    <div
                      className={`flex items-start border-r border-slate-800/80 px-2 py-0.5 ${
                        isLeftRemoved
                          ? 'bg-rose-950/40 text-rose-200'
                          : row.left.type === 'empty'
                          ? 'bg-slate-950 text-transparent select-none'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="w-8 shrink-0 select-none text-right pr-3 text-slate-500 font-mono text-[11px]">
                        {row.left.originalLineNum || ''}
                      </span>
                      <span className="w-4 shrink-0 select-none text-rose-400 font-bold">
                        {isLeftRemoved ? '-' : ''}
                      </span>
                      <pre className="overflow-x-auto whitespace-pre font-mono flex-1">
                        {row.left.content || (row.left.type === 'empty' ? ' ' : '')}
                      </pre>
                    </div>

                    {/* Right Pane (Corrected) */}
                    <div
                      className={`flex items-start px-2 py-0.5 ${
                        isRightAdded
                          ? 'bg-emerald-950/40 text-emerald-200'
                          : row.right.type === 'empty'
                          ? 'bg-slate-950 text-transparent select-none'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="w-8 shrink-0 select-none text-right pr-3 text-slate-500 font-mono text-[11px]">
                        {row.right.correctedLineNum || ''}
                      </span>
                      <span className="w-4 shrink-0 select-none text-emerald-400 font-bold">
                        {isRightAdded ? '+' : ''}
                      </span>
                      <pre className="overflow-x-auto whitespace-pre font-mono flex-1">
                        {row.right.content || (row.right.type === 'empty' ? ' ' : '')}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Unified View */
          <div className="font-mono text-[12px] leading-relaxed min-w-[500px]">
            {unifiedRows.map((line, idx) => {
              const isAdded = line.type === 'added';
              const isRemoved = line.type === 'removed';

              let rowBg = 'hover:bg-slate-900/60 text-slate-300';
              if (isAdded) rowBg = 'bg-emerald-950/40 text-emerald-200 hover:bg-emerald-950/60';
              if (isRemoved) rowBg = 'bg-rose-950/40 text-rose-200 hover:bg-rose-950/60';

              return (
                <div key={idx} className={`flex items-start px-2 py-0.5 ${rowBg}`}>
                  <span className="w-8 shrink-0 select-none text-right pr-2 text-slate-500 text-[11px]">
                    {line.originalLineNum || ''}
                  </span>
                  <span className="w-8 shrink-0 select-none text-right pr-2 text-slate-500 text-[11px]">
                    {line.correctedLineNum || ''}
                  </span>
                  <span
                    className={`w-5 shrink-0 select-none font-bold text-center ${
                      isAdded ? 'text-emerald-400' : isRemoved ? 'text-rose-400' : 'text-slate-600'
                    }`}
                  >
                    {isAdded ? '+' : isRemoved ? '-' : ' '}
                  </span>
                  <pre className="overflow-x-auto whitespace-pre font-mono flex-1">
                    {line.content || ' '}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
