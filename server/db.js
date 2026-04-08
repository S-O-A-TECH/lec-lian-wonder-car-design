import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'wonder-car.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables using better-sqlite3's exec method (NOT child_process.exec)
const schema = `
  CREATE TABLE IF NOT EXISTS designs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname    TEXT NOT NULL,
    title       TEXT NOT NULL,
    brand       TEXT NOT NULL,
    base_model  TEXT NOT NULL,
    parts_config TEXT NOT NULL,
    thumbnail   TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS likes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    design_id   INTEGER NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    nickname    TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(design_id, nickname)
  );
`;

db.exec(schema);

export default db;
