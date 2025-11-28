import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import type { ToolSuggestion, ToolStatus, Agent } from '../types';
import { Button } from '../components/ui/Button';
import { useWidgetSync } from '../src/hooks/useWidgetSync';
import { Bot, Wrench, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const ALL_TOOLS: Omit<ToolSuggestion, 'status'>[] = [
    { name: 'calculator', description: 'Matematiske beregninger.', category: 'Beregning' },
    { name: 'public_search', description: 'Søgning i offentlige kilder.', category: 'Søgning' },
    { name: 'private_search', description: 'Søgning i interne kilder.', category: 'Søgning' },
    { name: 'gdpr_analyzer', description: 'GDPR compliance analyse.', category: 'Compliance' },
    { name: 'code_interpreter', description: 'Kør Python kode sikkert.', category: 'Udvikling' },
    { name: 'email_sender', description: 'Send emails via Outlook.', category: 'Kommunikation' },
];

const AgentBuilderWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const [agentName, setAgentName] = useState('');
  const [instruction, setInstruction] = useState('');
  const debouncedInstruction = useDebounce(instruction, 500);
  const [tools, setTools] = useState<ToolSuggestion[]>(ALL_TOOLS.map(t => ({...t, status: 'optional'})));
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [createdAgents, setCreatedAgents] = useState<Agent[]>([]);
  const [isListVisible, setIsListVisible] = useState(true);

  // Sync state to brain
  useWidgetSync(widgetId, {
    agentCount: createdAgents.length,
    lastAgent: createdAgents[createdAgents.length - 1]?.name,
    draftName: agentName
  });

  useEffect(() => {
    async function fetchSuggestions() {
      if (!debouncedInstruction.trim()) {
        setTools(ALL_TOOLS.map(t => ({...t, status: 'optional'})));
        return;
      }
      setIsLoading(true);
      try {
        // Simple heuristic logic instead of mock API
        const newTools = ALL_TOOLS.map((tool): ToolSuggestion => {
            let status: ToolStatus = 'optional';
            const instr = debouncedInstruction.toLowerCase();
            
            if (instr.includes('beregn') && tool.name === 'calculator') status = 'recommended';
            if (instr.includes('søg') && tool.name === 'public_search') status = 'recommended';
            if (instr.includes('privat') || instr.includes('intern')) {
                if (tool.name === 'private_search') status = 'mandatory';
                if (tool.name === 'public_search') status = 'excluded';
            }
            if (instr.includes('gdpr') && tool.name === 'gdpr_analyzer') status = 'mandatory';
            if (instr.includes('kode') && tool.name === 'code_interpreter') status = 'recommended';
            if (instr.includes('email') && tool.name === 'email_sender') status = 'recommended';

            return {...tool, status};
        });
        setTools(newTools);

        const mandatory = newTools.filter(t => t.status === 'mandatory').map(t => t.name);
        setSelectedTools(prev => {
            const newSet = new Set([...prev, ...mandatory]);
            const excluded = newTools.filter(t => t.status === 'excluded').map(t => t.name);
            excluded.forEach(toolName => newSet.delete(toolName));
            return newSet;
        });

      } catch (error) {
        console.error("Tool suggestion failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSuggestions();
  }, [debouncedInstruction]);

  const handleCreateAgent = () => {
      const newAgent: Agent = {
          id: `agent-${Date.now()}`,
          name: agentName,
          instruction: instruction,
          tools: Array.from(selectedTools)
      };
      setCreatedAgents(prev => [...prev, newAgent]);
      // Reset form
      setAgentName('');
      setInstruction('');
      setSelectedTools(new Set());
  };

  const handleToolToggle = (toolName: string) => {
    const tool = tools.find(t => t.name === toolName);
    if (!tool || tool.status === 'mandatory' || tool.status === 'excluded') return;
    
    setSelectedTools(prev => {
        const newSet = new Set(prev);
        if (newSet.has(toolName)) {
            newSet.delete(toolName);
        } else {
            newSet.add(toolName);
        }
        return newSet;
    });
  };
  
  const getStatusClasses = (status: ToolStatus) => ({
      'mandatory': 'border-red-500/50 bg-red-500/10',
      'recommended': 'border-blue-500/50 bg-blue-500/10',
      'excluded': 'opacity-30 cursor-not-allowed',
      'optional': 'border-white/10 hover:border-white/20'
  }[status]);
  
  const getStatusBadgeClasses = (status: ToolStatus) => ({
      'mandatory': 'bg-red-500/20 text-red-300',
      'recommended': 'bg-blue-500/20 text-blue-300',
      'excluded': 'bg-gray-500/20 text-gray-400',
      'optional': 'bg-white/10 text-gray-400'
  }[status]);

  const getStatusText = (status: ToolStatus) => ({
      'mandatory': 'Krævet',
      'recommended': 'Anbefalet',
      'excluded': 'Ekskluderet',
      'optional': 'Valgfri'
  }[status]);

  return (
    <div className="h-full flex flex-col -m-4" data-testid="agent-builder-widget">
        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <Bot size={20} className="text-[#00B5CB]" />
                <h3 className="text-lg font-semibold text-white">Agent Builder</h3>
            </div>

            {/* Created Agents List */}
            <div className="border-b border-white/10 pb-4 mb-4">
                <div 
                    className="flex justify-between items-center cursor-pointer group" 
                    onClick={() => setIsListVisible(!isListVisible)}
                >
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Dine Agenter</h4>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#00B5CB]/20 text-[#00B5CB]">
                            {createdAgents.length}
                        </span>
                    </div>
                    <button className="p-1 rounded-full hover:bg-white/10 text-gray-400">
                        {isListVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
                
                {isListVisible && (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                        {createdAgents.length > 0 ? (
                            createdAgents.map(agent => (
                                <div key={agent.id} className="p-3 bg-[#0B3E6F]/20 rounded-lg border border-white/5 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Bot size={16} className="text-[#00B5CB]" />
                                        <p className="font-medium text-sm text-white truncate">{agent.name}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {agent.tools.length > 0 ? (
                                            agent.tools.map(tool => (
                                                <span key={tool} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-white/5 text-gray-300 capitalize">
                                                    {tool.replace('_', ' ')}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-gray-500 italic">Ingen værktøjer</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-xs text-gray-500 border border-dashed border-white/10 rounded-lg">
                                Ingen agenter oprettet endnu
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">Navn</label>
                    <input 
                        value={agentName} 
                        onChange={e => setAgentName(e.target.value)} 
                        placeholder="Eks: Support Agent" 
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB]" 
                    />
                </div>

                <div>
                     <label className="text-xs font-medium text-gray-400 mb-1 block">Instruktion (Prompt)</label>
                    <textarea 
                        value={instruction} 
                        onChange={e => setInstruction(e.target.value)} 
                        placeholder="Beskriv agentens opgave..." 
                        rows={3} 
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB] resize-none" 
                    />
                </div>

                <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
                        Værktøjer
                        {isLoading && <div className="w-3 h-3 border-2 border-[#00B5CB] border-t-transparent rounded-full animate-spin"></div>}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tools.map(tool => (
                            <div 
                                key={tool.name} 
                                onClick={() => handleToolToggle(tool.name)}
                                className={`p-2 rounded-lg border flex flex-col gap-1 transition-all cursor-pointer ${getStatusClasses(tool.status)} ${selectedTools.has(tool.name) ? 'border-[#00B5CB] bg-[#00B5CB]/10' : 'bg-[#0B3E6F]/10'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-1.5">
                                        <Wrench size={12} className="text-gray-400" />
                                        <span className="text-xs font-medium text-gray-200 capitalize">{tool.name.replace('_', ' ')}</span>
                                    </div>
                                    {selectedTools.has(tool.name) && <div className="w-2 h-2 rounded-full bg-[#00B5CB]" />}
                                </div>
                                <p className="text-[10px] text-gray-500 line-clamp-1">{tool.description}</p>
                                <div className="mt-auto pt-1">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getStatusBadgeClasses(tool.status)}`}>
                                      {getStatusText(tool.status)}
                                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <div className="p-4 border-t border-white/10 bg-[#0B3E6F]/20">
            <Button 
                onClick={handleCreateAgent} 
                className="w-full flex items-center justify-center gap-2 bg-[#00B5CB] hover:bg-[#009eb3] text-[#051e3c] font-semibold transition-colors" 
                disabled={!agentName.trim() || !instruction.trim()}
            >
                <Plus size={16} /> Opret Agent
            </Button>
        </div>
    </div>
  );
};

export default AgentBuilderWidget;
