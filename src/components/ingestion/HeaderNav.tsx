'use client';

import React from 'react';
import { Layers, Sparkles, CheckCircle2, ChevronRight, FileText, ArrowRight } from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';

interface HeaderNavProps {
  onLoadSample: () => void;
  isLoadingSample: boolean;
  activeTab: 'ingest' | 'preview' | 'studio' | 'ats';
  setActiveTab: (tab: 'ingest' | 'preview' | 'studio' | 'ats') => void;
  totalSources: number;
  hasProfile: boolean;
  onOpenGoalReport?: () => void;
}

const STAGES = [
  { id: 1, name: 'Multi-Source Ingestion', status: 'completed', desc: 'GitHub, Resumes & Links' },
  { id: 2, name: 'AI Master Studio', status: 'completed', desc: 'Normalized Schema & XYZ' },
  { id: 3, name: 'ATS Engine & Export', status: 'current', desc: 'Resumly Check & PDF' },
  { id: 4, name: 'Contextual Tailoring', status: 'upcoming', desc: 'Job Description Match' },
  { id: 5, name: 'Application Tracker', status: 'upcoming', desc: 'Kanban Pipeline' },
];

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onLoadSample,
  isLoadingSample,
  activeTab,
  setActiveTab,
  totalSources,
  onOpenGoalReport,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">HuntFlow</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Stage 3 Active: ATS & PDF
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                AI-Powered CV Builder & Job Application Tracker
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation Toggle */}
          <div className="flex items-center gap-3">
            {onOpenGoalReport && (
              <button
                type="button"
                onClick={onOpenGoalReport}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Stage 3 Goal Report
              </button>
            )}

            <button
              onClick={onLoadSample}
              disabled={isLoadingSample}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700 transition shadow-sm hover:border-zinc-600 disabled:opacity-50"
              title="Loads the sample Abdullah Ademi CV and GitHub profile"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              {isLoadingSample ? 'Loading Demo Data...' : 'Quick Load Demo Data'}
            </button>

            <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                onClick={() => setActiveTab('ingest')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === 'ingest'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <GithubIcon className="h-3.5 w-3.5" />
                Data Ingestion
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Staging
                {totalSources > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-400/20 text-indigo-300">
                    {totalSources}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('studio')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === 'studio'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                CV Studio
              </button>
              <button
                onClick={() => setActiveTab('ats')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === 'ats'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ATS & PDF
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400/20 text-emerald-300 font-bold uppercase">
                  Stage 3
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Stages Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-900 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max pb-1">
            {STAGES.map((stage, idx) => {
              const isCurrent = stage.status === 'current';
              const isCompleted = stage.status === 'completed';
              return (
                <React.Fragment key={stage.id}>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200 ring-1 ring-indigo-500/20'
                        : isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 opacity-60'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isCompleted ? '✓' : stage.id}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold leading-tight">{stage.name}</span>
                      <span className="text-[10px] text-zinc-400">{stage.desc}</span>
                    </div>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-zinc-700 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
