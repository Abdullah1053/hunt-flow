'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { HeaderNav } from '@/components/ingestion/HeaderNav';
import { MasterCvStudio } from '@/components/studio/MasterCvStudio';
import { PipelineView } from '@/components/pipeline/PipelineView';
import { CareerTrackView } from '@/components/career/CareerTrackView';
import { GitHubIngestCard } from '@/components/ingestion/GitHubIngestCard';
import { DocumentIngestCard } from '@/components/ingestion/DocumentIngestCard';
import { ExternalLinksCard } from '@/components/ingestion/ExternalLinksCard';
import { synthesizePayload } from '@/lib/corpusAggregator';
import { synthesizeDeterministicProfile, getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';
import { useHistoryState } from '@/lib/hooks/useHistoryState';
import { AiProviderConfig, DEFAULT_AI_CONFIG } from '@/types/aiConfig';
import {
  GitHubUserProfile,
  GitHubRepoItem,
  ParsedDocument,
  ExternalLink,
} from '@/types/ingestion';
import { MasterCvProfile } from '@/types/masterCv';
import { X, Sparkles, UploadCloud } from 'lucide-react';

export default function HomePage() {
  // Main 3-tab navigation: 'builder' | 'career' | 'archive'
  const [activeTab, setActiveTab] = useState<'builder' | 'career' | 'archive'>('builder');

  // Master CV Profile state managed with Undo / Redo history
  const history = useHistoryState<MasterCvProfile>(getDefaultMasterProfile(), {
    maxHistory: 50,
    debounceMs: 400,
  });
  const currentProfile = history.state;

  const [apiKey, setApiKey] = useState<string>('');
  const [aiConfig, setAiConfig] = useState<AiProviderConfig>(DEFAULT_AI_CONFIG);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('saved');
  const isInitialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ingestion data channels (collapsible drawer/modal)
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [githubUser, setGithubUser] = useState<GitHubUserProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [manualNotes, setManualNotes] = useState<string>('');

  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Restore AI Config, API key, and Master Profile from SQLite (with localStorage fallback)
  useEffect(() => {
    // 1. Restore AI Configuration
    async function loadAiConfig() {
      try {
        const res = await fetch('/api/db/settings?key=ai_config');
        if (res.ok) {
          const data = await res.json();
          if (data?.value?.providerType) {
            setAiConfig(data.value);
            setApiKey(data.value.apiKey || '');
            try {
              localStorage.setItem('huntflow_ai_config', JSON.stringify(data.value));
            } catch {}
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load AI config from SQLite:', e);
      }

      try {
        const localAiConfig = localStorage.getItem('huntflow_ai_config');
        if (localAiConfig) {
          const parsed = JSON.parse(localAiConfig);
          if (parsed?.providerType) {
            setAiConfig(parsed);
            setApiKey(parsed.apiKey || '');
            return;
          }
        }
        const savedKey = localStorage.getItem('huntflow_gemini_api_key');
        if (savedKey) {
          setApiKey(savedKey);
          setAiConfig((prev) => ({ ...prev, apiKey: savedKey }));
        }
      } catch {}
    }

    loadAiConfig();

    async function loadMasterProfile() {
      try {
        const res = await fetch('/api/db/profile');
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.personalInfo?.fullName) {
            history.reset(data.profile);
            try {
              localStorage.setItem('huntflow_master_profile', JSON.stringify(data.profile));
            } catch {}
            isInitialLoadRef.current = false;
            return;
          }
        }
      } catch (e) {
        console.warn('SQLite fetch failed, falling back to localStorage:', e);
      }

      // Fallback to localStorage if API route had an issue
      try {
        const savedProfile = localStorage.getItem('huntflow_master_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed?.personalInfo?.fullName) {
            history.reset(parsed);
            isInitialLoadRef.current = false;
            return;
          }
        }
      } catch {}

      history.reset(getDefaultMasterProfile());
      isInitialLoadRef.current = false;
    }

    loadMasterProfile();
  }, []);

  // Debounced Auto-Save to SQLite Database
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/db/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: currentProfile }),
        });
        if (res.ok) {
          setSaveStatus('saved');
          try {
            localStorage.setItem('huntflow_master_profile', JSON.stringify(currentProfile));
          } catch {}
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        console.error('Failed to auto-save profile to SQLite:', err);
        setSaveStatus('error');
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentProfile]);

  const handleUpdateApiKey = (newKey: string) => {
    setApiKey(newKey);
    setAiConfig((prev) => ({ ...prev, apiKey: newKey }));
    try {
      localStorage.setItem('huntflow_gemini_api_key', newKey);
    } catch {}
  };

  const handleUpdateAiConfig = (newConfig: AiProviderConfig) => {
    setAiConfig(newConfig);
    setApiKey(newConfig.apiKey || '');
    try {
      localStorage.setItem('huntflow_ai_config', JSON.stringify(newConfig));
      localStorage.setItem('huntflow_gemini_api_key', newConfig.apiKey || '');
    } catch {}
  };

  const handleUpdateMasterProfile = (updated: MasterCvProfile, isDiscrete?: boolean) => {
    history.set(updated, isDiscrete);
  };

  // Staging payload from ingested data
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

  // Profile synthesis from sources
  const handleSynthesizeProfile = useCallback(async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/cv/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stagingPayload,
          aiConfig,
          apiKey: aiConfig?.apiKey || apiKey,
        }),
      });

      const data = await res.json();
      let profileToSet: MasterCvProfile;
      if (res.ok && data.profile) {
        profileToSet = data.profile;
      } else {
        profileToSet = synthesizeDeterministicProfile(stagingPayload);
      }
      history.set(profileToSet, true);
    } catch (err) {
      console.warn('Synthesis request failed, utilizing local engine:', err);
      const local = synthesizeDeterministicProfile(stagingPayload);
      history.set(local, true);
    } finally {
      setIsSynthesizing(false);
      setShowImportDrawer(false);
    }
  }, [stagingPayload, aiConfig, apiKey, history]);

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

  // Documents handler
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

  // Links handler
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

  // Demo sample loader
  const handleLoadSample = useCallback(async () => {
    setIsLoadingSample(true);
    try {
      const sampleRes = await fetch('/api/ingest/sample');
      if (sampleRes.ok) {
        const sampleData = await sampleRes.json();
        const initialProfile = sampleData.profile || getDefaultMasterProfile();
        history.set(initialProfile, true);
      }
    } catch (error) {
      console.error('Error loading sample data:', error);
    } finally {
      setIsLoadingSample(false);
    }
  }, [history]);

  // 1-Click Header Download ATS PDF
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch('/api/cv/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: currentProfile }),
      });

      if (!res.ok) throw new Error('Failed to generate PDF document');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (currentProfile.personalInfo.fullName || 'Candidate').replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );
      a.download = `${safeName}_ATS_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Error generating PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Load an application's tailored CV snapshot directly into CV Builder
  const handleLoadCvInStudio = (snapshot: MasterCvProfile) => {
    history.reset(snapshot);
    setActiveTab('builder');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 2-Tab Top Header Navigation with prominent Download ATS PDF button */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
        onOpenImport={() => setShowImportDrawer(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
        {/* TAB 1: CV Builder */}
        {activeTab === 'builder' && (
          <MasterCvStudio
            profile={currentProfile}
            onUpdateProfile={handleUpdateMasterProfile}
            onReSynthesize={handleSynthesizeProfile}
            isSynthesizing={isSynthesizing}
            apiKey={apiKey}
            onUpdateApiKey={handleUpdateApiKey}
            aiConfig={aiConfig}
            onUpdateAiConfig={handleUpdateAiConfig}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            onUndo={history.undo}
            onRedo={history.redo}
            saveStatus={saveStatus}
          />
        )}

        {/* TAB 2: Career Track Vault */}
        {activeTab === 'career' && (
          <CareerTrackView
            masterProfile={currentProfile}
            onUpdateMasterProfile={handleUpdateMasterProfile}
            aiConfig={aiConfig}
            onNavigateToStudio={() => setActiveTab('builder')}
          />
        )}

        {/* TAB 3: Job Archive */}
        {activeTab === 'archive' && (
          <PipelineView
            masterProfile={currentProfile}
            onLoadCvInStudio={handleLoadCvInStudio}
          />
        )}
      </main>

      {/* Optional Collapsible Import Drawer (Kept completely out of the main way) */}
      {showImportDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Import External Sources</h3>
                  <p className="text-xs text-zinc-400">
                    Optionally ingest your GitHub repositories, existing resume files, or portfolio links
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportDrawer(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {stagingPayload.metrics.totalSources} sources staged
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowImportDrawer(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSynthesizeProfile}
                  disabled={isSynthesizing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  {isSynthesizing ? 'Synthesizing CV...' : 'Update CV from Sources'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
