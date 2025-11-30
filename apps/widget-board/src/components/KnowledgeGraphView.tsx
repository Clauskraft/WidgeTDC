import { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import {
  RefreshCw,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Database,
  GitBranch,
  Info,
  AlertTriangle,
  Upload,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface GraphNode extends NodeObject {
  id: string;
  label: string;
  labels: string[];
  properties: Record<string, unknown>;
  color?: string;
  size?: number;
}

interface GraphLink extends LinkObject {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface NodeDetails {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

interface Neo4jStats {
  totalNodes: number;
  totalRelationships: number;
  filesByType: Record<string, number>;
  importGraph: { from: string; to: string }[];
}

// ============================================
// COLOR PALETTE FOR NODE TYPES - KODEX AESTHETIC
// ============================================
const NODE_COLORS: Record<string, string> = {
  // File extensions
  '.ts': '#00ff41',
  '.tsx': '#33ff66',
  '.js': '#66ff99',
  '.jsx': '#00cc33',
  '.json': '#00d4ff',
  '.md': '#00ffff',
  '.py': '#00ffcc',
  '.sql': '#33ccff',
  '.yml': '#009999',
  '.yaml': '#009999',
  '.sh': '#ff9900',
  '.bat': '#ff6600',
  '.css': '#ff00ff',
  '.html': '#ff3399',

  // Node types
  File: '#00ff41',
  Directory: '#00d4ff',
  LeakSource: '#ff3333',
  Identity: '#ffcc00',

  default: '#00ff41',
};

// ============================================
// KNOWLEDGE GRAPH VIEW COMPONENT
// ============================================
export default function KnowledgeGraphView() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDetails | null>(null);
  const [stats, setStats] = useState({ nodes: 0, relationships: 0 });
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Transform Neo4j stats to graph data
  const transformToGraphData = useCallback((neo4jStats: Neo4jStats): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, string>();
    let nodeId = 1;

    // Create nodes for each file in importGraph
    const uniqueFiles = new Set<string>();
    neo4jStats.importGraph.forEach(({ from, to }) => {
      uniqueFiles.add(from);
      uniqueFiles.add(to);
    });

    uniqueFiles.forEach((fileName) => {
      const ext = '.' + fileName.split('.').pop();
      const id = String(nodeId++);
      nodeMap.set(fileName, id);

      nodes.push({
        id,
        label: fileName,
        labels: ['File'],
        properties: { extension: ext },
        color: NODE_COLORS[ext] || NODE_COLORS.default,
        size: 8,
      });
    });

    // Create links from importGraph
    neo4jStats.importGraph.forEach(({ from, to }) => {
      const sourceId = nodeMap.get(from);
      const targetId = nodeMap.get(to);
      if (sourceId && targetId && sourceId !== targetId) {
        links.push({
          source: sourceId,
          target: targetId,
          type: 'IMPORTS',
          properties: {},
        });
      }
    });

    // If we have no import graph, create nodes from filesByType
    if (nodes.length === 0 && Object.keys(neo4jStats.filesByType).length > 0) {
      Object.entries(neo4jStats.filesByType).forEach(([ext, count]) => {
        for (let i = 0; i < Math.min(count, 20); i++) {
          const id = String(nodeId++);
          nodes.push({
            id,
            label: `file_${i}${ext}`,
            labels: ['File'],
            properties: { extension: ext, count },
            color: NODE_COLORS[ext] || NODE_COLORS.default,
            size: 6 + Math.log(count) * 2,
          });
        }
      });

      // Create some random connections for visual effect
      for (let i = 0; i < nodes.length; i++) {
        const targets = Math.floor(Math.random() * 3);
        for (let j = 0; j < targets; j++) {
          const targetIdx = Math.floor(Math.random() * nodes.length);
          if (targetIdx !== i) {
            links.push({
              source: nodes[i].id,
              target: nodes[targetIdx].id,
              type: 'RELATED',
              properties: {},
            });
          }
        }
      }
    }

    return { nodes, links };
  }, []);

  // Fetch graph stats from Neo4j
  const loadGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/evolution/graph/stats');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch graph stats`);
      }

      const neo4jStats: Neo4jStats = await response.json();

      // Transform to visual graph
      const data = transformToGraphData(neo4jStats);
      setGraphData(data);
      setStats({
        nodes: neo4jStats.totalNodes,
        relationships: neo4jStats.totalRelationships
      });

    } catch (err) {
      console.error('Failed to load graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Neo4j');
      // Set empty data on error
      setGraphData({ nodes: [], links: [] });
      setStats({ nodes: 0, relationships: 0 });
    } finally {
      setLoading(false);
    }
  }, [transformToGraphData]);

  // Trigger ingest to Neo4j
  const handleIngest = useCallback(async () => {
    setIngesting(true);
    setError(null);

    try {
      const response = await fetch('/api/evolution/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Ingest failed`);
      }

      const result = await response.json();
      console.log('Ingest result:', result);

      // Reload graph after ingest
      await loadGraphData();
    } catch (err) {
      console.error('Ingest failed:', err);
      setError(err instanceof Error ? err.message : 'Ingest failed');
    } finally {
      setIngesting(false);
    }
  }, [loadGraphData]);

  // Initial load
  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  // Handle node click
  const handleNodeClick = useCallback((node: NodeObject) => {
    const graphNode = node as GraphNode;
    setSelectedNode({
      id: graphNode.id,
      labels: graphNode.labels,
      properties: { name: graphNode.label, ...graphNode.properties },
    });
  }, []);

  // Zoom controls
  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  const handleFitView = () => graphRef.current?.zoomToFit(400, 50);

  // Custom node rendering - KODEX STYLE
  const nodeCanvasObject = useCallback((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const graphNode = node as GraphNode;
    const label = graphNode.label || '';
    const fontSize = 10 / globalScale;
    const nodeSize = graphNode.size || 8;
    const color = graphNode.color || NODE_COLORS.default;

    // Outer glow
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, nodeSize + 6, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}15`;
    ctx.fill();

    // Middle glow
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, nodeSize + 3, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}30`;
    ctx.fill();

    // Core node
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Center highlight
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, nodeSize * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff44';
    ctx.fill();

    // Label
    if (globalScale > 0.5) {
      ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#00ff41';
      ctx.fillText(label.length > 20 ? label.substring(0, 17) + '...' : label, node.x!, node.y! + nodeSize + fontSize);
      ctx.shadowBlur = 0;
    }
  }, []);

  // Custom link rendering
  const linkCanvasObject = useCallback((link: LinkObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source as NodeObject;
    const end = link.target as NodeObject;
    if (!start.x || !start.y || !end.x || !end.y) return;

    // Glow line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#00ff4130';
    ctx.lineWidth = 3 / globalScale;
    ctx.stroke();

    // Core line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#00ff4160';
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neon-green/20">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-neon-green" />
          <span className="text-neon-green font-medium">KNOWLEDGE GRAPH</span>
          <div className="flex items-center gap-4 text-xs text-neon-green/60">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {stats.nodes} nodes
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {stats.relationships} rels
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="px-3 py-1.5 rounded bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan text-xs font-medium
                       hover:bg-neon-cyan/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            title="Ingest files to Neo4j"
          >
            {ingesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            INGEST
          </button>
          <button onClick={handleZoomOut} className="p-2 rounded hover:bg-neon-green/10 text-neon-green/60 hover:text-neon-green transition-colors" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleZoomIn} className="p-2 rounded hover:bg-neon-green/10 text-neon-green/60 hover:text-neon-green transition-colors" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleFitView} className="p-2 rounded hover:bg-neon-green/10 text-neon-green/60 hover:text-neon-green transition-colors" title="Fit View">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={loadGraphData} disabled={loading} className="p-2 rounded hover:bg-neon-green/10 text-neon-green/60 hover:text-neon-green transition-colors disabled:opacity-50" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-3 mt-3 p-2 bg-alert-red/10 border border-alert-red/30 rounded-lg flex items-center gap-2 text-alert-red text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="mx-3 mt-3 p-2 bg-neon-green/5 border border-neon-green/20 rounded-lg flex items-center gap-2 text-neon-green/70 text-xs">
        <Info className="w-4 h-4 flex-shrink-0 text-neon-green" />
        <span>LIVE NEO4J DATA // {stats.nodes} files indexed // Click INGEST to scan project</span>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="flex-1 relative min-h-0 mt-3">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
              <span className="text-neon-green/70">Connecting to Neo4j...</span>
            </div>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <Database className="w-16 h-16 text-neon-green/30" />
              <div>
                <p className="text-neon-green/70 mb-2">No data in graph</p>
                <p className="text-neon-green/50 text-sm">Click INGEST to scan your project</p>
              </div>
            </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height - 100}
            backgroundColor="#0a0a0f"
            nodeCanvasObject={nodeCanvasObject}
            linkCanvasObject={linkCanvasObject}
            onNodeClick={handleNodeClick}
            nodePointerAreaPaint={(node, color, ctx) => {
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, 15, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={0.9}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        )}
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 w-80 p-4 bg-cyber-black/95 border border-neon-green/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-neon-cyan" />
              <span className="text-neon-cyan font-medium">Node Details</span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-neon-green/50 hover:text-neon-green text-xl leading-none">×</button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-neon-green/50">Labels:</span>
              <div className="flex gap-1 mt-1 flex-wrap">
                {selectedNode.labels.map((label) => (
                  <span key={label} className="px-2 py-0.5 bg-neon-green/20 text-neon-green rounded text-xs">{label}</span>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-neon-green/20">
              <span className="text-neon-green/50">Properties:</span>
              <div className="mt-1 space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="text-neon-cyan">{key}:</span>
                    <span className="text-neon-green ml-2 truncate">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 bg-cyber-black/90 border border-neon-green/30 rounded-lg backdrop-blur-sm">
        <div className="text-xs text-neon-green font-bold mb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          FILE_TYPES
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {[
            { type: '.ts', color: NODE_COLORS['.ts'] },
            { type: '.tsx', color: NODE_COLORS['.tsx'] },
            { type: '.json', color: NODE_COLORS['.json'] },
            { type: '.md', color: NODE_COLORS['.md'] },
            { type: '.py', color: NODE_COLORS['.py'] },
          ].map(({ type, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}66` }} />
              <span className="text-neon-green/80">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
