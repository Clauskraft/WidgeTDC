import React, { useEffect, useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Activity, Brain, Zap, Shield, GitCommit } from 'lucide-react';

// Live interface til HyperLog (Real-time)
const useHyperStream = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalThoughts: 0, toolUsageRate: 0, activeAgents: 0 });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        // Mock fetch fallback
        // const response = await fetch('/api/hyper/events'); 
        
        // Simulate live data for demo
        const mockEvents = [
            { id: Date.now(), agent: 'TheArchitect', type: 'THOUGHT', content: 'Analyzing component structure...', timestamp: new Date().toISOString() },
            { id: Date.now()-1000, agent: 'System', type: 'TOOL_USE', content: 'Calling database...', timestamp: new Date(Date.now()-1000).toISOString() },
            { id: Date.now()-5000, agent: 'Visionary', type: 'THOUGHT', content: 'Generating diagram layout', timestamp: new Date(Date.now()-5000).toISOString() }
        ];
        
        if (mounted) {
            setEvents(mockEvents); 
            setMetrics({ totalThoughts: 142, toolUsageRate: 0.85, activeAgents: 3 });
            setIsConnected(true);
        }
      } catch (error) {
        if(mounted) setIsConnected(false);
      }
    };

    // Poll hvert sekund (Real-time følelse uden WebSocket kompleksitet lige nu)
    const interval = setInterval(fetchData, 2000);
    fetchData(); // Hent med det samme

    return () => {
        mounted = false;
        clearInterval(interval);
    };
  }, []);

  return { events, metrics, isConnected };
};

export const IntelligenceEvolutionWidget: React.FC<{ widgetId?: string }> = () => {
  const { events, metrics, isConnected } = useHyperStream();

  return (
    <MatrixWidgetWrapper title="Neuro-Link Monitor">
      <div className="h-full flex flex-col gap-4">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase">Thoughts</span>
                <span className="text-lg font-bold text-purple-400">{metrics.totalThoughts}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase">Tool Rate</span>
                <span className="text-lg font-bold text-blue-400">{metrics.toolUsageRate}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase">Agents</span>
                <span className="text-lg font-bold text-yellow-400">{metrics.activeAgents}</span>
            </div>
        </div>

        {/* The Stream (Visualisering af tanker) */}
        <div className="flex-1 overflow-hidden relative bg-black/20 rounded-xl border border-white/5 p-2">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent"></div>
            <div className="space-y-3 overflow-y-auto h-full pr-1 custom-scrollbar pl-8">
            {events.map((evt) => (
                <div key={evt.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-[#051e3c] shadow-[0_0_5px_currentColor] ${
                        evt.type === 'TOOL_USE' ? 'bg-yellow-400 text-yellow-400' : 'bg-blue-400 text-blue-400'
                    }`}></div>
                    
                    {/* Card */}
                    <div className="bg-white/5 hover:bg-white/10 p-2 rounded border border-white/5 transition-colors cursor-pointer">
                        <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold ${evt.type === 'TOOL_USE' ? 'text-yellow-400' : 'text-blue-400'}`}>
                            {evt.agent}
                        </span>
                        <span className="text-gray-500 text-[9px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-gray-300">{evt.content}</p>
                        {evt.type === 'TOOL_USE' && (
                        <div className="mt-1 flex items-center gap-1 text-[9px] text-gray-400">
                            <Zap className="w-3 h-3" />
                            Remote Exec
                        </div>
                        )}
                    </div>
                </div>
            ))}
            </div>
        </div>

        {/* Footer / Controls */}
        <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 border-t border-white/5">
            <div className="flex gap-2">
                <span>Events: {events.length}</span>
                <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                    {isConnected ? '● LINK ACTIVE' : '● OFFLINE'}
                </span>
            </div>
            <Shield className="w-3 h-3 text-gray-600" />
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default IntelligenceEvolutionWidget;
