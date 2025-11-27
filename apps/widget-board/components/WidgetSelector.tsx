import React, { useState, useMemo } from 'react';
import { X, Plus, Search, LayoutGrid, MessageSquare, Activity, Shield, BarChart2, FileText, Settings, Globe, Database, Code, Mic, Image as ImageIcon, Zap, Check, Cpu, Network } from 'lucide-react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';

interface WidgetSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onAddWidget: (widgetId: string) => void;
    activeWidgets?: string[];
}

export default function WidgetSelector({ isOpen, onClose, onAddWidget, activeWidgets = [] }: WidgetSelectorProps) {
    const { availableWidgets } = useWidgetRegistry();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(availableWidgets.map(w => w.category || 'other'));
        return ['all', ...Array.from(cats).sort()];
    }, [availableWidgets]);

    // Filter widgets
    const filteredWidgets = useMemo(() => {
        return availableWidgets.filter(widget => {
            const matchesSearch = (widget.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 widget.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [availableWidgets, searchQuery, selectedCategory]);

    // Map category/widget to icon
    const getWidgetIcon = (widget: any) => {
        const cat = (widget.category || '').toLowerCase();
        const name = (widget.name || '').toLowerCase();

        // Specific overrides based on name
        if (name.includes('agent') || name.includes('bot')) return <BotIcon />;
        if (name.includes('chat')) return <MessageSquare size={24} />;
        if (name.includes('code') || name.includes('terminal')) return <Code size={24} />;
        if (name.includes('security') || name.includes('scan')) return <Shield size={24} />;
        if (name.includes('monitor') || name.includes('status')) return <Activity size={24} />;
        if (name.includes('audio') || name.includes('voice')) return <Mic size={24} />;
        if (name.includes('image') || name.includes('video')) return <ImageIcon size={24} />;
        if (name.includes('kanban') || name.includes('notes')) return <FileText size={24} />;
        if (name.includes('web') || name.includes('browser')) return <Globe size={24} />;
        if (name.includes('data') || name.includes('feed')) return <Database size={24} />;
        if (name.includes('settings') || name.includes('config')) return <Settings size={24} />;
        if (name.includes('network')) return <Network size={24} />;

        // Category fallbacks
        switch (cat) {
            case 'communication': return <MessageSquare size={24} />;
            case 'security': return <Shield size={24} />;
            case 'monitoring': return <Activity size={24} />;
            case 'analytics': return <BarChart2 size={24} />;
            case 'productivity': return <LayoutGrid size={24} />;
            case 'development': return <Code size={24} />;
            case 'media': return <ImageIcon size={24} />;
            case 'settings': return <Settings size={24} />;
            case 'data': return <Database size={24} />;
            case 'ai': return <Cpu size={24} />;
            default: return <Zap size={24} />;
        }
    };

    // Helper for Bot Icon since Lucide 'Bot' might collide or be preferred custom
    const BotIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
            <rect width="14" height="14" x="5" y="8" rx="2" />
            <path d="M9 13v2" /><path d="M15 13v2" />
        </svg>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#051e3c]/95 backdrop-blur-xl animate-in fade-in duration-200">
            
            {/* Main Container */}
            <div className="w-full max-w-7xl h-[90vh] flex flex-col bg-[#0B3E6F]/30 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
                
                {/* Header */}
                <div className="shrink-0 h-20 flex items-center justify-between px-8 border-b border-white/10 bg-[#0B3E6F]/40 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B5CB] to-[#00677F] flex items-center justify-center shadow-lg shadow-[#00B5CB]/20">
                            <LayoutGrid size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Widget Gallery</h2>
                            <p className="text-xs text-gray-400">Vælg widgets til dit workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1 max-w-xl mx-8">
                        <div className="relative w-full group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00B5CB] transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Søg efter widgets..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB]/50 focus:bg-black/30 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Categories Sidebar */}
                    <div className="w-64 border-r border-white/10 bg-[#0B3E6F]/20 flex flex-col overflow-y-auto py-6 px-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Kategorier</h3>
                        <div className="space-y-1">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between
                                        ${selectedCategory === cat 
                                            ? 'bg-[#00B5CB]/20 text-[#00B5CB] border border-[#00B5CB]/20' 
                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                                        }
                                    `}
                                >
                                    <span className="capitalize">{cat === 'all' ? 'Alle Widgets' : cat}</span>
                                    {selectedCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-[#00B5CB]" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-transparent to-[#051e3c]/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredWidgets.map(widget => {
                                const isActive = activeWidgets.includes(widget.id);
                                
                                return (
                                    <div 
                                        key={widget.id}
                                        className="group flex flex-col bg-[#0B3E6F]/40 hover:bg-[#0B3E6F]/60 border border-white/10 hover:border-[#00B5CB]/30 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-300 group-hover:bg-[#00B5CB]/20 group-hover:text-[#00B5CB]'}`}>
                                                {getWidgetIcon(widget)}
                                            </div>
                                            {isActive && (
                                                <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-[10px] font-medium border border-green-500/20 flex items-center gap-1">
                                                    <Check size={10} />
                                                    Tilføjet
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#00B5CB] transition-colors line-clamp-1">
                                            {widget.name}
                                        </h3>
                                        
                                        <p className="text-sm text-gray-400 font-light leading-relaxed line-clamp-2 mb-4 flex-1">
                                            {widget.description}
                                        </p>

                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                                            <span className="text-xs font-mono text-gray-500">
                                                {widget.defaultLayout?.w || 6}x{widget.defaultLayout?.h || 4}
                                            </span>
                                            
                                            <button
                                                onClick={() => onAddWidget(widget.id)}
                                                disabled={isActive}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5
                                                    ${isActive
                                                        ? 'opacity-0 cursor-default'
                                                        : 'bg-white/5 hover:bg-[#00B5CB] text-white hover:text-[#051e3c] border border-white/10 hover:border-[#00B5CB]'
                                                    }
                                                `}
                                            >
                                                <Plus size={14} />
                                                Tilføj
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredWidgets.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Search size={48} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium">Ingen widgets fundet</p>
                                <p className="text-sm">Prøv en anden søgning eller kategori</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
