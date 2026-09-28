import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AtsPdfDocument } from '@/lib/pdf/AtsPdfDocument';
import { MasterCvProfile } from '@/types/masterCv';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';

export const dynamic = 'force-dynamic';

function getFallbackProfile(): MasterCvProfile {
  return getDefaultMasterProfile();
}

export async function POST(req: NextRequest) {
  try {
    let profile: MasterCvProfile;
    const body = await req.json().catch(() => null);

    if (body?.profile && body.profile.personalInfo) {
      profile = body.profile;
    } else {
      profile = getFallbackProfile();
    }

    const docElement = React.createElement(AtsPdfDocument, { profile });
    const buffer = await renderToBuffer(docElement as any);

    const safeName = (profile.personalInfo.fullName || 'Candidate')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_ATS_Resume.pdf`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating ATS PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to render PDF document',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const profile = getFallbackProfile();
    const docElement = React.createElement(AtsPdfDocument, { profile });
    const buffer = await renderToBuffer(docElement as any);

    const safeName = (profile.personalInfo.fullName || 'Candidate')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_ATS_Resume.pdf`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/cv/download-pdf:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to render PDF document',
      },
      { status: 500 }
    );
  }
}
