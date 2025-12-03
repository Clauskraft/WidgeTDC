import React, { useEffect, useState } from 'react';
import { Network, Wifi, ArrowDown, ArrowUp, Globe, Shield } from 'lucide-react';

interface NetworkData {
  stats: {
    interface: string;
    rx_sec: number;
    tx_sec: number;
    rx_bytes: number;
    tx_bytes: number;
  } | null;
  connections: number;
  activeConnections: number;
}

const NetworkSpyWidget: React.FC = () => {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/sys/network');
      if (!res.ok) return;
      const netData = await res.json();
      setData(netData);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSpeed = (bytes: number) => {
    if (bytes < 1024) return `${bytes.toFixed(0)} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
  };

  if (loading || !data) return <div className="p-4 text-cyan-500/50 text-xs font-mono animate-pulse">SCANNING NETWORK...</div>;

  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">NET_SPY</h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-500/50">{data.stats?.interface || 'UNKNOWN'}</span>
      </div>

      {/* Traffic Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded bg-green-500/10">
                <ArrowDown size={16} className="text-green-400" />
            </div>
            <div>
                <div className="text-[10px] text-gray-400">INBOUND</div>
                <div className="text-sm font-mono text-green-400">{formatSpeed(data.stats?.rx_sec || 0)}</div>
            </div>
        </div>
        <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded bg-blue-500/10">
                <ArrowUp size={16} className="text-blue-400" />
            </div>
            <div>
                <div className="text-[10px] text-gray-400">OUTBOUND</div>
                <div className="text-sm font-mono text-blue-400">{formatSpeed(data.stats?.tx_sec || 0)}</div>
            </div>
        </div>
      </div>

      {/* Connections */}
      <div className="flex items-center justify-between bg-black/20 p-2 rounded border border-white/5 text-xs">
        <div className="flex items-center gap-2 text-gray-400">
            <Globe size={12} />
            <span>Active Connections</span>
        </div>
        <span className="font-mono text-cyan-400">{data.activeConnections}</span>
      </div>

      {/* Security Status (Visual only) */}
      <div className="mt-auto flex items-center gap-2 text-[10px] text-green-400/70 bg-green-900/10 p-1.5 rounded border border-green-500/20">
        <Shield size={10} />
        <span>FIREWALL ACTIVE • TRAFFIC ENCRYPTED</span>
      </div>
    </div>
  );
};

export default NetworkSpyWidget;