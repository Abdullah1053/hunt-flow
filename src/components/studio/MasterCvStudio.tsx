'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  Settings,
  Columns,
  Key,
  X,
  FileText,
  Loader2,
  Undo2,
  Redo2,
  Database,
  Check,
  Bot,
  Globe,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Briefcase,
  Wand2,
} from 'lucide-react';
import { MasterCvProfile } from '@/types/masterCv';
import { AiProviderConfig, AI_PROVIDER_PRESETS, DEFAULT_AI_CONFIG } from '@/types/aiConfig';
import { PersonalInfoEditor } from './PersonalInfoEditor';
import { SkillsEditor } from './SkillsEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { EducationEditor } from './EducationEditor';
import { LiveAtsDocumentPreview } from './LiveAtsDocumentPreview';

export interface TailoredJobBannerContext {
  jobTitle: string;
  jobDescription: string;
  tailoredAt?: string;
}

interface MasterCvStudioProps {
  profile: MasterCvProfile;
  onUpdateProfile: (updated: MasterCvProfile, isDiscrete?: boolean) => void;
  onReSynthesize: () => void;
  isSynthesizing: boolean;
  apiKey?: string;
  onUpdateApiKey?: (key: string) => void;
  aiConfig?: AiProviderConfig;
  onUpdateAiConfig?: (config: AiProviderConfig) => void;
  onProceedToStage3?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  saveStatus?: 'saved' | 'saving' | 'error' | 'idle';
  tailoredJobContext?: TailoredJobBannerContext | null;
  onDismissTailorBanner?: () => void;
  onArchiveTailoredJob?: () => void;
  onNavigateToTailor?: () => void;
  openSettingsSignal?: number;
}

export const MasterCvStudio: React.FC<MasterCvStudioProps> = ({
  profile,
  onUpdateProfile,
  onReSynthesize,
  isSynthesizing,
  apiKey = '',
  onUpdateApiKey,
  aiConfig = DEFAULT_AI_CONFIG,
  onUpdateAiConfig,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  saveStatus = 'saved',
  tailoredJobContext = null,
  onDismissTailorBanner,
  onArchiveTailoredJob,
  onNavigateToTailor,
  openSettingsSignal = 0,
}) => {
  const [activeTab, setActiveTab] = useState<
    'personal' | 'skills' | 'experience' | 'projects' | 'education' | 'preview'
  >('personal');
  const [isSplitView, setIsSplitView] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempConfig, setTempConfig] = useState<AiProviderConfig>(aiConfig);
  const [activePresetId, setActivePresetId] = useState<string>('gemini');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open AI settings modal when triggered externally
  useEffect(() => {
    if (openSettingsSignal > 0) {
      setShowSettingsModal(true);
    }
  }, [openSettingsSignal]);

  // Sync tempConfig with aiConfig whenever modal opens or aiConfig changes
  useEffect(() => {
    if (aiConfig) {
      setTempConfig(aiConfig);
      const matched = AI_PROVIDER_PRESETS.find(
        (p) => p.providerType === aiConfig.providerType && (p.baseUrl === aiConfig.baseUrl || p.defaultModel === aiConfig.model)
      );
      setActivePresetId(matched ? matched.id : 'custom');
    }
  }, [aiConfig, showSettingsModal]);

  // Keyboard shortcuts for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          if (e.shiftKey) {
            if (canRedo && onRedo) {
              e.preventDefault();
              onRedo();
            }
          } else {
            if (canUndo && onUndo) {
              e.preventDefault();
              onUndo();
            }
          }
        } else if (key === 'y') {
          if (canRedo && onRedo) {
            e.preventDefault();
            onRedo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed?.personalInfo && parsed?.skills) {
          onUpdateProfile(parsed, true);
        } else {
          alert('Invalid Master CV JSON file structure.');
        }
      } catch (err: any) {
        alert('Failed to read JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOptimizeBullet = async (bullet: string, context?: string) => {
    try {
      const res = await fetch('/api/cv/optimize-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet,
          context,
          aiConfig,
          apiKey: aiConfig?.apiKey || apiKey,
        }),
      });
      const data = await res.json();
      if (res.ok && data.optimizedBullet) {
        return data.optimizedBullet;
      }
    } catch (err) {
      console.error('Bullet optimization error:', err);
    }
    return bullet;
  };

  const handleSelectPreset = (preset: (typeof AI_PROVIDER_PRESETS)[number]) => {
    setActivePresetId(preset.id);
    setTempConfig((prev) => ({
      ...prev,
      providerType: preset.providerType,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel,
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiConfig: tempConfig }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `${data.model}: ${data.message}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAiConfig = async () => {
    if (onUpdateAiConfig) {
      onUpdateAiConfig(tempConfig);
    }
    if (onUpdateApiKey) {
      onUpdateApiKey(tempConfig.apiKey);
    }

    try {
      localStorage.setItem('huntflow_ai_config', JSON.stringify(tempConfig));
      localStorage.setItem('huntflow_gemini_api_key', tempConfig.apiKey);
      await fetch('/api/db/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ai_config', value: tempConfig }),
      });
    } catch (e) {
      console.warn('Failed to save AI config to SQLite:', e);
    }

    setShowSettingsModal(false);
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `master_cv_${(profile.personalInfo.fullName || 'Candidate').replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch('/api/cv/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF document');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (profile.personalInfo.fullName || 'Candidate').replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );
      a.download = `${safeName}_ATS_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('PDF download error:', err);
      alert('Error generating PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step D: Tailored Job Context Banner */}
      {tailoredJobContext && (
        <div className="no-print p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-zinc-900 to-emerald-950/60 border border-indigo-500/40 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-zinc-100 leading-relaxed">
              ✨ Tailored for <strong className="text-white">{tailoredJobContext.jobTitle}</strong> — Review &amp; edit any section below, Download 1-Page PDF, or Archive this Application.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {canUndo && onUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                title="Revert AI tailoring changes (Ctrl+Z)"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Revert (Undo)
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download 1-Page PDF
            </button>

            {onArchiveTailoredJob && (
              <button
                type="button"
                onClick={onArchiveTailoredJob}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 transition"
              >
                <Briefcase className="h-3.5 w-3.5" />
                Archive to Job Applications
              </button>
            )}

            {onDismissTailorBanner && (
              <button
                type="button"
                onClick={onDismissTailorBanner}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                title="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Studio Header Bar */}
      <div className="no-print p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              CV Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {profile.personalInfo.fullName || 'Draft CV'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Edit your sections, preview in real-time, and download your 100% copy-pasteable ATS PDF
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* SQLite Auto-save status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] font-medium">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-400" title="Synchronized with SQLite database">
                <Database className="h-3 w-3" />
                SQLite Synced
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-rose-400">
                Sync Error
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Database className="h-3 w-3 text-zinc-500" />
                Ready
              </span>
            )}
          </div>

          {/* Undo / Redo buttons */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Primary High-Contrast Download ATS PDF Button */}
          {onNavigateToTailor && (
            <button
              type="button"
              onClick={onNavigateToTailor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
              title="Tailor CV for a new job application"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Tailor for Job
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            title="Download ATS/LinkedIn-readable PDF"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-zinc-950" />
                Download ATS PDF
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSplitView(!isSplitView)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isSplitView
                ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Toggle side-by-side Editor & ATS Document Preview"
          >
            <Columns className="h-3.5 w-3.5" />
            Split View
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            title="Download your full CV as a JSON backup"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            title="Load a saved CV JSON file"
          >
            <Upload className="h-3.5 w-3.5 text-indigo-400" />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              setTempConfig(aiConfig || DEFAULT_AI_CONFIG);
              setShowSettingsModal(true);
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            title="Universal AI Provider Settings (OpenAI, Gemini, DeepSeek, Groq, Ollama)"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Section Navigation Tabs */}
      <div className="no-print flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-800">
        {[
          { id: 'personal', label: '1. Personal Info' },
          { id: 'skills', label: '2. Skills' },
          { id: 'experience', label: '3. Work Experience' },
          { id: 'projects', label: '4. Key Projects' },
          { id: 'education', label: '5. Education & Certs' },
          { id: 'preview', label: '6. ATS Document Preview' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Studio Viewport */}
      {isSplitView ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start print:block">
          {/* Left Column: Active Editor Section */}
          <div className="no-print studio-editor-column space-y-6">
            {activeTab === 'personal' && (
              <PersonalInfoEditor
                personalInfo={profile.personalInfo}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, personalInfo: updated }, false)
                }
              />
            )}
            {activeTab === 'skills' && (
              <SkillsEditor
                skills={profile.skills}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, skills: updated }, false)
                }
              />
            )}
            {activeTab === 'experience' && (
              <ExperienceEditor
                experience={profile.experience}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, experience: updated }, false)
                }
                onOptimizeBullet={handleOptimizeBullet}
              />
            )}
            {activeTab === 'projects' && (
              <ProjectsEditor
                projects={profile.projects}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, projects: updated }, false)
                }
                onOptimizeBullet={handleOptimizeBullet}
              />
            )}
            {activeTab === 'education' && (
              <EducationEditor
                education={profile.education}
                certifications={profile.certifications}
                onChangeEducation={(updated) =>
                  onUpdateProfile({ ...profile, education: updated }, true)
                }
                onChangeCertifications={(updated) =>
                  onUpdateProfile({ ...profile, certifications: updated }, true)
                }
              />
            )}
            {activeTab === 'preview' && (
              <PersonalInfoEditor
                personalInfo={profile.personalInfo}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, personalInfo: updated }, false)
                }
              />
            )}
          </div>

          {/* Right Column: Live ATS Document Preview */}
          <div className="sticky top-20 print:static print:top-0 print:w-full">
            <LiveAtsDocumentPreview profile={profile} />
          </div>
        </div>
      ) : (
        /* Full-Width Tabbed View */
        <div>
          {activeTab === 'personal' && (
            <PersonalInfoEditor
              personalInfo={profile.personalInfo}
              onChange={(updated) =>
                onUpdateProfile({ ...profile, personalInfo: updated }, false)
              }
            />
          )}
          {activeTab === 'skills' && (
            <SkillsEditor
              skills={profile.skills}
              onChange={(updated) =>
                onUpdateProfile({ ...profile, skills: updated }, false)
              }
            />
          )}
          {activeTab === 'experience' && (
            <ExperienceEditor
              experience={profile.experience}
              onChange={(updated) =>
                onUpdateProfile({ ...profile, experience: updated }, false)
              }
              onOptimizeBullet={handleOptimizeBullet}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsEditor
              projects={profile.projects}
              onChange={(updated) =>
                onUpdateProfile({ ...profile, projects: updated }, false)
              }
              onOptimizeBullet={handleOptimizeBullet}
            />
          )}
          {activeTab === 'education' && (
            <EducationEditor
              education={profile.education}
              certifications={profile.certifications}
              onChangeEducation={(updated) =>
                onUpdateProfile({ ...profile, education: updated }, true)
              }
              onChangeCertifications={(updated) =>
                onUpdateProfile({ ...profile, certifications: updated }, true)
              }
            />
          )}
          {activeTab === 'preview' && (
            <LiveAtsDocumentPreview profile={profile} />
          )}
        </div>
      )}

      {/* Universal AI Provider Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Universal AI Configuration</h3>
                  <p className="text-xs text-zinc-400">
                    Connect OpenAI, DeepSeek, Groq, OpenRouter, Ollama, or Google Gemini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Presets Quick-Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  1-Click Provider Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AI_PROVIDER_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{preset.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {preset.defaultModel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider Architecture Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Protocol Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTempConfig((prev) => ({ ...prev, providerType: 'openai-compatible' }));
                      setTestResult(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition ${
                      tempConfig.providerType === 'openai-compatible'
                        ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    OpenAI-Compatible / Proxy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempConfig((prev) => ({
                        ...prev,
                        providerType: 'gemini',
                        baseUrl: 'https://generativelanguage.googleapis.com',
                        model: prev.model || 'gemini-2.5-flash',
                      }));
                      setTestResult(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition ${
                      tempConfig.providerType === 'gemini'
                        ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    Google Gemini Native
                  </button>
                </div>
              </div>

              {/* Base URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Base URL / Endpoint</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    {tempConfig.providerType === 'gemini' ? 'Fixed Google API' : 'Appends /v1/chat/completions'}
                  </span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={tempConfig.baseUrl}
                    onChange={(e) => {
                      setTempConfig((prev) => ({ ...prev, baseUrl: e.target.value }));
                      setActivePresetId('custom');
                      setTestResult(null);
                    }}
                    disabled={tempConfig.providerType === 'gemini'}
                    placeholder="https://api.openai.com/v1"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Model Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Model Name / ID
                </label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={tempConfig.model}
                    onChange={(e) => {
                      setTempConfig((prev) => ({ ...prev, model: e.target.value }));
                      setTestResult(null);
                    }}
                    placeholder="e.g. gpt-4o-mini, deepseek-chat, gemini-2.5-flash, llama-3.3-70b-versatile"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* API Token / Key */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>API Key / Bearer Token</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    {tempConfig.baseUrl?.includes('localhost') ? 'Optional for local Ollama' : 'Stored securely in local SQLite'}
                  </span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={tempConfig.apiKey}
                    onChange={(e) => {
                      setTempConfig((prev) => ({ ...prev, apiKey: e.target.value }));
                      setTestResult(null);
                    }}
                    placeholder={
                      tempConfig.providerType === 'gemini'
                        ? 'AIzaSy...'
                        : tempConfig.baseUrl?.includes('localhost')
                        ? 'ollama (optional)'
                        : 'sk-...'
                    }
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  >
                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <span className="break-all">{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Test Connection
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAiConfig}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
