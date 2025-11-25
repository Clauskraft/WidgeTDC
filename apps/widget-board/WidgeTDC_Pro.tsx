import React, { useState, useEffect, Suspense, useRef } from 'react';
import { LayoutGrid, Shield, Network, FileText, Sun, Moon, Menu, X, Search, Plus, Settings, Trash2, Zap, MessageSquare, Mic, Image as ImageIcon, Send, MoreHorizontal, RefreshCw } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetSelector from './components/WidgetSelector';
import AgentPanel from './components/AgentPanel';
import WidgetConfigModal from './components/WidgetConfigModal';
import { useWidgetRegistry } from './contexts/WidgetRegistryContext';
import { useWidgetStore } from './components/widgetStore';
import { WidgetInstance } from './types';
import { AdminDashboard } from './src/components/AdminDashboard';
import { ClausLogo } from './src/components/ClausLogo';
import { MainLayout } from './src/components/MainLayout';

export default function WidgeTDCPro() {
    const { availableWidgets } = useWidgetRegistry();
    const { widgets, addWidget, removeWidget } = useWidgetStore();

    const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);
    const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);

    // Load widget layout from localStorage
    const [layout, setLayout] = useState<any[]>(() => {
        const saved = localStorage.getItem('widgetLayout');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync layout with widgets
    useEffect(() => {
        setLayout(prevLayout => {
            const currentWidgetIds = new Set(widgets.map(w => w.id));
            const newLayout = prevLayout.filter(item => currentWidgetIds.has(item.i));
            let hasChanges = newLayout.length !== prevLayout.length;

            widgets.forEach(widget => {
                if (!newLayout.find(item => item.i === widget.id)) {
                    const def = availableWidgets.find(w => w.id === widget.widgetType);
                    const size = def?.defaultLayout || { w: 6, h: 4 };
                    const maxY = newLayout.length > 0 ? Math.max(...newLayout.map(item => item.y + item.h)) : 0;
                    newLayout.push({ i: widget.id, x: 0, y: maxY, w: size.w, h: size.h, minW: 2, minH: 2 });
                    hasChanges = true;
                }
            });
            return hasChanges ? newLayout : prevLayout;
        });
    }, [widgets, availableWidgets]);

    const onLayoutChange = (newLayout: any[]) => {
        setLayout(newLayout);
        localStorage.setItem('widgetLayout', JSON.stringify(newLayout));
    };

    const handleToggleWidget = (widgetType: string) => {
        const existing = widgets.find(w => w.widgetType === widgetType);
        if (existing) removeWidget(existing.id);
        else addWidget(widgetType);
    };

    const renderWidget = (widgetInstance: WidgetInstance) => {
        const registryEntry = availableWidgets.find(w => w.id === widgetInstance.widgetType);
        if (!registryEntry) return <div className="p-4 text-slate-400">Widget type not found</div>;
        const WidgetComponent = registryEntry.component;
        return (
            <Suspense fallback={<div className="h-full flex items-center justify-center text-slate-400">Loading...</div>}>
                <WidgetComponent widgetId={widgetInstance.id} config={widgetInstance.config} />
            </Suspense>
        );
    };

    const headerActions = (
        <>
            <button
                onClick={() => setIsWidgetSelectorOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Add Widget"
            >
                <Plus size={20} />
            </button>
            <button
                onClick={() => setIsAgentPanelOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Agents"
            >
                <Zap size={20} />
            </button>
        </>
    );

    return (
        <MainLayout title="WidgeTDC Workspace" headerActions={headerActions}>
            {widgets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                        <LayoutGrid size={48} className="text-gray-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">Your canvas is empty</h2>
                    <p className="text-gray-500 max-w-sm mb-8">Add widgets to create your personalized dashboard.</p>
                    <button onClick={() => setIsWidgetSelectorOpen(true)} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium transition-all">
                        Open Widget Library
                    </button>
                </div>
            ) : (
                <GridLayout
                    className="layout"
                    layout={layout}
                    cols={12}
                    rowHeight={100}
                    width={1200}
                    onLayoutChange={onLayoutChange}
                    isDraggable={true}
                    isResizable={true}
                    draggableHandle=".widget-drag-handle"
                >
                    {widgets.map(w => (
                        <div key={w.id} className="bg-[#0B3E6F]/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-[#00B5CB]/30 transition-colors duration-300">
                            <div className="h-9 bg-white/5 border-b border-white/5 flex items-center justify-between px-3 widget-drag-handle cursor-grab active:cursor-grabbing">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#00B5CB] shadow-[0_0_5px_#00B5CB]" />
                                    <span className="text-xs font-medium text-gray-200 tracking-wide">{availableWidgets.find(aw => aw.id === w.widgetType)?.name}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button onClick={() => setSettingsWidgetId(w.id)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Settings size={12} /></button>
                                    <button onClick={() => removeWidget(w.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                {renderWidget(w)}
                            </div>
                        </div>
                    ))}
                </GridLayout>
            )}

            {/* Modals */}
            <WidgetSelector isOpen={isWidgetSelectorOpen} onClose={() => setIsWidgetSelectorOpen(false)} onAddWidget={handleToggleWidget} activeWidgets={widgets.map(w => w.widgetType)} />

            {isAgentPanelOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2d2d2d] border border-white/10 rounded-2xl p-6 w-[800px] max-h-[80vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Autonomous Agents</h2>
                            <button onClick={() => setIsAgentPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} /></button>
                        </div>
                        <AgentPanel onAgentSelect={(a) => setSelectedAgent(a.id)} selectedAgentId={selectedAgent || undefined} />
                    </div>
                </div>
            )}

            {settingsWidgetId && (
                <WidgetConfigModal
                    isOpen={!!settingsWidgetId}
                    onClose={() => setSettingsWidgetId(null)}
                    widgetId={settingsWidgetId}
                    widgetName={availableWidgets.find(w => w.id === widgets.find(wi => wi.id === settingsWidgetId)?.widgetType)?.name || 'Widget'}
                    initialConfig={widgets.find(w => w.id === settingsWidgetId)?.config}
                    onSave={(newConfig) => {
                        const { updateWidgetConfig } = useWidgetStore.getState();
                        updateWidgetConfig(settingsWidgetId, newConfig);
                    }}
                />
            )}
        </MainLayout>
    );
}
