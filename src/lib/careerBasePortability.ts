import { CareerBullet, CareerBulletCategory } from '@/types/careerTrack';

const CATEGORY_ORDER: CareerBulletCategory[] = [
  'experience',
  'project',
  'skill_tech',
  'education_cert',
  'general',
];

function groupBulletsBySection(bullets: CareerBullet[]) {
  const groups = new Map<
    string,
    { category: CareerBulletCategory; contextLabel?: string; items: CareerBullet[] }
  >();

  // Preserve category order then insertion order within each category
  const sorted = [...bullets].sort((a, b) => {
    const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return (a.contextLabel || '').localeCompare(b.contextLabel || '');
  });

  for (const b of sorted) {
    const ctx = b.contextLabel?.trim() || '';
    const key = `${b.category}::${ctx}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        category: b.category,
        contextLabel: ctx || undefined,
        items: [],
      };
      groups.set(key, group);
    }
    group.items.push(b);
  }

  return Array.from(groups.values());
}

function formatSectionHeader(category: CareerBulletCategory, contextLabel?: string): string {
  const cat = category.toUpperCase();
  return contextLabel ? `[${cat} - ${contextLabel}]` : `[${cat}]`;
}

export function formatCareerBulletsAsTxt(bullets: CareerBullet[]): string {
  const groups = groupBulletsBySection(bullets);
  const lines: string[] = ['=== CAREER KNOWLEDGE BASE ==='];

  for (const group of groups) {
    lines.push('');
    lines.push(formatSectionHeader(group.category, group.contextLabel));
    for (const item of group.items) {
      lines.push(`- ${item.bulletText}`);
    }
  }

  return lines.join('\n') + '\n';
}

export function formatCareerBulletsAsMd(bullets: CareerBullet[]): string {
  const groups = groupBulletsBySection(bullets);
  const lines: string[] = ['# Career Knowledge Base'];

  for (const group of groups) {
    lines.push('');
    lines.push(`## ${formatSectionHeader(group.category, group.contextLabel)}`);
    for (const item of group.items) {
      lines.push(`- ${item.bulletText}`);
    }
  }

  return lines.join('\n') + '\n';
}

function mapCategoryToken(token: string): CareerBulletCategory {
  const normalized = token.trim().toLowerCase();
  if (normalized === 'experience' || normalized === 'work_experience' || normalized === 'work') {
    return 'experience';
  }
  if (normalized === 'project' || normalized === 'projects') {
    return 'project';
  }
  if (normalized === 'skill_tech' || normalized === 'skills' || normalized === 'skill' || normalized === 'tech') {
    return 'skill_tech';
  }
  if (
    normalized === 'education_cert' ||
    normalized === 'education' ||
    normalized === 'cert' ||
    normalized === 'certifications'
  ) {
    return 'education_cert';
  }
  return 'general';
}

export function parseCareerTextOrMarkdown(content: string): Array<Partial<CareerBullet>> {
  const lines = content.split(/\r?\n/);
  const parsed: Array<Partial<CareerBullet>> = [];

  let currentCategory: CareerBulletCategory = 'general';
  let currentContext: string | undefined = undefined;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip document title banners
    if (/^===\s*.*\s*===$/.test(trimmed) || /^#\s+/.test(trimmed)) {
      continue;
    }

    // Match [CATEGORY - Context] or ## [CATEGORY - Context] or [CATEGORY]
    const headerMatch = trimmed.match(/^(?:##+\s*)?\[([^\]\-]+?)(?:\s*-\s*([^\]]+))?\]\s*$/);
    if (headerMatch) {
      currentCategory = mapCategoryToken(headerMatch[1]);
      currentContext = headerMatch[2]?.trim() || undefined;
      continue;
    }

    // Match bullet lines starting with -, •, or *
    const bulletMatch = rawLine.match(/^\s*[-•*]\s+(.+)$/);
    if (bulletMatch && bulletMatch[1].trim()) {
      parsed.push({
        category: currentCategory,
        contextLabel: currentContext,
        bulletText: bulletMatch[1].trim(),
        isActiveForAi: true,
      });
    }
  }

  return parsed;
}

export function parseCareerJson(content: string): Array<Partial<CareerBullet>> {
  const raw = JSON.parse(content);
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.bullets) ? raw.bullets : null;
  if (!arr) {
    throw new Error('JSON must be an array of career bullets or { bullets: [...] }.');
  }

  return arr
    .filter((item: any) => item && typeof item.bulletText === 'string' && item.bulletText.trim().length > 0)
    .map((item: any) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      category: typeof item.category === 'string' ? mapCategoryToken(item.category) : 'general',
      contextLabel: typeof item.contextLabel === 'string' ? item.contextLabel.trim() || undefined : undefined,
      bulletText: item.bulletText.trim(),
      isActiveForAi: item.isActiveForAi !== undefined ? Boolean(item.isActiveForAi) : true,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    }));
}

