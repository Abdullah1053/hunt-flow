'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MasterCvProfile } from '@/types/masterCv';
import { JobDescriptionData, TailoredCvProfile } from '@/types/tailoring';
import { SAMPLE_JOB_POSTINGS, analyzeJdMatch } from '@/lib/tailoringEngine/jdAnalyzer';
import { JobDescriptionInput } from './JobDescriptionInput';
import { MatchScoreCard } from './MatchScoreCard';
import { SideBySideDiffViewer } from './SideBySideDiffViewer';
import {
  Target,
  Download,
  Printer,
  Sparkles,
  BookmarkCheck,
  CheckCircle2,
  FileCheck,
  Zap,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface ContextualTailorViewProps {
  masterProfile: MasterCvProfile;
  apiKey?: string;
  onNavigateToStage5?: () => void;
}

export const ContextualTailorView: React.FC<ContextualTailorViewProps> = ({
  masterProfile,
  apiKey,
  onNavigateToStage5,
}) => {
  const [currentJd, setCurrentJd] = useState<JobDescriptionData>(SAMPLE_JOB_POSTINGS[0]);
  const [tailoredCv, setTailoredCv] = useState<TailoredCvProfile | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compute baseline analysis whenever currentJd or masterProfile changes
  const baselineAnalysis = useMemo(() => {
    return analyzeJdMatch(masterProfile, currentJd);
  }, [masterProfile, currentJd]);

  // When JD changes, reset active tailoredCv unless already tailored for this JD
  useEffect(() => {
    if (tailoredCv && tailoredCv.jobId !== currentJd.id) {
      setTailoredCv(null);
    }
  }, [currentJd, tailoredCv]);

  // Trigger AI Contextual Tailoring
  const handleGenerateTailored = async () => {
    setIsTailoring(true);
    try {
      const res = await fetch('/api/tailor/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterProfile,
          jobDescription: currentJd,
          apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to tailor CV');
      }

      setTailoredCv(data.tailoredCv);
    } catch (err: any) {
      console.error('Error generating tailored CV:', err);
      alert('Could not tailor CV: ' + err.message);
    } finally {
      setIsTailoring(false);
    }
  };

  // Download Tailored Vector PDF
  const handleDownloadTailoredPdf = async () => {
    const profileToRender = tailoredCv ? tailoredCv.profile : masterProfile;
    try {
      setIsDownloadingPdf(true);
      const res = await fetch('/api/cv/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileToRender }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate tailored ATS PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (profileToRender.personalInfo.fullName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeCompany = (currentJd.company || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeName}_${safeCompany}_Tailored_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading tailored PDF:', err);
      alert('Could not download PDF: ' + err.message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Save to application pipeline (stored in localStorage for Stage 5)
  const handleSaveToPipeline = () => {
    try {
      const existingRaw = localStorage.getItem('huntflow_applications');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const newApp = {
        id: `app_${Date.now()}`,
        jobTitle: currentJd.jobTitle,
        company: currentJd.company,
        location: currentJd.location,
        workType: currentJd.workType,
        matchScore: tailoredCv ? tailoredCv.analysis.matchPercentage : baselineAnalysis.matchPercentage,
        status: 'ready_to_apply',
        appliedAt: null,
        tailoredCvSnapshot: tailoredCv ? tailoredCv.profile : masterProfile,
        createdAt: new Date().toISOString(),
      };
      existing.unshift(newApp);
      localStorage.setItem('huntflow_applications', JSON.stringify(existing));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving application:', e);
    }
  };

  const activeAnalysis = tailoredCv ? tailoredCv.analysis : baselineAnalysis;

  return (
    <div className="space-y-6">
      {/* Top Banner Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Target className="h-6 w-6 text-purple-400" />
            Contextual Job Tailoring Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time JD keyword gap analyzer, dynamic skill re-ranker, and targeted ATS resume generator.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTailoredPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white shadow-lg shadow-indigo-950/40 transition disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Tailored Vector PDF
          </button>

          <button
            type="button"
            onClick={handleSaveToPipeline}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <BookmarkCheck className={`h-3.5 w-3.5 ${savedSuccess ? 'text-emerald-400' : 'text-zinc-400'}`} />
            {savedSuccess ? 'Saved to Pipeline!' : 'Save Application'}
          </button>
        </div>
      </div>

      {/* STEP 1: Job Description Input */}
      <JobDescriptionInput
        currentJd={currentJd}
        onSelectJd={(jd) => setCurrentJd(jd)}
        isLoading={isTailoring}
      />

      {/* STEP 2: Match Score & Gap Analysis */}
      <MatchScoreCard
        analysis={activeAnalysis}
        diffSummary={tailoredCv?.diffSummary}
        isTailored={Boolean(tailoredCv)}
        onGenerateTailored={handleGenerateTailored}
        isTailoring={isTailoring}
      />

      {/* STEP 3: Side-by-Side Diff Inspector & Tailored Document */}
      {tailoredCv ? (
        <SideBySideDiffViewer
          masterProfile={masterProfile}
          tailoredProfile={tailoredCv}
        />
      ) : (
        <div className="p-8 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-3">
          <Sparkles className="h-8 w-8 text-indigo-400 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-200">
            Ready to Tailor Your Master CV for {currentJd.company}
          </h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Click &quot;⚡ Generate Contextually Tailored CV&quot; above to re-rank your skills, contextualize your summary, and highlight relevant achievements for this role.
          </p>
          <button
            type="button"
            onClick={handleGenerateTailored}
            disabled={isTailoring}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            {isTailoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 text-amber-300" />
            )}
            Tailor CV Now
          </button>
        </div>
      )}
    </div>
  );
};
