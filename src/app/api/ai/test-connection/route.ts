import { NextRequest, NextResponse } from 'next/server';
import { testAiConnection } from '@/lib/ai/universalAiClient';
import { AiProviderConfig } from '@/types/aiConfig';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = body?.aiConfig as AiProviderConfig;

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'No AI configuration provided.' },
        { status: 400 }
      );
    }

    const result = await testAiConnection(config);
    return NextResponse.json({
      success: true,
      model: result.model,
      message: result.message,
    });
  } catch (error: any) {
    console.error('AI Connection Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection test failed',
      },
      { status: 500 }
    );
  }
}

