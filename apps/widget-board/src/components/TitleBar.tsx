import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
    // Tjek om vi kører i Electron ved at se efter window.electronAPI
    const isElectron = (window as any).electronAPI?.isDesktop;

    if (!isElectron) return null;

    const handleMinimize = () => (window as any).electronAPI.minimize();
    const handleMaximize = () => (window as any).electronAPI.maximize();
    const handleClose = () => (window as any).electronAPI.close();

    return (
        <div className="h-8 bg-[#051e3c] flex justify-end items-center select-none z-[9999]" style={{ WebkitAppRegion: 'drag' } as any}>
            {/* Drag Region */}
            <div className="flex-1 h-full flex items-center pl-4">
                <span className="text-[10px] font-mono text-[#00B5CB]/50 tracking-widest uppercase">
                    NEURAL_LINK::ACTIVE
                </span>
            </div>

            {/* Window Controls (No Drag) */}
            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button 
                    onClick={handleMinimize}
                    className="w-12 h-full flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    <Minus size={14} />
                </button>
                <button 
                    onClick={handleMaximize}
                    className="w-12 h-full flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    <Square size={12} />
                </button>
                <button 
                    onClick={handleClose}
                    className="w-12 h-full flex items-center justify-center hover:bg-red-500/80 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
