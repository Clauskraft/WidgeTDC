import { getDatabase, initializeDatabase } from '../apps/backend/src/database/index.ts';

async function debugSchema() {
    await initializeDatabase();
    const db = getDatabase();

    try {
        const tableInfo = db.run("PRAGMA table_info(project_lifecycle_events)");
        console.log('Table Info:', tableInfo);
    } catch (e) {
        console.error(e);
    }
}

debugSchema();
