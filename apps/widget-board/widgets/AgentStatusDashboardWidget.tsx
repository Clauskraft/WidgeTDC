import React, { useState, useEffect } from 'react';

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
  const [updateTime, setUpdateTime] = useState<Date>(new Date());

  useEffect(() => {
    const fetchAgentState = async () => {
      try {
        // Try to fetch from API endpoint first
        const response = await fetch('/api/agent-state');
        if (response.ok) {
          const data = await response.json();
          setAgentState(data.runtime_agents || data);
        }
      } catch (error) {
        console.warn('Could not fetch agent state via API, attempting local read:', error);
      }
      setLoading(false);
      setUpdateTime(new Date());
    };

    // Initial fetch
    fetchAgentState();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchAgentState, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !agentState) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            Agent Dashboard
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Loading agent state...
          </div>
        </div>
      </div>
    );
  }

  const summary = agentState.summary;
  const thresholds = agentState.thresholds;

  // Determine cascade health
  const cascadeHealth =
    summary.unhealthy_agents > 0
      ? 'unhealthy'
      : summary.overloaded_agents > 0
        ? 'warning'
        : 'healthy';

  const healthColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
  };

  const statusBadgeColor = (workload: number, health: string) => {
    if (health === 'unhealthy') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (workload >= thresholds.overloaded) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (workload >= thresholds.loaded) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getWorkloadLabel = (workload: number): string => {
    if (workload >= thresholds.overloaded) return 'OVERLOADED';
    if (workload >= thresholds.loaded) return 'LOADED';
    return 'IDLE';
  };

  return (
    <div className="h-full flex flex-col -m-4 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Status Dashboard</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${healthColors[cascadeHealth]} animate-pulse`}></div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {cascadeHealth.toUpperCase()} - {updateTime.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.idle_agents}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Idle</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.loaded_agents}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Loaded</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.overloaded_agents}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Overloaded</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.avg_workload.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Load</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.unhealthy_agents}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Unhealthy</div>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(Object.values(agentState.agents) as AgentStatus[])
          .sort((a, b) => a.block - b.block)
          .map((agent) => (
            <div
              key={agent.block}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {/* Agent Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Block {agent.block}: {agent.name}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadgeColor(agent.workload, agent.health)}`}>
                    {getWorkloadLabel(agent.workload)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{agent.workload}% load</div>
              </div>

              {/* Workload Bar */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${agent.workload >= thresholds.overloaded
                      ? 'bg-red-500'
                      : agent.workload >= thresholds.loaded
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  style={{ width: `${agent.workload}%` }}
                ></div>
              </div>

              {/* Agent Stats */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">{agent.completed_tasks}</div>
                  <div className="text-gray-500 dark:text-gray-400">Completed</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">{agent.failed_tasks}</div>
                  <div className="text-gray-500 dark:text-gray-400">Failed</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">{agent.token_usage}</div>
                  <div className="text-gray-500 dark:text-gray-400">Tokens</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded">
                  <div className={`font-semibold ${agent.health === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {agent.health === 'healthy' ? 'OK' : 'BAD'}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Health</div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Cascade: {agentState.cascade_active ? 'RUNNING' : 'IDLE'}</span>
          <span>Last update: {updateTime.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AgentStatusDashboardWidget;
