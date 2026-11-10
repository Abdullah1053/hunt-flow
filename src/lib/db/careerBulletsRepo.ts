import Database from 'better-sqlite3';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';
import { CareerBullet, CareerBulletCategory } from '@/types/careerTrack';

const VALID_CATEGORIES = new Set<CareerBulletCategory>([
  'experience',
  'project',
  'skill_tech',
  'education_cert',
  'general',
]);

export function normalizeBulletCategory(cat?: string): CareerBulletCategory {
  if (cat && VALID_CATEGORIES.has(cat as CareerBulletCategory)) {
    return cat as CareerBulletCategory;
  }
  return 'general';
}

export function rowToCareerBullet(row: any): CareerBullet {
  return {
    id: row.id,
    category: normalizeBulletCategory(row.category),
    contextLabel: row.context_label || undefined,
    bulletText: row.bullet_text,
    isActiveForAi: Boolean(row.is_active_for_ai),
    createdAt: row.created_at,
  };
}

function buildInitialSeedBullets(): CareerBullet[] {
  const profile = getDefaultMasterProfile();
  const baseTime = Date.now();
  let offset = 0;
  const bullets: CareerBullet[] = [];

  const nextIso = () => new Date(baseTime - offset++ * 1000).toISOString();

  // 1. Experience bullets
  profile.experience.forEach((exp, expIdx) => {
    const label = `${exp.company} (${exp.startDate} - ${exp.endDate})`;
    exp.bullets.forEach((b, bIdx) => {
      bullets.push({
        id: `cb_exp_${expIdx}_${bIdx}`,
        category: 'experience',
        contextLabel: label,
        bulletText: b,
        isActiveForAi: true,
        createdAt: nextIso(),
      });
    });
  });

  // 2. Project bullets
  profile.projects.forEach((proj, projIdx) => {
    const label = proj.title;
    proj.bullets.forEach((b, bIdx) => {
      bullets.push({
        id: `cb_proj_${projIdx}_${bIdx}`,
        category: 'project',
        contextLabel: label,
        bulletText: b,
        isActiveForAi: true,
        createdAt: nextIso(),
      });
    });
  });

  // 3. Skills & Tech Stack bullets
  const skillGroups: Array<{ label: string; items: string[] }> = [
    { label: 'Languages', items: profile.skills.languages },
    { label: 'Frameworks & Libraries', items: profile.skills.frameworks },
    { label: 'Databases & Caching', items: profile.skills.databases },
    { label: 'DevOps & Cloud', items: profile.skills.devopsAndCloud },
    { label: 'Architecture & Concepts', items: profile.skills.toolsAndConcepts },
  ];

  skillGroups.forEach((group, idx) => {
    if (group.items.length > 0) {
      bullets.push({
        id: `cb_skill_${idx}`,
        category: 'skill_tech',
        contextLabel: group.label,
        bulletText: `${group.label}: ${group.items.join(', ')}.`,
        isActiveForAi: true,
        createdAt: nextIso(),
      });
    }
  });

  // 4. Education & Certifications
  profile.education.forEach((edu, idx) => {
    bullets.push({
      id: `cb_edu_${idx}`,
      category: 'education_cert',
      contextLabel: edu.institution,
      bulletText: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} (${edu.startDate} - ${edu.endDate})${edu.gpa ? ` — Grade: ${edu.gpa}` : ''}.`,
      isActiveForAi: true,
      createdAt: nextIso(),
    });
  });

  profile.certifications.forEach((cert, idx) => {
    bullets.push({
      id: `cb_cert_${idx}`,
      category: 'education_cert',
      contextLabel: cert.issuer || 'Certification',
      bulletText: `${cert.name} (${cert.issuer}${cert.date ? `, ${cert.date}` : ''}).`,
      isActiveForAi: true,
      createdAt: nextIso(),
    });
  });

  return bullets;
}

/**
 * Ensures initial career bullets are seeded once from the default Master CV profile,
 * then returns all career bullets ordered newest-first.
 */
export function getAllCareerBullets(db: Database.Database): CareerBullet[] {
  const rows = db
    .prepare('SELECT * FROM career_bullets ORDER BY created_at DESC')
    .all();

  if (rows.length > 0) {
    return rows.map(rowToCareerBullet);
  }

  const seededFlag = db
    .prepare("SELECT value_json FROM app_settings WHERE key = 'career_bullets_seeded'")
    .get() as { value_json: string } | undefined;

  if (seededFlag) {
    return [];
  }

  const seeds = buildInitialSeedBullets();
  const insertStmt = db.prepare(`
    INSERT INTO career_bullets (id, category, context_label, bullet_text, is_active_for_ai, created_at)
    VALUES (@id, @category, @context_label, @bullet_text, @is_active_for_ai, @created_at)
  `);

  const now = new Date().toISOString();
  const seedTx = db.transaction((items: CareerBullet[]) => {
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
    db.prepare(`
      INSERT INTO app_settings (key, value_json, updated_at)
      VALUES ('career_bullets_seeded', 'true', ?)
      ON CONFLICT(key) DO UPDATE SET value_json = 'true', updated_at = excluded.updated_at
    `).run(now);
  });

  seedTx(seeds);
  return seeds;
}

/**
 * Returns ONLY bullets explicitly marked active for AI (is_active_for_ai = 1).
 */
export function getActiveCareerBullets(db: Database.Database): CareerBullet[] {
  // Ensure initial seeding has occurred if table was never populated
  getAllCareerBullets(db);

  const rows = db
    .prepare('SELECT * FROM career_bullets WHERE is_active_for_ai = 1 ORDER BY created_at DESC')
    .all();

  return rows.map(rowToCareerBullet);
}

