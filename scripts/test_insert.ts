import { getDatabase, initializeDatabase } from '../apps/backend/src/database/index.ts';

async function testInsert() {
    await initializeDatabase();
    const db = getDatabase();

    try {
        console.log('Testing simple insert...');

        const eventType = 'test';
        const status = 'success';
        const details = '{}';

        console.log('Values:', { eventType, status, details });

        const result = db.prepare(`
            INSERT INTO project_lifecycle_events (event_type, status, details)
            VALUES (?, ?, ?)
        `).run(eventType, status, details);

        console.log('✅ Insert result:', result);

        // Check if it was inserted
        const rows = db.prepare(`SELECT * FROM project_lifecycle_events`).all();
        console.log('Rows:', rows);
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

testInsert();
