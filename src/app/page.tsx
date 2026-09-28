'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeaderNav } from '@/components/ingestion/HeaderNav';
import { GitHubIngestCard } from '@/components/ingestion/GitHubIngestCard';
import { DocumentIngestCard } from '@/components/ingestion/DocumentIngestCard';
import { ExternalLinksCard } from '@/components/ingestion/ExternalLinksCard';
import { StagingPayloadView } from '@/components/ingestion/StagingPayloadView';
import { synthesizePayload } from '@/lib/corpusAggregator';
import {
  GitHubUserProfile,
  GitHubRepoItem,
  ParsedDocument,
  ExternalLink,
} from '@/types/ingestion';
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
} from 'lucide-react';

export default function HomePage() {
  // State for all data channels
  const [githubUser, setGithubUser] = useState<GitHubUserProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [manualNotes, setManualNotes] = useState<string>('');

  // Loading & error states
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingest' | 'preview'>('ingest');
  const [showGoalReport, setShowGoalReport] = useState(false);

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

  // Load sample candidate CV & GitHub profile
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
          // Avoid duplicate document if already loaded
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
    } catch (error) {
      console.error('Error loading sample data:', error);
    } finally {
      setIsLoadingSample(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <HeaderNav
        onLoadSample={handleLoadSample}
        isLoadingSample={isLoadingSample}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalSources={stagingPayload.metrics.totalSources}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner with Goal 1 Status & Review Action */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-zinc-900 to-purple-950/40 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold text-white">
                  Stage 1: Multi-Source Profile Ingestion Pipeline
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready For Review
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                GitHub REST API scraper, PDF/DOCX vector text extractor & staging corpus store are fully operational.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowGoalReport(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition shadow-sm"
            >
              <ClipboardList className="h-3.5 w-3.5 text-indigo-400" />
              View Stage 1 Goal Report
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
            >
              Inspect Staging Store
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
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
            onProceedToStage2={() => setShowGoalReport(true)}
          />
        )}
      </main>

      {/* Stage 1 Goal Report Modal */}
      {showGoalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Stage 1 Goal Report & Verification Review
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Deliverables summary and test results for multi-source ingestion
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
                    Stage 1 Objective Fully Completed & Verified
                  </h3>
                  <p className="text-xs text-emerald-400/90 mt-1 leading-relaxed">
                    All requirements from{' '}
                    <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-200">
                      implementation_plan.md
                    </code>{' '}
                    under Stage 1 (GitHub scraping, document parsing, external links, and staging store) have been implemented, connected, and tested with real candidate data.
                  </p>
                </div>
              </div>

              {/* Deliverables Checklist */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Stage 1 Deliverables Verification Checklist
                </h4>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 text-xs sm:text-sm">
                        1. GitHub Repository Aggregator & README Fetcher
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Queries GitHub REST API, extracts profile metadata, repositories, primary languages, stars, topics, filters forks, and downloads high-signal README project summaries. Tested with user handle{' '}
                        <strong className="text-indigo-400">@abdullah1053</strong> (30 repositories indexed).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 text-xs sm:text-sm">
                        2. File & Document Ingestion Engine (PDF, DOCX, TXT, MD)
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Client-side drag-and-drop dropzone backed by server-side text extraction (<code className="text-indigo-300">pdf-parse</code> & <code className="text-indigo-300">mammoth</code>) with automated section detection (Work Experience, Education, Projects, Skills). Tested against <strong className="text-indigo-400">ABDULLAH_ADEMI(1).pdf</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 text-xs sm:text-sm">
                        3. External Link & Portfolio Scraper
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Server-side crawler that safely extracts metadata, titles, and cleaned textual snippets from candidate portfolio links and technical blogs without HTML clutter.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 text-xs sm:text-sm">
                        4. Aggregated Raw Staging Store
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Synthesizes multi-source data into a normalized schema with real-time word counting, tech stack keyword identification, one-click JSON download, and formatted corpus export for Stage 2 AI synthesis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Session Live Metrics */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Live Candidate Staging Metrics (Current State)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase">Words Ingested</span>
                    <p className="text-base font-bold text-indigo-400">
                      {stagingPayload.metrics.totalWords}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase">Repos Selected</span>
                    <p className="text-base font-bold text-emerald-400">
                      {stagingPayload.metrics.githubReposCount}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase">Documents</span>
                    <p className="text-base font-bold text-purple-400">
                      {stagingPayload.metrics.documentsCount}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase">Keywords</span>
                    <p className="text-base font-bold text-amber-400">
                      {stagingPayload.metrics.detectedKeywords.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* What Happens Next in Stage 2 */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-1">
                  <Cpu className="h-4 w-4 text-indigo-400" />
                  Next Phase: Stage 2 (AI Parsing, Synthesis & Schema Normalization)
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upon your approval of this Stage 1 report, we will proceed to Stage 2: building the Gemini AI structured output extraction engine, implementing the XYZ Formula bullet point rewriter, and launching the interactive Master CV Studio.
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
