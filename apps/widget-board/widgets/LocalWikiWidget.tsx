import React, { useState, useEffect } from 'react';
import { Search, Book, Plus, Edit2, Save, Hash, Share2, FileText, Shield, Sparkles, Database, AlertTriangle, Paperclip, Eye, EyeOff, ThumbsUp, ThumbsDown } from 'lucide-react';
import { sendChat } from '../src/utils/chat-providers';
import { useWidgetSync } from '../src/hooks/useWidgetSync';

interface Article {
    id: string;
    title: string;
    category: string;
    content: string;
    lastUpdated: string;
    tags: string[];
    source: 'manual' | 'file' | 'scraper' | 'email' | 'system';
    sensitivity: 'public' | 'internal' | 'confidential' | 'pii';
    originalSourcePath?: string;
    attachments?: Attachment[];
    ownerId?: string; // Bruger ID på ejeren
}

interface Attachment {
    id: string;
    name: string;
    type: string;
    size: string;
    accessLevel: 'owner' | 'team' | 'public';
    aiAnalysis?: string; // AI forslag til deling
}

// Mock data der simulerer læsning fra filsystemet
// I produktion læses dette via MCP fra vector-db eller filsystemet
const INITIAL_ARTICLES: Article[] = [
    {
        id: '1',
        title: 'WidgeTDC Arkitektur',
        category: 'Teknisk',
        content: '# WidgeTDC Arkitektur\n\nDette projekt er bygget som en monorepo med React frontend og Node.js backend via MCP (Model Context Protocol).\n\n## Komponenter\n- **Widget Board**: Frontend dashboard\n- **MCP Server**: Backend logik\n- **Agents**: AI agenter der kører autonomt',
        lastUpdated: '2025-11-27',
        tags: ['arkitektur', 'react', 'mcp'],
        source: 'manual',
        sensitivity: 'public'
    },
    {
        id: '2',
        title: 'Scraped Data: TDC Erhverv',
        category: 'Market Research',
        content: '# Markedsanalyse\n\nData hentet fra offentlige kilder.\n\n[Link til original kilde]\n\n## Observationer\n...',
        lastUpdated: '2025-11-27',
        tags: ['market', 'tdc', 'auto-generated'],
        source: 'scraper',
        sensitivity: 'internal',
        originalSourcePath: '/data/scrapes/tdc-2025-11-27.json'
    },
    {
        id: '3',
        title: 'Kunde Email: Support Sag #1234',
        category: 'Support',
        content: 'Fra: [REDACTED]\nEmne: Fejl ved login\n\nHej Support,\n\nJeg kan ikke logge ind på min konto [REDACTED]. Min CPR er [REDACTED].\n\nMvh,\n[REDACTED]',
        lastUpdated: '2025-11-26',
        tags: ['support', 'login', 'pii-detected'],
        source: 'email',
        sensitivity: 'pii',
        ownerId: 'current-user', // Simulerer at vi ejer denne
        attachments: [
            { id: 'a1', name: 'Fejlbesked.png', type: 'image/png', size: '1.2 MB', accessLevel: 'public' },
            { id: 'a2', name: 'Kontrakt_Udkast.pdf', type: 'application/pdf', size: '450 KB', accessLevel: 'owner', aiAnalysis: 'Indeholder kontraktuelle data. Bør kun deles med omtanke.' }
        ]
    }
];

const PrivacyGuard = ({ text, sensitivity }: { text: string, sensitivity: Article['sensitivity'] }) => {
    if (sensitivity === 'pii' || sensitivity === 'confidential') {
        return (
            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-red-400 mb-2 font-semibold">
                    <Shield size={16} />
                    <span>Privacy Shield Aktivt</span>
                </div>
                <p className="text-xs text-red-300/80">
                    Dette indhold indeholder personfølsomme data (PII). Visse oplysninger er automatisk sløret for at overholde GDPR.
                    Original data findes kun i kildesystemet (f.eks. Outlook) og er ikke kopieret her.
                </p>
            </div>
        );
    }
    return null;
};

const SmartAttachment = ({ attachment, isOwner }: { attachment: Attachment, isOwner: boolean }) => {
    const [access, setAccess] = useState(attachment.accessLevel);
    const [showAnalysis, setShowAnalysis] = useState(false);

    const canView = isOwner || access === 'public' || access === 'team';

    return (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded text-blue-400">
                    <Paperclip size={16} />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white">{attachment.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{attachment.size}</span>
                        <span>•</span>
                        <span className={`uppercase ${access === 'owner' ? 'text-red-400' : access === 'team' ? 'text-yellow-400' : 'text-green-400'}`}>
                            {access === 'owner' ? 'Privat' : access === 'team' ? 'Team' : 'Offentlig'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {attachment.aiAnalysis && isOwner && (
                    <div className="relative">
                        <button 
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className="p-1.5 hover:bg-white/10 rounded text-purple-400 transition-colors"
                            title="AI Analyse"
                        >
                            <Sparkles size={14} />
                        </button>
                        {showAnalysis && (
                            <div className="absolute right-0 top-8 w-64 bg-[#0B3E6F] border border-white/20 rounded-xl p-3 shadow-2xl z-10 text-xs">
                                <p className="text-purple-300 font-semibold mb-1">AI Anbefaling</p>
                                <p className="text-gray-300 mb-2">{attachment.aiAnalysis}</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded flex items-center justify-center gap-1">
                                        <ThumbsUp size={12} /> Enig
                                    </button>
                                    <button className="flex-1 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded flex items-center justify-center gap-1">
                                        <ThumbsDown size={12} /> Uenig
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {isOwner ? (
                    <button 
                        onClick={() => setAccess(access === 'owner' ? 'public' : 'owner')}
                        className={`p-1.5 rounded transition-colors ${access === 'owner' ? 'hover:bg-green-500/20 text-gray-400 hover:text-green-400' : 'hover:bg-red-500/20 text-green-400 hover:text-red-400'}`}
                        title={access === 'owner' ? 'Gør offentlig' : 'Gør privat'}
                    >
                        {access === 'owner' ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                ) : (
                    !canView && <div title="Ingen adgang"><Shield size={14} className="text-red-500" /></div>
                )}
            </div>
        </div>
    );
};

export default function LocalWikiWidget() {
    const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);

    // Synkroniser tilstand til systemets hjerne
    useWidgetSync('local-wiki', {
        activeArticle: selectedArticle?.title,
        articleCount: articles.length,
        searchQuery,
        recentTags: selectedArticle?.tags
    });

    // Simuleret bruger ID
    const currentUserId = 'current-user';

    const filteredArticles = articles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSave = () => {
        setIsEditing(false);
        // Her ville vi sende en MCP kommando for at opdatere metadata, IKKE selve filen hvis det er scraper data
        console.log('Gemmer metadata...');
    };

    const generateTags = async (article: Article) => {
        if (isGeneratingTags) return;
        setIsGeneratingTags(true);
        try {
            // Simulerer kald til lokal LLM
            // I produktion: await sendChat(...) med artikel indhold
            const response = await sendChat({
                providerId: 'ollama', // Bruger lokal model
                modelId: 'llama3.2'
            }, [
                { role: 'system', content: 'Du er en metadata generator. Generer 3-5 relevante tags for følgende tekst. Svar KUN med tags separeret af komma.' },
                { role: 'user', content: article.content.substring(0, 500) }
            ]);
            
            const newTags = response.content.split(',').map(t => t.trim());
            setArticles(prev => prev.map(a => a.id === article.id ? { ...a, tags: [...new Set([...a.tags, ...newTags])] } : a));
            if (selectedArticle?.id === article.id) {
                setSelectedArticle(prev => prev ? { ...prev, tags: [...new Set([...prev.tags, ...newTags])] } : null);
            }
        } catch (error) {
            console.error("Fejl ved generering af tags:", error);
            // Fallback mock
            setTimeout(() => {
                const mockTags = ['auto-tag-1', 'ai-analyse', 'indhold'];
                setArticles(prev => prev.map(a => a.id === article.id ? { ...a, tags: [...new Set([...a.tags, ...mockTags])] } : a));
                if (selectedArticle?.id === article.id) {
                    setSelectedArticle(prev => prev ? { ...prev, tags: [...new Set([...prev.tags, ...mockTags])] } : null);
                }
                setIsGeneratingTags(false);
            }, 1000);
        } finally {
            setIsGeneratingTags(false);
        }
    };

    return (
        <div className="flex h-full bg-[#0B3E6F]/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden text-white">
            {/* Sidebar / Liste */}
            <div className="w-1/3 border-r border-white/10 flex flex-col bg-black/10">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                            <Book size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-none">Vidensbase</h2>
                            <p className="text-[10px] text-gray-400">Indekseret fra filer & systemer</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Søg i viden..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredArticles.map(article => (
                        <button
                            key={article.id}
                            onClick={() => { setSelectedArticle(article); setIsEditing(false); }}
                            className={`w-full text-left p-3 rounded-lg transition-all group hover:bg-white/5 ${selectedArticle?.id === article.id ? 'bg-white/10 border border-white/5' : 'border border-transparent'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className={`text-sm font-medium truncate pr-2 ${selectedArticle?.id === article.id ? 'text-orange-400' : 'text-gray-200'}`}>
                                    {article.title}
                                </h3>
                                {article.sensitivity === 'pii' && <Shield size={12} className="text-red-400 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                    article.source === 'scraper' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                                    article.source === 'email' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' :
                                    'bg-white/5 border-white/10 text-gray-400'
                                }`}>
                                    {article.source === 'scraper' ? 'Scraper' : article.source === 'email' ? 'Email' : 'Manuel'}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    {article.lastUpdated}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-3 border-t border-white/10">
                    <button className="w-full py-2 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> Ny Manuel Artikel
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-[#051e3c]/20">
                {selectedArticle ? (
                    <>
                        <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs font-medium border border-orange-500/20">
                                    {selectedArticle.category}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Hash size={12} className="text-gray-500" />
                                    {selectedArticle.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-300">{tag}</span>
                                    ))}
                                    <button 
                                        onClick={() => generateTags(selectedArticle)}
                                        disabled={isGeneratingTags}
                                        className="ml-2 p-1 hover:bg-white/10 rounded text-orange-400 transition-colors" 
                                        title="Generer Tags med AI"
                                    >
                                        <Sparkles size={12} className={isGeneratingTags ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {selectedArticle.source === 'manual' && (
                                    isEditing ? (
                                        <button onClick={handleSave} className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors" title="Gem">
                                            <Save size={18} />
                                        </button>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors" title="Rediger">
                                            <Edit2 size={18} />
                                        </button>
                                    )
                                )}
                                <button className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors" title="Del">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 relative">
                            {selectedArticle.source !== 'manual' && (
                                <div className="absolute top-4 right-8 flex items-center gap-2 text-xs text-gray-500 bg-black/20 px-3 py-1.5 rounded-full">
                                    <Database size={12} />
                                    <span>Læser fra: {selectedArticle.originalSourcePath || 'Ekstern kilde'}</span>
                                </div>
                            )}

                            <PrivacyGuard text={selectedArticle.content} sensitivity={selectedArticle.sensitivity} />

                            {isEditing ? (
                                <textarea 
                                    className="w-full h-full bg-transparent border-none focus:ring-0 text-gray-200 font-mono text-sm resize-none"
                                    defaultValue={selectedArticle.content}
                                />
                            ) : (
                                <div className="prose prosem-sm prose-invert max-w-none">
                                    {/* Simpel markdown rendering simulation */}
                                    {selectedArticle.content.split('\n').map((line, i) => {
                                        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 text-white">{line.replace('# ', '')}</h1>;
                                        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mt-6 mb-3 text-orange-200">{line.replace('## ', '')}</h2>;
                                        if (line.startsWith('- ')) return <li key={i} className="ml-4 text-gray-300">{line.replace('- ', '')}</li>;
                                        if (line.match(/^\d\./)) return <div key={i} className="ml-4 text-gray-300 mb-1">{line}</div>;
                                        if (line === '') return <br key={i} />;
                                        // PII Redaction simulation
                                        const content = line.replace(/\[REDACTED\]/g, '<span class="bg-red-500/20 text-red-300 px-1 rounded text-xs font-mono">[SLØRET]</span>');
                                        return <p key={i} className="text-gray-300 mb-2 leading-relaxed" dangerouslySetInnerHTML={{__html: content}} />;
                                    })}
                                </div>
                            )}

                            {/* Vedhæftninger Sektion */}
                            {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                        <Paperclip size={14} /> Vedhæftede Filer
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedArticle.attachments.map(att => (
                                            <SmartAttachment 
                                                key={att.id} 
                                                attachment={att} 
                                                isOwner={selectedArticle.ownerId === currentUserId}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>Vælg en artikel for at se indhold</p>
                        <p className="text-xs mt-2 text-gray-600">Data indlæses direkte fra kildesystemer uden duplikering</p>
                    </div>
                )}
            </div>
        </div>
    );
}
