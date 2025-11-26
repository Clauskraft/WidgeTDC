import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
// import { usePermissions } from '../contexts/PermissionContext';

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
type AlertStatus = 'active' | 'resolved' | 'emerging';
type ScanStage = 'idle' | 'querying_engines' | 'aggregating' | 'ai_analysis' | 'complete';

interface DarkWebFeed {
  id: string;
  name: string;
  source: string; // e.g., "Ahmia", "Torch", "OnionLand"
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
  aiAnalysis?: string; // New field for AI summary
  sourceUrl?: string;
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
  low: 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  critical: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
};

const statusIndicators: Record<AlertStatus, string> = {
  active: 'text-orange-600 dark:text-orange-400',
  resolved: 'text-emerald-600 dark:text-emerald-400',
  emerging: 'text-amber-600 dark:text-amber-400',
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

  // Search Configuration
  const [keywords, setKeywords] = useState<string[]>(['company.com', 'internal-project', 'secret-key']);
  const [newKeyword, setNewKeyword] = useState('');

  const [levelFilter, setLevelFilter] = useState<ThreatLevel | 'all'>('all');
  const [selectedFeedId, setSelectedFeedId] = useState('');
  const [autoPolling, setAutoPolling] = useState(true);
  const [payload, setPayload] = useState<DarkWebPayload>(EMPTY_PAYLOAD);
  const [scanStage, setScanStage] = useState<ScanStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulated "Robin" Methodology:
  // 1. Query Tor Search Engines (Ahmia, Torch, etc.)
  // 2. Aggregate Results
  // 3. AI Analysis (LLM) to filter noise and classify threats
  const runDeepScan = async (): Promise<DarkWebPayload> => {
    // Simulation of the multi-step process
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          feeds: [
            {
              id: 'f1',
              name: 'Ahmia Search Results',
              source: 'Ahmia.fi',
              lastScan: new Date().toISOString(),
              threatsCount: 12,
              credentialsLeaked: 450,
              regions: ['Global'],
              threatLevel: 'medium',
              status: 'active',
              avgPriceUSD: 0,
            },
            {
              id: 'f2',
              name: 'Torch Index',
              source: 'Torch',
              lastScan: new Date().toISOString(),
              threatsCount: 3,
              credentialsLeaked: 0,
              regions: ['RU', 'CN'],
              threatLevel: 'high',
              status: 'emerging',
              avgPriceUSD: 1500,
            }
          ],
          threats: [
            {
              id: 't1',
              feedId: 'f1',
              title: 'Database Dump: company.com',
              description: 'SQL dump found on public pastebin via Tor. Contains user emails.',
              severity: 'high',
              leakedDataType: 'SQL Database',
              priceUSD: 0,
              detectedAt: new Date().toISOString(),
              affectedEntities: 1,
              aiAnalysis: 'High confidence match. The dump structure matches standard SQL exports. Immediate investigation recommended.',
              sourceUrl: 'http://msydqstlz2kzerdg.onion/paste/12345'
            },
            {
              id: 't2',
              feedId: 'f2',
              title: 'Access Key Sale',
              description: 'Vendor selling RDP access potentially linked to internal-project.',
              severity: 'critical',
              leakedDataType: 'RDP Credentials',
              priceUSD: 1500,
              detectedAt: new Date().toISOString(),
              affectedEntities: 1,
              aiAnalysis: 'AI detected keywords "internal-project" and "admin" in the listing description. Seller has high reputation.',
              sourceUrl: 'http://xmh57jrzrnw6insl.onion/market/item/99'
            }
          ],
          metrics: {
            totalThreats: 15,
            avgPriceUSD: 500,
            leakVelocity: 2.5,
            resolutionRate: 0.4,
          },
        });
      }, 4000); // Total simulation time
    });
  };

  const refreshData = useCallback(async () => {
    try {
      setScanStage('querying_engines');
      // Simulate stages
      setTimeout(() => setScanStage('aggregating'), 1500);
      setTimeout(() => setScanStage('ai_analysis'), 3000);

      const response = await runDeepScan();

      setPayload(response);
      setScanStage('complete');
      setTimeout(() => setScanStage('idle'), 2000); // Reset to idle after showing complete
      setErrorMessage(null);
    } catch (error) {
      console.warn('Dark web monitor refresh failed', error);
      setPayload(EMPTY_PAYLOAD);
      setErrorMessage('Scan failed - Check Tor Gateway connection');
      setScanStage('idle');
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
    // const term = searchTerm.trim().toLowerCase(); // Removed local search for now, focusing on "Keywords" config
    return feeds.filter(feed => {
      const matchesLevel = levelFilter === 'all' ? true : feed.threatLevel === levelFilter;
      return matchesLevel;
    });
  }, [levelFilter, feeds]);

  useEffect(() => {
    if (filteredFeeds.length === 0) return;
    if (!filteredFeeds.some(feed => feed.id === selectedFeedId) && filteredFeeds.length > 0) {
      setSelectedFeedId(filteredFeeds[0].id);
    }
  }, [filteredFeeds, selectedFeedId]);

  const selectedFeed = feeds.find(feed => feed.id === selectedFeedId);
  const selectedThreats = threats.filter(item => item.feedId === (selectedFeed ? selectedFeed.id : '')).slice(0, 5);

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  if (loading) return <div>Loading permissions...</div>;

  return (
    <div className="h-full flex flex-col -m-4" data-testid="dark-web-monitor-widget">
      <header className="p-4 bg-slate-950/90 text-white border-b border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Robin Engine Active</p>
              {scanStage !== 'idle' && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <h3 className="text-2xl font-semibold">Dark Web Monitor</h3>
            <p className="text-sm text-white/80">
              AI-Powered Tor Search & Analysis
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${scanStage === 'idle' ? 'border-slate-600 text-slate-400' :
                scanStage === 'querying_engines' ? 'border-blue-500 text-blue-400 animate-pulse' :
                  scanStage === 'aggregating' ? 'border-purple-500 text-purple-400 animate-pulse' :
                    scanStage === 'ai_analysis' ? 'border-amber-500 text-amber-400 animate-pulse' :
                      'border-emerald-500 text-emerald-400'
                }`}>
                {scanStage === 'idle' ? 'Ready' :
                  scanStage === 'querying_engines' ? 'Querying Tor Engines...' :
                    scanStage === 'aggregating' ? 'Aggregating Results...' :
                      scanStage === 'ai_analysis' ? 'AI Analyzing Content...' :
                        'Scan Complete'}
              </span>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoPolling}
                onChange={() => setAutoPolling(v => !v)}
                aria-label="Toggle background scanning"
                className="ms-focusable"
              />
              Auto scan (5m)
            </label>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        {/* Left Panel: Configuration & Sources */}
        <section className="col-span-12 lg:col-span-4 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-sm mb-2">Target Keywords</h4>
            <form onSubmit={handleAddKeyword} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="Add keyword..."
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 text-sm"
              />
              <Button type="submit" variant="subtle" size="small">+</Button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="hover:text-rose-500">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <h4 className="font-semibold text-sm mb-2">Active Sources</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Ahmia.fi
                </span>
                <span className="text-slate-500">Indexed</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Torch
                </span>
                <span className="text-slate-500">Indexed</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Haystack
                </span>
                <span className="text-slate-500">Slow response</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-800">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Scan Results
            </div>
            {filteredFeeds.length > 0 ? (
              filteredFeeds.map(feed => (
                <button
                  key={feed.id}
                  onClick={() => setSelectedFeedId(feed.id)}
                  className={`w-full text-left px-4 py-3 transition-colors focus-visible:outline-blue-500 ${feed.id === selectedFeedId ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{feed.name}</p>
                      <p className="text-xs text-slate-500">
                        {feed.source}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${severityStyles[feed.threatLevel]}`}>
                      {feed.threatLevel.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                {scanStage !== 'idle' ? 'Scanning...' : 'No results found.'}
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Analysis & Details */}
        <section className="col-span-12 lg:col-span-8 h-full flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Total Threats" value={metrics.totalThreats.toLocaleString()} helper="AI Verified" />
            <MetricCard label="Avg Price" value={formatPrice(metrics.avgPriceUSD)} helper="Market Value" />
            <MetricCard label="Leak Velocity" value={`${metrics.leakVelocity}/hr`} helper="New listings" />
          </div>

          <div className="grid grid-cols-1 gap-4 flex-1 overflow-hidden">
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/70 p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div>
                  <h4 className="font-semibold text-sm">
                    AI Threat Analysis
                  </h4>
                  <p className="text-xs text-slate-500">
                    {selectedFeed ? `Analyzing results from ${selectedFeed.source}` : 'Select a source to view analysis'}
                  </p>
                </div>
                <Button variant="primary" size="small" onClick={refreshData} disabled={scanStage !== 'idle'}>
                  {scanStage === 'idle' ? 'Run Deep Scan' : 'Scanning...'}
                </Button>
              </div>

              <div className="space-y-3 overflow-auto flex-1 pr-2">
                {selectedThreats.length > 0 ? (
                  selectedThreats.map(threat => (
                    <article key={threat.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-950/30">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityStyles[threat.severity]}`}>
                              {threat.severity.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">{formatDate(threat.detectedAt)}</span>
                          </div>
                          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{threat.title}</h5>
                        </div>
                        <div className="text-right">
                          <span className="block font-semibold text-sm">{formatPrice(threat.priceUSD)}</span>
                          <a href="#" className="text-[10px] text-blue-500 hover:underline">View Onion Link</a>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        {threat.description}
                      </p>

                      {threat.aiAnalysis && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">AI Analysis</span>
                            <span className="h-px flex-1 bg-blue-200 dark:bg-blue-800"></span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {threat.aiAnalysis}
                          </p>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <p className="text-sm">No threats detected for this source.</p>
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
