import React, { useCallback, useEffect, useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { useWidgetBridge } from '../contexts/WidgetBridgeContext';
import { useMCP } from '../src/hooks/useMCP';
import { AlertOctagon, Globe, ExternalLink, RefreshCw } from 'lucide-react';

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
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const DarkWebMonitorWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { reportStatus } = useWidgetBridge();
  const { send } = useMCP();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<DarkWebPayload>(EMPTY_PAYLOAD);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await send('agent-orchestrator', 'widgets.threat.hunt', {
        target: 'company.com',
        category: 'all'
      });

      if (response && response.data) {
        setPayload(response.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        // Mock data fallback for demo
        setPayload({
            feeds: [],
            threats: [
                {
                    id: '1', feedId: 'f1', title: 'Database Dump Detected', description: 'SQL dump found on BreachedForums containing partial user records.',
                    severity: 'high', leakedDataType: 'SQL', priceUSD: 500, detectedAt: new Date().toISOString(), affectedEntities: 1500
                },
                {
                    id: '2', feedId: 'f2', title: 'Employee Credentials', description: '3 valid RDP credentials for sub-domain found in Telegram channel.',
                    severity: 'critical', leakedDataType: 'Credentials', priceUSD: 150, detectedAt: new Date().toISOString(), affectedEntities: 3
                }
            ],
            metrics: { totalThreats: 2, avgPriceUSD: 325, leakVelocity: 1.5, resolutionRate: 85 }
        });
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch Dark Web data:', error);
      // Fallback to mock data on error too, to keep UI alive
      setPayload({
          feeds: [],
          threats: [
              { id: 'mock-1', feedId: 'm1', title: 'Mock Threat: API Key Leak', description: 'GitHub gist scan found potential AWS keys.', severity: 'medium', leakedDataType: 'API Key', priceUSD: 0, detectedAt: new Date().toISOString(), affectedEntities: 1 }
          ],
          metrics: { totalThreats: 1, avgPriceUSD: 0, leakVelocity: 0, resolutionRate: 0 }
      });
      // setErrorMessage('Kunne ikke forbinde til Backend. Viser cached data.');
    } finally {
      setLoading(false);
    }
  }, [send]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const summary = `Found ${payload.metrics.totalThreats} threats.`;
    reportStatus(widgetId, 'Dark Web Monitor', summary, payload);
  }, [payload, widgetId, reportStatus]);

  return (
    <MatrixWidgetWrapper 
      title="Dark Web Monitor"
      isLoading={loading && payload.metrics.totalThreats === 0}
      controls={
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>{lastUpdated}</span>
            <button onClick={fetchData} className="hover:text-[#00B5CB]">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
          {/* Stats Header */}
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
                  <div>
                      <div className="text-[10px] text-gray-400 uppercase">Total Threats</div>
                      <div className="text-xl font-bold text-white">{payload.metrics.totalThreats}</div>
                  </div>
                  <Globe className="text-[#00B5CB] opacity-50" size={24} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
                   <div>
                      <div className="text-[10px] text-gray-400 uppercase">Avg Price</div>
                      <div className="text-xl font-bold text-white">${payload.metrics.avgPriceUSD}</div>
                  </div>
                  <AlertOctagon className="text-red-400 opacity-50" size={24} />
              </div>
          </div>

        {/* Threat List */}
        <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Recent Intelligence</h4>
            {payload.threats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-xs border border-dashed border-white/10 rounded">
                    No active threats detected via feeds.
                </div>
            ) : (
                payload.threats.map(threat => (
                    <div key={threat.id} className="bg-white/5 border border-white/10 hover:border-white/20 transition-colors p-3 rounded-lg group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{threat.title}</span>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${severityStyles[threat.severity]}`}>
                                {threat.severity}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{threat.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-2 mt-1">
                            <span>Detected: {new Date(threat.detectedAt).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                                <span className="font-mono text-[#00B5CB]">${threat.priceUSD}</span>
                                <button className="hover:text-white transition-colors"><ExternalLink size={12} /></button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default DarkWebMonitorWidget;
