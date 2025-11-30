import { useState, useEffect, useCallback, useRef, FormEvent, lazy, Suspense } from 'react';
import {
  Brain,
  Activity,
  Cpu,
  Database,
  Wifi,
  Terminal,
  Shield,
  Zap,
  Server,
  AlertTriangle,
  Send,
  LayoutDashboard,
  Network,
  ScrollText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Dna,
  Gauge,
} from 'lucide-react';

// Lazy load heavy components
const KnowledgeGraphView = lazy(() => import('./components/KnowledgeGraphView'));
const SystemLogsView = lazy(() => import('./components/SystemLogsView'));
const CyberOpsView = lazy(() => import('./components/CyberOpsView'));
const DNASplicerView = lazy(() => import('./components/DNASplicerView'));
const HarvestControlPanel = lazy(() => import('./components/HarvestControlPanel'));

// ============================================
// TYPES
// ============================================
interface AIStatus {
  service: string;
  ready: boolean;
  model: string;
  endpoints: string[];
}

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  aiReady: boolean;
  registeredTools: string[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'error';
  content: string;
  timestamp: Date;
}

type ViewType = 'chat' | 'graph' | 'logs' | 'cyberops' | 'dna';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

// ============================================
// NEURAL STATUS INDICATOR
// ============================================
const NeuralStatus = ({ isOnline, label }: { isOnline: boolean; label: string }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-neon-green animate-pulse' : 'bg-alert-red'
      }`}
    />
    <span className={isOnline ? 'text-neon-green' : 'text-alert-red'}>{label}</span>
  </div>
);

// ============================================
// TERMINAL WINDOW COMPONENT
// ============================================
const TerminalWindow = ({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`hud-border rounded-lg overflow-hidden ${className}`}>
    {/* Title Bar */}
    <div className="bg-cyber-gray/50 px-4 py-2 border-b border-neon-green/20 flex items-center gap-2">
      <Terminal className="w-4 h-4 text-neon-green" />
      <span className="text-neon-green text-sm font-medium">{title}</span>
      <div className="ml-auto flex gap-1">
        <div className="w-3 h-3 rounded-full bg-alert-red/50" />
        <div className="w-3 h-3 rounded-full bg-alert-yellow/50" />
        <div className="w-3 h-3 rounded-full bg-neon-green/50" />
      </div>
    </div>
    {/* Content */}
    <div className="p-4 bg-cyber-black/80">{children}</div>
  </div>
);

// ============================================
// NAVIGATION SIDEBAR COMPONENT
// ============================================
const NavigationSidebar = ({
  isOpen,
  onToggle,
  currentView,
  onViewChange,
}: {
  isOpen: boolean;
  onToggle: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}) => {
  const navItems: NavItem[] = [
    {
      id: 'chat',
      label: 'NEURAL CHAT',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: 'graph',
      label: 'KNOWLEDGE GRAPH',
      icon: <Network className="w-5 h-5" />,
    },
    {
      id: 'logs',
      label: 'SYSTEM LOGS',
      icon: <ScrollText className="w-5 h-5" />,
    },
    {
      id: 'cyberops',
      label: 'CYBER OPS',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: 'dna',
      label: 'DNA SPLICER',
      icon: <Dna className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="h-full hud-border border-l-0 rounded-r-lg bg-cyber-black/95 backdrop-blur-sm flex flex-col">
        {/* Logo Section */}
        <div className="p-4 border-b border-neon-green/20 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Brain className="w-8 h-8 text-neon-green animate-pulse" />
            <div className="absolute inset-0 blur-md bg-neon-green/30 rounded-full" />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-neon-green glow-text-subtle whitespace-nowrap">
                WIDGET<span className="text-neon-cyan">TDC</span>
              </h1>
              <p className="text-[10px] text-neon-green/50 whitespace-nowrap">NEURAL CMD v2.1</p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                ${
                  currentView === item.id
                    ? 'bg-neon-green/20 border border-neon-green/40 text-neon-green'
                    : 'text-neon-green/60 hover:bg-neon-green/10 hover:text-neon-green border border-transparent'
                }`}
              title={!isOpen ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isOpen && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-2 border-t border-neon-green/20">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                       text-neon-green/60 hover:bg-neon-green/10 hover:text-neon-green
                       transition-all duration-200"
          >
            {isOpen ? (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">COLLAPSE</span>
              </>
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

// ============================================
// NEURAL STREAM COMPONENT (Status Panel)
// ============================================
const NeuralStream = () => {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const aiRes = await fetch('/api/ai/status', { signal: controller.signal });
      if (!aiRes.ok) throw new Error(`AI Status: ${aiRes.status}`);
      const aiData = await aiRes.json();
      setAiStatus(aiData);

      const healthRes = await fetch('/health', { signal: controller.signal });
      if (!healthRes.ok) throw new Error(`Health: ${healthRes.status}`);
      const healthData = await healthRes.json();
      setHealth(healthData);

      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout');
      } else {
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
      setAiStatus(null);
      setHealth(null);
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const isOnline = aiStatus?.ready && health?.status === 'healthy';

  return (
    <TerminalWindow title="NEURAL_STREAM.exe" className="h-full">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Brain
            className={`w-16 h-16 ${
              isOnline ? 'text-neon-green animate-pulse' : 'text-alert-red glitch'
            }`}
          />
        </div>
        <h2
          className={`text-xl font-bold ${
            isOnline ? 'text-neon-green glow-text' : 'text-alert-red glitch'
          }`}
        >
          {isOnline ? 'NEURAL CORE: ONLINE' : 'CONNECTION LOST'}
        </h2>
        {isOnline && aiStatus && (
          <p className="text-neon-cyan/70 text-sm mt-2">Model: {aiStatus.model}</p>
        )}
        {error && (
          <p className="text-alert-red text-sm mt-2 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="hud-border rounded p-3">
          <div className="flex items-center gap-2 text-neon-cyan/70 mb-1">
            <Server className="w-4 h-4" />
            <span>Backend</span>
          </div>
          <NeuralStatus isOnline={health?.status === 'healthy'} label={health?.status || 'OFFLINE'} />
        </div>

        <div className="hud-border rounded p-3">
          <div className="flex items-center gap-2 text-neon-cyan/70 mb-1">
            <Brain className="w-4 h-4" />
            <span>AI Core</span>
          </div>
          <NeuralStatus isOnline={aiStatus?.ready || false} label={aiStatus?.ready ? 'READY' : 'OFFLINE'} />
        </div>

        <div className="hud-border rounded p-3">
          <div className="flex items-center gap-2 text-neon-cyan/70 mb-1">
            <Cpu className="w-4 h-4" />
            <span>MCP Tools</span>
          </div>
          <span className="text-neon-green">{health?.registeredTools?.length || 0} LOADED</span>
        </div>

        <div className="hud-border rounded p-3">
          <div className="flex items-center gap-2 text-neon-cyan/70 mb-1">
            <Activity className="w-4 h-4" />
            <span>Version</span>
          </div>
          <span className="text-neon-green">{health?.version || 'N/A'}</span>
        </div>
      </div>

      {lastUpdate && (
        <div className="mt-4 text-center text-xs text-neon-green/50">
          Last sync: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </TerminalWindow>
  );
};

// ============================================
// NEURAL LINK CHAT COMPONENT
// ============================================
const NeuralLink = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'system-1',
      type: 'system',
      content: 'NEURAL_LINK initialized. Ready for input.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isThinking) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('/api/ai/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmedInput }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response || data.result || data.message || 'No response received';

      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      let errorMessage = 'Failed to communicate with AI';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. The AI is taking too long to respond.';
        } else {
          errorMessage = err.message;
        }
      }

      const errorMsg: ChatMessage = {
        id: generateId(),
        type: 'error',
        content: `ERROR: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      inputRef.current?.focus();
    }
  };

  const getMessageStyle = (type: ChatMessage['type']) => {
    switch (type) {
      case 'user':
        return 'text-neon-cyan';
      case 'ai':
        return 'text-neon-green';
      case 'system':
        return 'text-neon-green/50 italic';
      case 'error':
        return 'text-alert-red';
      default:
        return 'text-neon-green/70';
    }
  };

  const getMessagePrefix = (type: ChatMessage['type']) => {
    switch (type) {
      case 'user':
        return '> USER:';
      case 'ai':
        return '> ARCHITECT:';
      case 'system':
        return '> [SYSTEM]';
      case 'error':
        return '> [ERROR]';
      default:
        return '>';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-neon-green/20">
        <MessageSquare className="w-5 h-5 text-neon-green" />
        <span className="text-neon-green font-medium">NEURAL CHAT</span>
        <span className="text-xs text-neon-green/50">AI-Powered Terminal</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`${getMessageStyle(msg.type)}`}>
            <span className="opacity-50 text-xs mr-2">
              [{msg.timestamp.toLocaleTimeString('da-DK', { hour12: false })}]
            </span>
            <span className="font-bold">{getMessagePrefix(msg.type)}</span>
            <p className="ml-4 whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
        ))}

        {isThinking && (
          <div className="text-neon-green animate-pulse flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-bold">&gt; ARCHITECT:</span>
            <span className="thinking-dots">THINKING</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-neon-green/20">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green/50 font-mono">
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
            placeholder="Enter command..."
            className="w-full bg-cyber-black/50 border border-neon-green/30 rounded-lg
                       py-3 pl-8 pr-4 text-neon-green placeholder-neon-green/30
                       focus:outline-none focus:border-neon-green/60 focus:ring-1 focus:ring-neon-green/30
                       disabled:opacity-50 disabled:cursor-not-allowed
                       font-mono text-sm transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isThinking || !input.trim()}
          className="px-4 py-3 bg-neon-green/10 border border-neon-green/30 rounded-lg
                     hover:bg-neon-green/20 hover:border-neon-green/50 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2 text-neon-green"
        >
          {isThinking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

// ============================================
// SYSTEM OVERVIEW COMPONENT
// ============================================
const SystemOverview = () => {
  const metrics = [
    { label: 'PostgreSQL', value: 'pgvector', status: 'online' as const, icon: <Database className="w-5 h-5" /> },
    { label: 'Neo4j', value: 'Graph DB', status: 'online' as const, icon: <Shield className="w-5 h-5" /> },
    { label: 'Redis', value: 'Cache', status: 'online' as const, icon: <Zap className="w-5 h-5" /> },
    { label: 'Network', value: 'Connected', status: 'online' as const, icon: <Wifi className="w-5 h-5" /> },
  ];

  return (
    <TerminalWindow title="SYSTEM_OVERVIEW.exe">
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between p-2 bg-cyber-gray/20 rounded"
          >
            <div className="flex items-center gap-3">
              <span className="text-neon-cyan">{metric.icon}</span>
              <div>
                <div className="text-neon-green text-sm font-medium">{metric.label}</div>
                <div className="text-neon-green/50 text-xs">{metric.value}</div>
              </div>
            </div>
            <div
              className={`px-2 py-1 rounded text-xs font-bold ${
                metric.status === 'online'
                  ? 'bg-neon-green/20 text-neon-green'
                  : 'bg-alert-red/20 text-alert-red'
              }`}
            >
              {metric.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </TerminalWindow>
  );
};

// ============================================
// LOADING FALLBACK COMPONENT
// ============================================
const ViewLoadingFallback = () => (
  <div className="h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
      <span className="text-neon-green/70">Loading module...</span>
    </div>
  </div>
);

// ============================================
// MAIN VIEW COMPONENT (Renders current view)
// ============================================
const MainView = ({ currentView }: { currentView: ViewType }) => {
  return (
    <div className="h-full hud-border rounded-lg overflow-hidden bg-cyber-black/80">
      <Suspense fallback={<ViewLoadingFallback />}>
        {currentView === 'chat' && <NeuralLink />}
        {currentView === 'graph' && <KnowledgeGraphView />}
        {currentView === 'logs' && <SystemLogsView />}
        {currentView === 'cyberops' && <CyberOpsView />}
        {currentView === 'dna' && <DNASplicerView />}
      </Suspense>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('chat');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get view title for header
  const getViewTitle = () => {
    switch (currentView) {
      case 'chat':
        return 'NEURAL CHAT INTERFACE';
      case 'graph':
        return 'KNOWLEDGE GRAPH EXPLORER';
      case 'logs':
        return 'SYSTEM LOG MONITOR';
      case 'cyberops':
        return 'CYBER OPERATIONS CENTER';
      case 'dna':
        return 'DNA SPLICER // INTELLIGENCE EXTRACTION';
      default:
        return 'NEURAL COMMAND CENTER';
    }
  };

  return (
    <div className="h-screen w-screen bg-cyber-black overflow-hidden flex">
      {/* Navigation Sidebar */}
      <NavigationSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        {/* Header HUD */}
        <header className="hud-border rounded-lg p-4 m-4 mb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-neon-green glow-text-subtle">
                  {getViewTitle()}
                </h1>
                <p className="text-xs text-neon-green/50">INFINITE KODEX v2.1</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-neon-green" />
                <span className="text-neon-green">CONNECTED</span>
              </div>
              <div className="text-neon-cyan font-mono">
                {time.toLocaleTimeString('da-DK', { hour12: false })}
              </div>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <main className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
          {/* Neural Stream - Left Panel */}
          <div className="col-span-3 flex flex-col gap-4 overflow-auto">
            <NeuralStream />
            <Suspense fallback={<ViewLoadingFallback />}>
              <HarvestControlPanel />
            </Suspense>
          </div>

          {/* Center Panel - Dynamic View */}
          <div className="col-span-6 overflow-hidden">
            <MainView currentView={currentView} />
          </div>

          {/* Right Panel - System Overview */}
          <div className="col-span-3">
            <SystemOverview />
          </div>
        </main>
      </div>
    </div>
  );
}
