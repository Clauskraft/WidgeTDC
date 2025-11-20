import { getDatabase } from './index.js';

export async function seedDatabase() {
  const db = await getDatabase();

  console.log('Seeding database...');

  return new Promise<void>((resolve, reject) => {
    // Simple seed data with minimal complexity for sqlite3
    const memories = [
      ['org-1', 'user-1', 'DecisionOutcome', 'Decided to use TypeScript for the backend', 5],
      ['org-1', 'user-1', 'CustomerPreference', 'Customer prefers minimal UI with dark mode', 4],
    ];

    let completed = 0;
    const total = memories.length;

    memories.forEach((mem) => {
      db.run(
        'INSERT INTO memory_entities (org_id, user_id, entity_type, content, importance) VALUES (?, ?, ?, ?, ?)',
        mem,
        function(err) {
          if (err) {
            console.error('Error inserting memory:', err);
            reject(err);
            return;
          }
          completed++;
          if (completed === total) {
            console.log('✅ Database seeded successfully');
            resolve();
          }
        }
      );
    });

    // If no items, resolve immediately
    if (total === 0) {
      console.log('✅ Database seeded successfully');
      resolve();
    }
  });
}

// Run seeds if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
