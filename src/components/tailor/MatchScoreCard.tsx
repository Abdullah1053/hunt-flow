'use client';

import React from 'react';
import { JdMatchAnalysis, TailoredDiffSummary } from '@/types/tailoring';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface MatchScoreCardProps {
  analysis: JdMatchAnalysis;
  diffSummary?: TailoredDiffSummary;
  isTailored: boolean;
  onGenerateTailored: () => void;
  isTailoring: boolean;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({
  analysis,
  diffSummary,
  isTailored,
  onGenerateTailored,
  isTailoring,
}) => {
  const { matchPercentage, grade, matchedSkills, missingSkills, strengths, recommendations } =
    analysis;

  const getScoreTheme = (pct: number) => {
    if (pct >= 85) {
      return {
        text: 'text-emerald-400',
        stroke: '#10b981',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    }
    if (pct >= 70) {
      return {
        text: 'text-sky-400',
        stroke: '#38bdf8',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/20',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
    }
    if (pct >= 55) {
      return {
        text: 'text-amber-400',
        stroke: '#f59e0b',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    return {
      text: 'text-rose-400',
      stroke: '#f43f5e',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    };
  };

  const theme = getScoreTheme(matchPercentage);

  // SVG Gauge
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchPercentage / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Hero Match Gauge Banner */}
      <div className={`p-6 rounded-2xl border ${theme.bg} ${theme.border} backdrop-blur-md relative overflow-hidden shadow-xl`}>
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between relative z-10">
          {/* Circular Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke={theme.stroke}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-black tracking-tight ${theme.text}`}>
                {matchPercentage}%
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                JD Match
              </span>
            </div>
          </div>

          {/* Details & Action */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${theme.badge}`}>
                <Target className="h-3.5 w-3.5" />
                {grade}
              </span>

              {isTailored && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="h-3 w-3" />
                  Tailored Snapshot Active
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-zinc-100">
              {isTailored
                ? 'Optimized & Targeted for Maximum ATS Screening Conversion'
                : 'Master CV vs. Target Job Description Gap Analysis'}
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              {isTailored
                ? `Your CV has been tailored specifically for this role: headline and summary contextualized, JD technologies placed first, and relevant project achievements highlighted.`
                : `We identified ${matchedSkills.length} matching core skills and ${missingSkills.length} missing keywords. Click below to automatically tailor your CV without altering your Master profile.`}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              <button
                type="button"
                onClick={onGenerateTailored}
                disabled={isTailoring}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white shadow-lg shadow-indigo-950/50 transition disabled:opacity-50"
              >
                {isTailoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 text-amber-300" />
                )}
                {isTailored ? 'Re-Tailor CV With AI' : '⚡ Generate Contextually Tailored CV'}
              </button>

              {diffSummary && (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +{diffSummary.matchScoreAfter - diffSummary.matchScoreBefore}% Match Lift
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matched vs Missing Skills Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched Skills */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Matched Skills & Qualifications ({matchedSkills.length})
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Present in Master CV</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Missing JD Keywords ({missingSkills.length})
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Target for Optimization</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                >
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-emerald-400 font-medium">
                No missing must-have skills identified!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          ATS Gap Recommendations
        </h4>
        <div className="space-y-1.5 text-xs text-zinc-400">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">•</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
