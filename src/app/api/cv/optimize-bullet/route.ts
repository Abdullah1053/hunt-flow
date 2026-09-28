import { NextRequest, NextResponse } from 'next/server';
import { optimizeBulletWithGemini } from '@/lib/geminiSynthesizer';

export async function POST(req: NextRequest) {
  try {
    const { bullet, context, apiKey } = await req.json();

    if (!bullet || typeof bullet !== 'string') {
      return NextResponse.json(
        { error: 'Bullet text is required' },
        { status: 400 }
      );
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (effectiveApiKey && effectiveApiKey.trim().length > 0) {
      try {
        const optimized = await optimizeBulletWithGemini(
          bullet,
          context,
          effectiveApiKey.trim()
        );
        return NextResponse.json({
          optimizedBullet: optimized,
          optimizedBy: 'gemini',
        });
      } catch (geminiError) {
        console.warn('Gemini single bullet optimizer failed:', geminiError);
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
