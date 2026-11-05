'use client';

import React, { useState, useRef } from 'react';
import {
  JobApplicationRecord,
  JobApplicationStatus,
  APPLICATION_STATUS_CONFIG,
} from '@/types/pipeline';
import {
  X,
  ExternalLink,
  Download,
  Upload,
  Trash2,
  Calendar,
  Building,
  Briefcase,
  FileText,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

interface ApplicationDetailModalProps {
  application: JobApplicationRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: JobApplicationRecord) => void;
  onDelete: (id: string) => void;
  onLoadCvInStudio?: (snapshot: any) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onLoadCvInStudio,
}) => {
  const [status, setStatus] = useState<JobApplicationStatus>(application.status);
  const [jobTitle, setJobTitle] = useState(application.jobTitle);
  const [company, setCompany] = useState(application.company);
  const [jobUrl, setJobUrl] = useState(application.jobUrl || '');
  const [jobDescription, setJobDescription] = useState(application.jobDescription || '');
  const [pdfDataUrl, setPdfDataUrl] = useState<string | undefined>(application.submittedPdfDataUrl);
  const [pdfFileName, setPdfFileName] = useState<string>(
    application.submittedPdfFileName || `${application.company}_Resume.pdf`
  );
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    try {
      if (pdfDataUrl) {
        // Direct download from stored data URL
        const a = document.createElement('a');
        a.href = pdfDataUrl;
        a.download = pdfFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // If no dataUrl stored but snapshot exists, generate via API
      if (application.tailoredCvSnapshot) {
        const res = await fetch('/api/cv/download-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: application.tailoredCvSnapshot }),
        });
        if (!res.ok) throw new Error('Failed to generate PDF');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      alert('No PDF file or snapshot attached to this application.');
    } catch (e: any) {
      alert('Could not download PDF: ' + e.message);
    }
  };

  const handleReplacePdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please choose a valid PDF file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPdfDataUrl(event.target?.result as string);
        setPdfFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updated: JobApplicationRecord = {
      ...application,
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      jobUrl: jobUrl.trim(),
      jobDescription: jobDescription.trim(),
      status,
      submittedPdfDataUrl: pdfDataUrl,
      submittedPdfFileName: pdfFileName,
    };
    onUpdate(updated);
    onClose();
  };

  const statusConfig = APPLICATION_STATUS_CONFIG[status] || APPLICATION_STATUS_CONFIG.applied;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-white">{company}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${statusConfig.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-zinc-300 font-medium mt-0.5">{jobTitle}</p>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-zinc-500" />
                Applied on {application.appliedDate}
              </span>
              {jobUrl && (
                <a
                  href={jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Job Posting
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Quick Status Dropdown */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobApplicationStatus)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Metadata quick edit toggle */}
          {isEditingMetadata ? (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="font-semibold text-zinc-300">Edit Application Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Job Posting URL</label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsEditingMetadata(false)}
                className="text-xs text-indigo-400 hover:underline"
              >
                Done Editing Details
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingMetadata(true)}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-xs"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Job Title / Link
            </button>
          )}

          {/* Section 1: Submitted PDF File */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 flex items-center gap-2 text-xs">
                <FileText className="h-4 w-4 text-emerald-400" />
                Submitted PDF File
              </span>
              <span className="text-[11px] text-zinc-400">{pdfFileName}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Download Submitted PDF
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition"
              >
                <Upload className="h-3.5 w-3.5" />
                Replace PDF File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleReplacePdf}
                className="hidden"
              />

              {application.tailoredCvSnapshot && onLoadCvInStudio && (
                <button
                  type="button"
                  onClick={() => {
                    onLoadCvInStudio(application.tailoredCvSnapshot);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 transition"
                  title="Load this job's tailored CV snapshot directly into CV Builder"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  Load CV in Editor
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Full Job Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-200 flex items-center gap-2 text-xs">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                Full Job Description
              </label>
              <span className="text-[11px] text-zinc-500">Editable note area</span>
            </div>

            <textarea
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="No job description saved. Paste the job description or interview notes here..."
              className="w-full p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 transition font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete application record for ${company}?`)) {
                onDelete(application.id);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="h-4 w-4" />
            Delete Application
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
