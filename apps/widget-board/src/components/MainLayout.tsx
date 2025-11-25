import React, { useState } from 'react';
import { Menu, X, Settings, MessageSquare, MoreHorizontal, ImageIcon, Mic, Send, Plus, LayoutGrid, FileText, Mail, Calendar } from 'lucide-react';
import { ClausLogo } from './ClausLogo';

interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
    headerActions?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title = "WidgeTDC Workspace", headerActions }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('chat');
    const [chatInput, setChatInput] = useState('');

    const sidebarItems = [
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'create', icon: Plus, label: 'Opret' },
        { id: 'apps', icon: LayoutGrid, label: 'Apps' },
        { id: 'word', icon: FileText, label: 'Word' },
        { id: 'outlook', icon: Mail, label: 'Outlook' },
        { id: 'calendar', icon: Calendar, label: 'Calendar' },
    ];

    return (
        <div className="h-screen w-full overflow-hidden flex font-segoe bg-black text-white selection:bg-blue-500/30">
            {/* Background Ambient Glow */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[150px] opacity-40" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-900/20 rounded-full blur-[150px] opacity-40" />
            </div>

            {/* Glassmorphic Sidebar */}
            <aside className={`relative z-50 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-2xl transition-all duration-300 ${isSidebarOpen ? 'w-[320px]' : 'w-[60px]'}`}>

                {/* Header / Logo */}
                <div className="h-16 flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <ClausLogo size={20} />
                        </div>
                        <span className={`font-semibold text-lg tracking-tight text-white whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            M365 Copilot
                        </span>
                    </div>
                    {isSidebarOpen && (
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                            <MoreHorizontal size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 group ${activeTab === item.id ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon size={20} className={`shrink-0 transition-transform duration-200 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                {item.label}
                            </span>
                            {activeTab === item.id && isSidebarOpen && (
                                <div className="ml-auto w-1 h-4 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* User Profile / Bottom Actions */}
                <div className="p-4 border-t border-white/5">
                    <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 flex items-center justify-center text-xs font-bold shadow-md group-hover:border-white/30 transition-all">
                            CK
                        </div>
                        <div className={`flex flex-col items-start overflow-hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            <span className="text-sm font-medium text-white truncate">Claus Kraft</span>
                            <span className="text-xs text-gray-400 truncate">Pro Account</span>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-6 bg-transparent">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all active:scale-95"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="text-sm font-medium text-gray-300/80">{title}</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {headerActions}
                        <button
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all active:scale-95"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Content Container */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {/* If we are in 'chat' mode, show the chat interface, otherwise show children (widgets) */}
                    {activeTab === 'chat' ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
                            <div className="flex-1 w-full flex flex-col items-center justify-center mb-8 text-center space-y-8">
                                <h2 className="text-4xl font-semibold text-white tracking-tight drop-shadow-2xl">
                                    Hej der, prøv at spørge: "hvad kan du gøre?"
                                </h2>

                                {/* Suggestion Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                                    {[
                                        { title: 'Beskriv tidsstyring', sub: 'Hvordan kan jeg mere præcist...', icon: MessageSquare },
                                        { title: 'Grammatik hjælp', sub: 'Hvordan er denne grammatik?', icon: FileText },
                                        { title: 'Minimer forstyrrelser', sub: 'Del strategier for at hjælpe...', icon: Settings }
                                    ].map((card, i) => (
                                        <button key={i} className="text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200 group active:scale-95">
                                            <card.icon size={20} className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                                            <div className="font-medium text-sm text-gray-200 mb-1">{card.title}</div>
                                            <div className="text-xs text-gray-500 line-clamp-2">{card.sub}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Input Bar */}
                            <div className="w-full max-w-3xl relative">
                                <div className="absolute -top-12 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                                    {/* Conversation Style Toggle */}
                                    <div className="bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 flex pointer-events-auto shadow-xl">
                                        <button className="px-4 py-1.5 rounded-full text-xs font-medium text-purple-400 hover:bg-white/5 transition-colors">Creative</button>
                                        <button className="px-4 py-1.5 rounded-full text-xs font-medium text-blue-400 bg-white/10 shadow-sm transition-colors">Balanced</button>
                                        <button className="px-4 py-1.5 rounded-full text-xs font-medium text-teal-400 hover:bg-white/5 transition-colors">Precise</button>
                                    </div>
                                </div>

                                <div className="bg-[#1c1c1c]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all overflow-hidden group">
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Send meddelelse til Copilot"
                                        className="w-full bg-transparent border-none text-base text-white placeholder-gray-400 p-5 pr-12 min-h-[60px] max-h-[200px] resize-none focus:ring-0 outline-none"
                                        rows={1}
                                    />
                                    <div className="flex items-center justify-between px-4 pb-4">
                                        <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors active:scale-95">
                                            <Plus size={20} />
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors active:scale-95">
                                                <Mic size={20} />
                                            </button>
                                            <button className={`p-2 rounded-full transition-all active:scale-95 ${chatInput ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-gray-500'}`}>
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-[11px] text-gray-500 mt-4">
                                    Copilot bruger AI, så tjek for fejl.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
