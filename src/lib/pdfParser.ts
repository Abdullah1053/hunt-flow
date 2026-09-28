// Server-side PDF extraction utility

export async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    // Dynamic require to prevent client bundle evaluation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require('pdf-parse');
    const PDFParse = pdf.PDFParse || pdf.default?.PDFParse;

    if (!PDFParse) {
      throw new Error('PDFParse class not found in pdf-parse module');
    }

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }

    const text = result?.text || '';
    const pageCount = result?.total || 1;

    return {
      text: text.trim(),
      pageCount,
    };
  } catch (error) {
    console.error('Failed to parse PDF:', error);
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
