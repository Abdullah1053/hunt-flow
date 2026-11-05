'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  JobApplicationRecord,
  JobApplicationStatus,
  APPLICATION_STATUS_CONFIG,
} from '@/types/pipeline';
import { getSampleJobApplications } from '@/data/samplePipeline';
import { MasterCvProfile } from '@/types/masterCv';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { AddApplicationModal } from './AddApplicationModal';
import {
  Briefcase,
  Plus,
  Download,
  Upload,
  Search,
  ExternalLink,
  FileText,
  Calendar,
  Building,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PipelineViewProps {
  masterProfile: MasterCvProfile;
  onLoadCvInStudio?: (snapshot: MasterCvProfile) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  masterProfile,
  onLoadCvInStudio,
}) => {
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplicationRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedDescIds, setExpandedDescIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from localStorage or sample data
  useEffect(() => {
    try {
      const stored = localStorage.getItem('huntflow_applications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApplications(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading stored applications:', e);
    }
    const defaultApps = getSampleJobApplications();
    setApplications(defaultApps);
    try {
      localStorage.setItem('huntflow_applications', JSON.stringify(defaultApps));
    } catch {}
  }, []);

  const saveApplications = (updated: JobApplicationRecord[]) => {
    setApplications(updated);
    try {
      localStorage.setItem('huntflow_applications', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving applications to localStorage:', e);
    }
  };

  const handleStatusChange = (appId: string, newStatus: JobApplicationStatus) => {
    const updated = applications.map((app) =>
      app.id === appId ? { ...app, status: newStatus } : app
    );
    saveApplications(updated);
  };

  const handleAddApplication = (newRecord: JobApplicationRecord) => {
    const updated = [newRecord, ...applications];
    saveApplications(updated);
  };

  const handleUpdateApplication = (updatedApp: JobApplicationRecord) => {
    const updated = applications.map((a) => (a.id === updatedApp.id ? updatedApp : a));
    saveApplications(updated);
    setSelectedApp(null);
  };

  const handleDeleteApplication = (id: string) => {
    const updated = applications.filter((a) => a.id !== id);
    saveApplications(updated);
    setSelectedApp(null);
  };

  const handleResetToDemo = () => {
    if (confirm('Reset Job Archive to sample records?')) {
      const defaultApps = getSampleJobApplications();
      saveApplications(defaultApps);
    }
  };

  const handleExportBackup = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(applications, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `huntflow_job_archive_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          saveApplications(parsed);
          alert(`Successfully imported ${parsed.length} applications!`);
        } else {
          alert('Invalid backup file.');
        }
      } catch {
        alert('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadAppPdf = async (app: JobApplicationRecord) => {
    try {
      if (app.submittedPdfDataUrl) {
        const a = document.createElement('a');
        a.href = app.submittedPdfDataUrl;
        a.download = app.submittedPdfFileName || `${app.company}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      if (app.tailoredCvSnapshot) {
        const res = await fetch('/api/cv/download-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: app.tailoredCvSnapshot }),
        });
        if (!res.ok) throw new Error('Failed to generate PDF');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = app.submittedPdfFileName || `${app.company}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      alert('No PDF attached to this application.');
    } catch (e: any) {
      alert('Could not download PDF: ' + e.message);
    }
  };

  const toggleDescription = (id: string) => {
    setExpandedDescIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackup}
        accept=".json"
        className="hidden"
      />

      {/* Top Header & Actions Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-400" />
              Job Applications Archive
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {applications.length} Saved
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Keep track of every job you applied to, its exact description, job link, and submitted PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="h-4 w-4" />
            Archive New Job
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            title="Export all applications as JSON"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON backup"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </button>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title or company..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-xs whitespace-nowrap">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/50 border border-dashed border-zinc-800 space-y-3">
          <Briefcase className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">No Job Applications Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Start tracking your applications by clicking "Archive New Job" above.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition mt-2"
          >
            <Plus className="h-4 w-4" />
            Archive First Application
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const statusConfig =
              APPLICATION_STATUS_CONFIG[app.status] || APPLICATION_STATUS_CONFIG.applied;
            const isDescExpanded = expandedDescIds.includes(app.id);

            return (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition shadow-lg space-y-4"
              >
                {/* Row Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-bold text-white">{app.company}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-sm font-semibold text-zinc-200">{app.jobTitle}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        Applied: {app.appliedDate}
                      </span>

                      {app.jobUrl && (
                        <a
                          href={app.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Posting
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown Pill & Direct Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${statusConfig.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleStatusChange(app.id, e.target.value as JobApplicationStatus)
                          }
                          className="bg-transparent text-xs font-bold cursor-pointer focus:outline-none"
                        >
                          <option value="applied" className="bg-zinc-900 text-white">
                            Applied
                          </option>
                          <option value="interviewing" className="bg-zinc-900 text-white">
                            Interviewing
                          </option>
                          <option value="offer" className="bg-zinc-900 text-white">
                            Offer
                          </option>
                          <option value="rejected" className="bg-zinc-900 text-white">
                            Rejected
                          </option>
                        </select>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadAppPdf(app)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition shadow-sm"
                      title="Download the exact PDF submitted for this application"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                      Download PDF
                    </button>

                    {app.tailoredCvSnapshot && onLoadCvInStudio && (
                      <button
                        type="button"
                        onClick={() => onLoadCvInStudio(app.tailoredCvSnapshot!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                        title="Load this job's tailored CV snapshot directly into CV Builder"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                        Load in Editor
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedApp(app)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 transition"
                      title="View & Edit Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete application for ${app.company}?`)) {
                          handleDeleteApplication(app.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 bg-zinc-800/40 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Job Description Preview / Expand */}
                {app.jobDescription && (
                  <div className="pt-2 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => toggleDescription(app.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-medium"
                    >
                      {isDescExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Hide Job Description
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          Show Job Description
                        </>
                      )}
                    </button>

                    {isDescExpanded && (
                      <div className="mt-2 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono">
                        {app.jobDescription}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Application Detail / Edit Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          onUpdate={handleUpdateApplication}
          onDelete={handleDeleteApplication}
          onLoadCvInStudio={onLoadCvInStudio}
        />
      )}

      {/* Add New Application Modal */}
      {isAddModalOpen && (
        <AddApplicationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddApplication}
          masterProfile={masterProfile}
        />
      )}
    </div>
  );
};
