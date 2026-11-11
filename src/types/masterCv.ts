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

export type BuiltInSkillCategoryKey =
  | 'languages'
  | 'frameworks'
  | 'databases'
  | 'devopsAndCloud'
  | 'toolsAndConcepts';

export const BUILT_IN_SKILL_CATEGORY_KEYS: BuiltInSkillCategoryKey[] = [
  'languages',
  'frameworks',
  'databases',
  'devopsAndCloud',
  'toolsAndConcepts',
];

export const DEFAULT_SKILL_CATEGORY_LABELS: Record<BuiltInSkillCategoryKey, string> = {
  languages: 'Languages',
  frameworks: 'Frameworks & Libraries',
  databases: 'Databases',
  devopsAndCloud: 'DevOps & Cloud',
  toolsAndConcepts: 'Architecture & Concepts',
};

export interface CustomSkillCategory {
  id: string;
  label: string;
  items: string[];
  isHidden?: boolean;
}

export interface CategorizedSkills {
  languages: string[];
  frameworks: string[];
  databases: string[];
  devopsAndCloud: string[];
  toolsAndConcepts: string[];
  categoryLabels?: Partial<Record<BuiltInSkillCategoryKey, string>>;
  hiddenCategories?: BuiltInSkillCategoryKey[];
  customCategories?: CustomSkillCategory[];
}

export function getVisibleSkillCategories(
  skills?: CategorizedSkills | null
): Array<{ label: string; items: string[] }> {
  if (!skills) return [];
  const hiddenSet = new Set<BuiltInSkillCategoryKey>(skills.hiddenCategories || []);
  const result: Array<{ label: string; items: string[] }> = [];

  for (const key of BUILT_IN_SKILL_CATEGORY_KEYS) {
    if (hiddenSet.has(key)) continue;
    const items = skills[key] || [];
    if (items.length === 0) continue;
    const label = skills.categoryLabels?.[key]?.trim() || DEFAULT_SKILL_CATEGORY_LABELS[key];
    result.push({ label, items });
  }

  for (const custom of skills.customCategories || []) {
    if (custom.isHidden) continue;
    if (!custom.label?.trim() || !custom.items || custom.items.length === 0) continue;
    result.push({ label: custom.label.trim(), items: custom.items });
  }

  return result;
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
    synthesizedBy: 'gemini' | 'openai-compatible' | 'deterministic';
    xyzBulletsCount: number;
  };
}
