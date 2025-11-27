import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Settings, MessageSquare, Mic, Send, 
  MoreHorizontal, Mail, Calendar, Newspaper, Sparkles,
  ChevronDown, Moon, Sun, User, Bell, X, Maximize2, Minimize2,
  PanelRightClose, PanelRightOpen, LayoutGrid
} from 'lucide-react';
import { useWidgetRegistry } from './contexts/WidgetRegistryContext';
import { useWidgetStore } from './components/widgetStore';
import { WidgetInstance } from './types';
import { WidgetErrorBoundary } from './src/components/WidgetErrorBoundary';
import { Suspense } from 'react';

// ============================================
// LAYOUT CONFIGURATION
// ============================================
interface LayoutConfig {
  // Panel position: 'right' (slide-in) or 'inline' (embedded in main area)
  panelMode: 'overlay' | 'inline' | 'split';
  
  // Panel width for split/overlay modes
  panelWidth: number;
  
  // Show/hide suggestions
  showSuggestions: boolean;
  
  // Compact mode for smaller screens
  compactMode: boolean;
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  panelMode: 'inline',  // Default to inline - no overlay!
  panelWidth: 600,
  showSuggestions: true,
  compactMode: false,
};

// ============================================
// PINNED WIDGET ITEM
// ============================================
const PinnedWidgetItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
      ${isActive 
        ? 'bg-[#2D2D2D] text-white' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    title={label}
  >
    <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
    <span className="text-sm font-medium truncate">{label}</span>
  </button>
);

// ============================================
// SUGGESTION CARD
// ============================================
const SuggestionCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}> = ({ icon, iconBg, title, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="flex-1 min-w-[280px] max-w-[320px] p-4 bg-[#1A1A1A] hover:bg-[#242424] border border-white/10 
               hover:border-white/20 rounded-xl text-left transition-all duration-200 group"
  >
    <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">{title}</h3>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </button>
);

// ============================================
// CHAT INPUT
// ============================================
const ChatInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
}> = ({ value, onChange, onSend, onAttach }) => (
  <div className="w-full max-w-3xl mx-auto">
    <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden
                    focus-within:border-white/20 transition-colors">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
        placeholder="Send meddelelse til Copilot"
        className="w-full bg-transparent text-white placeholder-gray-500 px-5 py-4 pr-24
                   focus:outline-none text-base"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <button 
          onClick={onAttach}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Vedhæft fil"
        >
          <Plus size={20} />
        </button>
        <button 
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Stemmebesked"
        >
          <Mic size={20} />
        </button>
      </div>
    </div>
  </div>
);

// ============================================
// INLINE WIDGET PANEL (No overlay - embedded in layout)
// ============================================
const InlineWidgetPanel: React.FC<{
  widget: WidgetInstance;
  widgetComponent: React.ComponentType<any>;
  widgetName: string;
  onClose: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
  width: number;
}> = ({ widget, widgetComponent: WidgetComponent, widgetName, onClose, onMaximize, isMaximized, width }) => (
  <div 
    className={`h-full bg-[#0A0A0A] border-l border-white/10 flex flex-col transition-all duration-300`}
    style={{ width: isMaximized ? '100%' : width }}
  >
    {/* Header */}
    <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
      <span className="text-white font-medium truncate">{widgetName}</span>
      <div className="flex items-center gap-1">
        <button 
          onClick={onMaximize}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title={isMaximized ? 'Minimize' : 'Maximize'}
        >
          {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
    
    {/* Widget Content */}
    <div className="flex-1 overflow-auto p-4">
      <WidgetErrorBoundary widgetName={widgetName}>
        <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
          <WidgetComponent widgetId={widget.id} config={widget.config} />
        </Suspense>
      </WidgetErrorBoundary>
    </div>
  </div>
);

// ============================================
// OVERLAY WIDGET PANEL (Legacy - for those who prefer overlay)
// ============================================
const OverlayWidgetPanel: React.FC<{
  widget: WidgetInstance;
  widgetComponent: React.ComponentType<any>;
  widgetName: string;
  onClose: () => void;
  width: number;
}> = ({ widget, widgetComponent: WidgetComponent, widgetName, onClose, width }) => (
  <div className="fixed inset-0 z-50 flex">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    
    {/* Panel */}
    <div 
      className="relative ml-auto h-full bg-[#0A0A0A] border-l border-white/10 
                  shadow-2xl animate-in slide-in-from-right duration-300"
      style={{ width }}
    >
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
        <span className="text-white font-medium">{widgetName}</span>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="h-[calc(100%-3.5rem)] overflow-auto p-4">
        <WidgetErrorBoundary widgetName={widgetName}>
          <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
            <WidgetComponent widgetId={widget.id} config={widget.config} />
          </Suspense>
        </WidgetErrorBoundary>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COPILOT LAYOUT
// ============================================
export default function CopilotLayout() {
  const { availableWidgets } = useWidgetRegistry();
  const { widgets, addWidget } = useWidgetStore();
  
  const [chatInput, setChatInput] = useState('');
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Layout configuration from localStorage
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(() => {
    const saved = localStorage.getItem('widgettdc_copilot_layout');
    return saved ? { ...DEFAULT_LAYOUT_CONFIG, ...JSON.parse(saved) } : DEFAULT_LAYOUT_CONFIG;
  });

  const updateLayoutConfig = useCallback((updates: Partial<LayoutConfig>) => {
    setLayoutConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem('widgettdc_copilot_layout', JSON.stringify(newConfig));
      return newConfig;
    });
  }, []);
  
  // Pinned widgets for sidebar
  const pinnedWidgetTypes = [
    { id: 'chat', icon: <MessageSquare size={20} className="text-rose-400" />, label: 'Chat' },
    { id: 'agent-chat', icon: <Sparkles size={20} className="text-purple-400" />, label: 'Agent Chat' },
    { id: 'search-interface', icon: <Search size={20} className="text-blue-400" />, label: 'Søg' },
    { id: 'agent-monitor', icon: <MoreHorizontal size={20} className="text-green-400" />, label: 'Monitor' },
    { id: 'calendar', icon: <Calendar size={20} className="text-cyan-400" />, label: 'Kalender' },
    { id: 'mail', icon: <Mail size={20} className="text-yellow-400" />, label: 'Mail' },
    { id: 'news', icon: <Newspaper size={20} className="text-orange-400" />, label: 'Nyheder' },
  ];

  // Dynamic suggestions
  const suggestions = layoutConfig.showSuggestions ? [
    {
      icon: <Mail size={16} className="text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      title: 'Forklar fordelene og ulemperne ved en plantebaseret kost',
      subtitle: 'Kostmæssige tendenser',
    },
    {
      icon: <Sparkles size={16} className="text-orange-400" />,
      iconBg: 'bg-orange-500/20',
      title: 'Gennemgå den kode, der ikke kan kompileres, og angiv en...',
      subtitle: 'Ret og returner fungerende kode',
    },
    {
      icon: <Calendar size={16} className="text-purple-400" />,
      iconBg: 'bg-purple-500/20',
      title: 'Hvilke trin vil du anbefale, hvis jeg vil løse trafikpropper i...',
      subtitle: 'Planlæg løsningen',
    },
  ] : [];

  const handleSend = () => {
    if (!chatInput.trim()) return;
    console.log('Sending:', chatInput);
    setChatInput('');
  };

  const handleWidgetClick = (widgetType: string) => {
    let widget = widgets.find(w => w.widgetType === widgetType);
    if (!widget) {
      addWidget(widgetType);
      widget = useWidgetStore.getState().widgets.find(w => w.widgetType === widgetType);
    }
    if (widget) {
      setExpandedWidget(widget.id);
      setIsMaximized(false);
    }
  };

  const expandedWidgetData = expandedWidget 
    ? widgets.find(w => w.id === expandedWidget) 
    : null;
  
  const expandedWidgetDef = expandedWidgetData 
    ? availableWidgets.find(w => w.id === expandedWidgetData.widgetType)
    : null;

  // Calculate main content width based on panel state
  const hasActivePanel = expandedWidgetData && expandedWidgetDef && layoutConfig.panelMode !== 'overlay';
  const mainContentClass = hasActivePanel && !isMaximized 
    ? 'flex-1' 
    : 'flex-1';

  return (
    <div className="h-screen w-screen bg-[#0A0A0A] flex overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 h-full bg-[#0A0A0A] border-r border-white/5 flex flex-col shrink-0">
        {/* Search */}
        <div className="p-3">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 rounded-lg transition-colors">
            <Search size={18} />
            <span className="text-sm">Søg</span>
          </button>
        </div>

        {/* Chat - Main */}
        <div className="px-3 mb-2">
          <PinnedWidgetItem
            icon={<MessageSquare size={20} className="text-rose-400" />}
            label="Chat"
            isActive={true}
            onClick={() => {}}
          />
          <div className="pl-9 mt-1">
            <span className="text-xs text-gray-500">Samtaler</span>
          </div>
        </div>

        <div className="mx-3 my-2 border-t border-white/5" />

        {/* Opret & Apps */}
        <div className="px-3">
          <PinnedWidgetItem icon={<Plus size={20} className="text-gray-400" />} label="Opret" onClick={() => {}} />
        </div>
        <div className="px-3">
          <PinnedWidgetItem
            icon={<LayoutGrid size={20} className="text-gray-400" />}
            label="Apps"
            onClick={() => {}}
          />
        </div>

        <div className="mx-3 my-2 border-t border-white/5" />

        {/* Pinned Widgets */}
        <div className="flex-1 px-3 space-y-1 overflow-y-auto">
          {pinnedWidgetTypes.slice(3).map((item) => (
            <PinnedWidgetItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={expandedWidgetData?.widgetType === item.id}
              onClick={() => handleWidgetClick(item.id)}
            />
          ))}
        </div>

        {/* Settings */}
        <div className="p-3 border-t border-white/5">
          <PinnedWidgetItem
            icon={<Settings size={20} className="text-gray-400" />}
            label="Indstillinger"
            onClick={() => {}}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat/Welcome Area */}
        {(!hasActivePanel || !isMaximized) && (
          <main className={`${mainContentClass} flex flex-col ${hasActivePanel ? 'min-w-[400px]' : ''}`}>
            {/* Top Bar */}
            <header className="h-12 flex items-center justify-between px-4 gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {/* Panel Mode Toggle */}
                <button
                  onClick={() => updateLayoutConfig({ 
                    panelMode: layoutConfig.panelMode === 'overlay' ? 'inline' : 'overlay' 
                  })}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={layoutConfig.panelMode === 'overlay' ? 'Switch to Inline Mode' : 'Switch to Overlay Mode'}
                >
                  {layoutConfig.panelMode === 'overlay' ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Bell size={18} />
                </button>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </header>

            {/* Center Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-auto">
              <h1 className="text-4xl font-semibold text-white mb-12 tracking-tight">
                Hvad kan jeg hjælpe dig med?
              </h1>

              <ChatInput
                value={chatInput}
                onChange={setChatInput}
                onSend={handleSend}
                onAttach={() => {}}
              />

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-8 flex flex-wrap justify-center gap-4 max-w-4xl">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={index}
                      {...suggestion}
                      onClick={() => setChatInput(suggestion.title)}
                    />
                  ))}
                </div>
              )}

              {suggestions.length > 0 && (
                <button className="mt-6 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                  Se mere
                  <ChevronDown size={16} />
                </button>
              )}
            </div>
          </main>
        )}

        {/* Widget Panel - Inline Mode (NO OVERLAY) */}
        {expandedWidgetData && expandedWidgetDef && layoutConfig.panelMode === 'inline' && (
          <InlineWidgetPanel
            widget={expandedWidgetData}
            widgetComponent={expandedWidgetDef.component}
            widgetName={expandedWidgetDef.name}
            onClose={() => setExpandedWidget(null)}
            onMaximize={() => setIsMaximized(!isMaximized)}
            isMaximized={isMaximized}
            width={layoutConfig.panelWidth}
          />
        )}
      </div>

      {/* Widget Panel - Overlay Mode (Only if explicitly selected) */}
      {expandedWidgetData && expandedWidgetDef && layoutConfig.panelMode === 'overlay' && (
        <OverlayWidgetPanel
          widget={expandedWidgetData}
          widgetComponent={expandedWidgetDef.component}
          widgetName={expandedWidgetDef.name}
          onClose={() => setExpandedWidget(null)}
          width={layoutConfig.panelWidth}
        />
      )}
    </div>
  );
}
