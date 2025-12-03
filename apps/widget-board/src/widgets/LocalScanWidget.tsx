import React from 'react';
import { HardDrive, CheckCircle } from 'lucide-react';

const LocalScanWidget: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">LOCAL_SCANNER</h3>
        </div>
      </div>
      
      <div className="flex-1 p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">
            <CheckCircle size={14} />
            <span>System Integrity Verified</span>
        </div>
        <div className="text-[10px] text-gray-500 font-mono p-2">
            Last scan: Just now<br/>
            Files checked: 14,203<br/>
            Rootkits: 0
        </div>
      </div>
    </div>
  );
};

export default LocalScanWidget;