import React, { useState, useEffect } from 'react';
import { Radio, CheckCircle, AlertCircle, Play, Loader2, Database } from 'lucide-react';

interface KnowledgeTarget {
  id: string;
  name: string;
  url: string;
  cortex: string;
}

interface CortexGroup {
  targets: KnowledgeTarget[];
}

interface KnowledgeTargetsResponse {
  targets: {
    sources: KnowledgeTarget[];
    cortex: string;
    description: string;
  }[];
}

const FeedIngestionWidget: React.FC = () => {
  const [groups, setGroups] = useState<KnowledgeTargetsResponse['targets']>([]);
  const [loading, setLoading] = useState(true);
  const [ingestingId, setIngestingId] = useState<string | null>(null);

  const fetchTargets = async () => {
    try {
      const res = await fetch('/api/acquisition/targets');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.data?.targets || []);
      }
    } catch (error) {
      console.error("Feed fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const ingestTarget = async (id: string) => {
    setIngestingId(id);
    try {
      const res = await fetch(`/api/acquisition/acquire/target/${id}`, { method: 'POST' });
      if (res.ok) {
        // Show success feedback visually
        setTimeout(() => setIngestingId(null), 1000);
      }
    } catch (error) {
      console.error("Ingest error:", error);
      setIngestingId(null);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">FEED_INGESTION</h3>
        </div>
        <span className="text-[10px] text-gray-400">NEURO-ENGRAMS DETECTED</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-orange-400" /></div>
        ) : (
            groups.map((group, idx) => (
                <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{group.cortex}</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>
                    
                    <div className="space-y-1">
                        {group.sources?.map(source => (
                            <div key={source.id} className="flex items-center justify-between p-2 bg-black/20 hover:bg-black/40 rounded border border-white/5 hover:border-orange-500/30 transition-all group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center text-[10px] text-orange-400 font-mono border border-orange-500/20">
                                        {source.id}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-gray-200 truncate">{source.name}</div>
                                        <div className="text-[9px] text-gray-500 truncate">{source.url}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => ingestTarget(source.id)}
                                    disabled={!!ingestingId}
                                    className="ml-2 p-1.5 rounded bg-white/5 hover:bg-orange-500/20 text-gray-400 hover:text-orange-400 transition-colors disabled:opacity-50"
                                >
                                    {ingestingId === source.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default FeedIngestionWidget;