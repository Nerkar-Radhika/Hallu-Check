/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { CircularGauge } from './components/CircularGauge.tsx';
import { HighlightedText } from './components/HighlightedText.tsx';
import { ClaimInspector } from './components/ClaimInspector.tsx';
import { SummaryTable } from './components/SummaryTable.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { PRESET_EXAMPLES, PresetExample } from './data/presets.ts';
import { HalluCheckReport, ClaimItem } from './types.ts';
import {
  Sparkles,
  FileText,
  Globe,
  Download,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'analyzer' | 'history'>('analyzer');
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [sourceDocument, setSourceDocument] = useState<string>('');
  const [isSourceDocOpen, setIsSourceDocOpen] = useState<boolean>(false);

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyingStep, setVerifyingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [currentReport, setCurrentReport] = useState<HalluCheckReport | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const [history, setHistory] = useState<HalluCheckReport[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hallucheck_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hallucheck_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hallucheck_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Fetch History on Mount and Tab Change
  const fetchHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data.checks || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Load a Preset
  const handleLoadPreset = (preset: PresetExample) => {
    setError(null);
    setAiAnswer(preset.aiAnswer);
    if (preset.sourceDocument && preset.sourceDocument.trim().length > 0) {
      setSourceDocument(preset.sourceDocument);
      setIsSourceDocOpen(true);
    } else {
      setSourceDocument('');
      setIsSourceDocOpen(false);
    }
    showToast(`Loaded preset: "${preset.title}"`);
  };

  // Run Verification Pipeline
  const handleRunVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiAnswer || !aiAnswer.trim()) {
      setError('Please provide an AI-generated answer in the text box to analyze.');
      return;
    }

    setError(null);
    setIsVerifying(true);
    setVerifyingStep('1/2: Extracting atomic claims & verifying evidence...');

    const timer1 = setTimeout(() => {
      setVerifyingStep('2/2: Computing trust scores & structuring evidence...');
    }, 1800);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiAnswer: aiAnswer.trim(),
          sourceDocument: sourceDocument.trim() || undefined,
        }),
      });

      clearTimeout(timer1);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification request failed.');
      }

      const report = data as HalluCheckReport;
      setCurrentReport(report);
      setSelectedClaimId(report.claims.length > 0 ? report.claims[0].id : null);
      showToast('Verification audit completed successfully!');

      // Refresh history in background
      fetchHistory();
    } catch (err: unknown) {
      clearTimeout(timer1);
      console.error('Verification error:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred during verification.';
      setError(msg);
    } finally {
      setIsVerifying(false);
      setVerifyingStep('');
    }
  };

  // Export JSON file
  const handleExportJson = (reportToExport?: HalluCheckReport) => {
    const target = reportToExport || currentReport;
    if (!target) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(target, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hallucheck-report-${target.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Report JSON downloaded.');
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    if (!currentReport) return;
    navigator.clipboard.writeText(JSON.stringify(currentReport, null, 2));
    setCopied(true);
    showToast('Report JSON copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear Analyzer to start fresh
  const handleReset = () => {
    setAiAnswer('');
    setSourceDocument('');
    setCurrentReport(null);
    setSelectedClaimId(null);
    setError(null);
  };

  // Select a report from history to inspect
  const handleSelectReportFromHistory = (report: HalluCheckReport) => {
    setCurrentReport(report);
    setAiAnswer(report.aiAnswer);
    setSourceDocument(report.sourceDocument || '');
    setIsSourceDocOpen(Boolean(report.sourceDocument));
    setSelectedClaimId(report.claims.length > 0 ? report.claims[0].id : null);
    setCurrentTab('analyzer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete a report from history
  const handleDeleteReport = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete report');
      setHistory((prev) => prev.filter((r) => r.id !== id));
      if (currentReport?.id === id) {
        setCurrentReport(null);
      }
      showToast('Report deleted from history.');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete report.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        historyCount={history.length}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'history' ? (
          <HistoryView
            history={history}
            isLoading={isHistoryLoading}
            onSelectReport={handleSelectReportFromHistory}
            onDeleteReport={handleDeleteReport}
            onExportReport={handleExportJson}
            onSwitchToAnalyzer={() => setCurrentTab('analyzer')}
          />
        ) : (
          <div className="space-y-8">
            {/* Error Banner */}
            {error && (
              <div
                id="error-banner"
                className="flex items-start justify-between gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-200 text-sm"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Analysis Error: </strong>
                    <span>{error}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Input & Config Section */}
            <section
              id="input-section"
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-7 shadow-xs transition-colors"
            >
              {/* Presets Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                    Quick Sample Presets
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_EXAMPLES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleLoadPreset(preset)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/80 transition-all cursor-pointer"
                    >
                      <span>{preset.title}</span>
                    </button>
                  ))}
                  {(aiAnswer || currentReport) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      title="Clear and reset form"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleRunVerification} className="mt-5 space-y-4">
                {/* AI Answer Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="ai-answer-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      AI-Generated Text to Audit <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {aiAnswer.length} characters
                    </span>
                  </div>

                  <textarea
                    id="ai-answer-input"
                    rows={4}
                    value={aiAnswer}
                    onChange={(e) => setAiAnswer(e.target.value)}
                    placeholder="Paste the AI-generated answer or text you wish to check for hallucinations..."
                    className="w-full p-3.5 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all resize-y leading-relaxed"
                  />
                </div>

                {/* Optional Source Document (Collapsible Toggle) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      id="toggle-source-doc-btn"
                      onClick={() => setIsSourceDocOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {isSourceDocOpen ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                      <span>Optional Source Document (for Closed-Domain Grounding)</span>
                      {sourceDocument.trim().length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {isSourceDocOpen && sourceDocument.trim().length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <FileText className="w-3.5 h-3.5" /> Source Document Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Globe className="w-3.5 h-3.5" /> Gemini Google Search Grounding (Auto)
                        </span>
                      )}
                    </div>
                  </div>

                  {isSourceDocOpen && (
                    <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <textarea
                        id="source-doc-input"
                        rows={3}
                        value={sourceDocument}
                        onChange={(e) => setSourceDocument(e.target.value)}
                        placeholder="Paste the reference document, paper, or ground truth here. If provided, verification will be performed strictly against this source..."
                        className="w-full p-3.5 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all resize-y leading-relaxed"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        Leave blank to automatically verify claims against real-time web facts using Gemini Google Search grounding.
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>
                      Claims are atomically extracted, verified, and assigned a 0–100% Trust Score.
                    </span>
                  </div>

                  <button
                    type="submit"
                    id="run-verification-btn"
                    disabled={isVerifying || !aiAnswer.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Auditing Claims...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Detect Hallucinations</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Progress feedback banner during analysis */}
              {isVerifying && (
                <div className="mt-5 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-900 dark:border-white border-t-transparent animate-spin shrink-0" />
                  <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    <span className="font-semibold">Pipeline Running: </span>
                    {verifyingStep || 'Extracting claims and cross-referencing authoritative evidence...'}
                  </div>
                </div>
              )}
            </section>

            {/* Results Area */}
            {currentReport && (
              <section id="results-section" className="space-y-6 animate-in fade-in duration-300">
                {/* Results Header with Report Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      Verification Audit Report
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Grounding Mode:{' '}
                      <strong className="text-zinc-700 dark:text-zinc-300">
                        {currentReport.groundingType === 'source_document'
                          ? 'Source Document Cross-Audit'
                          : 'Google Search Live Grounding'}
                      </strong>{' '}
                      • Analyzed on {new Date(currentReport.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Actions: Export JSON, Copy */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="export-report-btn"
                      onClick={() => handleExportJson()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>

                    <button
                      type="button"
                      id="copy-json-btn"
                      onClick={handleCopyJson}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer shadow-2xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* Upper Grid: Circular Trust Gauge, Highlighted Text, Claim Inspector */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Gauge & Inspector (5 cols) */}
                  <div className="lg:col-span-5 space-y-6 flex flex-col">
                    {/* Circular Trust Score Gauge */}
                    <CircularGauge score={currentReport.trustScore} stats={currentReport.stats} />

                    {/* Claim Inspector Card */}
                    <div className="flex-1">
                      <ClaimInspector
                        claims={currentReport.claims}
                        selectedClaimId={selectedClaimId}
                        onSelectClaim={(id) => setSelectedClaimId(id)}
                      />
                    </div>
                  </div>

                  {/* Right Column: Annotated Original Text (7 cols) */}
                  <div className="lg:col-span-7">
                    <HighlightedText
                      text={currentReport.aiAnswer}
                      claims={currentReport.claims}
                      selectedClaimId={selectedClaimId}
                      onSelectClaim={(id) => setSelectedClaimId(id)}
                    />
                  </div>
                </div>

                {/* Bottom Full-Width: Claims Summary Table */}
                <div>
                  <SummaryTable
                    claims={currentReport.claims}
                    selectedClaimId={selectedClaimId}
                    onSelectClaim={(id) => setSelectedClaimId(id)}
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            HalluCheck • Server-Side Gemini API & Google Search Grounding • Zero-Trust Hallucination Auditing
          </span>
          <span className="font-mono text-[11px] text-zinc-400">
            Trust Score = Supported / Total × 100
          </span>
        </div>
      </footer>
    </div>
  );
}
