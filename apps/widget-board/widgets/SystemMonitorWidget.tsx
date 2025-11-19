import React, { useEffect, useState } from 'react';

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

  const fetchData = async () => {
    try {
      const [processesRes, systemRes] = await Promise.all([
        fetch('http://localhost:3001/api/sys/processes'),
        fetch('http://localhost:3001/api/sys/system')
      ]);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading system data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500 text-sm text-center">
          <div className="mb-2">Failed to load system data</div>
          <div className="text-xs text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 flex flex-col gap-4">
        {/* System Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">CPU</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {systemInfo?.load.currentLoad.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {systemInfo?.cpu.temperature ? `${systemInfo.cpu.temperature}°C` : 'No temp sensor'}
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Memory</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {systemInfo?.memory.usedPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatBytes(systemInfo?.memory.used || 0)} / {formatBytes(systemInfo?.memory.total || 0)}
            </div>
          </div>
        </div>

        {/* Top Processes */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Top Processes
          </div>

          {/* Header */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 pb-1 mb-1">
            <span className="w-2/3">PROCESS</span>
            <span className="w-1/3 text-right">CPU %</span>
          </div>

          {/* Process List */}
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {processes.map((process, index) => (
              <div
                key={`${process.pid}-${index}`}
                className="flex justify-between items-center text-xs hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer transition-colors"
              >
                <div className="flex-1 truncate mr-2 text-gray-800 dark:text-gray-200 font-mono">
                  {process.name}
                </div>
                <div className={`font-bold text-right min-w-[40px] ${
                  process.cpu > 10
                    ? 'text-red-500 dark:text-red-400'
                    : process.cpu > 5
                    ? 'text-yellow-500 dark:text-yellow-400'
                    : 'text-green-500 dark:text-green-400'
                }`}>
                  {process.cpu}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Details */}
        {systemInfo && (
          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>CPU: {systemInfo.cpu.brand}</div>
              <div>Cores: {systemInfo.cpu.cores} ({systemInfo.cpu.physicalCores} physical)</div>
              <div>Load Avg: {systemInfo.load.avgLoad.toFixed(2)}</div>
              <div>Memory: {formatBytes(systemInfo.memory.available)} free</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMonitorWidget;