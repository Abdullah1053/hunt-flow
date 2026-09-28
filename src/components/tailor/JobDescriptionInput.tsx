'use client';

import React, { useState } from 'react';
import { JobDescriptionData } from '@/types/tailoring';
import { SAMPLE_JOB_POSTINGS, extractJdKeywords } from '@/lib/tailoringEngine/jdAnalyzer';
import {
  Briefcase,
  Building,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Plus,
} from 'lucide-react';

interface JobDescriptionInputProps {
  currentJd: JobDescriptionData;
  onSelectJd: (jd: JobDescriptionData) => void;
  isLoading?: boolean;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  currentJd,
  onSelectJd,
  isLoading,
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [jobTitle, setJobTitle] = useState(currentJd.jobTitle);
  const [company, setCompany] = useState(currentJd.company);
  const [location, setLocation] = useState(currentJd.location);
  const [workType, setWorkType] = useState<JobDescriptionData['workType']>(currentJd.workType);
  const [rawText, setRawText] = useState(currentJd.rawText);

  // Handle sample selection
  const handleSelectSample = (sample: JobDescriptionData) => {
    setIsCustomMode(false);
    setJobTitle(sample.jobTitle);
    setCompany(sample.company);
    setLocation(sample.location);
    setWorkType(sample.workType);
    setRawText(sample.rawText);
    onSelectJd(sample);
  };

  // Handle custom JD analysis
  const handleApplyCustomJd = () => {
    const extractedKeywords = extractJdKeywords(rawText);
    const customJd: JobDescriptionData = {
      id: `custom_jd_${Date.now()}`,
      jobTitle: jobTitle || 'Software Engineer',
      company: company || 'Target Company',
      location: location || 'Remote',
      workType,
      rawText,
      extractedKeywords,
      addedAt: new Date().toISOString(),
    };
    onSelectJd(customJd);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-400" />
            Target Job Description (JD)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select a verified real-world job posting or paste your own to analyze match gaps and tailor your CV.
          </p>
        </div>

        {/* Custom Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCustomMode(!isCustomMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isCustomMode
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            {isCustomMode ? 'Using Custom JD' : 'Paste Custom JD'}
          </button>
        </div>
      </div>

      {/* Preset Real-World Job Samples */}
      {!isCustomMode && (
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Quick-Select Verified Real-World Postings:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_JOB_POSTINGS.map((sample) => {
              const isSelected = currentJd.id === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-400">
                        {sample.company}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">
                      {sample.jobTitle}
                    </h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-2">
                      Must-haves: {sample.extractedKeywords.mustHaveSkills.slice(0, 4).join(', ')}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="capitalize">{sample.workType}</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {sample.extractedKeywords.seniority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom JD Input Fields */}
      {isCustomMode && (
        <div className="space-y-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-300">
                Target Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, Doing Platform"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-300">
                Location & Policy
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote / Sanaa"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as any)}
                  className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-300">
              Raw Job Posting Content
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the requirements, responsibilities, and qualifications from the job posting..."
              className="w-full mt-1 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleApplyCustomJd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyze Custom Job Posting
            </button>
          </div>
        </div>
      )}

      {/* Extracted Keywords Summary */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Detected JD Requirements for: <strong className="text-zinc-100">{currentJd.jobTitle}</strong>
          </span>
          <span className="text-[11px] text-zinc-500">
            {currentJd.extractedKeywords.detectedTools.length} total keywords identified
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-400 w-24 shrink-0">
              Must-Haves:
            </span>
            {currentJd.extractedKeywords.mustHaveSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
              >
                {skill}
              </span>
            ))}
          </div>

          {currentJd.extractedKeywords.niceToHaveSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-400 w-24 shrink-0">
                Nice-To-Have:
              </span>
              {currentJd.extractedKeywords.niceToHaveSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
