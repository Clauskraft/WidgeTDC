// @ts-nocheck - better-sqlite3 not yet installed
// import Database from 'better-sqlite3';
import { getDatabaseAdapter } from '../platform/db/PrismaDatabaseAdapter.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
async function migrateSQLiteToPostgres() {
    logger.info('🚀 Starting SQLite -> PostgreSQL migration...');
    const stats = [];
    // Check if SQLite database exists
    const sqlitePath = path.join(process.cwd(), 'widget-tdc.db');
    if (!fs.existsSync(sqlitePath)) {
        logger.warn('⚠️  No SQLite database found. Skipping migration.');
        return;
    }
    const sqlite = new Database(sqlitePath, { readonly: true });
    const prisma = getDatabaseAdapter().getClient();
    try {
        // Migrate Widgets
        logger.info('📦 Migrating widgets...');
        const widgets = sqlite.prepare('SELECT * FROM widgets').all();
        let widgetCount = 0;
        for (const widget of widgets) {
            try {
                await prisma.widget.upsert({
                    where: { id: widget.id },
                    create: {
                        id: widget.id,
                        name: widget.name,
                        type: widget.type,
                        config: widget.config ? JSON.parse(widget.config) : null,
                        active: Boolean(widget.active),
                        createdAt: new Date(widget.created_at),
                        updatedAt: new Date(widget.updated_at || widget.created_at),
                    },
                    update: {},
                });
                widgetCount++;
            }
            catch (err) {
                logger.error(`Failed to migrate widget ${widget.id}:`, err.message);
            }
        }
        stats.push({ table: 'widgets', migrated: widgetCount, failed: widgets.length - widgetCount });
        // Migrate Layouts
        logger.info('📐 Migrating layouts...');
        const layouts = sqlite.prepare('SELECT * FROM layouts').all();
        let layoutCount = 0;
        for (const layout of layouts) {
            try {
                await prisma.layout.upsert({
                    where: { userId_orgId: { userId: layout.user_id, orgId: layout.org_id } },
                    create: {
                        userId: layout.user_id,
                        orgId: layout.org_id,
                        layoutData: JSON.parse(layout.layout_data),
                        createdAt: new Date(layout.created_at),
                        updatedAt: new Date(layout.updated_at || layout.created_at),
                    },
                    update: {},
                });
                layoutCount++;
            }
            catch (err) {
                logger.error(`Failed to migrate layout for user ${layout.user_id}:`, err.message);
            }
        }
        stats.push({ table: 'layouts', migrated: layoutCount, failed: layouts.length - layoutCount });
        // Migrate Memory Entities
        logger.info('🧠 Migrating memory entities...');
        try {
            const entities = sqlite.prepare('SELECT * FROM memory_entities').all();
            let entityCount = 0;
            for (const entity of entities) {
                try {
                    await prisma.memoryEntity.upsert({
                        where: { id: entity.id },
                        create: {
                            id: entity.id,
                            type: entity.type,
                            label: entity.label,
                            properties: entity.properties ? JSON.parse(entity.properties) : null,
                            userId: entity.user_id || 'system',
                            orgId: entity.org_id || 'default',
                            createdAt: new Date(entity.created_at),
                            updatedAt: new Date(entity.updated_at || entity.created_at),
                        },
                        update: {},
                    });
                    entityCount++;
                }
                catch (err) {
                    logger.error(`Failed to migrate entity ${entity.id}:`, err.message);
                }
            }
            stats.push({ table: 'memory_entities', migrated: entityCount, failed: entities.length - entityCount });
        }
        catch (err) {
            logger.warn('memory_entities table not found in SQLite, skipping');
            stats.push({ table: 'memory_entities', migrated: 0, failed: 0 });
        }
        // Migrate Data Sources
        logger.info('📡 Migrating data sources...');
        try {
            const sources = sqlite.prepare('SELECT * FROM data_sources').all();
            let sourceCount = 0;
            for (const source of sources) {
                try {
                    await prisma.dataSource.upsert({
                        where: { name: source.name },
                        create: {
                            name: source.name,
                            type: source.type,
                            description: source.description,
                            enabled: Boolean(source.enabled),
                            requiresApproval: Boolean(source.requires_approval ?? true),
                            config: source.config ? JSON.parse(source.config) : null,
                            lastUsedAt: source.last_used_at ? new Date(source.last_used_at) : null,
                            createdAt: new Date(source.created_at),
                            updatedAt: new Date(source.updated_at || source.created_at),
                        },
                        update: {},
                    });
                    sourceCount++;
                }
                catch (err) {
                    logger.error(`Failed to migrate data source ${source.name}:`, err.message);
                }
            }
            stats.push({ table: 'data_sources', migrated: sourceCount, failed: sources.length - sourceCount });
        }
        catch (err) {
            logger.warn('data_sources table not found in SQLite, skipping');
            stats.push({ table: 'data_sources', migrated: 0, failed: 0 });
        }
        // Print migration summary
        logger.info('\n✅ Migration Complete!\n');
        console.table(stats);
    }
    catch (error) {
        logger.error('❌ Migration failed:', { error: error.message });
        throw error;
    }
    finally {
        sqlite.close();
    }
}
// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateSQLiteToPostgres()
        .then(() => {
        logger.info('🎉 Migration successful!');
        process.exit(0);
    })
        .catch((err) => {
        logger.error('Migration error:', err);
        process.exit(1);
    });
}
export { migrateSQLiteToPostgres };
