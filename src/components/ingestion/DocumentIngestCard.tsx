'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  FileCheck,
  Trash2,
  Eye,
  X,
  Sparkles,
  AlertCircle,
  FileCode,
  FileType,
} from 'lucide-react';
import { ParsedDocument } from '@/types/ingestion';

interface DocumentIngestCardProps {
  documents: ParsedDocument[];
  isUploading: boolean;
  error: string | null;
  onUploadFiles: (files: FileList | File[]) => Promise<void>;
  onRemoveDocument: (docId: string) => void;
  onLoadSampleCV: () => Promise<void>;
  isLoadingSample: boolean;
}

export const DocumentIngestCard: React.FC<DocumentIngestCardProps> = ({
  documents,
  isUploading,
  error,
  onUploadFiles,
  onRemoveDocument,
  onLoadSampleCV,
  isLoadingSample,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ParsedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onUploadFiles(e.target.files);
      // Reset input value to allow re-upload of same file name
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700/80 text-white">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Document & Resume Ingestion</h2>
            <p className="text-xs text-zinc-400">
              Parses existing resumes, portfolios, and letters via server-side extractors
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLoadSampleCV}
          disabled={isLoadingSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          {isLoadingSample ? 'Loading CV...' : 'Load Sample CV (Abdullah)'}
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center group ${
          isDragOver
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="h-12 w-12 rounded-full bg-zinc-800/80 group-hover:bg-zinc-700/80 flex items-center justify-center text-zinc-300 group-hover:text-purple-300 transition mb-3">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="text-sm font-medium text-zinc-200">
          {isUploading ? (
            <span className="text-purple-400 animate-pulse">Extracting text from files...</span>
          ) : (
            <>
              Drop your CV / document here, or{' '}
              <span className="text-purple-400 group-hover:underline">browse files</span>
            </>
          )}
        </p>

        <p className="text-xs text-zinc-500 mt-1">
          Supports <span className="text-zinc-400">PDF, DOCX, TXT, MD</span> up to 10MB
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Parsed Documents List */}
      {documents.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Parsed Documents ({documents.length})
            </h4>
            <span className="text-xs text-zinc-500">
              Total Words:{' '}
              <strong className="text-zinc-300">
                {documents.reduce((acc, d) => acc + d.wordCount, 0)}
              </strong>
            </span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700/80 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                      <FileType className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs sm:text-sm text-zinc-100 truncate">
                          {doc.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300">
                          {doc.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        {doc.pageCount && doc.pageCount > 1 && (
                          <>
                            <span>{doc.pageCount} pages</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{doc.wordCount} words</span>
                        <span>•</span>
                        <span>{doc.charCount} characters</span>
                      </div>

                      {/* Detected sections */}
                      {doc.sectionsDetected.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.sectionsDetected.map((sec) => (
                            <span
                              key={sec}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            >
                              ✓ {sec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                      title="Inspect Extracted Text"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveDocument(doc.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Text Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white text-sm">{previewDoc.name}</h3>
                  <span className="text-xs text-zinc-400">
                    {previewDoc.wordCount} words • {previewDoc.charCount} characters
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-zinc-300 whitespace-pre-wrap bg-zinc-950 leading-relaxed selection:bg-purple-900 selection:text-white">
              {previewDoc.extractedText}
            </div>

            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
