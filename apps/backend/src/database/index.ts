import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Database {
  run: (sql: string, params?: unknown[]) => { changes: number; lastID?: number };
  all: (sql: string, params?: unknown[]) => unknown[];
  get: (sql: string, params?: unknown[]) => unknown;
  exec: (sql: string) => void;
  close: () => void;
}

let db: any = null;
let SQL: any = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    // Initialize sql.js
    SQL = await initSqlJs();
    db = new SQL.Database();

    // Initialize schema
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.run(schema);

    console.log('✅ Database initialized successfully with sql.js (pure JavaScript)');
  }

  return {
    run: (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
      return { changes: 1, lastID: Date.now() };
    },
    all: (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results: unknown[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    get: (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result;
      }
      stmt.free();
      return null;
    },
    exec: (sql: string) => {
      db.run(sql);
    },
    close: () => {
      if (db) db.close();
      db = null;
    }
  };
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
