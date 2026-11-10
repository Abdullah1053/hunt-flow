import { CareerBullet } from '@/types/careerTrack';
import { MasterCvProfile } from '@/types/masterCv';

export const DEFAULT_TAILOR_PROMPT_INSTRUCTIONS = `You are an elite Executive ATS Resume Architect & Career Strategist.
Tailor the candidate's Base CV for the Target Job Application using ONLY the verified facts in the Career Knowledge Base and Base CV.

Strict Rules:
1. Headline: Craft a sharp, ATS-aligned professional headline matching the target job title and core tech stack.
2. Summary: Write a punchy 3-4 line executive summary highlighting verified experience, quantified outcomes, and JD-critical keywords.
3. Skills: Re-order skills inside each category (languages, frameworks, databases, devopsAndCloud, toolsAndConcepts) so keywords requested in the JD appear first. Only list skills grounded in the candidate's verified profile or active knowledge bullets.
4. Experience & Projects: Rewrite and prioritize bullets using Google's XYZ formula ("Accomplished [X], as measured by [Y], by doing [Z]") tailored to the target job requirements and user notes. Keep the CV crisp enough for a 1-page A4 layout.
5. Factual Integrity: NEVER invent companies, job titles, dates, degrees, certifications, or fake metrics.`;

export function formatActiveCareerBullets(bullets: CareerBullet[]): string {
  if (!bullets || bullets.length === 0) {
    return '(No active career knowledge bullets selected. Rely strictly on the Selected Base CV below.)';
  }

  return bullets
    .map((b) => {
      const tag = b.contextLabel ? `[${b.category.toUpperCase()} | ${b.contextLabel}]` : `[${b.category.toUpperCase()}]`;
      return `- ${tag} ${b.bulletText}`;
    })
    .join('\n');
}

/**
 * Strips immutable personal contact & social fields before sending CV to AI.
 */
export function buildMutableBaseCv(profile: MasterCvProfile) {
  return {
    headline: profile.personalInfo.headline,
    summary: profile.personalInfo.summary,
    skills: profile.skills,
    experience: profile.experience,
    projects: profile.projects,
    education: profile.education,
    certifications: profile.certifications,
  };
}

export interface AssembleTailorPromptParams {
  customInstructions?: string;
  jobTitle: string;
  jobDescription: string;
  userNotes?: string;
  activeBullets: CareerBullet[];
  baseCv: MasterCvProfile;
}

export function assembleTailorPrompt({
  customInstructions,
  jobTitle,
  jobDescription,
  userNotes,
  activeBullets,
  baseCv,
}: AssembleTailorPromptParams): string {
  const instructions =
    customInstructions && customInstructions.trim().length > 0
      ? customInstructions.trim()
      : DEFAULT_TAILOR_PROMPT_INSTRUCTIONS;

  const formattedActiveCareerBullets = formatActiveCareerBullets(activeBullets);
  const baseCvMutableJson = JSON.stringify(buildMutableBaseCv(baseCv), null, 2);

  return `=== SYSTEM / ROLE INSTRUCTIONS ===
${instructions}

=== TARGET JOB APPLICATION ===
Target Job Title: ${jobTitle.trim()}
Target Job Description:
${jobDescription.trim()}

=== USER SPECIAL NOTES & DIRECTIVES ===
${userNotes && userNotes.trim().length > 0 ? userNotes.trim() : 'None provided.'}

=== CANDIDATE VERIFIED CAREER KNOWLEDGE BASE (BULLETS) ===
Use ONLY the verified facts and achievements below along with the Base CV. Do NOT invent companies, dates, or fake metrics:
${formattedActiveCareerBullets}

=== SELECTED BASE CV TO EDIT (MUTABLE SECTIONS ONLY) ===
${baseCvMutableJson}

=== STRICT OUTPUT FORMAT CONTRACT (LOCKED) ===
Return ONLY a valid JSON object matching this exact TypeScript schema:
{
  "headline": "string (Tailored professional headline for the target job title)",
  "summary": "string (3-4 line executive ATS summary tailored to the job)",
  "skills": {
    "languages": ["string"],
    "frameworks": ["string"],
    "databases": ["string"],
    "devopsAndCloud": ["string"],
    "toolsAndConcepts": ["string"]
  },
  "experience": [
    {
      "id": "string",
      "company": "string",
      "role": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "isCurrent": true,
      "bullets": ["string (XYZ formula bullets tailored to JD)"]
    }
  ],
  "projects": [
    {
      "id": "string",
      "title": "string",
      "role": "string",
      "techStack": ["string"],
      "githubUrl": "string",
      "demoUrl": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "id": "string",
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string",
      "achievements": ["string"]
    }
  ],
  "certifications": [
    {
      "id": "string",
      "name": "string",
      "issuer": "string",
      "date": "string",
      "url": "string"
    }
  ]
}
Do NOT wrap in markdown code fences if possible, and do NOT include personal contact fields.`;
}

