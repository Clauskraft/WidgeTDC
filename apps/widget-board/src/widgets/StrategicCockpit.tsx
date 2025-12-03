import React, { useState, useEffect } from 'react';
import { Activity, Database, Globe, Shield, Users, Brain, ArrowUpRight, Clock, Cpu } from 'lucide-react';

interface CockpitData {
  systemHealth: string;
  totalKnowledgeNodes: number;
  totalVectors: number;
  activeAgents: number;
  uptime: string;
}

const StrategicCockpit: React.FC = () => {
  const [data, setData] = useState<CockpitData>({
    systemHealth: 'OPTIMAL',
    totalKnowledgeNodes: 0,
    totalVectors: 0,
    activeAgents: 1, // The Architect
    uptime: '00:00:00'
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Parallel fetch for dashboard data
      const [sysRes, graphRes, harvestRes] = await Promise.all([
        fetch('/api/sys/system'),
        fetch('/api/evolution/graph/stats'),
        fetch('/api/evolution/harvest/summary')
      ]);

      let nodes = 0;
      if (graphRes.ok) {
        const gData = await graphRes.json();
        nodes = gData.stats?.nodes || gData.totalNodes || 0;
      }

      let vectors = 0;
      if (harvestRes.ok) {
        const hData = await harvestRes.json();
        vectors = hData.totalFiles || 0;
      }

      // Calculate uptime (mock for now or get from sys)
      // Using a simple counter for visual effect
      
      setData(prev => ({
        ...prev,
        totalKnowledgeNodes: nodes,
        totalVectors: vectors,
        systemHealth: sysRes.ok ? 'OPTIMAL' : 'DEGRADED'
      }));
      setLoading(false);
    } catch (e) {
      console.error("Cockpit fetch error:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, subtext, color = "text-[#00B5CB]" }: any) => (
    <div className="bg-[#0B3E6F]/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-[#0B3E6F]/30 transition-all group">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-white font-mono">{value}</h3>
        <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{title}</p>
        {subtext && <p className="text-[10px] text-gray-500 mt-2">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-gradient-to-br from-[#051e3c] to-black overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight">Strategic Command</h2>
          <p className="text-sm text-gray-400">Executive Overview & Neural Status</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full ${data.systemHealth === 'OPTIMAL' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-mono text-gray-300">{data.systemHealth}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Knowledge Nodes" 
          value={loading ? '...' : data.totalKnowledgeNodes.toLocaleString()} 
          icon={Brain} 
          color="text-purple-400"
          subtext="Neo4j Graph Entities"
        />
        <StatCard 
          title="Intel Vectors" 
          value={loading ? '...' : data.totalVectors.toLocaleString()} 
          icon={Database} 
          color="text-blue-400"
          subtext="Postgres Embeddings"
        />
        <StatCard 
          title="Active Agents" 
          value={data.activeAgents} 
          icon={Users} 
          color="text-green-400"
          subtext="The Architect Online"
        />
        <StatCard 
          title="Threat Level" 
          value="LOW" 
          icon={Shield} 
          color="text-cyan-400"
          subtext="CyberOps Overwatch"
        />
      </div>

      {/* Main Visual Area (Placeholder for now, but styled) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[300px]">
        {/* Neural Activity Log */}
        <div className="lg:col-span-2 bg-black/20 rounded-xl border border-white/10 p-4 flex flex-col">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity size={16} /> Neural Activity Log
          </h3>
          <div className="flex-1 bg-black/40 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-y-auto space-y-2">
            <div className="flex gap-2 text-green-400">
              <span className="opacity-50">[00:00:01]</span>
              <span>SYSTEM_INIT: Neural Bridge connected.</span>
            </div>
            <div className="flex gap-2 text-blue-400">
              <span className="opacity-50">[00:00:02]</span>
              <span>OMNI_HARVESTER: Sensors active.</span>
            </div>
            <div className="flex gap-2 text-purple-400">
              <span className="opacity-50">[00:00:05]</span>
              <span>GRAPH: Synaptic link established (Neo4j).</span>
            </div>
            <div className="flex gap-2 text-gray-400">
              <span className="opacity-50">[00:00:10]</span>
              <span>WAITING: Ready for executive command...</span>
            </div>
          </div>
        </div>

        {/* System Resources */}
        <div className="bg-black/20 rounded-xl border border-white/10 p-4 flex flex-col">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Cpu size={16} /> Resource Allocation
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-6">
            {/* CPU Ring */}
            <div className="relative flex items-center justify-center">
               <div className="w-24 h-24 rounded-full border-4 border-white/5"></div>
               <div className="absolute w-24 h-24 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rotate-45"></div>
               <div className="absolute text-center">
                 <span className="text-xl font-bold text-white">12%</span>
                 <p className="text-[10px] text-gray-500">CPU LOAD</p>
               </div>
            </div>
            {/* MEM Ring */}
            <div className="relative flex items-center justify-center">
               <div className="w-24 h-24 rounded-full border-4 border-white/5"></div>
               <div className="absolute w-24 h-24 rounded-full border-4 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rotate-12"></div>
               <div className="absolute text-center">
                 <span className="text-xl font-bold text-white">4.2GB</span>
                 <p className="text-[10px] text-gray-500">MEM USAGE</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategicCockpit;