'use client';

import React, { useState, useEffect, useRef } from 'react';
import { JobApplicationRecord, ApplicationStatus } from '@/types/pipeline';
import { getSampleJobApplications, PIPELINE_STAGES } from '@/data/samplePipeline';
import { MasterCvProfile } from '@/types/masterCv';
import { KanbanBoard } from './KanbanBoard';
import { PipelineAnalyticsDashboard } from './PipelineAnalyticsDashboard';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { AddApplicationModal } from './AddApplicationModal';
import {
  Briefcase,
  LayoutGrid,
  BarChart3,
  List,
  Plus,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Search,
  ExternalLink,
  MapPin,
  Calendar,
} from 'lucide-react';

interface PipelineViewProps {
  masterProfile: MasterCvProfile;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ masterProfile }) => {
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'kanban' | 'analytics' | 'list'>('kanban');
  const [selectedApp, setSelectedApp] = useState<JobApplicationRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from localStorage or seed with sample applications
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
    // Default seed
    const defaultApps = getSampleJobApplications();
    setApplications(defaultApps);
    try {
      localStorage.setItem('huntflow_applications', JSON.stringify(defaultApps));
    } catch {}
  }, []);

  // Sync to localStorage
  const saveApplications = (updated: JobApplicationRecord[]) => {
    setApplications(updated);
    try {
      localStorage.setItem('huntflow_applications', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving applications to localStorage:', e);
    }
  };

  // Status transition handler
  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    const stageMatch = PIPELINE_STAGES.find((s) => s.id === newStatus);
    const updated = applications.map((app) => {
      if (app.id === appId && app.status !== newStatus) {
        const newTimeline = [
          ...app.timeline,
          {
            id: `tl_${Date.now()}`,
            status: newStatus,
            date: new Date().toISOString().split('T')[0],
            note: `Advanced to ${stageMatch?.label || newStatus}.`,
          },
        ];
        return {
          ...app,
          status: newStatus,
          timeline: newTimeline,
          updatedAt: new Date().toISOString(),
        };
      }
      return app;
    });
    saveApplications(updated);
  };

  // Add application
  const handleAddApplication = (newRecord: JobApplicationRecord) => {
    const updated = [newRecord, ...applications];
    saveApplications(updated);
  };

  // Update application from modal
  const handleUpdateApplication = (updatedApp: JobApplicationRecord) => {
    const updated = applications.map((a) => (a.id === updatedApp.id ? updatedApp : a));
    saveApplications(updated);
    setSelectedApp(null);
  };

  // Delete application
  const handleDeleteApplication = (id: string) => {
    const updated = applications.filter((a) => a.id !== id);
    saveApplications(updated);
    setSelectedApp(null);
  };

  // Reset to default sample
  const handleResetToDemo = () => {
    if (confirm('Reset application pipeline to the initial Abdullah Ademi demo records?')) {
      const defaultApps = getSampleJobApplications();
      saveApplications(defaultApps);
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(applications, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `huntflow_applications_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          saveApplications(parsed);
          alert(`Successfully imported ${parsed.length} job applications!`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download Tailored PDF for an application
  const handleDownloadAppPdf = async (app: JobApplicationRecord) => {
    try {
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
      const safeName = (app.tailoredCvSnapshot.personalInfo.fullName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeCompany = app.company.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeName}_${safeCompany}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      alert('Could not download PDF: ' + e.message);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = filterStage === 'all' || app.status === filterStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackup}
        accept=".json"
        className="hidden"
      />

      {/* Top Banner Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-indigo-400" />
            Job Application Pipeline & Versioned CV Tracker
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Track interview rounds, manage immutable tailored CV snapshots, and monitor career conversion metrics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30 transition"
          >
            <Plus className="h-4 w-4" />
            New Application
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            title="Export all applications & snapshots as JSON"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import backup JSON"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </button>

          <button
            type="button"
            onClick={handleResetToDemo}
            title="Reset to default Abdullah Ademi demo pipeline"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 border border-zinc-700/60 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'kanban'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
            Kanban Board
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'analytics'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            Analytics & Funnel
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'list'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <List className="h-3.5 w-3.5 text-purple-400" />
            Table View
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company or title..."
              className="pl-8 pr-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          applications={filteredApps}
          onStatusChange={handleStatusChange}
          onSelectApplication={(app) => setSelectedApp(app)}
          onDownloadPdf={handleDownloadAppPdf}
        />
      )}

      {/* VIEW 2: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <PipelineAnalyticsDashboard applications={applications} />
      )}

      {/* VIEW 3: TABLE LIST VIEW */}
      {activeTab === 'list' && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-x-auto shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="pb-3 pl-2">Company</th>
                <th className="pb-3">Role Title</th>
                <th className="pb-3">Stage</th>
                <th className="pb-3">Match</th>
                <th className="pb-3">Compensation</th>
                <th className="pb-3">Applied Date</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredApps.map((app) => {
                const stageMatch = PIPELINE_STAGES.find((s) => s.id === app.status);
                return (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="hover:bg-zinc-800/40 transition cursor-pointer"
                  >
                    <td className="py-3 pl-2 font-bold text-zinc-100">
                      {app.company}
                    </td>
                    <td className="py-3 text-zinc-300 font-medium">
                      {app.jobTitle}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageMatch?.badgeColor || ''}`}>
                        {stageMatch?.label || app.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-emerald-400 font-semibold">
                      {app.matchScore}%
                    </td>
                    <td className="py-3 text-zinc-400 font-mono">
                      {app.salaryRange || '—'}
                    </td>
                    <td className="py-3 text-zinc-500 font-mono">
                      {app.appliedDate || app.createdAt.split('T')[0]}
                    </td>
                    <td className="py-3 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDownloadAppPdf(app)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[11px]"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          onUpdate={handleUpdateApplication}
          onDelete={handleDeleteApplication}
        />
      )}

      {/* ADD APPLICATION MODAL */}
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
