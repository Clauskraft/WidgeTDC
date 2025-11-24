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

export default function WidgeTDCPro() {
    const { availableWidgets } = useWidgetRegistry();
    const { widgets, addWidget, removeWidget } = useWidgetStore();

    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState('work'); // 'work' or 'web'
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);
    const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');

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

    return (
        <div className={`h-screen w-full overflow-hidden flex font-segoe ${isDarkMode ? 'bg-[#202020] text-white' : 'bg-[#f3f3f3] text-black'}`}>

            {/* Copilot Sidebar (Right Side in Windows, but here we use it as main nav/chat) */}
            <aside className={`w-[400px] flex flex-col border-r border-white/10 bg-[#2c2c2c]/95 backdrop-blur-xl shadow-2xl z-50 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute'}`}>

                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                            <MessageSquare size={18} className="text-white" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight">Copilot</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><MoreHorizontal size={20} className="text-gray-400" /></button>
                    </div>
                </div>

                {/* Toggle Switch */}
                <div className="px-6 py-4">
                    <div className="flex p-1 bg-black/20 rounded-full border border-white/5">
                        <button
                            onClick={() => setActiveTab('work')}
                            className={`flex-1 py-1.5 px-4 rounded-full text-sm font-medium transition-all ${activeTab === 'work' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            Work
                        </button>
                        <button
                            onClick={() => setActiveTab('web')}
                            className={`flex-1 py-1.5 px-4 rounded-full text-sm font-medium transition-all ${activeTab === 'web' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            Web
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Welcome Message */}
                    <div className="flex gap-4 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 shrink-0 flex items-center justify-center">
                            <MessageSquare size={14} className="text-white" />
                        </div>
                        <div className="space-y-2">
                            <div className="bg-[#3d3d3d] p-4 rounded-2xl rounded-tl-none border border-white/5 shadow-sm">
                                <p className="text-sm leading-relaxed text-gray-200">
                                    Hi Claus, I'm your WidgeTDC Copilot. I can help you manage your widgets, analyze data, and automate tasks.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-[#3d3d3d] hover:bg-[#4d4d4d] border border-white/5 rounded-lg text-xs text-gray-300 transition-colors">
                                    Show active agents
                                </button>
                                <button className="px-3 py-1.5 bg-[#3d3d3d] hover:bg-[#4d4d4d] border border-white/5 rounded-lg text-xs text-gray-300 transition-colors">
                                    Add new widget
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* User Message Example */}
                    <div className="flex gap-4 flex-row-reverse animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="w-8 h-8 rounded-full bg-gray-600 shrink-0 flex items-center justify-center text-xs font-bold">CK</div>
                        <div className="bg-blue-600/20 p-4 rounded-2xl rounded-tr-none border border-blue-500/30">
                            <p className="text-sm leading-relaxed text-white">
                                Show me the status of the semantic search integration.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 pt-2">
                    <div className="relative bg-[#3d3d3d] rounded-3xl border border-white/10 shadow-lg focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                        <textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="w-full bg-transparent border-none text-sm text-white placeholder-gray-400 p-4 pr-12 min-h-[50px] max-h-[150px] resize-none focus:ring-0"
                            rows={1}
                        />
                        <div className="flex items-center justify-between px-2 pb-2">
                            <div className="flex gap-1">
                                <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                    <ImageIcon size={18} />
                                </button>
                                <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                    <Mic size={18} />
                                </button>
                            </div>
                            <button className={`p-2 rounded-full transition-all ${chatInput ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-gray-500 mt-3">
                        AI-generated content may be incorrect.
                    </p>
                </div>
            </aside>

            {/* Main Workspace (Canvas) */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[#1e1e1e]">
                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#252525]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="text-sm font-semibold text-gray-300">WidgeTDC Workspace</h1>
                    </div>

                    {/* Discrete Icons for Widgets & Settings */}
                    <div className="flex items-center gap-2">
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
                        <button
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Widget Grid */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {/* Background Glows */}
                    <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

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
                                <div key={w.id} className="bg-[#2d2d2d] border border-white/5 rounded-xl overflow-hidden shadow-lg flex flex-col group">
                                    <div className="h-8 bg-[#323232] border-b border-white/5 flex items-center justify-between px-3 widget-drag-handle cursor-grab active:cursor-grabbing">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-xs font-medium text-gray-400">{availableWidgets.find(aw => aw.id === w.widgetType)?.name}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setSettingsWidgetId(w.id)} className="p-1 hover:bg-white/10 rounded"><Settings size={12} className="text-gray-400" /></button>
                                            <button onClick={() => removeWidget(w.id)} className="p-1 hover:bg-red-500/20 rounded"><Trash2 size={12} className="text-gray-400 hover:text-red-400" /></button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden relative">
                                        {renderWidget(w)}
                                    </div>
                                </div>
                            ))}
                        </GridLayout>
                    )}
                </div>
            </main>

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
        </div>
    );
}
