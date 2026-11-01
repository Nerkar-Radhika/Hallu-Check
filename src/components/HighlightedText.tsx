import React, { useMemo } from 'react';
import { ClaimItem, Verdict } from '../types.ts';
import { CheckCircle2, XCircle, HelpCircle, MousePointerClick } from 'lucide-react';

interface HighlightedTextProps {
  text: string;
  claims: ClaimItem[];
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
}

interface MatchSegment {
  start: number;
  end: number;
  claim: ClaimItem;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  claims,
  selectedClaimId,
  onSelectClaim,
}) => {
  // Compute non-overlapping match segments across the original text
  const segments = useMemo(() => {
    if (!text || claims.length === 0) return [];

    const rawMatches: MatchSegment[] = [];
    let lastSearchIndex = 0;

    claims.forEach((claim) => {
      const quote = claim.originalQuote ? claim.originalQuote.trim() : claim.claim.trim();
      if (!quote) return;

      // First try searching forward from last position
      let idx = text.indexOf(quote, lastSearchIndex);
      if (idx === -1) {
        // Fallback to searching from beginning
        idx = text.indexOf(quote);
      }

      // If still not found, try case-insensitive match
      if (idx === -1) {
        const lowerText = text.toLowerCase();
        const lowerQuote = quote.toLowerCase();
        idx = lowerText.indexOf(lowerQuote);
      }

      if (idx !== -1) {
        rawMatches.push({
          start: idx,
          end: idx + quote.length,
          claim,
        });
        lastSearchIndex = idx + quote.length;
      }
    });

    // Sort by start index
    rawMatches.sort((a, b) => a.start - b.start);

    // Resolve overlaps by skipping overlapping segments
    const resolved: MatchSegment[] = [];
    let curEnd = 0;

    for (const m of rawMatches) {
      if (m.start >= curEnd) {
        resolved.push(m);
        curEnd = m.end;
      }
    }

    return resolved;
  }, [text, claims]);

  // Render text with highlighted spans
  const renderedContent = useMemo(() => {
    if (segments.length === 0) {
      return (
        <div className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal text-base">
          {text}
        </div>
      );
    }

    const elements: React.ReactNode[] = [];
    let curPos = 0;

    segments.forEach((seg, index) => {
      // Preceding normal text
      if (seg.start > curPos) {
        elements.push(
          <span key={`plain-${curPos}`} className="text-zinc-800 dark:text-zinc-200">
            {text.substring(curPos, seg.start)}
          </span>
        );
      }

      const isSelected = selectedClaimId === seg.claim.id;
      const verdict = seg.claim.verdict;

      let colorStyles = '';
      let badgeColor = '';
      let Icon = HelpCircle;

      if (verdict === 'Supported') {
        colorStyles = isSelected
          ? 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500 shadow-sm'
          : 'bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-500 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60';
        badgeColor = 'bg-emerald-600 text-white';
        Icon = CheckCircle2;
      } else if (verdict === 'Contradicted') {
        colorStyles = isSelected
          ? 'bg-rose-200 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500 shadow-sm'
          : 'bg-rose-100/90 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-b-2 border-rose-500 hover:bg-rose-200/80 dark:hover:bg-rose-900/60';
        badgeColor = 'bg-rose-600 text-white';
        Icon = XCircle;
      } else {
        // Unverifiable
        colorStyles = isSelected
          ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500 shadow-sm'
          : 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-b-2 border-amber-500 hover:bg-amber-200/80 dark:hover:bg-amber-900/60';
        badgeColor = 'bg-amber-600 text-white';
        Icon = HelpCircle;
      }

      elements.push(
        <mark
          id={`highlighted-claim-${seg.claim.id}`}
          key={`claim-${seg.claim.id}-${index}`}
          onClick={() => onSelectClaim(seg.claim.id)}
          className={`relative cursor-pointer transition-all duration-150 rounded-sm px-1 py-0.5 mx-0.5 inline-block font-medium ${colorStyles}`}
          title={`Click to inspect claim: "${seg.claim.claim}" (${seg.claim.verdict})`}
        >
          <span>{text.substring(seg.start, seg.end)}</span>
          <span
            className={`inline-flex items-center justify-center ml-1 px-1 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider align-super ${badgeColor}`}
          >
            <Icon className="w-2.5 h-2.5 mr-0.5 inline" />
            {seg.claim.verdict.slice(0, 4)}
          </span>
        </mark>
      );

      curPos = seg.end;
    });

    // Trailing text
    if (curPos < text.length) {
      elements.push(
        <span key={`plain-tail-${curPos}`} className="text-zinc-800 dark:text-zinc-200">
          {text.substring(curPos)}
        </span>
      );
    }

    return elements;
  }, [text, segments, selectedClaimId, onSelectClaim]);

  return (
    <div id="annotated-text-panel" className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
            Original Text Analysis
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            ({claims.length} {claims.length === 1 ? 'claim' : 'claims'} extracted)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Supported
          </span>
          <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Contradicted
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Unverifiable
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[420px] p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 leading-relaxed font-normal text-base text-zinc-800 dark:text-zinc-200">
        {renderedContent}
      </div>

      <div className="mt-3 pt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <MousePointerClick className="w-3.5 h-3.5 text-zinc-400" />
          Click any highlighted text to inspect evidence and reasoning
        </span>
        {selectedClaimId && (
          <button
            type="button"
            onClick={() => onSelectClaim('')}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
          >
            Deselect
          </button>
        )}
      </div>
    </div>
  );
};
