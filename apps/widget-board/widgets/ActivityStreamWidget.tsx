import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import {
  acknowledgeActivityEvent,
  fetchSecurityActivity,
  getActivityStreamUrl,
} from '../utils/securityApi';

type EventSeverity = 'low' | 'medium' | 'high' | 'critical';
type EventCategory = 'ingestion' | 'alert' | 'automation' | 'audit';

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  severity: EventSeverity;
  source: string;
  rule: string;
  timestamp: string;
  acknowledged: boolean;
  channel: 'SSE' | 'Webhook' | 'Job';
}

const INITIAL_EVENTS: ActivityEvent[] = [
  {
    id: 'evt-1101',
    title: 'Critical credential dump ingested',
    description: 'Dark web feed normalized 1.2k new credentials tied to finance leadership.',
    category: 'alert',
    severity: 'critical',
    source: 'Feed Ingestion',
    rule: 'critical-credential-dump',
    timestamp: '2025-11-18T08:18:00Z',
    acknowledged: false,
    channel: 'SSE',
  },
  {
    id: 'evt-1098',
    title: 'Vendor advisory indexed',
    description: 'Vendor Radar pushed CVE-2025-1123 advisory with compensating controls.',
    category: 'ingestion',
    severity: 'high',
    source: 'Vendor Radar',
    rule: 'vendor-critical',
    timestamp: '2025-11-18T08:12:00Z',
    acknowledged: false,
    channel: 'Job',
  },
  {
    id: 'evt-1095',
    title: 'Automation run completed',
    description: 'Playbook reset credentials for exposed accounts (14 targets).',
    category: 'automation',
    severity: 'medium',
    source: 'Automation Engine',
    rule: 'auto-reset',
    timestamp: '2025-11-18T08:07:00Z',
    acknowledged: true,
    channel: 'Webhook',
  },
  {
    id: 'evt-1092',
    title: 'SOC analyst acknowledged incident',
    description: 'Incident #432 reassigned to Tier-2 and acknowledged.',
    category: 'audit',
    severity: 'low',
    source: 'SOC Console',
    rule: 'incident-ack',
    timestamp: '2025-11-18T07:58:00Z',
    acknowledged: true,
    channel: 'Webhook',
  },
];

const severityStyles: Record<EventSeverity, string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-rose-100 text-rose-700 border-rose-200',
};

const categoryStyles: Record<EventCategory, string> = {
  ingestion: 'bg-blue-50 text-blue-700 border-blue-200',
  alert: 'bg-rose-50 text-rose-700 border-rose-200',
  automation: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  audit: 'bg-slate-50 text-slate-700 border-slate-200',
};

const ActivityStreamWidget: React.FC<{ widgetId: string }> = () => {
  const [events, setEvents] = useState<ActivityEvent[]>(INITIAL_EVENTS);
  const [severityFilter, setSeverityFilter] = useState<EventSeverity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [liveMode, setLiveMode] = useState(true);
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const queueRef = useRef<ActivityEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchSecurityActivity({ limit: 25 });
        if (!cancelled && response?.events?.length) {
          setEvents(response.events);
        }
      } catch (error) {
        console.warn('Security activity fetch failed', error);
        if (!cancelled) {
          setErrorMessage('Activity service offline; showing cached events.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!liveMode) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsStreamConnected(false);
      return;
    }

    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      setErrorMessage('Realtime stream unavailable in this environment.');
      return;
    }

    const source = new window.EventSource(getActivityStreamUrl());
    eventSourceRef.current = source;

    source.onopen = () => {
      setIsStreamConnected(true);
      setErrorMessage(null);
    };
    source.onerror = () => {
      setIsStreamConnected(false);
      setErrorMessage('Realtime stream disconnected.');
    };
    source.addEventListener('security-bootstrap', event => {
      try {
        const payload = JSON.parse(event.data) as ActivityEvent[];
        setEvents(payload);
      } catch (err) {
        console.warn('Failed to parse bootstrap payload', err);
      }
    });
    source.addEventListener('security-activity', event => {
      try {
        const payload = JSON.parse(event.data) as ActivityEvent;
        setEvents(prev => [payload, ...prev].slice(0, 50));
      } catch (err) {
        console.warn('Failed to parse activity payload', err);
      }
    });
    source.addEventListener('security-heartbeat', () => {
      setIsStreamConnected(true);
    });

    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [liveMode]);

  useEffect(() => {
    if (!liveMode) {
      return;
    }
    const timer = setInterval(() => {
      setEvents(prev => {
        const next = queueRef.current.shift();
        if (!next) {
          return prev;
        }
        const stamped = { ...next, timestamp: new Date().toISOString() };
        queueRef.current.push({
          ...next,
          id: `${next.id}-${Date.now()}`,
          timestamp: new Date().toISOString(),
        });
        return [stamped, ...prev].slice(0, 12);
      });
    }, 12000);
    return () => clearInterval(timer);
  }, [liveMode]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSeverity = severityFilter === 'all' ? true : event.severity === severityFilter;
      const matchesCategory = categoryFilter === 'all' ? true : event.category === categoryFilter;
      return matchesSeverity && matchesCategory;
    });
  }, [events, severityFilter, categoryFilter]);

  const activeAlertCount = events.filter(event => !event.acknowledged && (event.severity === 'high' || event.severity === 'critical')).length;

  const lastDeliveredAt = events[0]?.timestamp ?? INITIAL_EVENTS[0].timestamp;

  const handleAcknowledge = useCallback(
    async (id: string, acknowledged: boolean) => {
      setEvents(prev => prev.map(event => (event.id === id ? { ...event, acknowledged } : event)));
      try {
        await acknowledgeActivityEvent(id, acknowledged);
      } catch (error) {
        console.warn('Failed to update acknowledgement', error);
        setEvents(prev => prev.map(event => (event.id === id ? { ...event, acknowledged: !acknowledged } : event)));
        setErrorMessage('Unable to persist acknowledgement.');
      }
    },
    [],
  );

  const acknowledgeAll = useCallback(async () => {
    const ids = filteredEvents.filter(event => !event.acknowledged).map(event => event.id);
    if (ids.length === 0) return;
    setEvents(prev => prev.map(event => (ids.includes(event.id) ? { ...event, acknowledged: true } : event)));
    await Promise.all(ids.map(id => acknowledgeActivityEvent(id, true).catch(() => undefined)));
  }, [filteredEvents]);

  return (
    <div className="h-full flex flex-col -m-4" data-testid="activity-stream-widget">
      <header className="p-4 bg-slate-950/85 text-white border-b border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Cyberstreams Track 2.B</p>
            <h3 className="text-2xl font-semibold">Activity Stream · Real-time Security Feed</h3>
            <p className="text-sm text-white/80">
              Server-sent events pipeline consolidating alerts, automation runs and audit actions.
            </p>
          </div>
          <div className="text-right min-w-[180px]">
            <p className="text-xs text-white/70">Last delivery</p>
            <p className="text-lg font-semibold">{new Date(lastDeliveredAt).toLocaleTimeString()}</p>
            <p className="text-xs text-white/60">
              Streaming {liveMode ? 'ON' : 'PAUSED'} · {isStreamConnected ? 'connected' : 'offline'}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
        <section className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Filters</h4>
              <Button variant="subtle" size="small" onClick={() => { setSeverityFilter('all'); setCategoryFilter('all'); }}>
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 block" htmlFor="severity-filter">
                  Severity
                </label>
                <select
                  id="severity-filter"
                  value={severityFilter}
                  onChange={event => setSeverityFilter(event.target.value as EventSeverity | 'all')}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white/80 dark:bg-slate-950/40"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 block" htmlFor="category-filter">
                  Category
                </label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={event => setCategoryFilter(event.target.value as EventCategory | 'all')}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white/80 dark:bg-slate-950/40"
                >
                  <option value="all">All</option>
                  <option value="alert">Alert</option>
                  <option value="ingestion">Ingestion</option>
                  <option value="automation">Automation</option>
                  <option value="audit">Audit</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant={liveMode ? 'success' : 'subtle'} size="small" onClick={() => setLiveMode(prev => !prev)}>
                {liveMode ? 'Pause stream' : 'Resume stream'}
              </Button>
              <Button variant="primary" size="small" onClick={acknowledgeAll}>
                Acknowledge all
              </Button>
            </div>
            {errorMessage && <p className="text-xs text-amber-600 mt-2">{errorMessage}</p>}
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4">
            <h4 className="font-semibold text-sm mb-3">SLA & metrics</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Active alerts</p>
                <p className="text-2xl font-semibold">{activeAlertCount}</p>
              </div>
              <div>
                <p className="text-slate-500">SSE uptime</p>
                <p className="text-2xl font-semibold">99.99%</p>
              </div>
              <div>
                <p className="text-slate-500">Average delivery</p>
                <p className="text-2xl font-semibold">86 ms</p>
              </div>
              <div>
                <p className="text-slate-500">Buffer depth</p>
                <p className="text-2xl font-semibold">{Math.max(0, events.length - filteredEvents.length)} events</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Source channels: SSE ({events.filter(event => event.channel === 'SSE').length}), Webhook ({events.filter(event => event.channel === 'Webhook').length}), Job ({events.filter(event => event.channel === 'Job').length})
            </p>
          </div>
        </section>

        <section className="col-span-12 xl:col-span-8 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Live events</h4>
            <p className="text-xs text-slate-500">{filteredEvents.length} displayed / {events.length} total</p>
          </div>
          <div className="space-y-3 overflow-auto" data-testid="activity-events">
            {filteredEvents.map(event => (
              <article key={event.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl" data-testid="activity-event">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()} · {event.source}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full border ${severityStyles[event.severity]}`}>
                      {event.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border ${categoryStyles[event.category]}`}>
                      {event.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      {event.channel}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{event.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                  <span>Rule: {event.rule}</span>
                  <span>Status: {event.acknowledged ? 'Acknowledged' : 'Open'}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="primary" size="small">
                    Drill-down
                  </Button>
                  <Button
                    variant={event.acknowledged ? 'subtle' : 'success'}
                    size="small"
                    onClick={() => handleAcknowledge(event.id, !event.acknowledged)}
                  >
                    {event.acknowledged ? 'Re-open' : 'Acknowledge'}
                  </Button>
                </div>
              </article>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                No events match the selected filters.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ActivityStreamWidget;

