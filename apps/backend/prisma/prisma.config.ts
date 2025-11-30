import path from 'node:path';
import type { PrismaConfig } from 'prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create a PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL || 'postgresql://widgetdc:widgetdc_dev@localhost:5433/widgetdc';

const pool = new Pool({ connectionString });

export default {
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),

  // Database migration connection (for prisma migrate)
  migrate: {
    adapter: async () => new PrismaPg(pool)
  }
} satisfies PrismaConfig;
