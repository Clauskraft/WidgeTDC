import React from 'react';

interface QuickToggleProps {
    icon: any;
    label: string;
    active: boolean;
    onClick: () => void;
    isDarkMode: boolean;
}

const QuickToggle: React.FC<QuickToggleProps> = ({ icon: Icon, label, active, onClick, isDarkMode }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full aspect-square border backdrop-blur-md group ${active
            ? 'bg-teal-600/90 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
            : isDarkMode
                ? 'bg-[#2d2d2d]/40 border-white/5 hover:bg-[#3d3d3d]/60'
                : 'bg-white/30 border-white/40 hover:bg-white/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
    >
        <Icon size={20} className={`transition-colors ${active ? 'text-white' : isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-teal-700'}`} />
        <span className={`text-[10px] mt-2 font-medium transition-colors ${active ? 'text-white' : isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-800'}`}>{label}</span>
    </button>
);

export default QuickToggle;
