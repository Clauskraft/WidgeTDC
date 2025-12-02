import React, { useState, useEffect } from 'react';
import { MatrixWidgetWrapper } from '../../src/components/MatrixWidgetWrapper';
import {
  Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Play, Square, Database, Wifi, TrendingUp, Clock, Mail, Globe,
  HardDrive, History, BookOpen, Server, Rss, PieChart
} from 'lucide-react';

// ... (Keep interfaces from previous code)
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

const HansPedderMonitorWidget: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified mock for demo
  const fetchStatus = async () => {
    setLoading(true);
    try {
       await new Promise(r => setTimeout(r, 1000));
       setStatus({
           isRunning: true,
           health: {
               dataflowOk: true, apiLatency: 45, wsConnections: 12,
               lastIngestion: new Date().toISOString(), vectorStoreResponsive: true, mcpConnected: true
           },
           recentTests: [
               { name: 'Email Ingestion', passed: true, duration: 120, timestamp: new Date().toISOString() },
               { name: 'Vector Embed', passed: true, duration: 450, timestamp: new Date().toISOString() },
               { name: 'Reasoning Loop', passed: false, duration: 2000, timestamp: new Date().toISOString(), error: 'Timeout' }
           ],
           nudgedAreas: ['Cache', 'API Retry'],
           nextNudgeIn: '15m'
       });
    } catch (e) { setError('Connection failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  return (
    <MatrixWidgetWrapper 
        title="HansPedder Agent"
        isLoading={loading && !status}
        controls={
            <button onClick={fetchStatus} className="hover:text-[#00B5CB] transition-colors">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
        }
    >
      <div className="flex flex-col gap-4 h-full">
        {/* Status Header */}
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status?.isRunning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <Activity size={18} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-white uppercase">Agent Status</h4>
                    <p className="text-[10px] text-gray-400">{status?.isRunning ? 'ACTIVE • MONITORING' : 'STOPPED'}</p>
                </div>
            </div>
            <button className={`px-3 py-1 rounded text-[10px] font-bold uppercase border transition-colors ${
                status?.isRunning 
                ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
            }`}>
                {status?.isRunning ? 'STOP' : 'START'}
            </button>
        </div>

        {/* Health Grid */}
        <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded-lg border text-center ${status?.health.vectorStoreResponsive ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <Database size={14} className={`mx-auto mb-1 ${status?.health.vectorStoreResponsive ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-[9px] text-gray-300">Vector DB</span>
            </div>
            <div className={`p-2 rounded-lg border text-center ${status?.health.mcpConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <Server size={14} className={`mx-auto mb-1 ${status?.health.mcpConnected ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-[9px] text-gray-300">MCP Link</span>
            </div>
            <div className={`p-2 rounded-lg border text-center ${status?.health.dataflowOk ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <TrendingUp size={14} className={`mx-auto mb-1 ${status?.health.dataflowOk ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-[9px] text-gray-300">Data Flow</span>
            </div>
        </div>

        {/* Recent Tests */}
        <div className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 overflow-hidden flex flex-col">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Self-Test Results</h4>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {status?.recentTests.map((test, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5">
                        <div className="flex items-center gap-2">
                            {test.passed ? <CheckCircle size={12} className="text-green-400"/> : <XCircle size={12} className="text-red-400"/>}
                            <span className="text-xs text-gray-300">{test.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">{test.duration}ms</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default HansPedderMonitorWidget;
