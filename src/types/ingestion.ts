export interface GitHubUserProfile {
  login: string;
  id: number;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  location: string | null;
  blog: string | null;
  company: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  is_fork: boolean;
  is_selected: boolean;
  readme_summary?: string | null;
  default_branch?: string;
}

export interface ParsedDocument {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'unknown';
  extractedText: string;
  pageCount?: number;
  charCount: number;
  wordCount: number;
  uploadedAt: string;
  sectionsDetected: string[];
}

export interface ExternalLink {
  id: string;
  url: string;
  title: string;
  snippet: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
  fetchedAt: string;
}

export interface IngestionMetrics {
  totalSources: number;
  totalWords: number;
  totalCharacters: number;
  githubReposCount: number;
  documentsCount: number;
  linksCount: number;
  detectedKeywords: string[];
}

export interface RawStagingPayload {
  candidateName: string;
  github: {
    user: GitHubUserProfile | null;
    repos: GitHubRepoItem[];
    selectedRepoIds: number[];
    aggregatedSummary: string;
  };
  documents: ParsedDocument[];
  links: ExternalLink[];
  manualNotes: string;
  aggregatedCorpus: string;
  lastUpdated: string;
  metrics: IngestionMetrics;
}
