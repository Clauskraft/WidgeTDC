import React, { useState, useEffect } from 'react';
import {
  Shield, Activity, Database, Terminal,
  Network, Zap, Search, UserCheck, FileText,
  Cloud, Sun, Moon, LayoutGrid, Menu, X, AlertTriangle, CheckCircle
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import AcrylicCard from './components/AcrylicCard';
import QuickToggle from './components/QuickToggle';
import TerminalLog from './components/TerminalLog';

// --- Mock Data (System Telemetry) ---
const trafficData = [
  { time: '08:00', in: 4200, out: 2400, latency: 12 },
  { time: '09:00', in: 5500, out: 3200, latency: 15 },
  { time: '10:00', in: 7800, out: 4500, latency: 18 },
  { time: '11:00', in: 6500, out: 3800, latency: 14 },
  { time: '12:00', in: 4200, out: 2100, latency: 11 },
  { time: '13:00', in: 5900, out: 3900, latency: 16 },
  { time: '14:00', in: 8900, out: 5600, latency: 22 },
  { time: '15:00', in: 9200, out: 6100, latency: 24 },
  { time: '16:00', in: 6800, out: 4200, latency: 19 },
];

const complianceData = [
  { name: 'Compliant', value: 85, color: '#10b981' }, // Emerald
  { name: 'Review', value: 10, color: '#f59e0b' },    // Amber
  { name: 'Risk', value: 5, color: '#ef4444' },      // Rose
];

const threatLog = [
  { id: 1023, time: '10:42', type: 'SQL Injection', source: '192.168.1.105', action: 'Blocked', agent: 'Sentinel' },
  { id: 1024, time: '10:45', type: 'Auth Failure', source: '87.54.23.11', action: 'Flagged', agent: 'AuthGuard' },
  { id: 1025, time: '11:02', type: 'Volumetric', source: 'Internal', action: 'Analyzing', agent: 'TrafficAI' },
  { id: 1026, time: '11:15', type: 'Malware C&C', source: '10.20.5.99', action: 'Isolated', agent: 'Endpoint' },
];

// --- Main Application ---

export default function WidgeTDCPro() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([
    { type: 'info', msg: 'WidgeTDC OS v11.3 booting...' },
    { type: 'success', msg: 'Secure Enclave: Mounted' },
    { type: 'warning', msg: 'Backend Link: Using sql.js SQLite Adapter' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = [
        { type: 'info', msg: 'Scanning port 443 for anomalies...' },
        { type: 'success', msg: 'Packet inspection clean.' },
        { type: 'info', msg: 'Agent "Sentinel" heartbeat received.' },
        { type: 'warning', msg: 'Latency spike detected on node EU-West.' },
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      // @ts-ignore
      setLogs(prev => [...prev.slice(-15), randomMsg]);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen font-sans selection:bg-teal-500/30 flex overflow-hidden relative transition-colors duration-700 ${isDarkMode ? 'bg-[#050505] text-slate-200' : 'bg-[#f2f6fa] text-slate-800'
      }`}>

      {/* --- Dynamic Background Mesh (The "Soul" of the UI) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {isDarkMode ? (
          // STEALTH MODE (Dark)
          <>
            <div className="absolute top-[-10%] left-[20%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] opacity-40 animate-pulse duration-[10s]"></div>
            <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-teal-900/10 rounded-full blur-[100px] opacity-30"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>
          </>
        ) : (
          // AEROGEL MODE (Light/Glassy)
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-300/20 rounded-full blur-[120px] opacity-60 animate-pulse duration-[15s] mix-blend-multiply"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-teal-200/40 rounded-full blur-[120px] opacity-50 mix-blend-multiply"></div>
            <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] bg-white rounded-full blur-[80px] opacity-80"></div>
          </>
        )}
      </div>

      {/* --- Sidebar (Dock) --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-20 flex flex-col items-center py-6 backdrop-blur-2xl border-r transition-all duration-500 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDarkMode ? 'bg-[#1a1a1a]/60 border-white/5' : 'bg-white/30 border-white/40 shadow-[5px_0_30px_rgba(0,0,0,0.02)]'
        }`}>
        <div className="w-10 h-10 mb-8 bg-gradient-to-b from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 border border-teal-400/30 text-white font-bold text-lg shrink-0">
          W
        </div>

        <nav className="flex-1 space-y-4 w-full px-3 flex flex-col items-center">
          {[
            { id: 'dashboard', icon: LayoutGrid, label: 'Widgets' },
            { id: 'security', icon: Shield, label: 'Defense' },
            { id: 'network', icon: Network, label: 'Net' },
            { id: 'compliance', icon: FileText, label: 'Docs' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group relative ${activeTab === item.id
                ? (isDarkMode ? 'bg-white/10 text-white shadow-inner' : 'bg-white text-teal-600 shadow-lg shadow-teal-900/5 ring-1 ring-black/5')
                : (isDarkMode ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600')
                }`}
            >
              <item.icon size={20} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-105'}`} />
              {activeTab === item.id && <div className="absolute -left-2 top-2 bottom-2 w-1 bg-teal-500 rounded-r-full"></div>}
            </button>
          ))}
        </nav>

        <div className="space-y-4 w-full px-3 mb-2 flex flex-col items-center">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group ${isDarkMode ? 'text-yellow-400 hover:bg-white/10' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-md'
              }`}
            title={isDarkMode ? "Switch to Aerogel (Light)" : "Switch to Stealth (Dark)"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white/10 shadow-lg flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-105 transition-transform">
            CK
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col">

        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between bg-transparent shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500 hover:text-teal-500 transition-colors">
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <h1 className={`text-2xl font-semibold tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400' : 'text-slate-800'
              }`}>
              Claus' <span className="font-light opacity-70">Workspace</span>
            </h1>
            <div className={`hidden sm:block px-2.5 py-1 rounded-full text-[10px] font-mono border transition-colors duration-500 ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white/40 border-white/40 text-slate-500 shadow-sm backdrop-blur-sm'
              }`}>
              PRO_BUILD_2405
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Global Search..."
                className={`rounded-full pl-10 pr-4 py-2 text-sm w-64 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:w-80 ${isDarkMode
                  ? 'bg-[#2d2d2d]/50 border border-white/5 text-slate-200 placeholder-slate-500 focus:bg-[#3d3d3d]/80'
                  : 'bg-white/40 border border-white/40 text-slate-700 placeholder-slate-400 focus:bg-white/80 shadow-sm backdrop-blur-md'
                  }`}
              />
            </div>
            <div className={`w-[1px] h-8 ${isDarkMode ? 'bg-white/10' : 'bg-slate-300/50'}`}></div>
            <div className="flex flex-col items-end">
              <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                TDC-NET-01
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
              </div>
              <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>14ms latency</span>
            </div>
          </div>
        </header>

        {/* Widget Grid Area */}
        <div className={`flex-1 overflow-y-auto p-8 pt-2 scrollbar-thin scrollbar-track-transparent ${isDarkMode ? 'scrollbar-thumb-white/10' : 'scrollbar-thumb-slate-400/20'}`}>
          <div className="max-w-[1800px] mx-auto grid grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)] pb-10">

            {/* 1. Cyber Weather Widget */}
            <AcrylicCard isDarkMode={isDarkMode} className={`col-span-12 md:col-span-6 lg:col-span-3 row-span-1 ${isDarkMode ? 'bg-gradient-to-br from-blue-900/30 to-slate-900/30 !border-t-blue-500/30' : 'bg-gradient-to-br from-blue-50/60 to-white/60 !border-t-blue-400/50'}`}>
              <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      <Cloud size={12} /> Threat Level
                    </span>
                    <div className={`text-5xl font-light mt-3 tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Low</div>
                    <div className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-blue-200/50' : 'text-blue-600/60'}`}>No active campaigns</div>
                  </div>
                  <div className="text-right p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div className="text-2xl">🛡️</div>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className={`flex justify-between text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>DDoS Activity</span>
                    <span className="text-emerald-500">Quiet</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-blue-950/50' : 'bg-blue-100'}`}>
                    <div className="w-[15%] h-full bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                  </div>
                </div>
              </div>
            </AcrylicCard>

            {/* 2. Quick Actions */}
            <div className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 grid grid-cols-2 gap-4">
              {/* @ts-ignore */}
              <QuickToggle isDarkMode={isDarkMode} icon={Shield} label="Firewall" active={true} onClick={() => { }} />
              {/* @ts-ignore */}
              <QuickToggle isDarkMode={isDarkMode} icon={Zap} label="Auto-Mitigate" active={true} onClick={() => { }} />
              {/* @ts-ignore */}
              <QuickToggle isDarkMode={isDarkMode} icon={Database} label="DB Sync" active={false} onClick={() => { }} />
              {/* @ts-ignore */}
              <QuickToggle isDarkMode={isDarkMode} icon={Power} label="Emergency" active={false} onClick={() => { }} />
            </div>

            {/* 3. Traffic Graph (Main Visual) */}
            <AcrylicCard title="National Network Telemetry" icon={Activity} isDarkMode={isDarkMode} className="col-span-12 lg:col-span-6 row-span-2">
              <div className="h-full w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                    <XAxis dataKey="time" stroke={isDarkMode ? "#525252" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke={isDarkMode ? "#525252" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? 'rgba(31,31,31,0.9)' : 'rgba(255,255,255,0.8)',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                      }}
                      itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}
                    />
                    <Area type="monotone" dataKey="in" stroke="#2dd4bf" strokeWidth={3} fill="url(#colorTraffic)" />
                    <Area type="monotone" dataKey="out" stroke="#64748b" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AcrylicCard>

            {/* 4. Security Feed */}
            <AcrylicCard title="Live Security Events" icon={AlertTriangle} isDarkMode={isDarkMode} className="col-span-12 md:col-span-6 row-span-2">
              <div className="space-y-2">
                {threatLog.map((log, i) => (
                  <div key={log.id} className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border border-transparent ${isDarkMode ? 'hover:bg-white/5 hover:border-white/5' : 'hover:bg-white/60 hover:border-white/40 hover:shadow-sm'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors ${isDarkMode ? 'bg-[#252525] border-white/5 group-hover:bg-[#303030]' : 'bg-white border-white/40 shadow-sm group-hover:scale-110'
                      }`}>
                      {log.action === 'Blocked' ? '🛡️' : log.action === 'Isolated' ? '☣️' : '⚠️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className={`text-sm font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{log.type}</h4>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-black/30 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>{log.time}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{log.source}</p>
                        <span className={`text-[10px] font-medium ${isDarkMode ? 'text-teal-500' : 'text-teal-600'}`}>{log.agent}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <button className={`w-full py-2.5 text-xs font-medium text-center transition-all border border-dashed rounded-xl ${isDarkMode
                    ? 'text-slate-500 hover:text-teal-400 border-white/10 hover:bg-white/5'
                    : 'text-slate-500 hover:text-teal-600 border-slate-300 hover:bg-white/40 hover:border-teal-300'
                    }`}>
                    View Full Audit Log →
                  </button>
                </div>
              </div>
            </AcrylicCard>

            {/* 5. Terminal */}
            <AcrylicCard title="System Console" icon={Terminal} isDarkMode={isDarkMode} className={`col-span-12 md:col-span-6 row-span-1 border-l-4 border-l-emerald-500 ${isDarkMode ? '!bg-black/80' : '!bg-white/70'}`}>
              {/* @ts-ignore */}
              <TerminalLog logs={logs} isDarkMode={isDarkMode} />
            </AcrylicCard>

            {/* 6. Compliance */}
            <AcrylicCard title="GDPR Compliance" icon={UserCheck} isDarkMode={isDarkMode} className="col-span-12 lg:col-span-6 row-span-1">
              <div className="flex items-center gap-8 h-full px-4">
                <div className="h-32 w-32 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={complianceData} innerRadius={38} outerRadius={52} paddingAngle={5} dataKey="value" stroke="none">
                        {complianceData.map((entry, idx) => <Cell key={idx} fill={entry.color} className="drop-shadow-sm" />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className={`text-2xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>85%</span>
                    <span className={`text-[9px] uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Secure</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {['GDPR Processor Agreement', 'Schrems II TIA'].map((item) => (
                    <div key={item} className={`flex justify-between items-center text-sm border-b pb-2 ${isDarkMode ? 'border-white/5' : 'border-slate-200/60'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{item}</span>
                      <div className="flex items-center gap-1.5 text-emerald-500 font-medium text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Verified
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Chromebook Assessment</span>
                    <div className="flex items-center gap-1.5 text-amber-500 font-medium text-xs bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Activity size={10} /> Pending
                    </div>
                  </div>
                </div>
              </div>
            </AcrylicCard>

          </div>
        </div>
      </main>
    </div>
  );
}
