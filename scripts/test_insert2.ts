import { getDatabase, initializeDatabase } from '../apps/backend/src/database/index.ts';

async function testInsert() {
    await initializeDatabase();
    const db = getDatabase();

    try {
        console.log('Testing with named parameters...');

        const result = db.prepare(`
            INSERT INTO project_lifecycle_events (event_type, status, details)
            VALUES ($eventType, $status, $details)
        `).run({ $eventType: 'test', $status: 'success', $details: '{}' } as any);

        console.log('✅ Insert result:', result);

        const rows = db.prepare(`SELECT * FROM project_lifecycle_events`).all();
        console.log('Rows:', rows);
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

testInsert();
