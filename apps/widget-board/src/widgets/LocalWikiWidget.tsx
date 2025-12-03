import React, { useState, useEffect } from 'react';
import { Book, FileText, Tag, Network, RefreshCw, Database } from 'lucide-react';

interface WikiNode {
  id: string;
  name: string;
  labels: string[];
  properties: any;
}

const LocalWikiWidget: React.FC = () => {
  const [nodes, setNodes] = useState<WikiNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<WikiNode | null>(null);

  const fetchWikiData = async () => {
    setLoading(true);
    try {
      // Fetch nodes from Neo4j via the graph stats endpoint
      const res = await fetch('/api/evolution/graph/stats');
      if (res.ok) {
        const data = await res.json();
        // Filter out simple file nodes to focus on concepts/documents if possible, 
        // or just show everything for now
        setNodes(data.nodes || []);
      }
    } catch (error) {
      console.error("Wiki fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWikiData();
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <Book className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">LOCAL_WIKI</h3>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">{nodes.length} ENTRIES</span>
            <button onClick={fetchWikiData} className="p-1 hover:bg-white/10 rounded text-green-400">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto custom-scrollbar bg-black/10">
            {nodes.length === 0 && !loading && (
                <div className="p-4 text-center text-gray-500 text-xs">
                    No knowledge detected.<br/>Run a Harvest to populate.
                </div>
            )}
            {nodes.map(node => (
                <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${selectedNode?.id === node.id ? 'bg-[#00B5CB]/10 border-l-2 border-l-[#00B5CB]' : ''}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        {node.labels?.includes('Directory') ? <Database size={12} className="text-purple-400" /> : <FileText size={12} className="text-blue-400" />}
                        <span className="text-sm font-medium text-gray-200 truncate">{node.name}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {node.labels?.map((label: string) => (
                            <span key={label} className="text-[9px] px-1.5 rounded bg-white/5 text-gray-500">{label}</span>
                        ))}
                    </div>
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-black/20">
            {selectedNode ? (
                <div className="space-y-4">
                    <div className="border-b border-white/10 pb-4">
                        <h2 className="text-xl font-light text-white mb-2">{selectedNode.name}</h2>
                        <div className="flex gap-2">
                            {selectedNode.labels?.map((label: string) => (
                                <span key={label} className="flex items-center gap-1 px-2 py-1 rounded bg-[#00B5CB]/10 text-[#00B5CB] text-xs border border-[#00B5CB]/20">
                                    <Tag size={10} /> {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Metadata</h4>
                            <pre className="text-[10px] font-mono text-gray-300 whitespace-pre-wrap">
                                {JSON.stringify(selectedNode.properties || {}, null, 2)}
                            </pre>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Connections</h4>
                            <div className="flex flex-col items-center justify-center h-20 text-gray-600">
                                <Network size={24} className="mb-2 opacity-50" />
                                <span className="text-[10px]">Graph traversal ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <Book size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Select an entry to view details</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LocalWikiWidget;