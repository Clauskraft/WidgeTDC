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
  <div className={`relative group rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 ${isDarkMode
      ? 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
      : 'hover:shadow-[0_20px_60px_rgba(0,150,200,0.15)]'
    } ${className}`}>

    {/* Ultra-Glossy Background Layer */}
    <div className={`absolute inset-0 backdrop-blur-3xl backdrop-saturate-150 transition-all duration-500 ${isDarkMode
        ? 'bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40' // Dark: Deep glossy glass
        : 'bg-gradient-to-br from-white/40 via-white/30 to-white/35'  // Light: Crystal clear glass
      }`}>
    </div>

    {/* Shimmer Effect on Hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
      <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-r from-transparent via-blue-500/10 to-transparent'
          : 'bg-gradient-to-r from-transparent via-white/40 to-transparent'
        } translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}>
      </div>
    </div>

    {/* Noise Texture (Premium Mica Effect) */}
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
    </div>

    {/* Multi-Layer Borders (3D Depth) */}
    <div className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500 ${isDarkMode
        ? 'border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.5)]'
        : 'border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]'
      }`}>
    </div>

    {/* Glow Effect (Dark Mode Only) */}
    {isDarkMode && (
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 blur-xl"></div>
      </div>
    )}

    {/* Reflection Effect (Light Mode) */}
    {!isDarkMode && (
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none"></div>
    )}

    {/* Content Layer */}
    <div className="relative z-10 p-5 h-full flex flex-col">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={`p-2 rounded-lg shadow-lg transition-all duration-500 backdrop-blur-sm ${isDarkMode
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 shadow-blue-500/20'
                  : 'bg-gradient-to-br from-blue-50/80 to-purple-50/80 border border-white/60 shadow-blue-500/10'
                }`}>
                <Icon size={14} className={`transition-colors duration-500 ${isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`} />
              </div>
            )}
            <h3 className={`text-sm font-semibold tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'
              }`}>{title}</h3>
          </div>
          {headerAction || (
            <button className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 ${isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}>
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  </div>
);

export default AcrylicCard;

