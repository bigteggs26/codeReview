import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  ExternalLink,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Sparkles,
  Layers,
  Code2
} from 'lucide-react';
import { ProgrammingLanguage } from '../types';

interface CodeLivePreviewProps {
  code: string;
  language: ProgrammingLanguage;
  title?: string;
  minHeight?: string;
  maxHeight?: string;
  defaultViewport?: 'desktop' | 'tablet' | 'mobile';
  className?: string;
}

export const isRenderableCode = (code: string, language?: string): boolean => {
  if (!code || !code.trim()) return false;
  if (language === 'html_css') return true;
  
  const lower = code.toLowerCase();
  const htmlIndicators = [
    '<html',
    '<!doctype html',
    '<div',
    '<button',
    '<style',
    '<script',
    '<svg',
    '<section',
    '<article',
    '<form',
    '<table',
    '<canvas',
    '<header',
    '<footer',
    '<main',
    '<nav',
    '<p>',
    '<span',
    '<h1',
    '<h2',
    '<h3',
  ];

  return htmlIndicators.some((tag) => lower.includes(tag));
};

export const buildLivePreviewHtml = (rawCode: string, theme: 'light' | 'dark' = 'light'): string => {
  const trimmed = rawCode.trim();
  const isFullHtml = /<html|<!doctype html/i.test(trimmed);

  // Error boundary capture script to display syntax/runtime errors inside preview if any occur
  const errorCaptureScript = `
    <script>
      window.onerror = function(message, source, lineno, colno, error) {
        var box = document.getElementById('__error_display_box__');
        if (!box) {
          box = document.createElement('div');
          box.id = '__error_display_box__';
          box.style.position = 'fixed';
          box.style.bottom = '12px';
          box.style.left = '12px';
          box.style.right = '12px';
          box.style.backgroundColor = '#FEF2F2';
          box.style.border = '1px solid #F87171';
          box.style.borderRadius = '8px';
          box.style.padding = '10px 14px';
          box.style.fontFamily = 'monospace';
          box.style.fontSize = '12px';
          box.style.color = '#B91C1C';
          box.style.zIndex = '999999';
          box.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
          document.body.appendChild(box);
        }
        box.innerHTML = '<strong>Runtime Error:</strong> ' + message + ' (Line ' + lineno + ')';
      };
    </script>
  `;

  if (isFullHtml) {
    // Inject error script into head or before body
    if (trimmed.includes('</head>')) {
      return trimmed.replace('</head>', `${errorCaptureScript}</head>`);
    }
    return `${errorCaptureScript}${trimmed}`;
  }

  // Snippet wrapper
  const bgColor = theme === 'dark' ? '#0f172a' : '#ffffff';
  const textColor = theme === 'dark' ? '#f8fafc' : '#0f172a';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <!-- Tailwind CSS CDN for rich styling utility support -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s, color 0.2s;
    }
    /* Prevent root overflowing awkwardly */
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
  ${errorCaptureScript}
</head>
<body>
  ${trimmed}
</body>
</html>`;
};

export const CodeLivePreview: React.FC<CodeLivePreviewProps> = ({
  code,
  language,
  title = 'Live Result Preview',
  minHeight = 'min-h-[320px]',
  maxHeight = 'max-h-[500px]',
  defaultViewport = 'desktop',
  className = '',
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>(defaultViewport);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isRenderable = isRenderableCode(code, language);

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] max-w-full';
      case 'tablet':
        return 'w-[768px] max-w-full';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleOpenInNewTab = () => {
    const htmlContent = buildLivePreviewHtml(code, theme);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const htmlDoc = buildLivePreviewHtml(code, theme);

  if (!isRenderable) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-center ${minHeight} ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mb-3">
          <Code2 size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">
          Non-Web or Plain Backend Code
        </h4>
        <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
          This snippet is written in <strong>{language.toUpperCase()}</strong> without direct HTML/CSS web markup. Live Visual Rendering is active for HTML, CSS, JavaScript, SVG, and frontend UI templates.
        </p>
        <div className="p-3 bg-white border border-slate-200 rounded-xl text-left text-xs font-mono text-slate-600 max-w-md w-full">
          <span className="text-slate-400 font-sans font-bold block mb-1 uppercase tracking-wider text-[10px]">
            Tip:
          </span>
          Select <strong>HTML / CSS</strong> or include HTML markup like <code>&lt;div class=&quot;card&quot;&gt;...&lt;/div&gt;</code> to view interactive UI components live!
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-900 overflow-hidden shadow-sm flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl ring-1 ring-slate-700 max-h-none h-auto' : ''
      } ${className}`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-slate-300 gap-2 select-none">
        {/* Left Status & Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-sans">
              <Sparkles size={13} className="text-indigo-400" />
              {title}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold uppercase tracking-wider">
            Interactive
          </span>
        </div>

        {/* Center Viewport Selector */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            title="Desktop View (100%)"
            className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              viewport === 'desktop'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor size={14} />
            <span className="text-[10px] hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport('tablet')}
            title="Tablet View (768px)"
            className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              viewport === 'tablet'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet size={14} />
            <span className="text-[10px] hidden sm:inline">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport('mobile')}
            title="Mobile View (375px)"
            className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              viewport === 'mobile'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} />
            <span className="text-[10px] hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5">
          {/* Light/Dark Canvas Theme Switcher */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Canvas`}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 border border-slate-700"
          >
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} className="text-amber-400" />}
            <span className="text-[10px] hidden md:inline capitalize">{theme}</span>
          </button>

          {/* Refresh preview */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Re-render preview"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            <RotateCcw size={13} />
          </button>

          {/* Open in new tab */}
          <button
            type="button"
            onClick={handleOpenInNewTab}
            title="Open preview in new tab"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            <ExternalLink size={13} />
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full view' : 'Maximize preview'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div
        className={`flex-1 bg-slate-950 p-3 sm:p-4 overflow-auto flex items-center justify-center ${
          isFullscreen ? 'h-[calc(100vh-100px)]' : `${minHeight} ${maxHeight}`
        }`}
        style={{
          backgroundImage:
            theme === 'light'
              ? 'radial-gradient(#334155 1px, transparent 1px)'
              : 'radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div
          className={`h-full transition-all duration-200 flex flex-col shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white ${getViewportWidth()}`}
        >
          {/* Mini browser top bar inside iframe frame */}
          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between select-none">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono font-medium truncate max-w-[200px]">
              localhost:3000/preview
            </div>
            <div className="text-[10px] text-slate-400 font-medium font-sans capitalize">
              {viewport}
            </div>
          </div>

          <iframe
            key={refreshKey}
            ref={iframeRef}
            srcDoc={htmlDoc}
            title="Live Code Preview"
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="w-full flex-1 border-0 bg-white"
            style={{
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            }}
          />
        </div>
      </div>
    </div>
  );
};
