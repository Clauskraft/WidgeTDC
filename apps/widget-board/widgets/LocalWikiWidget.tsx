import React, { useState } from 'react';
import { Search, Book, Plus, Edit2, Save, Hash, Share2, FileText } from 'lucide-react';

interface Article {
    id: string;
    title: string;
    category: string;
    content: string;
    lastUpdated: string;
    tags: string[];
}

// Mock data - i produktion vil dette læses fra filsystemet via MCP
const INITIAL_ARTICLES: Article[] = [
    {
        id: '1',
        title: 'WidgeTDC Arkitektur',
        category: 'Teknisk',
        content: '# WidgeTDC Arkitektur\n\nDette projekt er bygget som en monorepo med React frontend og Node.js backend via MCP (Model Context Protocol).\n\n## Komponenter\n- **Widget Board**: Frontend dashboard\n- **MCP Server**: Backend logik\n- **Agents**: AI agenter der kører autonomt',
        lastUpdated: '2025-11-27',
        tags: ['arkitektur', 'react', 'mcp']
    },
    {
        id: '2',
        title: 'System Status Procedurer',
        category: 'Drift',
        content: '# Status Check\n\nVed systemfejl skal følgende tjekkes:\n1. Kører Docker containerne?\n2. Er API nøgler gyldige?\n3. Tjek logs i `~/.cursor/logs`',
        lastUpdated: '2025-11-26',
        tags: ['drift', 'support']
    },
    {
        id: '3',
        title: 'AI Governance Regler',
        category: 'Compliance',
        content: '# Governance\n\nAlle AI modeller skal overholde følgende:\n- Ingen PII data i prompts til offentlige modeller\n- Brug "Local" modeller til sensitiv data\n- Budget skal godkendes af admin',
        lastUpdated: '2025-11-20',
        tags: ['compliance', 'ai', 'regler']
    }
];

export default function LocalWikiWidget() {
    const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const filteredArticles = articles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSave = () => {
        setIsEditing(false);
        // Her ville vi sende en MCP kommando for at gemme til disk
        console.log('Gemmer artikel til lokal disk...');
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
                        <h2 className="font-bold text-lg">Lokal Wiki</h2>
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
                            <h3 className={`text-sm font-medium ${selectedArticle?.id === article.id ? 'text-orange-400' : 'text-gray-200'}`}>
                                {article.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                                    {article.category}
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
                        <Plus size={16} /> Ny Artikel
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
                                <span className="text-gray-500 text-xs flex items-center gap-1">
                                    <Hash size={12} /> {selectedArticle.tags.join(', ')}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <button onClick={handleSave} className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors" title="Gem">
                                        <Save size={18} />
                                    </button>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors" title="Rediger">
                                        <Edit2 size={18} />
                                    </button>
                                )}
                                <button className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors" title="Del">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
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
                                        return <p key={i} className="text-gray-300 mb-2 leading-relaxed">{line}</p>;
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>Vælg en artikel eller opret en ny</p>
                    </div>
                )}
            </div>
        </div>
    );
}

