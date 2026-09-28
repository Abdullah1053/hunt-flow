import { MasterCvProfile } from '@/types/masterCv';
import {
  JobDescriptionData,
  ExtractedJdKeywords,
  JdMatchAnalysis,
  KeywordMatchItem,
} from '@/types/tailoring';

const TECH_KEYWORD_TAXONOMY = [
  // Languages
  'php', 'typescript', 'javascript', 'python', 'sql', 'dart', 'c++', 'html', 'css', 'go', 'java', 'rust',
  // Frameworks & Libraries
  'laravel', 'vue.js', 'vue', 'next.js', 'react', 'node.js', 'express', 'nestjs', 'tailwind', 'tailwindcss',
  'symfony', 'django', 'fastapi', 'spring boot', 'flutter',
  // Databases & Caching
  'postgresql', 'mysql', 'redis', 'mongodb', 'elasticsearch', 'sqlite', 'database design', 'query optimization',
  // Cloud & DevOps
  'docker', 'kubernetes', 'ci/cd', 'github actions', 'aws', 'gcp', 'linux', 'nginx', 'caddy', 'pm2', 'terraform',
  // Architecture & Concepts
  'rest', 'restful api', 'restful apis', 'webhooks', 'microservices', 'event-driven', 'real-time',
  'websockets', 'system architecture', 'agile', 'scrum', 'unit testing', 'test-driven development',
  'high throughput', 'caching', 'concurrency', 'scalability'
];

export function extractJdKeywords(rawText: string): ExtractedJdKeywords {
  const lower = rawText.toLowerCase();
  const detected = new Set<string>();

  TECH_KEYWORD_TAXONOMY.forEach((kw) => {
    // Word boundary search
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      // Capitalize nicely
      detected.add(capitalizeKeyword(kw));
    }
  });

  const allDetected = Array.from(detected);

  // Split into must-have vs nice-to-have based on context
  const mustHave: string[] = [];
  const niceToHave: string[] = [];

  allDetected.forEach((tech) => {
    const techLower = tech.toLowerCase();
    const isPreferred =
      lower.includes(`nice to have: ${techLower}`) ||
      lower.includes(`preferred: ${techLower}`) ||
      lower.includes(`plus: ${techLower}`) ||
      lower.includes(`bonus: ${techLower}`);

    if (isPreferred) {
      niceToHave.push(tech);
    } else {
      mustHave.push(tech);
    }
  });

  // Extract seniority
  let seniority: ExtractedJdKeywords['seniority'] = 'Mid-Level';
  if (/(\bsenior\b|\bsr\.?\b|\b5\+ years\b|\b6\+ years\b)/i.test(rawText)) {
    seniority = 'Senior';
  } else if (/(\blead\b|\barchitect\b|\bprincipal\b|\bstaff\b)/i.test(rawText)) {
    seniority = 'Lead / Architect';
  } else if (/(\bjunior\b|\bjr\.?\b|\bentry\b|\bassociate\b)/i.test(rawText)) {
    seniority = 'Junior';
  }

  // Extract key responsibilities (lines starting with dash, bullet, or action verb)
  const lines = rawText.split('\n');
  const responsibilities: string[] = [];
  lines.forEach((l) => {
    const t = l.trim();
    if (/^[-*•]\s+/.test(t) && t.length > 25) {
      responsibilities.push(t.replace(/^[-*•]\s+/, ''));
    }
  });

  return {
    mustHaveSkills: mustHave.length > 0 ? mustHave : allDetected.slice(0, 8),
    niceToHaveSkills: niceToHave.length > 0 ? niceToHave : allDetected.slice(8, 12),
    responsibilities: responsibilities.slice(0, 6),
    seniority,
    detectedTools: allDetected,
  };
}

function capitalizeKeyword(kw: string): string {
  const map: Record<string, string> = {
    'php': 'PHP',
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
    'sql': 'SQL',
    'html': 'HTML5',
    'css': 'CSS3',
    'c++': 'C++',
    'laravel': 'Laravel',
    'vue.js': 'Vue.js',
    'vue': 'Vue.js',
    'next.js': 'Next.js',
    'react': 'React',
    'node.js': 'Node.js',
    'express': 'Express',
    'tailwind': 'TailwindCSS',
    'tailwindcss': 'TailwindCSS',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'redis': 'Redis',
    'docker': 'Docker',
    'ci/cd': 'CI/CD Pipelines',
    'linux': 'Linux',
    'nginx': 'Nginx',
    'rest': 'RESTful APIs',
    'restful api': 'RESTful APIs',
    'restful apis': 'RESTful APIs',
    'webhooks': 'Webhook Architectures',
    'microservices': 'Microservices',
    'system architecture': 'System Architecture',
    'database design': 'Database Design',
    'query optimization': 'Query Optimization',
    'real-time': 'Real-Time Systems',
    'agile': 'Agile / Scrum',
  };
  return map[kw.toLowerCase()] || kw.charAt(0).toUpperCase() + kw.slice(1);
}

export function analyzeJdMatch(
  masterProfile: MasterCvProfile,
  jd: JobDescriptionData
): JdMatchAnalysis {
  // 1. Gather all master CV skills and keywords
  const masterSkills = new Set<string>([
    ...masterProfile.skills.languages.map((s) => s.toLowerCase()),
    ...masterProfile.skills.frameworks.map((s) => s.toLowerCase()),
    ...masterProfile.skills.databases.map((s) => s.toLowerCase()),
    ...masterProfile.skills.devopsAndCloud.map((s) => s.toLowerCase()),
    ...masterProfile.skills.toolsAndConcepts.map((s) => s.toLowerCase()),
    ...masterProfile.projects.flatMap((p) => p.techStack.map((t) => t.toLowerCase())),
  ]);

  // Gather all words in experience bullets & summaries for semantic keyword matching
  const masterCorpus = [
    masterProfile.personalInfo.headline,
    masterProfile.personalInfo.summary,
    ...masterProfile.experience.flatMap((e) => e.bullets),
    ...masterProfile.projects.flatMap((p) => p.bullets),
  ].join(' ').toLowerCase();

  const targetKeywords = jd.extractedKeywords.detectedTools;

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const keywordBreakdown: KeywordMatchItem[] = [];

  targetKeywords.forEach((kw) => {
    const kwLower = kw.toLowerCase();
    const inSkills = Array.from(masterSkills).some(
      (ms) => ms.includes(kwLower) || kwLower.includes(ms)
    );
    const inCorpus = masterCorpus.includes(kwLower);

    const isMatched = inSkills || inCorpus;

    if (isMatched) {
      matchedSkills.push(kw);
    } else {
      missingSkills.push(kw);
    }

    // Determine category
    const isMustHave = jd.extractedKeywords.mustHaveSkills.includes(kw);
    keywordBreakdown.push({
      keyword: kw,
      inMaster: isMatched,
      category: isMustHave ? 'must-have' : 'nice-to-have',
      frequency: (jd.rawText.toLowerCase().match(new RegExp(kwLower, 'g')) || []).length,
    });
  });

  // Calculate weighted match percentage
  let matchScore = 50; // base score

  if (targetKeywords.length > 0) {
    const matchRatio = matchedSkills.length / targetKeywords.length;
    // Base skill score between 40 and 95
    matchScore = Math.round(matchRatio * 70);

    // Title / Domain alignment boost
    const titleLower = jd.jobTitle.toLowerCase();
    if (
      masterProfile.personalInfo.headline.toLowerCase().includes('full-stack') &&
      titleLower.includes('full-stack')
    ) {
      matchScore += 15;
    } else if (
      masterProfile.personalInfo.headline.toLowerCase().includes('engineer') &&
      titleLower.includes('engineer')
    ) {
      matchScore += 10;
    }

    // Must-have penalty or boost
    const mustHaveMatched = jd.extractedKeywords.mustHaveSkills.filter((m) =>
      matchedSkills.includes(m)
    ).length;
    const mustHaveTotal = Math.max(jd.extractedKeywords.mustHaveSkills.length, 1);
    const mustHaveRatio = mustHaveMatched / mustHaveTotal;

    if (mustHaveRatio >= 0.8) matchScore += 12;
    else if (mustHaveRatio < 0.5) matchScore -= 10;
  }

  // Clamp 0-98 (100 is reserved for tailored version)
  const finalScore = Math.min(Math.max(matchScore, 35), 98);

  let grade: JdMatchAnalysis['grade'] = 'Good Match (70-84%)';
  if (finalScore >= 85) grade = 'Strong Match (85-100%)';
  else if (finalScore >= 70) grade = 'Good Match (70-84%)';
  else if (finalScore >= 55) grade = 'Moderate Match (55-69%)';
  else grade = 'Low Match (<55%)';

  // Generate strengths & recommendations
  const strengths: string[] = [];
  if (matchedSkills.length > 0) {
    strengths.push(
      `Strong core alignment in ${matchedSkills.slice(0, 4).join(', ')} directly requested by the employer.`
    );
  }
  if (masterProfile.experience.length > 0) {
    strengths.push(
      `Verified hands-on production experience in high-throughput API design and real-time webhook architectures.`
    );
  }

  const gaps: string[] = [];
  if (missingSkills.length > 0) {
    gaps.push(
      `Job Description references ${missingSkills.slice(0, 3).join(', ')}, which are not explicitly highlighted in your Master CV skills section.`
    );
  }

  const recommendations: string[] = [];
  recommendations.push(
    `Re-rank Technical Skills to position ${matchedSkills.slice(0, 3).join(', ')} at the very front of the section.`
  );
  recommendations.push(
    `Refactor your Professional Summary to mirror the target title: "${jd.jobTitle}".`
  );
  if (missingSkills.length > 0) {
    recommendations.push(
      `Highlight transferable conceptual equivalents for ${missingSkills[0]} in your top experience bullets.`
    );
  }

  return {
    matchPercentage: finalScore,
    grade,
    matchedSkills,
    missingSkills,
    keywordBreakdown,
    strengths,
    gaps,
    recommendations,
  };
}

export const SAMPLE_JOB_POSTINGS: JobDescriptionData[] = [
  {
    id: 'jd_senior_fullstack_doing',
    jobTitle: 'Senior Full-Stack Software Engineer (Laravel & Vue.js)',
    company: 'FinTech Velocity Inc.',
    location: 'Remote (Global)',
    workType: 'remote',
    targetUrl: 'https://careers.fintechvelocity.com/jobs/senior-fullstack-engineer',
    addedAt: new Date().toISOString(),
    rawText: `Job Title: Senior Full-Stack Software Engineer
Company: FinTech Velocity Inc.
Location: Remote (Global)
Employment Type: Full-Time

About the Role:
We are looking for an experienced Senior Full-Stack Software Engineer to build and scale our high-throughput financial transaction platform. You will engineer reactive web interfaces, build resilient RESTful APIs, and optimize database queries handling thousands of real-time transactions per minute.

Must-Have Requirements:
• 3+ years of professional full-stack development experience with PHP, Laravel, and Vue.js.
• Strong proficiency in TypeScript, JavaScript (ES6+), and modern front-end state management.
• Deep understanding of relational databases (PostgreSQL, MySQL), query optimization, and schema design.
• Practical experience with Redis caching, queue workers, and webhook handling architectures.
• Containerization and deployment experience using Docker, Linux servers, Nginx, and automated CI/CD pipelines.
• Proven track record designing RESTful APIs and decoupled microservices.

Nice-to-Have Skills:
• Experience with real-time systems using WebSockets or SSE.
• Familiarity with Next.js or React.
• Experience in Agile / Scrum engineering environments.

Key Responsibilities:
• Architect, build, and maintain scalable full-stack features from conception to production.
• Optimize API latency and database throughput under peak transaction loads.
• Collaborate with product managers, designers, and fellow engineers during sprint cycles.
• Mentor junior engineers and champion clean code, unit testing, and architecture reviews.`,
    extractedKeywords: {
      mustHaveSkills: ['PHP', 'Laravel', 'Vue.js', 'PostgreSQL', 'Redis', 'Docker', 'RESTful APIs', 'CI/CD Pipelines'],
      niceToHaveSkills: ['WebSockets', 'Next.js', 'React', 'Agile / Scrum'],
      responsibilities: [
        'Architect, build, and maintain scalable full-stack features from conception to production.',
        'Optimize API latency and database throughput under peak transaction loads.',
        'Collaborate with product managers, designers, and fellow engineers during sprint cycles.',
        'Mentor junior engineers and champion clean code, unit testing, and architecture reviews.'
      ],
      seniority: 'Senior',
      detectedTools: ['PHP', 'Laravel', 'Vue.js', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Linux', 'Nginx', 'CI/CD Pipelines', 'RESTful APIs', 'Webhooks', 'Microservices'],
    },
  },
  {
    id: 'jd_lead_backend_systems',
    jobTitle: 'Lead Backend & Distributed Systems Engineer',
    company: 'NexStore E-Commerce Cloud',
    location: 'Remote / US & EMEA',
    workType: 'remote',
    targetUrl: 'https://nexstore.cloud/careers/lead-backend',
    addedAt: new Date().toISOString(),
    rawText: `Job Title: Lead Backend & Distributed Systems Engineer
Company: NexStore E-Commerce Cloud
Location: Remote (EMEA / US Timezones)

About NexStore:
NexStore powers commerce for over 50,000 global merchants. We are seeking a Lead Backend Engineer to spearhead our merchant webhook delivery engine and high-throughput order processing pipelines.

Must-Have Requirements:
• 4+ years architecting scalable backend systems, APIs, and microservices in PHP (Laravel/Symfony) or Node.js.
• Advanced PostgreSQL and Redis mastery (partitioning, indexing, caching strategies).
• Deep expertise designing distributed webhook systems, rate limiters, and asynchronous job queues.
• Production experience orchestrating Docker containers, CI/CD deployment pipelines, and Linux server environments (Nginx/Caddy).
• Experience leading technical decision-making, code reviews, and Agile sprint planning.

Nice-to-Have Skills:
• Knowledge of Vue.js, TypeScript, or modern frontend frameworks.
• Experience with cloud platforms (AWS / GCP).
• Knowledge of message brokers (Kafka, RabbitMQ).

Key Responsibilities:
• Lead the architecture of our core distributed order processing services.
• Eliminate API response bottlenecks and optimize multi-tenant database queries.
• Direct technical roadmaps and mentor engineers across backend squads.`,
    extractedKeywords: {
      mustHaveSkills: ['PHP', 'Laravel', 'PostgreSQL', 'Redis', 'Docker', 'CI/CD Pipelines', 'Linux', 'Microservices'],
      niceToHaveSkills: ['Vue.js', 'TypeScript', 'AWS', 'RabbitMQ'],
      responsibilities: [
        'Lead the architecture of our core distributed order processing services.',
        'Eliminate API response bottlenecks and optimize multi-tenant database queries.',
        'Direct technical roadmaps and mentor engineers across backend squads.'
      ],
      seniority: 'Lead / Architect',
      detectedTools: ['PHP', 'Laravel', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Linux', 'Nginx', 'CI/CD Pipelines', 'RESTful APIs', 'Webhooks', 'Microservices'],
    },
  },
  {
    id: 'jd_typescript_fullstack',
    jobTitle: 'Full-Stack Software Engineer (TypeScript & Next.js)',
    company: 'Synapse AI Workspace',
    location: 'San Francisco, CA / Remote',
    workType: 'hybrid',
    targetUrl: 'https://synapseai.io/jobs/fullstack-ts',
    addedAt: new Date().toISOString(),
    rawText: `Job Title: Full-Stack Software Engineer (TypeScript & Next.js)
Company: Synapse AI Workspace
Location: San Francisco, CA / Remote

About Synapse:
We are building the next generation of collaborative AI agents and workspace interfaces. We need a versatile Full-Stack Engineer skilled in TypeScript, Next.js, and scalable API design.

Must-Have Requirements:
• 2+ years of professional engineering experience with TypeScript, Next.js, and React.
• Experience building high-performance RESTful APIs and serverless route handlers.
• Hands-on database design with PostgreSQL or modern SQL engines.
• Experience building clean, responsive interfaces with TailwindCSS and modern UI toolkits.
• Familiarity with Docker, CI/CD, and Git workflows.

Nice-to-Have Skills:
• Experience integrating LLMs or AI APIs (Gemini, OpenAI).
• Background in PHP / Laravel or multi-language backends.
• Experience with real-time WebSockets.`,
    extractedKeywords: {
      mustHaveSkills: ['TypeScript', 'Next.js', 'React', 'PostgreSQL', 'TailwindCSS', 'RESTful APIs'],
      niceToHaveSkills: ['Docker', 'Gemini API', 'PHP', 'Laravel', 'WebSockets'],
      responsibilities: [
        'Build and ship AI-powered workspace components with Next.js and TypeScript.',
        'Design secure, fast RESTful APIs connecting frontend applications with backend services.',
        'Optimize Core Web Vitals and interactive client-side rendering performance.'
      ],
      seniority: 'Mid-Level',
      detectedTools: ['TypeScript', 'Next.js', 'React', 'PostgreSQL', 'TailwindCSS', 'RESTful APIs', 'Docker', 'Git'],
    },
  },
];
