import React, { useState } from 'react';
import { HalluCheckReport } from '../types.ts';
import {
  History,
  Download,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Globe,
  Sparkles,
} from 'lucide-react';

interface HistoryViewProps {
  history: HalluCheckReport[];
  isLoading: boolean;
  onSelectReport: (report: HalluCheckReport) => void;
  onDeleteReport: (id: string) => Promise<void>;
  onExportReport: (report: HalluCheckReport) => void;
  onSwitchToAnalyzer: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  isLoading,
  onSelectReport,
  onDeleteReport,
  onExportReport,
  onSwitchToAnalyzer,
}) => {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredHistory = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.aiAnswer.toLowerCase().includes(q) ||
      (item.sourceDocument && item.sourceDocument.toLowerCase().includes(q)) ||
      item.claims.some((c) => c.claim.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this verification report from history?')) {
      return;
    }
    try {
      setDeletingId(id);
      await onDeleteReport(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div id="history-view-page" className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Verification Audit History
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Persisted hallucination detection reports and evidence records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 w-56 sm:w-64"
            />
          </div>

          <button
            type="button"
            onClick={onSwitchToAnalyzer}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Check
          </button>
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="py-16 text-center text-zinc-500 dark:text-zinc-400">
          <div className="animate-spin w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">Loading audit history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base mb-1">
            No Verification Reports Found
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-5">
            {search
              ? 'No reports matched your search query. Try clearing the search term.'
              : 'Run your first hallucination check in the Analyzer tab to begin recording verification audits.'}
          </p>
          <button
            type="button"
            onClick={onSwitchToAnalyzer}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Go to Analyzer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((item) => {
            const dateStr = new Date(item.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            let trustColor = 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40';
            if (item.trustScore < 50) {
              trustColor = 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40';
            } else if (item.trustScore < 80) {
              trustColor = 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40';
            }

            return (
              <div
                key={item.id}
                id={`history-card-${item.id}`}
                onClick={() => onSelectReport(item)}
                className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
              >
                <div>
                  {/* Top metadata row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {/* Trust Score Badge */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${trustColor}`}>
                        {item.trustScore}% Trust
                      </span>

                      {/* Grounding type badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {item.groundingType === 'source_document' ? (
                          <>
                            <FileText className="w-3 h-3 text-indigo-500" />
                            Source Document
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 text-blue-500" />
                            Google Search Grounding
                          </>
                        )}
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      {dateStr}
                    </span>
                  </div>

                  {/* AI Answer excerpt */}
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-3 mb-4 leading-relaxed">
                    "{item.aiAnswer}"
                  </p>

                  {/* Claims Stats Chips */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.stats.supported} Supported
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-900/50">
                      <XCircle className="w-3 h-3" />
                      {item.stats.contradicted} Contradicted
                    </span>
                    {item.stats.unverifiable > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                        <HelpCircle className="w-3 h-3" />
                        {item.stats.unverifiable} Unverified
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                  <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white font-medium">
                    Inspect Report
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onExportReport(item)}
                      title="Export JSON"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deletingId === item.id}
                      title="Delete Report"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
