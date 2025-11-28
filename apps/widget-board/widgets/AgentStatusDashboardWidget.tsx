import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, AlertTriangle, CheckCircle, RefreshCw, Shield, Globe, Mail, FileText } from 'lucide-react';
import { useMCP } from '../src/hooks/useMCP';

interface AgentStatus {
  id: string;
  name: string;
  type: 'ingestion' | 'analysis' | 'maintenance';
  status: 'idle' | 'running' | 'error';
  lastRun: string;
  itemsProcessed: number;
}

const AgentStatusDashboardWidget: React.FC<{ widgetId: string }> = () => {
  const { send } = useMCP();
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Fetch ingestion status as proxy for agent health
      const response = await send('agent-orchestrator', 'ingestion.status', {});
      
      if (response && response.success) {
        // Transform ingestion stats to agent status
        const newAgents: AgentStatus[] = [
          {
            id: 'email-reader',
            name: 'Email Ingestor',
            type: 'ingestion',
            status: 'running',
            lastRun: new Date().toISOString(),
            itemsProcessed: response.sources?.emails || 0
          },
          {
            id: 'news-monitor',
            name: 'News Monitor',
            type: 'ingestion',
            status: 'running',
            lastRun: new Date().toISOString(),
            itemsProcessed: response.sources?.news || 0
          },
          {
            id: 'threat-hunter',
            name: 'Threat Hunter',
            type: 'analysis',
            status: 'idle',
            lastRun: new Date().toISOString(),
            itemsProcessed: 0 // TODO: Get threat count
          },
          {
            id: 'wiki-librarian',
            name: 'Wiki Librarian',
            type: 'maintenance',
            status: 'idle',
            lastRun: new Date().toISOString(),
            itemsProcessed: response.totalDocuments || 0
          }
        ];
        setAgents(newAgents);
        setError(null);
      }
    } catch (err) {
      console.warn('Agent status failed:', err);
      setError('Kunne ikke forbinde til Agent Grid');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'ingestion': return <Globe size={16} className="text-blue-400" />;
      case 'analysis': return <Shield size={16} className="text-red-400" />;
      case 'maintenance': return <FileText size={16} className="text-green-400" />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <div className="h-full flex flex-col -m-4" data-testid="agent-status-widget">
      <div className="p-4 border-b border-white/10 bg-[#0B3E6F]/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-[#00B5CB]" />
          <div>
            <h3 className="text-lg font-semibold text-white">Agent Status</h3>
            <p className="text-xs text-gray-400">Active Autonomous Agents</p>
          </div>
        </div>
        <button 
          onClick={fetchStatus}
          disabled={loading}
          className={`p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {error ? (
          <div className="text-center py-8 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
            <AlertTriangle className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="bg-[#0B3E6F]/20 border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:border-[#00B5CB]/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/20 rounded-lg">
                  {getIcon(agent.type)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-200 text-sm">{agent.name}</h4>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Activity size={8} /> {agent.status.toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-bold text-white">{agent.itemsProcessed}</p>
                <p className="text-[10px] text-gray-500">items</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentStatusDashboardWidget;
