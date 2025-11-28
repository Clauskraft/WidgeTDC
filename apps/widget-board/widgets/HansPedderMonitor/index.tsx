// HansPedder Monitor Widget
// Real-time view of autonomous agent testing, data sources and improvement nudges

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Square,
  Lightbulb,
  Clock,
  Database,
  Wifi,
  TrendingUp,
  Zap,
  Mail,
  Globe,
  HardDrive,
  History,
  FileText,
  BookOpen,
  Server,
  Rss,
} from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  timestamp: string;
}

interface HealthMetrics {
  dataflowOk: boolean;
  apiLatency: number;
  wsConnections: number;
  lastIngestion: string | null;
  vectorStoreResponsive: boolean;
  mcpConnected: boolean;
}

interface AgentStatus {
  isRunning: boolean;
  health: HealthMetrics;
  recentTests: TestResult[];
  nudgedAreas: string[];
  nextNudgeIn: string;
}

interface Nudge {
  area: string;
  timestamp: string;
  remaining: number;
  suggestions: string[];
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string | null;
  recordCount: number;
  icon: React.ReactNode;
}

export const HansPedderMonitorWidget: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [latestNudge, setLatestNudge] = useState<Nudge | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'health' | 'sources' | 'nudges'>('health');

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/hanspedder/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Kunne ikke hente status');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataSources = async () => {
    // Fetch data source status from backend
    try {
      const response = await fetch('http://localhost:3000/api/ingestion/status');
      const data = await response.json();
      
      if (data.success && data.sources) {
        setDataSources(data.sources.map((s: any) => ({
          ...s,
          icon: getSourceIcon(s.type)
        })));
      } else {
        // Default data sources based on known integrations
        setDataSources(getDefaultDataSources());
      }
    } catch {
      setDataSources(getDefaultDataSources());
    }
  };

  const getSourceIcon = (type: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      'email': <Mail className="w-4 h-4" />,
      'outlook': <Mail className="w-4 h-4" />,
      'web': <Globe className="w-4 h-4" />,
      'local': <HardDrive className="w-4 h-4" />,
      'browser': <History className="w-4 h-4" />,
      'pubmed': <FileText className="w-4 h-4" />,
      'wikipedia': <BookOpen className="w-4 h-4" />,
      'vector': <Database className="w-4 h-4" />,
      'threat': <AlertTriangle className="w-4 h-4" />,
      'news': <Rss className="w-4 h-4" />,
    };
    return iconMap[type] || <Server className="w-4 h-4" />;
  };

  const getDefaultDataSources = (): DataSource[] => [
    {
      id: 'vidensarkiv',
      name: 'Vidensarkiv',
      type: 'vector',
      status: status?.health.vectorStoreResponsive ? 'active' : 'inactive',
      lastSync: status?.health.lastIngestion || null,
      recordCount: 0,
      icon: <Database className="w-4 h-4" />
    },
    {
      id: 'outlook',
      name: 'Outlook Emails',
      type: 'email',
      status: 'active',
      lastSync: null,
      recordCount: 0,
      icon: <Mail className="w-4 h-4" />
    },
    {
      id: 'local_files',
      name: 'Local Files',
      type: 'local',
      status: 'active',
      lastSync: null,
      recordCount: 0,
      icon: <HardDrive className="w-4 h-4" />
    },
    {
      id: 'browser_history',
      name: 'Browser History',
      type: 'browser',
      status: 'inactive',
      lastSync: null,
      recordCount: 0,
      icon: <History className="w-4 h-4" />
    },
    {
      id: 'threat_intel',
      name: 'Threat Intelligence',
      type: 'threat',
      status: 'active',
      lastSync: null,
      recordCount: 0,
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      id: 'news_monitor',
      name: 'News Monitor',
      type: 'news',
      status: 'active',
      lastSync: null,
      recordCount: 0,
      icon: <Rss className="w-4 h-4" />
    },
    {
      id: 'wikipedia',
      name: 'Wikipedia MCP',
      type: 'wikipedia',
      status: status?.health.mcpConnected ? 'active' : 'inactive',
      lastSync: null,
      recordCount: 0,
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      id: 'pubmed',
      name: 'PubMed MCP',
      type: 'pubmed',
      status: status?.health.mcpConnected ? 'active' : 'inactive',
      lastSync: null,
      recordCount: 0,
      icon: <FileText className="w-4 h-4" />
    },
  ];

  const toggleAgent = async () => {
    const endpoint = status?.isRunning ? 'stop' : 'start';
    try {
      await fetch(`http://localhost:3000/api/hanspedder/${endpoint}`, {
        method: 'POST',
      });
      fetchStatus();
    } catch (err) {
      setError('Kunne ikke ændre agent status');
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchDataSources();
    const interval = setInterval(() => {
      fetchStatus();
      fetchDataSources();
    }, 10000);

    const ws = new WebSocket('ws://localhost:3001/mcp/ws');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'hanspedder:test-results') {
          fetchStatus();
        } else if (data.type === 'hanspedder:nudge') {
          setLatestNudge(data.payload);
        } else if (data.type?.startsWith('ingestion:')) {
          fetchDataSources();
        }
      } catch {}
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  // Update default sources when status changes
  useEffect(() => {
    if (status) {
      setDataSources(getDefaultDataSources());
    }
  }, [status?.health.vectorStoreResponsive, status?.health.mcpConnected]);

  if (loading) {
    return (
      <div className="w-full h-full bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const passedTests = status?.recentTests.filter(t => t.passed).length || 0;
  const totalTests = status?.recentTests.length || 0;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  const activeSources = dataSources.filter(s => s.status === 'active').length;

  return (
    <div className="w-full h-full bg-slate-950 overflow-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              status?.isRunning ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <Activity className={`w-5 h-5 ${status?.isRunning ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">HansPedder Agent</h2>
              <p className="text-xs text-white/50">
                {status?.isRunning ? `Kører • ${activeSources} kilder aktive` : 'Stoppet'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleAgent}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              status?.isRunning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            {status?.isRunning ? (
              <>
                <Square className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-3">
          {[
            { id: 'health', label: 'Health', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'sources', label: 'Datakilder', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'nudges', label: 'Nudges', icon: <Lightbulb className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <>
            {/* Health Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <HealthCard
                icon={<Database className="w-4 h-4" />}
                label="Vector Store"
                status={status?.health.vectorStoreResponsive}
              />
              <HealthCard
                icon={<Wifi className="w-4 h-4" />}
                label="MCP Connected"
                status={status?.health.mcpConnected}
              />
              <HealthCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Data Flow"
                status={status?.health.dataflowOk}
              />
            </div>

            {/* Test Results Summary */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Test Resultater
                </h3>
                <span className={`text-2xl font-bold ${
                  passRate >= 80 ? 'text-green-400' : passRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {passRate}%
                </span>
              </div>

              <div className="space-y-2">
                {status?.recentTests.slice(-6).map((test, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      {test.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-xs text-white/80">{test.name}</span>
                    </div>
                    <span className="text-[10px] text-white/40">{test.duration}ms</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Ingestion */}
            {status?.health.lastIngestion && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Clock className="w-3 h-3" />
                Sidste data ingestion: {new Date(status.health.lastIngestion).toLocaleTimeString('da-DK')}
              </div>
            )}
          </>
        )}

        {/* Data Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Datakilder</h3>
              <span className="text-xs text-white/50">
                {activeSources}/{dataSources.length} aktive
              </span>
            </div>

            <div className="grid gap-2">
              {dataSources.map((source) => (
                <DataSourceCard key={source.id} source={source} />
              ))}
            </div>

            {/* Data Flow Summary */}
            <div className="mt-4 p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-white/10">
              <p className="text-xs text-white/60">
                <span className="text-cyan-400 font-medium">DataScheduler</span> kører automatisk:
              </p>
              <ul className="mt-2 space-y-1 text-[10px] text-white/50">
                <li>• Outlook emails: hvert 5. minut</li>
                <li>• Threat Intelligence: hvert 15. minut</li>
                <li>• Internal Leak Hunt: hvert 10. minut</li>
                <li>• News Monitor: hver time</li>
                <li>• System Heartbeat: hvert minut</li>
              </ul>
            </div>
          </div>
        )}

        {/* Nudges Tab */}
        {activeTab === 'nudges' && (
          <>
            {/* Latest Nudge */}
            {latestNudge && (
              <div className="bg-purple-500/10 rounded-xl border border-purple-500/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-medium text-purple-300">
                    Seneste Forbedringsnudge
                  </h3>
                </div>
                <p className="text-white font-medium mb-2">{latestNudge.area}</p>
                <ul className="space-y-1">
                  {latestNudge.suggestions.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-white/40 mt-2">
                  {latestNudge.remaining} områder tilbage i denne cyklus
                </p>
              </div>
            )}

            {/* Nudged Areas */}
            {status?.nudgedAreas && status.nudgedAreas.length > 0 && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Gennemgåede Områder
                </h3>
                <div className="flex flex-wrap gap-2">
                  {status.nudgedAreas.map((area) => (
                    <span
                      key={area}
                      className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-medium text-white mb-3">
                Forbedringsområder (30 min cyklus)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  'error-handling',
                  'loading-states',
                  'empty-states',
                  'data-freshness',
                  'connection-recovery',
                  'cache-optimization',
                  'api-retry-logic',
                  'user-feedback',
                  'accessibility',
                  'performance-monitoring'
                ].map((area) => (
                  <div
                    key={area}
                    className={`px-2 py-1.5 rounded ${
                      status?.nudgedAreas?.includes(area)
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper components
const HealthCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  status?: boolean;
}> = ({ icon, label, status }) => (
  <div className={`p-3 rounded-lg border ${
    status ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
  }`}>
    <div className="flex items-center gap-2 mb-1">
      <div className={status ? 'text-green-400' : 'text-red-400'}>{icon}</div>
      <span className="text-xs text-white/60">{label}</span>
    </div>
    <div className={`text-sm font-medium ${status ? 'text-green-400' : 'text-red-400'}`}>
      {status ? 'OK' : 'Fejl'}
    </div>
  </div>
);

const DataSourceCard: React.FC<{ source: DataSource }> = ({ source }) => {
  const statusColors = {
    active: 'bg-green-500/20 border-green-500/30 text-green-400',
    inactive: 'bg-white/5 border-white/10 text-white/40',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${statusColors[source.status]}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          source.status === 'active' ? 'bg-green-500/20' :
          source.status === 'error' ? 'bg-red-500/20' : 'bg-white/10'
        }`}>
          {source.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{source.name}</p>
          <p className="text-[10px] text-white/40">{source.type}</p>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xs font-medium ${
          source.status === 'active' ? 'text-green-400' :
          source.status === 'error' ? 'text-red-400' : 'text-white/40'
        }`}>
          {source.status === 'active' ? '● Online' :
           source.status === 'error' ? '● Error' : '○ Offline'}
        </div>
        {source.lastSync && (
          <p className="text-[10px] text-white/30">
            {new Date(source.lastSync).toLocaleTimeString('da-DK')}
          </p>
        )}
      </div>
    </div>
  );
};

export default HansPedderMonitorWidget;
