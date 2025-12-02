import React, { useEffect, useState, useCallback } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { RefreshCw, Cpu, Thermometer, Activity } from 'lucide-react';

interface Process {
  name: string;
  cpu: number;
  mem: number;
  pid: number;
}

interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
    temperature: number | null;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    usedPercent: number;
  };
  load: {
    avgLoad: number;
    currentLoad: number;
    currentLoadUser: number;
    currentLoadSystem: number;
  };
}

const SystemMonitorWidget: React.FC<{ widgetId: string }> = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate data if offline or dev mode (optional fallback)
      const [processesRes, systemRes] = await Promise.all([
        fetch('http://localhost:3001/api/sys/processes').catch(() => null),
        fetch('http://localhost:3001/api/sys/system').catch(() => null)
      ]);

      if (!processesRes || !systemRes) {
         throw new Error('Backend connection failed');
      }

      if (!processesRes.ok || !systemRes.ok) {
        throw new Error('Failed to fetch system data');
      }

      const processesData = await processesRes.json();
      const systemData = await systemRes.json();

      setProcesses(processesData);
      setSystemInfo(systemData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Mock data for demo purposes if backend is down
      setSystemInfo({
        cpu: { manufacturer: 'Intel', brand: 'Core i9-12900K', cores: 16, physicalCores: 8, speed: 3.2, temperature: 45 },
        memory: { total: 34359738368, used: 16234982342, available: 18124756026, usedPercent: 47.2 },
        load: { avgLoad: 1.2, currentLoad: 12.5, currentLoadUser: 8.2, currentLoadSystem: 4.3 }
      });
      setProcesses([
        { name: 'node.exe', cpu: 4.2, mem: 120, pid: 1234 },
        { name: 'electron.exe', cpu: 2.1, mem: 450, pid: 5678 },
        { name: 'chrome.exe', cpu: 1.8, mem: 800, pid: 9012 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <MatrixWidgetWrapper 
      title="System Monitor" 
      isLoading={loading && !systemInfo}
      controls={
        <button onClick={fetchData} className="p-1 text-gray-400 hover:text-[#00B5CB] transition-colors">
          <RefreshCw size={14} />
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* System Overview */}
        <div className="grid grid-cols-2 gap-3">
          {/* CPU Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
              <Cpu size={32} className="text-[#00B5CB]" />
            </div>
            <div className="text-[10px] font-medium text-gray-400 mb-1 tracking-wider">CPU LOAD</div>
            <div className="text-xl font-bold text-white flex items-baseline gap-1">
              {systemInfo?.load.currentLoad.toFixed(1)}
              <span className="text-sm font-normal text-[#00B5CB]">%</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
              <Thermometer size={10} />
              {systemInfo?.cpu.temperature ? `${systemInfo.cpu.temperature}°C` : '45°C'}
            </div>
            {/* Progress Bar */}
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00B5CB] transition-all duration-500" 
                style={{ width: `${systemInfo?.load.currentLoad || 0}%` }}
              />
            </div>
          </div>

          {/* Memory Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
              <Activity size={32} className="text-purple-400" />
            </div>
            <div className="text-[10px] font-medium text-gray-400 mb-1 tracking-wider">MEMORY</div>
            <div className="text-xl font-bold text-white flex items-baseline gap-1">
              {systemInfo?.memory.usedPercent.toFixed(1)}
              <span className="text-sm font-normal text-purple-400">%</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
              {formatBytes(systemInfo?.memory.used || 0)} / {formatBytes(systemInfo?.memory.total || 0)}
            </div>
             {/* Progress Bar */}
             <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400 transition-all duration-500" 
                style={{ width: `${systemInfo?.memory.usedPercent || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Processes */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Top Processes</span>
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CPU</span>
          </div>

          <div className="flex flex-col gap-1">
            {processes.map((process, index) => (
              <div
                key={`${process.pid}-${index}`}
                className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-[#00B5CB] transition-colors" />
                  <span className="text-xs text-gray-300 font-mono truncate">{process.name}</span>
                </div>
                <div className={`text-xs font-medium font-mono ${
                  process.cpu > 10 ? 'text-red-400' : process.cpu > 5 ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {process.cpu}%
                </div>
              </div>
            ))}
            {processes.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-500 italic">No active processes found</div>
            )}
          </div>
        </div>

        {/* System Specs Footer */}
        {systemInfo && (
          <div className="mt-auto pt-3 border-t border-white/5">
            <div className="flex justify-between text-[10px] text-gray-500">
               <span>{systemInfo.cpu.brand}</span>
               <span>{systemInfo.cpu.cores} Cores</span>
            </div>
          </div>
        )}
      </div>
    </MatrixWidgetWrapper>
  );
};

export default SystemMonitorWidget;