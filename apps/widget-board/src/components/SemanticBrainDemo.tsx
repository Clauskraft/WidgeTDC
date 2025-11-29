import React, { useState } from 'react';
import { useSemanticBrain } from '../hooks/useSemanticBrain';
import { Brain, Search, Zap, MessageCircle, Sparkles, Clock } from 'lucide-react';

/**
 * Semantic Brain Demo Widget
 *
 * Demonstrates the telepathic capabilities:
 * - Recall: Search collective memory by meaning
 * - Broadcast: Send thoughts into the semantic bus
 * - View brain status
 */
export const SemanticBrainDemo: React.FC = () => {
  const {
    thoughts,
    isThinking,
    brainStatus,
    canDream,
    recall,
    broadcast,
    thinkAbout,
    shareInsight
  } = useSemanticBrain('BrainDemo');

  const [query, setQuery] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');

  const handleRecall = async () => {
    if (query.trim()) {
      await recall(query);
    }
  };

  const handleBroadcast = async () => {
    if (broadcastContent.trim()) {
      await broadcast('THOUGHT', broadcastContent);
      setBroadcastContent('');
    }
  };

  const handleThinkAbout = async () => {
    if (query.trim()) {
      await thinkAbout(query);
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-700 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${canDream ? 'bg-purple-500/20' : 'bg-slate-700'}`}>
          <Brain className={`w-6 h-6 ${canDream ? 'text-purple-400' : 'text-slate-400'}`} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Semantic Brain</h2>
          <p className="text-xs text-slate-400">
            Status: {brainStatus?.status || 'loading...'} |
            Mode: {canDream ? '🌙 Dreaming' : '👁 Awake'}
          </p>
        </div>
        {isThinking && (
          <div className="ml-auto">
            <div className="animate-pulse flex items-center gap-2 text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Brain Status */}
      {brainStatus && (
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-800/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {brainStatus.metrics.totalThoughts}
            </div>
            <div className="text-xs text-slate-400">Total Thoughts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {brainStatus.metrics.thoughtsWithEmbeddings}
            </div>
            <div className="text-xs text-slate-400">With Vectors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {brainStatus.metrics.activeAgents}
            </div>
            <div className="text-xs text-slate-400">Active Agents</div>
          </div>
        </div>
      )}

      {/* Recall Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Search className="w-4 h-4 inline mr-2" />
          Recall from Collective Memory
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRecall()}
            placeholder="What do you want to remember?"
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleRecall}
            disabled={isThinking || !query.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 rounded-lg transition-colors"
          >
            Recall
          </button>
          <button
            onClick={handleThinkAbout}
            disabled={isThinking || !query.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg transition-colors"
            title="Broadcast thought, then recall related"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results */}
      {thoughts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">
            Related Thoughts ({thoughts.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {thoughts.map((thought) => (
              <div
                key={thought.id}
                className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{thought.content}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-700 rounded">
                        {thought.agent}
                      </span>
                      <span className="text-purple-400">{thought.type}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(thought.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-mono ${
                    thought.score > 0.8 ? 'bg-green-500/20 text-green-400' :
                    thought.score > 0.6 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {(thought.score * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast Section */}
      <div className="border-t border-slate-700 pt-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <MessageCircle className="w-4 h-4 inline mr-2" />
          Broadcast a Thought
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={broadcastContent}
            onChange={(e) => setBroadcastContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
            placeholder="Share a thought with the collective..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleBroadcast}
            disabled={!broadcastContent.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Broadcasted thoughts become searchable by other widgets via semantic similarity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          onClick={() => shareInsight('This is a test insight from the demo widget', 0.95)}
          className="px-3 py-1.5 bg-amber-600/20 text-amber-400 border border-amber-600/30 rounded-lg text-sm hover:bg-amber-600/30 transition-colors"
        >
          💡 Share Insight
        </button>
        <button
          onClick={() => recall('security threats')}
          className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm hover:bg-red-600/30 transition-colors"
        >
          🛡 Recall Security
        </button>
        <button
          onClick={() => recall('GDPR compliance')}
          className="px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-sm hover:bg-green-600/30 transition-colors"
        >
          📋 Recall Compliance
        </button>
      </div>
    </div>
  );
};

export default SemanticBrainDemo;
