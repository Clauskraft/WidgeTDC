import { getDatabase, initializeDatabase } from '../apps/backend/src/database/index.ts';

async function debugSchema() {
    await initializeDatabase();
    const db = getDatabase();

    try {
        const result = (db as any).exec("PRAGMA table_info(project_lifecycle_events)");
        console.log('Table Info:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
}

debugSchema();
