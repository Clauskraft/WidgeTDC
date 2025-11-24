import { Database } from 'sql.js';
import { getDatabase } from '../../database/index.js';

export interface Note {
    id?: number;
    userId: string;
    orgId: string;
    source: string;
    title: string;
    body: string;
    tags: string;
    owner: string;
    compliance: 'clean' | 'review' | 'restricted';
    retention: '30d' | '90d' | '1y' | 'archive';
    riskScore: number;
    attachments: number;
    createdAt?: string;
    updatedAt?: string;
}

export class NotesRepository {
    private db = getDatabase();

    constructor() {
        this.initTables();
    }

    private initTables() {
        this.db.prepare(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        org_id TEXT NOT NULL,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        tags TEXT DEFAULT '',
        owner TEXT NOT NULL,
        compliance TEXT DEFAULT 'clean',
        retention TEXT DEFAULT '90d',
        risk_score INTEGER DEFAULT 0,
        attachments INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

        // Create indexes for better query performance
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_notes_user_org ON notes(user_id, org_id)`).run();
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_notes_source ON notes(source)`).run();
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_notes_compliance ON notes(compliance)`).run();
    }

    createNote(note: Note): number {
        const result = this.db.prepare(`
      INSERT INTO notes (user_id, org_id, source, title, body, tags, owner, compliance, retention, risk_score, attachments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            note.userId,
            note.orgId,
            note.source,
            note.title,
            note.body,
            note.tags,
            note.owner,
            note.compliance || 'clean',
            note.retention || '90d',
            note.riskScore || 0,
            note.attachments || 0
        );

        return result.lastInsertRowid as number;
    }

    getNotes(userId: string, orgId: string, filters?: {
        source?: string;
        compliance?: string;
        retention?: string;
        query?: string;
        limit?: number;
    }): Note[] {
        let sql = 'SELECT * FROM notes WHERE user_id = ? AND org_id = ?';
        const params: any[] = [userId, orgId];

        if (filters?.source) {
            sql += ' AND source = ?';
            params.push(filters.source);
        }

        if (filters?.compliance) {
            sql += ' AND compliance = ?';
            params.push(filters.compliance);
        }

        if (filters?.retention) {
            sql += ' AND retention = ?';
            params.push(filters.retention);
        }

        if (filters?.query) {
            sql += ' AND (title LIKE ? OR body LIKE ? OR tags LIKE ?)';
            const searchPattern = `%${filters.query}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY updated_at DESC';

        if (filters?.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        const rows = this.db.prepare(sql).all(...params);

        return rows.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            orgId: row.org_id,
            source: row.source,
            title: row.title,
            body: row.body,
            tags: row.tags,
            owner: row.owner,
            compliance: row.compliance,
            retention: row.retention,
            riskScore: row.risk_score,
            attachments: row.attachments,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }

    getNoteById(id: number, userId: string, orgId: string): Note | null {
        const row = this.db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ? AND org_id = ?')
            .get(id, userId, orgId);

        if (!row) {
            return null;
        }

        return {
            id: (row as any).id,
            userId: (row as any).user_id,
            orgId: (row as any).org_id,
            source: (row as any).source,
            title: (row as any).title,
            body: (row as any).body,
            tags: (row as any).tags,
            owner: (row as any).owner,
            compliance: (row as any).compliance,
            retention: (row as any).retention,
            riskScore: (row as any).risk_score,
            attachments: (row as any).attachments,
            createdAt: (row as any).created_at,
            updatedAt: (row as any).updated_at,
        };
    }

    updateNote(id: number, userId: string, orgId: string, updates: Partial<Note>): boolean {
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.title !== undefined) {
            fields.push('title = ?');
            values.push(updates.title);
        }
        if (updates.body !== undefined) {
            fields.push('body = ?');
            values.push(updates.body);
        }
        if (updates.tags !== undefined) {
            fields.push('tags = ?');
            values.push(updates.tags);
        }
        if (updates.source !== undefined) {
            fields.push('source = ?');
            values.push(updates.source);
        }
        if (updates.compliance !== undefined) {
            fields.push('compliance = ?');
            values.push(updates.compliance);
        }
        if (updates.retention !== undefined) {
            fields.push('retention = ?');
            values.push(updates.retention);
        }
        if (updates.riskScore !== undefined) {
            fields.push('risk_score = ?');
            values.push(updates.riskScore);
        }
        if (updates.attachments !== undefined) {
            fields.push('attachments = ?');
            values.push(updates.attachments);
        }

        if (fields.length === 0) {
            return false;
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id, userId, orgId);

        const sql = `UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ? AND org_id = ?`;
        this.db.prepare(sql).run(...values);

        return true;
    }

    deleteNote(id: number, userId: string, orgId: string): boolean {
        this.db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ? AND org_id = ?')
            .run(id, userId, orgId);
        return true;
    }

    getStatistics(userId: string, orgId: string) {
        const notes = this.getNotes(userId, orgId);

        const sourceDistribution: Record<string, number> = {};
        let flaggedCount = 0;
        let totalRisk = 0;

        notes.forEach(note => {
            sourceDistribution[note.source] = (sourceDistribution[note.source] || 0) + 1;
            if (note.compliance !== 'clean') {
                flaggedCount++;
            }
            totalRisk += note.riskScore;
        });

        return {
            total: notes.length,
            flagged: flaggedCount,
            avgRisk: notes.length > 0 ? Math.round(totalRisk / notes.length) : 0,
            sourceDistribution,
        };
    }

    // Seed sample data for demo purposes
    seedSampleData(userId: string, orgId: string) {
        const sampleNotes = [
            {
                userId,
                orgId,
                source: 'Microsoft OneNote',
                title: 'Q4 Strategy Workshop',
                body: 'Collected workshop notes covering AI procurement roadmap, stakeholder interviews and deliverables for DG CONNECT.',
                tags: 'strategy,ai,eu',
                owner: 'A. Rossi',
                compliance: 'clean' as const,
                retention: '1y' as const,
                riskScore: 12,
                attachments: 3,
            },
            {
                userId,
                orgId,
                source: 'Google Keep',
                title: 'Privacy Task Force recap',
                body: 'Summary of Schrems II mitigation controls, DPA template updates and DPIA workflow automation ideas.',
                tags: 'privacy,gdpr',
                owner: 'K. Jensen',
                compliance: 'review' as const,
                retention: '90d' as const,
                riskScore: 58,
                attachments: 1,
            },
            {
                userId,
                orgId,
                source: 'Local Files',
                title: 'Field research scans',
                body: 'Offline PDFs captured from site inspections in Munich and Ghent. Contains photos, transcripts and checklists.',
                tags: 'inspection,pdf',
                owner: 'M. Novak',
                compliance: 'restricted' as const,
                retention: '30d' as const,
                riskScore: 83,
                attachments: 12,
            },
            {
                userId,
                orgId,
                source: 'Email',
                title: 'Bid coaching thread',
                body: 'Email notes exchanged with supplier consortium clarifying KPIs, SOW split and legal guardrails.',
                tags: 'bid,procurement',
                owner: 'L. Ruíz',
                compliance: 'review' as const,
                retention: '1y' as const,
                riskScore: 46,
                attachments: 2,
            },
            {
                userId,
                orgId,
                source: 'Evernote',
                title: 'Incident Post-Mortem',
                body: 'Voice memo transcription summarizing containment timeline, threat intel links and RCA decisions.',
                tags: 'security,incident',
                owner: 'J. Olofsson',
                compliance: 'clean' as const,
                retention: '1y' as const,
                riskScore: 28,
                attachments: 0,
            },
        ];

        sampleNotes.forEach(note => this.createNote(note));
    }
}
