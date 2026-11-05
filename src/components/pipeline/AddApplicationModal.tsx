'use client';

import React, { useState, useRef } from 'react';
import { JobApplicationRecord, JobApplicationStatus } from '@/types/pipeline';
import { MasterCvProfile } from '@/types/masterCv';
import { X, FileText, Upload, CheckCircle2, Loader2, Link as LinkIcon, Building, Briefcase } from 'lucide-react';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: JobApplicationRecord) => void;
  masterProfile: MasterCvProfile;
}

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  masterProfile,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<JobApplicationStatus>('applied');
  const [pdfSource, setPdfSource] = useState<'current' | 'upload'>('current');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF file (.pdf).');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !company.trim()) {
      alert('Job Title and Company Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let pdfDataUrl: string | undefined = undefined;
      let pdfFileName: string = `${company.trim().replace(/\s+/g, '_')}_Application_CV.pdf`;

      if (pdfSource === 'current') {
        // Generate PDF from current Master Profile
        const candidateName = masterProfile.personalInfo.fullName || 'Candidate';
        const safeName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeCompany = company.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        pdfFileName = `${safeName}_${safeCompany}_Resume.pdf`;

        const res = await fetch('/api/cv/download-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: masterProfile }),
        });

        if (res.ok) {
          const blob = await res.blob();
          pdfDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } else if (uploadedFile) {
        // Read uploaded PDF
        pdfFileName = uploadedFile.name;
        pdfDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
      }

      const newRecord: JobApplicationRecord = {
        id: `app_${Date.now()}`,
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobUrl: jobUrl.trim(),
        jobDescription: jobDescription.trim(),
        submittedPdfDataUrl: pdfDataUrl,
        submittedPdfFileName: pdfFileName,
        tailoredCvSnapshot: masterProfile,
        status,
        appliedDate: new Date().toISOString().split('T')[0],
      };

      onAdd(newRecord);
      onClose();
    } catch (err: any) {
      console.error('Error creating job application record:', err);
      alert('Failed to archive application: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div>
            <h3 className="text-base font-bold text-white">Archive Job Application</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Record job details and store the exact PDF submitted
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. Job Title */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
              Job Title *
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Full-Stack Developer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* 2. Company Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1.5 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-emerald-400" />
              Company Name *
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* 3. Job Link (URL) */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-sky-400" />
              Job Posting URL
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/view/... or careers page"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* 4. Job Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              Job Description
            </label>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting, key requirements, tech stack, and responsibilities here..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition leading-relaxed"
            />
          </div>

          {/* 5. Submitted CV (PDF) */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-zinc-200 block">
              Submitted CV (PDF) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPdfSource('current')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  pdfSource === 'current'
                    ? 'bg-indigo-950/30 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <FileText className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs text-zinc-200">
                    Attach Current CV from Studio
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Generates clean ATS PDF from your profile
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPdfSource('upload');
                  fileInputRef.current?.click();
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  pdfSource === 'upload'
                    ? 'bg-indigo-950/30 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Upload className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs text-zinc-200">
                    Upload PDF from Computer
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[170px]">
                    {uploadedFile ? uploadedFile.name : 'Select .pdf file'}
                  </div>
                </div>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Initial Status */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-zinc-200 block mb-1.5">
              Initial Application Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['applied', 'interviewing', 'offer', 'rejected'] as JobApplicationStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium capitalize border transition ${
                      status === st
                        ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-400 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Archiving Application...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
