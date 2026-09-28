'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileCode,
  Download,
  Settings,
  Eye,
  Columns,
  Layers,
  CheckCircle2,
  Key,
  X,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
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
  onProceedToStage3: () => void;
}

export const MasterCvStudio: React.FC<MasterCvStudioProps> = ({
  profile,
  onUpdateProfile,
  onReSynthesize,
  isSynthesizing,
  apiKey,
  onUpdateApiKey,
  onProceedToStage3,
}) => {
  const [activeTab, setActiveTab] = useState<
    'personal' | 'skills' | 'experience' | 'projects' | 'education' | 'preview'
  >('personal');
  const [isSplitView, setIsSplitView] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);

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
      `master_cv_${profile.personalInfo.fullName.replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalBullets =
    profile.experience.reduce((acc, curr) => acc + curr.bullets.length, 0) +
    profile.projects.reduce((acc, curr) => acc + curr.bullets.length, 0);

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white">Interactive Master CV Studio</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Stage 2: Schema Normalization
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {totalBullets} XYZ Bullets
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Full manual review, real-time field edits & instant ATS document rendering
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
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

          <button
            type="button"
            onClick={onReSynthesize}
            disabled={isSynthesizing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
            {isSynthesizing ? 'Synthesizing...' : 'Re-Synthesize Profile'}
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => setIsSplitView(!isSplitView)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isSplitView
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
            title="Toggle side-by-side Editor & ATS Document Preview"
          >
            <Columns className="h-3.5 w-3.5" />
            Split View
          </button>

          <button
            type="button"
            onClick={onProceedToStage3}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20 transition"
          >
            Stage 2 Review & Next
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-800">
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Left Column: Active Editor Section */}
          <div className="space-y-6">
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
          <div className="sticky top-20">
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
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your Google Gemini API key to enable live LLM synthesis and XYZ formula bullet point rewriting. If left empty, HuntFlow operates seamlessly via the intelligent deterministic engine.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-1.5 text-xs rounded-lg text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateApiKey(tempApiKey.trim());
                  setShowSettingsModal(false);
                }}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
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
