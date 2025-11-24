import React, { useState } from 'react';
import { X, Plus, Search, Grid, List, Check } from 'lucide-react';
import { WIDGET_CATEGORIES } from '../widgetRegistry';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';

interface WidgetSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onAddWidget: (widgetId: string) => void;
    activeWidgets?: string[];
}

export default function WidgetSelector({ isOpen, onClose, onAddWidget, activeWidgets = [] }: WidgetSelectorProps) {
    const { availableWidgets } = useWidgetRegistry();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const filteredWidgets = availableWidgets.filter(widget => {
        const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (widget.description && widget.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const isWidgetActive = (widgetId: string) => activeWidgets.includes(widgetId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-[800px] h-[600px] bg-[#2d2d2d] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#323232]">
                    <h2 className="text-lg font-semibold text-white">Add Widgets</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Search & Categories */}
                <div className="p-4 border-b border-white/5 bg-[#2d2d2d] space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search widgets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#1e1e1e] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-white/5'}`}
                        >
                            All
                        </button>
                        {Object.entries(WIDGET_CATEGORIES).map(([key, category]: [string, any]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${selectedCategory === key ? 'bg-blue-600 text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-white/5'}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Widget Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#1e1e1e]">
                    <div className="grid grid-cols-2 gap-4">
                        {filteredWidgets.map(widget => (
                            <div
                                key={widget.id}
                                onClick={() => onAddWidget(widget.id)}
                                className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 ${isWidgetActive(widget.id) ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#2d2d2d] border-white/5 hover:bg-[#323232] hover:border-white/10'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isWidgetActive(widget.id) ? 'bg-blue-500 text-white' : 'bg-[#1e1e1e] text-gray-400 group-hover:text-white'}`}>
                                        <Grid size={20} />
                                    </div>
                                    {isWidgetActive(widget.id) && (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-1">{widget.name}</h3>
                                    <p className="text-xs text-gray-400 line-clamp-2">{widget.description}</p>
                                </div>
                                <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/5">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{WIDGET_CATEGORIES[widget.category]?.name}</span>
                                    <span className="text-[10px] text-gray-500">{widget.defaultLayout?.w || 6} × {widget.defaultLayout?.h || 4}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredWidgets.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p>No widgets found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
