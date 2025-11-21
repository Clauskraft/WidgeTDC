import React, { useState, useEffect, lazy, Suspense } from 'react';
import { LayoutGrid, Shield, Network, FileText, Sun, Moon, Menu, X, Search, Plus } from 'lucide-react';
import AcrylicCard from './components/AcrylicCard';
import WidgetSelector from './components/WidgetSelector';
import { AgentMonitorWidget } from './src/widgets/AgentMonitorWidget';
import { WIDGET_REGISTRY } from './widgetRegistry';

// Dynamic widget loader
const loadWidget = (widgetId) => {
  const widget = WIDGET_REGISTRY[widgetId];
  if (!widget) return null;

  return lazy(() =>
    import(/* @vite-ignore */ widget.path)
      .then(module => ({ default: module.default || module[widgetId] }))
      .catch(err => {
        console.error(`Failed to load widget ${widgetId}:`, err);
        return { default: () => <div className="p-4 text-red-400">Failed to load {widgetId}</div> };
      })
  );
};

export default function WidgeTDCPro() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);

  // Load active widgets from localStorage
  const [activeWidgets, setActiveWidgets] = useState(() => {
    const saved = localStorage.getItem('activeWidgets');
    return saved ? JSON.parse(saved) : ['AgentMonitorWidget'];
  });

  // Load widget layout from localStorage
  const [widgetLayout, setWidgetLayout] = useState(() => {
    const saved = localStorage.getItem('widgetLayout');
    return saved ? JSON.parse(saved) : {};
  });

  const [logs, setLogs] = useState([
    { type: 'info', msg: "WidgeTDC OS v11.3 booting..." },
    { type: 'success', msg: 'Secure Enclave: Mounted' },
    { type: 'warning', msg: 'Backend Link: Using sql.js SQLite Adapter' },
  ]);

  // Save active widgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets));
  }, [activeWidgets]);

  // Save layout to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('widgetLayout', JSON.stringify(widgetLayout));
  }, [widgetLayout]);

  // Simulated system logs
  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = [
        { type: 'info', msg: 'Scanning port 443 for anomalies...' },
        { type: 'success', msg: 'Packet inspection clean.' },
        { type: 'info', msg: 'Agent "Sentinel" heartbeat received.' },
        { type: 'warning', msg: 'Latency spike detected on node EU-West.' },
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      setLogs(prev => [...prev.slice(-15), randomMsg]);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const toggleWidget = (widgetId) => {
    setActiveWidgets(prev => {
      if (prev.includes(widgetId)) {
        return prev.filter(id => id !== widgetId);
      } else {
        return [...prev, widgetId];
      }
    });
  };

  const renderWidget = (widgetId) => {
    if (widgetId === 'AgentMonitorWidget') {
      return <AgentMonitorWidget key={widgetId} />;
    }

    const WidgetComponent = loadWidget(widgetId);
    if (!WidgetComponent) {
      return <div className="p-4 text-slate-400">Widget not found: {widgetId}</div>;
    }

    return (
      <Suspense
        key={widgetId}
        fallback={
          <AcrylicCard isDarkMode={isDarkMode} className="animate-pulse">
            <div className="h-32 flex items-center justify-center text-slate-400">
              Loading {WIDGET_REGISTRY[widgetId]?.name || widgetId}...
            </div>
          </AcrylicCard>
        }
      >
        <WidgetComponent />
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-20 flex flex-col items-center py-6 backdrop-blur-2xl border-r transition-all duration-500 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDarkMode ? 'bg-[#1a1a1a]/60 border-white/5' : 'bg-white/30 border-white/40 shadow-[5px_0_30px_rgba(0,0,0,0.02)]'}`}>
        <div className="w-10 h-10 mb-8 bg-gradient-to-b from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 border border-teal-400/30 text-white font-bold text-lg shrink-0">W</div>
        <nav className="flex-1 space-y-4 w-full px-3 flex flex-col items-center">
          {[{ id: 'dashboard', icon: LayoutGrid, label: 'Widgets' }, { id: 'security', icon: Shield, label: 'Defense' }, { id: 'network', icon: Network, label: 'Net' }, { id: 'compliance', icon: FileText, label: 'Docs' }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} title={item.label} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group relative ${activeTab === item.id ? (isDarkMode ? 'bg-white/10 text-white shadow-inner' : 'bg-white text-teal-600 shadow-lg shadow-teal-900/5 ring-1 ring-black/5') : (isDarkMode ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600')}`}>
              <item.icon size={20} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-105'}`} />
              {activeTab === item.id && <div className="absolute -left-2 top-2 bottom-2 w-1 bg-teal-500 rounded-r-full" />}
            </button>
          ))}
        </nav>
        <div className="space-y-4 w-full px-3 mb-2 flex flex-col items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group ${isDarkMode ? 'text-yellow-400 hover:bg-white/10' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-md'}`} title={isDarkMode ? "Switch to Aerogel (Light)" : "Switch to Stealth (Dark)"}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white/10 shadow-lg flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-105 transition-transform">CK</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between bg-transparent shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500 hover:text-teal-500 transition-colors">
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <h1 className={`text-2xl font-semibold tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400' : 'text-slate-800'}`}>Claus' <span className="font-light opacity-70">Workspace</span></h1>
            <div className={`hidden sm:block px-2.5 py-1 rounded-full text-[10px] font-mono border transition-colors duration-500 ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white/40 border-white/40 text-slate-500 shadow-sm backdrop-blur-sm'}`}>PRO_BUILD_2405</div>
          </div>
          <div className="flex items-center gap-6">
            {/* Add Widget Button */}
            <button
              onClick={() => setIsWidgetSelectorOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode
                  ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30'
                  : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg'
                }`}
            >
              <Plus size={20} />
              <span className="hidden md:inline">Add Widget</span>
            </button>

            <div className="relative group hidden md:block">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <input type="text" placeholder="Global Search..." className={`rounded-full pl-10 pr-4 py-2 text-sm w-64 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:w-80 ${isDarkMode ? 'bg-[#2d2d2d]/50 border border-white/5 text-slate-200 placeholder-slate-500 focus:bg-[#3d3d3d]/80' : 'bg-white/40 border border-white/40 text-slate-700 placeholder-slate-400 focus:bg-white/80 shadow-sm backdrop-blur-md'}`} />
            </div>
            <div className={`w-[1px] h-8 ${isDarkMode ? 'bg-white/10' : 'bg-slate-300/50'}`} />
            <div className="flex flex-col items-end">
              <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>TDC-NET-01<div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div></div>
              <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>14ms latency</span>
            </div>
          </div>
        </header>

        {/* Widget Grid Area */}
        <div className={`flex-1 overflow-y-auto p-8 pt-2 scrollbar-thin scrollbar-track-transparent ${isDarkMode ? 'scrollbar-thumb-white/10' : 'scrollbar-thumb-slate-400/20'}`}>
          <div className="max-w-[1800px] mx-auto">

            {/* Active Widgets Count */}
            <div className="mb-6 flex items-center justify-between">
              <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {activeWidgets.length} active widget{activeWidgets.length !== 1 ? 's' : ''}
              </div>
              {activeWidgets.length > 0 && (
                <button
                  onClick={() => setActiveWidgets([])}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${isDarkMode
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-red-600 hover:bg-red-50'
                    }`}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)] pb-10">
              {activeWidgets.length === 0 ? (
                <div className="col-span-12 flex flex-col items-center justify-center py-20">
                  <div className={`text-6xl mb-4 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>📊</div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    No Widgets Active
                  </h3>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                    Click "Add Widget" to get started
                  </p>
                  <button
                    onClick={() => setIsWidgetSelectorOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-all shadow-lg"
                  >
                    <Plus size={20} />
                    Browse Widgets
                  </button>
                </div>
              ) : (
                activeWidgets.map(widgetId => {
                  const widget = WIDGET_REGISTRY[widgetId];
                  const size = widget?.defaultSize || { w: 6, h: 2 };
                  return (
                    <div
                      key={widgetId}
                      className={`col-span-12 md:col-span-${Math.min(size.w, 12)} row-span-${size.h}`}
                    >
                      {renderWidget(widgetId)}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-4 pt-3 px-8 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'} flex justify-between text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>
          <span>WidgeTDC Pro v2.4.5</span>
          <span>Active Widgets: {activeWidgets.length} | Logs: {logs.length}</span>
        </div>
      </main>

      {/* Widget Selector Modal */}
      <WidgetSelector
        isOpen={isWidgetSelectorOpen}
        onClose={() => setIsWidgetSelectorOpen(false)}
        onAddWidget={toggleWidget}
        activeWidgets={activeWidgets}
      />
    </div>
  );
}
