import { getDatabase } from './index.js';

export async function seedDatabase() {
  const db = getDatabase();

  console.log('Seeding database...');

  // Simple seed data with minimal complexity for sqlite3
  const memories = [
    ['org-1', 'user-1', 'DecisionOutcome', 'Decided to use TypeScript for the backend', 5],
    ['org-1', 'user-1', 'CustomerPreference', 'Customer prefers minimal UI with dark mode', 4],
  ];

  let completed = 0;
  const total = memories.length;

  try {
    memories.forEach((mem) => {
      // sql.js run takes params as second argument
      db.run(
        'INSERT INTO memory_entities (org_id, user_id, entity_type, content, importance) VALUES (?, ?, ?, ?, ?)',
        mem
      );
      completed++;
    });
    console.log('✅ Database seeded successfully');
  } catch (err) {
    console.error('Error inserting memory:', err);
    throw err;
  }
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
