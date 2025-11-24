import { useState, useCallback, useEffect } from 'react';

export interface AuditEvent {
  id: string;
  timestamp: number;
  eventType: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  hashVerified?: boolean;
}

export const useAuditLog = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog();
    const interval = setInterval(fetchAuditLog, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAuditLog = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/audit-log');
      const data = await response.json();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit log');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEvent = useCallback((event: AuditEvent) => {
    setEvents(prev => [event, ...prev]);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const exportEvents = useCallback((format: 'json' | 'csv' = 'json'): string => {
    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }

    const headers = ['ID', 'Timestamp', 'Event Type', 'User', 'Action'];
    const rows = events.map(e => [
      e.id,
      new Date(e.timestamp).toISOString(),
      e.eventType,
      e.userId,
      e.action,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }, [events]);

  return {
    events,
    isLoading,
    error,
    addEvent,
    clearEvents,
    exportEvents,
    refreshLog: fetchAuditLog,
  };
};
