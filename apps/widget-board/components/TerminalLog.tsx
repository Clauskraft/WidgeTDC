import React, { useRef, useEffect } from 'react';

interface LogEntry {
    type: 'error' | 'success' | 'warning' | 'info';
    msg: string;
}

interface TerminalLogProps {
    logs: LogEntry[];
    isDarkMode: boolean;
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs, isDarkMode }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [logs]);

    return (
        <div className={`h-full font-mono text-xs overflow-y-auto pr-2 space-y-1.5 scrollbar-thin ${isDarkMode ? 'scrollbar-thumb-white/10' : 'scrollbar-thumb-slate-400/20'}`} ref={scrollRef}>
            {logs.map((log, i) => (
                <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className={isDarkMode ? "text-slate-600 shrink-0" : "text-slate-400 shrink-0"}>[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className={`${log.type === 'error' ? 'text-rose-500 font-semibold' :
                            log.type === 'success' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') :
                                log.type === 'warning' ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') :
                                    (isDarkMode ? 'text-slate-300' : 'text-slate-700')
                        }`}>
                        {log.type === 'error' && '❌ '}
                        {log.type === 'success' && '✅ '}
                        {log.type === 'warning' && '⚠️ '}
                        {log.msg}
                    </span>
                </div>
            ))}
            <div className="h-4 w-2 bg-teal-500/50 animate-pulse mt-1"></div>
        </div>
    );
};

export default TerminalLog;
