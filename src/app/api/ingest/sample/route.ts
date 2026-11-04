import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parsePdfBuffer } from '@/lib/pdfParser';
import { detectSections } from '@/lib/corpusAggregator';
import { ParsedDocument } from '@/types/ingestion';

export async function GET() {
  try {
    const candidatePdfPath = path.join(process.cwd(), 'Cv info', 'ABDULLAH_ADEMI(1).pdf');

    if (!fs.existsSync(candidatePdfPath)) {
      return NextResponse.json(
        { error: 'Sample candidate CV not found at Cv info/ABDULLAH_ADEMI(1).pdf' },
        { status: 404 }
      );
    }

    const buffer = fs.readFileSync(candidatePdfPath);
    const pdfResult = await parsePdfBuffer(buffer);
    const stats = fs.statSync(candidatePdfPath);

    const trimmedText = pdfResult.text.trim();
    const wordCount = trimmedText.length > 0 ? trimmedText.split(/\s+/).length : 0;
    const charCount = trimmedText.length;
    const sectionsDetected = detectSections(trimmedText);

    const doc: ParsedDocument = {
      id: `sample_doc_abdullah_${Date.now()}`,
      name: 'ABDULLAH_ADEMI.pdf',
      size: stats.size,
      type: 'pdf',
      extractedText: trimmedText,
      pageCount: pdfResult.pageCount,
      charCount,
      wordCount,
      uploadedAt: new Date().toISOString(),
      sectionsDetected,
    };

    return NextResponse.json({
      document: doc,
      recommendedGithubUsername: 'abdullah1053',
      recommendedBio:
        'Full-Stack Developer (PHP/Laravel & ReactJS) with 4+ years of experience designing, scaling, and maintaining production web applications using PHP (Laravel), ReactJS, and AWS (EC2, RDS, S3).',
    });
  } catch (error) {
    console.error('Error loading sample CV:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load sample CV' },
      { status: 500 }
    );
  }
}
