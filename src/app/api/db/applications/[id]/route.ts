import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/sqlite';
import { JobApplicationRecord } from '@/types/pipeline';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const app = body?.application as JobApplicationRecord;

    if (!app) {
      return NextResponse.json(
        { success: false, error: 'Missing application data' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    const info = db.prepare(`
      UPDATE job_applications SET
        company = @company,
        job_title = @job_title,
        job_url = @job_url,
        job_description = @job_description,
        status = @status,
        applied_date = @applied_date,
        submitted_pdf_data_url = @submitted_pdf_data_url,
        submitted_pdf_filename = @submitted_pdf_filename,
        cv_snapshot_json = @cv_snapshot_json,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id,
      company: app.company,
      job_title: app.jobTitle,
      job_url: app.jobUrl || '',
      job_description: app.jobDescription || '',
      status: app.status || 'applied',
      applied_date: app.appliedDate || '',
      submitted_pdf_data_url: app.submittedPdfDataUrl || null,
      submitted_pdf_filename: app.submittedPdfFileName || null,
      cv_snapshot_json: app.tailoredCvSnapshot ? JSON.stringify(app.tailoredCvSnapshot) : null,
      updated_at: now,
    });

    if (info.changes === 0) {
      // If not present, try inserting
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
        id,
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
    }

    return NextResponse.json({ success: true, application: app });
  } catch (error: any) {
    console.error('Error updating application in SQLite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDatabase();
    db.prepare('DELETE FROM job_applications WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting application from SQLite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete application' },
      { status: 500 }
    );
  }
}

