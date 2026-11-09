import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/sqlite';
import { getDefaultMasterProfile } from '@/lib/deterministicSynthesizer';
import { CareerTrackEntry, CareerTrackCategory } from '@/types/careerTrack';

export const dynamic = 'force-dynamic';

function rowToEntry(row: any): CareerTrackEntry {
  return {
    id: row.id,
    category: row.category as CareerTrackCategory,
    title: row.title,
    organization: row.organization,
    location: row.location || undefined,
    startDate: row.startDate || undefined,
    endDate: row.endDate || undefined,
    rawNotes: row.rawNotes || undefined,
    bullets: row.bulletsJson ? JSON.parse(row.bulletsJson) : [],
    techTags: row.techTagsJson ? JSON.parse(row.techTagsJson) : [],
    links: row.linksJson ? JSON.parse(row.linksJson) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function generateInitialSeedEntries(): CareerTrackEntry[] {
  const profile = getDefaultMasterProfile();
  const now = new Date().toISOString();
  const entries: CareerTrackEntry[] = [];

  // 1. Work Experience -> work_experience
  profile.experience.forEach((exp, idx) => {
    entries.push({
      id: `ct_exp_${exp.id || idx}`,
      category: 'work_experience',
      title: exp.role,
      organization: exp.company,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      rawNotes: `Production engineering role at ${exp.company}. Responsible for end-to-end full stack architecture, cloud environments, high availability, and backend API performance.`,
      bullets: exp.bullets || [],
      techTags: ['AWS', 'EC2', 'RDS MySQL', 'ReactJS', 'RESTful APIs', 'OAuth', 'Sanctum', 'IAM'],
      createdAt: now,
      updatedAt: now,
    });
  });

  // 2. Projects -> project or infrastructure_security
  profile.projects.forEach((proj, idx) => {
    const isInfra =
      proj.title.toLowerCase().includes('infra') ||
      proj.title.toLowerCase().includes('linux') ||
      proj.title.toLowerCase().includes('ci/cd');

    entries.push({
      id: `ct_proj_${proj.id || idx}`,
      category: isInfra ? 'infrastructure_security' : 'project',
      title: proj.title,
      organization: proj.role || 'Doing Platform',
      startDate: proj.startDate || '2023',
      endDate: proj.endDate || 'Present',
      rawNotes: `System architecture and key implementations for ${proj.title}. Addressed high scalability, database query optimization, and resilient deployment pipelines.`,
      bullets: proj.bullets || [],
      techTags: proj.techStack || [],
      links: {
        githubUrl: proj.githubUrl || undefined,
        demoUrl: proj.demoUrl || undefined,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  // 3. Mentorship / Leadership
  entries.push({
    id: `ct_lead_1`,
    category: 'leadership_mentorship',
    title: 'Technical Lead & Developer Mentorship',
    organization: 'Doing Platform & Engineering Community',
    location: "Sana'a, Yemen",
    startDate: '2023',
    endDate: 'Present',
    rawNotes: 'Conducted weekly technical reviews, mentored junior and mid-level developers in React patterns, Git workflow hygiene, and clean backend architectural separation.',
    bullets: [
      'Mentored 6+ junior engineers on production Git workflows, React component design, and API error-handling patterns, reducing onboarding time by 35%.',
      'Instituted automated linting and code review checklists across frontend and backend repositories, decreasing regression bugs by 25%.',
    ],
    techTags: ['Code Review', 'Mentorship', 'Agile / Scrum', 'CI/CD Standards', 'System Design'],
    createdAt: now,
    updatedAt: now,
  });

  // 4. Certifications -> certification_award
  profile.certifications.forEach((cert, idx) => {
    entries.push({
      id: `ct_cert_${cert.id || idx}`,
      category: 'certification_award',
      title: cert.name,
      organization: cert.issuer,
      startDate: cert.date,
      endDate: cert.date,
      rawNotes: `Industry certification issued by ${cert.issuer}. Validates architectural proficiency and hands-on production competency.`,
      bullets: [
        `Demonstrated end-to-end expertise in ${cert.name} standards, system design best practices, and verified production architectures.`,
      ],
      techTags: cert.name.toLowerCase().includes('aws')
        ? ['AWS', 'Cloud Architecture', 'IAM', 'VPC', 'EC2', 'S3']
        : ['Frontend', 'React', 'JavaScript', 'UI Architecture'],
      links: {
        certificateUrl: cert.url || undefined,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  // 5. Education -> general_achievement
  profile.education.forEach((edu, idx) => {
    entries.push({
      id: `ct_edu_${edu.id || idx}`,
      category: 'general_achievement',
      title: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`,
      organization: edu.institution,
      startDate: edu.startDate,
      endDate: edu.endDate,
      rawNotes: `Academic foundation in Software Engineering and Information Technology at ${edu.institution}.`,
      bullets: edu.achievements && edu.achievements.length > 0
        ? edu.achievements
        : [
            'Graduated with honors in Information Technology, focusing on Distributed Systems, Relational Database Modeling, and Algorithm Design.',
          ],
      techTags: ['Algorithms', 'Data Structures', 'Database Systems', 'Operating Systems', 'Networking'],
      createdAt: now,
      updatedAt: now,
    });
  });

  return entries;
}

export async function GET() {
  try {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM career_track_entries ORDER BY updatedAt DESC, createdAt DESC')
      .all();

    if (rows.length === 0) {
      // Seed default career milestones from default profile
      const seedEntries = generateInitialSeedEntries();
      const insertStmt = db.prepare(`
        INSERT INTO career_track_entries (
          id, category, title, organization, location,
          startDate, endDate, rawNotes, bulletsJson,
          techTagsJson, linksJson, createdAt, updatedAt
        ) VALUES (
          @id, @category, @title, @organization, @location,
          @startDate, @endDate, @rawNotes, @bulletsJson,
          @techTagsJson, @linksJson, @createdAt, @updatedAt
        )
      `);

      const insertMany = db.transaction((entries: CareerTrackEntry[]) => {
        for (const entry of entries) {
          insertStmt.run({
            id: entry.id,
            category: entry.category,
            title: entry.title,
            organization: entry.organization,
            location: entry.location || null,
            startDate: entry.startDate || null,
            endDate: entry.endDate || null,
            rawNotes: entry.rawNotes || null,
            bulletsJson: JSON.stringify(entry.bullets || []),
            techTagsJson: JSON.stringify(entry.techTags || []),
            linksJson: entry.links ? JSON.stringify(entry.links) : null,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          });
        }
      });

      insertMany(seedEntries);
      return NextResponse.json({ success: true, entries: seedEntries });
    }

    const entries = rows.map(rowToEntry);
    return NextResponse.json({ success: true, entries });
  } catch (error: any) {
    console.error('Error fetching career track entries:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch career track' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entryData = body?.entry as Partial<CareerTrackEntry>;

    if (!entryData || !entryData.title || !entryData.organization || !entryData.category) {
      return NextResponse.json(
        { success: false, error: 'Title, organization, and category are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const id =
      entryData.id ||
      `ct_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newEntry: CareerTrackEntry = {
      id,
      category: entryData.category,
      title: entryData.title.trim(),
      organization: entryData.organization.trim(),
      location: entryData.location?.trim() || undefined,
      startDate: entryData.startDate?.trim() || undefined,
      endDate: entryData.endDate?.trim() || undefined,
      rawNotes: entryData.rawNotes?.trim() || undefined,
      bullets: Array.isArray(entryData.bullets) ? entryData.bullets : [],
      techTags: Array.isArray(entryData.techTags) ? entryData.techTags : [],
      links: entryData.links || undefined,
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO career_track_entries (
        id, category, title, organization, location,
        startDate, endDate, rawNotes, bulletsJson,
        techTagsJson, linksJson, createdAt, updatedAt
      ) VALUES (
        @id, @category, @title, @organization, @location,
        @startDate, @endDate, @rawNotes, @bulletsJson,
        @techTagsJson, @linksJson, @createdAt, @updatedAt
      )
    `).run({
      id: newEntry.id,
      category: newEntry.category,
      title: newEntry.title,
      organization: newEntry.organization,
      location: newEntry.location || null,
      startDate: newEntry.startDate || null,
      endDate: newEntry.endDate || null,
      rawNotes: newEntry.rawNotes || null,
      bulletsJson: JSON.stringify(newEntry.bullets),
      techTagsJson: JSON.stringify(newEntry.techTags),
      linksJson: newEntry.links ? JSON.stringify(newEntry.links) : null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    console.error('Error creating career track entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create entry' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const entryData = body?.entry as CareerTrackEntry;

    if (!entryData || !entryData.id || !entryData.title || !entryData.organization || !entryData.category) {
      return NextResponse.json(
        { success: false, error: 'Valid entry with id, title, organization, and category is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE career_track_entries SET
        category = @category,
        title = @title,
        organization = @organization,
        location = @location,
        startDate = @startDate,
        endDate = @endDate,
        rawNotes = @rawNotes,
        bulletsJson = @bulletsJson,
        techTagsJson = @techTagsJson,
        linksJson = @linksJson,
        updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id: entryData.id,
      category: entryData.category,
      title: entryData.title.trim(),
      organization: entryData.organization.trim(),
      location: entryData.location?.trim() || null,
      startDate: entryData.startDate?.trim() || null,
      endDate: entryData.endDate?.trim() || null,
      rawNotes: entryData.rawNotes?.trim() || null,
      bulletsJson: JSON.stringify(entryData.bullets || []),
      techTagsJson: JSON.stringify(entryData.techTags || []),
      linksJson: entryData.links ? JSON.stringify(entryData.links) : null,
      updatedAt: now,
    });

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    const updatedEntry: CareerTrackEntry = {
      ...entryData,
      updatedAt: now,
    };

    return NextResponse.json({ success: true, entry: updatedEntry });
  } catch (error: any) {
    console.error('Error updating career track entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update entry' },
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
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = db.prepare('DELETE FROM career_track_entries WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting career track entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete entry' },
      { status: 500 }
    );
  }
}

