typescript
import { getDatabase } from '../../database/index.js';
import type {
  SecuritySearchTemplate,
  SearchHistoryEntry,
  SecurityActivityEvent,
} from './securityTypes.js';

interface RawTemplateRow {
  id: string;
  name: string;
  description: string;
  query: string;
  severity: string;
  timeframe: string;
  sources: string;
  created_at: string;
}

interface RawHistoryRow {
  id: string;
  query: string;
  severity: string;
  timeframe: string;
  sources: string;
  results_count: number;
  latency_ms: number;
  created_at: string;
}

interface RawActivityRow {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  source: string;
  rule: string | null;
  channel: string;
  payload: string | null;
  created_at: string;
  acknowledged: number;
}

// Reusable JSON parsing with error handling
function parseJSONSafe<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

// Reusable database query preparation
function prepareQuery<T>(sql: string) {
  const db = getDatabase();
  return db.prepare<[], T>(sql);
}

export function getSecurityTemplates(): SecuritySearchTemplate[] {
  const rows = prepareQuery<RawTemplateRow>('SELECT * FROM security_search_templates ORDER BY created_at DESC').all();
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    query: row.query,
    severity: row.severity as SecuritySearchTemplate['severity'],
    timeframe: row.timeframe,
    sources: parseJSONSafe(row.sources, [] as string[]),
    createdAt: row.created_at,
  }));
}

export function recordSearchHistory(entry: Omit<SearchHistoryEntry, 'ranAt'> & { ranAt?: string }): SearchHistoryEntry {
  const db = getDatabase();
  const ranAt = entry.ranAt ?? new Date().toISOString();
  
  const insertStmt = db.prepare(`
    INSERT INTO security_search_history (id, query, severity, timeframe, sources, results_count, latency_ms, created_at)
    VALUES (@id, @query, @severity, @timeframe, @sources, @results_count, @latency_ms, @created_at)
  `);
  
  insertStmt.run({
    id: entry.id,
    query: entry.query,
    severity: entry.severity,
    timeframe: entry.timeframe,
    sources: JSON.stringify(entry.sources),
    results_count: entry.results,
    latency_ms: entry.latencyMs,
    created_at: ranAt,
  });

  return {
    ...entry,
    ranAt,
  };
}

export function getSearchHistory(limit = 6): SearchHistoryEntry[] {
  const rows = prepareQuery<RawHistoryRow>(`
    SELECT * FROM security_search_history
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);

  return rows.map(row => ({
    id: row.id,
    query: row.query,
    severity: row.severity,
    timeframe: row.timeframe,
    sources: parseJSONSafe(row.sources, [] as string[]),
    results: row.results_count,
    latencyMs: row.latency_ms,
    ranAt: row.created_at,
  }));
}

export function persistActivityEvent(event: SecurityActivityEvent): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO security_activity_events (
      id, title, description, category, severity, source, rule, channel, payload, created_at, acknowledged
    )
    VALUES (
      @id, @title, @description, @category, @severity, @source, @rule, @channel, @payload, @created_at, @acknowledged
    )
  `);
  
  stmt.run({
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    severity: event.severity,
    source: event.source,
    rule: event.rule ?? null,
    channel: event.channel,
    payload: event.payload ? JSON.stringify(event.payload) : null,
    created_at: event.createdAt,
    acknowledged: event.acknowledged ? 1 : 0,
  });
}