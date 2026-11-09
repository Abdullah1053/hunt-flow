import { NextRequest, NextResponse } from 'next/server';
import { synthesizeMasterProfileWithAi } from '@/lib/geminiSynthesizer';
import { synthesizeDeterministicProfile } from '@/lib/deterministicSynthesizer';
import { RawStagingPayload } from '@/types/ingestion';
import { AiProviderConfig } from '@/types/aiConfig';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stagingPayload, aiConfig, apiKey } = body as {
      stagingPayload: RawStagingPayload;
      aiConfig?: AiProviderConfig;
      apiKey?: string;
    };

    if (!stagingPayload || !stagingPayload.aggregatedCorpus) {
      return NextResponse.json(
        { error: 'Invalid payload: staging corpus is empty or missing.' },
        { status: 400 }
      );
    }

    // Resolve AI configuration
    const effectiveConfig: AiProviderConfig | undefined =
      aiConfig ||
      (apiKey
        ? {
            providerType: 'gemini',
            baseUrl: 'https://generativelanguage.googleapis.com',
            apiKey,
            model: 'gemini-2.5-flash',
          }
        : process.env.GEMINI_API_KEY
        ? {
            providerType: 'gemini',
            baseUrl: 'https://generativelanguage.googleapis.com',
            apiKey: process.env.GEMINI_API_KEY,
            model: 'gemini-2.5-flash',
          }
        : undefined);

    const hasKey = effectiveConfig && effectiveConfig.apiKey.trim().length > 0;
    const isLocalOllama = effectiveConfig && effectiveConfig.providerType === 'openai-compatible' && effectiveConfig.baseUrl.includes('localhost:11434');

    if (hasKey || isLocalOllama) {
      try {
        const aiProfile = await synthesizeMasterProfileWithAi(
          stagingPayload,
          effectiveConfig
        );
        return NextResponse.json({
          profile: aiProfile,
          synthesizedBy: effectiveConfig.providerType,
          modelUsed: effectiveConfig.model,
          message: `Profile synthesized successfully via ${effectiveConfig.model} with XYZ Formula.`,
        });
      } catch (aiError) {
        console.warn('AI call failed, falling back to deterministic synthesizer:', aiError);
        // Fallback to deterministic synthesis so the candidate workflow is never blocked
        const fallbackProfile = synthesizeDeterministicProfile(stagingPayload);
        return NextResponse.json({
          profile: fallbackProfile,
          synthesizedBy: 'deterministic',
          fallbackReason: aiError instanceof Error ? aiError.message : 'AI call failed',
          message:
            'Profile synthesized via local deterministic engine (AI provider returned an error or quota limit).',
        });
      }
    } else {
      // Deterministic synthesis when no API key is supplied
      const deterministicProfile = synthesizeDeterministicProfile(stagingPayload);
      return NextResponse.json({
        profile: deterministicProfile,
        synthesizedBy: 'deterministic',
        message:
          'Profile synthesized via local deterministic engine. Configure an AI provider in settings for live LLM extraction.',
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
