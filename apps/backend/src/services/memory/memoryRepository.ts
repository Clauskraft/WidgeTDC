import { getDatabase } from '../../database/index.js';
import { MemoryEntityInput, MemorySearchQuery } from '@widget-tdc/mcp-types';

export class MemoryRepository {
  private db = getDatabase();

  ingestEntity(input: MemoryEntityInput): number {
    const importance = input.importance || 3;
    
    const result = this.db.prepare(`
      INSERT INTO memory_entities (org_id, user_id, entity_type, content, importance)
      VALUES (?, ?, ?, ?, ?)
    `).run(input.orgId, input.userId || null, input.entityType, input.content, importance);

    const entityId = result.lastInsertRowid as number;

    // Insert tags if provided
    if (input.tags && input.tags.length > 0) {
      const insertTag = this.db.prepare(`
        INSERT INTO memory_tags (entity_id, tag) VALUES (?, ?)
      `);
      
      for (const tag of input.tags) {
        insertTag.run(entityId, tag);
      }
    }

    return entityId;
  }

  searchEntities(query: MemorySearchQuery): any[] {
    const limit = query.limit || 10;
    let sql = `
      SELECT DISTINCT e.id, e.org_id, e.user_id, e.entity_type, e.content, e.importance, e.created_at
      FROM memory_entities e
      WHERE e.org_id = ?
    `;
    const params: any[] = [query.orgId];

    if (query.userId) {
      sql += ` AND (e.user_id = ? OR e.user_id IS NULL)`;
      params.push(query.userId);
    }

    if (query.entityTypes && query.entityTypes.length > 0) {
      const placeholders = query.entityTypes.map(() => '?').join(',');
      sql += ` AND e.entity_type IN (${placeholders})`;
      params.push(...query.entityTypes);
    }

    if (query.keywords && query.keywords.length > 0) {
      // Simple keyword search in content or tags
      const keywordConditions = query.keywords.map(() => {
        return `(e.content LIKE ? OR e.id IN (SELECT entity_id FROM memory_tags WHERE tag LIKE ?))`;
      }).join(' OR ');
      
      sql += ` AND (${keywordConditions})`;
      
      for (const keyword of query.keywords) {
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
    }

    sql += ` ORDER BY e.importance DESC, e.created_at DESC LIMIT ?`;
    params.push(limit);

    return this.db.prepare(sql).all(...params);
  }

  getEntityById(id: number): any {
    return this.db.prepare(`
      SELECT * FROM memory_entities WHERE id = ?
    `).get(id);
  }

  getEntityTags(entityId: number): string[] {
    const rows = this.db.prepare(`
      SELECT tag FROM memory_tags WHERE entity_id = ?
    `).all(entityId);
    
    return rows.map((row: any) => row.tag);
  }

  createRelation(orgId: string, sourceId: number, targetId: number, relationType: string): number {
    const result = this.db.prepare(`
      INSERT INTO memory_relations (org_id, source_id, target_id, relation_type)
      VALUES (?, ?, ?, ?)
    `).run(orgId, sourceId, targetId, relationType);

    return result.lastInsertRowid as number;
  }
}
