'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wand2,
  FileText,
  Briefcase,
  Upload,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  ShieldCheck,
  Eye,
  Settings,
} from 'lucide-react';
import { MasterCvProfile } from '@/types/masterCv';
import { JobApplicationRecord } from '@/types/pipeline';
import { CareerBullet } from '@/types/careerTrack';
import { AiProviderConfig } from '@/types/aiConfig';
import { synthesizePayload } from '@/lib/corpusAggregator';
import {
  DEFAULT_TAILOR_PROMPT_INSTRUCTIONS,
  assembleTailorPrompt,
} from '@/lib/tailoringEngine/tailorPrompt';

interface NewJobTailorWizardProps {
  currentMasterProfile: MasterCvProfile;
  aiConfig: AiProviderConfig;
  onTailorSuccess: (
    updatedProfile: MasterCvProfile,
    jobContext: { jobTitle: string; jobDescription: string }
  ) => void;
  onNavigateToCareerBase?: () => void;
  onOpenAiSettings?: () => void;
}

type BaseCvSourceType = 'master' | 'archive' | 'import';

export const NewJobTailorWizard: React.FC<NewJobTailorWizardProps> = ({
  currentMasterProfile,
  aiConfig,
  onTailorSuccess,
  onNavigateToCareerBase,
  onOpenAiSettings,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step A: Base CV selection
  const [sourceType, setSourceType] = useState<BaseCvSourceType>('master');
  const [archivedApps, setArchivedApps] = useState<JobApplicationRecord[]>([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>('');
  const [importedCv, setImportedCv] = useState<MasterCvProfile | null>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [isImportingFile, setIsImportingFile] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step B: Target Job Details
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userNotes, setUserNotes] = useState('');

  // Step C: Prompt & Execution
  const [customInstructions, setCustomInstructions] = useState(
    DEFAULT_TAILOR_PROMPT_INSTRUCTIONS
  );
  const [showInstructionsPanel, setShowInstructionsPanel] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [activeBullets, setActiveBullets] = useState<CareerBullet[]>([]);
  const [isLoadingBullets, setIsLoadingBullets] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Fetch archived applications (Step A) and active career bullets (Step C)
  useEffect(() => {
    async function loadData() {
      try {
        const [appsRes, bulletsRes] = await Promise.all([
          fetch('/api/db/applications'),
          fetch('/api/db/career-base'),
        ]);

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          if (Array.isArray(appsData?.applications)) {
            const withSnapshots = appsData.applications.filter(
              (a: JobApplicationRecord) => Boolean(a.tailoredCvSnapshot?.personalInfo)
            );
            setArchivedApps(withSnapshots);
            if (withSnapshots.length > 0) {
              setSelectedArchiveId(withSnapshots[0].id);
            }
          }
        }

        if (bulletsRes.ok) {
          const bulletsData = await bulletsRes.json();
          if (Array.isArray(bulletsData?.bullets)) {
            setActiveBullets(
              bulletsData.bullets.filter((b: CareerBullet) => b.isActiveForAi)
            );
          }
        }
      } catch (err) {
        console.error('Failed to load wizard data:', err);
      } finally {
        setIsLoadingBullets(false);
      }
    }
    loadData();
  }, []);

  const selectedBaseCv: MasterCvProfile | null = useMemo(() => {
    if (sourceType === 'master') return currentMasterProfile;
    if (sourceType === 'archive') {
      const found = archivedApps.find((a) => a.id === selectedArchiveId);
      return found?.tailoredCvSnapshot || null;
    }
    if (sourceType === 'import') return importedCv;
    return currentMasterProfile;
  }, [sourceType, currentMasterProfile, archivedApps, selectedArchiveId, importedCv]);

  const selectedBaseLabel = useMemo(() => {
    if (sourceType === 'master') {
      return `Current Master CV (${currentMasterProfile.personalInfo.fullName || 'Master'})`;
    }
    if (sourceType === 'archive') {
      const found = archivedApps.find((a) => a.id === selectedArchiveId);
      return found
        ? `${found.company} - ${found.jobTitle} (${found.appliedDate || 'Archived'})`
        : 'Archived Application CV';
    }
    return importedFileName ? `Imported: ${importedFileName}` : 'Uploaded CV Snapshot';
  }, [sourceType, currentMasterProfile, archivedApps, selectedArchiveId, importedFileName]);

  const assembledPromptPreview = useMemo(() => {
    if (!selectedBaseCv) return '';
    return assembleTailorPrompt({
      customInstructions,
      jobTitle: jobTitle || '[Target Job Title]',
      jobDescription: jobDescription || '[Target Job Description]',
      userNotes,
      activeBullets,
      baseCv: selectedBaseCv,
    });
  }, [selectedBaseCv, customInstructions, jobTitle, jobDescription, userNotes, activeBullets]);

  const handleImportSnapshotFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setSourceType('import');

    const lower = file.name.toLowerCase();
    if (lower.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (parsed?.personalInfo && parsed?.skills) {
            setImportedCv(parsed as MasterCvProfile);
            setImportedFileName(file.name);
          } else {
            setImportError('Invalid CV JSON structure. Expected personalInfo and skills.');
          }
        } catch (err: any) {
          setImportError('Failed to parse JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else if (lower.endsWith('.pdf')) {
      setIsImportingFile(true);
      try {
        const formData = new FormData();
        formData.append('files', file);
        const docRes = await fetch('/api/ingest/document', {
          method: 'POST',
          body: formData,
        });
        const docData = await docRes.json();
        if (!docRes.ok || !docData?.documents?.[0]) {
          throw new Error(docData?.error || 'Failed to read PDF file');
        }

        const stagingPayload = synthesizePayload(
          null,
          [],
          [],
          docData.documents,
          [],
          ''
        );

        const extractRes = await fetch('/api/cv/extract-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stagingPayload,
            aiConfig,
            apiKey: aiConfig.apiKey,
          }),
        });
        const extractData = await extractRes.json();
        if (!extractRes.ok || !extractData?.profile) {
          throw new Error(extractData?.error || 'Failed to extract CV from PDF');
        }

        setImportedCv(extractData.profile as MasterCvProfile);
        setImportedFileName(file.name);
      } catch (err: any) {
        setImportError(err.message || 'Failed to import PDF CV');
      } finally {
        setIsImportingFile(false);
      }
    } else {
      setImportError('Please select a .json or .pdf CV snapshot file.');
    }

    e.target.value = '';
  };

  const handleGenerateTailoredCv = async () => {
    if (!selectedBaseCv) {
      setGenerateError('Please select a valid Base CV in Step 1.');
      return;
    }
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setGenerateError('Target Job Title and Job Description are required.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/tailor/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseCv: selectedBaseCv,
          currentMasterProfile,
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
          userNotes: userNotes.trim(),
          customInstructions: customInstructions.trim(),
          aiConfig,
          apiKey: aiConfig.apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.updatedProfile) {
        throw new Error(data.error || 'Failed to generate tailored CV');
      }

      onTailorSuccess(data.updatedProfile as MasterCvProfile, {
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
      });
    } catch (err: any) {
      setGenerateError(err.message || 'Failed to tailor CV');
    } finally {
      setIsGenerating(false);
    }
  };

  const isLocalEndpoint =
    aiConfig.providerType === 'openai-compatible' &&
    (aiConfig.baseUrl?.includes('localhost') || aiConfig.baseUrl?.includes('127.0.0.1'));
  const hasClientKey = Boolean(aiConfig.apiKey?.trim()) || isLocalEndpoint;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & 4-Step Progress Indicator */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-indigo-400" />
              Tailor CV for New Job Application
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select a foundation CV, paste the job requirements, and tailor using your verified Career Knowledge Base.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-medium text-emerald-400 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            Contact & Social Info Locked
          </div>
        </div>

        {/* 4-Step Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { num: 1, label: '1. Select Base CV' },
            { num: 2, label: '2. Job & Notes' },
            { num: 3, label: '3. AI Tailoring' },
            { num: 4, label: '4. Studio Review' },
          ].map((item) => {
            const isActive = step === item.num;
            const isCompleted = step > item.num;
            const isClickable = item.num <= 3 && (item.num === 1 || (item.num === 2 && Boolean(selectedBaseCv)) || (item.num === 3 && Boolean(selectedBaseCv && jobTitle.trim() && jobDescription.trim())));

            return (
              <button
                key={item.num}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (item.num <= 3 && isClickable) {
                    setStep(item.num as 1 | 2 | 3);
                  }
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
                } disabled:cursor-default`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <span
                    className={`h-4 w-4 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.num}
                  </span>
                )}
                <span className="truncate">{item.label.replace(/^\d+\.\s/, '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Select Base CV Version */}
      {step === 1 && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white">Step A: Select Base CV Version</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choose which existing CV structure the AI will tailor as its starting foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Option 1: Current Master CV */}
            <button
              type="button"
              onClick={() => setSourceType('master')}
              className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
                sourceType === 'master'
                  ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">Current Master CV</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  {currentMasterProfile.personalInfo.fullName} — {currentMasterProfile.personalInfo.headline}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {currentMasterProfile.experience.length} roles • {currentMasterProfile.projects.length} projects •{' '}
                  {currentMasterProfile.education.length} education
                </p>
              </div>
            </button>

            {/* Option 2: Previously Archived Job Application CV */}
            <div
              onClick={() => {
                if (archivedApps.length > 0) setSourceType('archive');
              }}
              className={`p-4 rounded-2xl border text-left transition space-y-3 ${
                sourceType === 'archive'
                  ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
              } ${archivedApps.length === 0 ? 'opacity-60' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white">
                    Previously Archived Job Application CV
                  </span>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Start from a CV snapshot tailored for a past job application
                  </p>
                </div>
              </div>

              {archivedApps.length > 0 ? (
                <select
                  value={selectedArchiveId}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSourceType('archive');
                  }}
                  onChange={(e) => {
                    setSourceType('archive');
                    setSelectedArchiveId(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  {archivedApps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.company} - {app.jobTitle} ({app.appliedDate || 'Saved'})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[11px] text-zinc-500 pl-12">
                  No archived application snapshots found yet.
                </p>
              )}
            </div>

            {/* Option 3: Upload / Import JSON or PDF Snapshot */}
            <div
              onClick={() => setSourceType('import')}
              className={`p-4 rounded-2xl border text-left transition space-y-3 cursor-pointer ${
                sourceType === 'import'
                  ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white">
                      Upload / Import a CV JSON or PDF Snapshot
                    </span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Load an exported HuntFlow `.json` backup or extract structure from a `.pdf` resume
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isImportingFile}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition shrink-0"
                >
                  {isImportingFile ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 text-amber-400" />
                      Choose File
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.pdf,application/json,application/pdf"
                  onChange={handleImportSnapshotFile}
                  className="hidden"
                />
              </div>

              {importedCv && (
                <div className="ml-12 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    Loaded <strong>{importedFileName}</strong> ({importedCv.experience.length} roles,{' '}
                    {importedCv.projects.length} projects)
                  </span>
                </div>
              )}

              {importError && (
                <div className="ml-12 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              disabled={!selectedBaseCv || isImportingFile}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-40"
            >
              Continue to Job Details
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Enter Target Job Details & Custom Notes */}
      {step === 2 && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white">
              Step B: Target Job Details & Custom Notes
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Base CV: <span className="text-zinc-200 font-medium">{selectedBaseLabel}</span>
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. Target Job Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                Target Job Title *
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 2. Job Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                Job Description *
              </label>
              <textarea
                rows={8}
                required
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting requirements, responsibilities, and desired tech stack here..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* 3. Additional Instructions / Notes for AI */}
            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                Additional Instructions / Notes for AI
              </label>
              <textarea
                rows={2}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder='e.g. "Emphasize my AWS EC2/RDS and Laravel webhook work, keep projects to top 2"'
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Collapsible Customize AI Prompt Instructions */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowInstructionsPanel(!showInstructionsPanel)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/50 transition"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Customize AI Prompt Instructions
                </span>
                {showInstructionsPanel ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>

              {showInstructionsPanel && (
                <div className="p-4 pt-0 space-y-2.5 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-[11px] text-zinc-400">
                      System & Role Instructions (Schema output contract remains locked)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomInstructions(DEFAULT_TAILOR_PROMPT_INSTRUCTIONS)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset to Default
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              disabled={!jobTitle.trim() || !jobDescription.trim()}
              onClick={() => {
                setGenerateError(null);
                setStep(3);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-40"
            >
              Continue to AI Tailoring
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Universal AI Prompt Assembly & Execution */}
      {step === 3 && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white">
              Step C: Universal AI Prompt Assembly & Execution
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review the verified inputs and run AI tailoring. Personal contact & social links remain 100% locked.
            </p>
          </div>

          {/* Context Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Base CV Foundation
              </div>
              <div className="text-xs font-semibold text-zinc-100 truncate">
                {selectedBaseLabel}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Target Role
              </div>
              <div className="text-xs font-semibold text-indigo-300 truncate">{jobTitle}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Verified Fact Pool
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                  {isLoadingBullets ? 'Loading...' : `${activeBullets.length} Active Bullets`}
                </span>
                {onNavigateToCareerBase && (
                  <button
                    type="button"
                    onClick={onNavigateToCareerBase}
                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Edit Pool
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Provider Indicator */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-zinc-300">
                AI Model:{' '}
                <strong className="text-white font-mono">
                  {aiConfig.providerType === 'gemini' ? 'Gemini' : 'OpenAI-Compatible'} /{' '}
                  {aiConfig.model}
                </strong>
              </span>
              {!hasClientKey && (
                <span className="text-[11px] text-amber-400">
                  (No client key set — will use server env or require Settings)
                </span>
              )}
            </div>
            {onOpenAiSettings && (
              <button
                type="button"
                onClick={onOpenAiSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition self-start sm:self-auto"
              >
                <Settings className="h-3.5 w-3.5" />
                AI Settings
              </button>
            )}
          </div>

          {/* Collapsible Customize Prompt Instructions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInstructionsPanel(!showInstructionsPanel)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/50 transition"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Customize AI Prompt Instructions
              </span>
              {showInstructionsPanel ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>

            {showInstructionsPanel && (
              <div className="p-4 pt-0 space-y-2.5 border-t border-zinc-800/80">
                <div className="flex items-center justify-between pt-3">
                  <span className="text-[11px] text-zinc-400">
                    Editable Prompt Instructions (Locked JSON Schema Contract is appended automatically)
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomInstructions(DEFAULT_TAILOR_PROMPT_INSTRUCTIONS)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to Default
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Collapsible Assembled Prompt Inspector */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 transition"
            >
              <span className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-indigo-400" />
                Preview Assembled AI Prompt ({activeBullets.length} active bullets, contact info stripped)
              </span>
              {showPromptPreview ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>

            {showPromptPreview && (
              <pre className="p-4 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                {assembledPromptPreview}
              </pre>
            )}
          </div>

          {generateError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{generateError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateTailoredCv}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tailoring CV with AI...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate Tailored CV & Open in Builder
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

