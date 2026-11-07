import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { detectSections } from '@/lib/corpusAggregator';
import { ParsedDocument } from '@/types/ingestion';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';

export async function GET() {
  try {
    const defaultProfile = getDefaultMasterProfile();
    const candidatePdfPath = path.join(process.cwd(), 'Cv info', 'ABDULLAH_ADEMI(1).pdf');
    let size = 5200;

    if (fs.existsSync(candidatePdfPath)) {
      size = fs.statSync(candidatePdfPath).size;
    }

    const upToDateSampleCorpus = `
ABDULLAH ADEMI
${defaultProfile.personalInfo.headline}
${defaultProfile.personalInfo.location} • ${defaultProfile.personalInfo.phone} • ${defaultProfile.personalInfo.email} • ${defaultProfile.personalInfo.github} • ${defaultProfile.personalInfo.website} • ${defaultProfile.personalInfo.linkedin}

PROFESSIONAL SUMMARY
${defaultProfile.personalInfo.summary}

EDUCATION
${defaultProfile.education[0]?.institution}    ${defaultProfile.education[0]?.startDate} – ${defaultProfile.education[0]?.endDate}
${defaultProfile.education[0]?.degree} in ${defaultProfile.education[0]?.field} — GPA: ${defaultProfile.education[0]?.gpa}

EXPERIENCE
${defaultProfile.experience[0]?.role}    ${defaultProfile.experience[0]?.startDate} – ${defaultProfile.experience[0]?.endDate}
${defaultProfile.experience[0]?.company}    ${defaultProfile.experience[0]?.location}
${defaultProfile.experience[0]?.bullets.map((b) => '• ' + b).join('\n')}

PROJECTS & TECHNICAL INITIATIVES
${defaultProfile.projects.map((p) => `${p.title} | ${p.techStack.join(', ')}    ${p.startDate} – ${p.endDate}\n${p.bullets.map((b) => '• ' + b).join('\n')}`).join('\n\n')}

TECHNICAL SKILLS
Languages: ${defaultProfile.skills.languages.join(', ')}
Frameworks & Libraries: ${defaultProfile.skills.frameworks.join(', ')}
Databases: ${defaultProfile.skills.databases.join(', ')}
DevOps & Cloud: ${defaultProfile.skills.devopsAndCloud.join(', ')}
Architecture & Concepts: ${defaultProfile.skills.toolsAndConcepts.join(', ')}
`.trim();

    const wordCount = upToDateSampleCorpus.split(/\s+/).length;
    const charCount = upToDateSampleCorpus.length;
    const sectionsDetected = detectSections(upToDateSampleCorpus);

    const doc: ParsedDocument = {
      id: `sample_doc_abdullah_${Date.now()}`,
      name: 'ABDULLAH_ADEMI.pdf',
      size,
      type: 'pdf',
      extractedText: upToDateSampleCorpus,
      pageCount: 1,
      charCount,
      wordCount,
      uploadedAt: new Date().toISOString(),
      sectionsDetected,
    };

    return NextResponse.json({
      document: doc,
      profile: defaultProfile,
      recommendedGithubUsername: 'abdullah1053',
      recommendedBio: defaultProfile.personalInfo.summary,
    });
  } catch (error) {
    console.error('Error loading sample CV:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load sample CV' },
      { status: 500 }
    );
  }
}
