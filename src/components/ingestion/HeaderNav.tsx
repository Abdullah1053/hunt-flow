'use client';

import React from 'react';
import { Layers, Download, Briefcase, FileText, Loader2, UploadCloud, Database, Wand2 } from 'lucide-react';

interface HeaderNavProps {
  activeTab: 'builder' | 'career' | 'tailor' | 'archive';
  setActiveTab: (tab: 'builder' | 'career' | 'tailor' | 'archive') => void;
  onDownloadPdf: () => void;
  isDownloadingPdf?: boolean;
  onOpenImport?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onDownloadPdf,
  isDownloadingPdf = false,
  onOpenImport,
}) => {
  return (
    <header className="no-print border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">HuntFlow</span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                ATS CV Builder & Job Archive
              </p>
            </div>
          </div>

          {/* Center 4 Main Tabs: CV Builder, Knowledge Base, Tailor for Job & Job Archive */}
          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'builder'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className={`h-4 w-4 ${activeTab === 'builder' ? 'text-indigo-400' : 'text-zinc-400'}`} />
              <span>CV Builder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('career')}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'career'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Database className={`h-4 w-4 ${activeTab === 'career' ? 'text-purple-400' : 'text-zinc-400'}`} />
              <span>Knowledge Base</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tailor')}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'tailor'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Wand2 className={`h-4 w-4 ${activeTab === 'tailor' ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span>Tailor for Job</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'archive'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Briefcase className={`h-4 w-4 ${activeTab === 'archive' ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span>Job Archive</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Optional Import helper button */}
            {onOpenImport && (
              <button
                type="button"
                onClick={onOpenImport}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                title="Import sources or load profile"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Import Sources
              </button>
            )}

            {/* Prominent High-Contrast "Download ATS PDF" Button in Header */}
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
              title="Download ATS-Optimized, 100% copy-pasteable PDF"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-zinc-950" />
                  <span>Download ATS PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
