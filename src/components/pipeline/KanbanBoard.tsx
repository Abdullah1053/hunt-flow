'use client';

import React, { useState } from 'react';
import { JobApplicationRecord, ApplicationStatus } from '@/types/pipeline';
import { PIPELINE_STAGES } from '@/data/samplePipeline';
import {
  Building,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface KanbanBoardProps {
  applications: JobApplicationRecord[];
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onSelectApplication: (application: JobApplicationRecord) => void;
  onDownloadPdf: (application: JobApplicationRecord) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onStatusChange,
  onSelectApplication,
  onDownloadPdf,
}) => {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedAppId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: ApplicationStatus) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColId: ApplicationStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      onStatusChange(appId, targetColId);
    }
    setDraggedAppId(null);
  };

  // Get next stage in progression
  const getNextStage = (curr: ApplicationStatus): ApplicationStatus | null => {
    const order: ApplicationStatus[] = ['wishlist', 'applied', 'screening', 'technical', 'offer'];
    const idx = order.indexOf(curr);
    if (idx !== -1 && idx < order.length - 1) {
      return order[idx + 1];
    }
    return null;
  };

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-[1250px] items-start">
        {PIPELINE_STAGES.map((stage) => {
          const stageApps = applications.filter((app) => app.status === stage.id);
          const isOver = dragOverCol === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`flex-1 min-w-[280px] max-w-[340px] rounded-2xl border transition flex flex-col max-h-[82vh] ${
                isOver
                  ? 'bg-zinc-900 border-indigo-500/80 ring-2 ring-indigo-500/30'
                  : `${stage.bgColor} ${stage.borderColor}`
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {stageApps.length}
                  </span>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {stageApps.length === 0 ? (
                  <div className="py-8 text-center text-zinc-600 text-xs italic">
                    Drop applications here
                  </div>
                ) : (
                  stageApps.map((app) => {
                    const nextStage = getNextStage(app.status);
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => onSelectApplication(app)}
                        className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 shadow-md transition cursor-pointer space-y-2.5 active:scale-[0.99] group"
                      >
                        {/* Company & Match Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-100 group-hover:text-indigo-300 transition">
                            {app.company}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            {app.matchScore}% Match
                          </span>
                        </div>

                        {/* Job Title */}
                        <p className="text-[11px] font-medium text-zinc-300 line-clamp-1">
                          {app.jobTitle}
                        </p>

                        {/* Location & Compensation */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 capitalize">
                            <MapPin className="h-3 w-3 text-zinc-500" />
                            {app.workType}
                          </span>
                          {app.salaryRange && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                              {app.salaryRange}
                            </span>
                          )}
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {app.appliedDate || app.createdAt.split('T')[0]}
                          </span>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onDownloadPdf(app)}
                              title="Download linked tailored PDF"
                              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            {nextStage && (
                              <button
                                type="button"
                                onClick={() => onStatusChange(app.id, nextStage)}
                                title={`Advance to ${nextStage}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white transition"
                              >
                                Advance
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
