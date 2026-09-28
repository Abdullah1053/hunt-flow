'use client';

import React, { useState } from 'react';
import { JobApplicationRecord, ApplicationStatus } from '@/types/pipeline';
import { PIPELINE_STAGES } from '@/data/samplePipeline';
import {
  X,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  Mail,
  User,
  ExternalLink,
  Download,
  Trash2,
  Plus,
  Clock,
  Sparkles,
  FileText,
  DollarSign,
  Loader2,
} from 'lucide-react';

interface ApplicationDetailModalProps {
  application: JobApplicationRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: JobApplicationRecord) => void;
  onDelete: (id: string) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [salaryRange, setSalaryRange] = useState(application.salaryRange || '');
  const [recruiterName, setRecruiterName] = useState(application.recruiterName || '');
  const [recruiterEmail, setRecruiterEmail] = useState(application.recruiterEmail || '');
  const [interviewNotes, setInterviewNotes] = useState(application.interviewNotes || '');
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'snapshot'>('details');

  if (!isOpen) return null;

  const handleSave = () => {
    let updatedTimeline = [...application.timeline];

    // If status changed, record timeline event automatically
    if (status !== application.status) {
      const stageConfig = PIPELINE_STAGES.find((s) => s.id === status);
      updatedTimeline.push({
        id: `tl_${Date.now()}`,
        status,
        date: new Date().toISOString().split('T')[0],
        note: `Status updated to ${stageConfig?.label || status}.`,
      });
    }

    if (newTimelineNote.trim()) {
      updatedTimeline.push({
        id: `tl_note_${Date.now()}`,
        status,
        date: new Date().toISOString().split('T')[0],
        note: newTimelineNote.trim(),
      });
      setNewTimelineNote('');
    }

    const updated: JobApplicationRecord = {
      ...application,
      status,
      salaryRange,
      recruiterName,
      recruiterEmail,
      interviewNotes,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString(),
    };

    onUpdate(updated);
    onClose();
  };

  const handleDownloadSubmittedPdf = async () => {
    try {
      setIsDownloadingPdf(true);
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
      const safeName = (application.tailoredCvSnapshot.personalInfo.fullName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeCompany = application.company.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeName}_${safeCompany}_Submitted_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      console.error(e);
      alert('Could not download PDF: ' + e.message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const currentStage = PIPELINE_STAGES.find((s) => s.id === status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{application.company}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {application.matchScore}% Match
                </span>
              </div>
              <p className="text-xs text-zinc-400">{application.jobTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Sub-tabs */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === 'details'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Job Details & Contacts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Timeline & Notes
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
              {application.timeline.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('snapshot')}
            className={`pb-2.5 font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'snapshot'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            Linked CV Snapshot
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Pipeline Status Selector */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Current Pipeline Stage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PIPELINE_STAGES.map((stg) => {
                    const isSelected = status === stg.id;
                    return (
                      <button
                        key={stg.id}
                        type="button"
                        onClick={() => setStatus(stg.id)}
                        className={`p-2.5 rounded-xl border text-left font-medium transition ${
                          isSelected
                            ? `${stg.bgColor} ${stg.borderColor} ${stg.color} ring-1 ring-current`
                            : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="font-bold">{stg.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compensation & Work Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Salary / Compensation Range
                  </label>
                  <div className="relative">
                    <DollarSign className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="e.g. $95,000 - $110,000 USD"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Location & Work Policy
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{application.location}</span>
                    <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 capitalize">
                      {application.workType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recruiter Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Recruiter / Hiring Manager Name
                  </label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={recruiterName}
                      onChange={(e) => setRecruiterName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Recruiter Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={recruiterEmail}
                      onChange={(e) => setRecruiterEmail(e.target.value)}
                      placeholder="e.g. sarah@company.com"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Notes & Prep Questions */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Interview Notes & Target Preparation
                </label>
                <textarea
                  rows={4}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Record questions asked, team structure, tech stack hints, or salary negotiation notes..."
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans text-xs"
                />
              </div>

              {/* External Link */}
              {application.jobUrl && (
                <div className="pt-1">
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Original Job Posting ({application.jobUrl})
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Event Add Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTimelineNote}
                  onChange={(e) => setNewTimelineNote(e.target.value)}
                  placeholder="Log an update (e.g. 'Completed 2nd tech interview with Engineering Lead')..."
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTimelineNote.trim()) {
                      const updatedTimeline = [
                        ...application.timeline,
                        {
                          id: `tl_add_${Date.now()}`,
                          status,
                          date: new Date().toISOString().split('T')[0],
                          note: newTimelineNote.trim(),
                        },
                      ];
                      onUpdate({
                        ...application,
                        timeline: updatedTimeline,
                      });
                      setNewTimelineNote('');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Chronological List */}
              <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {application.timeline.map((evt, idx) => {
                  const stageMatch = PIPELINE_STAGES.find((s) => s.id === evt.status);
                  return (
                    <div key={evt.id || idx} className="flex items-start gap-3 relative pl-1">
                      <div className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 z-10 text-[10px]">
                        •
                      </div>
                      <div className="flex-1 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${stageMatch?.color || 'text-zinc-300'}`}>
                            {stageMatch?.label || evt.status}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {evt.date}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-xs">
                          {evt.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LINKED CV SNAPSHOT */}
          {activeTab === 'snapshot' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-100">
                    Exact Tailored CV Snapshot Linked to this Application
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Immutable snapshot of the resume version submitted for {application.company}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSubmittedPdf}
                  disabled={isDownloadingPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download PDF
                </button>
              </div>

              {/* Snapshot Summary Preview */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                    Submitted Headline:
                  </span>
                  <span className="text-zinc-200">
                    {application.tailoredCvSnapshot.personalInfo.headline}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                    Submitted Summary:
                  </span>
                  <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                    {application.tailoredCvSnapshot.personalInfo.summary}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                    Top Skills Highlighted:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1 font-sans">
                    {[
                      ...application.tailoredCvSnapshot.skills.languages,
                      ...application.tailoredCvSnapshot.skills.frameworks,
                      ...application.tailoredCvSnapshot.skills.databases,
                    ]
                      .slice(0, 10)
                      .map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] bg-zinc-900 text-zinc-300 border border-zinc-800"
                        >
                          {s}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to remove ${application.company} from your pipeline?`)) {
                onDelete(application.id);
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
