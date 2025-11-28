// HansPedder Monitor Widget
// Real-time view of autonomous agent testing and improvement nudges

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

export const HansPedderMonitorWidget: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [latestNudge, setLatestNudge] = useState<Nudge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const interval = setInterval(fetchStatus, 10000);

    const ws = new WebSocket('ws://localhost:3001/mcp/ws');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'hanspedder:test-results') {
          fetchStatus();
        } else if (data.type === 'hanspedder:nudge') {
          setLatestNudge(data.payload);
        }
      } catch {}
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

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

  return (
    <div className="w-full h-full bg-slate-950 overflow-auto">
      <header className="sticky top-0 z-10 px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            status?.isRunning ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <Activity className={`w-5 h-5 ${status?.isRunning ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">HansPedder Agent</h2>
            <p className="text-xs text-white/50">
              {status?.isRunning ? 'Kører kontinuerligt' : 'Stoppet'}
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
      </header>

      <div className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

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

        {status?.health.lastIngestion && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            Sidste data ingestion: {new Date(status.health.lastIngestion).toLocaleTimeString('da-DK')}
          </div>
        )}
      </div>
    </div>
  );
};

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

export default HansPedderMonitorWidget;
