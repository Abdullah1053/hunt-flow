import { StageDefinition, JobApplicationRecord } from '@/types/pipeline';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';

export const PIPELINE_STAGES: StageDefinition[] = [
  {
    id: 'wishlist',
    label: 'Ready to Apply',
    color: 'text-zinc-300',
    bgColor: 'bg-zinc-900/60',
    borderColor: 'border-zinc-800',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Target postings with tailored CV drafts ready for submission',
  },
  {
    id: 'applied',
    label: 'Applied',
    color: 'text-sky-400',
    bgColor: 'bg-sky-950/20',
    borderColor: 'border-sky-500/30',
    badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    description: 'Submitted applications awaiting recruiter resume screening',
  },
  {
    id: 'screening',
    label: 'HR Screening',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/20',
    borderColor: 'border-purple-500/30',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    description: 'Initial recruiter fit phone call or screening questionnaire',
  },
  {
    id: 'technical',
    label: 'Technical Rounds',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-950/20',
    borderColor: 'border-indigo-500/30',
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    description: 'System design, live coding, or architecture review sessions',
  },
  {
    id: 'offer',
    label: 'Offer Received',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/20',
    borderColor: 'border-emerald-500/30',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    description: 'Written job offer extended; evaluating package and terms',
  },
  {
    id: 'archived',
    label: 'Archived',
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-950/40',
    borderColor: 'border-zinc-900',
    badgeColor: 'bg-zinc-900 text-zinc-500 border-zinc-800',
    description: 'Declined, position closed, or candidate withdrew',
  },
];

export function getSampleJobApplications(): JobApplicationRecord[] {
  const baseProfile = getDefaultMasterProfile();

  // Create tailored snapshot for FinTech Velocity
  const finTechProfile = {
    ...baseProfile,
    personalInfo: {
      ...baseProfile.personalInfo,
      headline: 'Senior Full-Stack Software Engineer (Laravel & Vue.js) | Scalable Systems',
      summary:
        'Results-driven Software Engineer with 3+ years of production experience architecting scalable full-stack applications, high-throughput RESTful APIs, and real-time webhook architectures. Proven track record reducing database query latency by 35% using Redis caching and leading collaborative Agile sprints aligned with FinTech Velocity Inc.',
    },
    skills: {
      ...baseProfile.skills,
      frameworks: ['Laravel', 'Vue.js', 'Next.js', 'Node.js', 'TailwindCSS', 'Express'],
    },
  };

  // Create tailored snapshot for NexStore
  const nexStoreProfile = {
    ...baseProfile,
    personalInfo: {
      ...baseProfile.personalInfo,
      headline: 'Lead Backend & Distributed Systems Engineer | High-Throughput APIs',
      summary:
        'Experienced Backend Engineer specialized in high-throughput API architectures, PostgreSQL query optimization, and resilient webhook dispatch pipelines. Spearheaded CI/CD automation with Docker and Nginx on Linux production clusters for NexStore E-Commerce Cloud.',
    },
  };

  // Create tailored snapshot for Synapse AI
  const synapseProfile = {
    ...baseProfile,
    personalInfo: {
      ...baseProfile.personalInfo,
      headline: 'Full-Stack Software Engineer (TypeScript & Next.js) | Modern Web',
      summary:
        'Full-Stack Developer with hands-on expertise building reactive, type-safe web systems using TypeScript, Next.js, and PostgreSQL. Experienced integrating AI APIs, optimizing Core Web Vitals, and writing clean, scalable services.',
    },
    skills: {
      ...baseProfile.skills,
      frameworks: ['Next.js', 'TailwindCSS', 'Laravel', 'Vue.js', 'Express', 'Node.js'],
    },
  };

  return [
    {
      id: 'app_fintech_velocity',
      company: 'FinTech Velocity Inc.',
      jobTitle: 'Senior Full-Stack Software Engineer (Laravel & Vue.js)',
      location: 'Remote (Global)',
      workType: 'remote',
      salaryRange: '$95,000 - $115,000 USD',
      jobUrl: 'https://careers.fintechvelocity.com/jobs/senior-fullstack-engineer',
      status: 'technical',
      matchScore: 98,
      appliedDate: '2026-09-15',
      lastFollowUp: '2026-09-24',
      recruiterName: 'Sarah Jenkins',
      recruiterEmail: 'sarah.jenkins@fintechvelocity.com',
      interviewNotes:
        'Passed HR screen on Sept 18. Technical system design interview scheduled for Thursday with Principal Architect. Focus on PostgreSQL indexing, Redis caching layers, and decoupled webhook handling.',
      timeline: [
        {
          id: 'tl_1',
          status: 'applied',
          date: '2026-09-15',
          note: 'Submitted tailored ATS resume via career portal with 98% JD match.',
        },
        {
          id: 'tl_2',
          status: 'screening',
          date: '2026-09-18',
          note: '30-minute phone screen with Recruiter Sarah Jenkins. Discussed Laravel microservices and Yemen/Global remote setup.',
        },
        {
          id: 'tl_3',
          status: 'technical',
          date: '2026-09-24',
          note: 'Invited to 60-minute Technical System Design interview on Thursday at 3 PM UTC.',
        },
      ],
      tailoredCvSnapshot: finTechProfile,
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-24T14:30:00Z',
    },
    {
      id: 'app_nexstore_cloud',
      company: 'NexStore E-Commerce Cloud',
      jobTitle: 'Lead Backend & Distributed Systems Engineer',
      location: 'Remote / US & EMEA',
      workType: 'remote',
      salaryRange: '$105,000 - $125,000 USD',
      jobUrl: 'https://nexstore.cloud/careers/lead-backend',
      status: 'screening',
      matchScore: 96,
      appliedDate: '2026-09-20',
      lastFollowUp: '2026-09-26',
      recruiterName: 'Marcus Vance',
      recruiterEmail: 'm.vance@nexstore.cloud',
      interviewNotes:
        'Recruiter emailed via LinkedIn praising the tailored CV summary on high-throughput webhook delivery. HR screen call booked for next Tuesday.',
      timeline: [
        {
          id: 'tl_4',
          status: 'applied',
          date: '2026-09-20',
          note: 'Applied through LinkedIn EasyApply with custom NexStore tailored resume.',
        },
        {
          id: 'tl_5',
          status: 'screening',
          date: '2026-09-26',
          note: 'Recruiter reached out with screening availability link.',
        },
      ],
      tailoredCvSnapshot: nexStoreProfile,
      createdAt: '2026-09-20T11:20:00Z',
      updatedAt: '2026-09-26T16:00:00Z',
    },
    {
      id: 'app_synapse_ai',
      company: 'Synapse AI Workspace',
      jobTitle: 'Full-Stack Software Engineer (TypeScript & Next.js)',
      location: 'San Francisco, CA / Remote',
      workType: 'hybrid',
      salaryRange: '$90,000 - $110,000 USD',
      jobUrl: 'https://synapseai.io/jobs/fullstack-ts',
      status: 'applied',
      matchScore: 98,
      appliedDate: '2026-09-25',
      recruiterName: 'Elena Rostova',
      interviewNotes:
        'Application submitted with tailored TypeScript & Next.js focus. Automated confirmation received.',
      timeline: [
        {
          id: 'tl_6',
          status: 'applied',
          date: '2026-09-25',
          note: 'Submitted application on Greenhouse gateway. All ATS parsing checks passed.',
        },
      ],
      tailoredCvSnapshot: synapseProfile,
      createdAt: '2026-09-25T09:15:00Z',
      updatedAt: '2026-09-25T09:15:00Z',
    },
    {
      id: 'app_veloce_labs',
      company: 'Veloce Labs',
      jobTitle: 'Full-Stack Web Engineer',
      location: 'Dubai, UAE / Remote',
      workType: 'remote',
      salaryRange: '$100,000 - $115,000 USD',
      status: 'offer',
      matchScore: 95,
      appliedDate: '2026-09-02',
      lastFollowUp: '2026-09-27',
      recruiterName: 'Tariq Al-Mansoor',
      recruiterEmail: 'tariq@velocelabs.io',
      interviewNotes:
        'OFFER RECEIVED: $105,000 base + remote equipment stipend ($2,500). Health insurance coverage. Decision required by Friday Oct 3.',
      timeline: [
        {
          id: 'tl_7',
          status: 'applied',
          date: '2026-09-02',
          note: 'Application submitted.',
        },
        {
          id: 'tl_8',
          status: 'screening',
          date: '2026-09-08',
          note: 'Passed behavioral screen with VP of People.',
        },
        {
          id: 'tl_9',
          status: 'technical',
          date: '2026-09-17',
          note: 'Completed live coding and architecture challenge on Redis queueing.',
        },
        {
          id: 'tl_10',
          status: 'offer',
          date: '2026-09-27',
          note: 'Formal offer letter received! $105k annual compensation package.',
        },
      ],
      tailoredCvSnapshot: baseProfile,
      createdAt: '2026-09-02T08:00:00Z',
      updatedAt: '2026-09-27T18:00:00Z',
    },
    {
      id: 'app_global_pay',
      company: 'GlobalPay Technologies',
      jobTitle: 'Backend API Developer (Laravel & SQL)',
      location: 'London, UK / Remote',
      workType: 'remote',
      salaryRange: '£65,000 - £75,000 GBP',
      status: 'wishlist',
      matchScore: 94,
      interviewNotes:
        'Posting saved on LinkedIn. Draft tailored resume ready to submit as soon as hiring manager opens portal next Monday.',
      timeline: [
        {
          id: 'tl_11',
          status: 'wishlist',
          date: '2026-09-26',
          note: 'Job saved to wishlist. Tailored CV created and previewed in HuntFlow.',
        },
      ],
      tailoredCvSnapshot: baseProfile,
      createdAt: '2026-09-26T12:00:00Z',
      updatedAt: '2026-09-26T12:00:00Z',
    },
  ];
}
