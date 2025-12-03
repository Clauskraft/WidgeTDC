import { useState, ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Network, 
  Shield, 
  Terminal, 
  Activity, 
  Search, 
  Settings, 
  Bell, 
  Menu,
  Cpu,
  Share2,
  MessageSquare,
  Eye
} from 'lucide-react';
import NeuralGraph3D from '../views/NeuralGraph3D';
import { ChatWidget } from '../ChatWidget';
import CyberOpsView from '../CyberOpsView';
import VisionaryWidget from '../../../widgets/VisionaryWidget';

// ==========================================
// UI COMPONENTS (The "Matrix Executive" Design System)
// ==========================================

const MatrixButton = ({ 
  children, 
  onClick, 
  active = false, 
  icon: Icon,
  className = "" 
}: { 
  children: ReactNode; 
  onClick?: () => void; 
  active?: boolean; 
  icon?: any;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`
      group relative flex items-center gap-3 px-4 py-3 w-full text-left transition-all duration-200
      border-l-2 
      ${active 
        ? 'border-matrix-primary bg-matrix-primary/10 text-matrix-primary shadow-[0_0_15px_rgba(0,255,65,0.2)]' 
        : 'border-transparent text-matrix-dim hover:bg-matrix-primary/5 hover:text-matrix-primary hover:border-matrix-primary/50'
      }
      ${className}
    `}
  >
    {Icon && (
      <Icon 
        className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-matrix-primary' : 'text-matrix-dim group-hover:text-matrix-primary'}`} 
      />
    )}
    <span className="font-sans text-sm font-medium tracking-wide uppercase">{children}</span>
    
    {/* Hover Glitch Decoration - Active State Indicator */}
    <div className={`absolute right-2 w-1.5 h-1.5 bg-matrix-primary rounded-full opacity-0 transition-opacity ${active ? 'opacity-100 shadow-[0_0_5px_#00FF41]' : 'group-hover:opacity-50'}`} />
  </button>
);

const StatCard = ({ label, value, trend, trendUp }: { label: string, value: string, trend: string, trendUp: boolean }) => (
  <div className="matrix-panel p-4 rounded-sm hover:border-matrix-primary/60 transition-colors group">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-sans text-matrix-dim uppercase tracking-wider group-hover:text-matrix-primary/80 transition-colors">{label}</span>
      <Activity className="w-4 h-4 text-matrix-dim group-hover:text-matrix-primary transition-colors" />
    </div>
    <div className="text-2xl font-mono text-white font-bold mb-1 matrix-text-glow-subtle">{value}</div>
    <div className={`text-xs font-mono flex items-center gap-1 ${trendUp ? 'text-matrix-primary' : 'text-matrix-alert'}`}>
      <span>{trendUp ? '▲' : '▼'}</span>
      {trend}
    </div>
  </div>
);

// ==========================================
// MAIN LAYOUT
// ==========================================

export default function MatrixFigmaLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mock Data for the "Dashboard" view
  const renderDashboard = () => (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="System Load" value="42%" trend="+2.4%" trendUp={true} />
        <StatCard label="Network Traffic" value="1.2 GB/s" trend="-0.5%" trendUp={false} />
        <StatCard label="Active Agents" value="14" trend="+1" trendUp={true} />
        <StatCard label="Threat Level" value="LOW" trend="Stable" trendUp={true} />
      </div>

      {/* Main Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Large Main Panel (e.g., Graph or Map) */}
        <div className="lg:col-span-2 matrix-panel relative overflow-hidden flex flex-col rounded-sm">
          <div className="p-3 border-b border-matrix-primary/20 flex justify-between items-center bg-matrix-crust/50">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-matrix-primary" />
              <span className="text-xs font-sans text-matrix-primary uppercase tracking-wider">Neural Topology</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 bg-matrix-primary rounded-full animate-pulse shadow-[0_0_5px_#00FF41]"></div>
              <span className="text-xs font-mono text-matrix-primary">LIVE_STREAM</span>
            </div>
          </div>
          <div className="flex-1 relative bg-matrix-base">
             {/* Embedding the 3D Graph here correctly */}
             <NeuralGraph3D />
          </div>
        </div>

        {/* Right Side Feed */}
        <div className="matrix-panel rounded-sm flex flex-col">
          <div className="p-3 border-b border-matrix-primary/20 flex items-center gap-2 bg-matrix-crust/50">
            <Terminal className="w-4 h-4 text-matrix-primary" />
            <span className="text-xs font-sans text-matrix-primary uppercase tracking-wider">System Logs</span>
          </div>
          <div className="flex-1 p-4 font-mono text-xs space-y-3 overflow-y-auto text-matrix-dim">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex gap-3 border-b border-matrix-primary/10 pb-2 last:border-0 hover:bg-matrix-primary/5 transition-colors p-1 rounded">
                <span className="text-matrix-dim/60">10:42:{10+i}</span>
                <div>
                  <span className="text-matrix-primary block">[INFO] Process_ID_{4000+i} initiated</span>
                  <span className="text-matrix-dim">Optimizing vector index shards...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-matrix-base text-matrix-dim flex font-sans selection:bg-matrix-primary/30">
      
      {/* BACKGROUND GRID EFFECT (The "Template" layer) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #003B00 1px, transparent 1px),
            linear-gradient(to bottom, #003B00 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* SIDEBAR */}
      <aside 
        className={`
          relative z-20 bg-matrix-crust border-r border-matrix-primary/20 flex flex-col transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Logo */}
        <div className="h-16 border-b border-matrix-primary/20 flex items-center px-4 gap-3">
          <div className="w-8 h-8 bg-matrix-primary/10 border border-matrix-primary rounded-sm flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(0,255,65,0.2)]">
            <Cpu className="w-5 h-5 text-matrix-primary" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold font-sans tracking-tighter text-lg text-white">WIDGET<span className="text-matrix-primary matrix-text-glow">TDC</span></h1>
              <p className="text-[10px] text-matrix-dim uppercase tracking-widest">Enterprise AI</p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-6 space-y-1">
          <MatrixButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={LayoutDashboard}
          >
            {sidebarOpen && "Command Center"}
          </MatrixButton>
          <MatrixButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={MessageSquare}
          >
            {sidebarOpen && "Neural Chat"}
          </MatrixButton>
          <MatrixButton 
            active={activeTab === 'graph'} 
            onClick={() => setActiveTab('graph')} 
            icon={Share2}
          >
            {sidebarOpen && "Graph Explorer"}
          </MatrixButton>
          <MatrixButton 
            active={activeTab === 'cyber'} 
            onClick={() => setActiveTab('cyber')} 
            icon={Shield}
          >
            {sidebarOpen && "Cyber Ops"}
          </MatrixButton>
          <MatrixButton 
            active={activeTab === 'visionary'} 
            onClick={() => setActiveTab('visionary')} 
            icon={Eye}
          >
            {sidebarOpen && "The Visionary"}
          </MatrixButton>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-matrix-primary/20 space-y-2">
          <button className="w-full p-2 rounded hover:bg-matrix-primary/10 text-matrix-dim hover:text-matrix-primary transition-colors flex items-center justify-center border border-transparent hover:border-matrix-primary/30">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        
        {/* TOP HEADER HUD */}
        <header className="h-16 bg-matrix-crust/80 backdrop-blur-md border-b border-matrix-primary/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-matrix-dim hover:text-matrix-primary transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Bar */}
            <div className="relative hidden md:block group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-dim group-hover:text-matrix-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search intelligence..." 
                className="bg-matrix-base border border-matrix-primary/30 rounded-sm pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-matrix-primary focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] text-matrix-primary w-64 placeholder-matrix-dim/50 font-sans transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-matrix-primary/5 border border-matrix-primary/30 rounded-full shadow-[0_0_10px_rgba(0,255,65,0.05)]">
              <div className="w-2 h-2 bg-matrix-primary rounded-full animate-pulse shadow-[0_0_5px_#00FF41]"></div>
              <span className="text-xs font-mono font-bold text-matrix-primary tracking-wide">SYSTEM ONLINE</span>
            </div>
            <button className="relative p-2 text-matrix-dim hover:text-matrix-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-matrix-alert rounded-full border-2 border-matrix-crust animate-pulse"></span>
            </button>
            <div className="w-8 h-8 bg-matrix-dim/20 rounded-full border border-matrix-primary/30 flex items-center justify-center text-xs font-mono text-matrix-primary">
              AI
            </div>
          </div>
        </header>

        {/* VIEWPORT */}
        <main className="flex-1 overflow-hidden relative bg-matrix-base">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'graph' && <div className="h-full w-full"><NeuralGraph3D /></div>}
          {activeTab === 'chat' && <div className="h-full w-full p-4"><ChatWidget /></div>}
          {activeTab === 'cyber' && <div className="h-full w-full"><CyberOpsView /></div>}
          {activeTab === 'visionary' && <div className="h-full w-full p-4"><VisionaryWidget /></div>}
          
          {/* Placeholder for other tabs */}
          {!['dashboard', 'graph', 'chat', 'cyber', 'visionary'].includes(activeTab) && (
            <div className="h-full flex items-center justify-center flex-col text-matrix-dim/50">
              <Activity className="w-16 h-16 mb-4 opacity-20 animate-pulse" />
              <p className="font-mono uppercase tracking-widest text-sm">Module Under Construction</p>
              <p className="font-mono text-xs mt-2 text-matrix-primary/40">[Awaiting Neural Link]</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
