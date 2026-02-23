import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'drivemigrate.db');

let db;

export function initDb() {
  // Create data directory synchronously before opening DB
  fs.mkdirSync(DATA_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      source_email TEXT NOT NULL,
      dest_email TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      total_files INTEGER DEFAULT 0,
      transferred INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      skipped INTEGER DEFAULT 0,
      selected_items TEXT,
      error_log TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database initialized');
  return db;
}

export function getDb() {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
}

export function createJob(id, sourceEmail, destEmail, selectedItems) {
  const d = getDb();
  d.prepare(`
    INSERT INTO jobs (id, source_email, dest_email, selected_items)
    VALUES (?, ?, ?, ?)
  `).run(id, sourceEmail, destEmail, JSON.stringify(selectedItems));
  return getJob(id);
}

export function getJob(id) {
  const d = getDb();
  const job = d.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  if (!job) return null;
  return {
    ...job,
    selected_items: JSON.parse(job.selected_items || '[]'),
    error_log: JSON.parse(job.error_log || '[]'),
  };
}

export function updateJob(id, fields) {
  const d = getDb();
  const allowed = ['status', 'total_files', 'transferred', 'failed', 'skipped', 'error_log'];
  const sets = Object.keys(fields)
    .filter(k => allowed.includes(k))
    .map(k => `${k} = ?`)
    .join(', ');
  const values = Object.keys(fields)
    .filter(k => allowed.includes(k))
    .map(k => typeof fields[k] === 'object' ? JSON.stringify(fields[k]) : fields[k]);
  if (!sets) return;
  d.prepare(`UPDATE jobs SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
}
