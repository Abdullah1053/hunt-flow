export type CareerBulletCategory =
  | 'experience'
  | 'project'
  | 'skill_tech'
  | 'education_cert'
  | 'general';

export interface CareerBullet {
  id: string;
  category: CareerBulletCategory;
  contextLabel?: string;
  bulletText: string;
  isActiveForAi: boolean;
  createdAt: string;
}

export const CAREER_BULLET_CATEGORY_CONFIG: Record<
  CareerBulletCategory,
  { label: string; shortLabel: string; badgeClass: string }
> = {
  experience: {
    label: 'Work Experience',
    shortLabel: 'Experience',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  project: {
    label: 'Project & System',
    shortLabel: 'Project',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  skill_tech: {
    label: 'Skills & Tech Stack',
    shortLabel: 'Skill / Tech',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  education_cert: {
    label: 'Education & Certs',
    shortLabel: 'Edu / Cert',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  general: {
    label: 'General Fact',
    shortLabel: 'General',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
};

export type CareerTrackCategory =
  | 'work_experience'
  | 'project'
  | 'infrastructure_security'
  | 'leadership_mentorship'
  | 'certification_award'
  | 'general_achievement';

export interface CareerTrackLinks {
  githubUrl?: string;
  demoUrl?: string;
  certificateUrl?: string;
}

export interface CareerTrackEntry {
  id: string;
  category: CareerTrackCategory;
  title: string;
  organization: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  rawNotes?: string;
  bullets: string[];
  techTags: string[];
  links?: CareerTrackLinks;
  createdAt: string;
  updatedAt: string;
}

export const CAREER_CATEGORY_CONFIG: Record<
  CareerTrackCategory,
  { label: string; shortLabel: string; color: string; badgeClass: string }
> = {
  work_experience: {
    label: 'Work Experience',
    shortLabel: 'Experience',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  project: {
    label: 'Project & System',
    shortLabel: 'Projects',
    color: 'indigo',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  infrastructure_security: {
    label: 'Infra & Security',
    shortLabel: 'Infra',
    color: 'cyan',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  leadership_mentorship: {
    label: 'Leadership & Mentorship',
    shortLabel: 'Leadership',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  certification_award: {
    label: 'Certifications & Awards',
    shortLabel: 'Certifications',
    color: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  general_achievement: {
    label: 'General Achievement',
    shortLabel: 'Achievements',
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
};

