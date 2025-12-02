import React, { useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Send, Database, Terminal, Search } from 'lucide-react';

interface SragResult {
  type: 'analytical' | 'semantic';
  result: any[];
  sqlQuery: string | null;
  metadata: {
    traceId: string;
    docIds?: number[];
  };
}

const SragGovernanceWidget: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SragResult | null>(null);
  const [error, setError] = useState('');
  const [sqlOnly, setSqlOnly] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!query.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      // Simulate API call for robust demo
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (query.toLowerCase().includes('fail')) {
          throw new Error('Simulation of backend failure for demo purposes');
      }

      // Mock Response
      const isAnalytical = sqlOnly || query.toLowerCase().includes('count') || query.toLowerCase().includes('total');
      
      const mockResult: SragResult = {
          type: isAnalytical ? 'analytical' : 'semantic',
          sqlQuery: isAnalytical ? `SELECT sum(amount) FROM supplier_spend WHERE category = '${query.split(' ')[0]}'` : null,
          result: isAnalytical 
             ? [{ total_spend: 125000, currency: 'USD' }] 
             : [{ title: 'Architecture Review.pdf', snippet: '...system architecture must enforce zero-trust...' }, { title: 'Meeting_Notes_Q1.txt', snippet: '...discussed governance policies...' }],
          metadata: {
              traceId: crypto.randomUUID().substring(0, 8),
              docIds: [101, 104]
          }
      };

      setResult(mockResult);

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MatrixWidgetWrapper title="SRAG Governance Engine">
      <div className="flex flex-col h-full overflow-hidden">
        
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-3 shrink-0">
          <div className="relative">
            <div className="absolute top-3 left-3 text-gray-500">
                <Search size={16} />
            </div>
            <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about governance, spending, or compliance..."
                className="w-full min-h-[80px] pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB] focus:ring-1 focus:ring-[#00B5CB]/20 resize-none transition-all"
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white transition-colors select-none">
                <input
                    type="checkbox"
                    checked={sqlOnly}
                    onChange={(e) => setSqlOnly(e.target.checked)}
                    className="w-3 h-3 rounded bg-black/40 border-gray-600 text-[#00B5CB] focus:ring-offset-0 focus:ring-transparent"
                />
                SQL-only Mode (Strict Analytical)
            </label>

            <button
                type="submit"
                disabled={loading || !query.trim()}
                className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all ${
                    loading || !query.trim() 
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#00B5CB] text-[#051e3c] hover:bg-[#009eb3] shadow-lg shadow-[#00B5CB]/20'
                }`}
            >
                {loading ? 'Processing...' : <>Execute <Send size={12} /></>}
            </button>
          </div>
        </form>

        {/* Results Area */}
        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-4 overflow-y-auto relative custom-scrollbar flex flex-col">
            {!result && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500/40 gap-3">
                    <Database size={48} strokeWidth={1} />
                    <p className="text-xs font-medium">Ready for query</p>
                </div>
            )}

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    Error: {error}
                </div>
            )}

            {result && (
                <div className="animate-fade-in space-y-4">
                     {/* Header */}
                     <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${result.type === 'analytical' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {result.type === 'analytical' ? 'Analytical Result' : 'Semantic Search'}
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">Trace: {result.metadata.traceId}</span>
                     </div>

                     {/* SQL Query View */}
                     {result.sqlQuery && (
                         <div className="space-y-1">
                             <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                 <Terminal size={10} /> SQL Generated
                             </div>
                             <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-xs text-blue-300 overflow-x-auto">
                                 {result.sqlQuery}
                             </div>
                         </div>
                     )}

                     {/* Data Result */}
                     <div className="space-y-2">
                        {result.result.map((item, i) => (
                            <div key={i} className="bg-black/20 p-3 rounded-lg text-xs text-gray-300 font-mono whitespace-pre-wrap border border-white/5">
                                {JSON.stringify(item, null, 2)}
                            </div>
                        ))}
                     </div>
                </div>
            )}
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default SragGovernanceWidget;
