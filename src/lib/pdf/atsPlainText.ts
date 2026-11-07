import { MasterCvProfile, isItemVisible, getVisibleBullets } from '@/types/masterCv';

/**
 * Generates a deterministic, 100% ATS-standard plain text representation
 * of the candidate's CV.
 *
 * Rules:
 * - Standard uppercase section headers:
 *   PROFESSIONAL SUMMARY, WORK EXPERIENCE, PROJECTS, EDUCATION, TECHNICAL SKILLS, CERTIFICATIONS
 * - Clean ASCII bullets (• or -)
 * - Pipe-separated contact header (Location | Phone | Email | GitHub | LinkedIn | Website)
 * - Clearly formatted role, company, and date lines
 * - Excludes hidden jobs/projects (isItemVisible) and hidden bullets (getVisibleBullets)
 */
export function generateAtsPlainText(profile: MasterCvProfile): string {
  const {
    personalInfo = {} as any,
    skills = {} as any,
    experience = [],
    projects = [],
    education = [],
    certifications = [],
  } = profile || {};

  const sections: string[] = [];

  // 1. Header (Name, Headline, Contact info)
  const headerLines: string[] = [];
  if (personalInfo.fullName) {
    headerLines.push(personalInfo.fullName.trim().toUpperCase());
  }
  if (personalInfo.headline) {
    headerLines.push(personalInfo.headline.trim());
  }

  const contacts: string[] = [];
  if (personalInfo.location) contacts.push(personalInfo.location.trim());
  if (personalInfo.phone) contacts.push(personalInfo.phone.trim());
  if (personalInfo.email) contacts.push(personalInfo.email.trim());
  if (personalInfo.github) contacts.push(personalInfo.github.trim());
  if (personalInfo.linkedin) contacts.push(personalInfo.linkedin.trim());
  if (personalInfo.website) contacts.push(personalInfo.website.trim());

  if (contacts.length > 0) {
    headerLines.push(contacts.join(' | '));
  }

  if (headerLines.length > 0) {
    sections.push(headerLines.join('\n'));
  }

  // 2. PROFESSIONAL SUMMARY
  if (personalInfo.summary?.trim()) {
    sections.push(`PROFESSIONAL SUMMARY\n${personalInfo.summary.trim()}`);
  }

  // 3. WORK EXPERIENCE
  const visibleExp = (experience || []).filter(isItemVisible);
  if (visibleExp.length > 0) {
    const expLines: string[] = ['WORK EXPERIENCE'];
    for (const exp of visibleExp) {
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
      const headerParts = [
        exp.role,
        exp.company,
        exp.location,
        dates,
      ].filter(Boolean);
      expLines.push(headerParts.join(' | '));

      const bullets = getVisibleBullets(exp);
      for (const b of bullets) {
        expLines.push(`• ${b.trim()}`);
      }
      expLines.push('');
    }
    sections.push(expLines.join('\n').trim());
  }

  // 4. PROJECTS
  const visibleProjects = (projects || []).filter(isItemVisible);
  if (visibleProjects.length > 0) {
    const projLines: string[] = ['PROJECTS'];
    for (const proj of visibleProjects) {
      let header = proj.title;
      if (proj.role) header += ` — ${proj.role}`;
      if (proj.techStack && proj.techStack.length > 0) {
        header += ` | ${proj.techStack.join(', ')}`;
      }
      const dates = [proj.startDate, proj.endDate].filter(Boolean).join(' - ');
      if (dates) header += ` | ${dates}`;
      projLines.push(header);

      const links: string[] = [];
      if (proj.githubUrl) links.push(`Code: ${proj.githubUrl}`);
      if (proj.demoUrl) links.push(`Demo: ${proj.demoUrl}`);
      if (links.length > 0) {
        projLines.push(links.join(' | '));
      }

      const bullets = getVisibleBullets(proj);
      for (const b of bullets) {
        projLines.push(`• ${b.trim()}`);
      }
      projLines.push('');
    }
    sections.push(projLines.join('\n').trim());
  }

  // 5. EDUCATION
  if (education && education.length > 0) {
    const eduLines: string[] = ['EDUCATION'];
    for (const edu of education) {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      let degLine = `${edu.institution} | ${edu.degree}`;
      if (edu.field) degLine += ` in ${edu.field}`;
      if (edu.gpa) degLine += ` | GPA: ${edu.gpa}`;
      if (dates) degLine += ` | ${dates}`;
      eduLines.push(degLine);

      if (edu.achievements && edu.achievements.length > 0) {
        for (const ach of edu.achievements) {
          eduLines.push(`• ${ach.trim()}`);
        }
      }
      eduLines.push('');
    }
    sections.push(eduLines.join('\n').trim());
  }

  // 6. TECHNICAL SKILLS
  const skillCategories = [
    { label: 'Languages', items: skills?.languages || [] },
    { label: 'Frameworks & Libraries', items: skills?.frameworks || [] },
    { label: 'Databases', items: skills?.databases || [] },
    { label: 'DevOps & Cloud', items: skills?.devopsAndCloud || [] },
    { label: 'Architecture & Concepts', items: skills?.toolsAndConcepts || [] },
  ].filter((c) => c.items && c.items.length > 0);

  if (skillCategories.length > 0) {
    const skillLines: string[] = ['TECHNICAL SKILLS'];
    for (const cat of skillCategories) {
      skillLines.push(`${cat.label}: ${cat.items.join(', ')}`);
    }
    sections.push(skillLines.join('\n'));
  }

  // 7. CERTIFICATIONS
  if (certifications && certifications.length > 0) {
    const certLines: string[] = ['CERTIFICATIONS'];
    for (const cert of certifications) {
      let line = `• ${cert.name} — ${cert.issuer}`;
      if (cert.date) line += ` (${cert.date})`;
      if (cert.url) line += ` | ${cert.url}`;
      certLines.push(line);
    }
    sections.push(certLines.join('\n'));
  }

  return sections.join('\n\n');
}

