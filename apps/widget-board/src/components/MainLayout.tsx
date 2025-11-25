import React, { useState } from 'react';
import { Menu, X, Settings, MessageSquare, MoreHorizontal, ImageIcon, Mic, Send } from 'lucide-react';
import { ClausLogo } from './ClausLogo';

interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
    headerActions?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title = "WidgeTDC Workspace", headerActions }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('work');
    const [chatInput, setChatInput] = useState('');

    return (
        <div className="h-screen w-full overflow-hidden flex font-segoe bg-[#202020] text-white">
            {/* Copilot Sidebar */}
            <aside className={`w-[400px] flex flex-col border-r border-white/10 bg-[#2c2c2c]/95 backdrop-blur-xl shadow-2xl z-50 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute'}`}>

                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center shadow-lg group-hover:border-blue-500/30 transition-all">
                            <ClausLogo size={24} />
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                            WidgeTDC
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <MoreHorizontal size={20} className="text-gray-400" />
                        </button>
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

                {/* Conversation Style (Copilot Style) */}
                <div className="px-6 pb-4">
                    <div className="text-[10px] text-center text-gray-400 mb-2 font-medium tracking-wide uppercase">Conversation Style</div>
                    <div className="flex bg-black/20 rounded-full p-1 border border-white/5">
                        <button className="flex-1 py-2 rounded-full text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition-all flex flex-col items-center gap-0.5">
                            <span>Creative</span>
                        </button>
                        <button className="flex-1 py-2 rounded-full text-xs font-medium text-blue-400 bg-white/10 shadow-sm transition-all flex flex-col items-center gap-0.5">
                            <span>Balanced</span>
                        </button>
                        <button className="flex-1 py-2 rounded-full text-xs font-medium text-teal-400 hover:bg-teal-500/10 transition-all flex flex-col items-center gap-0.5">
                            <span>Precise</span>
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Welcome Message */}
                    <div className="flex gap-4 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 shrink-0 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <MessageSquare size={14} className="text-white" />
                        </div>
                        <div className="space-y-2">
                            <div className="bg-[#3d3d3d]/80 backdrop-blur-md p-4 rounded-2xl rounded-tl-none border border-white/5 shadow-sm">
                                <p className="text-sm leading-relaxed text-gray-200">
                                    Hi Claus, I'm your WidgeTDC Copilot. I can help you manage your widgets, analyze data, and automate tasks.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 pt-2">
                    <div className="flex justify-center mb-2">
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-medium shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105"
                            onClick={() => setChatInput('')}
                        >
                            <MessageSquare size={12} />
                            New Topic
                        </button>
                    </div>
                    <div className="relative bg-[#3d3d3d] rounded-3xl border border-white/10 shadow-2xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                        <textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="w-full bg-transparent border-none text-sm text-white placeholder-gray-400 p-4 pr-12 min-h-[50px] max-h-[150px] resize-none focus:ring-0 outline-none"
                            rows={1}
                        />
                        <div className="flex items-center justify-between px-3 pb-3">
                            <div className="flex gap-1">
                                <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors" title="Add Image">
                                    <ImageIcon size={18} />
                                </button>
                                <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors" title="Use Microphone">
                                    <Mic size={18} />
                                </button>
                            </div>
                            <button className={`p-2 rounded-full transition-all ${chatInput ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-gray-500'}`}>
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-gray-500 mt-3">
                        AI-generated content may be incorrect.
                    </p>
                </div>
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[#1e1e1e]">
                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#252525]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="text-sm font-semibold text-gray-300">{title}</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {headerActions}
                        <button
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {/* Background Glows */}
                    <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

                    {children}
                </div>
            </main>
        </div>
    );
};
