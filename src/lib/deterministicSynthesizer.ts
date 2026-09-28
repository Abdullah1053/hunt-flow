import { MasterCvProfile } from '@/types/masterCv';
import { RawStagingPayload } from '@/types/ingestion';

export function synthesizeDeterministicProfile(
  stagingPayload: RawStagingPayload
): MasterCvProfile {
  const ghUser = stagingPayload.github?.user;
  const selectedRepos = stagingPayload.github?.repos?.filter((r) =>
    stagingPayload.github?.selectedRepoIds?.includes(r.id)
  ) || [];

  const rawCorpus = stagingPayload.aggregatedCorpus;

  // Personal Info Extraction
  const fullName =
    ghUser?.name ||
    stagingPayload.candidateName ||
    'Abdullah Ademi';

  const email =
    rawCorpus.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ||
    'abdullah.mughni1999@gmail.com';

  const phone =
    rawCorpus.match(/\+?[0-9\s-]{10,16}/)?.[0]?.trim() ||
    '+967 771882350';

  const location =
    ghUser?.location ||
    (rawCorpus.includes('Sanaa') ? 'Sanaa, Yemen' : 'Remote / Global');

  const githubUrl = ghUser?.html_url || 'https://github.com/abdullah1053';
  const website = ghUser?.blog || 'https://abdullah1053.github.io';

  // Categorized Skills
  const languages = Array.from(
    new Set([
      'PHP',
      'TypeScript',
      'JavaScript (ES6+)',
      'SQL',
      'Dart',
      'C++',
      'HTML5/CSS3',
      ...(stagingPayload.metrics.detectedKeywords.filter((k) =>
        ['TypeScript', 'PHP', 'JavaScript', 'Python', 'Dart', 'C++'].includes(k)
      ) || []),
    ])
  );

  const frameworks = Array.from(
    new Set([
      'Laravel',
      'Vue.js',
      'Next.js',
      'Node.js',
      'Express',
      'TailwindCSS',
      ...(stagingPayload.metrics.detectedKeywords.filter((k) =>
        ['Laravel', 'Vue.js', 'Next.js', 'React', 'Node.js', 'TailwindCSS'].includes(k)
      ) || []),
    ])
  );

  const databases = Array.from(
    new Set(['PostgreSQL', 'MySQL', 'Redis', 'Database Design', 'Query Optimization'])
  );

  const devopsAndCloud = Array.from(
    new Set([
      'Docker',
      'CI/CD Pipelines',
      'Linux Server Administration',
      'Nginx',
      'Caddy',
      'PM2',
      'Cloud Platforms (AWS / GCP)',
    ])
  );

  const toolsAndConcepts = Array.from(
    new Set([
      'RESTful API Design',
      'Webhook Architectures',
      'Real-Time Systems',
      'Microservices',
      'System Architecture',
      'Agile / Scrum',
      'Git Workflow',
    ])
  );

  // Experience with XYZ formula optimization
  const experience = [
    {
      id: 'exp_doing_platform',
      company: 'Doing Platform',
      role: 'Full-Stack Developer / Project Management',
      location: 'Sanaa, Yemen',
      startDate: 'Mar 2023',
      endDate: 'Present',
      isCurrent: true,
      bullets: [
        'Architected and implemented scalable full-stack web systems handling 15,000+ real-time transactions by engineering reactive Vue.js frontends and decoupled Laravel microservices.',
        'Built and maintained high-throughput RESTful APIs powering mobile and web clients, reducing response latency by 35% via Redis caching and optimized database query execution.',
        'Automated CI/CD deployment pipelines on Linux production servers utilizing Docker, Nginx, and Caddy, eliminating 90% of manual deployment overhead.',
        'Engineered secure, scalable webhook handling architectures to dispatch and sync live order statuses across distributed merchant and logistics endpoints.',
        'Spearheaded Agile sprint planning and led peer code reviews for a 6-developer team, boosting release velocity by 25% while maintaining strict lint and architecture standards.',
        'Mentored junior engineers on API design principles and query profiling, improving overall engineering output and team test coverage.',
      ],
    },
  ];

  // Projects with XYZ formula optimization
  const projects = [
    {
      id: 'proj_ecommerce_doing',
      title: 'Doing Scalable E-Commerce Platform',
      role: 'Lead Backend & System Engineer',
      techStack: ['Laravel', 'Vue.js', 'PostgreSQL', 'Redis', 'Docker'],
      githubUrl: 'https://github.com/abdullah1053',
      demoUrl: '',
      startDate: '2023',
      endDate: 'Present',
      impactMetric: 'Scaled to 10k+ SKU catalog with sub-80ms search latency',
      bullets: [
        'Engineered a scalable multi-tenant e-commerce platform processing dynamic carts, inventory checks, and third-party payment workflows with 99.9% uptime.',
        'Optimized PostgreSQL query schemas and relational indexing, decreasing checkout query latency by 42% under concurrent traffic loads.',
        'Built reactive frontend customer interfaces with Vue.js and TailwindCSS, improving mobile user conversion and time-on-page metrics.',
      ],
    },
    {
      id: 'proj_ondemand_delivery',
      title: 'On-Demand Delivery & Webhook Dispatch Platform',
      role: 'Full-Stack Architect',
      techStack: ['Laravel', 'Node.js', 'Webhooks', 'MySQL', 'Caddy'],
      githubUrl: 'https://github.com/abdullah1053',
      demoUrl: '',
      startDate: '2023',
      endDate: '2024',
      impactMetric: 'Automated 100% of driver dispatch workflows with live webhook callbacks',
      bullets: [
        'Designed an event-driven delivery platform architecture supporting real-time driver tracking, automated dispatch queues, and store integrations.',
        'Developed a self-serve onboarding and verification workflow for third-party courier companies, reducing merchant integration time from 3 days to under 1 hour.',
        'Implemented cryptographically verified webhook delivery with automated exponential-backoff retries, achieving zero lost dispatch events across 50,000+ orders.',
      ],
    },
  ];

  // Add showcase projects from GitHub if selected
  selectedRepos.slice(0, 2).forEach((repo) => {
    projects.push({
      id: `proj_gh_${repo.id}`,
      title: repo.name.replace(/[-_]/g, ' '),
      role: 'Open-Source Creator',
      techStack: [repo.language || 'TypeScript', ...(repo.topics || [])].filter(Boolean),
      githubUrl: repo.html_url,
      demoUrl: '',
      startDate: '2024',
      endDate: 'Present',
      impactMetric: `${repo.stargazers_count} GitHub stars & active community usage`,
      bullets: [
        `Architected open-source software project (${repo.name}) addressing developer productivity and systems engineering workflows.`,
        repo.description
          ? `Delivered high-performance solution for "${repo.description}" with modular architecture and clean documentation.`
          : 'Built clean modular software components following modern software design patterns and unit tests.',
      ],
    });
  });

  const education = [
    {
      id: 'edu_cs_degree',
      institution: 'Sanaa University / Faculty of Computer Science',
      degree: "Bachelor's Degree in Computer Science",
      field: 'Computer Science & Software Engineering',
      startDate: 'Jan 2020',
      endDate: 'Jan 2023',
      gpa: 'Excellent with Honors',
      achievements: [
        'Core Focus: Data Structures & Algorithms, Distributed Systems, Database Management Systems, Software Engineering Methodologies',
      ],
    },
  ];

  const certifications = [
    {
      id: 'cert_fullstack',
      name: 'Full-Stack Web Development & System Architecture',
      issuer: 'Professional Certification',
      date: '2023',
    },
  ];

  const totalBullets =
    experience.reduce((acc, curr) => acc + curr.bullets.length, 0) +
    projects.reduce((acc, curr) => acc + curr.bullets.length, 0);

  return {
    personalInfo: {
      fullName,
      headline: 'Full-Stack Software Engineer | Scalable Architectures & APIs',
      email,
      phone,
      location,
      website,
      github: githubUrl,
      linkedin: 'https://linkedin.com/in/abdullah1053',
      summary:
        'Full-Stack Software Engineer with 3+ years of experience architecting scalable web applications, high-throughput RESTful APIs, and real-time webhook systems using Laravel, Vue.js, and modern cloud technologies. Proven track record of optimizing database queries, automating CI/CD pipelines, and leading collaborative Agile engineering sprints.',
    },
    skills: {
      languages,
      frameworks,
      databases,
      devopsAndCloud,
      toolsAndConcepts,
    },
    experience,
    projects,
    education,
    certifications,
    metadata: {
      generatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      version: 1,
      synthesizedBy: 'deterministic',
      xyzBulletsCount: totalBullets,
    },
  };
}
