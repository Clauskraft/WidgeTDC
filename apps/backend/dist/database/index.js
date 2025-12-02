import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let dbInstance = null;
let SQL = null;
let isInitializing = false;
let initPromise = null;
// Initialize database asynchronously - MUST be called before any repository usage
export async function initializeDatabase() {
    if (dbInstance)
        return;
    if (isInitializing) {
        await initPromise;
        return;
    }
    isInitializing = true;
    initPromise = (async () => {
        try {
            // Initialize sql.js
            SQL = await initSqlJs();
            dbInstance = new SQL.Database();
            // Initialize schema
            const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
            dbInstance.run(schema);
            console.log('✅ Database initialized successfully with sql.js (pure JavaScript)');
        }
        catch (error) {
            console.error('❌ Failed to initialize database:', error);
            throw error;
        }
        finally {
            isInitializing = false;
        }
    })();
    await initPromise;
}
// Get database synchronously - throws if not initialized
export function getDatabase() {
    if (!dbInstance) {
        throw new Error('Database not initialized! Call initializeDatabase() first.');
    }
    return dbInstance;
}
export function closeDatabase() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
