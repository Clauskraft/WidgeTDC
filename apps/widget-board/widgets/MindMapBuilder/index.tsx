// MindMap Builder - Main Component

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Download,
  Share2,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  GitBranch,
  Circle,
  RefreshCw,
  Settings,
  ChevronRight,
  ExternalLink,
  X,
  Target,
  Database,
  Globe,
  FileText,
  Mail,
  BookOpen,
} from 'lucide-react';
import { useMindMapStore } from './mindmapStore';
import { MindMapNode, MindMapEdge, NODE_COLORS, SOURCE_COLORS, EDGE_COLORS } from './types';
import { 
  DATA_SOURCES, 
  unifiedSearch, 
  expandNodeWithAI, 
  setupAutoTracking,
  DataSourceType 
} from './dataSourceConnector';
import { DataSourcesPanel } from './DataSourcesPanel';

// ===== NODE COMPONENT =====
interface NodeComponentProps {
  node: MindMapNode;
  isSelected: boolean;
  isHovered: boolean;
  zoom: number;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  onMove: (position: { x: number; y: number }) => void;
  onExpand: () => void;
  onDelete: () => void;
  onToggleTracking: () => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  isHovered,
  zoom,
  onSelect,
  onHover,
  onMove,
  onExpand,
  onDelete,
  onToggleTracking,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeColor = node.color || NODE_COLORS[node.type];
  const sourceColor = node.source ? SOURCE_COLORS[node.source] : nodeColor;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - node.position.x * zoom,
      y: e.clientY - node.position.y * zoom,
    });
    onSelect();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onMove({
        x: (e.clientX - dragOffset.x) / zoom,
        y: (e.clientY - dragOffset.y) / zoom,
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, zoom, onMove]);

  return (
    <g
      transform={`translate(${node.position.x}, ${node.position.y})`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Glow effect */}
      {(isSelected || isHovered) && (
        <circle
          r={node.size + 8}
          fill="none"
          stroke={nodeColor}
          strokeWidth={2}
          strokeOpacity={0.3}
          className="animate-pulse"
        />
      )}

      {/* Node circle */}
      <circle
        r={node.size}
        fill={`${nodeColor}20`}
        stroke={nodeColor}
        strokeWidth={isSelected ? 3 : 2}
        style={{
          filter: isSelected ? `drop-shadow(0 0 10px ${nodeColor})` : 'none',
        }}
      />

      {/* Tracking indicator */}
      {node.isTracking && (
        <circle
          r={node.size + 4}
          fill="none"
          stroke="#00FF88"
          strokeWidth={2}
          strokeDasharray="4 4"
          className="animate-spin"
          style={{ animationDuration: '10s' }}
        />
      )}

      {/* Expanding indicator */}
      {node.isExpanding && (
        <g>
          <circle r={node.size + 6} fill="none" stroke={nodeColor} strokeWidth={2} strokeOpacity={0.5}>
            <animate attributeName="r" from={node.size} to={node.size + 20} dur="1s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Source indicator */}
      {node.source && (
        <circle
          cx={node.size * 0.7}
          cy={-node.size * 0.7}
          r={8}
          fill={sourceColor}
          stroke="#0F172A"
          strokeWidth={2}
        />
      )}

      {/* Root indicator */}
      {node.isRoot && (
        <circle
          cx={-node.size * 0.7}
          cy={-node.size * 0.7}
          r={6}
          fill="#FFD700"
          stroke="#0F172A"
          strokeWidth={2}
        />
      )}

      {/* Label */}
      <text
        y={4}
        textAnchor="middle"
        fill="white"
        fontSize={node.size > 40 ? 12 : 10}
        fontWeight="500"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {node.label.length > 15 ? `${node.label.slice(0, 15)}...` : node.label}
      </text>

      {/* Hover menu */}
      {isHovered && !isDragging && (
        <g transform={`translate(0, ${node.size + 20})`}>
          <rect x={-60} y={-10} width={120} height={28} rx={4} fill="#1E293B" stroke="#334155" />
          
          {/* Expand button */}
          <g
            transform="translate(-40, 0)"
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill="#8B5CF620" stroke="#8B5CF6" />
            <Sparkles x={-5} y={-5} width={10} height={10} color="#8B5CF6" />
          </g>

          {/* Track button */}
          <g
            transform="translate(0, 0)"
            onClick={(e) => { e.stopPropagation(); onToggleTracking(); }}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill={node.isTracking ? '#00FF8820' : '#33415520'} stroke={node.isTracking ? '#00FF88' : '#334155'} />
            <Eye x={-5} y={-5} width={10} height={10} color={node.isTracking ? '#00FF88' : '#64748B'} />
          </g>

          {/* Delete button */}
          <g
            transform="translate(40, 0)"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill="#EF444420" stroke="#EF4444" />
            <Trash2 x={-5} y={-5} width={10} height={10} color="#EF4444" />
          </g>
        </g>
      )}
    </g>
  );
};

// ===== EDGE COMPONENT =====
interface EdgeComponentProps {
  edge: MindMapEdge;
  sourceNode: MindMapNode;
  targetNode: MindMapNode;
  isSelected: boolean;
}

const EdgeComponent: React.FC<EdgeComponentProps> = ({ edge, sourceNode, targetNode, isSelected }) => {
  const color = EDGE_COLORS[edge.type] || '#6B7280';
  
  // Calculate curved path
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Control point for curve
  const midX = (sourceNode.position.x + targetNode.position.x) / 2;
  const midY = (sourceNode.position.y + targetNode.position.y) / 2;
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const curvature = Math.min(dist * 0.15, 40);
  const ctrlX = midX + perpX * curvature;
  const ctrlY = midY + perpY * curvature;

  // Adjust start/end to edge of circles
  const angle = Math.atan2(dy, dx);
  const startX = sourceNode.position.x + Math.cos(angle) * sourceNode.size;
  const startY = sourceNode.position.y + Math.sin(angle) * sourceNode.size;
  const endX = targetNode.position.x - Math.cos(angle) * targetNode.size;
  const endY = targetNode.position.y - Math.sin(angle) * targetNode.size;

  const path = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;

  return (
    <g>
      {/* Glow/background */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={4 * edge.weight}
        strokeOpacity={0.1}
      />
      
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2 * edge.weight}
        strokeOpacity={isSelected ? 0.8 : 0.5}
        markerEnd="url(#arrowhead)"
      />

      {/* Animated dash */}
      {edge.animated && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="6 6"
          strokeOpacity={0.6}
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1s" repeatCount="indefinite" />
        </path>
      )}

      {/* Label */}
      {edge.label && (
        <text
          x={ctrlX}
          y={ctrlY - 8}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize={9}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
};

// ===== MAIN COMPONENT =====
export const MindMapBuilderWidget: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);

  const {
    nodes,
    edges,
    selectedNodeId,
    hoveredNodeId,
    viewport,
    isSearching,
    searchQuery,
    autoTrackEnabled,
    // Actions
    setSearchQuery,
    setSearching,
    addNodeFromSearch,
    removeNode,
    moveNode,
    selectNode,
    hoverNode,
    setNodeExpanding,
    toggleNodeTracking,
    expandNode,
    setViewport,
    setZoom,
    resetViewport,
    applyForceLayout,
    applyRadialLayout,
    setAutoTrack,
    undo,
    redo,
    clear,
  } = useMindMapStore();

  // Handle search submit - search in existing data sources
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);

    try {
      // Search in existing data sources first
      const enabledSources: DataSourceType[] = DATA_SOURCES
        .filter(ds => ds.enabled)
        .map(ds => ds.type);

      const results = await unifiedSearch(searchQuery.trim(), enabledSources, 5);

      // Create root node from search
      const description = results.length > 0 
        ? `Fundet ${results.length} resultater i dine data`
        : undefined;
      
      const newNode = addNodeFromSearch(searchQuery.trim(), description);

      // If we have results, optionally auto-expand
      if (results.length > 0) {
        console.log(`[MindMap] Found ${results.length} results for "${searchQuery}"`);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Still create the node even if search fails
      addNodeFromSearch(searchQuery.trim());
    } finally {
      setSearching(false);
    }
  };

  // Handle node expansion (AI call with real data sources)
  const handleExpandNode = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.isExpanding) return;

    setNodeExpanding(nodeId, true);

    try {
      // Use real data sources via connector
      const enabledSources: DataSourceType[] = DATA_SOURCES
        .filter(ds => ds.enabled)
        .map(ds => ds.type);

      const expansion = await expandNodeWithAI(node, enabledSources);

      if (expansion.nodes.length > 0) {
        const edges = expansion.edges.map((e) => ({
          ...e,
          sourceId: nodeId,
        }));
        expandNode(nodeId, expansion.nodes, edges);
      } else {
        // Fallback: search for related content
        const searchResults = await unifiedSearch(node.label, enabledSources, 3);
        
        if (searchResults.length > 0) {
          const fallbackNodes = searchResults.map((r) => ({
            label: r.title.slice(0, 30),
            description: r.snippet,
            type: 'expanded' as const,
            source: r.source,
            sourceUrl: r.url,
            size: 35,
            color: NODE_COLORS.expanded,
          }));

          const fallbackEdges = fallbackNodes.map(() => ({
            sourceId: nodeId,
            targetId: '',
            type: 'relates_to' as const,
            weight: 0.6,
            animated: true,
          }));

          expandNode(nodeId, fallbackNodes, fallbackEdges);
        } else {
          setNodeExpanding(nodeId, false);
          console.warn('No expansion results found');
        }
      }
    } catch (error) {
      console.error('Expansion error:', error);
      setNodeExpanding(nodeId, false);
    }
  };

  // Handle wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(viewport.zoom + delta);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [viewport.zoom, setZoom]);

  // Handle canvas pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      selectNode(null);
    }
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      setViewport({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    };

    const handleMouseUp = () => setIsPanning(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, viewport, setViewport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNodeId) {
        removeNode(selectedNodeId);
      }
      if (e.ctrlKey && e.key === 'z') undo();
      if (e.ctrlKey && e.key === 'y') redo();
      if (e.key === 'Escape') selectNode(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, removeNode, undo, redo, selectNode]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 h-14 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søg efter emne → bliver til node..."
                className="w-80 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tilføj Node
            </button>
          </form>

          {/* Stats & Controls */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40">
              {nodes.length} nodes · {edges.length} edges
            </span>

            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button onClick={undo} className="p-1.5 hover:bg-white/10 rounded" title="Undo (Ctrl+Z)">
                <Undo2 className="w-4 h-4 text-white/60" />
              </button>
              <button onClick={redo} className="p-1.5 hover:bg-white/10 rounded" title="Redo (Ctrl+Y)">
                <Redo2 className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button onClick={() => setZoom(viewport.zoom - 0.2)} className="p-1.5 hover:bg-white/10 rounded">
                <ZoomOut className="w-4 h-4 text-white/60" />
              </button>
              <span className="text-xs text-white/50 w-12 text-center">{Math.round(viewport.zoom * 100)}%</span>
              <button onClick={() => setZoom(viewport.zoom + 0.2)} className="p-1.5 hover:bg-white/10 rounded">
                <ZoomIn className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button onClick={applyForceLayout} className="p-1.5 hover:bg-white/10 rounded" title="Force Layout">
                <GitBranch className="w-4 h-4 text-white/60" />
              </button>
              <button onClick={applyRadialLayout} className="p-1.5 hover:bg-white/10 rounded" title="Radial Layout">
                <Target className="w-4 h-4 text-white/60" />
              </button>
              <button onClick={resetViewport} className="p-1.5 hover:bg-white/10 rounded" title="Reset View">
                <Maximize2 className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <button
              onClick={() => setAutoTrack(!autoTrackEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                autoTrackEnabled
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoTrackEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              Auto-Track
            </button>

            <button
              onClick={clear}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
              title="Clear All"
            >
              <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-white/60'
              }`}
              title="Data Sources"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Data Sources Panel */}
      {showSettings && (
        <DataSourcesPanel onClose={() => setShowSettings(false)} />
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 top-14"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
            backgroundPosition: `center, ${viewport.x}px ${viewport.y}px, ${viewport.x}px ${viewport.y}px`,
          }}
        />

        {/* SVG Canvas */}
        <svg
          className="absolute inset-0"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
          }}
          width="2000"
          height="1200"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.3)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.sourceId);
            const targetNode = nodes.find((n) => n.id === edge.targetId);
            if (!sourceNode || !targetNode) return null;
            return (
              <EdgeComponent
                key={edge.id}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                isSelected={selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              isHovered={node.id === hoveredNodeId}
              zoom={viewport.zoom}
              onSelect={() => selectNode(node.id)}
              onHover={(h) => hoverNode(h ? node.id : null)}
              onMove={(pos) => moveNode(node.id, pos)}
              onExpand={() => handleExpandNode(node.id)}
              onDelete={() => removeNode(node.id)}
              onToggleTracking={() => toggleNodeTracking(node.id)}
            />
          ))}
        </svg>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <GitBranch className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Start din MindMap</h3>
              <p className="text-sm text-white/50 max-w-md">
                Søg efter et emne ovenfor. Det bliver din første node.<br />
                Klik på <Sparkles className="inline w-4 h-4 text-purple-400" /> for at lade AI udvide med relaterede emner.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 p-3">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Node Typer</p>
        <div className="space-y-1.5">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-white/60 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 right-4 text-[10px] text-white/30 space-y-1">
        <p>Scroll: Zoom · Drag: Pan · Del: Slet node</p>
        <p>Ctrl+Z: Undo · Ctrl+Y: Redo · Esc: Deselect</p>
      </div>
    </div>
  );
};

export default MindMapBuilderWidget;
