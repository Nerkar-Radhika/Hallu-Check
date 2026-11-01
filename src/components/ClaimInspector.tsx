import React from 'react';
import { ClaimItem, Verdict } from '../types.ts';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  Quote,
  Scale,
} from 'lucide-react';

interface ClaimInspectorProps {
  claims: ClaimItem[];
  selectedClaimId: string | null;
  onSelectClaim: (id: string) => void;
}

export const ClaimInspector: React.FC<ClaimInspectorProps> = ({
  claims,
  selectedClaimId,
  onSelectClaim,
}) => {
  const currentIndex = claims.findIndex((c) => c.id === selectedClaimId);
  const selectedClaim = currentIndex !== -1 ? claims[currentIndex] : null;

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectClaim(claims[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < claims.length - 1) {
      onSelectClaim(claims[currentIndex + 1].id);
    }
  };

  if (!selectedClaim) {
    return (
      <div id="claim-inspector-empty" className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-zinc-900 dark:text-white text-base mb-1">
          Claim Evidence Inspector
        </h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          Click any highlighted claim in the text or row in the table to examine evidence, confidence score, and verification rationale.
        </p>
      </div>
    );
  }

  const { verdict, confidence, reason, evidence_snippet, claim, originalQuote, sourceUrls } = selectedClaim;
  const confidencePercent = Math.round(confidence * 100);

  let verdictBadge = {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    barBg: 'bg-emerald-500',
    text: 'Supported Fact',
    Icon: CheckCircle2,
  };

  if (verdict === 'Contradicted') {
    verdictBadge = {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      barBg: 'bg-rose-500',
      text: 'Contradicted (Hallucination)',
      Icon: XCircle,
    };
  } else if (verdict === 'Unverifiable') {
    verdictBadge = {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      barBg: 'bg-amber-500',
      text: 'Unverifiable',
      Icon: HelpCircle,
    };
  }

  const { Icon } = verdictBadge;

  return (
    <div
      id="claim-inspector-card"
      className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm transition-colors"
    >
      {/* Header bar with navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Claim {currentIndex + 1} of {claims.length}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${verdictBadge.bg}`}>
            <Icon className="w-3.5 h-3.5" />
            {verdictBadge.text}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Previous Claim"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === claims.length - 1}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Next Claim"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Atomic claim statement */}
      <div className="mb-4">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Scale className="w-3.5 h-3.5" /> Atomic Claim
        </div>
        <p className="text-base font-semibold text-zinc-900 dark:text-white leading-snug">
          "{claim}"
        </p>
        {originalQuote && originalQuote !== claim && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 italic">
            Extracted from text: "{originalQuote}"
          </p>
        )}
      </div>

      {/* Confidence meter */}
      <div className="mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">Confidence Rating</span>
          <span className="font-bold text-zinc-900 dark:text-white">{confidencePercent}%</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${verdictBadge.barBg} transition-all duration-500 rounded-full`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Reason */}
      <div className="mb-4">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
          Verification Rationale
        </div>
        <div className="text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 leading-relaxed">
          {reason}
        </div>
      </div>

      {/* Evidence Snippet */}
      <div className="mb-3">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Quote className="w-3.5 h-3.5" /> Evidence Snippet
        </div>
        <blockquote className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/60 p-3 rounded-xl border-l-3 border-zinc-400 dark:border-zinc-600 leading-relaxed font-mono">
          {evidence_snippet || 'No direct snippet available.'}
        </blockquote>
      </div>

      {/* Citations if available */}
      {sourceUrls && sourceUrls.length > 0 && (
        <div className="mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
            Grounding Web Citations
          </div>
          <div className="flex flex-wrap gap-2">
            {sourceUrls.map((cite, i) => (
              <a
                key={i}
                href={cite.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                <span className="truncate max-w-[180px]">{cite.title || cite.url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
