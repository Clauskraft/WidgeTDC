import React from 'react';

export const HoloEditor: React.FC = () => {
  return (
    <div className="absolute right-4 top-20 w-80 h-96 bg-black/60 border border-cyan-500/30 rounded-lg backdrop-blur-md p-4 text-green-400 font-mono text-xs overflow-hidden">
        <div className="border-b border-white/10 pb-2 mb-2 flex justify-between items-center">
            <span>HOLO_EDITOR.exe</span>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
        </div>
        <div className="opacity-70">
            <p>{'>'} Initializing neural link...</p>
            <p>{'>'} Connecting to Omniverse...</p>
            <p>{'>'} Awaiting input...</p>
            <span className="animate-pulse">_</span>
        </div>
    </div>
  );
};
