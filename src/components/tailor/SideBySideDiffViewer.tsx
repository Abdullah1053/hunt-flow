'use client';

import React, { useState } from 'react';
import { MasterCvProfile } from '@/types/masterCv';
import { TailoredCvProfile } from '@/types/tailoring';
import {
  GitCompare,
  Eye,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers,
} from 'lucide-react';

interface SideBySideDiffViewerProps {
  masterProfile: MasterCvProfile;
  tailoredProfile: TailoredCvProfile;
}

export const SideBySideDiffViewer: React.FC<SideBySideDiffViewerProps> = ({
  masterProfile,
  tailoredProfile,
}) => {
  const [viewMode, setViewMode] = useState<'diff' | 'tailoredDocument'>('diff');

  const { profile: tailored } = tailoredProfile;

  return (
    <div className="space-y-4">
      {/* View Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'diff'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5 text-indigo-400" />
              Side-by-Side Diff Inspector
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tailoredDocument')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'tailoredDocument'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5 text-emerald-400" />
              Tailored ATS Document Sheet
            </button>
          </div>
        </div>

        <div className="text-xs text-zinc-400 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Role-Specific AI Optimizations</span>
        </div>
      </div>

      {/* MODE 1: SIDE BY SIDE DIFF */}
      {viewMode === 'diff' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* LEFT: MASTER CV (BASELINE) */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-zinc-500" />
                Master CV (Baseline Record)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                Pristine / Unmodified
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Headline
              </span>
              <p className="text-xs font-medium text-zinc-300 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                {masterProfile.personalInfo.headline}
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Professional Summary
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                {masterProfile.personalInfo.summary}
              </p>
            </div>

            {/* Top Skills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Primary Languages & Frameworks
              </span>
              <div className="flex flex-wrap gap-1 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                {[...masterProfile.skills.languages, ...masterProfile.skills.frameworks]
                  .slice(0, 8)
                  .map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300"
                    >
                      {s}
                    </span>
                  ))}
              </div>
            </div>

            {/* Experience Bullets Preview */}
            {masterProfile.experience[0] && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Top Role: {masterProfile.experience[0].company} ({masterProfile.experience[0].role})
                </span>
                <ul className="space-y-1 text-xs text-zinc-400 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 list-disc list-inside">
                  {masterProfile.experience[0].bullets.slice(0, 3).map((b, idx) => (
                    <li key={idx} className="line-clamp-2">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT: TAILORED CV (TARGETED) */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/20 to-zinc-950 border border-indigo-500/30 space-y-4 shadow-lg shadow-indigo-950/20">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Tailored CV ({tailoredProfile.company})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                {tailoredProfile.analysis.matchPercentage}% Match
              </span>
            </div>

            {/* Tailored Headline */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Tailored Headline
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  ✓ Matched to Role Title
                </span>
              </div>
              <p className="text-xs font-semibold text-indigo-100 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                {tailored.personalInfo.headline}
              </p>
            </div>

            {/* Tailored Summary */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Tailored Summary
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  ✓ Contextualized for {tailoredProfile.company}
                </span>
              </div>
              <p className="text-xs text-indigo-200 leading-relaxed p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                {tailored.personalInfo.summary}
              </p>
            </div>

            {/* Re-Ranked Skills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Re-Ranked Skills (JD Match Priority)
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  ✓ Target Tech Moved First
                </span>
              </div>
              <div className="flex flex-wrap gap-1 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                {[...tailored.skills.languages, ...tailored.skills.frameworks]
                  .slice(0, 8)
                  .map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-600/30 text-indigo-200 border border-indigo-500/40"
                    >
                      {s}
                    </span>
                  ))}
              </div>
            </div>

            {/* Prioritized Experience Bullets */}
            {tailored.experience[0] && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Re-Ranked Role Bullets
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    ✓ High-Relevance Achievements Promoted
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-indigo-200 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 list-disc list-inside">
                  {tailored.experience[0].bullets.slice(0, 3).map((b, idx) => (
                    <li key={idx} className="line-clamp-2">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: TAILORED ATS DOCUMENT PREVIEW */}
      {viewMode === 'tailoredDocument' && (
        <div className="overflow-x-auto flex justify-center py-4 bg-zinc-950/80 rounded-2xl border border-zinc-800">
          <div
            id="tailored-ats-resume-sheet"
            className="w-full max-w-[850px] bg-white text-zinc-900 p-8 sm:p-12 shadow-2xl rounded-sm font-serif leading-normal select-text"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header */}
            <div className="text-center pb-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-normal uppercase text-black">
                {tailored.personalInfo.fullName}
              </h1>
              <p className="text-[12px] font-sans text-zinc-700 font-semibold tracking-wide uppercase mt-1">
                {tailored.personalInfo.headline}
              </p>
              <div className="text-[11px] font-sans text-zinc-700 mt-1.5 flex flex-wrap items-center justify-center gap-2">
                <span>{tailored.personalInfo.location}</span>
                <span>•</span>
                <span>{tailored.personalInfo.phone}</span>
                <span>•</span>
                <span>{tailored.personalInfo.email}</span>
                <span>•</span>
                <span>{tailored.personalInfo.github?.replace(/^https?:\/\//, '')}</span>
                <span>•</span>
                <span>{tailored.personalInfo.linkedin?.replace(/^https?:\/\//, '')}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-3">
              <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                Professional Summary
              </h2>
              <p className="text-[12px] text-zinc-800 leading-relaxed mt-1 text-justify">
                {tailored.personalInfo.summary}
              </p>
            </div>

            {/* Experience */}
            <div className="mt-4">
              <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                Experience
              </h2>
              <div className="space-y-3 mt-1.5">
                {tailored.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-black">{exp.role}</span>
                      <span className="text-[11px] font-sans text-zinc-700">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs italic text-zinc-800">
                      <span>{exp.company}</span>
                      <span className="not-italic text-[11px] font-sans text-zinc-700">
                        {exp.location}
                      </span>
                    </div>
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-[12px] text-zinc-800 leading-snug">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="pl-0.5 text-justify">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="mt-4">
              <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                Projects & Technical Initiatives
              </h2>
              <div className="space-y-2 mt-1.5">
                {tailored.projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="font-bold text-black">{proj.title}</span>
                        <span className="font-sans text-[11px] text-zinc-700 ml-1.5 font-normal">
                          | {proj.techStack.join(', ')}
                        </span>
                      </div>
                      <span className="text-[11px] font-sans text-zinc-700">
                        {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                      </span>
                    </div>
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-[12px] text-zinc-800 leading-snug">
                      {proj.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="pl-0.5 text-justify">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4">
              <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                Technical Skills
              </h2>
              <div className="mt-1.5 space-y-1 text-xs">
                <div className="flex leading-snug">
                  <span className="font-sans font-bold w-40 text-black shrink-0">
                    Languages:
                  </span>
                  <span className="text-zinc-800">{tailored.skills.languages.join(', ')}</span>
                </div>
                <div className="flex leading-snug">
                  <span className="font-sans font-bold w-40 text-black shrink-0">
                    Frameworks & Libraries:
                  </span>
                  <span className="text-zinc-800">{tailored.skills.frameworks.join(', ')}</span>
                </div>
                <div className="flex leading-snug">
                  <span className="font-sans font-bold w-40 text-black shrink-0">
                    Databases:
                  </span>
                  <span className="text-zinc-800">{tailored.skills.databases.join(', ')}</span>
                </div>
                <div className="flex leading-snug">
                  <span className="font-sans font-bold w-40 text-black shrink-0">
                    DevOps & Cloud:
                  </span>
                  <span className="text-zinc-800">{tailored.skills.devopsAndCloud.join(', ')}</span>
                </div>
                <div className="flex leading-snug">
                  <span className="font-sans font-bold w-40 text-black shrink-0">
                    Architecture & Concepts:
                  </span>
                  <span className="text-zinc-800">{tailored.skills.toolsAndConcepts.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
