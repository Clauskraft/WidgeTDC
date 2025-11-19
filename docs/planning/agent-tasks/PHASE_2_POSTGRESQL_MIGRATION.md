# Phase 2: PostgreSQL Migration

## 🎯 Objective
Migrate from SQLite to PostgreSQL for scalability, transactional integrity, and multi-user support.

## 📋 Prerequisites
- Docker/PostgreSQL server available
- Backup of existing SQLite database
- Migration testing environment

## 🔧 Implementation Tasks

### Task 2.1: Database Schema Analysis & Design
**Agent**: Data Engineer
**Priority**: Critical
**Estimated Time**: 4 hours

**Deliverables**:
- [ ] Complete SQLite schema analysis
- [ ] PostgreSQL schema design document
- [ ] Data type mapping (SQLite → PostgreSQL)
- [ ] Index strategy document
- [ ] Migration plan with rollback procedures

**Current Schema Analysis**:
```sql
-- From apps/backend/src/database/schema.sql
-- Tables to migrate:
- memory_entities
- memory_relations
- memory_tags
- raw_documents
- structured_facts
- evolution_kpis
- decisions
- pal_focus_windows
- pal_stress_levels
```

**PostgreSQL Equivalents**:
```sql
-- Type Mappings
INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY
TEXT → TEXT or VARCHAR(n)
REAL → NUMERIC(precision, scale)
BLOB → BYTEA
TIMESTAMP → TIMESTAMP WITH TIME ZONE
```

### Task 2.2: Set Up PostgreSQL Infrastructure
**Agent**: DevOps Engineer
**Priority**: Critical
**Estimated Time**: 3 hours

**Deliverables**:
```yaml
# docker-compose.yml - Add PostgreSQL service
services:
  postgres:
    image: postgres:16-alpine
    container_name: widgettdc-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: widgettdc
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./apps/backend/src/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - widgettdc-network

  pgadmin:
    image: dpage/pgadmin4
    container_name: widgettdc-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "5050:80"
    networks:
      - widgettdc-network

volumes:
  postgres-data:

networks:
  widgettdc-network:
    driver: bridge
```

**Environment Configuration**:
```bash
# .env
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=widgettdc_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=widgettdc
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```

### Task 2.3: Implement ORM with Prisma
**Agent**: Backend Engineer
**Priority**: Critical
**Estimated Time**: 6 hours

**Deliverables**:
```prisma
// apps/backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MemoryEntity {
  id           Int               @id @default(autoincrement())
  orgId        String            @map("org_id") @db.VarChar(255)
  text         String
  metadata     Json?
  createdAt    DateTime          @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime          @updatedAt @map("updated_at") @db.Timestamptz

  relations    MemoryRelation[]  @relation("MemoryEntityRelations")
  tags         MemoryTag[]

  @@index([orgId])
  @@index([createdAt])
  @@map("memory_entities")
}

model MemoryRelation {
  id              Int          @id @default(autoincrement())
  sourceId        Int          @map("source_id")
  targetId        Int          @map("target_id")
  relationType    String       @map("relation_type") @db.VarChar(100)
  strength        Decimal      @default(1.0) @db.Decimal(3, 2)

  sourceEntity    MemoryEntity @relation("MemoryEntityRelations", fields: [sourceId], references: [id], onDelete: Cascade)

  @@index([sourceId])
  @@index([targetId])
  @@map("memory_relations")
}

model MemoryTag {
  id        Int          @id @default(autoincrement())
  entityId  Int          @map("entity_id")
  tag       String       @db.VarChar(100)

  entity    MemoryEntity @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@index([entityId])
  @@index([tag])
  @@map("memory_tags")
}

model RawDocument {
  id          Int      @id @default(autoincrement())
  orgId       String   @map("org_id") @db.VarChar(255)
  title       String?  @db.VarChar(500)
  content     String
  source      String?  @db.VarChar(200)
  ingestedAt  DateTime @default(now()) @map("ingested_at") @db.Timestamptz

  @@index([orgId])
  @@index([ingestedAt])
  @@map("raw_documents")
}

model StructuredFact {
  id        Int      @id @default(autoincrement())
  orgId     String   @map("org_id") @db.VarChar(255)
  subject   String   @db.VarChar(500)
  predicate String   @db.VarChar(200)
  object    String
  docId     Int?     @map("doc_id")

  @@index([orgId])
  @@index([subject])
  @@map("structured_facts")
}

model EvolutionKpi {
  id            Int      @id @default(autoincrement())
  decisionId    Int      @map("decision_id")
  kpiName       String   @map("kpi_name") @db.VarChar(200)
  expectedValue Decimal  @map("expected_value") @db.Decimal(10, 2)
  actualValue   Decimal? @map("actual_value") @db.Decimal(10, 2)
  measuredAt    DateTime @map("measured_at") @db.Timestamptz

  @@index([decisionId])
  @@index([measuredAt])
  @@map("evolution_kpis")
}

model Decision {
  id          Int      @id @default(autoincrement())
  orgId       String   @map("org_id") @db.VarChar(255)
  title       String   @db.VarChar(500)
  description String?
  madeAt      DateTime @map("made_at") @db.Timestamptz

  @@index([orgId])
  @@index([madeAt])
  @@map("decisions")
}

model PalFocusWindow {
  id        Int      @id @default(autoincrement())
  userId    String   @map("user_id") @db.VarChar(255)
  startTime DateTime @map("start_time") @db.Timestamptz
  endTime   DateTime @map("end_time") @db.Timestamptz
  priority  String   @db.VarChar(50)

  @@index([userId])
  @@index([startTime])
  @@map("pal_focus_windows")
}

model PalStressLevel {
  id          Int      @id @default(autoincrement())
  userId      String   @map("user_id") @db.VarChar(255)
  level       Int      @db.SmallInt
  measuredAt  DateTime @map("measured_at") @db.Timestamptz

  @@index([userId])
  @@index([measuredAt])
  @@map("pal_stress_levels")
}
```

**Database Client Implementation**:
```typescript
// apps/backend/src/database/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### Task 2.4: Update Repository Layer
**Agent**: Backend Engineer
**Priority**: Critical
**Estimated Time**: 8 hours

**Deliverables**:
```typescript
// apps/backend/src/services/memory/memoryRepository.ts
import prisma from '../../database/prisma.js';
import { MemoryEntity, Prisma } from '@prisma/client';

export class MemoryRepository {
  async ingestMemory(input: MemoryIngestInput): Promise<MemoryEntity> {
    return await prisma.memoryEntity.create({
      data: {
        orgId: input.orgId,
        text: input.text,
        metadata: input.metadata,
        tags: {
          create: input.tags?.map(tag => ({ tag })) ?? [],
        },
      },
      include: {
        tags: true,
      },
    });
  }

  async searchMemories(orgId: string, query: string): Promise<MemoryEntity[]> {
    return await prisma.memoryEntity.findMany({
      where: {
        orgId,
        text: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        tags: true,
        relations: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMemoryById(id: number): Promise<MemoryEntity | null> {
    return await prisma.memoryEntity.findUnique({
      where: { id },
      include: {
        tags: true,
        relations: true,
      },
    });
  }

  async updateMemory(id: number, data: Partial<MemoryIngestInput>): Promise<MemoryEntity> {
    return await prisma.memoryEntity.update({
      where: { id },
      data: {
        text: data.text,
        metadata: data.metadata,
      },
    });
  }

  async deleteMemory(id: number): Promise<void> {
    await prisma.memoryEntity.delete({
      where: { id },
    });
  }

  // Complex query example with relations
  async getMemoriesWithRelations(orgId: string): Promise<MemoryEntity[]> {
    return await prisma.memoryEntity.findMany({
      where: { orgId },
      include: {
        tags: true,
        relations: {
          include: {
            sourceEntity: {
              select: {
                id: true,
                text: true,
              },
            },
          },
        },
      },
    });
  }
}
```

### Task 2.5: Data Migration Script
**Agent**: Data Engineer
**Priority**: Critical
**Estimated Time**: 6 hours

**Deliverables**:
```typescript
// apps/backend/src/database/migrate-sqlite-to-postgres.ts
import Database from 'better-sqlite3';
import prisma from './prisma.js';

interface SQLiteRow {
  [key: string]: any;
}

async function migrateSQLiteToPostgres() {
  console.log('Starting SQLite to PostgreSQL migration...');

  // Connect to SQLite
  const sqlite = new Database('./widget-tdc.db', { readonly: true });

  try {
    // 1. Migrate memory_entities
    console.log('Migrating memory_entities...');
    const memoryEntities = sqlite.prepare('SELECT * FROM memory_entities').all() as SQLiteRow[];

    for (const entity of memoryEntities) {
      await prisma.memoryEntity.create({
        data: {
          id: entity.id,
          orgId: entity.org_id,
          text: entity.text,
          metadata: entity.metadata ? JSON.parse(entity.metadata) : null,
          createdAt: new Date(entity.created_at),
          updatedAt: new Date(entity.updated_at),
        },
      });
    }
    console.log(`Migrated ${memoryEntities.length} memory entities`);

    // 2. Migrate memory_tags
    console.log('Migrating memory_tags...');
    const tags = sqlite.prepare('SELECT * FROM memory_tags').all() as SQLiteRow[];

    for (const tag of tags) {
      await prisma.memoryTag.create({
        data: {
          id: tag.id,
          entityId: tag.entity_id,
          tag: tag.tag,
        },
      });
    }
    console.log(`Migrated ${tags.length} tags`);

    // 3. Migrate memory_relations
    console.log('Migrating memory_relations...');
    const relations = sqlite.prepare('SELECT * FROM memory_relations').all() as SQLiteRow[];

    for (const relation of relations) {
      await prisma.memoryRelation.create({
        data: {
          id: relation.id,
          sourceId: relation.source_id,
          targetId: relation.target_id,
          relationType: relation.relation_type,
          strength: relation.strength,
        },
      });
    }
    console.log(`Migrated ${relations.length} relations`);

    // 4. Migrate raw_documents
    console.log('Migrating raw_documents...');
    const documents = sqlite.prepare('SELECT * FROM raw_documents').all() as SQLiteRow[];

    for (const doc of documents) {
      await prisma.rawDocument.create({
        data: {
          id: doc.id,
          orgId: doc.org_id,
          title: doc.title,
          content: doc.content,
          source: doc.source,
          ingestedAt: new Date(doc.ingested_at),
        },
      });
    }
    console.log(`Migrated ${documents.length} documents`);

    // 5. Migrate structured_facts
    console.log('Migrating structured_facts...');
    const facts = sqlite.prepare('SELECT * FROM structured_facts').all() as SQLiteRow[];

    for (const fact of facts) {
      await prisma.structuredFact.create({
        data: {
          id: fact.id,
          orgId: fact.org_id,
          subject: fact.subject,
          predicate: fact.predicate,
          object: fact.object,
          docId: fact.doc_id,
        },
      });
    }
    console.log(`Migrated ${facts.length} facts`);

    // 6-9. Migrate remaining tables...
    // (evolution_kpis, decisions, pal_focus_windows, pal_stress_levels)

    console.log('Migration completed successfully!');

    // Verify migration
    const counts = {
      memoryEntities: await prisma.memoryEntity.count(),
      tags: await prisma.memoryTag.count(),
      relations: await prisma.memoryRelation.count(),
      documents: await prisma.rawDocument.count(),
      facts: await prisma.structuredFact.count(),
    };

    console.log('PostgreSQL record counts:', counts);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

// Run migration
migrateSQLiteToPostgres()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Test Cases**:
```typescript
describe('PostgreSQL Migration', () => {
  it('should migrate all memory entities', async () => {
    const sqliteCount = await getSQLiteCount('memory_entities');
    const pgCount = await prisma.memoryEntity.count();
    expect(pgCount).toBe(sqliteCount);
  });

  it('should preserve data integrity', async () => {
    // Compare sample records
    const sqliteRecord = getSQLiteRecord('memory_entities', 1);
    const pgRecord = await prisma.memoryEntity.findUnique({ where: { id: 1 } });

    expect(pgRecord?.text).toBe(sqliteRecord.text);
    expect(pgRecord?.orgId).toBe(sqliteRecord.org_id);
  });

  it('should maintain foreign key relationships', async () => {
    const memoryWithRelations = await prisma.memoryEntity.findFirst({
      include: { relations: true },
    });

    expect(memoryWithRelations?.relations).toBeDefined();
    // Verify relation integrity
  });
});
```

## 📊 Success Criteria

- [ ] PostgreSQL running in Docker/production
- [ ] Prisma schema matches all SQLite tables
- [ ] All data migrated without loss
- [ ] Indexes created for performance
- [ ] Repository layer updated and tested
- [ ] Performance benchmarks show improvement
- [ ] Concurrent operations work without deadlocks
- [ ] All integration tests pass

## 🚀 Deployment Checklist

- [ ] Backup SQLite database
- [ ] Set up PostgreSQL server
- [ ] Run Prisma migrations
- [ ] Execute data migration script
- [ ] Verify data integrity
- [ ] Update connection strings
- [ ] Test backend services
- [ ] Monitor performance
- [ ] Document rollback procedure

---

**Next Phase**: Phase 3 - Vector Embeddings & LLM Integration
