import { JobApplicationRecord } from '@/types/pipeline';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';

export function getSampleJobApplications(): JobApplicationRecord[] {
  const baseProfile = getDefaultMasterProfile();

  const techWealthProfile = {
    ...baseProfile,
    personalInfo: {
      ...baseProfile.personalInfo,
      headline: 'Full-Stack Developer (PHP/Laravel & ReactJS) | AWS & Cloud Architecture',
      summary:
        'Full-Stack Developer specialized in architecting scalable web applications, high-throughput RESTful APIs, and secure cloud environments with PHP (Laravel), ReactJS, and AWS (EC2, RDS, S3).',
    },
  };

  const cloudNexusProfile = {
    ...baseProfile,
    personalInfo: {
      ...baseProfile.personalInfo,
      headline: 'Senior Cloud & Backend Engineer | Node.js & Microservices',
      summary:
        'Senior Software Engineer with deep expertise in distributed backend systems, Node.js, PostgreSQL query optimization, and resilient webhook dispatch pipelines on AWS.',
    },
  };

  const fintechProfile = {
    ...baseProfile,
    personalInfo: {
      ...baseProfile.personalInfo,
      headline: 'Full-Stack Software Engineer (Next.js & TypeScript) | Modern Web',
      summary:
        'Full-Stack Software Engineer focused on high-performance web applications using Next.js, React, TypeScript, and clean software architecture.',
    },
  };

  return [
    {
      id: 'app_techwealth_fullstack',
      company: 'TechWealth',
      jobTitle: 'Full-Stack Developer (PHP/Laravel & ReactJS) with AWS',
      jobUrl: 'https://techwealth.com/careers/fullstack-php-react-aws',
      jobDescription: `About the Role:
TechWealth is seeking an experienced Full-Stack Developer proficient in PHP (Laravel), ReactJS, and Amazon Web Services (AWS) to build modern wealth-management tools.

Responsibilities:
• Design and maintain robust RESTful APIs in Laravel.
• Develop responsive, accessible web interfaces in ReactJS / TypeScript.
• Architect and manage cloud infrastructure using AWS EC2, RDS (MySQL), and S3.
• Implement token-based authentication (OAuth2 / Sanctum) and strict RBAC controls.
• Write clean, maintainable code covered by automated tests.

Requirements:
• 3+ years of professional full-stack development experience.
• Strong proficiency in PHP (Laravel), MySQL, JavaScript/TypeScript, and ReactJS.
• Hands-on experience with AWS services (EC2, S3, RDS, IAM).
• Solid understanding of relational database design and indexing.`,
      status: 'interviewing',
      appliedDate: '2026-10-12',
      submittedPdfFileName: 'Abdullah_Ademi_TechWealth_Resume.pdf',
      tailoredCvSnapshot: techWealthProfile,
    },
    {
      id: 'app_cloudnexus_backend',
      company: 'CloudNexus Solutions',
      jobTitle: 'Senior Backend Engineer (Node.js / Distributed Systems)',
      jobUrl: 'https://cloudnexus.io/jobs/senior-backend-engineer',
      jobDescription: `CloudNexus is looking for a Senior Backend Engineer to join our Core Infrastructure team.

Key Responsibilities:
• Build resilient, low-latency microservices using Node.js, Express, and PostgreSQL.
• Implement event-driven message architectures and webhook delivery systems.
• Optimize high-volume database queries and cache layers using Redis.
• Deploy and monitor production workloads on Docker and Kubernetes.

Requirements:
• Strong systems programming foundation and API design expertise.
• Experience with Redis, PostgreSQL, Docker, and CI/CD automation pipelines.`,
      status: 'offer',
      appliedDate: '2026-10-01',
      submittedPdfFileName: 'Abdullah_Ademi_CloudNexus_Resume.pdf',
      tailoredCvSnapshot: cloudNexusProfile,
    },
    {
      id: 'app_synapse_fullstack',
      company: 'Synapse AI Labs',
      jobTitle: 'Full-Stack Engineer (Next.js & TypeScript)',
      jobUrl: 'https://synapseai.dev/careers/fullstack-ts',
      jobDescription: `Synapse AI is building developer tools for autonomous AI agents and multimodal workflows.

What You'll Do:
• Build lightning-fast, reactive web applications with Next.js App Router and Tailwind CSS.
• Connect frontend experiences to backend LLM streaming endpoints.
• Ensure full accessibility, keyboard navigability, and high Core Web Vitals scores.

Required Qualifications:
• 3+ years in modern React / Next.js and TypeScript.
• Familiarity with RESTful APIs, SSE (Server-Sent Events), and WebSockets.
• Passion for crisp UI design, fast feedback loops, and user-centric software.`,
      status: 'applied',
      appliedDate: '2026-10-24',
      submittedPdfFileName: 'Abdullah_Ademi_Synapse_Resume.pdf',
      tailoredCvSnapshot: fintechProfile,
    },
  ];
}
