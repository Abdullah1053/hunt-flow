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
    'Sana\'a / Yemen, Remote / Global';

  const githubUrl = ghUser?.html_url || 'https://github.com/abdullah1053';
  const website = ghUser?.blog || 'https://abdullah1053.github.io';

  // Categorized Skills
  const languages = Array.from(
    new Set([
      'PHP',
      'JavaScript (ES6+)',
      'TypeScript',
      'SQL',
      'HTML5/CSS3',
      'Dart',
      'C++',
      ...(stagingPayload.metrics.detectedKeywords.filter((k) =>
        ['PHP', 'JavaScript', 'TypeScript', 'SQL', 'Dart', 'C++'].includes(k)
      ) || []),
    ])
  );

  const frameworks = Array.from(
    new Set([
      'Laravel',
      'ReactJS',
      'Next.js',
      'Node.js',
      'Express',
      'TailwindCSS',
      'Vue.js',
      ...(stagingPayload.metrics.detectedKeywords.filter((k) =>
        ['Laravel', 'ReactJS', 'React', 'Next.js', 'Node.js', 'TailwindCSS', 'Vue.js'].includes(k)
      ) || []),
    ])
  );

  const databases = Array.from(
    new Set([
      'MySQL',
      'MongoDB',
      'PostgreSQL',
      'Redis',
      'Database Indexing',
      'Query Optimization',
      'Backup Strategies',
    ])
  );

  const devopsAndCloud = Array.from(
    new Set([
      'AWS (EC2, S3, RDS, IAM)',
      'Docker',
      'CI/CD Pipelines',
      'Nginx',
      'Caddy',
      'PM2',
      'Cloud Platforms (GCP)',
    ])
  );

  const toolsAndConcepts = Array.from(
    new Set([
      'OAuth',
      'Token-based Authentication (Sanctum/JWT)',
      'SSL/TLS',
      'AWS IAM',
      'RESTful APIs',
      'Webhook Architectures',
      'Microservices',
      'Agile/Scrum',
      'Git',
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
        'Configured and managed AWS cloud environments (EC2, RDS MySQL, S3), ensuring 99.9% uptime, scalability, and automated data backups.',
        'Developed dynamic, responsive user interfaces using ReactJS, integrating RESTful backend endpoints to optimize state management and client-side performance.',
        'Secured backend services and APIs using token-based authentication (OAuth, Laravel Sanctum) and implemented role-based access control with AWS IAM.',
        'Delivered and maintained 10+ production web and mobile applications, supporting multiple interconnected systems by contributing across backend, frontend, API, database, and mobile development.',
        'Improved production system reliability and operational efficiency by optimizing database operations, resolving critical production issues, and strengthening deployment, monitoring, and maintenance workflows.',
        'Accelerated end-to-end product delivery across web and mobile platforms by implementing reusable APIs, third-party integrations, automated workflows, and streamlined release processes for Android and iOS applications.',
      ],
    },
  ];

  // Projects with XYZ formula optimization
  const projects = [
    {
      id: 'proj_ecommerce_doing',
      title: 'Doing Scalable E-Commerce Platform',
      role: 'Lead Backend & System Engineer',
      techStack: ['TypeScript', 'ReactJS/Next.js', 'Node.js', 'PostgreSQL/MySQL', 'AWS (EC2/S3)'],
      githubUrl: 'https://github.com/abdullah1053',
      demoUrl: '',
      startDate: '2023',
      endDate: 'Present',
      impactMetric: 'Scaled to 10k+ SKU catalog with sub-80ms search latency',
      bullets: [
        'Optimized MySQL/PostgreSQL queries, schema indexing, and caching with Redis to achieve sub-80ms search latency.',
        'Designed and implemented scalable APIs and backend services using modern TypeScript, Node.js, and ReactJS/Next.js.',
        'Improved development and deployment workflows using containerization, process management, and AWS cloud deployment tools.',
        'Participated in code reviews, Git-based collaboration, feature development, debugging, and production support.',
      ],
    },
    {
      id: 'proj_yalla_fast',
      title: 'Yalla Fast Platform',
      role: 'Full-Stack Architect & Backend Engineer',
      techStack: ['MySQL', 'PHP/Laravel', 'AWS (S3/RDS)', 'Webhooks', 'REST APIs', 'Flutter'],
      githubUrl: 'https://github.com/abdullah1053',
      demoUrl: '',
      startDate: '2023',
      endDate: '2024',
      impactMetric: 'Automated 100% of driver dispatch workflows with live webhook callbacks',
      bullets: [
        'Built robust backend logic and webhooks using PHP Laravel, deploying media assets directly to AWS S3 and managing database instances via AWS RDS.',
        'Worked with REST APIs and third-party integrations to connect mobile and web applications with backend services.',
        'Supported application deployment, troubleshooting, maintenance, and production releases across web and mobile platforms.',
        'Managed and supported mobile application releases and publishing workflows for Google Play Store and Apple App Store.',
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
      institution: 'University of Science and Technology / Faculty of Computer Science',
      degree: "Bachelor's Degree in Computer Science",
      field: 'Computer Science & Software Engineering',
      startDate: 'Jan 2018',
      endDate: 'Jan 2022',
      gpa: 'Very Good',
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
      headline: 'FULL-STACK DEVELOPER (PHP/LARAVEL & REACTJS) | AWS & CLOUD ARCHITECTURE',
      email,
      phone,
      location,
      website,
      github: githubUrl,
      linkedin: 'https://linkedin.com/in/abdullah1053',
      summary:
        'Full-Stack Software Engineer with 4+ years of experience designing, scaling, and maintaining production web applications using PHP (Laravel) and ReactJS. Proven expertise in deploying and optimizing AWS cloud infrastructure (EC2, RDS, S3), designing high-performance MySQL and MongoDB databases, and implementing secure token-based authentication (OAuth/JWT). Adept at leading CI/CD automation, API integrations, and Agile cross-functional collaboration.',
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

export function getDefaultMasterProfile(): MasterCvProfile {
  return synthesizeDeterministicProfile({
    candidateName: 'Abdullah Ademi',
    documents: [],
    github: {
      user: {
        id: 1053,
        login: 'abdullah1053',
        name: 'Abdullah Ademi',
        bio: 'Full-Stack Developer (PHP/Laravel & ReactJS) | AWS & Cloud Architecture',
        location: 'Sana\'a / Yemen, Remote / Global',
        html_url: 'https://github.com/abdullah1053',
        blog: 'https://abdullah1053.github.io',
        avatar_url: '',
        company: null,
        public_repos: 12,
        followers: 5,
        following: 5,
      },
      repos: [],
      selectedRepoIds: [],
      aggregatedSummary: 'Full-stack software engineer with 4+ years experience in PHP (Laravel), ReactJS, AWS (EC2, S3, RDS), MySQL, and MongoDB',
    },
    links: [],
    manualNotes: '',
    aggregatedCorpus: 'Abdullah Ademi Full-Stack Developer (PHP/Laravel & ReactJS) | AWS & Cloud Architecture abdullah.mughni1999@gmail.com +967 771882350 PHP Laravel ReactJS AWS EC2 S3 RDS MySQL MongoDB Docker OAuth Sanctum Sanaa Yemen',
    lastUpdated: new Date().toISOString(),
    metrics: {
      totalSources: 2,
      totalWords: 160,
      totalCharacters: 900,
      githubReposCount: 0,
      documentsCount: 0,
      linksCount: 0,
      detectedKeywords: ['PHP', 'Laravel', 'ReactJS', 'AWS', 'EC2', 'S3', 'RDS', 'MySQL', 'MongoDB', 'Docker', 'OAuth'],
    },
  });
}
