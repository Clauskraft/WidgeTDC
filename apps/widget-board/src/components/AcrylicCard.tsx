import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface AcrylicCardProps {
    title: string;
    icon?: LucideIcon;
    children: ReactNode;
    className?: string;
    headerAction?: ReactNode;
    isDarkMode?: boolean; // Made optional
}

const AcrylicCard: React.FC<AcrylicCardProps> = ({
    title,
    icon: Icon,
    children,
    className = '',
    headerAction,
    isDarkMode = true
}) => {
    return (
        <div
            className={`
                relative overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300
                ${isDarkMode
                    ? 'bg-slate-900/60 border-slate-700/50 shadow-xl shadow-black/20'
                    : 'bg-white/60 border-slate-200/50 shadow-lg'
                }
                ${className}
            `}
        >
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative flex flex-col h-full">
                <div className={`
                    flex items-center justify-between px-4 py-3 border-b
                    ${isDarkMode ? 'border-white/5' : 'border-black/5'}
                `}>
                    <div className="flex items-center gap-2">
                        {Icon && (
                            <div className={`
                                p-1.5 rounded-lg
                                ${isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-black/5 text-slate-600'}
                            `}>
                                <Icon size={16} />
                            </div>
                        )}
                        <h3 className={`
                            font-medium text-sm tracking-wide
                            ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}
                        `}>
                            {title}
                        </h3>
                    </div>
                    {headerAction && (
                        <div className="flex items-center">
                            {headerAction}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AcrylicCard;
