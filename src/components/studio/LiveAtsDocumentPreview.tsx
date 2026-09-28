'use client';

import React, { useRef } from 'react';
import { MasterCvProfile } from '@/types/masterCv';
import { Printer, Download, Eye, ExternalLink } from 'lucide-react';

interface LiveAtsDocumentPreviewProps {
  profile: MasterCvProfile;
}

export const LiveAtsDocumentPreview: React.FC<LiveAtsDocumentPreviewProps> = ({ profile }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const { personalInfo, skills, experience, projects, education, certifications } = profile;

  // Format contact info items with clean separators
  const contactParts: { text: string; href?: string }[] = [];
  if (personalInfo.location) contactParts.push({ text: personalInfo.location });
  if (personalInfo.phone) contactParts.push({ text: personalInfo.phone, href: `tel:${personalInfo.phone}` });
  if (personalInfo.email) contactParts.push({ text: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.github) contactParts.push({ text: personalInfo.github.replace(/^https?:\/\//, ''), href: personalInfo.github });
  if (personalInfo.website) contactParts.push({ text: personalInfo.website.replace(/^https?:\/\//, ''), href: personalInfo.website });
  if (personalInfo.linkedin) contactParts.push({ text: personalInfo.linkedin.replace(/^https?:\/\//, ''), href: personalInfo.linkedin });

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Eye className="h-4 w-4 text-indigo-400" />
          <span>ATS Document Preview (Jake&apos;s Resume / Harvard Standard)</span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition shadow-sm"
        >
          <Printer className="h-3.5 w-3.5" />
          Print / Save PDF
        </button>
      </div>

      {/* Printable Sheet */}
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
                  {idx < contactParts.length - 1 && <span className="text-zinc-400">|</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* SUMMARY */}
          {personalInfo.summary && (
            <div className="mt-3">
              <h2 className="text-[12px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                Summary
              </h2>
              <p className="text-[11px] font-sans text-zinc-800 leading-relaxed text-justify">
                {personalInfo.summary}
              </p>
            </div>
          )}

          {/* EDUCATION */}
          {education.length > 0 && (
            <div className="mt-3.5">
              <h2 className="text-[12px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="text-[11px]">
                    <div className="flex justify-between items-baseline font-bold text-black">
                      <span>{edu.institution}</span>
                      <span className="font-normal font-sans text-[10px] text-zinc-800">
                        {edu.startDate} – {edu.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline italic text-zinc-800">
                      <span>
                        {edu.degree}
                        {edu.field ? `; ${edu.field}` : ''}
                      </span>
                      {edu.gpa && (
                        <span className="not-italic text-[10px] text-zinc-700 font-sans">
                          {edu.gpa}
                        </span>
                      )}
                    </div>
                    {edu.achievements && edu.achievements.length > 0 && (
                      <ul className="list-disc ml-5 mt-1 space-y-0.5 text-[10.5px] text-zinc-800">
                        {edu.achievements.map((ach, aIdx) => (
                          <li key={aIdx}>{ach}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WORK EXPERIENCE */}
          {experience.length > 0 && (
            <div className="mt-3.5">
              <h2 className="text-[12px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                Work Experience
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="text-[11px]">
                    <div className="flex justify-between items-baseline font-bold text-black">
                      <span>{exp.company}</span>
                      <span className="font-normal font-sans text-[10px] text-zinc-800">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline italic text-zinc-800 mb-1">
                      <span>{exp.role}</span>
                      <span className="not-italic text-[10px] text-zinc-700 font-sans">
                        {exp.location}
                      </span>
                    </div>
                    <ul className="list-disc ml-5 space-y-1 text-[10.5px] text-zinc-900 leading-normal">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="text-justify">
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
            <div className="mt-3.5">
              <h2 className="text-[12px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                Key Projects
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="text-[11px]">
                    <div className="flex justify-between items-baseline font-bold text-black">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{proj.title}</span>
                        {proj.techStack.length > 0 && (
                          <span className="font-normal italic text-zinc-700 text-[10px]">
                            | {proj.techStack.join(', ')}
                          </span>
                        )}
                      </div>
                      {proj.startDate && (
                        <span className="font-normal font-sans text-[10px] text-zinc-800 shrink-0">
                          {proj.startDate} – {proj.endDate || 'Present'}
                        </span>
                      )}
                    </div>
                    {proj.impactMetric && (
                      <p className="text-[10px] font-sans font-semibold text-zinc-700 italic mt-0.5">
                        Impact: {proj.impactMetric}
                      </p>
                    )}
                    <ul className="list-disc ml-5 space-y-1 text-[10.5px] text-zinc-900 leading-normal mt-1">
                      {proj.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="text-justify">
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
          <div className="mt-3.5">
            <h2 className="text-[12px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
              Technical Skills
            </h2>
            <div className="text-[10.5px] space-y-1 text-zinc-900 font-sans">
              {skills.languages.length > 0 && (
                <div>
                  <strong className="text-black">Languages:</strong>{' '}
                  {skills.languages.join(', ')}
                </div>
              )}
              {skills.frameworks.length > 0 && (
                <div>
                  <strong className="text-black">Frameworks & Libraries:</strong>{' '}
                  {skills.frameworks.join(', ')}
                </div>
              )}
              {skills.databases.length > 0 && (
                <div>
                  <strong className="text-black">Databases & Optimization:</strong>{' '}
                  {skills.databases.join(', ')}
                </div>
              )}
              {skills.devopsAndCloud.length > 0 && (
                <div>
                  <strong className="text-black">DevOps & Infrastructure:</strong>{' '}
                  {skills.devopsAndCloud.join(', ')}
                </div>
              )}
              {skills.toolsAndConcepts.length > 0 && (
                <div>
                  <strong className="text-black">Architecture & Concepts:</strong>{' '}
                  {skills.toolsAndConcepts.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* CERTIFICATIONS */}
          {certifications.length > 0 && (
            <div className="mt-3.5">
              <h2 className="text-[12px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                Certifications & Achievements
              </h2>
              <ul className="list-disc ml-5 text-[10.5px] text-zinc-900 font-sans space-y-0.5">
                {certifications.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name}</strong> — {c.issuer} ({c.date})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
