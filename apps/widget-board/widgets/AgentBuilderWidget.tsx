import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import type { ToolSuggestion, ToolStatus, Agent } from '../types';
import { Button } from '../components/ui/Button';

const ALL_TOOLS: Omit<ToolSuggestion, 'status'>[] = [
    { name: 'calculator', description: 'Matematiske beregninger.', category: 'Beregning' },
    { name: 'public_search', description: 'Søgning i offentlige kilder.', category: 'Søgning' },
    { name: 'private_search', description: 'Søgning i interne kilder.', category: 'Søgning' },
    { name: 'gdpr_analyzer', description: 'GDPR compliance analyse.', category: 'Compliance' },
];

const AgentBuilderWidget: React.FC<{ widgetId: string }> = () => {
  const [agentName, setAgentName] = useState('');
  const [instruction, setInstruction] = useState('');
  const debouncedInstruction = useDebounce(instruction, 500);
  const [tools, setTools] = useState<ToolSuggestion[]>(ALL_TOOLS.map(t => ({...t, status: 'optional'})));
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [createdAgents, setCreatedAgents] = useState<Agent[]>([]);
  const [isListVisible, setIsListVisible] = useState(true);


  useEffect(() => {
    async function fetchSuggestions() {
      if (!debouncedInstruction.trim()) {
        setTools(ALL_TOOLS.map(t => ({...t, status: 'optional'})));
        return;
      }
      setIsLoading(true);
      try {
        // Mocking API call
        await new Promise(res => setTimeout(res, 500));
        const mockData = { tools: [
            debouncedInstruction.includes("beregn") && {name: "calculator", status: "recommended" as const},
            debouncedInstruction.includes("søg") && {name: "public_search", status: "recommended" as const},
            debouncedInstruction.includes("privat") && {name: "private_search", status: "mandatory" as const},
            debouncedInstruction.includes("privat") && {name: "public_search", status: "excluded" as const},
        // FIX: Replaced incorrect type predicate with `filter(Boolean)` for correct type inference.
        ].filter(Boolean) };

        const newTools = ALL_TOOLS.map((tool): ToolSuggestion => {
            const suggestion = mockData.tools.find(t => t.name === tool.name);
            return {...tool, status: suggestion?.status || 'optional'};
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
      'mandatory': 'border-red-500 bg-red-50 dark:bg-red-900/50',
      'recommended': 'border-blue-500 bg-blue-50 dark:bg-blue-900/50',
      'excluded': 'opacity-50',
      'optional': 'border-gray-200 dark:border-gray-700'
  }[status]);
  
  const getStatusBadgeClasses = (status: ToolStatus) => ({
      'mandatory': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'recommended': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'excluded': 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
      'optional': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }[status]);

  const getStatusText = (status: ToolStatus) => ({
      'mandatory': 'Obligatorisk',
      'recommended': 'Anbefalet',
      'excluded': 'Ekskluderet',
      'optional': 'Valgfri'
  }[status]);

  return (
    <div className="h-full flex flex-col -m-4">
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => setIsListVisible(!isListVisible)}
                    aria-expanded={isListVisible}
                    aria-controls="created-agents-list"
                >
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">Oprettede Agenter</h3>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {createdAgents.length}
                        </span>
                    </div>
                    <button className="ms-focusable p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={isListVisible ? "Skjul liste" : "Vis liste"}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${isListVisible ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                {isListVisible && (
                    <div id="created-agents-list" className="mt-2 max-h-48 overflow-y-auto pr-2 -mr-2 space-y-3">
                        {createdAgents.length > 0 ? (
                            createdAgents.map(agent => (
                                <div key={agent.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" />
                                        </svg>
                                        <p className="font-bold text-gray-900 dark:text-gray-50 truncate">{agent.name}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <strong className="text-xs font-semibold text-gray-500 dark:text-gray-400">Værktøjer:</strong>
                                        {agent.tools.length > 0 ? (
                                            agent.tools.map(tool => (
                                                <span key={tool} className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 capitalize">
                                                    {tool.replace('_', ' ')}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">Ingen</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p className="mt-2 font-semibold">Ingen agenter oprettet</p>
                                <p className="text-xs mt-1">Dine oprettede agenter vil blive vist her.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="agentName" className="text-sm font-medium mb-1 block">Agent Navn</label>
                <input id="agentName" type="text" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Eks: GDPR Compliance Agent" className="ms-focusable w-full p-2 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
            </div>

            <div>
                 <label htmlFor="agentInstruction" className="text-sm font-medium mb-1 block">Instruktion</label>
                <textarea id="agentInstruction" value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="Beskriv agentens opgaver og kompetenceområde..." rows={4} className="ms-focusable w-full p-2 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none" />
            </div>

            <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    Værktøjer
                    {isLoading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tools.map(tool => (
                        <div 
                            key={tool.name} 
                            onClick={() => handleToolToggle(tool.name)}
                            role="checkbox"
                            aria-checked={selectedTools.has(tool.name)}
                            tabIndex={tool.status === 'excluded' ? -1 : 0}
                            onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    handleToolToggle(tool.name);
                                }
                            }}
                            className={`ms-focusable p-3 rounded-lg border-2 flex flex-col gap-1 transition-all ${getStatusClasses(tool.status)} ${selectedTools.has(tool.name) ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-blue-500' : ''} ${tool.status === 'excluded' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-semibold capitalize">{tool.name.replace('_', ' ')}</span>
                                <input 
                                    type="checkbox" 
                                    checked={selectedTools.has(tool.name)} 
                                    readOnly 
                                    disabled={tool.status === 'mandatory' || tool.status === 'excluded'} 
                                    className="w-4 h-4 rounded text-blue-600 bg-gray-100 border-gray-300 pointer-events-none flex-shrink-0" 
                                />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow">{tool.description}</p>
                            <div className="mt-auto pt-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadgeClasses(tool.status)}`}>
                                  {getStatusText(tool.status)}
                              </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={handleCreateAgent} className="w-full" disabled={!agentName.trim() || !instruction.trim()}>Opret Agent</Button>
        </div>
    </div>
  );
};

export default AgentBuilderWidget;