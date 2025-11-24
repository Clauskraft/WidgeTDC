import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
// import { usePermissions } from '../contexts/PermissionContext';

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
type AlertStatus = 'active' | 'resolved' | 'emerging';

interface DarkWebFeed {
  id: string;
  name: string;
  source: string;
  lastScan: string;
  threatsCount: number;
  credentialsLeaked: number;
  regions: string[];
  threatLevel: ThreatLevel;
  status: AlertStatus;
  avgPriceUSD: number;
}

interface ThreatItem {
  id: string;
  feedId: string;
  title: string;
  description: string;
  severity: ThreatLevel;
  leakedDataType: string;
  priceUSD: number;
  detectedAt: string;
  affectedEntities: number;
}

interface DarkWebPayload {
  feeds: DarkWebFeed[];
  threats: ThreatItem[];
  metrics: {
    totalThreats: number;
    avgPriceUSD: number;
    leakVelocity: number;
    resolutionRate: number;
  };
}

const EMPTY_PAYLOAD: DarkWebPayload = {
  feeds: [],
  threats: [],
  metrics: {
    totalThreats: 0,
    avgPriceUSD: 0,
    leakVelocity: 0,
    resolutionRate: 0,
  },
};

const severityStyles: Record<ThreatLevel, string> = {
  low: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-rose-100 text-rose-700 border-rose-200',
};

const statusIndicators: Record<AlertStatus, string> = {
  active: 'text-orange-600',
  resolved: 'text-emerald-600',
  emerging: 'text-amber-600',
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return value;
  }
};

const formatPrice = (value?: number) => {
  if (!value) return '—';
  return `$${value.toLocaleString()}`;
};

const DarkWebMonitorWidget: React.FC<{ widgetId: string }> = () => {
  // const { hasAccess, loading } = usePermissions();
  const hasAccess = true;
  const loading = false;
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<ThreatLevel | 'all'>('all');
  const [selectedFeedId, setSelectedFeedId] = useState('');
  const [autoPolling, setAutoPolling] = useState(true);
  const [payload, setPayload] = useState<DarkWebPayload>(EMPTY_PAYLOAD);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Assume fetchDarkWebThreats is implemented in utils/darkWebApi.ts
  // For now, it will throw or return empty; handle in try-catch
  const fetchDarkWebThreats = async (): Promise<DarkWebPayload> => {
    // Placeholder: Implement real API call here, e.g., via MCP or backend
    throw new Error('Dark web API not yet implemented');
  };

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchDarkWebThreats();
      setPayload(response);
      setErrorMessage(null);
    } catch (error) {
      console.warn('Dark web monitor refresh failed', error);
      setPayload(EMPTY_PAYLOAD);
      setErrorMessage('Dark web scans unavailable - API integration pending');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    refreshData();
  }, [refreshData, loading]);

  useEffect(() => {
    if (!autoPolling) return;
    const intervalId = setInterval(refreshData, 300000); // 5 min
    return () => clearInterval(intervalId);
  }, [autoPolling, refreshData]);

  const feeds = payload.feeds;
  const threats = payload.threats;
  const metrics = payload.metrics;

  const filteredFeeds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return feeds.filter(feed => {
      const matchesTerm = term.length === 0 ||
        feed.name.toLowerCase().includes(term) ||
        feed.source.toLowerCase().includes(term);
      const matchesLevel = levelFilter === 'all' ? true : feed.threatLevel === levelFilter;
      return matchesTerm && matchesLevel;
    });
  }, [searchTerm, levelFilter, feeds]);

  useEffect(() => {
    if (filteredFeeds.length === 0) return;
    if (!filteredFeeds.some(feed => feed.id === selectedFeedId) && filteredFeeds.length > 0) {
      setSelectedFeedId(filteredFeeds[0].id);
    }
  }, [filteredFeeds, selectedFeedId]);

  const selectedFeed = feeds.find(feed => feed.id === selectedFeedId);
  const selectedThreats = threats.filter(item => item.feedId === (selectedFeed?.id ?? '')).slice(0, 5);

  if (loading) return <div>Loading permissions...</div>;

  return (
    <div className="h-full flex flex-col -m-4" data-testid="dark-web-monitor-widget">
      <header className="p-4 bg-slate-950/80 text-white border-b border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Dark Web Intelligence</p>
            <h3 className="text-2xl font-semibold">Dark Web Monitor</h3>
            <p className="text-sm text-white/80">
              Real-time scanning of dark web markets, forums, and leak sites for organizational threats.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">Background scanning</p>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoPolling}
                onChange={() => setAutoPolling(v => !v)}
                aria-label="Toggle background scanning"
                className="ms-focusable"
              />
              Auto scan every 5 min
            </label>
            <div className="flex flex-col text-xs mt-2 gap-1">
              {isLoading && <span className="text-white/70">Scanning dark web…</span>}
              {errorMessage && <span className="text-rose-300">{errorMessage}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        <section className="col-span-12 lg:col-span-4 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="search"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search feed or source"
                aria-label="Search dark web feeds"
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-950/40 px-3 py-2 text-sm"
              />
              <select
                value={levelFilter}
                onChange={event => setLevelFilter(event.target.value as ThreatLevel | 'all')}
                aria-label="Threat level filter"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-950/40 px-3 py-2 text-sm"
              >
                <option value="all">All levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {filteredFeeds.length} feeds · {feeds.reduce((sum, feed) => sum + (feed.threatsCount ?? 0), 0)} threats tracked
            </p>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredFeeds.length > 0 ? (
              filteredFeeds.map(feed => (
                <button
                  key={feed.id}
                  onClick={() => setSelectedFeedId(feed.id)}
                  className={`w-full text-left px-4 py-3 transition-colors focus-visible:outline-blue-500 ${feed.id === selectedFeedId ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                    }`}
                  data-testid="dark-feed-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{feed.name}</p>
                      <p className="text-xs text-slate-500">
                        Last scan {formatDate(feed.lastScan)}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${severityStyles[feed.threatLevel]}`}>
                      {feed.threatLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className={statusIndicators[feed.status]}>{feed.status.toUpperCase()}</span>
                    <span>{feed.threatsCount} threats</span>
                    <span>{feed.credentialsLeaked.toLocaleString()} creds</span>
                    <span>Avg ${feed.avgPriceUSD}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {feed.regions.map(region => (
                      <span key={region} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {region}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                {isLoading ? 'Loading feeds...' : 'No dark web feeds available. API integration required.'}
              </div>
            )}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-8 h-full flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Total Threats" value={metrics.totalThreats.toLocaleString()} helper="Active listings" />
            <MetricCard label="Avg Price" value={formatPrice(metrics.avgPriceUSD)} helper="USD per item" />
            <MetricCard label="Leak Velocity" value={`${metrics.leakVelocity}/hr`} helper="New listings" />
            <MetricCard label="Resolution Rate" value={`${Math.round(metrics.resolutionRate * 100)}%`} helper="Taken down" />
          </div>

          <div className="grid grid-cols-1 gap-4 flex-1 overflow-hidden">
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm">
                    Latest Threats from {selectedFeed ? selectedFeed.name : 'Selected Feed'}
                  </h4>
                  <p className="text-xs text-slate-500">{selectedFeed ? selectedFeed.source : 'Source'}</p>
                </div>
                <Button variant="primary" size="small" onClick={refreshData}>
                  Scan Now
                </Button>
              </div>
              <div className="space-y-3 overflow-auto max-h-96">
                {selectedThreats.length > 0 ? (
                  selectedThreats.map(threat => (
                    <article key={threat.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-slate-500">{threat.id}</span>
                        <span>{formatDate(threat.detectedAt)}</span>
                      </div>
                      <p className="text-sm font-semibold">{threat.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{threat.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full border ${severityStyles[threat.severity]}`}>
                          {threat.severity.toUpperCase()}
                        </span>
                        <span className="text-slate-500">{threat.leakedDataType}</span>
                        <span className="font-semibold">{formatPrice(threat.priceUSD)}</span>
                        <span className="text-slate-500">{threat.affectedEntities} entities</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 text-center py-8">
                    {isLoading ? 'Loading threats...' : 'No threats available. Connect dark web API.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; helper?: string }> = ({ label, value, helper }) => (
  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4">
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
    {helper && <p className="text-xs text-slate-400 mt-1">{helper}</p>}
  </div>
);

export default DarkWebMonitorWidget;
