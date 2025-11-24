import { getDatabase, initializeDatabase } from '../apps/backend/src/database/index.ts';

async function showSchema() {
    await initializeDatabase();
    const db = getDatabase();

    const result = (db as any).exec("PRAGMA table_info(project_lifecycle_events)");
    const cols = result[0].values.map((row: any) => row[1]); // column names
    console.log('Actual column names:', cols);
}

showSchema();
