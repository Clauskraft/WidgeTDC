import { prisma } from './prisma.js';
export async function seedDatabase() {
    console.log('Seeding database with Prisma...');
    // Seed data for memory entities
    const memories = [
        { orgId: 'org-1', userId: 'user-1', entityType: 'DecisionOutcome', content: 'Decided to use TypeScript for the backend', importance: 5 },
        { orgId: 'org-1', userId: 'user-1', entityType: 'CustomerPreference', content: 'Customer prefers minimal UI with dark mode', importance: 4 },
    ];
    try {
        // Check if seed data already exists
        const existingCount = await prisma.memoryEntity.count({
            where: { orgId: 'org-1' }
        });
        if (existingCount > 0) {
            console.log(`Skipping seed - ${existingCount} entries already exist for org-1`);
            return;
        }
        // Create seed entries
        const result = await prisma.memoryEntity.createMany({
            data: memories,
        });
        console.log(`Database seeded successfully (${result.count} entries created)`);
    }
    catch (err) {
        console.error('Error seeding database:', err);
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
