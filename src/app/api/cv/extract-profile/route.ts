import { NextRequest, NextResponse } from 'next/server';
import { synthesizeMasterProfileWithGemini } from '@/lib/geminiSynthesizer';
import { synthesizeDeterministicProfile } from '@/lib/deterministicSynthesizer';
import { RawStagingPayload } from '@/types/ingestion';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stagingPayload, apiKey } = body as {
      stagingPayload: RawStagingPayload;
      apiKey?: string;
    };

    if (!stagingPayload || !stagingPayload.aggregatedCorpus) {
      return NextResponse.json(
        { error: 'Invalid payload: staging corpus is empty or missing.' },
        { status: 400 }
      );
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (effectiveApiKey && effectiveApiKey.trim().length > 0) {
      try {
        const geminiProfile = await synthesizeMasterProfileWithGemini(
          stagingPayload,
          effectiveApiKey.trim()
        );
        return NextResponse.json({
          profile: geminiProfile,
          synthesizedBy: 'gemini',
          modelUsed: 'gemini-2.5-flash',
          message: 'Profile synthesized successfully via Gemini AI Engine with XYZ Formula.',
        });
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to deterministic synthesizer:', geminiError);
        // Fallback to deterministic synthesis so the candidate workflow is never blocked
        const fallbackProfile = synthesizeDeterministicProfile(stagingPayload);
        return NextResponse.json({
          profile: fallbackProfile,
          synthesizedBy: 'deterministic',
          fallbackReason: geminiError instanceof Error ? geminiError.message : 'Gemini call failed',
          message:
            'Profile synthesized via local deterministic engine (Gemini API returned an error or quota limit).',
        });
      }
    } else {
      // Deterministic synthesis when no API key is supplied
      const deterministicProfile = synthesizeDeterministicProfile(stagingPayload);
      return NextResponse.json({
        profile: deterministicProfile,
        synthesizedBy: 'deterministic',
        message:
          'Profile synthesized via local deterministic engine. Add a Gemini API key in settings for live LLM extraction.',
      });
    }
  } catch (error) {
    console.error('Master CV extraction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract Master CV' },
      { status: 500 }
    );
  }
}
