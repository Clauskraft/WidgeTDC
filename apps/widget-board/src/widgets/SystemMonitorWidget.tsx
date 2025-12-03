import React, { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Server, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SystemData {
  cpu: {
    brand: string;
    speed: number;
    cores: number;
    temperature: number | null;
  };
  memory: {
    total: number;
    used: number;
    usedPercent: number;
  };
  load: {
    currentLoad: number;
  };
  os: {
    platform: string;
    distro: string;
  };
}

const SystemMonitorWidget: React.FC = () => {
  const [data, setData] = useState<SystemData | null>(null);
  const [history, setHistory] = useState<{ time: string; cpu: number; mem: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/sys/system');
      if (!res.ok) throw new Error('Connection lost');
      const sysData: SystemData = await res.json();
      
      setData(sysData);
      setLoading(false);

      // Update history
      setHistory(prev => {
        const now = new Date().toLocaleTimeString().split(' ')[0];
        const newEntry = { 
            time: now, 
            cpu: sysData.load.currentLoad, 
            mem: sysData.memory.usedPercent 
        };
        const newHistory = [...prev, newEntry];
        return newHistory.slice(-20); // Keep last 20 points
      });

    } catch (err) {
      console.error('System monitor error:', err);
      setError('SIGNAL_LOST');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Update every 2s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black/20 rounded-xl border border-white/10">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-cyan-500/70 animate-pulse">INITIALIZING SENSORS...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-red-900/10 rounded-xl border border-red-500/30">
        <div className="text-center">
          <Activity className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <span className="text-xs font-mono text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">SYSTEM_MONITOR</h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-500/50">{data.os.platform} {data.os.distro}</span>
      </div>

      {/* Meters */}
      <div className="grid grid-cols-2 gap-4">
        {/* CPU Meter */}
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
          <div className="flex justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Cpu size={12} /> CPU
            </div>
            <span className="text-xs font-mono text-cyan-400">{data.load.currentLoad.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(data.load.currentLoad, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-[9px] text-gray-500 truncate">{data.cpu.brand}</div>
        </div>

        {/* RAM Meter */}
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
          <div className="flex justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <HardDrive size={12} /> MEM
            </div>
            <span className="text-xs font-mono text-purple-400">{data.memory.usedPercent.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(data.memory.usedPercent, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-[9px] text-gray-500">
            {(data.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB / {(data.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB
          </div>
        </div>
      </div>

      {/* Live Chart */}
      <div className="flex-1 min-h-0 bg-black/20 rounded-lg border border-white/5 p-2 relative">
        <div className="absolute top-2 right-2 flex gap-3 text-[9px]">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500/50"></div>CPU</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500/50"></div>MEM</div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip 
                contentStyle={{ backgroundColor: '#051e3c', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                itemStyle={{ padding: 0 }}
            />
            <Line 
                type="monotone" 
                dataKey="cpu" 
                stroke="#06b6d4" 
                strokeWidth={2} 
                dot={false} 
                animationDuration={300} 
            />
            <Line 
                type="monotone" 
                dataKey="mem" 
                stroke="#a855f7" 
                strokeWidth={2} 
                dot={false} 
                animationDuration={300} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemMonitorWidget;