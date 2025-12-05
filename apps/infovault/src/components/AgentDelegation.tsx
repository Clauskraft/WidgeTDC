import React, { useState, useEffect } from 'react';
import { InfoItem, AgentCapability, AgentTask } from '../types';
import { widgetTDCClient } from '../services/widgetTDCClient';

interface AgentDelegationProps {
  onDelegate: (task: { description: string; agent: string }) => void;
  onClose: () => void;
  agents: string[];
  selectedItem: InfoItem | null;
  theme: 'dark' | 'light';
}

// Agent capabilities and descriptions
const agentProfiles: Record<string, {
  name: string;
  icon: string;
  description: string;
  capabilities: string[];
  color: string;
}> = {
  claude: {
    name: 'Claude',
    icon: '🧠',
    description: 'Avanceret reasoning og kompleks analyse',
    capabilities: ['analyse', 'research', 'summarize', 'code-review', 'planning'],
    color: 'purple',
  },
  gemini: {
    name: 'Gemini',
    icon: '💫',
    description: 'Multimodal forståelse og web-søgning',
    capabilities: ['web-search', 'image-analysis', 'translation', 'fact-check'],
    color: 'blue',
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '🚀',
    description: 'Hurtig og effektiv kodning og teknisk hjælp',
    capabilities: ['coding', 'debugging', 'documentation', 'refactoring'],
    color: 'amber',
  },
  clak: {
    name: 'CLAK Agent',
    icon: '🔧',
    description: 'Lokal automatisering og system-integration',
    capabilities: ['automation', 'file-ops', 'system-tasks', 'monitoring'],
    color: 'emerald',
  },
  security: {
    name: 'Security Agent',
    icon: '🔒',
    description: 'Sikkerhedsanalyse og vulnerability scanning',
    capabilities: ['vuln-scan', 'security-audit', 'threat-analysis', 'compliance'],
    color: 'red',
  },
};

// Predefined task templates
const taskTemplates = [
  { id: 'analyze', label: 'Analyser indhold', icon: '🔍', agent: 'claude' },
  { id: 'summarize', label: 'Opsummer tekst', icon: '📝', agent: 'claude' },
  { id: 'research', label: 'Research emne', icon: '🌐', agent: 'gemini' },
  { id: 'code-review', label: 'Code review', icon: '👨‍💻', agent: 'deepseek' },
  { id: 'translate', label: 'Oversæt', icon: '🌍', agent: 'gemini' },
  { id: 'security-scan', label: 'Sikkerhedscheck', icon: '🛡️', agent: 'security' },
  { id: 'automate', label: 'Automatiser', icon: '⚙️', agent: 'clak' },
  { id: 'document', label: 'Dokumenter', icon: '📄', agent: 'deepseek' },
];

export function AgentDelegation({ onDelegate, onClose, agents, selectedItem, theme }: AgentDelegationProps) {
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>(agents[0] || 'claude');
  const [recentTasks, setRecentTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<AgentCapability[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [channel, setChannel] = useState<string>('default');

  const cardClasses = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClasses = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300';

  // Load capabilities and recent tasks
  useEffect(() => {
    loadCapabilities();
    loadRecentTasks();
  }, []);

  const loadCapabilities = async () => {
    try {
      const caps = await widgetTDCClient.getAgentCapabilities();
      setCapabilities(caps);
    } catch (error) {
      console.error('Failed to load capabilities:', error);
    }
  };

  const loadRecentTasks = async () => {
    try {
      const tasks = await widgetTDCClient.getRecentTasks();
      setRecentTasks(tasks);
    } catch (error) {
      console.error('Failed to load recent tasks:', error);
    }
  };

  // Auto-suggest agent based on task
  const suggestAgent = (description: string): string => {
    const lower = description.toLowerCase();
    if (lower.includes('code') || lower.includes('debug') || lower.includes('program')) return 'deepseek';
    if (lower.includes('search') || lower.includes('find') || lower.includes('lookup')) return 'gemini';
    if (lower.includes('security') || lower.includes('scan') || lower.includes('vulnerability')) return 'security';
    if (lower.includes('automate') || lower.includes('script') || lower.includes('file')) return 'clak';
    return 'claude';
  };

  // Handle template click
  const applyTemplate = (template: typeof taskTemplates[0]) => {
    let description = template.label;
    if (selectedItem) {
      description = `${template.label}: "${selectedItem.title}"`;
    }
    setTaskDescription(description);
    setSelectedAgent(template.agent);
  };

  // Submit task
  const handleSubmit = async () => {
    if (!taskDescription.trim()) return;

    setIsLoading(true);
    try {
      await widgetTDCClient.routeTask(taskDescription, selectedAgent, {
        priority,
        channel,
        context: selectedItem ? {
          itemId: selectedItem.id,
          itemType: selectedItem.type,
          itemTitle: selectedItem.title,
          itemContent: selectedItem.content,
        } : undefined,
      });

      onDelegate({ description: taskDescription, agent: selectedAgent });
      setTaskDescription('');
      loadRecentTasks();
    } catch (error) {
      console.error('Failed to delegate task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get agent profile
  const getAgentProfile = (agentId: string) => {
    return agentProfiles[agentId] || {
      name: agentId,
      icon: '🤖',
      description: 'Custom agent',
      capabilities: [],
      color: 'gray',
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${cardClasses} rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <h2 className="text-xl font-bold">Agent Delegation</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Context from selected item */}
          {selectedItem && (
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-cyan-900/30 border-cyan-800' : 'bg-cyan-50 border-cyan-200'} border`}>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">📎</span>
                <span className="font-medium">Kontekst: {selectedItem.title}</span>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{selectedItem.type}</span>
              </div>
            </div>
          )}

          {/* Quick templates */}
          <div>
            <label className="block text-sm font-medium mb-2">Hurtige opgaver</label>
            <div className="grid grid-cols-4 gap-2">
              {taskTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`p-3 rounded-lg ${inputClasses} border hover:border-cyan-500 text-center transition-colors`}
                >
                  <span className="text-xl block mb-1">{template.icon}</span>
                  <span className="text-xs">{template.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Task description */}
          <div>
            <label className="block text-sm font-medium mb-2">Opgavebeskrivelse</label>
            <textarea
              value={taskDescription}
              onChange={(e) => {
                setTaskDescription(e.target.value);
                const suggested = suggestAgent(e.target.value);
                if (suggested !== selectedAgent) {
                  setSelectedAgent(suggested);
                }
              }}
              placeholder="Beskriv hvad agenten skal gøre..."
              className={`w-full h-24 p-3 rounded-lg ${inputClasses} border resize-none focus:ring-2 focus:ring-cyan-500 outline-none`}
            />
          </div>

          {/* Agent selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Vælg Agent</label>
            <div className="grid grid-cols-2 gap-3">
              {agents.map(agentId => {
                const profile = getAgentProfile(agentId);
                const isSelected = selectedAgent === agentId;
                return (
                  <button
                    key={agentId}
                    onClick={() => setSelectedAgent(agentId)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? `border-${profile.color}-500 bg-${profile.color}-900/30` 
                        : `${inputClasses} hover:border-gray-500`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{profile.icon}</span>
                      <div>
                        <div className="font-semibold">{profile.name}</div>
                        <div className="text-xs text-gray-400">{profile.description}</div>
                      </div>
                      {isSelected && (
                        <span className="ml-auto text-cyan-400">✓</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.capabilities.slice(0, 3).map(cap => (
                        <span key={cap} className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1"
            >
              {showAdvanced ? '▼' : '▶'} Avancerede indstillinger
            </button>
            
            {showAdvanced && (
              <div className="mt-3 p-4 bg-gray-900 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Prioritet</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as typeof priority)}
                      className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                    >
                      <option value="low">🟢 Lav</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="high">🔴 Høj</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Kanal</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                    >
                      <option value="default">Standard</option>
                      <option value="research">Research</option>
                      <option value="development">Development</option>
                      <option value="security">Security</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent tasks */}
          {recentTasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Seneste opgaver</label>
              <div className="space-y-2 max-h-32 overflow-auto">
                {recentTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className={`p-2 rounded-lg ${inputClasses} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-yellow-500' :
                        task.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm truncate max-w-[300px]">{task.description}</span>
                    </div>
                    <span className="text-xs text-gray-500">{task.assignedAgent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Annuller
          </button>
          <button
            onClick={handleSubmit}
            disabled={!taskDescription.trim() || isLoading}
            className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Sender...
              </>
            ) : (
              <>
                🚀 Send til {getAgentProfile(selectedAgent).name}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
