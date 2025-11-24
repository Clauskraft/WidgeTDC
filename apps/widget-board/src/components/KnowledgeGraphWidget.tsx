// KnowledgeGraphWidget.tsx – visualises the memory graph (entities & relations)
import React, { useEffect, useState } from 'react';

// Simple MCP request helper – asks for a memory snapshot
async function fetchMemoryGraph() {
    const resp = await fetch('/api/mcp/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sourceId: 'KnowledgeGraphWidget',
            type: 'memoryQuery',
            payload: { query: 'graph' }, // backend should interpret this
            createdAt: new Date().toISOString(),
        }),
    });
    if (!resp.ok) throw new Error('Memory query failed');
    return resp.json(); // expects { nodes: [], edges: [] }
}

export const KnowledgeGraphWidget: React.FC = () => {
    const [graph, setGraph] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMemoryGraph()
            .then((data) => {
                // Use setTimeout to avoid synchronous setState
                setTimeout(() => {
                    setGraph(data);
                }, 0);
            })
            .catch((e) => {
                setTimeout(() => {
                    setError(e.message);
                }, 0);
            });
    }, []);

    if (error) return <div className="p-4 text-red-400">Error: {error}</div>;

    return (
        <div className="p-4 overflow-auto bg-gray-800 text-gray-100 rounded-lg h-full">
            <h2 className="text-lg font-semibold mb-2">🧠 Knowledge Graph</h2>
            {/* Very simple representation – list nodes and edges */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="font-medium mb-1">Entities</h3>
                    <ul className="list-disc list-inside">
                        {graph.nodes.map((n, i) => (
                            <li key={i}>{n.id}: {n.label}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="font-medium mb-1">Relations</h3>
                    <ul className="list-disc list-inside">
                        {graph.edges.map((e, i) => (
                            <li key={i}>{e.source} → {e.target} ({e.type})</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
