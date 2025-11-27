import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X, Settings, MessageSquare, MoreHorizontal, Mic, Send, Plus, LayoutGrid, FileText, Mail, Calendar, ArrowRight, Sparkles, Bot, User, ChevronLeft, Paperclip, Image, Check, Zap } from 'lucide-react';
import { ClausLogo } from './ClausLogo';
import { WordView } from './apps/WordView';
import { OutlookView } from './apps/OutlookView';
import { CalendarView } from './apps/CalendarView';
import { LLM_MODELS, type LLMModel } from '../utils/llm-models';

interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
    headerActions?: React.ReactNode;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Custom hook for responsive breakpoints
const useResponsive = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        isMobile: windowSize.width < 768,
        isTablet: windowSize.width >= 768 && windowSize.width < 1024,
        isDesktop: windowSize.width >= 1024,
        width: windowSize.width,
        height: windowSize.height,
    };
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title = "WidgeTDC Workspace", headerActions }) => {
    const { isMobile, isTablet, isDesktop } = useResponsive();
    const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
    const [activeTab, setActiveTab] = useState('chat');
    const [chatInput, setChatInput] = useState('');
    const [conversationStyle, setConversationStyle] = useState('balanced');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>(() => {
        return localStorage.getItem('selected_model') || 'deepseek-chat';
    });
    const [enabledProviders, setEnabledProviders] = useState<string[]>(() => {
        const saved = localStorage.getItem('enabled_providers');
        return saved ? JSON.parse(saved) : ['openai', 'anthropic', 'google', 'deepseek'];
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('selected_model', selectedModel);
    }, [selectedModel]);

    useEffect(() => {
        localStorage.setItem('enabled_providers', JSON.stringify(enabledProviders));
    }, [enabledProviders]);

    // Auto-collapse sidebar on mobile
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        } else if (isDesktop) {
            setSidebarOpen(true);
        }
    }, [isMobile, isDesktop]);

    // Close sidebar when clicking outside on mobile
    const handleBackdropClick = useCallback(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [isMobile]);

    const sidebarItems = [
        { id: 'chat', icon: MessageSquare, label: 'DOT Chat' },
        { id: 'apps', icon: LayoutGrid, label: 'Mine Apps' },
        { id: 'create', icon: Plus, label: 'Opret' },
        { id: 'word', icon: FileText, label: 'Word' },
        { id: 'outlook', icon: Mail, label: 'Outlook' },
        { id: 'calendar', icon: Calendar, label: 'Kalender' },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() && attachments.length === 0) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: chatInput + (attachments.length > 0 ? `\n\n📎 ${attachments.map(f => f.name).join(', ')}` : ''),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setAttachments([]);
        setIsProcessing(true);

        try {
            const model = LLM_MODELS.find(m => m.id === selectedModel);
            
            const response = await fetch('/api/mcp/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: crypto.randomUUID(),
                    sourceId: 'widget-chat',
                    targetId: 'agent-orchestrator',
                    tool: 'srag.query',
                    payload: { query: chatInput, style: conversationStyle, model: selectedModel, provider: model?.provider },
                    createdAt: new Date().toISOString()
                })
            });

            if (response.ok) {
                const data = await response.json();
                const botMsg: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: data.result?.answer || data.result || JSON.stringify(data),
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                const botMsg: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `🤖 **DOT AI (${model?.name || selectedModel})**\n\nJeg modtog din besked: "${chatInput}"\n\nBackend forbindelse fejlede. Tjek at MCP serveren kører på port 3001.`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "⚠️ Forbindelse til backend fejlede. Tjek at serveren kører:\n\n```bash\nnpm run dev\n```",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleNavClick = (id: string) => {
        setActiveTab(id);
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    const handleFileAttach = () => fileInputRef.current?.click();
    const handleImageAttach = () => imageInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments(prev => [...prev, ...files]);
    };
    const toggleProvider = (provider: string) => {
        setEnabledProviders(prev => prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]);
    };
    const modelsByProvider = LLM_MODELS.reduce((acc, model) => {
        if (!acc[model.provider]) acc[model.provider] = [];
        acc[model.provider].push(model);
        return acc;
    }, {} as Record<string, LLMModel[]>);
    const getProviderIcon = (provider: string) => {
        switch (provider) { case 'openai': return '🟢'; case 'anthropic': return '🟠'; case 'google': return '🔵'; case 'deepseek': return '🟣'; default: return '⚪'; }
    };

    // Determine sidebar width based on state and device
    const getSidebarWidth = () => {
        if (isMobile) return '280px';
        if (isTablet) return isSidebarOpen ? '280px' : '70px';
        return isSidebarOpen ? '280px' : '70px';
    };

    const showLabels = isMobile || (isSidebarOpen && !isMobile);

    return (
        <div className="h-screen h-[100dvh] w-full overflow-hidden flex font-sans bg-[#051e3c] text-white selection:bg-[#00B5CB]/30 relative">
            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} multiple />
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} multiple />

            {/* Advanced Background Mesh Gradient */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-[#0B3E6F]/40 rounded-full blur-[120px] opacity-50 mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#00677F]/30 rounded-full blur-[150px] opacity-40 mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30" />
            </div>

            {/* Mobile Backdrop */}
            {isMobile && (
                <div
                    className={`sidebar-mobile-overlay ${isSidebarOpen ? 'visible' : ''}`}
                    onClick={handleBackdropClick}
                    aria-hidden="true"
                />
            )}

            {/* Ultra-Glassmorphic Sidebar */}
            <aside
                className={`
                    sidebar-responsive
                    relative z-50 flex flex-col border-r border-white/5
                    bg-[#0B3E6F]/20 backdrop-blur-xl
                    transition-all duration-300 ease-out
                    shadow-[4px_0_30px_rgba(0,0,0,0.3)]
                    ${isMobile ? (isSidebarOpen ? 'open' : '') : ''}
                `}
                style={{ width: getSidebarWidth() }}
            >
                {/* Header / Logo */}
                <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-5 shrink-0">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#00B5CB] to-[#00677F] flex items-center justify-center shadow-lg shadow-[#00B5CB]/20 ring-1 ring-white/10 group cursor-pointer hover:scale-105 transition-transform">
                            <ClausLogo size={isMobile ? 20 : 24} />
                        </div>
                        <div className={`flex flex-col transition-all duration-300 ${showLabels ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                            <span className="font-bold text-base md:text-lg tracking-tight text-white leading-none">DOT</span>
                            <span className="text-[9px] md:text-[10px] font-medium text-[#00B5CB] tracking-wider uppercase">TDC Erhverv</span>
                        </div>
                    </div>

                    {/* Close button for mobile */}
                    {isMobile && isSidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors touch-target"
                            aria-label="Luk menu"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-4 md:py-6 px-2 md:px-3 space-y-1 md:space-y-2">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`
                                w-full flex items-center gap-3 md:gap-4 px-3 py-2.5 md:py-3 rounded-xl
                                transition-all duration-300 group relative overflow-hidden touch-target
                                ${activeTab === item.id
                                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/5'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                            `}
                            aria-current={activeTab === item.id ? 'page' : undefined}
                        >
                            {activeTab === item.id && (
                                <div className="absolute inset-0 bg-gradient-to-r from-[#00B5CB]/10 to-transparent opacity-50" />
                            )}
                            <item.icon
                                size={isMobile ? 20 : 22}
                                className={`
                                    shrink-0 transition-all duration-300 z-10
                                    ${activeTab === item.id
                                        ? 'text-[#00B5CB] scale-110 drop-shadow-[0_0_8px_rgba(0,181,203,0.5)]'
                                        : 'group-hover:text-gray-200 group-hover:scale-105'}
                                `}
                            />
                            <span className={`
                                text-sm font-medium whitespace-nowrap transition-all duration-300 z-10
                                ${showLabels ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'}
                            `}>
                                {item.label}
                            </span>
                            {activeTab === item.id && showLabels && (
                                <div className="ml-auto w-1.5 h-1.5 bg-[#00B5CB] rounded-full shadow-[0_0_8px_#00B5CB]" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-3 md:p-4 border-t border-white/5 bg-black/10 backdrop-blur-md shrink-0">
                    <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 md:gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group touch-target">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 flex items-center justify-center text-xs font-bold shadow-md group-hover:ring-2 ring-[#00B5CB]/50 transition-all shrink-0">
                            CK
                        </div>
                        <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ${showLabels ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                            <span className="text-sm font-medium text-white truncate">Claus Kraft</span>
                            <span className="text-xs text-[#00B5CB] truncate">Pro Account</span>
                        </div>
                        {showLabels && <Settings size={16} className="ml-auto text-gray-500 group-hover:text-white transition-colors shrink-0" />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden main-content-responsive">
                {/* Top Bar */}
                <header className="h-14 md:h-20 flex items-center justify-between px-4 md:px-8 bg-transparent shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 md:p-2.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all active:scale-95 ring-1 ring-transparent hover:ring-white/10 touch-target"
                            aria-label={isSidebarOpen ? 'Skjul sidebar' : 'Vis sidebar'}
                        >
                            {isSidebarOpen && !isMobile ? <ChevronLeft size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="text-xs md:text-sm font-medium text-gray-400 tracking-wide uppercase truncate">{title}</h1>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {activeTab === 'apps' && headerActions}
                        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Indstillinger">
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Content Container */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {activeTab === 'chat' && (
                        <div className="flex-1 flex flex-col h-full relative">
                            {/* Model indicator */}
                            <div className="absolute top-2 right-4 z-10">
                                <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                                    <span>{getProviderIcon(LLM_MODELS.find(m => m.id === selectedModel)?.provider || 'openai')}</span>
                                    <span>{LLM_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                                </button>
                            </div>

                            {/* Chat History */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 scrollbar-hide">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 md:space-y-10 animate-fade-in px-4">
                                        <div className="relative">
                                            <div className="absolute -inset-4 bg-[#00B5CB]/20 rounded-full blur-xl animate-pulse" />
                                            <ClausLogo size={isMobile ? 48 : 64} className="relative z-10 drop-shadow-[0_0_15px_rgba(0,181,203,0.5)]" />
                                        </div>
                                        <h2 className="text-2xl md:text-5xl font-bold text-gradient tracking-tight drop-shadow-sm px-4">
                                            Hej Claus, hvad skal vi løse?
                                        </h2>

                                        {/* Suggestion Cards - Responsive Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 w-full max-w-4xl px-2">
                                            {[
                                                { title: 'Møde Opsummering', sub: 'Generer referat fra Teams', icon: FileText, color: 'text-blue-400' },
                                                { title: 'Data Analyse', sub: 'Analyser Q1 salgstal', icon: LayoutGrid, color: 'text-teal-400' },
                                                { title: 'Kunde Email', sub: 'Udkast til opfølgning', icon: Mail, color: 'text-purple-400' }
                                            ].map((card, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setChatInput(card.title + " ")}
                                                    className="text-left p-4 md:p-5 rounded-2xl bg-[#0B3E6F]/30 hover:bg-[#0B3E6F]/50 border border-white/5 hover:border-[#00B5CB]/30 transition-all duration-300 group active:scale-95 backdrop-blur-md shadow-lg hover:shadow-[#00B5CB]/10 touch-target"
                                                >
                                                    <div className="flex justify-between items-start mb-2 md:mb-3">
                                                        <card.icon size={isMobile ? 20 : 24} className={`${card.color} group-hover:scale-110 transition-transform duration-300`} />
                                                        <ArrowRight size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                                                    </div>
                                                    <div className="font-semibold text-sm md:text-base text-gray-100 mb-1">{card.title}</div>
                                                    <div className="text-xs text-gray-400 font-medium">{card.sub}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-32">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
                                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-white/10' : 'bg-[#00B5CB]/20'}`}>
                                                    {msg.role === 'user' ? <User size={isMobile ? 16 : 20} className="text-gray-300" /> : <Bot size={isMobile ? 16 : 20} className="text-[#00B5CB]" />}
                                                </div>
                                                <div className={`p-3 md:p-4 rounded-2xl max-w-[85%] md:max-w-[80%] ${msg.role === 'user' ? 'bg-[#0B3E6F]/60 text-white rounded-tr-none' : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5'}`}>
                                                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {isProcessing && (
                                            <div className="flex gap-3 md:gap-4 animate-fade-in">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#00B5CB]/20 flex items-center justify-center shrink-0">
                                                    <Bot size={isMobile ? 16 : 20} className="text-[#00B5CB]" />
                                                </div>
                                                <div className="p-3 md:p-4 rounded-2xl bg-white/5 rounded-tl-none border border-white/5 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-[#00B5CB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 bg-[#00B5CB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 bg-[#00B5CB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-[#051e3c] via-[#051e3c]/90 to-transparent z-20">
                                <div className="max-w-3xl mx-auto relative">
                                    {/* Conversation Style Toggle */}
                                    <div className={`absolute -top-12 md:-top-14 left-0 right-0 flex justify-center gap-2 transition-opacity duration-300 ${messages.length > 0 ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                                        <div className="bg-[#051e3c]/80 backdrop-blur-xl rounded-full p-1 md:p-1.5 border border-white/10 flex shadow-2xl ring-1 ring-white/5">
                                            {['creative', 'balanced', 'precise'].map((style) => (
                                                <button
                                                    key={style}
                                                    onClick={() => setConversationStyle(style)}
                                                    className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs font-semibold transition-all duration-300 capitalize touch-target ${conversationStyle === style ? 'bg-[#00B5CB] text-[#051e3c] shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {style === 'creative' ? 'Kreativ' : style === 'balanced' ? 'Balanceret' : 'Præcis'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Attachments Preview */}
                                    {attachments.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {attachments.map((file, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs">
                                                    <Paperclip size={12} />
                                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-400">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="bg-[#0B3E6F]/40 backdrop-blur-2xl rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl focus-within:border-[#00B5CB]/50 focus-within:ring-2 focus-within:ring-[#00B5CB]/20 transition-all duration-300 overflow-hidden group relative">
                                        <textarea
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Spørg DOT om hvad som helst..."
                                            className="w-full bg-transparent border-none text-base md:text-lg text-white placeholder-gray-400/60 p-4 md:p-6 pr-14 min-h-[60px] md:min-h-[70px] max-h-[150px] md:max-h-[200px] resize-none focus:ring-0 outline-none font-light scrollbar-hide"
                                            rows={1}
                                        />
                                        <div className="flex items-center justify-between px-3 md:px-5 pb-3 md:pb-5">
                                            <div className="flex gap-1 md:gap-2">
                                                <button onClick={handleFileAttach} className="p-2 md:p-2.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-[#00B5CB] transition-colors active:scale-95 touch-target" title="Vedhæft fil">
                                                    <Paperclip size={isMobile ? 18 : 20} />
                                                </button>
                                                <button onClick={handleImageAttach} className="p-2 md:p-2.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-[#00B5CB] transition-colors active:scale-95 touch-target hidden sm:flex" title="Vedhæft billede">
                                                    <Image size={isMobile ? 18 : 20} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2 md:gap-3">
                                                <button className="p-2 md:p-2.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors active:scale-95 touch-target" title="Tale">
                                                    <Mic size={isMobile ? 18 : 22} />
                                                </button>
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={(!chatInput.trim() && attachments.length === 0) || isProcessing}
                                                    className={`p-2 md:p-2.5 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center touch-target ${(chatInput.trim() || attachments.length > 0) ? 'bg-[#00B5CB] text-[#051e3c] shadow-[0_0_15px_rgba(0,181,203,0.4)] rotate-0' : 'bg-white/5 text-gray-600 rotate-90 cursor-not-allowed'}`}
                                                >
                                                    <Send size={isMobile ? 18 : 20} className={(chatInput.trim() || attachments.length > 0) ? 'ml-0.5' : ''} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center mt-3 md:mt-4 gap-2 items-center">
                                        <Sparkles size={12} className="text-[#00B5CB]" />
                                        <p className="text-center text-[9px] md:text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                                            DOT AI kan lave fejl. Kontroller vigtige oplysninger.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'apps' && (
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in">
                            {children}
                        </div>
                    )}

                    {activeTab === 'create' && (
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in">
                            <div className="max-w-6xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-light text-white mb-2">Opret nyt indhold</h2>
                                <p className="text-gray-400 mb-6 md:mb-10 font-light text-sm md:text-base">Vælg en skabelon eller start fra bunden med DOT AI.</p>

                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                    {[
                                        { title: 'Dokument', sub: 'Rapporter, notater og artikler', icon: FileText, color: 'bg-blue-500/20 text-blue-400' },
                                        { title: 'Præsentation', sub: 'Slides og visuelle overblik', icon: LayoutGrid, color: 'bg-orange-500/20 text-orange-400' },
                                        { title: 'Email', sub: 'Nyhedsbreve og kampagner', icon: Mail, color: 'bg-purple-500/20 text-purple-400' },
                                        { title: 'Begivenhed', sub: 'Møder og workshops', icon: Calendar, color: 'bg-teal-500/20 text-teal-400' }
                                    ].map((card, i) => (
                                        <button key={i} className="group relative p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#0B3E6F]/20 border border-white/5 hover:bg-[#0B3E6F]/40 hover:border-[#00B5CB]/30 transition-all duration-300 text-left overflow-hidden touch-target">
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#00B5CB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${card.color} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                                <card.icon size={isMobile ? 20 : 24} />
                                            </div>
                                            <h3 className="text-base md:text-lg font-medium text-white mb-1">{card.title}</h3>
                                            <p className="text-xs md:text-sm text-gray-400 hidden sm:block">{card.sub}</p>
                                            <ArrowRight size={16} className="absolute bottom-4 md:bottom-6 right-4 md:right-6 text-[#00B5CB] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'word' && (
                        <div className="flex-1 overflow-hidden p-4 md:p-6 animate-fade-in">
                            <WordView />
                        </div>
                    )}

                    {activeTab === 'outlook' && (
                        <div className="flex-1 overflow-hidden p-4 md:p-6 animate-fade-in">
                            <OutlookView />
                        </div>
                    )}

                    {activeTab === 'calendar' && (
                        <div className="flex-1 overflow-hidden p-4 md:p-6 animate-fade-in">
                            <CalendarView />
                        </div>
                    )}
                </div>
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
                    <div className="bg-[#0B3E6F] border border-white/20 rounded-2xl w-[500px] max-w-[95vw] max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Settings size={20} className="text-[#00B5CB]" />
                                Indstillinger
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto max-h-[calc(85vh-120px)]">
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-white mb-3">AI Model</h4>
                                <p className="text-xs text-gray-400 mb-4">Vælg hvilken AI model der skal bruges til chat.</p>
                                
                                <div className="space-y-3">
                                    {Object.entries(modelsByProvider).map(([provider, models]) => (
                                        <div key={provider} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-2 bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span>{getProviderIcon(provider)}</span>
                                                    <span className="text-sm font-medium text-white capitalize">{provider}</span>
                                                </div>
                                                <button
                                                    onClick={() => toggleProvider(provider)}
                                                    className={`w-10 h-5 rounded-full transition-colors ${enabledProviders.includes(provider) ? 'bg-[#00B5CB]' : 'bg-gray-600'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${enabledProviders.includes(provider) ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                            
                                            {enabledProviders.includes(provider) && (
                                                <div className="p-2 space-y-1">
                                                    {models.map(model => (
                                                        <button
                                                            key={model.id}
                                                            onClick={() => setSelectedModel(model.id)}
                                                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${selectedModel === model.id ? 'bg-[#00B5CB]/20 border border-[#00B5CB]/50' : 'hover:bg-white/5 border border-transparent'}`}
                                                        >
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium text-white">{model.name}</p>
                                                                <p className="text-[10px] text-gray-400">{model.description}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">{(model.contextWindow / 1000).toFixed(0)}K context</span>
                                                                    {model.pricing && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                                                                            ${model.pricing.input}/${model.pricing.output} per 1M
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {selectedModel === model.id && <Check size={18} className="text-[#00B5CB]" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                                <div className="flex items-start gap-3">
                                    <Zap size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-200">API Nøgler</p>
                                        <p className="text-xs text-yellow-200/70 mt-1">
                                            Konfigurer API nøgler i <code className="px-1 py-0.5 bg-black/20 rounded">.env</code>:
                                        </p>
                                        <pre className="text-[10px] mt-2 p-2 bg-black/20 rounded text-gray-300 overflow-x-auto">
{`OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 flex justify-end">
                            <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-[#00B5CB] hover:bg-[#009eb3] rounded-lg text-sm font-medium text-[#051e3c]">
                                Gem & Luk
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
