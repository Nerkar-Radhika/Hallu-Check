import React from 'react';
import { CheckStats } from '../types.ts';
import { CheckCircle2, XCircle, HelpCircle, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface CircularGaugeProps {
  score: number;
  stats: CheckStats;
  size?: number;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({ score, stats, size = 150 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let colorClass = 'text-emerald-500 stroke-emerald-500';
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  let label = 'High Trust';
  let StatusIcon = ShieldCheck;

  if (clampedScore < 50) {
    colorClass = 'text-rose-500 stroke-rose-500';
    badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    label = 'High Hallucination Risk';
    StatusIcon = ShieldAlert;
  } else if (clampedScore < 80) {
    colorClass = 'text-amber-500 stroke-amber-500';
    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    label = 'Moderate Trust';
    StatusIcon = AlertTriangle;
  }

  return (
    <div id="circular-trust-gauge" className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-100 dark:text-zinc-800"
          />
          {/* Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {clampedScore}%
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Trust Score
          </span>
        </div>
      </div>

      {/* Trust Level Pill */}
      <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
        <StatusIcon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>

      {/* Claim Breakdown Stats */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col items-center text-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats.supported}</span>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Supported</span>
        </div>

        <div className="flex flex-col items-center text-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-sm">
            <XCircle className="w-3.5 h-3.5" />
            <span>{stats.contradicted}</span>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Contradicted</span>
        </div>

        <div className="flex flex-col items-center text-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-sm">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{stats.unverifiable}</span>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Unverified</span>
        </div>
      </div>
    </div>
  );
};
