'use client';

import React, { useState, useMemo, useRef } from 'react';
import { MasterCvProfile } from '@/types/masterCv';
import { runAtsAudit } from '@/lib/atsEngine/atsScorer';
import { AtsScoreCard } from './AtsScoreCard';
import {
  Download,
  Printer,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  Eye,
  Terminal,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface AtsEngineViewProps {
  profile: MasterCvProfile;
  onUpdateProfile?: (profile: MasterCvProfile) => void;
  onNavigateToStudio?: () => void;
}

export const AtsEngineView: React.FC<AtsEngineViewProps> = ({
  profile,
  onUpdateProfile,
  onNavigateToStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'rawText'>('document');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Compute live ATS audit result
  const audit = useMemo(() => {
    return runAtsAudit(profile);
  }, [profile]);

  const { personalInfo, skills, experience, projects, education, certifications } = profile;

  // Build clean contact items
  const contactParts: { text: string; href?: string }[] = [];
  if (personalInfo.location) contactParts.push({ text: personalInfo.location });
  if (personalInfo.phone) contactParts.push({ text: personalInfo.phone, href: `tel:${personalInfo.phone}` });
  if (personalInfo.email) contactParts.push({ text: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.github) contactParts.push({ text: personalInfo.github.replace(/^https?:\/\//, ''), href: personalInfo.github });
  if (personalInfo.website) contactParts.push({ text: personalInfo.website.replace(/^https?:\/\//, ''), href: personalInfo.website });
  if (personalInfo.linkedin) contactParts.push({ text: personalInfo.linkedin.replace(/^https?:\/\//, ''), href: personalInfo.linkedin });

  // Generate raw ATS plain text (how parsers see it)
  const rawAtsPlainText = useMemo(() => {
    const lines: string[] = [];

    lines.push(personalInfo.fullName.toUpperCase());
    if (personalInfo.headline) lines.push(personalInfo.headline);
    lines.push(contactParts.map((c) => c.text).join(' | '));
    lines.push('');

    if (personalInfo.summary) {
      lines.push('SUMMARY');
      lines.push(personalInfo.summary);
      lines.push('');
    }

    if (skills.languages.length > 0 || skills.frameworks.length > 0) {
      lines.push('TECHNICAL SKILLS');
      if (skills.languages.length > 0) lines.push(`Languages: ${skills.languages.join(', ')}`);
      if (skills.frameworks.length > 0) lines.push(`Frameworks & Libraries: ${skills.frameworks.join(', ')}`);
      if (skills.databases.length > 0) lines.push(`Databases: ${skills.databases.join(', ')}`);
      if (skills.devopsAndCloud.length > 0) lines.push(`DevOps & Cloud: ${skills.devopsAndCloud.join(', ')}`);
      if (skills.toolsAndConcepts.length > 0) lines.push(`Architecture & Concepts: ${skills.toolsAndConcepts.join(', ')}`);
      lines.push('');
    }

    if (experience.length > 0) {
      lines.push('PROFESSIONAL EXPERIENCE');
      experience.forEach((exp) => {
        lines.push(`${exp.company} - ${exp.role} | ${exp.location || ''} | ${exp.startDate} - ${exp.endDate}`);
        exp.bullets.forEach((b) => lines.push(`  * ${b}`));
        lines.push('');
      });
    }

    if (projects.length > 0) {
      lines.push('PROJECTS & TECHNICAL INITIATIVES');
      projects.forEach((proj) => {
        lines.push(`${proj.title} | ${proj.techStack.join(', ')} | ${proj.role || ''} | ${proj.startDate || ''} - ${proj.endDate || ''}`);
        proj.bullets.forEach((b) => lines.push(`  * ${b}`));
        lines.push('');
      });
    }

    if (education.length > 0) {
      lines.push('EDUCATION');
      education.forEach((edu) => {
        lines.push(`${edu.institution} | ${edu.degree}${edu.field ? ` in ${edu.field}` : ''} | ${edu.startDate} - ${edu.endDate}`);
        if (edu.gpa) lines.push(`  * GPA: ${edu.gpa}`);
        if (edu.achievements && edu.achievements.length > 0) {
          edu.achievements.forEach((a: string) => lines.push(`  * ${a}`));
        }
        lines.push('');
      });
    }

    if (certifications.length > 0) {
      lines.push('CERTIFICATIONS');
      certifications.forEach((cert) => {
        lines.push(`  * ${cert.name} - ${cert.issuer} (${cert.date})`);
      });
    }

    return lines.join('\n');
  }, [personalInfo, skills, experience, projects, education, certifications, contactParts]);

  // Handle Vector PDF Download
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch('/api/cv/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate ATS PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (personalInfo.fullName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeName}_ATS_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      alert('Could not download PDF: ' + err.message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(rawAtsPlainText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            ATS Engine & Vector PDF Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time Resumly & Harvard standard auditor with native vector PDF generation for {personalInfo.fullName}.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download ATS Vector PDF
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: ATS Score & Auditing Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <AtsScoreCard
            audit={audit}
            onNavigateToStudio={onNavigateToStudio}
          />
        </div>

        {/* Right Column: Live ATS Preview & Raw Parser Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub Navigation Bar for Preview Modes */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('document')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'document'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-indigo-400" />
                ATS Document Preview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rawText')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'rawText'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                Raw ATS Text Stream
              </button>
            </div>

            {activeTab === 'rawText' ? (
              <button
                type="button"
                onClick={handleCopyRawText}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
              >
                {copiedText ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiedText ? 'Copied!' : 'Copy Text'}
              </button>
            ) : (
              <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                Jake&apos;s Resume / Harvard Standard
              </span>
            )}
          </div>

          {/* TAB 1: Real-time ATS Document Preview (Jake's Resume / Harvard Standard) */}
          {activeTab === 'document' && (
            <div className="overflow-x-auto flex justify-center py-4 bg-zinc-950/80 rounded-2xl border border-zinc-800">
              <div
                ref={printRef}
                id="ats-resume-document"
                className="w-full max-w-[850px] bg-white text-zinc-900 p-8 sm:p-12 shadow-2xl rounded-sm font-serif leading-normal select-text print:p-0 print:shadow-none print:max-w-none print:w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* HEADER */}
                <div className="text-center pb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-normal uppercase text-black">
                    {personalInfo.fullName || 'Candidate Name'}
                  </h1>

                  {/* Sub-headline */}
                  {personalInfo.headline && (
                    <p className="text-[12px] font-sans text-zinc-700 font-semibold tracking-wide uppercase mt-1">
                      {personalInfo.headline}
                    </p>
                  )}

                  {/* Contact Information Bar */}
                  <div className="text-[11px] font-sans text-zinc-700 mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                    {contactParts.map((item, idx) => (
                      <React.Fragment key={idx}>
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-zinc-800"
                          >
                            {item.text}
                          </a>
                        ) : (
                          <span>{item.text}</span>
                        )}
                        {idx < contactParts.length - 1 && <span className="text-zinc-400">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* SUMMARY */}
                {personalInfo.summary && (
                  <div className="mt-3">
                    <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                      Professional Summary
                    </h2>
                    <p className="text-[12.5px] text-zinc-800 leading-relaxed mt-1 text-justify">
                      {personalInfo.summary}
                    </p>
                  </div>
                )}

                {/* EDUCATION */}
                {education.length > 0 && (
                  <div className="mt-4">
                    <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                      Education
                    </h2>
                    <div className="space-y-2 mt-1.5">
                      {education.map((edu) => (
                        <div key={edu.id}>
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-black">{edu.institution}</span>
                            <span className="text-[11px] font-sans text-zinc-700">
                              {edu.startDate} – {edu.endDate}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline text-xs italic text-zinc-800">
                            <span>
                              {edu.degree}
                              {edu.field ? ` in ${edu.field}` : ''}
                              {edu.gpa ? ` — GPA: ${edu.gpa}` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EXPERIENCE */}
                {experience.length > 0 && (
                  <div className="mt-4">
                    <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                      Experience
                    </h2>
                    <div className="space-y-3 mt-1.5">
                      {experience.map((exp) => (
                        <div key={exp.id}>
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-black">{exp.role}</span>
                            <span className="text-[11px] font-sans text-zinc-700">
                              {exp.startDate} – {exp.endDate}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline text-xs italic text-zinc-800">
                            <span>{exp.company}</span>
                            <span className="not-italic text-[11px] font-sans text-zinc-700">{exp.location}</span>
                          </div>
                          <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-[12px] text-zinc-800 leading-snug">
                            {exp.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="pl-0.5 text-justify">
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PROJECTS */}
                {projects.length > 0 && (
                  <div className="mt-4">
                    <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                      Projects & Technical Initiatives
                    </h2>
                    <div className="space-y-2.5 mt-1.5">
                      {projects.map((proj) => (
                        <div key={proj.id}>
                          <div className="flex justify-between items-baseline text-xs">
                            <div>
                              <span className="font-bold text-black">{proj.title}</span>
                              {proj.techStack.length > 0 && (
                                <span className="font-sans text-[11px] text-zinc-700 ml-1.5 font-normal">
                                  | {proj.techStack.join(', ')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-sans text-zinc-700">
                              {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                            </span>
                          </div>
                          <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-[12px] text-zinc-800 leading-snug">
                            {proj.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="pl-0.5 text-justify">
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TECHNICAL SKILLS */}
                <div className="mt-4">
                  <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                    Technical Skills
                  </h2>
                  <div className="mt-1.5 space-y-1 text-xs">
                    {skills.languages.length > 0 && (
                      <div className="flex leading-snug">
                        <span className="font-sans font-bold w-40 text-black shrink-0">
                          Languages:
                        </span>
                        <span className="text-zinc-800">{skills.languages.join(', ')}</span>
                      </div>
                    )}
                    {skills.frameworks.length > 0 && (
                      <div className="flex leading-snug">
                        <span className="font-sans font-bold w-40 text-black shrink-0">
                          Frameworks & Libraries:
                        </span>
                        <span className="text-zinc-800">{skills.frameworks.join(', ')}</span>
                      </div>
                    )}
                    {skills.databases.length > 0 && (
                      <div className="flex leading-snug">
                        <span className="font-sans font-bold w-40 text-black shrink-0">
                          Databases:
                        </span>
                        <span className="text-zinc-800">{skills.databases.join(', ')}</span>
                      </div>
                    )}
                    {skills.devopsAndCloud.length > 0 && (
                      <div className="flex leading-snug">
                        <span className="font-sans font-bold w-40 text-black shrink-0">
                          DevOps & Cloud:
                        </span>
                        <span className="text-zinc-800">{skills.devopsAndCloud.join(', ')}</span>
                      </div>
                    )}
                    {skills.toolsAndConcepts.length > 0 && (
                      <div className="flex leading-snug">
                        <span className="font-sans font-bold w-40 text-black shrink-0">
                          Architecture & Concepts:
                        </span>
                        <span className="text-zinc-800">{skills.toolsAndConcepts.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CERTIFICATIONS */}
                {certifications.length > 0 && (
                  <div className="mt-4">
                    <h2 className="text-xs font-sans font-bold tracking-wider uppercase border-b border-black pb-0.5 text-black">
                      Certifications
                    </h2>
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-[12px] text-zinc-800">
                      {certifications.map((cert) => (
                        <li key={cert.id} className="pl-0.5">
                          <span className="font-semibold text-black">{cert.name}</span> — {cert.issuer} ({cert.date})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Raw ATS Text Stream (Workday & Taleo Parser Simulator) */}
          {activeTab === 'rawText' && (
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono">
                  ATS Text Extraction Engine (Workday / Greenhouse / Taleo simulation)
                </span>
                <span className="text-emerald-400 font-mono">UTF-8 Clean Stream</span>
              </div>
              <div className="p-4 rounded-xl bg-black border border-zinc-800/80 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[700px] overflow-y-auto select-all">
                {rawAtsPlainText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
