import {
  GitHubUserProfile,
  GitHubRepoItem,
  ParsedDocument,
  ExternalLink,
  IngestionMetrics,
  RawStagingPayload,
} from '@/types/ingestion';

const KNOWN_KEYWORDS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Node.js', 'Express', 'Python',
  'Django', 'Flask', 'FastAPI', 'Laravel', 'PHP', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Git', 'Linux', 'RESTful API',
  'GraphQL', 'TailwindCSS', 'Microservices', 'System Architecture', 'Agile', 'DevOps', 'Nginx',
  'Webhooks', 'Real-Time', 'AI/ML', 'Machine Learning', 'Gemini', 'LLM', 'Full-Stack'
];

export function detectSections(text: string): string[] {
  const sections: string[] = [];
  const patterns: [string, RegExp][] = [
    ['Summary / Objective', /(summary|professional summary|about me|profile|objective)/i],
    ['Work Experience', /(work experience|employment|professional experience|experience)/i],
    ['Projects', /(projects|key projects|portfolio|showcase projects)/i],
    ['Education', /(education|academic background|degree|university)/i],
    ['Technical Skills', /(technical skills|skills|technologies|proficiencies|tech stack)/i],
    ['Certifications', /(certifications|licenses|credentials|awards)/i],
    ['Contact Info', /(email|phone|github|linkedin|location|address)/i],
  ];

  for (const [name, regex] of patterns) {
    if (regex.test(text)) {
      sections.push(name);
    }
  }

  return sections;
}

export function extractDetectedKeywords(corpus: string): string[] {
  const matched = new Set<string>();
  const lowerCorpus = corpus.toLowerCase();

  for (const kw of KNOWN_KEYWORDS) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lowerCorpus)) {
      matched.add(kw);
    }
  }

  return Array.from(matched);
}

export function buildAggregatedCorpus(
  githubUser: GitHubUserProfile | null,
  repos: GitHubRepoItem[],
  selectedRepoIds: number[],
  documents: ParsedDocument[],
  links: ExternalLink[],
  manualNotes: string
): { corpus: string; metrics: IngestionMetrics } {
  const parts: string[] = [];

  // 1. GitHub Data
  if (githubUser) {
    parts.push('=== GITHUB PROFILE ===');
    parts.push(`Name: ${githubUser.name || githubUser.login}`);
    parts.push(`GitHub Handle: @${githubUser.login}`);
    if (githubUser.bio) parts.push(`Bio: ${githubUser.bio}`);
    if (githubUser.location) parts.push(`Location: ${githubUser.location}`);
    if (githubUser.company) parts.push(`Company: ${githubUser.company}`);
    if (githubUser.blog) parts.push(`Website / Blog: ${githubUser.blog}`);
    parts.push(`Public Repositories: ${githubUser.public_repos}`);
    parts.push(`Followers: ${githubUser.followers}`);
    parts.push('');
  }

  const selectedRepos = repos.filter((r) => selectedRepoIds.includes(r.id));
  if (selectedRepos.length > 0) {
    parts.push('=== GITHUB REPOSITORIES (SELECTED SHOWCASE) ===');
    selectedRepos.forEach((repo, idx) => {
      parts.push(`[Repo #${idx + 1}] ${repo.name}`);
      if (repo.description) parts.push(`Description: ${repo.description}`);
      if (repo.language) parts.push(`Primary Language: ${repo.language}`);
      if (repo.topics && repo.topics.length > 0) {
        parts.push(`Topics: ${repo.topics.join(', ')}`);
      }
      parts.push(`Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count}`);
      parts.push(`URL: ${repo.html_url}`);
      if (repo.readme_summary) {
        parts.push(`README Summary:\n${repo.readme_summary}`);
      }
      parts.push('');
    });
  }

  // 2. Parsed Documents (CVs, Resumes)
  if (documents.length > 0) {
    parts.push('=== UPLOADED DOCUMENTS & RESUMES ===');
    documents.forEach((doc, idx) => {
      parts.push(`[Document #${idx + 1}: ${doc.name} (${doc.type.toUpperCase()}, ${doc.wordCount} words)]`);
      if (doc.sectionsDetected.length > 0) {
        parts.push(`Detected Sections: ${doc.sectionsDetected.join(', ')}`);
      }
      parts.push('--- Document Content ---');
      parts.push(doc.extractedText);
      parts.push('------------------------');
      parts.push('');
    });
  }

  // 3. External Links
  const successfulLinks = links.filter((l) => l.status === 'success' && l.snippet);
  if (successfulLinks.length > 0) {
    parts.push('=== EXTERNAL LINKS & PORTFOLIOS ===');
    successfulLinks.forEach((link, idx) => {
      parts.push(`[Link #${idx + 1}] ${link.title || link.url}`);
      parts.push(`URL: ${link.url}`);
      parts.push(`Extracted Snippet: ${link.snippet}`);
      parts.push('');
    });
  }

  // 4. Freeform Notes
  if (manualNotes && manualNotes.trim().length > 0) {
    parts.push('=== CANDIDATE ADDITIONAL NOTES & BIO ===');
    parts.push(manualNotes.trim());
    parts.push('');
  }

  const corpus = parts.join('\n');
  const words = corpus.trim().length > 0 ? corpus.trim().split(/\s+/).length : 0;
  const chars = corpus.length;
  const keywords = extractDetectedKeywords(corpus);

  const totalSources =
    (githubUser ? 1 : 0) +
    selectedRepos.length +
    documents.length +
    successfulLinks.length +
    (manualNotes.trim().length > 0 ? 1 : 0);

  const metrics: IngestionMetrics = {
    totalSources,
    totalWords: words,
    totalCharacters: chars,
    githubReposCount: selectedRepos.length,
    documentsCount: documents.length,
    linksCount: successfulLinks.length,
    detectedKeywords: keywords,
  };

  return { corpus, metrics };
}

export function synthesizePayload(
  githubUser: GitHubUserProfile | null,
  repos: GitHubRepoItem[],
  selectedRepoIds: number[],
  documents: ParsedDocument[],
  links: ExternalLink[],
  manualNotes: string
): RawStagingPayload {
  const { corpus, metrics } = buildAggregatedCorpus(
    githubUser,
    repos,
    selectedRepoIds,
    documents,
    links,
    manualNotes
  );

  let candidateName = 'Unknown Candidate';
  if (githubUser?.name) {
    candidateName = githubUser.name;
  } else if (documents.length > 0) {
    // Try to guess from the first document lines
    const firstLines = documents[0].extractedText.split('\n').filter((l) => l.trim().length > 0);
    if (firstLines.length > 0 && firstLines[0].length < 50) {
      candidateName = firstLines[0].trim();
    }
  }

  return {
    candidateName,
    github: {
      user: githubUser,
      repos,
      selectedRepoIds,
      aggregatedSummary: `${repos.filter((r) => selectedRepoIds.includes(r.id)).length} showcase repositories selected`,
    },
    documents,
    links,
    manualNotes,
    aggregatedCorpus: corpus,
    lastUpdated: new Date().toISOString(),
    metrics,
  };
}
