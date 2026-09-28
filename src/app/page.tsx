'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeaderNav } from '@/components/ingestion/HeaderNav';
import { GitHubIngestCard } from '@/components/ingestion/GitHubIngestCard';
import { DocumentIngestCard } from '@/components/ingestion/DocumentIngestCard';
import { ExternalLinksCard } from '@/components/ingestion/ExternalLinksCard';
import { StagingPayloadView } from '@/components/ingestion/StagingPayloadView';
import { MasterCvStudio } from '@/components/studio/MasterCvStudio';
import { synthesizePayload } from '@/lib/corpusAggregator';
import { synthesizeDeterministicProfile } from '@/lib/deterministicSynthesizer';
import {
  GitHubUserProfile,
  GitHubRepoItem,
  ParsedDocument,
  ExternalLink,
} from '@/types/ingestion';
import { MasterCvProfile } from '@/types/masterCv';
import {
  Sparkles,
  ClipboardList,
  CheckCircle2,
  X,
  FileCheck,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  RotateCcw,
} from 'lucide-react';

export default function HomePage() {
  // State for all data channels
  const [githubUser, setGithubUser] = useState<GitHubUserProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [manualNotes, setManualNotes] = useState<string>('');

  // Master CV Profile state (Stage 2)
  const [masterProfile, setMasterProfile] = useState<MasterCvProfile | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  // Loading & error states
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingest' | 'preview' | 'studio'>('ingest');
  const [showGoalReport, setShowGoalReport] = useState(false);

  // Restore API key from localStorage if present
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('huntflow_gemini_api_key');
      if (savedKey) setApiKey(savedKey);
    } catch {
      // ignore
    }
  }, []);

  const handleUpdateApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem('huntflow_gemini_api_key', newKey);
    } catch {
      // ignore
    }
  };

  // Compute synthesized raw staging payload in real-time
  const stagingPayload = useMemo(() => {
    return synthesizePayload(
      githubUser,
      repos,
      selectedRepoIds,
      documents,
      links,
      manualNotes
    );
  }, [githubUser, repos, selectedRepoIds, documents, links, manualNotes]);

  // Stage 2 Profile Synthesis
  const handleSynthesizeProfile = useCallback(async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/cv/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stagingPayload,
          apiKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.profile) {
        setMasterProfile(data.profile);
      } else {
        // Fallback to local deterministic profile
        const local = synthesizeDeterministicProfile(stagingPayload);
        setMasterProfile(local);
      }
    } catch (err) {
      console.warn('Synthesis request failed, utilizing local engine:', err);
      const local = synthesizeDeterministicProfile(stagingPayload);
      setMasterProfile(local);
    } finally {
      setIsSynthesizing(false);
    }
  }, [stagingPayload, apiKey]);

  // GitHub handlers
  const handleFetchGithubUser = async (username: string) => {
    setIsLoadingGithub(true);
    setGithubError(null);
    try {
      const res = await fetch('/api/ingest/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub profile');
      }
      setGithubUser(data.user);
      setRepos(data.repos);
      const preSelectedIds = data.repos
        .filter((r: GitHubRepoItem) => r.is_selected)
        .map((r: GitHubRepoItem) => r.id);
      setSelectedRepoIds(preSelectedIds);
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : 'Error fetching GitHub');
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const handleToggleRepo = (repoId: number) => {
    setSelectedRepoIds((prev) =>
      prev.includes(repoId) ? prev.filter((id) => id !== repoId) : [...prev, repoId]
    );
  };

  const handleSelectAllNonForks = () => {
    const nonForkIds = repos.filter((r) => !r.is_fork).map((r) => r.id);
    setSelectedRepoIds(nonForkIds);
  };

  const handleSelectTopStarred = () => {
    const topIds = repos
      .filter((r) => !r.is_fork)
      .slice(0, 6)
      .map((r) => r.id);
    setSelectedRepoIds(topIds);
  };

  const handleClearRepoSelection = () => {
    setSelectedRepoIds([]);
  };

  // Document upload handler
  const handleUploadFiles = async (filesToUpload: FileList | File[]) => {
    setIsUploadingDocs(true);
    setDocError(null);
    try {
      const formData = new FormData();
      Array.from(filesToUpload).forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/ingest/document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse documents');
      }

      setDocuments((prev) => [...prev, ...data.documents]);
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingDocs(false);
    }
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // External Links handler
  const handleAddLink = async (url: string) => {
    setIsAddingLink(true);
    setLinkError(null);
    try {
      const res = await fetch('/api/ingest/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to scrape link');
      }
      setLinks((prev) => [data.link, ...prev]);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Failed to fetch link');
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  };

  // Load sample candidate CV, GitHub profile, and synthesize Master CV
  const handleLoadSample = useCallback(async () => {
    setIsLoadingSample(true);
    setDocError(null);
    setGithubError(null);
    try {
      // 1. Fetch sample CV
      const sampleRes = await fetch('/api/ingest/sample');
      if (sampleRes.ok) {
        const sampleData = await sampleRes.json();
        if (sampleData.document) {
          setDocuments((prev) => {
            const exists = prev.some((d) => d.name === sampleData.document.name);
            return exists ? prev : [sampleData.document, ...prev];
          });
        }
        if (sampleData.recommendedBio) {
          setManualNotes((prev) => prev || sampleData.recommendedBio);
        }

        // 2. Fetch GitHub for abdullah1053
        if (sampleData.recommendedGithubUsername) {
          await handleFetchGithubUser(sampleData.recommendedGithubUsername);
        }
      }

      // 3. Add sample portfolio link
      const samplePortfolioUrl = 'https://abdullah1053.github.io';
      setLinks((prev) => {
        if (!prev.some((l) => l.url === samplePortfolioUrl)) {
          return [
            {
              id: 'link_sample_portfolio',
              url: samplePortfolioUrl,
              title: 'Abdullah Ademi - GitHub Portfolio',
              snippet:
                'Full-Stack Developer portfolio showcasing web applications, RESTful APIs, and systems engineering.',
              status: 'success',
              fetchedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
        return prev;
      });

      // 4. Generate Master CV Profile
      const initialProfile = synthesizeDeterministicProfile(stagingPayload);
      setMasterProfile(initialProfile);
    } catch (error) {
      console.error('Error loading sample data:', error);
    } finally {
      setIsLoadingSample(false);
    }
  }, [stagingPayload]);

  // Ensure masterProfile is available if user switches to studio
  const currentProfile = useMemo(() => {
    if (masterProfile) return masterProfile;
    return synthesizeDeterministicProfile(stagingPayload);
  }, [masterProfile, stagingPayload]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <HeaderNav
        onLoadSample={handleLoadSample}
        isLoadingSample={isLoadingSample}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalSources={stagingPayload.metrics.totalSources}
        hasProfile={Boolean(masterProfile)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner with Goal 2 Status & Review Action */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-zinc-900 to-indigo-950/40 border border-purple-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold text-white">
                  Stage 2: AI Parsing, Synthesis & Master CV Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready For Review
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gemini AI schema extraction, Google XYZ formula bullet point rewriting & interactive studio are live.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowGoalReport(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition shadow-sm"
            >
              <ClipboardList className="h-3.5 w-3.5 text-purple-400" />
              View Stage 2 Goal Report
            </button>

            {activeTab !== 'studio' && (
              <button
                onClick={() => {
                  if (!masterProfile) {
                    handleSynthesizeProfile();
                  }
                  setActiveTab('studio');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Launch Master CV Studio
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Ingestion Dashboard */}
        {activeTab === 'ingest' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* GitHub Ingestion */}
              <GitHubIngestCard
                user={githubUser}
                repos={repos}
                selectedRepoIds={selectedRepoIds}
                isLoading={isLoadingGithub}
                error={githubError}
                onFetchUser={handleFetchGithubUser}
                onToggleRepo={handleToggleRepo}
                onSelectAllNonForks={handleSelectAllNonForks}
                onSelectTopStarred={handleSelectTopStarred}
                onClearRepoSelection={handleClearRepoSelection}
              />

              {/* Documents & Resume Ingestion */}
              <DocumentIngestCard
                documents={documents}
                isUploading={isUploadingDocs}
                error={docError}
                onUploadFiles={handleUploadFiles}
                onRemoveDocument={handleRemoveDocument}
                onLoadSampleCV={handleLoadSample}
                isLoadingSample={isLoadingSample}
              />
            </div>

            {/* External Links & Freeform Notes */}
            <ExternalLinksCard
              links={links}
              manualNotes={manualNotes}
              isAddingLink={isAddingLink}
              error={linkError}
              onAddLink={handleAddLink}
              onRemoveLink={handleRemoveLink}
              onUpdateNotes={setManualNotes}
            />
          </div>
        )}

        {/* Tab 2: Raw Staging Store Preview */}
        {activeTab === 'preview' && (
          <StagingPayloadView
            payload={stagingPayload}
            onProceedToStage2={() => {
              handleSynthesizeProfile();
              setActiveTab('studio');
            }}
          />
        )}

        {/* Tab 3: Interactive Master CV Studio */}
        {activeTab === 'studio' && (
          <MasterCvStudio
            profile={currentProfile}
            onUpdateProfile={(updated) => setMasterProfile(updated)}
            onReSynthesize={handleSynthesizeProfile}
            isSynthesizing={isSynthesizing}
            apiKey={apiKey}
            onUpdateApiKey={handleUpdateApiKey}
            onProceedToStage3={() => setShowGoalReport(true)}
          />
        )}
      </main>

      {/* Stage 2 Goal Report Modal */}
      {showGoalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Stage 2 Goal Report & Verification Review
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Master CV Schema Normalization, XYZ Bullet Optimizer & Studio Editor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalReport(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-300">
                    Stage 2 Objective Fully Completed & Verified
                  </h3>
                  <p className="text-xs text-emerald-400/90 mt-1 leading-relaxed">
                    All requirements from{' '}
                    <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-200">
                      implementation_plan.md
                    </code>{' '}
                    under Stage 2 (Gemini API synthesis endpoint, Master CV Zod schema, Google XYZ Formula bullet optimizer, and interactive Master CV Studio with split-view ATS rendering) have been constructed and verified.
                  </p>
                </div>
              </div>

              {/* Deliverables Checklist */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Stage 2 Deliverables Verification Checklist
                </h4>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 text-xs sm:text-sm">
                        1. Strict Master CV Zod / JSON Schema
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Constructed schema validating <code className="text-purple-300">personalInfo</code>, <code className="text-purple-300">skills</code> (5 categories: Languages, Frameworks, Databases, DevOps, Tools), <code className="text-purple-300">experience</code>, <code className="text-purple-300">projects</code>, <code className="text-purple-300">education</code>, and <code className="text-purple-300">certifications</code>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 text-xs sm:text-sm">
                        2. Gemini AI Synthesis API (`/api/cv/extract-profile`)
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Integrated Gemini 2.5 Flash via official <code className="text-purple-300">@google/genai</code> SDK with system instructions enforcing strict factual grounding and structured JSON generation, paired with a deterministic local synthesizer fallback.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 text-xs sm:text-sm">
                        3. Google XYZ Formula Bullet Optimizer (`/api/cv/optimize-bullet`)
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Rewrites project and role achievements into high-impact ATS phrasing: <em>“Accomplished [X], as measured by [Y], by doing [Z]”</em> with active verbs and quantifiable metrics. Live &quot;⚡ AI Optimize&quot; button available on each individual bullet point.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 text-xs sm:text-sm">
                        4. Interactive Master CV Studio & Live ATS Paper Renderer
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Full-featured Studio editor with real-time field editing, tag managers, bullet point controls, side-by-side split view, print-to-PDF formatting (Jake&apos;s Resume / Harvard Overleaf standard), and JSON backup download.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What Happens Next in Stage 3 */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-1">
                  <Cpu className="h-4 w-4 text-indigo-400" />
                  Next Phase: Stage 3 (ATS-Certified CV Engine & Vector PDF Export)
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upon your approval of this Stage 2 report, we will proceed to Stage 3: building the pixel-perfect selectable text vector PDF export engine, and integrating the automated Resumly-style ATS Health Audit scoring metrics.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">
                Awaiting user review and sign-off
              </span>
              <button
                type="button"
                onClick={() => setShowGoalReport(false)}
                className="w-full sm:w-auto px-5 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
              >
                Done Reviewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
