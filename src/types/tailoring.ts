import { MasterCvProfile } from './masterCv';

export interface ExtractedJdKeywords {
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  seniority: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead / Architect' | 'Not Specified';
  detectedTools: string[];
}

export interface JobDescriptionData {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  rawText: string;
  extractedKeywords: ExtractedJdKeywords;
  targetUrl?: string;
  addedAt: string;
}

export interface KeywordMatchItem {
  keyword: string;
  inMaster: boolean;
  category: 'must-have' | 'nice-to-have' | 'tool' | 'concept';
  frequency: number;
}

export interface JdMatchAnalysis {
  matchPercentage: number; // 0 - 100
  grade: 'Strong Match (85-100%)' | 'Good Match (70-84%)' | 'Moderate Match (55-69%)' | 'Low Match (<55%)';
  matchedSkills: string[];
  missingSkills: string[];
  keywordBreakdown: KeywordMatchItem[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface TailoredDiffSummary {
  summaryChanged: boolean;
  skillsReordered: boolean;
  bulletsTailoredCount: number;
  matchScoreBefore: number;
  matchScoreAfter: number;
  highlightedKeywordsAdded: string[];
}

export interface TailoredCvProfile {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  tailoredAt: string;
  profile: MasterCvProfile;
  diffSummary: TailoredDiffSummary;
  analysis: JdMatchAnalysis;
}
