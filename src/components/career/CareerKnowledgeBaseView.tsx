'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Search,
  Check,
  Sparkles,
  Loader2,
  Tag,
  Layers,
  Wand2,
  Download,
  Upload,
  Copy,
  FileText,
} from 'lucide-react';
import {
  CareerBullet,
  CareerBulletCategory,
  CAREER_BULLET_CATEGORY_CONFIG,
} from '@/types/careerTrack';
import {
  formatCareerBulletsAsTxt,
  formatCareerBulletsAsMd,
  parseCareerTextOrMarkdown,
  parseCareerJson,
} from '@/lib/careerBasePortability';

interface CareerKnowledgeBaseViewProps {
  onNavigateToTailor?: () => void;
}

const CATEGORY_ORDER: CareerBulletCategory[] = [
  'experience',
  'project',
  'skill_tech',
  'education_cert',
  'general',
];

function cleanBulletLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[•\-\*]|\d+[.)])\s+/, '').trim())
    .filter((line) => line.length > 0);
}

export const CareerKnowledgeBaseView: React.FC<CareerKnowledgeBaseViewProps> = ({
  onNavigateToTailor,
}) => {
  const [bullets, setBullets] = useState<CareerBullet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Quick-add state
  const [newCategory, setNewCategory] = useState<CareerBulletCategory>('experience');
  const [newContextLabel, setNewContextLabel] = useState('');
  const [newBulletText, setNewBulletText] = useState('');

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | CareerBulletCategory>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Inline context editing
  const [editingContextId, setEditingContextId] = useState<string | null>(null);
  const [editingContextValue, setEditingContextValue] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const bulletInputRef = useRef<HTMLTextAreaElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const flashStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2800);
  };

  useEffect(() => {
    async function loadBullets() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/db/career-base');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.bullets)) {
            setBullets(data.bullets);
          }
        }
      } catch (err) {
        console.error('Failed to load career knowledge base:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBullets();
  }, []);

  const activeCount = useMemo(
    () => bullets.filter((b) => b.isActiveForAi).length,
    [bullets]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bullets.length };
    CATEGORY_ORDER.forEach((c) => {
      counts[c] = bullets.filter((b) => b.category === c).length;
    });
    return counts;
  }, [bullets]);

  const filteredBullets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bullets.filter((b) => {
      if (filterCategory !== 'all' && b.category !== filterCategory) return false;
      if (!q) return true;
      return (
        b.bulletText.toLowerCase().includes(q) ||
        (b.contextLabel && b.contextLabel.toLowerCase().includes(q))
      );
    });
  }, [bullets, filterCategory, searchQuery]);

  const submitLines = async (lines: string[]) => {
    if (lines.length === 0) return;
    setIsSaving(true);
    try {
      const payload =
        lines.length === 1
          ? {
              bullet: {
                category: newCategory,
                contextLabel: newContextLabel.trim() || undefined,
                bulletText: lines[0],
                isActiveForAi: true,
              },
            }
          : {
              bullets: lines.map((line) => ({
                category: newCategory,
                contextLabel: newContextLabel.trim() || undefined,
                bulletText: line,
                isActiveForAi: true,
              })),
            };

      const res = await fetch('/api/db/career-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add bullet');
      }

      if (data.bullets && Array.isArray(data.bullets)) {
        setBullets((prev) => [...data.bullets, ...prev]);
        flashStatus(`Added ${data.bullets.length} bullets to Knowledge Base`);
      } else if (data.bullet) {
        setBullets((prev) => [data.bullet, ...prev]);
        flashStatus('Added bullet to Knowledge Base');
      }

      setNewBulletText('');
      bulletInputRef.current?.focus();
    } catch (err: any) {
      alert(err.message || 'Could not save bullet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lines = cleanBulletLines(newBulletText);
    if (lines.length === 0) return;
    await submitLines(lines);
  };

  const handlePasteBullets = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    const lines = cleanBulletLines(pasted);
    if (lines.length >= 2) {
      e.preventDefault();
      await submitLines(lines);
    }
  };

  const handleKeyDownQuickAdd = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const persistUpdate = async (updated: CareerBullet) => {
    try {
      const res = await fetch('/api/db/career-base', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet: updated }),
      });
      if (!res.ok) {
        console.error('Failed to update bullet in SQLite');
      }
    } catch (err) {
      console.error('Error updating bullet:', err);
    }
  };

  const handleToggleActive = async (bullet: CareerBullet) => {
    const updated: CareerBullet = { ...bullet, isActiveForAi: !bullet.isActiveForAi };
    setBullets((prev) => prev.map((b) => (b.id === bullet.id ? updated : b)));
    await persistUpdate(updated);
  };

  const handleInlineTextChange = (id: string, value: string) => {
    setBullets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, bulletText: value } : b))
    );
  };

  const handleInlineTextBlur = async (bullet: CareerBullet) => {
    const trimmed = bullet.bulletText.trim();
    if (!trimmed) return;
    const normalized = { ...bullet, bulletText: trimmed };
    setBullets((prev) => prev.map((b) => (b.id === bullet.id ? normalized : b)));
    await persistUpdate(normalized);
  };

  const handleCategoryChange = async (bullet: CareerBullet, category: CareerBulletCategory) => {
    const updated: CareerBullet = { ...bullet, category };
    setBullets((prev) => prev.map((b) => (b.id === bullet.id ? updated : b)));
    await persistUpdate(updated);
  };

  const handleSaveContextEdit = async (bullet: CareerBullet) => {
    const trimmed = editingContextValue.trim();
    const updated: CareerBullet = { ...bullet, contextLabel: trimmed || undefined };
    setBullets((prev) => prev.map((b) => (b.id === bullet.id ? updated : b)));
    setEditingContextId(null);
    await persistUpdate(updated);
  };

  const handleDeleteBullet = async (id: string) => {
    setBullets((prev) => prev.filter((b) => b.id !== id));
    try {
      await fetch(`/api/db/career-base?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete bullet:', err);
    }
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getDateSlug = () => new Date().toISOString().split('T')[0];

  const handleExportTxt = () => {
    const content = formatCareerBulletsAsTxt(bullets);
    triggerDownload(content, `career_knowledge_base_${getDateSlug()}.txt`, 'text/plain;charset=utf-8');
  };

  const handleExportMd = () => {
    const content = formatCareerBulletsAsMd(bullets);
    triggerDownload(content, `career_knowledge_base_${getDateSlug()}.md`, 'text/markdown;charset=utf-8');
  };

  const handleExportJson = () => {
    const content = JSON.stringify(bullets, null, 2);
    triggerDownload(content, `career_knowledge_base_${getDateSlug()}.json`, 'application/json;charset=utf-8');
  };

  const handleCopyAllAsText = async () => {
    try {
      const content = formatCareerBulletsAsTxt(bullets);
      await navigator.clipboard.writeText(content);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2400);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      alert('Failed to copy to clipboard.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    try {
      const text = await file.text();
      const lower = file.name.toLowerCase();
      let parsedItems: Array<Partial<CareerBullet>> = [];

      if (lower.endsWith('.json')) {
        parsedItems = parseCareerJson(text);
      } else if (lower.endsWith('.txt') || lower.endsWith('.md')) {
        parsedItems = parseCareerTextOrMarkdown(text);
      } else {
        throw new Error('Unsupported file format. Please upload a .txt, .md, or .json file.');
      }

      if (parsedItems.length === 0) {
        throw new Error('No valid bullets found in the uploaded file.');
      }

      const res = await fetch('/api/db/career-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullets: parsedItems }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.bullets)) {
        throw new Error(data.error || 'Failed to import bullets into database.');
      }

      // Merge imported bullets by ID (supports lossless JSON upsert & new TXT/MD bullets)
      setBullets((prev) => {
        const importedMap = new Map<string, CareerBullet>(
          (data.bullets as CareerBullet[]).map((b) => [b.id, b])
        );
        const remaining = prev.filter((b) => !importedMap.has(b.id));
        return [...(data.bullets as CareerBullet[]), ...remaining];
      });

      flashStatus(`Imported ${data.bullets.length} bullets from ${file.name}`);
    } catch (err: any) {
      alert(err.message || 'Failed to import knowledge base file.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Hidden Import File Input */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".txt,.md,.json,text/plain,text/markdown,application/json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Header & Live Active Counter + Export/Import Controls */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-400" />
                Career Knowledge Base
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                {activeCount} Active Knowledge Bullets ready for AI CV Generation
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Your single source of truth. Only checked bullets are injected into the AI fact pool when tailoring CVs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {statusMessage && (
              <span className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {statusMessage}
              </span>
            )}
            {onNavigateToTailor && (
              <button
                type="button"
                onClick={onNavigateToTailor}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Tailor CV for New Job
              </button>
            )}
          </div>
        </div>

        {/* Portable Export & Import Controls Bar */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportTxt}
              disabled={bullets.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition disabled:opacity-40"
              title="Download clean plain-text file ready for any LLM"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              Export .TXT
            </button>

            <button
              type="button"
              onClick={handleExportMd}
              disabled={bullets.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-40"
              title="Download Markdown formatted knowledge base"
            >
              <FileText className="h-3.5 w-3.5 text-sky-400" />
              Export .MD
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              disabled={bullets.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-40"
              title="Download lossless JSON backup"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              Export .JSON
            </button>

            <button
              type="button"
              onClick={handleCopyAllAsText}
              disabled={bullets.length === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition disabled:opacity-40 ${
                copiedAll
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
              title="Copy formatted knowledge base text to clipboard"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  Copy All as Text
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => importFileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-indigo-300 border border-indigo-500/30 transition disabled:opacity-40"
            title="Import bullets from a .txt, .md, or .json file"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 text-indigo-400" />
                Import .TXT / .JSON
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Quick-Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="sm:w-44 shrink-0">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as CareerBulletCategory)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              {CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {CAREER_BULLET_CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-64 shrink-0">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Context Tag (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={newContextLabel}
                onChange={(e) => setNewContextLabel(e.target.value)}
                placeholder="e.g. Doing Platform (2023 - Present)"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Factual Bullet (Press Enter to add, or paste multiple lines to bulk-add)
            </label>
            <div className="flex items-start gap-2">
              <textarea
                ref={bulletInputRef}
                rows={1}
                value={newBulletText}
                onChange={(e) => setNewBulletText(e.target.value)}
                onKeyDown={handleKeyDownQuickAdd}
                onPaste={handlePasteBullets}
                placeholder="e.g. Reduced MySQL search latency to sub-80ms by indexing composite keys and adding Redis caching..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-y min-h-[34px] leading-relaxed"
              />
              <button
                type="submit"
                disabled={isSaving || !newBulletText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition disabled:opacity-40 shrink-0"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Add
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterCategory === 'all'
                ? 'bg-zinc-800 text-white border-zinc-600'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            All ({categoryCounts.all || 0})
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const cfg = CAREER_BULLET_CATEGORY_CONFIG[cat];
            const isSelected = filterCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isSelected
                    ? 'bg-zinc-800 text-white border-zinc-600'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {cfg.shortLabel} ({categoryCounts[cat] || 0})
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bullets or context tags..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Bullets List */}
      {isLoading ? (
        <div className="p-12 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          Loading Career Knowledge Base...
        </div>
      ) : filteredBullets.length === 0 ? (
        <div className="p-12 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-2">
          <Layers className="h-8 w-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">No career bullets match your filter</p>
          <p className="text-xs text-zinc-500">
            Use the quick-add bar above to record achievements, project facts, or skills.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBullets.map((bullet) => {
            const catConfig = CAREER_BULLET_CATEGORY_CONFIG[bullet.category] || CAREER_BULLET_CATEGORY_CONFIG.general;
            const isEditingContext = editingContextId === bullet.id;

            return (
              <div
                key={bullet.id}
                className={`group p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                  bullet.isActiveForAi
                    ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    : 'bg-zinc-950/60 border-zinc-800/60 opacity-55'
                }`}
              >
                {/* Include in AI Toggle Checkbox */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={bullet.isActiveForAi}
                  aria-label="Include in AI Knowledge Base"
                  onClick={() => handleToggleActive(bullet)}
                  title={
                    bullet.isActiveForAi
                      ? 'Included in AI Knowledge Base (click to exclude)'
                      : 'Excluded from AI Knowledge Base (click to include)'
                  }
                  className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                    bullet.isActiveForAi
                      ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-sm shadow-emerald-500/20'
                      : 'bg-zinc-950 border-zinc-700 text-transparent hover:border-zinc-500'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </button>

                {/* Main Bullet Content & Badges */}
                <div className="flex-1 min-w-0 space-y-2">
                  <textarea
                    rows={1}
                    value={bullet.bulletText}
                    onChange={(e) => handleInlineTextChange(bullet.id, e.target.value)}
                    onBlur={() => handleInlineTextBlur(bullet)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        (e.currentTarget as HTMLTextAreaElement).blur();
                      }
                    }}
                    className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-100 leading-relaxed focus:outline-none focus:bg-zinc-950/80 focus:ring-1 focus:ring-indigo-500/50 rounded-lg px-2 py-1 -mx-2 -my-1 resize-none"
                  />

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Selector Badge */}
                    <select
                      value={bullet.category}
                      onChange={(e) =>
                        handleCategoryChange(bullet, e.target.value as CareerBulletCategory)
                      }
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border cursor-pointer focus:outline-none bg-zinc-950 ${catConfig.badgeClass}`}
                    >
                      {CATEGORY_ORDER.map((cat) => (
                        <option key={cat} value={cat} className="bg-zinc-900 text-zinc-200">
                          {CAREER_BULLET_CATEGORY_CONFIG[cat].shortLabel}
                        </option>
                      ))}
                    </select>

                    {/* Context Badge (Inline Editable on Click) */}
                    {isEditingContext ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingContextValue}
                        onChange={(e) => setEditingContextValue(e.target.value)}
                        onBlur={() => handleSaveContextEdit(bullet)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveContextEdit(bullet);
                          } else if (e.key === 'Escape') {
                            setEditingContextId(null);
                          }
                        }}
                        placeholder="Context tag..."
                        className="px-2 py-0.5 rounded-lg text-[10px] bg-zinc-950 border border-indigo-500 text-zinc-100 focus:outline-none w-48"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingContextId(bullet.id);
                          setEditingContextValue(bullet.contextLabel || '');
                        }}
                        title="Click to edit context tag"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/70 transition"
                      >
                        <Tag className="h-2.5 w-2.5 text-zinc-400" />
                        {bullet.contextLabel || 'General'}
                      </button>
                    )}

                    <span className="text-[10px] text-zinc-500">
                      {bullet.isActiveForAi ? 'AI Active' : 'Excluded from AI'}
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteBullet(bullet.id)}
                  aria-label="Delete bullet"
                  title="Delete bullet"
                  className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

