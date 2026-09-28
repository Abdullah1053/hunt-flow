'use client';

import React, { useState } from 'react';
import { Globe, Plus, Trash2, ExternalLink, AlertCircle, FileEdit, CheckCircle2 } from 'lucide-react';
import { ExternalLink as IExternalLink } from '@/types/ingestion';

interface ExternalLinksCardProps {
  links: IExternalLink[];
  manualNotes: string;
  isAddingLink: boolean;
  error: string | null;
  onAddLink: (url: string) => Promise<void>;
  onRemoveLink: (linkId: string) => void;
  onUpdateNotes: (notes: string) => void;
}

export const ExternalLinksCard: React.FC<ExternalLinksCardProps> = ({
  links,
  manualNotes,
  isAddingLink,
  error,
  onAddLink,
  onRemoveLink,
  onUpdateNotes,
}) => {
  const [urlInput, setUrlInput] = useState('');

  const handleAddLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      await onAddLink(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700/80 text-white">
            <Globe className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">External Links & Additional Context</h2>
            <p className="text-xs text-zinc-400">
              Scrape portfolio websites, blogs, and provide freeform candidate notes
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleAddLinkSubmit} className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste portfolio or blog URL (e.g. https://abdullah1053.github.io)"
            className="w-full px-4 py-2.5 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={isAddingLink || !urlInput.trim()}
          className="px-4 py-2.5 text-sm font-medium rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-lg shadow-cyan-600/20"
        >
          {isAddingLink ? (
            <>
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Link
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Links List */}
      {links.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Ingested Links ({links.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {links.map((link) => (
              <div
                key={link.id}
                className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-zinc-200 truncate">
                      {link.title || link.url}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {link.snippet && (
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                      {link.snippet}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLink(link.id)}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
                  title="Remove link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Freeform Notes Section */}
      <div className="mt-6 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <FileEdit className="h-3.5 w-3.5 text-zinc-400" />
            Freeform Bio & Candidate Notes
          </label>
          <span className="text-[11px] text-zinc-500">
            {manualNotes.length} characters
          </span>
        </div>
        <textarea
          value={manualNotes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          rows={4}
          placeholder="Paste extra details: awards, key achievements, target job title (e.g. Senior Full-Stack Engineer), or specific impact metrics not found in your CV..."
          className="w-full p-3.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition leading-relaxed resize-none"
        />
      </div>
    </div>
  );
};
