'use client';

import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Download,
  Code,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { RawStagingPayload } from '@/types/ingestion';

interface StagingPayloadViewProps {
  payload: RawStagingPayload;
  onProceedToStage2?: () => void;
}

export const StagingPayloadView: React.FC<StagingPayloadViewProps> = ({
  payload,
  onProceedToStage2,
}) => {
  const [viewMode, setViewMode] = useState<'corpus' | 'json'>('corpus');
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy =
      viewMode === 'corpus'
        ? payload.aggregatedCorpus
        : JSON.stringify(payload, null, 2);

    navigator.clipboard.writeText(textToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `huntflow_staging_${payload.candidateName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Metrics Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-md">
          <span className="text-xs text-zinc-400 font-medium">Candidate Name</span>
          <p className="text-lg font-bold text-white mt-1 truncate">
            {payload.candidateName}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-md">
          <span className="text-xs text-zinc-400 font-medium">Aggregated Words</span>
          <p className="text-lg font-bold text-indigo-400 mt-1">
            {payload.metrics.totalWords.toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-md">
          <span className="text-xs text-zinc-400 font-medium">Active Sources</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">
            {payload.metrics.totalSources}{' '}
            <span className="text-xs font-normal text-zinc-400">
              ({payload.metrics.githubReposCount} repos, {payload.metrics.documentsCount} docs)
            </span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-md">
          <span className="text-xs text-zinc-400 font-medium">Detected Tech Stack</span>
          <p className="text-lg font-bold text-purple-400 mt-1">
            {payload.metrics.detectedKeywords.length}{' '}
            <span className="text-xs font-normal text-zinc-400">technologies</span>
          </p>
        </div>
      </div>

      {/* Keywords Pill Cloud */}
      {payload.metrics.detectedKeywords.length > 0 && (
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Extracted Technical Keywords Preview
          </div>
          <div className="flex flex-wrap gap-1.5">
            {payload.metrics.detectedKeywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60 hover:border-indigo-500/50 hover:bg-zinc-700/60 transition"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Staging Store Card */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Controls Bar */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-zinc-800 text-indigo-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Aggregated Staging Store
              </h3>
              <p className="text-[11px] text-zinc-400">
                Normalized candidate payload feeding into Stage 2 Gemini AI synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('corpus')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'corpus'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Aggregated Corpus
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'json'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                JSON Payload
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
              title="Copy to clipboard"
            >
              {hasCopied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
              title="Download JSON"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-4 bg-zinc-950/80 max-h-[500px] overflow-y-auto">
          {viewMode === 'corpus' ? (
            payload.aggregatedCorpus.trim().length > 0 ? (
              <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed select-text">
                {payload.aggregatedCorpus}
              </pre>
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No data ingested yet. Add a GitHub username or upload a CV to populate the staging store.
              </div>
            )
          ) : (
            <pre className="font-mono text-xs text-indigo-300 whitespace-pre-wrap leading-relaxed select-text">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer with Stage 1 Checklist & Next Action */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Stage 1 Verified: GitHub repos, multi-format file extraction & staging schema ready.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              Last updated: {new Date(payload.lastUpdated).toLocaleTimeString()}
            </span>
            <button
              type="button"
              onClick={onProceedToStage2}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              Ready for Stage 2: AI Synthesis
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
