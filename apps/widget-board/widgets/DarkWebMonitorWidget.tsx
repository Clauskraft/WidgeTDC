import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useWidgetBridge } from '../contexts/WidgetBridgeContext';
import { useMCP } from '../src/hooks/useMCP';

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
  aiAnalysis?: string;
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

const DarkWebMonitorWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { reportStatus } = useWidgetBridge();
  const { send } = useMCP();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<DarkWebPayload>(EMPTY_PAYLOAD);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Hent data fra backend (INGEN MOCK)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Kalder backend tool 'widgets.threat.hunt' for at hente live data
      const response = await send('agent-orchestrator', 'widgets.threat.hunt', {
        target: 'company.com', // Dette bør være konfigurerbart
        category: 'all'
      });

      if (response && response.data) {
        setPayload(response.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        // Hvis backend svarer men uden data (fordi scrapers ikke kører)
        setPayload(EMPTY_PAYLOAD);
        if (response?.message) {
            // Backend message (f.eks. "Hunt started")
            console.log(response.message);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Dark Web data:', error);
      setErrorMessage('Kunne ikke forbinde til Backend. Tjek at serveren kører.');
      setPayload(EMPTY_PAYLOAD);
    } finally {
      setLoading(false);
    }
  }, [send]);

  // Start fetch ved mount
  useEffect(() => {
    fetchData();
    // Poll hver 5. minut
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Report status to bridge whenever payload changes
  useEffect(() => {
    const summary = `Fundet ${payload.metrics.totalThreats} trusler.`;
    reportStatus(
      widgetId,
      'Dark Web Monitor',
      summary,
      payload
    );
  }, [payload, widgetId, reportStatus]);

  return (
    <div className="h-full flex flex-col -m-4" data-testid="dark-web-monitor-widget">
      <header className="p-4 bg-slate-950/90 text-white border-b border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">LIVE MONITOR</p>
              {loading && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <h3 className="text-2xl font-semibold">Dark Web Monitor</h3>
            <p className="text-sm text-white/80">
              Real-time Threat Intelligence
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Last updated: {lastUpdated || 'Never'}</p>
            <Button variant="subtle" size="small" onClick={fetchData} disabled={loading}>
                {loading ? 'Scanning...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
        {errorMessage ? (
            <div className="h-full flex flex-col items-center justify-center text-red-400">
                <p className="font-bold">Forbindelsesfejl</p>
                <p className="text-sm">{errorMessage}</p>
                <Button className="mt-4" onClick={fetchData}>Prøv igen</Button>
            </div>
        ) : payload.metrics.totalThreats === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <p className="text-lg font-medium">Ingen trusler fundet</p>
                <p className="text-sm">Eller backend scraper har ikke kørt endnu.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {/* Vis rigtige data her når det kommer */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold mb-2">Aktive Trusler</h4>
                    {payload.threats.map(threat => (
                        <div key={threat.id} className="mb-2 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                            <div className="flex justify-between">
                                <span className="font-semibold">{threat.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${severityStyles[threat.severity]}`}>{threat.severity}</span>
                            </div>
                            <p className="text-xs text-slate-500">{threat.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DarkWebMonitorWidget;
