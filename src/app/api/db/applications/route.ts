import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/sqlite';
import { JobApplicationRecord } from '@/types/pipeline';
import { getSampleJobApplications } from '@/data/samplePipeline';

export const dynamic = 'force-dynamic';

function rowToRecord(row: any): JobApplicationRecord {
  return {
    id: row.id,
    company: row.company,
    jobTitle: row.job_title,
    jobUrl: row.job_url || '',
    jobDescription: row.job_description || '',
    status: row.status,
    appliedDate: row.applied_date || '',
    submittedPdfDataUrl: row.submitted_pdf_data_url || undefined,
    submittedPdfFileName: row.submitted_pdf_filename || undefined,
    tailoredCvSnapshot: row.cv_snapshot_json ? JSON.parse(row.cv_snapshot_json) : undefined,
  };
}

export async function GET() {
  try {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM job_applications ORDER BY applied_date DESC, created_at DESC')
      .all();

    if (rows.length === 0) {
      // Seed sample data on first start
      const samples = getSampleJobApplications();
      const insertStmt = db.prepare(`
        INSERT INTO job_applications (
          id, company, job_title, job_url, job_description, status,
          applied_date, submitted_pdf_data_url, submitted_pdf_filename,
          cv_snapshot_json, created_at, updated_at
        ) VALUES (
          @id, @company, @job_title, @job_url, @job_description, @status,
          @applied_date, @submitted_pdf_data_url, @submitted_pdf_filename,
          @cv_snapshot_json, @created_at, @updated_at
        )
      `);

      const now = new Date().toISOString();
      const insertMany = db.transaction((apps: JobApplicationRecord[]) => {
        for (const app of apps) {
          insertStmt.run({
            id: app.id,
            company: app.company,
            job_title: app.jobTitle,
            job_url: app.jobUrl || '',
            job_description: app.jobDescription || '',
            status: app.status,
            applied_date: app.appliedDate || '',
            submitted_pdf_data_url: app.submittedPdfDataUrl || null,
            submitted_pdf_filename: app.submittedPdfFileName || null,
            cv_snapshot_json: app.tailoredCvSnapshot ? JSON.stringify(app.tailoredCvSnapshot) : null,
            created_at: now,
            updated_at: now,
          });
        }
      });

      insertMany(samples);
      return NextResponse.json({ success: true, applications: samples });
    }

    const applications = rows.map(rowToRecord);
    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('Error fetching job applications from SQLite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const app = body?.application as JobApplicationRecord;

    if (!app || !app.id || !app.company || !app.jobTitle) {
      return NextResponse.json(
        { success: false, error: 'Missing required application fields' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO job_applications (
        id, company, job_title, job_url, job_description, status,
        applied_date, submitted_pdf_data_url, submitted_pdf_filename,
        cv_snapshot_json, created_at, updated_at
      ) VALUES (
        @id, @company, @job_title, @job_url, @job_description, @status,
        @applied_date, @submitted_pdf_data_url, @submitted_pdf_filename,
        @cv_snapshot_json, @created_at, @updated_at
      )
    `).run({
      id: app.id,
      company: app.company,
      job_title: app.jobTitle,
      job_url: app.jobUrl || '',
      job_description: app.jobDescription || '',
      status: app.status || 'applied',
      applied_date: app.appliedDate || '',
      submitted_pdf_data_url: app.submittedPdfDataUrl || null,
      submitted_pdf_filename: app.submittedPdfFileName || null,
      cv_snapshot_json: app.tailoredCvSnapshot ? JSON.stringify(app.tailoredCvSnapshot) : null,
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ success: true, application: app });
  } catch (error: any) {
    console.error('Error adding job application to SQLite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create application' },
      { status: 500 }
    );
  }
}

