import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import {
  fetchSecurityTemplates,
  fetchSecuritySearchHistory,
  runSecuritySearch,
} from '../utils/securityApi';

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
type TimeWindow = '1h' | '6h' | '24h' | '7d' | '30d';

interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  query: string;
  severity: ThreatLevel | 'all';
  timeframe: TimeWindow;
  sources: string[];
}

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  source: string;
  severity: ThreatLevel;
  timestamp: string;
  tags: string[];
  score: number;
}

interface SearchHistoryEntry {
  id: string;
  query: string;
  severity: string;
  timeframe: string;
  sources: string[];
  results: number;
  latencyMs: number;
  ranAt: string;
}

interface SearchMetrics {
  latencyMs: number;
  totalDocs: number;
  coverage: number;
}

const FALLBACK_TEMPLATES: SavedTemplate[] = [
  {
    id: 'tpl-high-severity',
    name: 'High fidelity alerts',
    description: 'Critical events touching finance or executive accounts within 24h.',
    query: 'credential leak finance exec',
    severity: 'critical',
    timeframe: '24h',
    sources: ['Dark Web', 'Feed Ingestion'],
  },
  {
    id: 'tpl-zero-day',
    name: 'Zero-day exploitation',
    description: 'Vendor advisories mentioning active exploitation or PoC for CVEs.',
    query: 'zero-day vendor advisory exploitation',
    severity: 'medium',
    timeframe: '7d',
    sources: ['Vendor Radar', 'CERT-EU'],
  },
  {
    id: 'tpl-supply-chain',
    name: 'Supply chain monitoring',
    description: 'Events referencing suppliers or 3rd party SaaS incidents.',
    query: 'supplier breach SaaS incident',
    severity: 'all',
    timeframe: '30d',
    sources: ['Feed Ingestion', 'Internal Telemetry'],
  },
];

const FALLBACK_RESULTS: SearchResult[] = [
  {
    id: 'sr-4031',
    title: 'Dark web actor selling finance leadership credentials',
    summary: 'Marketplace listing with 24 unique accounts incl. CFO and procurement lead.',
    source: 'Feed Ingestion',
    severity: 'critical',
    timestamp: '2025-11-18T08:18:00Z',
    tags: ['credentials', 'darkweb', 'finance'],
    score: 0.92,
  },
  {
    id: 'sr-4024',
    title: 'CVE-2025-1123 exploited in procurement SaaS tenant',
    summary: 'Vendor confirms active exploitation with SQL injection payload hitting EU tenants.',
    source: 'Vendor Radar',
    severity: 'high',
    timestamp: '2025-11-18T07:58:00Z',
    tags: ['cve-2025-1123', 'procurement', 'sql injection'],
    score: 0.84,
  },
  {
    id: 'sr-3988',
    title: 'Suspicious OAuth consent for executive mailbox',
    summary: 'Detected via internal telemetry, unrecognized app requested mail.read and offline_access.',
    source: 'Internal Telemetry',
    severity: 'medium',
    timestamp: '2025-11-18T07:40:00Z',
    tags: ['oauth', 'mailbox', 'delegated access'],
    score: 0.79,
  },
  {
    id: 'sr-3921',
    title: 'Supplier hosting provider outage',
    summary: 'OSINT chatter indicates ransomware event at Tier-2 supplier datacenter.',
    source: 'Feed Ingestion',
    severity: 'high',
    timestamp: '2025-11-18T06:55:00Z',
    tags: ['supply-chain', 'ransomware'],
    score: 0.73,
  },
];

const DEFAULT_METRICS: SearchMetrics = {
  latencyMs: 182,
  totalDocs: 126_000,
  coverage: 0.87,
};

const AVAILABLE_SOURCES = ['Feed Ingestion', 'Dark Web', 'Vendor Radar', 'CERT-EU', 'Internal Telemetry'] as const;

const severityStyles: Record<ThreatLevel, string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-rose-100 text-rose-700 border-rose-200',
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SearchInterfaceWidget: React.FC<{ widgetId: string }> = () => {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<ThreatLevel | 'all'>('all');
  const [timeframe, setTimeframe] = useState<TimeWindow>('24h');
  const [sources, setSources] = useState<string[]>(['Feed Ingestion', 'Dark Web']);
  const [templates, setTemplates] = useState<SavedTemplate[]>(FALLBACK_TEMPLATES);
  const [results, setResults] = useState<SearchResult[]>(FALLBACK_RESULTS.slice(0, 3));
  const [metrics, setMetrics] = useState<SearchMetrics>(DEFAULT_METRICS);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [templateResponse, historyResponse] = await Promise.all([
          fetchSecurityTemplates(),
          fetchSecuritySearchHistory(6),
        ]);
        if (cancelled) return;
        if (templateResponse.templates?.length) {
          setTemplates(templateResponse.templates);
        }
        if (historyResponse.history?.length) {
          setHistory(historyResponse.history);
        }
        setBootstrapMessage(null);
      } catch (error) {
        console.warn('Security search bootstrap failed', error);
        if (!cancelled) {
          setBootstrapMessage('Security services offline; showing cached templates.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeTerms = useMemo(
    () => query.trim().split(/\s+/).filter(Boolean),
    [query],
  );

  const highlightText = (text: string) => {
    if (activeTerms.length === 0) {
      return text;
    }
    const regex = new RegExp(`(${activeTerms.map(escapeRegExp).join('|')})`, 'gi');
    const segments = text.split(regex);
    return segments.map((segment, index) => {
      if (segment === '') {
        return null;
      }
      const isHighlight = index % 2 === 1;
      return isHighlight ? (
        <mark key={`${segment}-${index}`} className="bg-amber-200 text-amber-900 rounded px-0.5">
          {segment}
        </mark>
      ) : (
        <Fragment key={`${segment}-${index}`}>{segment}</Fragment>
      );
    });
  };

  const toggleSource = (source: string) => {
    setSources(prev => (prev.includes(source) ? prev.filter(item => item !== source) : [...prev, source]));
  };

  const applyTemplate = (template: SavedTemplate) => {
    setQuery(template.query);
    setSeverity(template.severity);
    setTimeframe(template.timeframe);
    setSources(template.sources);
  };

  const executeSearch = useCallback(async () => {
    try {
      setIsSearching(true);
      const payload = await runSecuritySearch({
        query,
        severity,
        timeframe,
        sources,
      });
      setResults(payload.results?.length ? payload.results : []);
      setMetrics(payload.metrics ?? DEFAULT_METRICS);
      if (payload.auditEntry) {
        setHistory(prev => [payload.auditEntry, ...prev].slice(0, 6));
      }
      setSearchError(null);
    } catch (error) {
      console.warn('Security search failed', error);
      setSearchError('Search service unavailable; showing cached data.');
      setHistory(prev => [
        {
          id: `hist-fallback-${Date.now()}`,
          query: query || '(blank query)',
          severity,
          timeframe,
          sources,
          results: results.length,
          latencyMs: DEFAULT_METRICS.latencyMs,
          ranAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 6));
    } finally {
      setIsSearching(false);
    }
  }, [query, severity, timeframe, sources]);

  return (
    <div className="h-full flex flex-col -m-4" data-testid="search-interface-widget">
      <header className="p-4 bg-slate-950/85 text-white border-b border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Cyberstreams Track 2.B</p>
            <h3 className="text-2xl font-semibold">Search Interface · Unified Threat Query</h3>
            <p className="text-sm text-white/80">
              Advanced query builder targeting OpenSearch with saved templates and audit history.
            </p>
          </div>
          <div className="text-right min-w-[150px]">
            <p className="text-xs text-white/70">Current SLA</p>
            <p className="text-2xl font-semibold">{metrics.latencyMs} ms</p>
            {searchError && <p className="text-xs text-rose-300 mt-1">{searchError}</p>}
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
        <section className="col-span-12 xl:col-span-5 flex flex-col gap-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Query builder</h4>
              <Button
                variant="primary"
                size="small"
                onClick={executeSearch}
                aria-label="Run query"
                disabled={isSearching}
              >
                {isSearching ? 'Searching…' : 'Run query'}
              </Button>
            </div>
            <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 block" htmlFor="search-query">
              Search query
            </label>
            <textarea
              id="search-query"
              value={query}
              onChange={event => setQuery(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white/80 dark:bg-slate-950/40"
              placeholder="Example: credential leak finance exec"
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 block" htmlFor="severity-select">
                  Severity
                </label>
                <select
                  id="severity-select"
                  value={severity}
                  onChange={event => setSeverity(event.target.value as ThreatLevel | 'all')}
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
                <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 block" htmlFor="timeframe-select">
                  Timeframe
                </label>
                <select
                  id="timeframe-select"
                  value={timeframe}
                  onChange={event => setTimeframe(event.target.value as TimeWindow)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white/80 dark:bg-slate-950/40"
                >
                  <option value="1h">Last hour</option>
                  <option value="6h">Last 6 hours</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
            </div>
            <fieldset className="mt-4">
              <legend className="text-xs text-slate-600 dark:text-slate-300 mb-2">Sources</legend>
              <div className="flex flex-wrap gap-3 text-sm">
                {AVAILABLE_SOURCES.map(source => (
                  <label key={source} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sources.includes(source)}
                      onChange={() => toggleSource(source)}
                      aria-label={`Toggle source ${source}`}
                      className="ms-focusable"
                    />
                    {source}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-sm">Saved templates</h4>
                <p className="text-xs text-slate-500">
                  Curated by SecOps · WCAG compliant
                  {bootstrapMessage && <span className="text-amber-600 ml-2">{bootstrapMessage}</span>}
                </p>
              </div>
              <Button variant="subtle" size="small">
                Create template
              </Button>
            </div>
            <div className="space-y-3" role="list">
              {templates.map(template => (
                <article key={template.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl" role="listitem">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{template.name}</p>
                      <p className="text-xs text-slate-500">{template.description}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => applyTemplate(template)}
                      aria-label={`Use template: ${template.name}`}
                    >
                      Use template
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] mt-2 text-slate-600 dark:text-slate-300">
                    <span>Severity: {template.severity}</span>
                    <span>Timeframe: {template.timeframe}</span>
                    <span>Sources: {template.sources.join(', ')}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="col-span-12 xl:col-span-7 flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Documents scanned" value={metrics.totalDocs.toLocaleString()} helper="OpenSearch ti-feeds" />
            <Metric label="Query latency" value={`${metrics.latencyMs} ms`} helper="P95" />
            <Metric label="Coverage" value={`${Math.round(metrics.coverage * 100)}%`} helper="Feeds connected" />
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Results</h4>
              <p className="text-xs text-slate-500">{results.length} matches</p>
            </div>
            <div className="space-y-3 overflow-auto h-full" data-testid="search-results">
              {results.map(result => (
                <article key={result.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl" data-testid="search-result">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold">{result.id}</span>
                    <span>{new Date(result.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-semibold mt-1">{highlightText(result.title)}</p>
                  <p className="text-xs text-slate-500">{highlightText(result.summary)}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full border ${severityStyles[result.severity]}`}>
                      {result.severity.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{result.source}</span>
                    <span className="text-slate-500">Score {Math.round(result.score * 100)}%</span>
                    {(result.tags ?? []).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
              {results.length === 0 && (
                <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                  No documents matched. Adjust filters or broaden timeframe.
                </div>
              )}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 h-48 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Search history</h4>
              <Button variant="subtle" size="small">
                Export audit log
              </Button>
            </div>
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left font-medium">Time</th>
                  <th className="text-left font-medium">Query</th>
                  <th className="text-left font-medium">Filters</th>
                  <th className="text-left font-medium">Results</th>
                  <th className="text-left font-medium">Latency</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-200">
                {history.length === 0 && (
                  <tr>
                    <td className="py-2 text-center text-slate-500" colSpan={5}>
                      Run a search to populate audit history.
                    </td>
                  </tr>
                )}
                {history.map(item => (
                  <tr key={item.id} data-testid="search-history-row">
                    <td className="py-1">{new Date(item.ranAt).toLocaleTimeString()}</td>
                    <td className="py-1">{item.query}</td>
                    <td className="py-1">
                      {item.severity} · {item.timeframe} · {(item.sources ?? []).join(', ')}
                    </td>
                    <td className="py-1">{item.results}</td>
                    <td className="py-1">{item.latencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; helper?: string }> = ({ label, value, helper }) => (
  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4">
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
    {helper && <p className="text-xs text-slate-400">{helper}</p>}
  </div>
);

export default SearchInterfaceWidget;

