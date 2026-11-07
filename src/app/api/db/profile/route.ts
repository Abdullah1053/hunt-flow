import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/sqlite';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';
import { MasterCvProfile } from '@/types/masterCv';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDatabase();
    const row = db
      .prepare('SELECT profile_json FROM cv_profiles WHERE is_master = 1 ORDER BY updated_at DESC LIMIT 1')
      .get() as { profile_json: string } | undefined;

    if (row && row.profile_json) {
      const profile = JSON.parse(row.profile_json) as MasterCvProfile;
      return NextResponse.json({ success: true, profile });
    }

    // Seed default master profile if empty
    const defaultProfile = getDefaultMasterProfile();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO cv_profiles (id, name, is_master, profile_json, updated_at)
      VALUES (?, ?, 1, ?, ?)
    `).run(
      'master',
      defaultProfile.personalInfo.fullName || 'Master Profile',
      JSON.stringify(defaultProfile),
      now
    );

    return NextResponse.json({ success: true, profile: defaultProfile });
  } catch (error: any) {
    console.error('Error fetching CV profile from SQLite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = body?.profile as MasterCvProfile;

    if (!profile || !profile.personalInfo) {
      return NextResponse.json(
        { success: false, error: 'Invalid profile data provided' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const name = profile.personalInfo.fullName || 'Master Profile';
    const profileJson = JSON.stringify(profile);

    // Upsert into master slot
    db.prepare(`
      INSERT INTO cv_profiles (id, name, is_master, profile_json, updated_at)
      VALUES ('master', ?, 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        is_master = 1,
        profile_json = excluded.profile_json,
        updated_at = excluded.updated_at
    `).run(name, profileJson, now);

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error saving CV profile to SQLite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save profile' },
      { status: 500 }
    );
  }
}

