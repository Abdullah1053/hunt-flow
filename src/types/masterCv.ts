export interface PersonalInfo {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  github?: string;
  linkedin?: string;
  summary: string;
}

export interface CategorizedSkills {
  languages: string[];
  frameworks: string[];
  databases: string[];
  devopsAndCloud: string[];
  toolsAndConcepts: string[];
}

export interface WorkExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
  isHidden?: boolean;
  hiddenBullets?: number[];
}

export interface ProjectItem {
  id: string;
  title: string;
  role?: string;
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  startDate?: string;
  endDate?: string;
  impactMetric?: string;
  bullets: string[];
  isHidden?: boolean;
  hiddenBullets?: number[];
}

export function isItemVisible(item?: { isHidden?: boolean } | null): boolean {
  return !item?.isHidden;
}

export function getVisibleBullets(item?: { bullets: string[]; hiddenBullets?: number[] } | null): string[] {
  if (!item || !item.bullets) return [];
  if (!item.hiddenBullets || item.hiddenBullets.length === 0) return item.bullets;
  const hidden = new Set(item.hiddenBullets);
  return item.bullets.filter((_, idx) => !hidden.has(idx));
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements?: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface MasterCvProfile {
  personalInfo: PersonalInfo;
  skills: CategorizedSkills;
  experience: WorkExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  metadata: {
    generatedAt: string;
    lastEditedAt: string;
    version: number;
    synthesizedBy: 'gemini' | 'deterministic';
    xyzBulletsCount: number;
  };
}
