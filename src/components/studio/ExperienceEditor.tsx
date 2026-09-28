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

  const handleUpdateItem = (id: string, updates: Partial<WorkExperienceItem>) => {
    onChange(
      experience.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
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
    handleUpdateItem(itemId, { bullets: newBullets });
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
        {experience.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700/80 transition space-y-4"
          >
            {/* Top row: Role, Company & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
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

              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="self-end sm:self-center p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition"
                title="Remove experience"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

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
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                XYZ Impact Bullets ({item.bullets.length})
              </label>

              <div className="space-y-2.5">
                {item.bullets.map((bullet, bIdx) => {
                  const isOptimizing = optimizingIndex === `${item.id}_${bIdx}`;

                  return (
                    <div
                      key={bIdx}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 transition space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-zinc-500 text-sm mt-1">•</span>
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) =>
                            handleUpdateBullet(item.id, bIdx, e.target.value)
                          }
                          className="flex-1 p-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBullet(item.id, bIdx)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
                          title="Remove bullet"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-zinc-500">
                          Formula: <span className="text-blue-400">Accomplished [X]</span>,{' '}
                          <span className="text-purple-400">as measured by [Y]</span>,{' '}
                          <span className="text-emerald-400">by doing [Z]</span>
                        </span>

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
          </div>
        ))}
      </div>
    </div>
  );
};
