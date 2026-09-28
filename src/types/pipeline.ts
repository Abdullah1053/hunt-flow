import { MasterCvProfile } from './masterCv';

export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'screening'
  | 'technical'
  | 'offer'
  | 'archived';

export interface TimelineEvent {
  id: string;
  status: ApplicationStatus;
  date: string;
  note: string;
}

export interface JobApplicationRecord {
  id: string;
  company: string;
  jobTitle: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  salaryRange?: string;
  jobUrl?: string;
  status: ApplicationStatus;
  matchScore: number;
  appliedDate?: string;
  lastFollowUp?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  interviewNotes?: string;
  timeline: TimelineEvent[];
  tailoredCvSnapshot: MasterCvProfile;
  createdAt: string;
  updatedAt: string;
}

export interface StageDefinition {
  id: ApplicationStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  description: string;
}

export interface PipelineMetrics {
  totalCount: number;
  appliedCount: number;
  screeningCount: number;
  technicalCount: number;
  offerCount: number;
  archivedCount: number;
  interviewRate: number; // % that made it to screening/technical/offer from applied
  offerRate: number;
  averageMatchScore: number;
  topSkillsInDemand: { skill: string; count: number }[];
}
