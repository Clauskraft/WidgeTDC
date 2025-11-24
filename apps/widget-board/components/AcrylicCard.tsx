import React from 'react';
import { MoreHorizontal } from 'lucide-react';

interface AcrylicCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: any;
  headerAction?: React.ReactNode;
  isDarkMode: boolean;
}

const AcrylicCard: React.FC<AcrylicCardProps> = ({
  children,
  className = "",
  title,
  icon: Icon,
  headerAction,
  isDarkMode
}) => (
  <div className={`relative group rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.005] ${isDarkMode ? 'hover:shadow-2xl hover:shadow-black/50' : 'hover:shadow-xl hover:shadow-teal-900/5'
    } ${className}`}>

    {/* 1. Background Material (The Glass) - Enhanced Transparency */}
    <div className={`absolute inset-0 backdrop-blur-3xl backdrop-saturate-150 transition-colors duration-500 ${isDarkMode
      ? 'bg-gradient-to-br from-slate-900/35 via-slate-800/25 to-slate-900/35' // Mørk: Mere gennemsigtig stealth glas
      : 'bg-gradient-to-br from-white/25 via-white/20 to-white/25'     // Lys: Ultra gennemsigtig krystalklar glas
      }`}></div>

    {/* Shimmer Effect on Hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
      <div className={`absolute inset-0 ${isDarkMode
        ? 'bg-gradient-to-r from-transparent via-blue-500/5 to-transparent'
        : 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
        } translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}>
      </div>
    </div>

    {/* 2. Noise Texture (Mica Effect) */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
    </div>

    {/* 3. Borders & Highlights (3D Effect) */}
    <div className={`absolute inset-0 rounded-2xl border pointer-events-none transition-all duration-500 ${isDarkMode
      ? 'border-t-white/10 border-l-white/5 border-r-black/40 border-b-black/60'
      : 'border-t-white/80 border-l-white/60 border-r-white/20 border-b-white/30 ring-1 ring-white/40'
      }`}></div>

    {/* Content Layer */}
    <div className="relative z-10 p-5 h-full flex flex-col">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={`p-1.5 rounded-lg shadow-sm transition-colors duration-500 ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-white/50 border border-white/40'
                }`}>
                <Icon size={14} className={`transition-colors duration-500 ${isDarkMode ? "text-teal-400" : "text-teal-700"}`} />
              </div>
            )}
            <h3 className={`text-sm font-semibold tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>{title}</h3>
          </div>
          {headerAction || <MoreHorizontal size={16} className={`${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'} cursor-pointer transition-colors`} />}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  </div>
);

export default AcrylicCard;
