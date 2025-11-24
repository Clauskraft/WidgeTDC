import { getDatabase } from '../../database/index.js';
import { MemoryEntityInput, MemorySearchQuery } from '@widget-tdc/mcp-types';
// Note: In production, integrate with vector database like Pinecone or Weaviate

export class MemoryRepository {
  private get db() {
    return getDatabase();
  }
  private vectorCache = new Map<string, number[]>(); // Simple cache for vectors

  // Simple tokenization (placeholder - gpt-3-encoder alternative)
  private simpleTokenize(text: string): string[] {
    return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  }

  // Simple vectorization using token frequencies (placeholder for real embeddings)
  private vectorizeText(text: string): number[] {
    const tokens = this.simpleTokenize(text);
    const vector = new Array(768).fill(0); // 768 dimensions like text-embedding-ada-002

    tokens.forEach((token, index) => {
      const hash = this.simpleHash(token);
      vector[hash % 768] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

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

    let candidates: any[] = [];

    if (query.keywords && query.keywords.length > 0) {
      // Enhanced hybrid search: keyword + semantic
      const keywordConditions = query.keywords.map(() => {
        return `(e.content LIKE ? OR e.id IN (SELECT entity_id FROM memory_tags WHERE tag LIKE ?))`;
      }).join(' OR ');

      sql += ` AND (${keywordConditions})`;

      for (const keyword of query.keywords) {
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      // Get keyword-based candidates first
      const keywordSql = sql + ` ORDER BY e.importance DESC, e.created_at DESC LIMIT ?`;
      candidates = this.db.prepare(keywordSql).all(...params, limit * 2); // Get more candidates for reranking

      // If we have keywords, also do semantic search and combine results
      if (candidates.length > 0) {
        const queryText = query.keywords.join(' ');
        const queryVector = this.vectorizeText(queryText);

        // Score candidates by semantic similarity
        const scoredCandidates = candidates.map(candidate => {
          const contentVector = this.getCachedVector(candidate.content);
          const semanticScore = this.cosineSimilarity(queryVector, contentVector);
          const keywordScore = candidate.content.toLowerCase().includes(queryText.toLowerCase()) ? 1 : 0;
          const combinedScore = 0.7 * semanticScore + 0.3 * keywordScore;

          return { ...candidate, semanticScore, combinedScore };
        });

        // Sort by combined score and take top results
        scoredCandidates.sort((a, b) => b.combinedScore - a.combinedScore);
        candidates = scoredCandidates.slice(0, limit);
      }
    } else {
      sql += ` ORDER BY e.importance DESC, e.created_at DESC LIMIT ?`;
      params.push(limit);
      candidates = this.db.prepare(sql).all(...params);
    }

    return candidates;
  }

  private getCachedVector(text: string): number[] {
    if (this.vectorCache.has(text)) {
      return this.vectorCache.get(text)!;
    }

    const vector = this.vectorizeText(text);
    this.vectorCache.set(text, vector);

    // Simple LRU: clear cache if it gets too large
    if (this.vectorCache.size > 1000) {
      this.vectorCache.clear();
    }

    return vector;
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
