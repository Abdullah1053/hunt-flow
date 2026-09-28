'use client';

import React, { useMemo } from 'react';
import { JobApplicationRecord } from '@/types/pipeline';
import { PIPELINE_STAGES } from '@/data/samplePipeline';
import {
  TrendingUp,
  Target,
  Award,
  Clock,
  Briefcase,
  Users,
  CheckCircle2,
  PieChart,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface PipelineAnalyticsDashboardProps {
  applications: JobApplicationRecord[];
}

export const PipelineAnalyticsDashboard: React.FC<PipelineAnalyticsDashboardProps> = ({
  applications,
}) => {
  const metrics = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a) => a.status === 'applied').length;
    const screening = applications.filter((a) => a.status === 'screening').length;
    const technical = applications.filter((a) => a.status === 'technical').length;
    const offer = applications.filter((a) => a.status === 'offer').length;
    const archived = applications.filter((a) => a.status === 'archived').length;
    const wishlist = applications.filter((a) => a.status === 'wishlist').length;

    // Total that moved past applied into interview rounds or offer
    const advanced = screening + technical + offer;
    const submittedTotal = applied + screening + technical + offer + archived;
    const interviewRate =
      submittedTotal > 0 ? Math.round((advanced / submittedTotal) * 100) : 0;

    const offerRate = submittedTotal > 0 ? Math.round((offer / submittedTotal) * 100) : 0;

    const avgMatch =
      total > 0
        ? Math.round(
            applications.reduce((acc, curr) => acc + (curr.matchScore || 0), 0) / total
          )
        : 0;

    // Extract top skills across all applications
    const skillCounts: Record<string, number> = {};
    applications.forEach((app) => {
      const skills = [
        ...app.tailoredCvSnapshot.skills.languages,
        ...app.tailoredCvSnapshot.skills.frameworks,
        ...app.tailoredCvSnapshot.skills.databases,
        ...app.tailoredCvSnapshot.skills.devopsAndCloud,
      ];
      skills.forEach((s) => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      total,
      wishlist,
      applied,
      screening,
      technical,
      offer,
      archived,
      advanced,
      interviewRate,
      offerRate,
      avgMatch,
      topSkills,
    };
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracked */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Tracked</span>
            <Briefcase className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.total}</div>
          <p className="text-[11px] text-zinc-500">
            {metrics.wishlist} in draft wishlist, {metrics.total - metrics.wishlist} active/submitted
          </p>
        </div>

        {/* Interview Rate */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Interview Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {metrics.interviewRate}%
          </div>
          <p className="text-[11px] text-zinc-500">
            {metrics.advanced} advanced to screening & tech
          </p>
        </div>

        {/* Average Match */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Avg Match Score</span>
            <Target className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {metrics.avgMatch}%
          </div>
          <p className="text-[11px] text-zinc-500">
            Across tailored ATS resumes
          </p>
        </div>

        {/* Offers Extended */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Job Offers</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {metrics.offer}
          </div>
          <p className="text-[11px] text-zinc-500">
            {metrics.offerRate}% conversion from applied
          </p>
        </div>
      </div>

      {/* Stage Progression Funnel */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            Application Funnel & Pipeline Breakdown
          </h4>
          <span className="text-xs text-zinc-400">Real-time status tracking</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE_STAGES.map((stg) => {
            const count = applications.filter((a) => a.status === stg.id).length;
            const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
            return (
              <div
                key={stg.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold ${stg.color}`}>{stg.label}</span>
                  <span className="font-mono text-zinc-400 font-bold">{count}</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500">{pct}% of total</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Target Skills Cloud */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Top Skills In-Demand Across Saved Applications
          </h4>
          <span className="text-xs text-zinc-400">Position requirements overlap</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {metrics.topSkills.map(([skill, count]) => (
            <div
              key={skill}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
            >
              <span className="text-zinc-200 font-medium">{skill}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                {count} {count === 1 ? 'job' : 'jobs'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
