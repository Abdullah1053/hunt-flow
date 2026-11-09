import { NextRequest, NextResponse } from 'next/server';
import { optimizeBulletWithAi } from '@/lib/geminiSynthesizer';
import { AiProviderConfig } from '@/types/aiConfig';

export async function POST(req: NextRequest) {
  try {
    const { bullet, context, aiConfig, apiKey } = await req.json();

    if (!bullet || typeof bullet !== 'string') {
      return NextResponse.json(
        { error: 'Bullet text is required' },
        { status: 400 }
      );
    }

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
        const optimized = await optimizeBulletWithAi(
          bullet,
          context,
          effectiveConfig
        );
        return NextResponse.json({
          optimizedBullet: optimized,
          optimizedBy: effectiveConfig.model,
        });
      } catch (aiError) {
        console.warn('AI single bullet optimizer failed, using rule-based fallback:', aiError);
      }
    }

    // Rule-based fallback XYZ optimizer
    let fallback = bullet.trim();
    if (!fallback.match(/^(Architected|Engineered|Spearheaded|Optimized|Automated|Delivered|Developed|Designed)/i)) {
      fallback = `Engineered ${fallback.charAt(0).toLowerCase() + fallback.slice(1)}`;
    }
    if (!fallback.match(/(\d+%|\d+k|\d+x|latency|throughput|uptime)/i)) {
      fallback = `${fallback}, increasing operational efficiency and reliability by 30% through automated workflows.`;
    }

    return NextResponse.json({
      optimizedBullet: fallback,
      optimizedBy: 'deterministic',
    });
  } catch (error) {
    console.error('Bullet optimization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to optimize bullet' },
      { status: 500 }
    );
  }
}
