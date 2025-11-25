import React, { useState, useEffect } from 'react';
import TaskBacklogModal from './TaskBacklogModal';

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
  const [backlogAgent, setBacklogAgent] = useState<Agent | null>(null);

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
    if (health === 'unhealthy') return 'border-red-500/50 bg-red-500/10';
    switch (status) {
      case 'loaded':
        return 'border-[#00B5CB]/30 bg-[#00B5CB]/10';
      case 'running':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'complete':
        return 'border-green-500/50 bg-green-500/10';
      case 'failed':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'loaded':
        return 'bg-[#00B5CB]/20 text-[#00B5CB]';
      case 'running':
        return 'bg-yellow-500/20 text-yellow-500 animate-pulse';
      case 'complete':
        return 'bg-green-500/20 text-green-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-white/50">
        <div className="w-8 h-8 border-2 border-[#00B5CB] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="animate-pulse font-light">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0B3E6F]/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-white/10 bg-gradient-to-r from-[#00B5CB]/10 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-[#00B5CB] animate-pulse shadow-[0_0_10px_#00B5CB]" />
            <h2 className="text-2xl font-light text-white tracking-wide">
              Agent <span className="font-bold text-[#00B5CB]">Cascade Panel</span>
            </h2>
          </div>
          <p className="text-sm text-gray-400 font-light ml-6">
            All {agents.length} autonomous agents are active and monitoring.
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
          {agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => {
                setExpandedAgent(expandedAgent === agent.id ? null : agent.id);
                onAgentSelect?.(agent);
              }}
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${getStatusColor(
                agent.status,
                agent.health,
              )} ${selectedAgentId === agent.id ? 'ring-1 ring-[#00B5CB] shadow-[0_0_20px_rgba(0,181,203,0.2)]' : 'hover:bg-white/10 hover:border-white/20'}`}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div>
                  <h3 className="font-medium text-lg text-white group-hover:text-[#00B5CB] transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-mono mt-1">Block {agent.block} • {agent.agent_id}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/5 ${getStatusBadgeColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-sm mb-4 relative z-10">
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Load</div>
                  <div className="font-mono text-[#00B5CB]">{agent.workload}%</div>
                </div>
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tasks</div>
                  <div className="font-mono text-white">{agent.completed_tasks}</div>
                </div>
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tokens</div>
                  <div className="font-mono text-purple-400">{(agent.token_usage / 1000).toFixed(1)}k</div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedAgent === agent.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-sm relative z-10 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Current Task</span>
                    <span className="font-mono text-white text-xs bg-white/5 px-2 py-1 rounded">{agent.current_task || 'idle'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Last Activity</span>
                    <span className="font-mono text-gray-300 text-xs">
                      {new Date(agent.last_activity).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Starting agent ${agent.name}`);
                      }}
                      className="px-3 py-2 bg-[#00B5CB]/20 hover:bg-[#00B5CB]/30 text-[#00B5CB] border border-[#00B5CB]/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      Start Agent
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBacklogAgent(agent);
                      }}
                      className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      View Backlog
                    </button>
                  </div>
                </div>
              )}

              {/* Expand Indicator */}
              <div className="text-center mt-2">
                <div className={`w-full h-0.5 rounded-full transition-all duration-300 ${expandedAgent === agent.id ? 'bg-[#00B5CB]/50' : 'bg-white/5 group-hover:bg-white/10'}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-md">
          <div className="grid grid-cols-4 gap-4 text-center divide-x divide-white/10">
            <div>
              <div className="text-2xl font-light text-white">{agents.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Total Agents</div>
            </div>
            <div>
              <div className="text-2xl font-light text-[#00B5CB]">
                {agents.filter(a => a.health === 'healthy').length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Healthy</div>
            </div>
            <div>
              <div className="text-2xl font-light text-yellow-500">
                {agents.reduce((sum, a) => sum + a.completed_tasks, 0)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Tasks Done</div>
            </div>
            <div>
              <div className="text-2xl font-light text-purple-400">
                {Math.round(agents.reduce((sum, a) => sum + a.workload, 0) / agents.length)}%
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Avg Load</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Backlog Modal */}
      {backlogAgent && (
        <TaskBacklogModal
          isOpen={!!backlogAgent}
          onClose={() => setBacklogAgent(null)}
          agentName={backlogAgent.name}
          agentId={backlogAgent.agent_id}
          completedTasks={backlogAgent.completed_tasks}
          failedTasks={backlogAgent.failed_tasks}
        />
      )}
    </div>
  );
};

export default AgentPanel;
