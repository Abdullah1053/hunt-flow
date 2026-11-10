import { NextRequest, NextResponse } from 'next/server';
import { MasterCvProfile } from '@/types/masterCv';
import { JobDescriptionData } from '@/types/tailoring';
import { AiProviderConfig } from '@/types/aiConfig';
import { getDatabase } from '@/lib/db/sqlite';
import { getActiveCareerBullets } from '@/lib/db/careerBulletsRepo';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';
import { generateTailoredProfile } from '@/lib/tailoringEngine/tailorSynthesizer';
import { SAMPLE_JOB_POSTINGS } from '@/lib/tailoringEngine/jdAnalyzer';
import { assembleTailorPrompt } from '@/lib/tailoringEngine/tailorPrompt';
import { callUniversalAiText, cleanJsonOutput } from '@/lib/aiClient';

export const dynamic = 'force-dynamic';

interface AiTailoredMutableResponse {
  headline?: string;
  summary?: string;
  skills?: MasterCvProfile['skills'];
  experience?: MasterCvProfile['experience'];
  projects?: MasterCvProfile['projects'];
  education?: MasterCvProfile['education'];
  certifications?: MasterCvProfile['certifications'];
}

function getStoredMasterProfileFromDb(): MasterCvProfile | null {
  try {
    const db = getDatabase();
    const row = db
      .prepare('SELECT profile_json FROM cv_profiles WHERE is_master = 1 ORDER BY updated_at DESC LIMIT 1')
      .get() as { profile_json: string } | undefined;
    if (row?.profile_json) {
      return JSON.parse(row.profile_json) as MasterCvProfile;
    }
  } catch (err) {
    console.warn('Could not read master profile from SQLite:', err);
  }
  return null;
}

function resolveEffectiveAiConfig(
  bodyConfig?: AiProviderConfig,
  apiKey?: string
): AiProviderConfig | null {
  if (bodyConfig && typeof bodyConfig === 'object' && bodyConfig.providerType) {
    if (bodyConfig.apiKey?.trim()) {
      return bodyConfig;
    }
    if (bodyConfig.providerType === 'gemini' && process.env.GEMINI_API_KEY) {
      return { ...bodyConfig, apiKey: process.env.GEMINI_API_KEY };
    }
    if (
      bodyConfig.providerType === 'openai-compatible' &&
      (bodyConfig.baseUrl?.includes('localhost') || bodyConfig.baseUrl?.includes('127.0.0.1'))
    ) {
      return bodyConfig;
    }
  }

  // Fallback to SQLite app_settings
  try {
    const db = getDatabase();
    const row = db
      .prepare("SELECT value_json FROM app_settings WHERE key = 'ai_config'")
      .get() as { value_json: string } | undefined;
    if (row?.value_json) {
      const saved = JSON.parse(row.value_json) as AiProviderConfig;
      if (saved?.apiKey?.trim()) return saved;
      if (
        saved?.providerType === 'openai-compatible' &&
        (saved.baseUrl?.includes('localhost') || saved.baseUrl?.includes('127.0.0.1'))
      ) {
        return saved;
      }
    }
  } catch {}

  const effectiveKey = apiKey?.trim() || process.env.GEMINI_API_KEY;
  if (effectiveKey) {
    return {
      providerType: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiKey: effectiveKey,
      model: bodyConfig?.model || 'gemini-2.5-flash',
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    // 1. New 4-Step Wizard Payload: { baseCv, currentMasterProfile, jobTitle, jobDescription: string, userNotes, customInstructions, aiConfig }
    if (typeof body?.jobTitle === 'string' && typeof body?.jobDescription === 'string') {
      const jobTitle = body.jobTitle.trim();
      const jobDescription = body.jobDescription.trim();

      if (!jobTitle || !jobDescription) {
        return NextResponse.json(
          { success: false, error: 'Target Job Title and Job Description are required.' },
          { status: 400 }
        );
      }

      const db = getDatabase();
      const dbMaster = getStoredMasterProfileFromDb();
      const selectedBaseCv: MasterCvProfile =
        body.baseCv?.personalInfo ? body.baseCv : dbMaster || getDefaultMasterProfile();

      // Strictly use the user's current manual Master Profile for immutable contact & social info
      const currentMasterProfile: MasterCvProfile =
        body.currentMasterProfile?.personalInfo
          ? body.currentMasterProfile
          : dbMaster || selectedBaseCv;

      const effectiveConfig = resolveEffectiveAiConfig(body.aiConfig, body.apiKey);
      if (!effectiveConfig) {
        return NextResponse.json(
          {
            success: false,
            error:
              'No AI Provider API key configured. Please configure your AI provider in CV Builder Settings (gear icon).',
          },
          { status: 400 }
        );
      }

      // Fetch ONLY active Career Knowledge Base bullets (is_active_for_ai = 1)
      const activeBullets = getActiveCareerBullets(db);

      const prompt = assembleTailorPrompt({
        customInstructions: body.customInstructions,
        jobTitle,
        jobDescription,
        userNotes: body.userNotes,
        activeBullets,
        baseCv: selectedBaseCv,
      });

      const rawAiText = await callUniversalAiText(
        effectiveConfig,
        prompt,
        'Return ONLY a valid raw JSON object matching the requested schema. Do NOT wrap in markdown code fences and do NOT include personal contact fields.'
      );

      const cleanedJson = cleanJsonOutput(rawAiText);
      let aiParsedResponse: AiTailoredMutableResponse;
      try {
        aiParsedResponse = JSON.parse(cleanedJson) as AiTailoredMutableResponse;
      } catch (parseErr: any) {
        console.error('Failed to parse AI tailoring JSON:', cleanedJson);
        throw new Error(`AI returned invalid JSON: ${parseErr.message}`);
      }

      const contactSource = currentMasterProfile.personalInfo;

      const normalizedExperience = Array.isArray(aiParsedResponse.experience)
        ? aiParsedResponse.experience.map((exp, idx) => ({
            ...exp,
            id: exp.id || `exp_${Date.now()}_${idx}`,
            bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
            isCurrent: Boolean(exp.isCurrent),
          }))
        : selectedBaseCv.experience;

      const normalizedProjects = Array.isArray(aiParsedResponse.projects)
        ? aiParsedResponse.projects.map((proj, idx) => ({
            ...proj,
            id: proj.id || `proj_${Date.now()}_${idx}`,
            techStack: Array.isArray(proj.techStack) ? proj.techStack : [],
            bullets: Array.isArray(proj.bullets) ? proj.bullets : [],
          }))
        : selectedBaseCv.projects;

      const normalizedEducation = Array.isArray(aiParsedResponse.education)
        ? aiParsedResponse.education.map((edu, idx) => ({
            ...edu,
            id: edu.id || `edu_${Date.now()}_${idx}`,
          }))
        : selectedBaseCv.education;

      const normalizedCertifications = Array.isArray(aiParsedResponse.certifications)
        ? aiParsedResponse.certifications.map((cert, idx) => ({
            ...cert,
            id: cert.id || `cert_${Date.now()}_${idx}`,
          }))
        : selectedBaseCv.certifications;

      const totalBullets =
        normalizedExperience.reduce((sum, e) => sum + e.bullets.length, 0) +
        normalizedProjects.reduce((sum, p) => sum + p.bullets.length, 0);

      const updatedProfile: MasterCvProfile = {
        ...selectedBaseCv,
        personalInfo: {
          // STRICTLY PRESERVED FROM USER'S MANUAL PROFILE — NEVER OVERWRITTEN BY AI
          fullName: contactSource.fullName,
          email: contactSource.email,
          phone: contactSource.phone,
          location: contactSource.location,
          website: contactSource.website,
          github: contactSource.github,
          linkedin: contactSource.linkedin,
          // ONLY HEADLINE & SUMMARY UPDATED BY AI
          headline:
            typeof aiParsedResponse.headline === 'string' && aiParsedResponse.headline.trim()
              ? aiParsedResponse.headline.trim()
              : selectedBaseCv.personalInfo.headline,
          summary:
            typeof aiParsedResponse.summary === 'string' && aiParsedResponse.summary.trim()
              ? aiParsedResponse.summary.trim()
              : selectedBaseCv.personalInfo.summary,
        },
        skills: aiParsedResponse.skills
          ? {
              languages: Array.isArray(aiParsedResponse.skills.languages)
                ? aiParsedResponse.skills.languages
                : selectedBaseCv.skills.languages,
              frameworks: Array.isArray(aiParsedResponse.skills.frameworks)
                ? aiParsedResponse.skills.frameworks
                : selectedBaseCv.skills.frameworks,
              databases: Array.isArray(aiParsedResponse.skills.databases)
                ? aiParsedResponse.skills.databases
                : selectedBaseCv.skills.databases,
              devopsAndCloud: Array.isArray(aiParsedResponse.skills.devopsAndCloud)
                ? aiParsedResponse.skills.devopsAndCloud
                : selectedBaseCv.skills.devopsAndCloud,
              toolsAndConcepts: Array.isArray(aiParsedResponse.skills.toolsAndConcepts)
                ? aiParsedResponse.skills.toolsAndConcepts
                : selectedBaseCv.skills.toolsAndConcepts,
            }
          : selectedBaseCv.skills,
        experience: normalizedExperience,
        projects: normalizedProjects,
        education: normalizedEducation,
        certifications: normalizedCertifications,
        metadata: {
          generatedAt: selectedBaseCv.metadata?.generatedAt || new Date().toISOString(),
          lastEditedAt: new Date().toISOString(),
          version: (selectedBaseCv.metadata?.version || 1) + 1,
          synthesizedBy:
            effectiveConfig.providerType === 'gemini' ? 'gemini' : 'openai-compatible',
          xyzBulletsCount: totalBullets,
        },
      };

      return NextResponse.json({
        success: true,
        updatedProfile,
        activeBulletsCount: activeBullets.length,
        modelUsed: effectiveConfig.model,
      });
    }

    // 2. Legacy ContextualTailorView support
    const masterProfile: MasterCvProfile =
      body?.masterProfile && body.masterProfile.personalInfo
        ? body.masterProfile
        : getDefaultMasterProfile();

    const jobDescription: JobDescriptionData =
      body?.jobDescription && body.jobDescription.jobTitle
        ? body.jobDescription
        : SAMPLE_JOB_POSTINGS[0];

    const apiKey: string | undefined = body?.apiKey || undefined;
    const aiConfig = body?.aiConfig;

    const tailoredCv = await generateTailoredProfile(
      masterProfile,
      jobDescription,
      aiConfig || apiKey
    );

    return NextResponse.json({
      success: true,
      tailoredCv,
    });
  } catch (error: any) {
    console.error('Error in /api/tailor/generate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate tailored CV',
      },
      { status: 500 }
    );
  }
}
