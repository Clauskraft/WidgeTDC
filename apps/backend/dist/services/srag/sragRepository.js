import { prisma } from '../../database/prisma.js';
export class SragRepository {
    async ingestDocument(input) {
        const doc = await prisma.rawDocument.create({
            data: {
                orgId: input.orgId,
                sourceType: input.sourceType,
                sourcePath: input.sourcePath,
                content: input.content,
            },
        });
        return doc.id;
    }
    async ingestFact(input) {
        const fact = await prisma.structuredFact.create({
            data: {
                orgId: input.orgId,
                docId: input.docId || null,
                factType: input.factType,
                jsonPayload: input.jsonPayload,
                occurredAt: input.occurredAt ? new Date(input.occurredAt) : null,
            },
        });
        return fact.id;
    }
    async queryFacts(orgId, factType, limit = 50) {
        const where = { orgId };
        if (factType) {
            where.factType = factType;
        }
        const facts = await prisma.structuredFact.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return facts.map(f => ({
            id: f.id,
            org_id: f.orgId,
            doc_id: f.docId,
            fact_type: f.factType,
            json_payload: f.jsonPayload,
            occurred_at: f.occurredAt,
            created_at: f.createdAt,
        }));
    }
    async searchDocuments(orgId, keyword, limit = 10) {
        const docs = await prisma.rawDocument.findMany({
            where: {
                orgId,
                content: { contains: keyword, mode: 'insensitive' },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return docs.map(d => ({
            id: d.id,
            org_id: d.orgId,
            source_type: d.sourceType,
            source_path: d.sourcePath,
            content: d.content,
            created_at: d.createdAt,
        }));
    }
    async getDocumentById(id) {
        const doc = await prisma.rawDocument.findUnique({
            where: { id },
        });
        if (!doc)
            return null;
        return {
            id: doc.id,
            org_id: doc.orgId,
            source_type: doc.sourceType,
            source_path: doc.sourcePath,
            content: doc.content,
            created_at: doc.createdAt,
        };
    }
}
