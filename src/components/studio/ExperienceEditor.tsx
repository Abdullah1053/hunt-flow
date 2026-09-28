'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Calendar,
  MapPin,
  Building,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { WorkExperienceItem } from '@/types/masterCv';

interface ExperienceEditorProps {
  experience: WorkExperienceItem[];
  onChange: (updated: WorkExperienceItem[]) => void;
  onOptimizeBullet: (bullet: string, context?: string) => Promise<string>;
}

export const ExperienceEditor: React.FC<ExperienceEditorProps> = ({
  experience,
  onChange,
  onOptimizeBullet,
}) => {
  const [optimizingIndex, setOptimizingIndex] = useState<string | null>(null);
  const [newBulletInputs, setNewBulletInputs] = useState<Record<string, string>>({});
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});
  const [collapsedBullets, setCollapsedBullets] = useState<Record<string, boolean>>({});

  const toggleCollapseItem = (id: string) => {
    setCollapsedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCollapseBullets = (id: string) => {
    setCollapsedBullets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateItem = (id: string, updates: Partial<WorkExperienceItem>) => {
    onChange(
      experience.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleToggleHideItem = (id: string) => {
    const item = experience.find((i) => i.id === id);
    if (!item) return;
    handleUpdateItem(id, { isHidden: !item.isHidden });
  };

  const handleToggleHideBullet = (itemId: string, bulletIndex: number) => {
    const item = experience.find((i) => i.id === itemId);
    if (!item) return;
    const currentHidden = new Set(item.hiddenBullets || []);
    if (currentHidden.has(bulletIndex)) {
      currentHidden.delete(bulletIndex);
    } else {
      currentHidden.add(bulletIndex);
    }
    handleUpdateItem(itemId, { hiddenBullets: Array.from(currentHidden) });
  };

  const handleToggleHideAllBullets = (itemId: string) => {
    const item = experience.find((i) => i.id === itemId);
    if (!item) return;
    const allHidden = (item.hiddenBullets || []).length === item.bullets.length;
    handleUpdateItem(itemId, {
      hiddenBullets: allHidden ? [] : item.bullets.map((_, idx) => idx),
    });
  };

  const handleAddItem = () => {
    const newItem: WorkExperienceItem = {
      id: `exp_${Date.now()}`,
      company: 'New Company',
      role: 'Software Engineer',
      location: 'City, Country',
      startDate: '2023',
      endDate: 'Present',
      isCurrent: true,
      isHidden: false,
      hiddenBullets: [],
      bullets: [
        'Engineered high-performance web systems by designing modular microservices.',
      ],
    };
    onChange([newItem, ...experience]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(experience.filter((item) => item.id !== id));
  };

  const handleUpdateBullet = (itemId: string, bulletIndex: number, text: string) => {
    const item = experience.find((i) => i.id === itemId);
    if (!item) return;

    const newBullets = [...item.bullets];
    newBullets[bulletIndex] = text;
    handleUpdateItem(itemId, { bullets: newBullets });
  };

  const handleRemoveBullet = (itemId: string, bulletIndex: number) => {
    const item = experience.find((i) => i.id === itemId);
    if (!item) return;

    const newBullets = item.bullets.filter((_, idx) => idx !== bulletIndex);
    const newHidden = (item.hiddenBullets || [])
      .filter((idx) => idx !== bulletIndex)
      .map((idx) => (idx > bulletIndex ? idx - 1 : idx));
    handleUpdateItem(itemId, { bullets: newBullets, hiddenBullets: newHidden });
  };

  const handleAddBullet = (itemId: string) => {
    const text = (newBulletInputs[itemId] || '').trim();
    if (!text) return;

    const item = experience.find((i) => i.id === itemId);
    if (!item) return;

    handleUpdateItem(itemId, { bullets: [...item.bullets, text] });
    setNewBulletInputs((prev) => ({ ...prev, [itemId]: '' }));
  };

  const handleAiOptimizeBullet = async (itemId: string, bulletIndex: number) => {
    const item = experience.find((i) => i.id === itemId);
    if (!item) return;

    const bullet = item.bullets[bulletIndex];
    if (!bullet) return;

    const optKey = `${itemId}_${bulletIndex}`;
    setOptimizingIndex(optKey);
    try {
      const optimized = await onOptimizeBullet(bullet, `${item.role} at ${item.company}`);
      handleUpdateBullet(itemId, bulletIndex, optimized);
    } catch (err) {
      console.error('Failed to optimize bullet:', err);
    } finally {
      setOptimizingIndex(null);
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Work Experience & XYZ Bullets</h3>
            <p className="text-xs text-zinc-400">
              Each bullet follows Google’s XYZ formula: Accomplished [X], as measured by [Y], by doing [Z]
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Role
        </button>
      </div>

      <div className="space-y-6">
        {experience.map((item) => {
          const isCollapsed = Boolean(collapsedItems[item.id]);
          const isBulletsCollapsed = Boolean(collapsedBullets[item.id]);
          const hiddenBulletsSet = new Set(item.hiddenBullets || []);
          const visibleBulletsCount = item.bullets.length - hiddenBulletsSet.size;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition space-y-4 ${
                item.isHidden
                  ? 'bg-zinc-950/40 border-dashed border-amber-500/30 opacity-75'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700/80'
              }`}
            >
              {/* Top row: Role, Company, Collapse toggle & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleCollapseItem(item.id)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
                    title={isCollapsed ? 'Expand role details' : 'Collapse role details'}
                  >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>

                  {isCollapsed ? (
                    <div
                      className="flex-1 cursor-pointer flex items-center justify-between gap-3 flex-wrap"
                      onClick={() => toggleCollapseItem(item.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">
                          {item.role || 'Untitled Role'}
                        </span>
                        <span className="text-xs text-zinc-400">
                          at <span className="text-zinc-200">{item.company || 'Company'}</span>
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          • {item.startDate || 'Start'} - {item.endDate || 'Present'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                          {item.bullets.length} bullets ({visibleBulletsCount} on CV)
                        </span>
                        {item.isHidden && (
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
                          Job Title / Role
                        </label>
                        <input
                          type="text"
                          value={item.role}
                          onChange={(e) => handleUpdateItem(item.id, { role: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={item.company}
                          onChange={(e) => handleUpdateItem(item.id, { company: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {item.isHidden && !isCollapsed && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> Hidden from CV
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleHideItem(item.id)}
                    className={`p-1.5 rounded-lg border transition ${
                      item.isHidden
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                    title={item.isHidden ? 'Click to include this role in CV' : 'Click to hide this role from CV'}
                  >
                    {item.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition"
                    title="Remove experience"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Collapsed body is hidden, expanded body shows details */}
              {!isCollapsed && (
                <>
                  {/* Middle row: Location, Dates, Current Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { location: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={item.startDate}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { startDate: e.target.value })
                        }
                        placeholder="e.g. Mar 2023"
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        value={item.endDate}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { endDate: e.target.value })
                        }
                        placeholder="e.g. Present"
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Bullets List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                          XYZ Impact Bullets ({item.bullets.length})
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          • {visibleBulletsCount} visible on CV
                          {hiddenBulletsSet.size > 0 && (
                            <span className="text-amber-400 ml-1">({hiddenBulletsSet.size} hidden)</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.bullets.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleHideAllBullets(item.id)}
                              className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
                            >
                              {hiddenBulletsSet.size === item.bullets.length ? 'Unhide All' : 'Hide All Bullets'}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCollapseBullets(item.id)}
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
                        {item.bullets.map((bullet, bIdx) => {
                          const isOptimizing = optimizingIndex === `${item.id}_${bIdx}`;
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
                                    handleUpdateBullet(item.id, bIdx, e.target.value)
                                  }
                                  className={`flex-1 p-2 text-xs rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none border ${
                                    isBulletHidden
                                      ? 'bg-zinc-950/60 border-dashed border-zinc-800 text-zinc-400'
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-100'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleToggleHideBullet(item.id, bIdx)}
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
                                  onClick={() => handleRemoveBullet(item.id, bIdx)}
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                                  title="Remove bullet"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500">
                                    Formula: <span className="text-blue-400">Accomplished [X]</span>,{' '}
                                    <span className="text-purple-400">as measured by [Y]</span>,{' '}
                                    <span className="text-emerald-400">by doing [Z]</span>
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
                                  onClick={() => handleAiOptimizeBullet(item.id, bIdx)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition disabled:opacity-50"
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
                        value={newBulletInputs[item.id] || ''}
                        onChange={(e) =>
                          setNewBulletInputs((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBullet(item.id);
                          }
                        }}
                        placeholder="Add a new experience achievement bullet..."
                        className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddBullet(item.id)}
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
