import { getDatabase } from '../../database/index.js';
import { RawDocumentInput, StructuredFactInput } from '@widget-tdc/mcp-types';

export class SragRepository {
  private db = getDatabase();

  ingestDocument(input: RawDocumentInput): number {
    const result = this.db.prepare(`
      INSERT INTO raw_documents (org_id, source_type, source_path, content)
      VALUES (?, ?, ?, ?)
    `).run(input.orgId, input.sourceType, input.sourcePath, input.content);

    return result.lastInsertRowid as number;
  }

  ingestFact(input: StructuredFactInput): number {
    const result = this.db.prepare(`
      INSERT INTO structured_facts (org_id, doc_id, fact_type, json_payload, occurred_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      input.orgId,
      input.docId || null,
      input.factType,
      JSON.stringify(input.jsonPayload),
      input.occurredAt || null
    );

    return result.lastInsertRowid as number;
  }

  queryFacts(orgId: string, factType?: string, limit: number = 50): any[] {
    let sql = `
      SELECT id, org_id, doc_id, fact_type, json_payload, occurred_at, created_at
      FROM structured_facts
      WHERE org_id = ?
    `;
    const params: any[] = [orgId];

    if (factType) {
      sql += ` AND fact_type = ?`;
      params.push(factType);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params);
    
    // Parse JSON payloads
    return rows.map((row: any) => {
      let jsonPayload = {};
      try {
        jsonPayload = JSON.parse(row.json_payload);
      } catch (error) {
        console.error('Error parsing json_payload JSON:', error);
        jsonPayload = {};
      }
      return {
        ...row,
        json_payload: jsonPayload,
      };
    });
  }

  searchDocuments(orgId: string, keyword: string, limit: number = 10): any[] {
    const rows = this.db.prepare(`
      SELECT id, org_id, source_type, source_path, content, created_at
      FROM raw_documents
      WHERE org_id = ? AND content LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(orgId, `%${keyword}%`, limit);

    return rows;
  }

  getDocumentById(id: number): any {
    return this.db.prepare(`
      SELECT * FROM raw_documents WHERE id = ?
    `).get(id);
  }
}
