import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
    if (db) return db;

    const dbPath = join(__dirname, '../../../widget-tdc.db');
    db = new Database(dbPath);

    // Load and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    db.exec(schema);

    console.log('✅ SQLite database initialized');
    return db;
}

export function getDatabase(): Database.Database {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('Database closed');
    }
}
