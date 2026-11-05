import { MasterCvProfile } from './masterCv';

export type JobApplicationStatus = 'applied' | 'interviewing' | 'offer' | 'rejected';

// Backward compatibility alias
export type ApplicationStatus = JobApplicationStatus;

export interface JobApplicationRecord {
  id: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  jobUrl: string;
  submittedPdfDataUrl?: string; // Base64 data URL (data:application/pdf;base64,...)
  submittedPdfFileName?: string;
  tailoredCvSnapshot?: MasterCvProfile;
  status: JobApplicationStatus;
  appliedDate: string;
}

export interface StatusBadgeConfig {
  value: JobApplicationStatus;
  label: string;
  badgeClass: string;
  dotColor: string;
}

export const APPLICATION_STATUS_CONFIG: Record<JobApplicationStatus, StatusBadgeConfig> = {
  applied: {
    value: 'applied',
    label: 'Applied',
    badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
  interviewing: {
    value: 'interviewing',
    label: 'Interviewing',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  offer: {
    value: 'offer',
    label: 'Offer Received',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  rejected: {
    value: 'rejected',
    label: 'Rejected',
    badgeClass: 'bg-zinc-800/80 text-zinc-400 border-zinc-700',
    dotColor: 'bg-zinc-500',
  },
};
