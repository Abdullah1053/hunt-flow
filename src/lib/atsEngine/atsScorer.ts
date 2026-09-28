import { MasterCvProfile } from '@/types/masterCv';

export interface AtsCheckItem {
  id: string;
  category: 'Contact Info' | 'Section Nomenclature' | 'XYZ Action Verbs' | 'Length & Density' | 'ATS Typography & Structure';
  name: string;
  status: 'pass' | 'warning' | 'fail';
  score: number;
  maxScore: number;
  description: string;
  recommendation: string;
}

export interface AtsAuditResult {
  overallScore: number; // 0 - 100
  grade: 'ATS Certified Elite (90-100)' | 'ATS Strong Pass (80-89)' | 'Moderate (70-79)' | 'Needs Optimization (<70)';
  checks: AtsCheckItem[];
  categoryBreakdown: {
    contactInfo: { score: number; max: number };
    sections: { score: number; max: number };
    contentAndVerbs: { score: number; max: number };
    density: { score: number; max: number };
    structure: { score: number; max: number };
  };
  metrics: {
    totalWords: number;
    actionVerbCount: number;
    actionVerbPercentage: number;
    quantifiableMetricCount: number;
    quantifiableMetricPercentage: number;
    totalBullets: number;
    hasLinkedIn: boolean;
    hasGitHub: boolean;
    hasEmail: boolean;
    hasPhone: boolean;
  };
}

const POWER_ACTION_VERBS = [
  'architected', 'engineered', 'developed', 'designed', 'built', 'spearheaded',
  'optimized', 'automated', 'implemented', 'orchestrated', 'delivered', 'reduced',
  'increased', 'accelerated', 'scaled', 'mentored', 'integrated', 'streamlined',
  'refactored', 'formulated', 'led', 'deployed', 'programmed', 'constructed'
];

export function runAtsAudit(profile: MasterCvProfile): AtsAuditResult {
  const checks: AtsCheckItem[] = [];
  const { personalInfo, skills, experience, projects, education } = profile;

  // 1. Gather all bullets
  const allBullets: string[] = [
    ...experience.flatMap((e) => e.bullets || []),
    ...projects.flatMap((p) => p.bullets || []),
  ];
  const totalBullets = allBullets.length;

  // Count action verbs & quantifiable metrics
  let actionVerbCount = 0;
  let quantifiableCount = 0;

  allBullets.forEach((bullet) => {
    const trimmed = bullet.trim().toLowerCase();
    const firstWord = trimmed.split(/\s+/)[0]?.replace(/[^a-z]/g, '');
    if (firstWord && POWER_ACTION_VERBS.includes(firstWord)) {
      actionVerbCount++;
    }
    // Check for metrics (%, numbers, $, k, ms, x, latency, etc.)
    if (/(\d+%|\$\d+|\b\d+k\b|\b\d+x\b|\d+\+?|\blatency\b|\bthroughput\b|\buptime\b)/i.test(bullet)) {
      quantifiableCount++;
    }
  });

  const actionVerbPct = totalBullets > 0 ? Math.round((actionVerbCount / totalBullets) * 100) : 0;
  const quantifiablePct = totalBullets > 0 ? Math.round((quantifiableCount / totalBullets) * 100) : 0;

  // Total word count estimation
  const fullText = [
    personalInfo.fullName,
    personalInfo.headline,
    personalInfo.summary,
    personalInfo.location,
    ...Object.values(skills).flat(),
    ...experience.map((e) => `${e.company} ${e.role} ${e.bullets.join(' ')}`),
    ...projects.map((p) => `${p.title} ${p.role || ''} ${p.techStack.join(' ')} ${p.bullets.join(' ')}`),
    ...education.map((ed) => `${ed.institution} ${ed.degree} ${ed.field || ''}`),
  ].join(' ');

  const totalWords = fullText.trim().length > 0 ? fullText.trim().split(/\s+/).length : 0;

  // CHECK 1: Contact Information Completeness (Max: 15)
  const hasEmail = Boolean(personalInfo.email && personalInfo.email.includes('@'));
  const hasPhone = Boolean(personalInfo.phone && personalInfo.phone.trim().length >= 7);
  const hasLocation = Boolean(personalInfo.location && personalInfo.location.trim().length >= 3);
  const hasLinkedIn = Boolean(personalInfo.linkedin && personalInfo.linkedin.includes('linkedin'));
  const hasGitHub = Boolean(personalInfo.github && personalInfo.github.includes('github'));

  let contactScore = 0;
  if (personalInfo.fullName.trim().length > 2) contactScore += 3;
  if (hasEmail) contactScore += 3;
  if (hasPhone) contactScore += 3;
  if (hasLocation) contactScore += 3;
  if (hasLinkedIn || hasGitHub) contactScore += 3;

  checks.push({
    id: 'contact_info',
    category: 'Contact Info',
    name: 'Candidate Contact & Identity Details',
    status: contactScore === 15 ? 'pass' : contactScore >= 12 ? 'warning' : 'fail',
    score: contactScore,
    maxScore: 15,
    description: 'ATS parsers require valid name, direct email, phone, location, and professional links.',
    recommendation:
      contactScore === 15
        ? 'All key contact channels are verified and formatted for ATS machine reading.'
        : 'Ensure email, phone number, location, and a LinkedIn/GitHub URL are explicitly provided.',
  });

  // CHECK 2: Section Nomenclature (Max: 25)
  let sectionScore = 0;
  if (experience.length > 0) sectionScore += 7; // Work Experience
  if (education.length > 0) sectionScore += 6; // Education
  if (Object.values(skills).some((arr) => arr.length > 0)) sectionScore += 6; // Skills
  if (projects.length > 0) sectionScore += 6; // Projects

  checks.push({
    id: 'section_nomenclature',
    category: 'Section Nomenclature',
    name: 'Standard Section Heading Nomenclature',
    status: sectionScore === 25 ? 'pass' : 'warning',
    score: sectionScore,
    maxScore: 25,
    description: 'ATS parsers look for exact standard headings: Work Experience, Education, Technical Skills, and Projects.',
    recommendation:
      sectionScore === 25
        ? 'All standard ATS heading labels match Resumly/Faang recognition rules.'
        : 'Include entries for Work Experience, Education, Skills, and Projects to avoid parser gaps.',
  });

  // CHECK 3: Action Verbs & XYZ Formula Density (Max: 25)
  let contentScore = 0;
  if (actionVerbPct >= 75) contentScore += 13;
  else if (actionVerbPct >= 50) contentScore += 9;
  else contentScore += 5;

  if (quantifiablePct >= 70) contentScore += 12;
  else if (quantifiablePct >= 40) contentScore += 8;
  else contentScore += 4;

  checks.push({
    id: 'action_verbs_xyz',
    category: 'XYZ Action Verbs',
    name: 'Power Action Verbs & Measurable XYZ Impact',
    status: contentScore >= 21 ? 'pass' : contentScore >= 15 ? 'warning' : 'fail',
    score: contentScore,
    maxScore: 25,
    description: `${actionVerbPct}% of bullets start with power action verbs; ${quantifiablePct}% contain quantifiable metrics.`,
    recommendation:
      contentScore >= 21
        ? 'Strong XYZ formulation. High density of active verbs and quantifiable engineering results.'
        : 'Use HuntFlow’s "⚡ AI Optimize" button to convert remaining bullets into Google’s XYZ formula.',
  });

  // CHECK 4: Length & Word Density (Max: 20)
  let densityScore = 0;
  let densityStatus: 'pass' | 'warning' | 'fail' = 'pass';
  let densityRec = 'Resume word count is in the ideal 450–900 word sweet spot for high ATS readability.';

  if (totalWords >= 450 && totalWords <= 950) {
    densityScore = 20;
    densityStatus = 'pass';
  } else if (totalWords >= 350 && totalWords <= 1200) {
    densityScore = 15;
    densityStatus = 'warning';
    densityRec = totalWords < 450
      ? 'Document is slightly brief (under 450 words). Add 1-2 more bullet points or expand project details.'
      : 'Document is slightly long (>950 words). Consider tightening bullets for single/two-page compliance.';
  } else {
    densityScore = 10;
    densityStatus = 'fail';
    densityRec = 'Word count is out of optimal bounds. Aim for 450-900 words.';
  }

  checks.push({
    id: 'word_density',
    category: 'Length & Density',
    name: 'Word Count & Page Density Balance',
    status: densityStatus,
    score: densityScore,
    maxScore: 20,
    description: `Current word count: ${totalWords} words across all sections.`,
    recommendation: densityRec,
  });

  // CHECK 5: Typography & Document Structure (Max: 15)
  // Our template enforces single-column, standard Times-Roman, no tables, selectable text
  const structureScore = 15;
  checks.push({
    id: 'typography_structure',
    category: 'ATS Typography & Structure',
    name: 'Single-Column Layout & Text Layer Integrity',
    status: 'pass',
    score: structureScore,
    maxScore: 15,
    description: 'Single-column structure, standard system serif/sans typography, no image flattenings or nested tables.',
    recommendation: 'Compliant with Jake’s Resume / Harvard ATS vector specifications.',
  });

  const totalScore = contactScore + sectionScore + contentScore + densityScore + structureScore;

  let grade: AtsAuditResult['grade'] = 'ATS Certified Elite (90-100)';
  if (totalScore >= 90) grade = 'ATS Certified Elite (90-100)';
  else if (totalScore >= 80) grade = 'ATS Strong Pass (80-89)';
  else if (totalScore >= 70) grade = 'Moderate (70-79)';
  else grade = 'Needs Optimization (<70)';

  return {
    overallScore: totalScore,
    grade,
    checks,
    categoryBreakdown: {
      contactInfo: { score: contactScore, max: 15 },
      sections: { score: sectionScore, max: 25 },
      contentAndVerbs: { score: contentScore, max: 25 },
      density: { score: densityScore, max: 20 },
      structure: { score: structureScore, max: 15 },
    },
    metrics: {
      totalWords,
      actionVerbCount,
      actionVerbPercentage: actionVerbPct,
      quantifiableMetricCount: quantifiableCount,
      quantifiableMetricPercentage: quantifiablePct,
      totalBullets,
      hasLinkedIn,
      hasGitHub,
      hasEmail,
      hasPhone,
    },
  };
}
