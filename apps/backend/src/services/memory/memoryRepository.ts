import { prisma } from '../../database/prisma.js';
import { MemoryEntityInput, MemorySearchQuery } from '@widget-tdc/mcp-types';

export class MemoryRepository {
  private vectorCache = new Map<string, number[]>();

  // Simple tokenization (placeholder - for semantic search)
  private simpleTokenize(text: string): string[] {
    return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  }

  // Simple vectorization using token frequencies (placeholder for real embeddings)
  private vectorizeText(text: string): number[] {
    const tokens = this.simpleTokenize(text);
    const vector = new Array(768).fill(0);

    tokens.forEach((token) => {
      const hash = this.simpleHash(token);
      vector[hash % 768] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
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

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
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

  async ingestEntity(input: MemoryEntityInput): Promise<number> {
    const importance = input.importance || 3;

    const entity = await prisma.memoryEntity.create({
      data: {
        orgId: input.orgId,
        userId: input.userId || null,
        entityType: input.entityType,
        content: input.content,
        importance,
      },
    });

    // Insert tags if provided
    if (input.tags && input.tags.length > 0) {
      await prisma.memoryTag.createMany({
        data: input.tags.map(tag => ({
          entityId: entity.id,
          tag,
        })),
      });
    }

    return entity.id;
  }

  async searchEntities(query: MemorySearchQuery): Promise<any[]> {
    const limit = query.limit || 10;

    // Build where clause
    const where: any = {
      orgId: query.orgId,
    };

    if (query.userId) {
      where.OR = [
        { userId: query.userId },
        { userId: null },
      ];
    }

    if (query.entityTypes && query.entityTypes.length > 0) {
      where.entityType = { in: query.entityTypes };
    }

    // Keyword search with tags
    if (query.keywords && query.keywords.length > 0) {
      const keywordConditions = query.keywords.map(keyword => ({
        OR: [
          { content: { contains: keyword, mode: 'insensitive' as const } },
          { tags: { some: { tag: { contains: keyword, mode: 'insensitive' as const } } } },
        ],
      }));
      where.OR = keywordConditions;
    }

    let candidates = await prisma.memoryEntity.findMany({
      where,
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' },
      ],
      take: query.keywords && query.keywords.length > 0 ? limit * 2 : limit,
      include: {
        tags: true,
      },
    });

    // If we have keywords, apply semantic scoring
    if (query.keywords && query.keywords.length > 0 && candidates.length > 0) {
      const queryText = query.keywords.join(' ');
      const queryVector = this.vectorizeText(queryText);

      const scoredCandidates = candidates.map(candidate => {
        const contentVector = this.getCachedVector(candidate.content);
        const semanticScore = this.cosineSimilarity(queryVector, contentVector);
        const keywordScore = candidate.content.toLowerCase().includes(queryText.toLowerCase()) ? 1 : 0;
        const combinedScore = 0.7 * semanticScore + 0.3 * keywordScore;

        return {
          id: candidate.id,
          org_id: candidate.orgId,
          user_id: candidate.userId,
          entity_type: candidate.entityType,
          content: candidate.content,
          importance: candidate.importance,
          created_at: candidate.createdAt,
          semanticScore,
          combinedScore,
        };
      });

      scoredCandidates.sort((a, b) => b.combinedScore - a.combinedScore);
      return scoredCandidates.slice(0, limit);
    }

    // Transform to snake_case for compatibility
    return candidates.map(c => ({
      id: c.id,
      org_id: c.orgId,
      user_id: c.userId,
      entity_type: c.entityType,
      content: c.content,
      importance: c.importance,
      created_at: c.createdAt,
    }));
  }

  async getEntityById(id: number): Promise<any | null> {
    const entity = await prisma.memoryEntity.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!entity) return null;

    return {
      id: entity.id,
      org_id: entity.orgId,
      user_id: entity.userId,
      entity_type: entity.entityType,
      content: entity.content,
      importance: entity.importance,
      created_at: entity.createdAt,
    };
  }

  async getEntityTags(entityId: number): Promise<string[]> {
    const tags = await prisma.memoryTag.findMany({
      where: { entityId },
      select: { tag: true },
    });

    return tags.map(t => t.tag);
  }

  async createRelation(orgId: string, sourceId: number, targetId: number, relationType: string): Promise<number> {
    const relation = await prisma.memoryRelation.create({
      data: {
        orgId,
        sourceId,
        targetId,
        relationType,
      },
    });

    return relation.id;
  }
}
