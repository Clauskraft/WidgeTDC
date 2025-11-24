import React, { useState, useEffect, Suspense } from 'react';
import { LayoutGrid, Shield, Network, FileText, Sun, Moon, Menu, X, Search, Plus, Settings, Trash2, Zap } from 'lucide-react';
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

// Dynamic widget loader is handled by Registry Context now

export default function WidgeTDCPro() {
    const { availableWidgets } = useWidgetRegistry();
    const { widgets, addWidget, removeWidget } = useWidgetStore();

    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
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

            // 1. Keep existing layout items for active widgets
            const newLayout = prevLayout.filter(item => currentWidgetIds.has(item.i));

            // 2. Add new layout items for new widgets
            let hasChanges = newLayout.length !== prevLayout.length;

            widgets.forEach(widget => {
                if (!newLayout.find(item => item.i === widget.id)) {
                    const def = availableWidgets.find(w => w.id === widget.widgetType);
                    const size = def?.defaultLayout || { w: 6, h: 4 };

                    // Find next available position (simple stacking)
                    const maxY = newLayout.length > 0 ? Math.max(...newLayout.map(item => item.y + item.h)) : 0;

                    newLayout.push({
                        i: widget.id,
                        x: 0,
                        y: maxY,
                        w: size.w,
                        h: size.h,
                        minW: 2,
                        minH: 2
                    });
                    hasChanges = true;
                }
            });

            return hasChanges ? newLayout : prevLayout;
        });
    }, [widgets, availableWidgets]);

    // Save layout changes
    const onLayoutChange = (newLayout: any[]) => {
        setLayout(newLayout);
        localStorage.setItem('widgetLayout', JSON.stringify(newLayout));
    };

    const handleToggleWidget = (widgetType: string) => {
        // Check if we already have an instance of this type
        // For now, we treat the selector as a toggle for a single instance per type
        // But the system supports multiple.
        const existing = widgets.find(w => w.widgetType === widgetType);
        if (existing) {
            removeWidget(existing.id);
        } else {
            addWidget(widgetType);
        }
    };

    const renderWidget = (widgetInstance: WidgetInstance) => {
        const registryEntry = availableWidgets.find(w => w.id === widgetInstance.widgetType);

        if (!registryEntry) {
            return <div className="p-4 text-slate-400">Widget type not found: {widgetInstance.widgetType}</div>;
        }

        const WidgetComponent = registryEntry.component;

        return (
            <Suspense
                fallback={
                    <div className="h-full flex items-center justify-center bg-slate-800/30 rounded-lg border border-white/10">
                        <div className="text-slate-400">
                            Loading {registryEntry.name}...
                        </div>
                    </div>
                }
            >
                <WidgetComponent
                    widgetId={widgetInstance.id}
                    config={widgetInstance.config}
                />
            </Suspense>
        );
    };

    return (
        <div className={`min-h-screen font-sans selection:bg-teal-500/30 flex overflow-hidden relative transition-colors duration-700 ${isDarkMode ? 'bg-[#050505] text-slate-200' : 'bg-[#f2f6fa] text-slate-800'}`}>

            {/* Dynamic Background Mesh */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {isDarkMode ? (
                    <>
                        <div className="absolute top-[-10%] left-[20%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] opacity-40 animate-pulse duration-[10s]" />
                        <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-teal-900/10 rounded-full blur-[100px] opacity-30" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
                    </>
                ) : (
                    <>
                        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-300/20 rounded-full blur-[120px] opacity-60 animate-pulse duration-[15s] mix-blend-multiply" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-teal-200/40 rounded-full blur-[120px] opacity-50 mix-blend-multiply" />
                        <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] bg-white rounded-full blur-[80px] opacity-80" />
                    </>
                )}
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-20 flex flex-col items-center py-6 border-r transition-all duration-500 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDarkMode ? 'ms-acrylic border-white/5' : 'ms-acrylic border-white/40'}`}>
                <div className="w-12 h-12 mb-8 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border border-white/10 text-white font-bold text-xl shrink-0 bg-gradient-to-br from-blue-600 to-violet-600 animate-glow-pulse">
                    W
                </div>
                <nav className="flex-1 space-y-6 w-full px-3 flex flex-col items-center">
                    {[{ id: 'dashboard', icon: LayoutGrid, label: 'Widgets' }, { id: 'security', icon: Shield, label: 'Defense' }, { id: 'network', icon: Network, label: 'Net' }, { id: 'compliance', icon: FileText, label: 'Docs' }, { id: 'admin', icon: Settings, label: 'Admin' }].map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={item.label}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative stagger-item ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-110' : 'text-slate-400 hover:bg-white/10 hover:text-white hover:scale-105'}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <item.icon size={22} className={`transition-transform duration-300 ${activeTab === item.id ? 'rotate-0' : 'group-hover:rotate-12'}`} />
                            {activeTab === item.id && <div className="absolute -right-1 top-3 bottom-3 w-1 bg-white/50 rounded-full" />}
                        </button>
                    ))}
                </nav>
                <div className="space-y-4 w-full px-3 mb-4 flex flex-col items-center">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover-lift ${isDarkMode ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-600 bg-slate-200'}`} title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white/20 shadow-lg flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-110 transition-transform">CK</div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
                {/* Header */}
                <header className="h-20 px-8 flex items-center justify-between shrink-0 ms-acrylic border-b border-white/5 mx-4 mt-4 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500 hover:text-primary transition-colors">
                            {isSidebarOpen ? <X /> : <Menu />}
                        </button>
                        <div>
                            <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400' : 'text-slate-800'}`}>
                                Claus' <span className="font-light opacity-70">Workspace</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-mono text-slate-500">SYSTEM ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden md:block">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Global Search..."
                                className={`rounded-xl pl-10 pr-4 py-2.5 text-sm w-64 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:w-80 ${isDarkMode ? 'bg-black/20 border border-white/10 text-slate-200 placeholder-slate-500 focus:bg-black/40' : 'bg-white/50 border border-slate-200 text-slate-700 focus:bg-white'}`}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsAgentPanelOpen(true)}
                                className="btn-secondary flex items-center gap-2 hover-lift"
                            >
                                <Zap size={18} className="text-amber-400" />
                                <span className="hidden md:inline">Agents</span>
                            </button>

                            <button
                                onClick={() => setIsWidgetSelectorOpen(true)}
                                className="btn-primary flex items-center gap-2 hover-lift"
                            >
                                <Plus size={18} />
                                <span className="hidden md:inline">Add Widget</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Widget Grid Area */}
                <div className={`flex-1 overflow-y-auto p-4 scrollbar-thin ${isDarkMode ? 'scrollbar-track-slate-900 scrollbar-thumb-slate-700' : 'scrollbar-track-slate-100 scrollbar-thumb-slate-300'}`}>
                    {activeTab === 'admin' ? (
                        <AdminDashboard />
                    ) : (
                        <div className="max-w-[1920px] mx-auto min-h-full">

                            {/* Empty State */}
                            {widgets.length === 0 ? (
                                <div className="h-[70vh] flex flex-col items-center justify-center animate-fade-in">
                                    <div className="relative mb-8 group cursor-pointer" onClick={() => setIsWidgetSelectorOpen(true)}>
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500" />
                                        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                            <Plus size={40} className="text-primary" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                        Initialize Dashboard
                                    </h3>
                                    <p className="text-slate-500 mb-8 text-center max-w-md">
                                        Your workspace is empty. Add widgets to monitor agents, track metrics, and manage your workflow.
                                    </p>
                                    <button
                                        onClick={() => setIsWidgetSelectorOpen(true)}
                                        className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1"
                                    >
                                        Browse Widget Library
                                    </button>
                                </div>
                            ) : (
                                <GridLayout
                                    className="layout"
                                    layout={layout}
                                    cols={12}
                                    rowHeight={100}
                                    width={1760}
                                    onLayoutChange={onLayoutChange}
                                    isDraggable={true}
                                    isResizable={true}
                                    compactType="vertical"
                                    preventCollision={false}
                                    draggableHandle=".widget-drag-handle"
                                >
                                    {widgets.map(widgetInstance => {
                                        const registryEntry = availableWidgets.find(w => w.id === widgetInstance.widgetType);

                                        return (
                                            <div key={widgetInstance.id} className={`ms-widget-container flex flex-col overflow-hidden group ${isDarkMode ? 'bg-slate-900/40' : 'bg-white/60'}`}>
                                                {/* Widget Header */}
                                                <div className="ms-widget-header widget-drag-handle shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-md bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10">
                                                            {/* Icon placeholder - could be dynamic based on widget type */}
                                                            <div className="w-3 h-3 rounded-full bg-primary/80" />
                                                        </div>
                                                        <span className="ms-widget-title truncate">
                                                            {registryEntry?.name || 'Unknown Widget'}
                                                        </span>
                                                    </div>
                                                    <div className="ms-widget-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            onClick={() => setSettingsWidgetId(widgetInstance.id)}
                                                            className="ms-icon-button"
                                                            title="Settings"
                                                        >
                                                            <Settings size={14} className="text-slate-400 hover:text-white" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeWidget(widgetInstance.id)}
                                                            className="ms-icon-button hover:!bg-red-500/20 hover:!border-red-500/30"
                                                            title="Remove"
                                                        >
                                                            <Trash2 size={14} className="text-slate-400 hover:text-red-400" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Widget Content */}
                                                <div className="flex-1 overflow-hidden relative">
                                                    {renderWidget(widgetInstance)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </GridLayout>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-8 px-6 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <span>WIDGET_OS v2.5.0</span>
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            MCP_CONNECTED
                        </span>
                    </div>
                    <div>
                        MEMORY_USAGE: 24% | LATENCY: 12ms
                    </div>
                </div>
            </main>

            {/* Widget Selector Modal */}
            <WidgetSelector
                isOpen={isWidgetSelectorOpen}
                onClose={() => setIsWidgetSelectorOpen(false)}
                onAddWidget={handleToggleWidget}
                activeWidgets={widgets.map(w => w.widgetType)}
            />

            {/* Agent Panel Modal */}
            {isAgentPanelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="py-8">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setIsAgentPanelOpen(false)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode
                                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                            >
                                ✕ Close
                            </button>
                        </div>
                        <AgentPanel
                            onAgentSelect={(agent) => setSelectedAgent(agent.id)}
                            selectedAgentId={selectedAgent || undefined}
                        />
                    </div>
                </div>
            )}

            {/* Widget Config Modal */}
            {settingsWidgetId && (
                <WidgetConfigModal
                    isOpen={!!settingsWidgetId}
                    onClose={() => setSettingsWidgetId(null)}
                    widgetId={settingsWidgetId}
                    widgetName={availableWidgets.find(w => w.id === widgets.find(wi => wi.id === settingsWidgetId)?.widgetType)?.name || 'Widget'}
                    initialConfig={widgets.find(w => w.id === settingsWidgetId)?.config}
                    onSave={(newConfig) => {
                        // Assuming updateWidgetConfig is available from useWidgetStore
                        // If not explicitly destructured above, we need to add it to the hook call
                        const { updateWidgetConfig } = useWidgetStore.getState();
                        updateWidgetConfig(settingsWidgetId, newConfig);
                    }}
                />
            )}
        </div>
    );
}
