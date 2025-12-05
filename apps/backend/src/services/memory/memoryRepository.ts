import { prisma } from '../../database/prisma.js';
import { MemoryEntityInput, MemorySearchQuery } from '@widget-tdc/mcp-types';

export class MemoryRepository {
  private vectorCache = new Map<string, number[]>();
  private readonly VECTOR_SIZE = 768;
  private readonly MAX_CACHE_SIZE = 1000;

  private simpleTokenize(text: string): string[] {
    return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private vectorizeText(text: string): number[] {
    const tokens = this.simpleTokenize(text);
    const vector = new Array(this.VECTOR_SIZE).fill(0);

    for (const token of tokens) {
      const hash = this.simpleHash(token);
      vector[hash % this.VECTOR_SIZE] += 1;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude <= 0) return vector;
    
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
    return vector;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i];
      const b = vecB[i];
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  private getCachedVector(text: string): number[] {
    const cached = this.vectorCache.get(text);
    if (cached) return cached;

    const vector = this.vectorizeText(text);
    this.vectorCache.set(text, vector);

    if (this.vectorCache.size > this.MAX_CACHE_SIZE) {
      this.vectorCache.clear();
    }

    return vector;
  }

  async ingestEntity(input: MemoryEntityInput): Promise<number> {
    const importance = input.importance ?? 3;

    const entity = await prisma.memoryEntity.create({
      data: {
        orgId: input.orgId,
        userId: input.userId ?? null,
        entityType: input.entityType,
        content: input.content,
        importance,
      },
    });

    if (input.tags?.length) {
      await prisma.memoryTag.createMany({
        data: input.tags.map(tag => ({
          entityId: entity.id,
          tag,
        })),
        skipDuplicates: true,
      });
    }

    return entity.id;
  }

  async searchEntities(query: MemorySearchQuery): Promise<any[]> {
    const limit = query.limit || 10;
    const where: any = { orgId: query.orgId };

    if (query.userId) {
      where.OR = [
        { userId: query.userId },
        { userId: null },
      ];
    }

    if (query.entityTypes?.length) {
      where.entityType = { in: query.entityTypes };
    }

    if (query.keywords?.length) {
      const keywordConditions = query.keywords.map(keyword => ({
        OR: [
          { content: { contains: keyword, mode: 'insensitive' } },
          { tags: { some: { tag: { contains: keyword, mode: 'insensitive' } } } },
        ],
      }));
      where.AND = keywordConditions;
    }

    const takeCount = query.keywords?.length ? limit * 2 : limit;
    
    let candidates = await prisma.memoryEntity.findMany({
      where,
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' },
      ],
      take: takeCount,
      include: { tags: true },
    });

    if (query.keywords?.length && candidates.length > 0) {
      const queryText = query.keywords.join(' ');
      const queryVector = this.vectorizeText(queryText);

      const scoredCandidates = candidates.map(candidate => {
        const candidateVector = this.getCachedVector(candidate.content);
        const similarity = this.cosineSimilarity(queryVector, candidateVector);
        return { ...candidate, similarity };
      });

      scoredCandidates.sort((a, b) => b.similarity - a.similarity);
      candidates = scoredCandidates.slice(0, limit);
    }

    return candidates;
  }
}