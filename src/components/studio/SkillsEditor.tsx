'use client';

import React, { useState } from 'react';
import { Cpu, Plus, X, Eye, EyeOff, Trash2, Pencil } from 'lucide-react';
import {
  BuiltInSkillCategoryKey,
  CategorizedSkills,
  CustomSkillCategory,
  DEFAULT_SKILL_CATEGORY_LABELS,
} from '@/types/masterCv';

interface SkillsEditorProps {
  skills: CategorizedSkills;
  onChange: (updated: CategorizedSkills) => void;
}

const BUILT_IN_CONFIG: Array<{
  key: BuiltInSkillCategoryKey;
  placeholder: string;
  color: string;
}> = [
  {
    key: 'languages',
    placeholder: 'e.g. TypeScript, PHP, Python, SQL',
    color: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
  },
  {
    key: 'frameworks',
    placeholder: 'e.g. Laravel, Vue.js, Next.js, Node.js',
    color: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
  },
  {
    key: 'databases',
    placeholder: 'e.g. PostgreSQL, MySQL, Redis, Query Profiling',
    color: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  },
  {
    key: 'devopsAndCloud',
    placeholder: 'e.g. Docker, CI/CD, Linux, Nginx, Caddy, AWS',
    color: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
  },
  {
    key: 'toolsAndConcepts',
    placeholder: 'e.g. OAuth, JWT, SSL/TLS, AWS IAM, RESTful APIs, Webhooks',
    color: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
  },
];

const CUSTOM_CATEGORY_COLOR = 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10';

interface UnifiedCategoryCard {
  id: string;
  kind: 'builtin' | 'custom';
  builtInKey?: BuiltInSkillCategoryKey;
  label: string;
  items: string[];
  isHidden: boolean;
  placeholder: string;
  color: string;
}

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, onChange }) => {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  const hiddenBuiltInSet = new Set<BuiltInSkillCategoryKey>(skills.hiddenCategories || []);
  const customCategories = skills.customCategories || [];

  const unifiedCards: UnifiedCategoryCard[] = [
    ...BUILT_IN_CONFIG.map(({ key, placeholder, color }) => ({
      id: key,
      kind: 'builtin' as const,
      builtInKey: key,
      label: skills.categoryLabels?.[key] ?? DEFAULT_SKILL_CATEGORY_LABELS[key],
      items: skills[key] || [],
      isHidden: hiddenBuiltInSet.has(key),
      placeholder,
      color,
    })),
    ...customCategories.map((cat) => ({
      id: cat.id,
      kind: 'custom' as const,
      label: cat.label,
      items: cat.items || [],
      isHidden: Boolean(cat.isHidden),
      placeholder: 'e.g. Add skills separated by commas...',
      color: CUSTOM_CATEGORY_COLOR,
    })),
  ];

  const handleRenameCategory = (card: UnifiedCategoryCard, nextTitle: string) => {
    if (card.kind === 'builtin' && card.builtInKey) {
      onChange({
        ...skills,
        categoryLabels: {
          ...(skills.categoryLabels || {}),
          [card.builtInKey]: nextTitle,
        },
      });
    } else {
      onChange({
        ...skills,
        customCategories: customCategories.map((c) =>
          c.id === card.id ? { ...c, label: nextTitle } : c
        ),
      });
    }
  };

  const handleTitleBlur = (card: UnifiedCategoryCard) => {
    const trimmed = card.label.trim();
    if (trimmed) {
      if (trimmed !== card.label) handleRenameCategory(card, trimmed);
      return;
    }
    const fallback =
      card.kind === 'builtin' && card.builtInKey
        ? DEFAULT_SKILL_CATEGORY_LABELS[card.builtInKey]
        : 'Custom Skills';
    handleRenameCategory(card, fallback);
  };

  const handleToggleHide = (card: UnifiedCategoryCard) => {
    if (card.kind === 'builtin' && card.builtInKey) {
      const next = new Set(hiddenBuiltInSet);
      if (next.has(card.builtInKey)) {
        next.delete(card.builtInKey);
      } else {
        next.add(card.builtInKey);
      }
      onChange({ ...skills, hiddenCategories: Array.from(next) });
    } else {
      onChange({
        ...skills,
        customCategories: customCategories.map((c) =>
          c.id === card.id ? { ...c, isHidden: !c.isHidden } : c
        ),
      });
    }
  };

  const handleAddSkill = (card: UnifiedCategoryCard) => {
    const val = (inputs[card.id] || '').trim();
    if (!val) return;

    const newItems = val
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !card.items.includes(s));

    if (newItems.length > 0) {
      if (card.kind === 'builtin' && card.builtInKey) {
        onChange({
          ...skills,
          [card.builtInKey]: [...card.items, ...newItems],
        });
      } else {
        onChange({
          ...skills,
          customCategories: customCategories.map((c) =>
            c.id === card.id ? { ...c, items: [...c.items, ...newItems] } : c
          ),
        });
      }
    }

    setInputs((prev) => ({ ...prev, [card.id]: '' }));
  };

  const handleRemoveSkill = (card: UnifiedCategoryCard, skillToRemove: string) => {
    if (card.kind === 'builtin' && card.builtInKey) {
      onChange({
        ...skills,
        [card.builtInKey]: card.items.filter((s) => s !== skillToRemove),
      });
    } else {
      onChange({
        ...skills,
        customCategories: customCategories.map((c) =>
          c.id === card.id
            ? { ...c, items: c.items.filter((s) => s !== skillToRemove) }
            : c
        ),
      });
    }
  };

  const handleCreateCustomCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newCategoryTitle.trim();
    if (!title) return;

    const newCat: CustomSkillCategory = {
      id: `skill_cat_${Date.now()}`,
      label: title,
      items: [],
      isHidden: false,
    };

    onChange({
      ...skills,
      customCategories: [...customCategories, newCat],
    });
    setNewCategoryTitle('');
    setIsAddingCategory(false);
  };

  const handleDeleteCustomCategory = (catId: string) => {
    onChange({
      ...skills,
      customCategories: customCategories.filter((c) => c.id !== catId),
    });
  };

  const totalSkillsCount = unifiedCards.reduce((acc, card) => acc + card.items.length, 0);
  const hiddenCategoriesCount = unifiedCards.filter((c) => c.isHidden).length;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Categorized Technical Skills</h3>
            <p className="text-xs text-zinc-400">
              Rename category titles, hide lists from export, or add custom skill groups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            {totalSkillsCount} Skills Listed
          </span>
          {hiddenCategoriesCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {hiddenCategoriesCount} Hidden
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsAddingCategory((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Skill List
          </button>
        </div>
      </div>

      {/* New Custom Category Form */}
      {isAddingCategory && (
        <form
          onSubmit={handleCreateCustomCategory}
          className="p-3.5 rounded-xl bg-zinc-950 border border-indigo-500/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <input
            type="text"
            autoFocus
            value={newCategoryTitle}
            onChange={(e) => setNewCategoryTitle(e.target.value)}
            placeholder="New category title (e.g. Mobile & Cross-Platform, AI & LLMs, Testing)"
            className="flex-1 px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!newCategoryTitle.trim()}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition disabled:opacity-40"
            >
              Create List
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryTitle('');
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Skill Category Cards */}
      <div className="space-y-4">
        {unifiedCards.map((card) => {
          const currentInput = inputs[card.id] || '';

          return (
            <div
              key={card.id}
              className={`p-4 rounded-xl border transition ${
                card.isHidden
                  ? 'bg-zinc-950/30 border-zinc-800/50 border-dashed opacity-55'
                  : 'bg-zinc-950/60 border-zinc-800/80'
              }`}
            >
              {/* Editable Title & Hide/Delete Controls */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Pencil className="h-3 w-3 text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    value={card.label}
                    onChange={(e) => handleRenameCategory(card, e.target.value)}
                    onBlur={() => handleTitleBlur(card)}
                    aria-label="Category title"
                    className="bg-transparent text-xs font-semibold text-zinc-200 uppercase tracking-wider px-1.5 py-0.5 -ml-1.5 rounded-md border border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:bg-zinc-900 focus:outline-none w-full max-w-xs transition"
                  />
                  <span className="text-[11px] text-zinc-500 shrink-0">
                    ({card.items.length})
                  </span>
                  {card.isHidden && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                      Hidden from CV
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleHide(card)}
                    title={
                      card.isHidden
                        ? 'Show this skill category in CV preview & PDF'
                        : 'Hide this skill category from CV preview & PDF'
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                      card.isHidden
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {card.isHidden ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Hidden</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Visible</span>
                      </>
                    )}
                  </button>

                  {card.kind === 'custom' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomCategory(card.id)}
                      title="Delete custom skill category"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
                {card.items.map((skill) => (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${card.color} transition`}
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(card, skill)}
                      className="hover:opacity-75 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {card.items.length === 0 && (
                  <span className="text-xs text-zinc-600 italic">No skills added yet</span>
                )}
              </div>

              {/* Add Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [card.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(card);
                    }
                  }}
                  placeholder={card.placeholder}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(card)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
