import React, { useState, useMemo } from 'react';
import { ClaimItem, Verdict } from '../types.ts';
import { CheckCircle2, XCircle, HelpCircle, Search, Filter, ArrowUpDown } from 'lucide-react';

interface SummaryTableProps {
  claims: ClaimItem[];
  selectedClaimId: string | null;
  onSelectClaim: (id: string) => void;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  claims,
  selectedClaimId,
  onSelectClaim,
}) => {
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const counts = useMemo(() => {
    return {
      all: claims.length,
      supported: claims.filter((c) => c.verdict === 'Supported').length,
      contradicted: claims.filter((c) => c.verdict === 'Contradicted').length,
      unverifiable: claims.filter((c) => c.verdict === 'Unverifiable').length,
    };
  }, [claims]);

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Verdict filter
      if (filterVerdict !== 'ALL' && claim.verdict !== filterVerdict) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchClaim = claim.claim.toLowerCase().includes(query);
        const matchReason = claim.reason.toLowerCase().includes(query);
        const matchEvidence = claim.evidence_snippet.toLowerCase().includes(query);
        return matchClaim || matchReason || matchEvidence;
      }
      return true;
    });
  }, [claims, filterVerdict, searchQuery]);

  return (
    <div id="summary-table-container" className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
            Claims Verification Summary
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Atomic factual claims audited with confidence scores and evidence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims or evidence..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 w-44 sm:w-56"
            />
          </div>

          {/* Filter Pills */}
          <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700/80 text-xs">
            <button
              type="button"
              onClick={() => setFilterVerdict('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterVerdict === 'ALL'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterVerdict('Supported')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterVerdict === 'Supported'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600'
              }`}
            >
              Supported ({counts.supported})
            </button>
            <button
              type="button"
              onClick={() => setFilterVerdict('Contradicted')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterVerdict === 'Contradicted'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600'
              }`}
            >
              Contradicted ({counts.contradicted})
            </button>
            <button
              type="button"
              onClick={() => setFilterVerdict('Unverifiable')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterVerdict === 'Unverifiable'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600'
              }`}
            >
              Unverified ({counts.unverifiable})
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[220px]">Atomic Claim</th>
              <th className="py-3 px-4 w-32">Verdict</th>
              <th className="py-3 px-4 w-28">Confidence</th>
              <th className="py-3 px-4 min-w-[240px]">Reason</th>
              <th className="py-3 px-4 min-w-[240px]">Evidence Snippet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                  No claims match the active filter criteria.
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim, idx) => {
                const isSelected = selectedClaimId === claim.id;
                const confPercent = Math.round(claim.confidence * 100);

                let verdictStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
                let Icon = CheckCircle2;

                if (claim.verdict === 'Contradicted') {
                  verdictStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
                  Icon = XCircle;
                } else if (claim.verdict === 'Unverifiable') {
                  verdictStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
                  Icon = HelpCircle;
                }

                return (
                  <tr
                    key={claim.id}
                    id={`table-row-${claim.id}`}
                    onClick={() => onSelectClaim(claim.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 font-medium'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-zinc-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {claim.claim}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${verdictStyle}`}>
                        <Icon className="w-3 h-3" />
                        {claim.verdict}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{confPercent}%</span>
                        <div className="w-12 bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              claim.verdict === 'Supported'
                                ? 'bg-emerald-500'
                                : claim.verdict === 'Contradicted'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${confPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                      {claim.reason}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] leading-relaxed max-w-xs truncate">
                      {claim.evidence_snippet}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
