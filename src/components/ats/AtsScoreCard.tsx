'use client';

import React, { useState } from 'react';
import { AtsAuditResult, AtsCheckItem } from '@/lib/atsEngine/atsScorer';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  Percent,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AtsScoreCardProps {
  audit: AtsAuditResult;
  onRefreshAudit?: () => void;
  onNavigateToStudio?: () => void;
}

export const AtsScoreCard: React.FC<AtsScoreCardProps> = ({
  audit,
  onRefreshAudit,
  onNavigateToStudio,
}) => {
  const [filter, setFilter] = useState<'all' | 'issues' | 'passed'>('all');
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  const { overallScore, grade, categoryBreakdown, metrics, checks } = audit;

  // Grade color theme
  const getScoreTheme = (score: number) => {
    if (score >= 90) {
      return {
        text: 'text-emerald-400',
        stroke: '#10b981',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        label: 'ATS Elite Certified',
      };
    }
    if (score >= 80) {
      return {
        text: 'text-sky-400',
        stroke: '#38bdf8',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/20',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        label: 'ATS Strong Pass',
      };
    }
    if (score >= 70) {
      return {
        text: 'text-amber-400',
        stroke: '#f59e0b',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        label: 'Moderate ATS Score',
      };
    }
    return {
      text: 'text-rose-400',
      stroke: '#f43f5e',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      label: 'Needs ATS Refactoring',
    };
  };

  const theme = getScoreTheme(overallScore);

  // Filter checks
  const filteredChecks = checks.filter((c) => {
    if (filter === 'issues') return c.status !== 'pass';
    if (filter === 'passed') return c.status === 'pass';
    return true;
  });

  const passedCount = checks.filter((c) => c.status === 'pass').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;

  // SVG Circular Meter Config
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Banner / Score Hero */}
      <div className={`p-6 rounded-2xl border ${theme.bg} ${theme.border} backdrop-blur-md relative overflow-hidden shadow-xl`}>
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between relative z-10">
          {/* Circular Score Gauge */}
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 130 130">
              {/* Background Track */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Dynamic Score Ring */}
              <circle
                cx="65"
                cy="65"
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
              <span className={`text-4xl font-black tracking-tight ${theme.text}`}>
                {overallScore}
              </span>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                out of 100
              </span>
            </div>
          </div>

          {/* Details & Grade */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${theme.badge}`}>
                {overallScore >= 80 ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {grade}
              </span>
              <span className="text-xs text-zinc-400">
                Resumly & Harvard ATS Audited
              </span>
            </div>

            <h3 className="text-lg font-bold text-zinc-100">
              {overallScore >= 90
                ? 'Ready for Tier-1 Enterprise ATS Gateways'
                : overallScore >= 80
                ? 'High ATS Pass Rate — Minor Polish Available'
                : 'Action Required to Pass Workday & Greenhouse Parsers'}
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              {overallScore >= 90
                ? 'Your resume strictly adheres to single-column ATS typography, high impact XYZ metrics, and standardized section headings. It parses cleanly across Workday, Taleo, and Greenhouse.'
                : 'Review the optimization checklist below to boost bullet action verbs, quantifiable outcomes, and contact completeness for maximum interview conversion.'}
            </p>

            {onNavigateToStudio && overallScore < 90 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToStudio}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Optimize Bullets in CV Studio
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumly 5-Category Breakdown */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Award className="h-4 w-4 text-indigo-400" />
            Resumly ATS Criteria Breakdown
          </h4>
          <span className="text-xs text-zinc-400">5 Audited Core Dimensions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Contact Info */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Contact Information</span>
              <span className="text-zinc-400 font-mono">
                {categoryBreakdown.contactInfo.score} / {categoryBreakdown.contactInfo.max}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(categoryBreakdown.contactInfo.score / categoryBreakdown.contactInfo.max) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Email, Phone, Location, GitHub, LinkedIn
            </p>
          </div>

          {/* 2. Heading Nomenclature */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Standard Section Headings</span>
              <span className="text-zinc-400 font-mono">
                {categoryBreakdown.sections.score} / {categoryBreakdown.sections.max}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(categoryBreakdown.sections.score / categoryBreakdown.sections.max) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Recognized tags (Experience, Projects, Education, Skills)
            </p>
          </div>

          {/* 3. Action Verbs & XYZ Formula */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">XYZ Action Verbs & Metrics</span>
              <span className="text-zinc-400 font-mono">
                {categoryBreakdown.contentAndVerbs.score} / {categoryBreakdown.contentAndVerbs.max}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(categoryBreakdown.contentAndVerbs.score / categoryBreakdown.contentAndVerbs.max) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Power action verbs + quantified business outcomes
            </p>
          </div>

          {/* 4. Density & Word Count */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Content Density & Balance</span>
              <span className="text-zinc-400 font-mono">
                {categoryBreakdown.density.score} / {categoryBreakdown.density.max}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(categoryBreakdown.density.score / categoryBreakdown.density.max) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Optimal 450-750 words for 1-page scanning
            </p>
          </div>

          {/* 5. Typography & Structure */}
          <div className="sm:col-span-2 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">ATS Single-Column Flow & Type 1 Typography</span>
              <span className="text-zinc-400 font-mono">
                {categoryBreakdown.structure.score} / {categoryBreakdown.structure.max}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(categoryBreakdown.structure.score / categoryBreakdown.structure.max) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Single-column layout, standard Times / Helvetica fonts, zero tables or complex canvas graphics
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <FileText className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-zinc-100">{metrics.totalWords}</div>
          <div className="text-[11px] text-zinc-400">Total Word Count</div>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <TrendingUp className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-zinc-100">{metrics.actionVerbPercentage}%</div>
          <div className="text-[11px] text-zinc-400">Action Verb Density</div>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <Percent className="h-4 w-4 text-sky-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-zinc-100">{metrics.quantifiableMetricPercentage}%</div>
          <div className="text-[11px] text-zinc-400">Quantified Outcomes</div>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <ShieldCheck className="h-4 w-4 text-purple-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-zinc-100">{metrics.totalBullets}</div>
          <div className="text-[11px] text-zinc-400">Total Experience Bullets</div>
        </div>
      </div>

      {/* Actionable Optimization Checklist */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ATS Audit Checklist & Recommendations
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {passedCount} passed, {warningCount} warnings, {failCount} issues
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === 'all'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({checks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('issues')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === 'issues'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Issues ({warningCount + failCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('passed')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === 'passed'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Passed ({passedCount})
            </button>
          </div>
        </div>

        {/* List of check items */}
        <div className="space-y-2.5">
          {filteredChecks.map((item) => {
            const isExpanded = expandedCheckId === item.id;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  item.status === 'pass'
                    ? 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
                    : item.status === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50'
                }`}
                onClick={() => setExpandedCheckId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {item.status === 'pass' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : item.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-zinc-400">
                      +{item.score}/{item.maxScore}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Recommendation */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
                    <div className="text-zinc-300 font-medium">
                      {item.description}
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-300 text-[11px] flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-zinc-200">Recommendation: </span>
                        {item.recommendation}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
