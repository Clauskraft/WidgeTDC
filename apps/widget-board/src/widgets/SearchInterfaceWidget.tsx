import React, { useState } from 'react';
import { Search, ArrowRight, Database, FileText, Loader2 } from 'lucide-react';

const SearchInterfaceWidget: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/acquisition/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, limit: 5 })
      });
      
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">NEURAL_SEARCH</h3>
        </div>
      </div>

      <div className="p-4 border-b border-white/5">
        <form onSubmit={handleSearch} className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query the cortex..."
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <button type="submit" disabled={loading} className="absolute right-2 top-1.5 p-1 bg-blue-500/20 rounded hover:bg-blue-500/40 text-blue-400 transition-colors">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {results.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                <Database size={32} className="mb-2" />
                <span className="text-xs">AWAITING INPUT</span>
            </div>
        )}
        
        {results.map((result, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all group">
                <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 rounded bg-blue-500/10 text-blue-400">
                        <FileText size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 line-clamp-2 mb-1 leading-relaxed">
                            "{result.content}"
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-gray-500 font-mono">
                                SIMILARITY: {(result.similarity * 100).toFixed(1)}%
                            </span>
                            {result.metadata?.sourceId && (
                                <span className="text-[9px] text-gray-600">ID: {result.metadata.sourceId}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default SearchInterfaceWidget;