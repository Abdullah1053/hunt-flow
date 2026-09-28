'use client';

import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Code2,
  X,
  TrendingUp,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import { ProjectItem } from '@/types/masterCv';

interface ProjectsEditorProps {
  projects: ProjectItem[];
  onChange: (updated: ProjectItem[]) => void;
  onOptimizeBullet: (bullet: string, context?: string) => Promise<string>;
}

export const ProjectsEditor: React.FC<ProjectsEditorProps> = ({
  projects,
  onChange,
  onOptimizeBullet,
}) => {
  const [optimizingKey, setOptimizingKey] = useState<string | null>(null);
  const [techInputs, setTechInputs] = useState<Record<string, string>>({});
  const [newBulletInputs, setNewBulletInputs] = useState<Record<string, string>>({});
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [collapsedBullets, setCollapsedBullets] = useState<Record<string, boolean>>({});

  const toggleCollapseProject = (id: string) => {
    setCollapsedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCollapseBullets = (id: string) => {
    setCollapsedBullets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateProject = (id: string, updates: Partial<ProjectItem>) => {
    onChange(
      projects.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleToggleHideProject = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    handleUpdateProject(id, { isHidden: !proj.isHidden });
  };

  const handleToggleHideBullet = (projId: string, bulletIndex: number) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    const currentHidden = new Set(proj.hiddenBullets || []);
    if (currentHidden.has(bulletIndex)) {
      currentHidden.delete(bulletIndex);
    } else {
      currentHidden.add(bulletIndex);
    }
    handleUpdateProject(projId, { hiddenBullets: Array.from(currentHidden) });
  };

  const handleToggleHideAllBullets = (projId: string) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    const allHidden = (proj.hiddenBullets || []).length === proj.bullets.length;
    handleUpdateProject(projId, {
      hiddenBullets: allHidden ? [] : proj.bullets.map((_, idx) => idx),
    });
  };

  const handleAddProject = () => {
    const newProj: ProjectItem = {
      id: `proj_${Date.now()}`,
      title: 'New High-Impact Project',
      role: 'Full-Stack Developer',
      techStack: ['TypeScript', 'Next.js', 'PostgreSQL'],
      impactMetric: 'Scaled system with measurable throughput gains',
      isHidden: false,
      hiddenBullets: [],
      bullets: [
        'Architected modern web application implementing scalable RESTful services and responsive UI.',
      ],
    };
    onChange([newProj, ...projects]);
  };

  const handleRemoveProject = (id: string) => {
    onChange(projects.filter((item) => item.id !== id));
  };

  const handleAddTech = (projId: string) => {
    const val = (techInputs[projId] || '').trim();
    if (!val) return;

    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    const newStack = Array.from(new Set([...proj.techStack, val]));
    handleUpdateProject(projId, { techStack: newStack });
    setTechInputs((prev) => ({ ...prev, [projId]: '' }));
  };

  const handleRemoveTech = (projId: string, tech: string) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    handleUpdateProject(projId, {
      techStack: proj.techStack.filter((t) => t !== tech),
    });
  };

  const handleUpdateBullet = (projId: string, bIdx: number, text: string) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    const newBullets = [...proj.bullets];
    newBullets[bIdx] = text;
    handleUpdateProject(projId, { bullets: newBullets });
  };

  const handleRemoveBullet = (projId: string, bIdx: number) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    const newBullets = proj.bullets.filter((_, idx) => idx !== bIdx);
    const newHidden = (proj.hiddenBullets || [])
      .filter((idx) => idx !== bIdx)
      .map((idx) => (idx > bIdx ? idx - 1 : idx));
    handleUpdateProject(projId, {
      bullets: newBullets,
      hiddenBullets: newHidden,
    });
  };

  const handleAddBullet = (projId: string) => {
    const text = (newBulletInputs[projId] || '').trim();
    if (!text) return;

    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    handleUpdateProject(projId, { bullets: [...proj.bullets, text] });
    setNewBulletInputs((prev) => ({ ...prev, [projId]: '' }));
  };

  const handleAiOptimizeBullet = async (projId: string, bIdx: number) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    const bullet = proj.bullets[bIdx];
    if (!bullet) return;

    const optKey = `${projId}_${bIdx}`;
    setOptimizingKey(optKey);
    try {
      const optimized = await onOptimizeBullet(bullet, `Project: ${proj.title}`);
      handleUpdateBullet(projId, bIdx, optimized);
    } catch (err) {
      console.error('Failed to optimize project bullet:', err);
    } finally {
      setOptimizingKey(null);
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Key Showcase Projects</h3>
            <p className="text-xs text-zinc-400">
              Aggregated from GitHub repositories and resume projects with quantifiable metrics
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddProject}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Project
        </button>
      </div>

      <div className="space-y-6">
        {projects.map((proj) => {
          const isCollapsed = Boolean(collapsedProjects[proj.id]);
          const isBulletsCollapsed = Boolean(collapsedBullets[proj.id]);
          const hiddenBulletsSet = new Set(proj.hiddenBullets || []);
          const visibleBulletsCount = proj.bullets.length - hiddenBulletsSet.size;

          return (
            <div
              key={proj.id}
              className={`p-5 rounded-2xl border transition space-y-4 ${
                proj.isHidden
                  ? 'bg-zinc-950/40 border-dashed border-amber-500/30 opacity-75'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700/80'
              }`}
            >
              {/* Top row: Title, Role, Collapse toggle & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleCollapseProject(proj.id)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
                    title={isCollapsed ? 'Expand project details' : 'Collapse project details'}
                  >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>

                  {isCollapsed ? (
                    <div
                      className="flex-1 cursor-pointer flex items-center justify-between gap-3 flex-wrap"
                      onClick={() => toggleCollapseProject(proj.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">
                          {proj.title || 'Untitled Project'}
                        </span>
                        {proj.role && (
                          <span className="text-xs text-zinc-400">
                            ({proj.role})
                          </span>
                        )}
                        {proj.techStack.length > 0 && (
                          <span className="text-[11px] text-cyan-400/80 font-mono">
                            • {proj.techStack.slice(0, 3).join(', ')}{proj.techStack.length > 3 ? '...' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                          {proj.bullets.length} bullets ({visibleBulletsCount} on CV)
                        </span>
                        {proj.isHidden && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Hidden from CV
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                          Project Title
                        </label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) =>
                            handleUpdateProject(proj.id, { title: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                          Role in Project
                        </label>
                        <input
                          type="text"
                          value={proj.role || ''}
                          onChange={(e) =>
                            handleUpdateProject(proj.id, { role: e.target.value })
                          }
                          placeholder="e.g. Lead Architect / Full-Stack Developer"
                          className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {proj.isHidden && !isCollapsed && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> Hidden from CV
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleHideProject(proj.id)}
                    className={`p-1.5 rounded-lg border transition ${
                      proj.isHidden
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                    title={proj.isHidden ? 'Click to include this project in CV' : 'Click to hide this project from CV'}
                  >
                    {proj.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveProject(proj.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition"
                    title="Remove project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Collapsed body is hidden, expanded body shows details */}
              {!isCollapsed && (
                <>
                  {/* Middle row: Impact metric & URLs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-cyan-400" />
                        Primary Impact Metric
                      </label>
                      <input
                        type="text"
                        value={proj.impactMetric || ''}
                        onChange={(e) =>
                          handleUpdateProject(proj.id, { impactMetric: e.target.value })
                        }
                        placeholder="e.g. Sub-80ms search latency across 10k items"
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-cyan-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1">
                        <GithubIcon className="h-3 w-3 text-zinc-400" />
                        GitHub Repository URL
                      </label>
                      <input
                        type="text"
                        value={proj.githubUrl || ''}
                        onChange={(e) =>
                          handleUpdateProject(proj.id, { githubUrl: e.target.value })
                        }
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 text-zinc-400" />
                        Live Demo URL
                      </label>
                      <input
                        type="text"
                        value={proj.demoUrl || ''}
                        onChange={(e) =>
                          handleUpdateProject(proj.id, { demoUrl: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Tech Stack Chips */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                      Tech Stack
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {proj.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                        >
                          <span>{tech}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTech(proj.id, tech)}
                            className="hover:text-rose-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-xs">
                      <input
                        type="text"
                        value={techInputs[proj.id] || ''}
                        onChange={(e) =>
                          setTechInputs((prev) => ({ ...prev, [proj.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTech(proj.id);
                          }
                        }}
                        placeholder="Add technology (e.g. Redis)..."
                        className="flex-1 px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTech(proj.id)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Bullets List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                          XYZ Project Achievement Bullets ({proj.bullets.length})
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          • {visibleBulletsCount} visible on CV
                          {hiddenBulletsSet.size > 0 && (
                            <span className="text-amber-400 ml-1">({hiddenBulletsSet.size} hidden)</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {proj.bullets.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleHideAllBullets(proj.id)}
                              className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
                            >
                              {hiddenBulletsSet.size === proj.bullets.length ? 'Unhide All' : 'Hide All Bullets'}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCollapseBullets(proj.id)}
                              className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center gap-1"
                            >
                              {isBulletsCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                              {isBulletsCollapsed ? 'Expand Bullets' : 'Collapse Bullets'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {!isBulletsCollapsed && (
                      <div className="space-y-2.5">
                        {proj.bullets.map((bullet, bIdx) => {
                          const isOptimizing = optimizingKey === `${proj.id}_${bIdx}`;
                          const isBulletHidden = hiddenBulletsSet.has(bIdx);

                          return (
                            <div
                              key={bIdx}
                              className={`p-3 rounded-xl border transition space-y-2 ${
                                isBulletHidden
                                  ? 'bg-zinc-950/40 border-dashed border-amber-500/20 opacity-75'
                                  : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700/80'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className={`text-sm mt-1 ${isBulletHidden ? 'text-amber-500/60' : 'text-zinc-500'}`}>
                                  {isBulletHidden ? <EyeOff className="h-3.5 w-3.5 mt-0.5" /> : '•'}
                                </span>
                                <textarea
                                  rows={2}
                                  value={bullet}
                                  onChange={(e) =>
                                    handleUpdateBullet(proj.id, bIdx, e.target.value)
                                  }
                                  className={`flex-1 p-2 text-xs rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-none border ${
                                    isBulletHidden
                                      ? 'bg-zinc-950/60 border-dashed border-zinc-800 text-zinc-400'
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-100'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleToggleHideBullet(proj.id, bIdx)}
                                  className={`p-1.5 rounded-lg border transition ${
                                    isBulletHidden
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                      : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800'
                                  }`}
                                  title={isBulletHidden ? 'Include this bullet on CV' : 'Hide this bullet from CV'}
                                >
                                  {isBulletHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBullet(proj.id, bIdx)}
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                                  title="Remove bullet"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500 text-[10px]">
                                    Action Verb ➔ Quantifiable Impact ➔ Architecture Method
                                  </span>
                                  {isBulletHidden && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      Hidden from CV & PDF
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  disabled={isOptimizing}
                                  onClick={() => handleAiOptimizeBullet(proj.id, bIdx)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition disabled:opacity-50"
                                >
                                  <Sparkles className="h-3 w-3 text-amber-400" />
                                  {isOptimizing ? 'Optimizing...' : '⚡ AI Optimize (XYZ)'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Bullet Input */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newBulletInputs[proj.id] || ''}
                        onChange={(e) =>
                          setNewBulletInputs((prev) => ({
                            ...prev,
                            [proj.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBullet(proj.id);
                          }
                        }}
                        placeholder="Add a new project accomplishment bullet..."
                        className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddBullet(proj.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Bullet
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
