import { GoogleGenAI } from '@google/genai';
import { MasterCvSchema } from '@/lib/schemas/masterCvSchema';
import { MasterCvProfile } from '@/types/masterCv';
import { RawStagingPayload } from '@/types/ingestion';

const SYSTEM_INSTRUCTION = `
You are the HuntFlow AI Career Synthesis Engine, an elite FAANG/Fortune 500 resume architect and ATS optimization expert.
Your job is to read unstructured candidate data (resumes, GitHub repositories, README files, portfolios, and notes) and synthesize a comprehensive, standardized, high-impact Master CV.

### CORE INSTRUCTIONS:
1. **XYZ FORMULA APPLICATION**:
   Rewrite every single work experience and project bullet point strictly using Google's XYZ Formula:
   "Accomplished [X], as measured by [Y], by doing [Z]"
   - Every bullet MUST begin with a strong past-tense action verb (e.g., Architected, Engineered, Optimized, Spearheaded, Automated, Reduced, Accelerated, Delivered).
   - Ground metrics in the candidate's real domain (e.g., latency reduction, order processing throughput, webhook reliability, user capacity, deployment speed, database query optimization).
   - Avoid vague passive descriptions like "Worked on", "Responsible for", "Helped with".

2. **CATEGORIZED SKILLS EXTRACTION**:
   Parse and cleanly sort all technical skills into 5 distinct categories:
   - Languages (e.g., TypeScript, PHP, Python, JavaScript, C++, Dart, SQL)
   - Frameworks (e.g., Laravel, Vue.js, Next.js, React, Node.js, Express, TailwindCSS)
   - Databases (e.g., PostgreSQL, MySQL, Redis, MongoDB)
   - DevOps & Cloud (e.g., Docker, CI/CD, Nginx, Caddy, Linux, PM2, AWS, GCP)
   - Tools & Concepts (e.g., RESTful APIs, Webhooks, Microservices, Agile, Git, Real-Time Architecture)

3. **FACTUAL INTEGRITY**:
   - Strictly adhere to the candidate's actual work history, projects, and technologies.
   - Do NOT invent companies, institutions, or degrees that the candidate never attended.
   - Do quantify impact where engineering scope is described (e.g., real-time order tracking, webhook delivery, platform scaling).

4. **JSON FORMAT OUTPUT**:
   Return ONLY a clean, valid JSON object matching the requested schema. No markdown code blocks, no introductory conversational text.
`;

export async function synthesizeMasterProfileWithGemini(
  stagingPayload: RawStagingPayload,
  userApiKey?: string
): Promise<MasterCvProfile> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please supply an API key.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Please ingest the following candidate staging corpus and synthesize the standardized Master CV profile:

=== CANDIDATE NAME ===
${stagingPayload.candidateName}

=== RAW INGESTED CORPUS ===
${stagingPayload.aggregatedCorpus}

=== STAGING METRICS & KEYWORDS ===
Detected Keywords: ${stagingPayload.metrics.detectedKeywords.join(', ')}
Selected Repos: ${stagingPayload.metrics.githubReposCount}
Documents: ${stagingPayload.metrics.documentsCount}

Generate the Master CV JSON structure with personalInfo, skills, experience, projects, education, certifications, and metadata.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    if (!text) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Parse JSON
    const parsedJson = JSON.parse(text);

    // Validate and fill defaults using Zod schema
    const validated = MasterCvSchema.parse({
      ...parsedJson,
      metadata: {
        generatedAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString(),
        version: 1,
        synthesizedBy: 'gemini',
        xyzBulletsCount:
          (parsedJson.experience?.reduce(
            (acc: number, item: any) => acc + (item.bullets?.length || 0),
            0
          ) || 0) +
          (parsedJson.projects?.reduce(
            (acc: number, item: any) => acc + (item.bullets?.length || 0),
            0
          ) || 0),
      },
    });

    return validated as MasterCvProfile;
  } catch (error) {
    console.error('Gemini synthesis error:', error);
    throw error;
  }
}

export async function optimizeBulletWithGemini(
  rawBullet: string,
  context?: string,
  userApiKey?: string
): Promise<string> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Rewrite the following resume bullet point to strictly follow Google's XYZ Formula:
"Accomplished [X], as measured by [Y], by doing [Z]"

Rules:
- Start with a powerful past-tense action verb (e.g. Engineered, Architected, Accelerated, Reduced, Spearheaded).
- Include realistic engineering metrics (e.g., percentage improvement, latency, throughput, scale).
- Keep it to 1-2 punchy sentences.
- Return ONLY the optimized bullet string, with no quotation marks or explanations.

Context: ${context || 'Software Engineering / Full-Stack Development'}
Original Bullet: "${rawBullet}"
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return (response.text || rawBullet).trim().replace(/^["']|["']$/g, '');
}
