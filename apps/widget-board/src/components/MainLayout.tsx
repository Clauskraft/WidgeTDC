import React, { useState } from 'react';
import { Menu, X, Settings, MessageSquare, MoreHorizontal, Mic, Send, Plus, LayoutGrid, FileText, Mail, Calendar, ArrowRight, Sparkles } from 'lucide-react';
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
    const [conversationStyle, setConversationStyle] = useState('balanced');

    const sidebarItems = [
        { id: 'chat', icon: MessageSquare, label: 'DOT Chat' },
        { id: 'apps', icon: LayoutGrid, label: 'Mine Apps' },
        { id: 'create', icon: Plus, label: 'Opret' },
        { id: 'word', icon: FileText, label: 'Word' },
        { id: 'outlook', icon: Mail, label: 'Outlook' },
        { id: 'calendar', icon: Calendar, label: 'Kalender' },
    ];

    return (
        <div className="h-screen w-full overflow-hidden flex font-segoe bg-[#051e3c] text-white selection:bg-[#00B5CB]/30 relative">
            {/* Advanced Background Mesh Gradient */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-[#0B3E6F]/40 rounded-full blur-[120px] opacity-50 mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#00677F]/30 rounded-full blur-[150px] opacity-40 mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
            </div>

            {/* Ultra-Glassmorphic Sidebar */}
            <aside className={`relative z-50 flex flex-col border-r border-white/5 bg-[#0B3E6F]/20 backdrop-blur-3xl transition-all duration-500 ease-spring ${isSidebarOpen ? 'w-[280px]' : 'w-[70px]'} shadow-[4px_0_30px_rgba(0,0,0,0.3)]`}>

                {/* Header / Logo */}
                <div className="h-20 flex items-center justify-between px-5">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B5CB] to-[#00677F] flex items-center justify-center shadow-lg shadow-[#00B5CB]/20 ring-1 ring-white/10 group cursor-pointer hover:scale-105 transition-transform">
                            <ClausLogo size={24} />
                        </div>
                        <div className={`flex flex-col transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="font-bold text-lg tracking-tight text-white leading-none">DOT</span>
                            <span className="text-[10px] font-medium text-[#00B5CB] tracking-wider uppercase">TDC Erhverv</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            {activeTab === item.id && (
                                <div className="absolute inset-0 bg-gradient-to-r from-[#00B5CB]/10 to-transparent opacity-50" />
                            )}
                            <item.icon size={22} className={`shrink-0 transition-all duration-300 z-10 ${activeTab === item.id ? 'text-[#00B5CB] scale-110 drop-shadow-[0_0_8px_rgba(0,181,203,0.5)]' : 'group-hover:text-gray-200 group-hover:scale-105'}`} />
                            <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 z-10 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'}`}>
                                {item.label}
                            </span>
                            {activeTab === item.id && isSidebarOpen && (
                                <div className="ml-auto w-1.5 h-1.5 bg-[#00B5CB] rounded-full shadow-[0_0_8px_#00B5CB]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-white/5 bg-black/10 backdrop-blur-md">
                    <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 flex items-center justify-center text-xs font-bold shadow-md group-hover:ring-2 ring-[#00B5CB]/50 transition-all">
                            CK
                        </div>
                        <div className={`flex flex-col items-start overflow-hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            <span className="text-sm font-medium text-white truncate">Claus Kraft</span>
                            <span className="text-xs text-[#00B5CB] truncate">Pro Account</span>
                        </div>
                        {isSidebarOpen && <Settings size={16} className="ml-auto text-gray-500 group-hover:text-white transition-colors" />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
                {/* Top Bar */}
                <header className="h-20 flex items-center justify-between px-8 bg-transparent">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all active:scale-95 ring-1 ring-transparent hover:ring-white/10"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="text-sm font-medium text-gray-400 tracking-wide uppercase">{title}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {headerActions}
                    </div>
                </header>

                {/* Content Container */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {activeTab === 'chat' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex-1 w-full flex flex-col items-center justify-center mb-12 text-center space-y-10">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-[#00B5CB]/20 rounded-full blur-xl animate-pulse" />
                                    <ClausLogo size={64} className="relative z-10 drop-shadow-[0_0_15px_rgba(0,181,203,0.5)]" />
                                </div>
                                <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E0F7FA] to-[#00B5CB] tracking-tight drop-shadow-sm">
                                    Hej Claus, hvad skal vi løse?
                                </h2>

                                {/* Suggestion Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
                                    {[
                                        { title: 'Møde Opsummering', sub: 'Generer referat fra Teams', icon: FileText, color: 'text-blue-400' },
                                        { title: 'Data Analyse', sub: 'Analyser Q1 salgstal', icon: LayoutGrid, color: 'text-teal-400' },
                                        { title: 'Kunde Email', sub: 'Udkast til opfølgning', icon: Mail, color: 'text-purple-400' }
                                    ].map((card, i) => (
                                        <button key={i} className="text-left p-5 rounded-2xl bg-[#0B3E6F]/30 hover:bg-[#0B3E6F]/50 border border-white/5 hover:border-[#00B5CB]/30 transition-all duration-300 group active:scale-95 backdrop-blur-md shadow-lg hover:shadow-[#00B5CB]/10">
                                            <div className="flex justify-between items-start mb-3">
                                                <card.icon size={24} className={`${card.color} group-hover:scale-110 transition-transform duration-300`} />
                                                <ArrowRight size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                                            </div>
                                            <div className="font-semibold text-base text-gray-100 mb-1">{card.title}</div>
                                            <div className="text-xs text-gray-400 font-medium">{card.sub}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Input Bar */}
                            <div className="w-full max-w-3xl relative mb-8">
                                <div className="absolute -top-14 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                                    {/* Conversation Style Toggle */}
                                    <div className="bg-[#051e3c]/80 backdrop-blur-xl rounded-full p-1.5 border border-white/10 flex pointer-events-auto shadow-2xl ring-1 ring-white/5">
                                        {['creative', 'balanced', 'precise'].map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => setConversationStyle(style)}
                                                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 capitalize ${conversationStyle === style ? 'bg-[#00B5CB] text-[#051e3c] shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                            >
                                                {style === 'creative' ? 'Kreativ' : style === 'balanced' ? 'Balanceret' : 'Præcis'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-[#0B3E6F]/40 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl focus-within:border-[#00B5CB]/50 focus-within:ring-2 focus-within:ring-[#00B5CB]/20 transition-all duration-300 overflow-hidden group relative">
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Spørg DOT om hvad som helst..."
                                        className="w-full bg-transparent border-none text-lg text-white placeholder-gray-400/60 p-6 pr-14 min-h-[70px] max-h-[200px] resize-none focus:ring-0 outline-none font-light"
                                        rows={1}
                                    />
                                    <div className="flex items-center justify-between px-5 pb-5">
                                        <div className="flex gap-2">
                                            <button className="p-2.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-[#00B5CB] transition-colors active:scale-95" title="Vedhæft">
                                                <Plus size={20} />
                                            </button>
                                            <button className="p-2.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-[#00B5CB] transition-colors active:scale-95" title="Billeder">
                                                <LayoutGrid size={20} />
                                            </button>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="p-2.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors active:scale-95" title="Tale">
                                                <Mic size={22} />
                                            </button>
                                            <button
                                                className={`p-2.5 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center ${chatInput ? 'bg-[#00B5CB] text-[#051e3c] shadow-[0_0_15px_rgba(0,181,203,0.4)] rotate-0' : 'bg-white/5 text-gray-600 rotate-90 cursor-not-allowed'}`}
                                                disabled={!chatInput}
                                            >
                                                <Send size={20} className={chatInput ? 'ml-0.5' : ''} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center mt-4 gap-2 items-center">
                                    <Sparkles size={12} className="text-[#00B5CB]" />
                                    <p className="text-center text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                                        DOT AI kan lave fejl. Kontroller vigtige oplysninger.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'apps' && (
                        <div className="flex-1 overflow-y-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    )}

                    {activeTab === 'create' && (
                        <div className="flex-1 overflow-y-auto p-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="max-w-6xl mx-auto">
                                <h2 className="text-3xl font-light text-white mb-2">Opret nyt indhold</h2>
                                <p className="text-gray-400 mb-10 font-light">Vælg en skabelon eller start fra bunden med DOT AI.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Document Creation */}
                                    <button className="group relative p-6 rounded-3xl bg-[#0B3E6F]/20 border border-white/5 hover:bg-[#0B3E6F]/40 hover:border-[#00B5CB]/30 transition-all duration-300 text-left overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#00B5CB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-1">Dokument</h3>
                                        <p className="text-sm text-gray-400">Rapporter, notater og artikler</p>
                                        <ArrowRight size={16} className="absolute bottom-6 right-6 text-[#00B5CB] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </button>

                                    {/* Presentation Creation */}
                                    <button className="group relative p-6 rounded-3xl bg-[#0B3E6F]/20 border border-white/5 hover:bg-[#0B3E6F]/40 hover:border-[#00B5CB]/30 transition-all duration-300 text-left overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#00B5CB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-4 text-orange-400 group-hover:scale-110 transition-transform duration-300">
                                            <LayoutGrid size={24} />
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-1">Præsentation</h3>
                                        <p className="text-sm text-gray-400">Slides og visuelle overblik</p>
                                        <ArrowRight size={16} className="absolute bottom-6 right-6 text-[#00B5CB] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </button>

                                    {/* Email Creation */}
                                    <button className="group relative p-6 rounded-3xl bg-[#0B3E6F]/20 border border-white/5 hover:bg-[#0B3E6F]/40 hover:border-[#00B5CB]/30 transition-all duration-300 text-left overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#00B5CB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                            <Mail size={24} />
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-1">Email</h3>
                                        <p className="text-sm text-gray-400">Nyhedsbreve og kampagner</p>
                                        <ArrowRight size={16} className="absolute bottom-6 right-6 text-[#00B5CB] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </button>

                                    {/* Calendar Event */}
                                    <button className="group relative p-6 rounded-3xl bg-[#0B3E6F]/20 border border-white/5 hover:bg-[#0B3E6F]/40 hover:border-[#00B5CB]/30 transition-all duration-300 text-left overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#00B5CB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center mb-4 text-teal-400 group-hover:scale-110 transition-transform duration-300">
                                            <Calendar size={24} />
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-1">Begivenhed</h3>
                                        <p className="text-sm text-gray-400">Møder og workshops</p>
                                        <ArrowRight size={16} className="absolute bottom-6 right-6 text-[#00B5CB] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </button>
                                </div>

                                <div className="mt-12">
                                    <h3 className="text-lg font-medium text-white mb-6">Nylige kladder</h3>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                                <div className="w-10 h-10 rounded-xl bg-[#0B3E6F]/40 flex items-center justify-center text-gray-400">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Udkast til Q2 Strategi</h4>
                                                    <p className="text-xs text-gray-500">Redigeret for 2 timer siden</p>
                                                </div>
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {['word', 'outlook', 'calendar'].includes(activeTab) && (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00B5CB]/20 to-[#0B3E6F]/20 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
                                {sidebarItems.find(i => i.id === activeTab)?.icon({ size: 40, className: "text-[#00B5CB] opacity-80" }) as React.ReactNode}
                            </div>
                            <h3 className="text-2xl font-light text-white mb-2">
                                {sidebarItems.find(i => i.id === activeTab)?.label}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-xs text-center leading-relaxed">
                                Dette modul er under udvikling og vil snart være tilgængeligt i din DOT workspace.
                            </p>
                            <button className="mt-8 px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 text-sm transition-colors">
                                Få besked når klar
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
