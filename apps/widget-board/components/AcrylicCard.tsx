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

    {/* 1. Background Material (The Glass) */}
    <div className={`absolute inset-0 backdrop-blur-2xl transition-colors duration-500 ${isDarkMode
        ? 'bg-[#1a1a1a]/60' // Mørk: Stealth glas
        : 'bg-white/30'     // Lys: Krystalklar glas (mere gennemsigtig)
      }`}></div>

    {/* 2. Noise Texture (Mica Effect) */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mixed-blend-overlay"
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
