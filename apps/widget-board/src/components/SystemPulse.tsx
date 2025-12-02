import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface SystemPulseProps {
  lastUpdate?: number; // Timestamp from backend
  status?: 'online' | 'offline' | 'error';
}

export const SystemPulse: React.FC<SystemPulseProps> = ({ lastUpdate, status = 'offline' }) => {
  const [pulseState, setPulseState] = useState<'alive' | 'memory' | 'dead'>('memory');

  useEffect(() => {
    if (status === 'error') {
      setPulseState('dead');
      return;
    }

    if (!lastUpdate) {
      setPulseState('memory');
      return;
    }

    const now = Date.now();
    const diff = now - lastUpdate;

    // Live if update was less than 60 seconds ago
    if (diff < 60000 && status === 'online') {
      setPulseState('alive');
    } else {
      setPulseState('memory');
    }
  }, [lastUpdate, status]);

  const getColor = () => {
    switch (pulseState) {
      case 'alive': return 'text-green-500';
      case 'memory': return 'text-yellow-500';
      case 'dead': return 'text-red-600';
    }
  };

  const getText = () => {
    switch (pulseState) {
      case 'alive': return 'SYSTEM AWAKE';
      case 'memory': return 'SYSTEM REMEMBERING'; // Cached/Old data
      case 'dead': return 'SYSTEM COMA';
    }
  };

  return (
    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
      <div className={`relative flex h-3 w-3`}>
        {pulseState === 'alive' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${
          pulseState === 'alive' ? 'bg-green-500' : 
          pulseState === 'memory' ? 'bg-yellow-500' : 'bg-red-600'
        }`}></span>
      </div>
      <span className={`text-xs font-mono font-bold tracking-wider ${getColor()}`}>
        {getText()}
      </span>
      {pulseState === 'alive' && (
        <Activity className="w-3 h-3 text-green-500 animate-pulse ml-1" />
      )}
    </div>
  );
};
