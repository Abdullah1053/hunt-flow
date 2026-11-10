import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'huntflow.db');
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency and reliability
  db.pragma('journal_mode = WAL');

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS cv_profiles (
      id TEXT PRIMARY KEY,
      name TEXT,
      is_master INTEGER DEFAULT 1,
      profile_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      job_title TEXT NOT NULL,
      job_url TEXT,
      job_description TEXT,
      status TEXT NOT NULL,
      applied_date TEXT,
      submitted_pdf_data_url TEXT,
      submitted_pdf_filename TEXT,
      cv_snapshot_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS career_track_entries (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      organization TEXT NOT NULL,
      location TEXT,
      startDate TEXT,
      endDate TEXT,
      rawNotes TEXT,
      bulletsJson TEXT,
      techTagsJson TEXT,
      linksJson TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS career_bullets (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      context_label TEXT,
      bullet_text TEXT NOT NULL,
      is_active_for_ai INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  dbInstance = db;
  return db;
}

