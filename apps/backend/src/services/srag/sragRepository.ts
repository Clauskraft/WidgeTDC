import { getDatabase } from '../../database/index.js';
import { RawDocumentInput, StructuredFactInput } from '@widget-tdc/mcp-types';

export class SragRepository {
  private get db() {
    return getDatabase();
  }

  ingestDocument(input: RawDocumentInput): number {
    const stmt = this.db.prepare(`
      INSERT INTO raw_documents (org_id, source_type, source_path, content)
      VALUES (?, ?, ?, ?)
    `);
    
    let result: any;
    if (stmt.run.length === 1) {
        stmt.run([input.orgId, input.sourceType, input.sourcePath, input.content]);
    } else {
        result = stmt.run(input.orgId, input.sourceType, input.sourcePath, input.content);
    }

    if (result && result.lastInsertRowid) {
        return result.lastInsertRowid as number;
    } else {
        const res = this.db.exec("SELECT last_insert_rowid()");
        return res[0].values[0][0] as number;
    }
  }

  ingestFact(input: StructuredFactInput): number {
    const stmt = this.db.prepare(`
      INSERT INTO structured_facts (org_id, doc_id, fact_type, json_payload, occurred_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const params = [
      input.orgId,
      input.docId || null,
      input.factType,
      JSON.stringify(input.jsonPayload),
      input.occurredAt || null
    ];

    let result: any;
    if (stmt.run.length === 1) {
        stmt.run(params);
    } else {
        result = stmt.run(...params);
    }

    if (result && result.lastInsertRowid) {
        return result.lastInsertRowid as number;
    } else {
        const res = this.db.exec("SELECT last_insert_rowid()");
        return res[0].values[0][0] as number;
    }
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

    const stmt = this.db.prepare(sql);
    let rows: any[];

    if (stmt.all) {
        rows = stmt.all(...params);
    } else {
        stmt.bind(params);
        rows = [];
        while(stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
    }
    
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
    const stmt = this.db.prepare(`
      SELECT id, org_id, source_type, source_path, content, created_at
      FROM raw_documents
      WHERE org_id = ? AND content LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    const params = [orgId, `%${keyword}%`, limit];
    
    if (stmt.all) {
        return stmt.all(...params);
    } else {
        stmt.bind(params);
        const rows: any[] = [];
        while(stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    }
  }

  getDocumentById(id: number): any {
    const stmt = this.db.prepare(`
      SELECT * FROM raw_documents WHERE id = ?
    `);
    
    if (stmt.get && !stmt.getAsObject) {
        return stmt.get(id);
    } else {
        stmt.bind([id]);
        if (stmt.step()) {
            const res = stmt.getAsObject();
            stmt.free();
            return res;
        }
        stmt.free();
        return undefined;
    }
  }
}
