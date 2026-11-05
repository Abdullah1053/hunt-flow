'use client';

import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Settings,
  Columns,
  Key,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import { MasterCvProfile } from '@/types/masterCv';
import { PersonalInfoEditor } from './PersonalInfoEditor';
import { SkillsEditor } from './SkillsEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { EducationEditor } from './EducationEditor';
import { LiveAtsDocumentPreview } from './LiveAtsDocumentPreview';

interface MasterCvStudioProps {
  profile: MasterCvProfile;
  onUpdateProfile: (updated: MasterCvProfile) => void;
  onReSynthesize: () => void;
  isSynthesizing: boolean;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
  onProceedToStage3?: () => void;
}

export const MasterCvStudio: React.FC<MasterCvStudioProps> = ({
  profile,
  onUpdateProfile,
  onReSynthesize,
  isSynthesizing,
  apiKey,
  onUpdateApiKey,
}) => {
  const [activeTab, setActiveTab] = useState<
    'personal' | 'skills' | 'experience' | 'projects' | 'education' | 'preview'
  >('personal');
  const [isSplitView, setIsSplitView] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed?.personalInfo && parsed?.skills) {
          onUpdateProfile(parsed);
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
        body: JSON.stringify({ bullet, context, apiKey }),
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
          {/* Primary High-Contrast Download ATS PDF Button */}
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
              setTempApiKey(apiKey);
              setShowSettingsModal(true);
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            title="Gemini API Key Settings"
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
                  onUpdateProfile({ ...profile, personalInfo: updated })
                }
              />
            )}
            {activeTab === 'skills' && (
              <SkillsEditor
                skills={profile.skills}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, skills: updated })
                }
              />
            )}
            {activeTab === 'experience' && (
              <ExperienceEditor
                experience={profile.experience}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, experience: updated })
                }
                onOptimizeBullet={handleOptimizeBullet}
              />
            )}
            {activeTab === 'projects' && (
              <ProjectsEditor
                projects={profile.projects}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, projects: updated })
                }
                onOptimizeBullet={handleOptimizeBullet}
              />
            )}
            {activeTab === 'education' && (
              <EducationEditor
                education={profile.education}
                certifications={profile.certifications}
                onChangeEducation={(updated) =>
                  onUpdateProfile({ ...profile, education: updated })
                }
                onChangeCertifications={(updated) =>
                  onUpdateProfile({ ...profile, certifications: updated })
                }
              />
            )}
            {activeTab === 'preview' && (
              <PersonalInfoEditor
                personalInfo={profile.personalInfo}
                onChange={(updated) =>
                  onUpdateProfile({ ...profile, personalInfo: updated })
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
                onUpdateProfile({ ...profile, personalInfo: updated })
              }
            />
          )}
          {activeTab === 'skills' && (
            <SkillsEditor
              skills={profile.skills}
              onChange={(updated) =>
                onUpdateProfile({ ...profile, skills: updated })
              }
            />
          )}
          {activeTab === 'experience' && (
            <ExperienceEditor
              experience={profile.experience}
              onChange={(updated) =>
                onUpdateProfile({ ...profile, experience: updated })
              }
              onOptimizeBullet={handleOptimizeBullet}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsEditor
              projects={profile.projects}
              onChange={(updated) =>
                onUpdateProfile({ ...profile, projects: updated })
              }
              onOptimizeBullet={handleOptimizeBullet}
            />
          )}
          {activeTab === 'education' && (
            <EducationEditor
              education={profile.education}
              certifications={profile.certifications}
              onChangeEducation={(updated) =>
                onUpdateProfile({ ...profile, education: updated })
              }
              onChangeCertifications={(updated) =>
                onUpdateProfile({ ...profile, certifications: updated })
              }
            />
          )}
          {activeTab === 'preview' && (
            <LiveAtsDocumentPreview profile={profile} />
          )}
        </div>
      )}

      {/* API Key Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Key className="h-4 w-4 text-indigo-400" />
                Gemini API Key Configuration
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Enter your Google Gemini API key to enable AI bullet rewriting and schema extraction.
            </p>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateApiKey(tempApiKey.trim());
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
