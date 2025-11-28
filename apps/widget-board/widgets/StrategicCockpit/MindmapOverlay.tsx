// Strategic Cockpit - Mindmap Overlay Component
// Neo4j graph visualization overlay

import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';
import {
  GraphNode,
  GraphEdge,
  NODE_TYPE_COLORS,
  NEON_COLORS,
} from './types';

interface MindmapOverlayProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  viewport: { x: number; y: number; zoom: number };
  selectedNodeId: string | null;
  mode: 'overlay' | 'panel';
  onClose: () => void;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
}

export const MindmapOverlay: React.FC<MindmapOverlayProps> = ({
  nodes,
  edges,
  viewport,
  selectedNodeId,
  mode,
  onClose,
  onNodeSelect,
  onNodeMove,
  onViewportChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.3, Math.min(3, viewport.zoom + delta));
      onViewportChange({ ...viewport, zoom: newZoom });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [viewport, onViewportChange]);

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('pan-area')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      onViewportChange({
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
  }, [isPanning, panStart, viewport, onViewportChange]);

  // Handle node dragging
  useEffect(() => {
    if (!draggingNode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX - dragOffset.x - viewport.x) / viewport.zoom;
      const newY = (e.clientY - dragOffset.y - viewport.y) / viewport.zoom;
      onNodeMove(draggingNode, { x: newX, y: newY });
    };

    const handleMouseUp = () => setDraggingNode(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNode, dragOffset, viewport, onNodeMove]);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string, node: GraphNode) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
    onNodeSelect(nodeId);
  };

  // Render edge path
  const renderEdge = (edge: GraphEdge) => {
    const source = nodes.find((n) => n.id === edge.sourceId);
    const target = nodes.find((n) => n.id === edge.targetId);
    if (!source || !target) return null;

    const dx = target.position.x - source.position.x;
    const dy = target.position.y - source.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Control point for curve
    const midX = (source.position.x + target.position.x) / 2;
    const midY = (source.position.y + target.position.y) / 2;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const curvature = Math.min(distance * 0.2, 50);
    const ctrlX = midX + perpX * curvature;
    const ctrlY = midY + perpY * curvature;

    const path = `M ${source.position.x} ${source.position.y} Q ${ctrlX} ${ctrlY} ${target.position.x} ${target.position.y}`;

    const color = NODE_TYPE_COLORS[source.type];

    return (
      <g key={edge.id}>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.5 * edge.weight}
          strokeOpacity={0.4}
        />
        {edge.animated && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-16"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        )}
        {/* Edge label */}
        {edge.label && (
          <text
            x={ctrlX}
            y={ctrlY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.5)"
            className="select-none pointer-events-none"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  const isOverlay = mode === 'overlay';

  return (
    <div
      className={`${
        isOverlay
          ? 'fixed inset-0 z-50'
          : 'fixed left-0 top-0 bottom-32 w-96 z-40'
      }`}
    >
      {/* Background */}
      <div
        className={`absolute inset-0 ${
          isOverlay ? 'bg-slate-950/95' : 'bg-slate-950/90'
        } backdrop-blur-xl`}
        onClick={isOverlay ? onClose : undefined}
      />

      {/* Border accent */}
      {!isOverlay && (
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-cyan-500/50 to-magenta-500/50" />
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b border-white/10 bg-black/20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-sm font-medium text-white">Neo4j Mindmap</span>
          <span className="text-xs text-white/40">{nodes.length} nodes · {edges.length} edges</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewportChange({ ...viewport, zoom: viewport.zoom + 0.2 })}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={() => onViewportChange({ ...viewport, zoom: viewport.zoom - 0.2 })}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={() => onViewportChange({ x: 0, y: 0, zoom: 1 })}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 top-12 overflow-hidden cursor-grab pan-area"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Grid background */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '2000px', height: '1500px' }}>
            <defs>
              <pattern id="mindmap-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mindmap-grid)" />
          </svg>

          {/* Edges */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '2000px', height: '1500px' }}>
            {edges.map(renderEdge)}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const color = node.color || NODE_TYPE_COLORS[node.type];
            const isSelected = node.id === selectedNodeId;
            const isNew = node.isNew;

            return (
              <div
                key={node.id}
                className={`absolute rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-950' : ''
                } ${isNew ? 'animate-pulse' : ''} ${
                  draggingNode === node.id ? 'cursor-grabbing z-50' : 'hover:scale-110'
                }`}
                style={{
                  left: node.position.x - node.size / 2,
                  top: node.position.y - node.size / 2,
                  width: node.size,
                  height: node.size,
                  backgroundColor: `${color}30`,
                  borderColor: color,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  boxShadow: isSelected
                    ? `0 0 20px ${color}50, 0 0 40px ${color}20`
                    : `0 0 10px ${color}20`,
                  ...(isSelected && { ringColor: color }),
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id, node)}
              >
                <span className="text-xs font-medium text-white text-center px-1 select-none">
                  {node.label.length > 10 ? `${node.label.slice(0, 10)}...` : node.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Node info panel */}
      {selectedNodeId && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-4">
          {(() => {
            const node = nodes.find((n) => n.id === selectedNodeId);
            if (!node) return null;
            const color = node.color || NODE_TYPE_COLORS[node.type];

            return (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    {node.type}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white">{node.label}</h4>
                {node.description && (
                  <p className="text-xs text-white/60 mt-1">{node.description}</p>
                )}
                {Object.keys(node.properties).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(node.properties).slice(0, 4).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-16 right-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-3">
        <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Node Types</span>
        <div className="space-y-1.5">
          {Object.entries(NODE_TYPE_COLORS).slice(0, 5).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-white/60 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MindmapOverlay;
