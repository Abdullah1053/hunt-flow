'use client';

import React, { useState } from 'react';
import { Cpu, Plus, X, Layers } from 'lucide-react';
import { CategorizedSkills } from '@/types/masterCv';

interface SkillsEditorProps {
  skills: CategorizedSkills;
  onChange: (updated: CategorizedSkills) => void;
}

const CATEGORIES: {
  key: keyof CategorizedSkills;
  label: string;
  placeholder: string;
  color: string;
}[] = [
  {
    key: 'languages',
    label: 'Languages',
    placeholder: 'e.g. TypeScript, PHP, Python, SQL',
    color: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
  },
  {
    key: 'frameworks',
    label: 'Frameworks & Libraries',
    placeholder: 'e.g. Laravel, Vue.js, Next.js, Node.js',
    color: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
  },
  {
    key: 'databases',
    label: 'Databases & Optimization',
    placeholder: 'e.g. PostgreSQL, MySQL, Redis, Query Profiling',
    color: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  },
  {
    key: 'devopsAndCloud',
    label: 'DevOps & Cloud Infrastructure',
    placeholder: 'e.g. Docker, CI/CD, Linux, Nginx, Caddy, AWS',
    color: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
  },
  {
    key: 'toolsAndConcepts',
    label: 'Architecture, Concepts & Tools',
    placeholder: 'e.g. RESTful APIs, Webhooks, Real-Time Systems, Agile',
    color: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
  },
];

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, onChange }) => {
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const handleAddSkill = (catKey: keyof CategorizedSkills) => {
    const val = (inputs[catKey] || '').trim();
    if (!val) return;

    // Check for comma-separated items
    const newItems = val
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !skills[catKey].includes(s));

    if (newItems.length > 0) {
      onChange({
        ...skills,
        [catKey]: [...skills[catKey], ...newItems],
      });
    }

    setInputs((prev) => ({ ...prev, [catKey]: '' }));
  };

  const handleRemoveSkill = (catKey: keyof CategorizedSkills, skillToRemove: string) => {
    onChange({
      ...skills,
      [catKey]: skills[catKey].filter((s) => s !== skillToRemove),
    });
  };

  const totalSkillsCount = Object.values(skills).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Categorized Technical Skills</h3>
            <p className="text-xs text-zinc-400">
              Formatted according to standard ATS resume categories
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
          {totalSkillsCount} Skills Listed
        </span>
      </div>

      <div className="space-y-5">
        {CATEGORIES.map(({ key, label, placeholder, color }) => {
          const list = skills[key] || [];
          const currentInput = inputs[key] || '';

          return (
            <div key={key} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  {label} ({list.length})
                </label>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[30px]">
                {list.map((skill) => (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${color} transition`}
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(key, skill)}
                      className="hover:opacity-75 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {list.length === 0 && (
                  <span className="text-xs text-zinc-600 italic">No skills added yet</span>
                )}
              </div>

              {/* Add Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(key);
                    }
                  }}
                  placeholder={placeholder}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(key)}
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
