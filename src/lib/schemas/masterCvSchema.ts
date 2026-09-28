import { z } from 'zod';

export const PersonalInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  headline: z.string().default('Full-Stack Software Engineer'),
  email: z.string().email().or(z.string()),
  phone: z.string().default(''),
  location: z.string().default(''),
  website: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  summary: z.string().default(''),
});

export const CategorizedSkillsSchema = z.object({
  languages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  devopsAndCloud: z.array(z.string()).default([]),
  toolsAndConcepts: z.array(z.string()).default([]),
});

export const WorkExperienceItemSchema = z.object({
  id: z.string().default(() => `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role title is required'),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default('Present'),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const ProjectItemSchema = z.object({
  id: z.string().default(() => `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
  title: z.string().min(1, 'Project title is required'),
  role: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  githubUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  impactMetric: z.string().optional(),
  bullets: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  id: z.string().default(() => `edu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().optional(),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  gpa: z.string().optional(),
  achievements: z.array(z.string()).default([]),
});

export const CertificationItemSchema = z.object({
  id: z.string().default(() => `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
  name: z.string().min(1),
  issuer: z.string().default(''),
  date: z.string().default(''),
  url: z.string().optional(),
});

export const MasterCvSchema = z.object({
  personalInfo: PersonalInfoSchema,
  skills: CategorizedSkillsSchema,
  experience: z.array(WorkExperienceItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  metadata: z
    .object({
      generatedAt: z.string().default(() => new Date().toISOString()),
      lastEditedAt: z.string().default(() => new Date().toISOString()),
      version: z.number().default(1),
      synthesizedBy: z.enum(['gemini', 'deterministic']).default('gemini'),
      xyzBulletsCount: z.number().default(0),
    })
    .default({
      generatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      version: 1,
      synthesizedBy: 'gemini',
      xyzBulletsCount: 0,
    }),
});

export type MasterCvSchemaType = z.infer<typeof MasterCvSchema>;
