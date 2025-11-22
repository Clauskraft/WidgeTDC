import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, AlertTriangle, CheckCircle, RefreshCw, Settings, Shield } from 'lucide-react';

interface AgentStatus {
  agent_id: string;
  name: string;
  block: number;
  status: 'idle' | 'loaded' | 'overloaded';
  workload: number;
  health: 'healthy' | 'unhealthy';
  completed_tasks: number;
  failed_tasks: number;
  token_usage: number;
}

interface RuntimeAgents {
  timestamp: string;
  cascade_active: boolean;
  agents: Record<string, AgentStatus>;
  summary: {
    total_agents: number;
    idle_agents: number;
    loaded_agents: number;
    overloaded_agents: number;
    unhealthy_agents: number;
    total_workload: number;
    avg_workload: number;
    max_workload: number;
  };
  thresholds: {
    idle: number;
    loaded: number;
    overloaded: number;
    unhealthy: number;
  };
}

const AgentStatusDashboardWidget: React.FC<{ widgetId: string }> = () => {
  const [agentState, setAgentState] = useState<RuntimeAgents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAgentState = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/agent-state');
      if (response.ok) {
        const data = await response.json();
        setAgentState(data.runtime_agents || data);
        setError(null);
      } else {
        throw new Error('Failed to fetch agent state');
      }
    } catch (err) {
      console.warn('Could not fetch agent state:', err);
      setError('Connection to Agent Grid lost. Retrying...');
      // Fallback mock data for demo if backend is down
      // setAgentState(MOCK_DATA); 
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchAgentState();
    const interval = setInterval(fetchAgentState, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !agentState) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="spinner-gradient mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Initializing Agent Grid</h3>
        <p className="text-sm text-slate-500">Establishing secure connection to MCP...</p>
      </div>
    );
  }

  if (error && !agentState) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Connection Error</h3>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button
          onClick={fetchAgentState}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const summary = agentState?.summary;
  if (!summary) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
      {/* KPI Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-200 dark:border-white/5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Server size={12} /> TOTAL AGENTS
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{summary.total_agents}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Cpu size={12} /> AVG LOAD
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{summary.avg_workload.toFixed(0)}%</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Activity size={12} /> ACTIVE
          </div>
          <div className="text-2xl font-bold text-emerald-500">{summary.loaded_agents + summary.overloaded_agents}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Shield size={12} /> HEALTH
          </div>
          <div className={`text-2xl font-bold ${summary.unhealthy_agents > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {summary.unhealthy_agents > 0 ? 'CRITICAL' : 'OPTIMAL'}
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {agentState?.agents && Object.values(agentState.agents)
          .sort((a, b) => b.workload - a.workload)
          .map((agent) => (
            <div
              key={agent.agent_id}
              className="group relative bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:shadow-md transition-all duration-300 hover:border-primary/30"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    {agent.name}
                    {agent.health === 'healthy' ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={14} className="text-red-500" />
                    )}
                  </h4>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {agent.agent_id.substring(0, 8)}</div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold ${agent.workload > 80 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    agent.workload > 50 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                  {agent.workload}% LOAD
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${agent.workload > 80 ? 'bg-red-500' :
                      agent.workload > 50 ? 'bg-amber-500' :
                        'bg-emerald-500'
                    }`}
                  style={{ width: `${agent.workload}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex gap-4">
                  <span>Tasks: <span className="font-medium text-slate-700 dark:text-slate-300">{agent.completed_tasks}</span></span>
                  <span>Tokens: <span className="font-medium text-slate-700 dark:text-slate-300">{(agent.token_usage / 1000).toFixed(1)}k</span></span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-primary hover:underline">View Logs</button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-200 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="text-xs text-slate-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
        <button
          onClick={fetchAgentState}
          disabled={isRefreshing}
          className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={14} className="text-slate-500" />
        </button>
      </div>
    </div>
  );
};

export default AgentStatusDashboardWidget;
