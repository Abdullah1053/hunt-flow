import { NextRequest, NextResponse } from 'next/server';
import { MasterCvProfile } from '@/types/masterCv';
import { JobDescriptionData } from '@/types/tailoring';
import { generateTailoredProfile } from '@/lib/tailoringEngine/tailorSynthesizer';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';
import { SAMPLE_JOB_POSTINGS } from '@/lib/tailoringEngine/jdAnalyzer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const masterProfile: MasterCvProfile =
      body?.masterProfile && body.masterProfile.personalInfo
        ? body.masterProfile
        : getDefaultMasterProfile();

    const jobDescription: JobDescriptionData =
      body?.jobDescription && body.jobDescription.jobTitle
        ? body.jobDescription
        : SAMPLE_JOB_POSTINGS[0];

    const apiKey: string | undefined = body?.apiKey || undefined;

    const tailoredCv = await generateTailoredProfile(
      masterProfile,
      jobDescription,
      apiKey
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
