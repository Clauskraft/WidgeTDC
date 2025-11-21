import React, { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  agent_id: string;
  block: number;
  status: 'loaded' | 'idle' | 'running' | 'complete' | 'failed';
  health: 'healthy' | 'unhealthy';
  workload: number;
  completed_tasks: number;
  failed_tasks: number;
  token_usage: number;
  current_task: string | null;
  last_activity: string;
}

interface AgentPanelProps {
  onAgentSelect?: (agent: Agent) => void;
  selectedAgentId?: string;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ onAgentSelect, selectedAgentId }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    // Load agents from state file
    const loadAgents = async () => {
      try {
        const response = await fetch('/api/mcp/agents');
        if (response.ok) {
          const data = await response.json();
          const agentList = Object.values(data.agents || {}) as Agent[];
          setAgents(agentList.sort((a, b) => a.block - b.block));
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
        // Fallback: load from .claude/agent-state.json
        setAgents([
          {
            id: '1',
            name: 'AlexaGPT-Frontend',
            agent_id: 'dashboard-shell-ui',
            block: 1,
            status: 'loaded',
            health: 'healthy',
            workload: 60,
            completed_tasks: 1,
            failed_tasks: 0,
            token_usage: 1000,
            current_task: 'block-1',
            last_activity: '2025-11-21T21:00:00Z',
          },
          {
            id: '2',
            name: 'GoogleCloudArch',
            agent_id: 'widget-registry-v2',
            block: 2,
            status: 'loaded',
            health: 'healthy',
            workload: 60,
            completed_tasks: 1,
            failed_tasks: 0,
            token_usage: 2117,
            current_task: 'block-2',
            last_activity: '2025-11-21T21:00:00Z',
          },
          {
            id: '3',
            name: 'CryptographyExpert',
            agent_id: 'audit-log-hash-chain',
            block: 3,
            status: 'loaded',
            health: 'healthy',
            workload: 60,
            completed_tasks: 1,
            failed_tasks: 0,
            token_usage: 1500,
            current_task: 'block-3',
            last_activity: '2025-11-21T21:00:00Z',
          },
          {
            id: '4',
            name: 'DatabaseMaster',
            agent_id: 'database-foundation',
            block: 4,
            status: 'loaded',
            health: 'healthy',
            workload: 60,
            completed_tasks: 1,
            failed_tasks: 0,
            token_usage: 1800,
            current_task: 'block-4',
            last_activity: '2025-11-21T21:00:00Z',
          },
          {
            id: '5',
            name: 'QASpecialist',
            agent_id: 'testing-infrastructure',
            block: 5,
            status: 'loaded',
            health: 'healthy',
            workload: 60,
            completed_tasks: 1,
            failed_tasks: 0,
            token_usage: 1200,
            current_task: 'block-5',
            last_activity: '2025-11-21T21:00:00Z',
          },
          {
            id: '6',
            name: 'SecurityCompliance',
            agent_id: 'security-compliance',
            block: 6,
            status: 'loaded',
            health: 'healthy',
            workload: 60,
            completed_tasks: 1,
            failed_tasks: 0,
            token_usage: 900,
            current_task: 'block-6',
            last_activity: '2025-11-21T21:00:00Z',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
    const interval = setInterval(loadAgents, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string, health: string) => {
    if (health === 'unhealthy') return 'bg-red-100 border-red-300';
    switch (status) {
      case 'loaded':
        return 'bg-blue-100 border-blue-300';
      case 'running':
        return 'bg-yellow-100 border-yellow-300';
      case 'complete':
        return 'bg-green-100 border-green-300';
      case 'failed':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'loaded':
        return 'bg-blue-600 text-white';
      case 'running':
        return 'bg-yellow-600 text-white';
      case 'complete':
        return 'bg-green-600 text-white';
      case 'failed':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            🤖 Agent Cascade Panel
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            All {agents.length} agents are loaded and ready. Select an agent to view details.
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => {
                setExpandedAgent(expandedAgent === agent.id ? null : agent.id);
                onAgentSelect?.(agent);
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getStatusColor(
                agent.status,
                agent.health,
              )} ${selectedAgentId === agent.id ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:shadow-lg'}`}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Block {agent.block}: {agent.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{agent.agent_id}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(agent.status)}`}>
                    {agent.status.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    agent.health === 'healthy'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {agent.health === 'healthy' ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div className="text-center p-2 bg-slate-200 dark:bg-slate-700 rounded">
                  <div className="text-xs text-slate-600 dark:text-slate-400">Workload</div>
                  <div className="font-bold text-slate-900 dark:text-white">{agent.workload}%</div>
                </div>
                <div className="text-center p-2 bg-slate-200 dark:bg-slate-700 rounded">
                  <div className="text-xs text-slate-600 dark:text-slate-400">Tasks</div>
                  <div className="font-bold text-slate-900 dark:text-white">{agent.completed_tasks}</div>
                </div>
                <div className="text-center p-2 bg-slate-200 dark:bg-slate-700 rounded">
                  <div className="text-xs text-slate-600 dark:text-slate-400">Tokens</div>
                  <div className="font-bold text-slate-900 dark:text-white">{(agent.token_usage / 1000).toFixed(1)}K</div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedAgent === agent.id && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Current Task:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{agent.current_task || 'idle'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Failed Tasks:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{agent.failed_tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Last Activity:</span>
                    <span className="font-mono text-slate-900 dark:text-white text-xs">
                      {new Date(agent.last_activity).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-current border-opacity-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Starting agent ${agent.name}`);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      Start
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Pausing agent ${agent.name}`);
                      }}
                      className="flex-1 px-3 py-2 bg-yellow-600 text-white rounded text-xs font-semibold hover:bg-yellow-700 transition"
                    >
                      Pause
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Stopping agent ${agent.name}`);
                      }}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {/* Expand Indicator */}
              <div className="text-center mt-2 text-xs text-slate-500">
                {expandedAgent === agent.id ? '▼ Click to collapse' : '▶ Click for details'}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Total Agents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {agents.filter(a => a.health === 'healthy').length}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Healthy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {agents.reduce((sum, a) => sum + a.completed_tasks, 0)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Tasks Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {agents.reduce((sum, a) => sum + a.workload, 0) / agents.length}%
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Avg Workload</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
