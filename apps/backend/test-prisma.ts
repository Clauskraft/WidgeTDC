import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    // List tables
    const tables = await prisma.$queryRaw<{tablename: string}[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    console.log('📋 Tables:', tables.map(t => t.tablename).join(', '));

    // Check pgvector extension
    const extensions = await prisma.$queryRaw<{extname: string}[]>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    console.log('🔢 pgvector:', extensions.length > 0 ? 'enabled ✅' : 'not installed ❌');

    // Try enabling pgvector if not present
    if (extensions.length === 0) {
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
        console.log('🔢 pgvector: now enabled ✅');
      } catch (e: any) {
        console.log('⚠️  Could not enable pgvector:', e.message);
      }
    }

    await prisma.$disconnect();
    console.log('✅ Test completed successfully!');
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
