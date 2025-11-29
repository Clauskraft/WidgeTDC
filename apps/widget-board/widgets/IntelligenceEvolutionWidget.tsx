import React, { useEffect, useState } from 'react';
import { Activity, Brain, Zap, Shield, GitCommit } from 'lucide-react';

// Live interface til HyperLog (Real-time)
const useHyperStream = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalThoughts: 0, toolUsageRate: 0, activeAgents: 0 });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hent data fra backend rute
        // Vi bruger relativ sti, som proxies af Vite
        const response = await fetch('/api/hyper/events'); 
        
        if (response.ok) {
          const data = await response.json();
          // Backend returnerer events nyeste sidst (append), vi vil vise nyeste øverst
          setEvents(data.events.reverse()); 
          setMetrics(data.metrics);
          setIsConnected(true);
        } else {
            setIsConnected(false);
        }
      } catch (error) {
        console.error("NeuroLink disconnected:", error);
        setIsConnected(false);
      }
    };

    // Poll hvert sekund (Real-time følelse uden WebSocket kompleksitet lige nu)
    const interval = setInterval(fetchData, 1000);
    fetchData(); // Hent med det samme

    return () => clearInterval(interval);
  }, []);

  return { events, metrics, isConnected };
};

export const IntelligenceEvolutionWidget: React.FC = () => {
  const { events, metrics, isConnected } = useHyperStream();

  return (
    <div className="h-full w-full flex flex-col p-4 overflow-hidden" data-testid="neuro-link-monitor">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Brain className={`w-5 h-5 ${isConnected ? 'text-purple-400 animate-pulse' : 'text-gray-500'}`} />
          <h3 className="font-semibold text-sm tracking-wider text-white">NEURO-LINK MONITOR</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#0B3E6F]/30 p-2 rounded-xl border border-white/5 flex flex-col items-center">
          <span className="text-xs text-gray-400">Thoughts</span>
          <span className="text-xl font-bold text-purple-300">{metrics.totalThoughts}</span>
        </div>
        <div className="bg-[#0B3E6F]/30 p-2 rounded-xl border border-white/5 flex flex-col items-center">
          <span className="text-xs text-gray-400">Tool Rate</span>
          <span className="text-xl font-bold text-blue-300">{metrics.toolUsageRate}</span>
        </div>
        <div className="bg-[#0B3E6F]/30 p-2 rounded-xl border border-white/5 flex flex-col items-center">
          <span className="text-xs text-gray-400">Agents</span>
          <span className="text-xl font-bold text-yellow-300">{metrics.activeAgents}</span>
        </div>
      </div>

      {/* The Stream (Visualisering af tanker) */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent"></div>
        <div className="space-y-3 overflow-y-auto h-full pr-2 custom-scrollbar">
          {events.map((evt) => (
            <div key={evt.id} className="ml-8 relative group animate-in slide-in-from-left-2 duration-300 fade-in">
              {/* Timeline Dot */}
              <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-[#051e3c] ${
                evt.type === 'TOOL_USE' ? 'bg-yellow-400' : 'bg-blue-400'
              }`}></div>
              
              {/* Card */}
              <div className="bg-white/5 hover:bg-white/10 p-2 rounded text-xs border border-white/5 transition-colors cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold ${evt.type === 'TOOL_USE' ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {evt.agent}
                  </span>
                  <span className="text-gray-500 text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-300">{evt.content}</p>
                {evt.type === 'TOOL_USE' && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                    <Zap className="w-3 h-3" />
                    Executing remote tool...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-[10px] text-gray-500">
        <div className="flex gap-2">
          <span>Høstet: {events.length} events</span>
          <span>Status: Hyper-MCP Active</span>
        </div>
        <Shield className="w-3 h-3 text-green-500" />
      </div>
    </div>
  );
};

export default IntelligenceEvolutionWidget;

