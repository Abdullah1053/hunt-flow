import { NextRequest, NextResponse } from 'next/server';
import { parsePdfBuffer } from '@/lib/pdfParser';
import { parseDocxBuffer } from '@/lib/docxParser';
import { detectSections } from '@/lib/corpusAggregator';
import { ParsedDocument } from '@/types/ingestion';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded. Please attach at least one file.' },
        { status: 400 }
      );
    }

    const parsedDocuments: ParsedDocument[] = [];

    for (const file of files) {
      const fileName = file.name;
      const fileSize = file.size;
      const ext = fileName.split('.').pop()?.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let extractedText = '';
      let pageCount = 1;
      let docType: ParsedDocument['type'] = 'unknown';

      if (ext === 'pdf') {
        docType = 'pdf';
        const pdfResult = await parsePdfBuffer(buffer);
        extractedText = pdfResult.text;
        pageCount = pdfResult.pageCount;
      } else if (ext === 'docx') {
        docType = 'docx';
        const docxResult = await parseDocxBuffer(buffer);
        extractedText = docxResult.text;
      } else if (ext === 'txt') {
        docType = 'txt';
        extractedText = buffer.toString('utf-8');
      } else if (ext === 'md') {
        docType = 'md';
        extractedText = buffer.toString('utf-8');
      } else {
        return NextResponse.json(
          {
            error: `Unsupported file type for "${fileName}". Only .pdf, .docx, .txt, and .md files are supported.`,
          },
          { status: 400 }
        );
      }

      const trimmedText = extractedText.trim();
      const wordCount = trimmedText.length > 0 ? trimmedText.split(/\s+/).length : 0;
      const charCount = trimmedText.length;
      const sectionsDetected = detectSections(trimmedText);

      parsedDocuments.push({
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: fileName,
        size: fileSize,
        type: docType,
        extractedText: trimmedText,
        pageCount,
        charCount,
        wordCount,
        uploadedAt: new Date().toISOString(),
        sectionsDetected,
      });
    }

    return NextResponse.json({
      documents: parsedDocuments,
    });
  } catch (error) {
    console.error('Error parsing uploaded documents:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse documents' },
      { status: 500 }
    );
  }
}
