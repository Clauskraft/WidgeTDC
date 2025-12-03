import React from 'react';
import { Globe, AlertOctagon, Search } from 'lucide-react';

const DarkWebMonitorWidget: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">DARK_WEB_MONITOR</h3>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">LIVE</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center opacity-60">
        <div className="relative mb-3">
            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
            <Search size={32} className="relative z-10 text-purple-400" />
        </div>
        <p className="text-sm text-gray-300">Scanning hidden services...</p>
        <p className="text-xs text-gray-500 mt-1">Tor nodes monitored: 142</p>
      </div>
    </div>
  );
};

export default DarkWebMonitorWidget;