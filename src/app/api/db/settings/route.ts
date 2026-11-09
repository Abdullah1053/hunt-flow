import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/sqlite';
import { DEFAULT_AI_CONFIG, AiProviderConfig } from '@/types/aiConfig';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key') || 'ai_config';
    const db = getDatabase();

    const row = db
      .prepare('SELECT value_json FROM app_settings WHERE key = ?')
      .get(key) as { value_json: string } | undefined;

    if (row && row.value_json) {
      const value = JSON.parse(row.value_json);
      return NextResponse.json({ success: true, key, value });
    }

    // Default configuration with environment variable fallback
    if (key === 'ai_config') {
      const fallbackConfig: AiProviderConfig = { ...DEFAULT_AI_CONFIG };
      if (process.env.GEMINI_API_KEY) {
        fallbackConfig.apiKey = process.env.GEMINI_API_KEY;
      }
      return NextResponse.json({ success: true, key, value: fallbackConfig });
    }

    return NextResponse.json({ success: true, key, value: null });
  } catch (error: any) {
    console.error('Error fetching setting from SQLite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing key or value' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const valueJson = JSON.stringify(value);

    db.prepare(`
      INSERT INTO app_settings (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = excluded.updated_at
    `).run(key, valueJson, now);

    return NextResponse.json({ success: true, key, value });
  } catch (error: any) {
    console.error('Error saving setting to SQLite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save setting' },
      { status: 500 }
    );
  }
}

