import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/sqlite';
import {
  getAllCareerBullets,
  normalizeBulletCategory,
  rowToCareerBullet,
} from '@/lib/db/careerBulletsRepo';
import { CareerBullet } from '@/types/careerTrack';

export const dynamic = 'force-dynamic';

function createBulletRecord(input: Partial<CareerBullet>, indexOffset = 0): CareerBullet | null {
  const text = typeof input.bulletText === 'string' ? input.bulletText.trim() : '';
  if (!text) return null;

  return {
    id:
      input.id && input.id.trim().length > 0
        ? input.id.trim()
        : `cb_${Date.now()}_${indexOffset}_${Math.random().toString(36).substring(2, 7)}`,
    category: normalizeBulletCategory(input.category),
    contextLabel: input.contextLabel?.trim() || undefined,
    bulletText: text,
    isActiveForAi: input.isActiveForAi !== undefined ? Boolean(input.isActiveForAi) : true,
    createdAt: input.createdAt || new Date(Date.now() + indexOffset).toISOString(),
  };
}

export async function GET() {
  try {
    const db = getDatabase();
    const bullets = getAllCareerBullets(db);
    return NextResponse.json({ success: true, bullets });
  } catch (error: any) {
    console.error('Error fetching career bullets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch career knowledge base' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();

    // Mark as seeded so user-managed list won't auto-reseed if later cleared
    db.prepare(`
      INSERT INTO app_settings (key, value_json, updated_at)
      VALUES ('career_bullets_seeded', 'true', ?)
      ON CONFLICT(key) DO NOTHING
    `).run(new Date().toISOString());

    const insertStmt = db.prepare(`
      INSERT INTO career_bullets (id, category, context_label, bullet_text, is_active_for_ai, created_at)
      VALUES (@id, @category, @context_label, @bullet_text, @is_active_for_ai, @created_at)
    `);

    // Bulk insert support
    if (Array.isArray(body?.bullets)) {
      const created: CareerBullet[] = [];
      body.bullets.forEach((raw: Partial<CareerBullet>, idx: number) => {
        const record = createBulletRecord(raw, idx);
        if (record) created.push(record);
      });

      if (created.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one non-empty bulletText is required' },
          { status: 400 }
        );
      }

      const insertMany = db.transaction((items: CareerBullet[]) => {
        for (const item of items) {
          insertStmt.run({
            id: item.id,
            category: item.category,
            context_label: item.contextLabel || null,
            bullet_text: item.bulletText,
            is_active_for_ai: item.isActiveForAi ? 1 : 0,
            created_at: item.createdAt,
          });
        }
      });

      insertMany(created);
      return NextResponse.json({ success: true, bullets: created });
    }

    // Single bullet insert (supports { bullet: {...} } or flat body)
    const rawBullet = (body?.bullet || body) as Partial<CareerBullet>;
    const record = createBulletRecord(rawBullet);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'bulletText is required' },
        { status: 400 }
      );
    }

    insertStmt.run({
      id: record.id,
      category: record.category,
      context_label: record.contextLabel || null,
      bullet_text: record.bulletText,
      is_active_for_ai: record.isActiveForAi ? 1 : 0,
      created_at: record.createdAt,
    });

    return NextResponse.json({ success: true, bullet: record });
  } catch (error: any) {
    console.error('Error creating career bullet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bullet' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = (body?.bullet || body) as Partial<CareerBullet>;

    if (!raw?.id) {
      return NextResponse.json(
        { success: false, error: 'Bullet id is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const existingRow = db
      .prepare('SELECT * FROM career_bullets WHERE id = ?')
      .get(raw.id);

    if (!existingRow) {
      return NextResponse.json(
        { success: false, error: 'Career bullet not found' },
        { status: 404 }
      );
    }

    const existing = rowToCareerBullet(existingRow);
    const updatedText =
      typeof raw.bulletText === 'string' ? raw.bulletText.trim() : existing.bulletText;

    if (!updatedText) {
      return NextResponse.json(
        { success: false, error: 'bulletText cannot be empty' },
        { status: 400 }
      );
    }

    const updated: CareerBullet = {
      id: existing.id,
      category:
        raw.category !== undefined ? normalizeBulletCategory(raw.category) : existing.category,
      contextLabel:
        raw.contextLabel !== undefined
          ? raw.contextLabel.trim() || undefined
          : existing.contextLabel,
      bulletText: updatedText,
      isActiveForAi:
        raw.isActiveForAi !== undefined ? Boolean(raw.isActiveForAi) : existing.isActiveForAi,
      createdAt: existing.createdAt,
    };

    db.prepare(`
      UPDATE career_bullets SET
        category = @category,
        context_label = @context_label,
        bullet_text = @bullet_text,
        is_active_for_ai = @is_active_for_ai
      WHERE id = @id
    `).run({
      id: updated.id,
      category: updated.category,
      context_label: updated.contextLabel || null,
      bullet_text: updated.bulletText,
      is_active_for_ai: updated.isActiveForAi ? 1 : 0,
    });

    return NextResponse.json({ success: true, bullet: updated });
  } catch (error: any) {
    console.error('Error updating career bullet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bullet' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bullet ID is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = db.prepare('DELETE FROM career_bullets WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Career bullet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting career bullet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete bullet' },
      { status: 500 }
    );
  }
}

