// Server-side DOCX text extraction utility
import mammoth from 'mammoth';

export async function parseDocxBuffer(buffer: Buffer): Promise<{ text: string }> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: (result.value || '').trim(),
    };
  } catch (error) {
    console.error('Failed to parse DOCX:', error);
    throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
