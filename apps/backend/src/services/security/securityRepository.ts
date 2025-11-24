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

export function getSecurityTemplates(): SecuritySearchTemplate[] {
  const db = getDatabase();
  const rows = db
    .prepare<[], RawTemplateRow>('SELECT * FROM security_search_templates ORDER BY created_at DESC')
    .all();
  return rows.map(row => {
    try {
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        query: row.query,
        severity: row.severity as SecuritySearchTemplate['severity'],
        timeframe: row.timeframe,
        sources: JSON.parse(row.sources) as string[],
        createdAt: row.created_at,
      };
    } catch (error) {
      // Fallback to empty array if JSON parse fails
      console.error('Error parsing sources JSON:', error);
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        query: row.query,
        severity: row.severity as SecuritySearchTemplate['severity'],
        timeframe: row.timeframe,
        sources: [],
        createdAt: row.created_at,
      };
    }
  });
}

export function recordSearchHistory(entry: Omit<SearchHistoryEntry, 'ranAt'> & { ranAt?: string }): SearchHistoryEntry {
  const db = getDatabase();
  const row = {
    id: entry.id,
    query: entry.query,
    severity: entry.severity,
    timeframe: entry.timeframe,
    sources: JSON.stringify(entry.sources),
    results_count: entry.results,
    latency_ms: entry.latencyMs,
    created_at: entry.ranAt ?? new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO security_search_history (id, query, severity, timeframe, sources, results_count, latency_ms, created_at)
    VALUES (@id, @query, @severity, @timeframe, @sources, @results_count, @latency_ms, @created_at)
  `).run(row);

  return {
    ...entry,
    ranAt: row.created_at,
  };
}

export function getSearchHistory(limit = 6): SearchHistoryEntry[] {
  const db = getDatabase();
  const rows = db
    .prepare<[number], RawHistoryRow>(`
      SELECT * FROM security_search_history
      ORDER BY created_at DESC
      LIMIT ?
    `)
    .all(limit);

  return rows.map(row => {
    try {
      return {
        id: row.id,
        query: row.query,
        severity: row.severity,
        timeframe: row.timeframe,
        sources: JSON.parse(row.sources) as string[],
        results: row.results_count,
        latencyMs: row.latency_ms,
        ranAt: row.created_at,
      };
    } catch (error) {
      // Fallback to empty array if JSON parse fails
      console.error('Error parsing sources JSON:', error);
      return {
        id: row.id,
        query: row.query,
        severity: row.severity,
        timeframe: row.timeframe,
        sources: [],
        results: row.results_count,
        latencyMs: row.latency_ms,
        ranAt: row.created_at,
      };
    }
  });
}

export function persistActivityEvent(event: SecurityActivityEvent): void {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO security_activity_events (
      id, title, description, category, severity, source, rule, channel, payload, created_at, acknowledged
    )
    VALUES (
      @id, @title, @description, @category, @severity, @source, @rule, @channel, @payload, @created_at, @acknowledged
    )
  `).run({
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

interface ActivityFilter {
  severity?: string;
  category?: string;
  limit?: number;
}

export function listActivityEvents(filter: ActivityFilter = {}): SecurityActivityEvent[] {
  const db = getDatabase();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filter.severity && filter.severity !== 'all') {
    clauses.push('severity = ?');
    params.push(filter.severity);
  }
  if (filter.category && filter.category !== 'all') {
    clauses.push('category = ?');
    params.push(filter.category);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = filter.limit ?? 25;

  const rows = db
    .prepare<unknown[], RawActivityRow>(`
      SELECT * FROM security_activity_events
      ${where}
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `)
    .all(...params, limit);

  return rows.map(row => {
    let payload: Record<string, unknown> | undefined = undefined;
    if (row.payload) {
      try {
        payload = JSON.parse(row.payload) as Record<string, unknown>;
      } catch (error) {
        console.error('Error parsing payload JSON:', error);
        payload = undefined;
      }
    }
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category as SecurityActivityEvent['category'],
      severity: row.severity as SecurityActivityEvent['severity'],
      source: row.source,
      rule: row.rule ?? undefined,
      channel: row.channel as SecurityActivityEvent['channel'],
      payload,
      createdAt: row.created_at,
      acknowledged: Boolean(row.acknowledged),
    };
  });
}

export function setActivityAcknowledged(id: string, acknowledged: boolean): SecurityActivityEvent | null {
  const db = getDatabase();
  const result = db
    .prepare('UPDATE security_activity_events SET acknowledged = ? WHERE id = ?')
    .run(acknowledged ? 1 : 0, id);

  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare<unknown[], RawActivityRow>('SELECT * FROM security_activity_events WHERE id = ?')
    .get(id);
  if (!row) {
    return null;
  }

  let payload: Record<string, unknown> | undefined = undefined;
  if (row.payload) {
    try {
      payload = JSON.parse(row.payload) as Record<string, unknown>;
    } catch (error) {
      console.error('Error parsing payload JSON:', error);
      payload = undefined;
    }
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as SecurityActivityEvent['category'],
    severity: row.severity as SecurityActivityEvent['severity'],
    source: row.source,
    rule: row.rule ?? undefined,
    channel: row.channel as SecurityActivityEvent['channel'],
    payload,
    createdAt: row.created_at,
    acknowledged: Boolean(row.acknowledged),
  };
}

export function getWidgetPermissions(widgetId: string): any[] {
  const db = getDatabase();
  const permissions = db.prepare(
    'SELECT * FROM widget_permissions WHERE widget_id = ?'
  ).all(widgetId);
  return permissions;
}

export function checkWidgetAccess(widgetId: string, resourceType: string, requiredLevel: 'read' | 'write'): boolean {
  const db = getDatabase();
  const row = db.prepare(
    'SELECT access_level, override FROM widget_permissions WHERE widget_id = ? AND resource_type = ?'
  ).get(widgetId, resourceType);

  if (row && row.override) {
    const levels = { none: 0, read: 1, write: 2 };
    return levels[row.access_level as keyof typeof levels] >= levels[requiredLevel];
  }

  const defaultRow = db.prepare(
    'SELECT access_level FROM widget_permissions WHERE widget_id IS NULL AND resource_type = ?'
  ).get(resourceType);
  const defaultLevel = defaultRow ? defaultRow.access_level : 'read';
  const levels = { none: 0, read: 1, write: 2 };
  return levels[defaultLevel as keyof typeof levels] >= levels[requiredLevel];
}

export function setWidgetPermission(widgetId: string, resourceType: string, accessLevel: 'none' | 'read' | 'write', override: boolean = false): void {
  const db = getDatabase();
  db.prepare(
    `INSERT OR REPLACE INTO widget_permissions (widget_id, resource_type, access_level, override)
     VALUES (?, ?, ?, ?)`
  ).run(widgetId, resourceType, accessLevel, override ? 1 : 0);
}

export function setPlatformDefault(resourceType: string, accessLevel: 'none' | 'read' | 'write'): void {
  const db = getDatabase();
  db.prepare(
    `INSERT OR REPLACE INTO widget_permissions (widget_id, resource_type, access_level, override)
     VALUES (NULL, ?, ?, 0)`
  ).run(resourceType, accessLevel);
}

