import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { LayoutGrid, Settings, Trash2, Zap, Plus, X } from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import WidgetSelector from './components/WidgetSelector';
import AgentPanel from './components/AgentPanel';
import WidgetConfigModal from './components/WidgetConfigModal';
import { useWidgetRegistry } from './contexts/WidgetRegistryContext';
import { useWidgetStore } from './components/widgetStore';
import { WidgetInstance } from './types';
import { MainLayout } from './src/components/MainLayout';

// Create responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive);

// Responsive breakpoints matching Tailwind
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

export default function WidgeTDCPro() {
    const { availableWidgets } = useWidgetRegistry();
    const { widgets, addWidget, removeWidget } = useWidgetStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);
    const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);

    // Measure container width for responsive grid
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Load widget layout from localStorage
    const [layouts, setLayouts] = useState<ReactGridLayout.Layouts>(() => {
        const saved = localStorage.getItem('widgetLayouts');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {};
            }
        }
        return {};
    });

    // Generate layout for current widgets
    const generateLayout = useCallback((widgetList: WidgetInstance[]) => {
        return widgetList.map((widget, index) => {
            const def = availableWidgets.find(w => w.id === widget.widgetType);
            const size = def?.defaultLayout || { w: 6, h: 4 };

            // Calculate position in a grid pattern
            const cols = 12;
            const x = (index * size.w) % cols;
            const y = Math.floor((index * size.w) / cols) * size.h;

            return {
                i: widget.id,
                x,
                y,
                w: size.w,
                h: size.h,
                minW: 2,
                minH: 2,
            };
        });
    }, [availableWidgets]);

    // Sync layouts with widgets
    useEffect(() => {
        const currentWidgetIds = new Set(widgets.map(w => w.id));

        setLayouts(prevLayouts => {
            const newLayouts: ReactGridLayout.Layouts = {};

            // For each breakpoint, update the layout
            Object.keys(BREAKPOINTS).forEach(breakpoint => {
                const existingLayout = prevLayouts[breakpoint] || [];
                const filteredLayout = existingLayout.filter(item => currentWidgetIds.has(item.i));

                // Add new widgets
                widgets.forEach(widget => {
                    if (!filteredLayout.find(item => item.i === widget.id)) {
                        const def = availableWidgets.find(w => w.id === widget.widgetType);
                        const size = def?.defaultLayout || { w: 6, h: 4 };
                        const maxY = filteredLayout.length > 0
                            ? Math.max(...filteredLayout.map(item => item.y + item.h))
                            : 0;

                        // Adjust width for smaller breakpoints
                        const cols = COLS[breakpoint as keyof typeof COLS];
                        const adjustedW = Math.min(size.w, cols);

                        filteredLayout.push({
                            i: widget.id,
                            x: 0,
                            y: maxY,
                            w: adjustedW,
                            h: size.h,
                            minW: Math.min(2, cols),
                            minH: 2,
                        });
                    }
                });

                newLayouts[breakpoint] = filteredLayout;
            });

            return newLayouts;
        });
    }, [widgets, availableWidgets]);

    const onLayoutChange = (_currentLayout: ReactGridLayout.Layout[], allLayouts: ReactGridLayout.Layouts) => {
        setLayouts(allLayouts);
        localStorage.setItem('widgetLayouts', JSON.stringify(allLayouts));
    };

    const handleToggleWidget = (widgetType: string) => {
        const existing = widgets.find(w => w.widgetType === widgetType);
        if (existing) removeWidget(existing.id);
        else addWidget(widgetType);
    };

    const renderWidget = (widgetInstance: WidgetInstance) => {
        const registryEntry = availableWidgets.find(w => w.id === widgetInstance.widgetType);
        if (!registryEntry) {
            return (
                <div className="p-4 text-slate-400 flex items-center justify-center h-full">
                    <span className="text-sm">Widget type not found</span>
                </div>
            );
        }
        const WidgetComponent = registryEntry.component;
        return (
            <Suspense fallback={
                <div className="h-full flex items-center justify-center text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#00B5CB] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                    </div>
                </div>
            }>
                <WidgetComponent widgetId={widgetInstance.id} config={widgetInstance.config} />
            </Suspense>
        );
    };

    const headerActions = (
        <>
            <button
                onClick={() => setIsWidgetSelectorOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors touch-target"
                title="Add Widget"
                aria-label="Tilføj widget"
            >
                <Plus size={20} />
            </button>
            <button
                onClick={() => setIsAgentPanelOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors touch-target"
                title="Agents"
                aria-label="Åbn agent panel"
            >
                <Zap size={20} />
            </button>
        </>
    );

    // Determine if we're on mobile
    const isMobile = containerWidth < 768;
    const rowHeight = isMobile ? 80 : 100;

    return (
        <MainLayout title="WidgeTDC Workspace" headerActions={headerActions}>
            <div ref={containerRef} className="w-full h-full">
                {widgets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 px-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-4 md:mb-6 border border-white/10">
                            <LayoutGrid size={40} className="text-gray-500 md:w-12 md:h-12" />
                        </div>
                        <h2 className="text-lg md:text-xl font-semibold text-gray-300 mb-2">Dit canvas er tomt</h2>
                        <p className="text-gray-500 max-w-sm mb-6 md:mb-8 text-sm md:text-base">Tilføj widgets for at oprette dit personlige dashboard.</p>
                        <button
                            onClick={() => setIsWidgetSelectorOpen(true)}
                            className="px-5 md:px-6 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium transition-all touch-target active:scale-95"
                        >
                            Åbn Widget Bibliotek
                        </button>
                    </div>
                ) : (
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={layouts}
                        breakpoints={BREAKPOINTS}
                        cols={COLS}
                        rowHeight={rowHeight}
                        onLayoutChange={onLayoutChange}
                        isDraggable={!isMobile}
                        isResizable={!isMobile}
                        draggableHandle=".widget-drag-handle"
                        margin={isMobile ? [12, 12] : [16, 16]}
                        containerPadding={isMobile ? [8, 8] : [16, 16]}
                        useCSSTransforms={true}
                    >
                        {widgets.map(w => (
                            <div
                                key={w.id}
                                className="bg-[#0B3E6F]/30 backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-[#00B5CB]/30 transition-colors duration-300"
                            >
                                {/* Widget Header */}
                                <div className="h-8 md:h-9 bg-white/5 border-b border-white/5 flex items-center justify-between px-2 md:px-3 widget-drag-handle cursor-grab active:cursor-grabbing shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#00B5CB] shadow-[0_0_5px_#00B5CB]" />
                                        <span className="text-[10px] md:text-xs font-medium text-gray-200 tracking-wide truncate max-w-[120px] md:max-w-none">
                                            {availableWidgets.find(aw => aw.id === w.widgetType)?.name}
                                        </span>
                                    </div>
                                    <div className="flex gap-0.5 md:gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => setSettingsWidgetId(w.id)}
                                            className="p-1 md:p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors touch-target"
                                            aria-label="Widget indstillinger"
                                        >
                                            <Settings size={12} />
                                        </button>
                                        <button
                                            onClick={() => removeWidget(w.id)}
                                            className="p-1 md:p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors touch-target"
                                            aria-label="Fjern widget"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                {/* Widget Content */}
                                <div className="flex-1 overflow-hidden relative">
                                    {renderWidget(w)}
                                </div>
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                )}
            </div>

            {/* Widget Selector Modal */}
            <WidgetSelector
                isOpen={isWidgetSelectorOpen}
                onClose={() => setIsWidgetSelectorOpen(false)}
                onAddWidget={handleToggleWidget}
                activeWidgets={widgets.map(w => w.widgetType)}
            />

            {/* Agent Panel Modal */}
            {isAgentPanelOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
                    onClick={(e) => e.target === e.currentTarget && setIsAgentPanelOpen(false)}
                >
                    <div className="relative w-full max-w-5xl">
                        <button
                            onClick={() => setIsAgentPanelOpen(false)}
                            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors touch-target"
                            aria-label="Luk agent panel"
                        >
                            <X size={24} />
                        </button>
                        <AgentPanel
                            onAgentSelect={(a) => setSelectedAgent(a.id)}
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
                        const { updateWidgetConfig } = useWidgetStore.getState();
                        updateWidgetConfig(settingsWidgetId, newConfig);
                    }}
                />
            )}
        </MainLayout>
    );
}
