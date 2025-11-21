import React, { useState } from 'react';
import { X, Plus, Search, Grid, List } from 'lucide-react';
import { WIDGET_REGISTRY, WIDGET_CATEGORIES, getAllWidgets, getWidgetsByCategory } from '../widgetRegistry';
import AcrylicCard from './AcrylicCard';

export default function WidgetSelector({ isOpen, onClose, onAddWidget, activeWidgets = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const allWidgets = getAllWidgets();

    const filteredWidgets = allWidgets.filter(widget => {
        const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            widget.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const isWidgetActive = (widgetId) => activeWidgets.includes(widgetId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Widget Gallery</h2>
                        <p className="text-sm text-slate-400 mt-1">{filteredWidgets.length} widgets available</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="p-6 border-b border-white/10 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search widgets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === 'all'
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                                }`}
                        >
                            All ({allWidgets.length})
                        </button>
                        {Object.entries(WIDGET_CATEGORIES).map(([key, category]) => {
                            const count = getWidgetsByCategory(key).length;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCategory(key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === key
                                            ? 'bg-teal-500 text-white'
                                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {category.name} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                            {filteredWidgets.filter(w => isWidgetActive(w.id)).length} active
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Widget Grid/List */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredWidgets.map(widget => (
                                <WidgetCard
                                    key={widget.id}
                                    widget={widget}
                                    isActive={isWidgetActive(widget.id)}
                                    onToggle={() => onAddWidget(widget.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredWidgets.map(widget => (
                                <WidgetListItem
                                    key={widget.id}
                                    widget={widget}
                                    isActive={isWidgetActive(widget.id)}
                                    onToggle={() => onAddWidget(widget.id)}
                                />
                            ))}
                        </div>
                    )}

                    {filteredWidgets.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-400">No widgets found matching your criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function WidgetCard({ widget, isActive, onToggle }) {
    const category = WIDGET_CATEGORIES[widget.category];

    return (
        <div className={`group relative p-4 rounded-lg border transition-all cursor-pointer ${isActive
                ? 'bg-teal-500/20 border-teal-500/50 ring-2 ring-teal-500/30'
                : 'bg-slate-800/30 border-white/10 hover:bg-slate-800/50 hover:border-white/20'
            }`}
            onClick={onToggle}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-teal-500/30' : 'bg-slate-700/50'}`}>
                    <div className="w-6 h-6 text-teal-400">
                        {/* Icon placeholder - would use lucide-react icons */}
                        <div className="w-full h-full rounded bg-teal-500/20" />
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${isActive ? 'bg-teal-500 text-white' : 'bg-slate-700/50 text-slate-300'
                    }`}>
                    {isActive ? 'Active' : 'Add'}
                </div>
            </div>

            <h3 className="text-white font-semibold mb-1">{widget.name}</h3>
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{widget.description}</p>

            <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded bg-${category.color}-500/20 text-${category.color}-400`}>
                    {category.name}
                </span>
                <span className="text-slate-500">
                    {widget.defaultSize.w}×{widget.defaultSize.h}
                </span>
            </div>
        </div>
    );
}

function WidgetListItem({ widget, isActive, onToggle }) {
    const category = WIDGET_CATEGORIES[widget.category];

    return (
        <div
            className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${isActive
                    ? 'bg-teal-500/20 border-teal-500/50'
                    : 'bg-slate-800/30 border-white/10 hover:bg-slate-800/50 hover:border-white/20'
                }`}
            onClick={onToggle}
        >
            <div className={`p-2 rounded-lg ${isActive ? 'bg-teal-500/30' : 'bg-slate-700/50'}`}>
                <div className="w-6 h-6 text-teal-400">
                    <div className="w-full h-full rounded bg-teal-500/20" />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold">{widget.name}</h3>
                <p className="text-sm text-slate-400 truncate">{widget.description}</p>
            </div>

            <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs bg-${category.color}-500/20 text-${category.color}-400`}>
                    {category.name}
                </span>
                <span className="text-xs text-slate-500">
                    {widget.defaultSize.w}×{widget.defaultSize.h}
                </span>
                <div className={`px-3 py-1 rounded text-sm font-medium ${isActive ? 'bg-teal-500 text-white' : 'bg-slate-700/50 text-slate-300'
                    }`}>
                    {isActive ? 'Active' : 'Add'}
                </div>
            </div>
        </div>
    );
}
