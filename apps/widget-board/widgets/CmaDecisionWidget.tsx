import React, { useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Lightbulb, FileText, Tag, Brain } from 'lucide-react';

interface Memory {
  id: number;
  content: string;
  importance: number;
}

const CmaDecisionWidget: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [widgetData, setWidgetData] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate for demo
      await new Promise(r => setTimeout(r, 1500));
      
      setPrompt(`Based on the budget constraints mentioned in 'Q3 Report' and the architectural standards defined in 'Enterprise Blueprints', I recommend proceeding with Option B. It minimizes technical debt while keeping within the 15% buffer.`);
      setMemories([
          { id: 1, content: "Enterprise Blueprints v2.0 - Microservices", importance: 5 },
          { id: 2, content: "Q3 Budget Report - IT Ops", importance: 4 }
      ]);

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MatrixWidgetWrapper title="CMA Decision Support">
      <div className="flex flex-col h-full gap-4">
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Brain size={10}/> Decision Query</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Should we migrate to GraphQL for the user service?"
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00B5CB]/50 min-h-[60px] resize-none"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><FileText size={10}/> Context</label>
                <input
                    type="text"
                    value={widgetData}
                    onChange={(e) => setWidgetData(e.target.value)}
                    placeholder="Additional context..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00B5CB]/50"
                />
            </div>
            <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Tag size={10}/> Tags</label>
                <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="architecture, budget..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00B5CB]/50"
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing Context...' : 'Generate Recommendation'}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            {/* Prompt Result */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Lightbulb size={10}/> Recommendation</h3>
                {prompt ? (
                    <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{prompt}</p>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500/50 text-xs">
                        <Brain size={24} className="mb-2 opacity-50" />
                        Ready to analyze
                    </div>
                )}
            </div>

            {/* Memories */}
            {memories.length > 0 && (
                <div className="h-1/3 bg-white/5 border border-white/10 rounded-xl p-3 overflow-y-auto custom-scrollbar">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Relevant Memories</h3>
                    <div className="space-y-2">
                        {memories.map((memory) => (
                        <div key={memory.id} className="bg-black/20 p-2 rounded border border-white/5 flex justify-between items-start">
                            <span className="text-[10px] text-gray-300">{memory.content}</span>
                            <span className="text-[9px] text-[#00B5CB] whitespace-nowrap ml-2">{'⭐'.repeat(memory.importance)}</span>
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

export default CmaDecisionWidget;
