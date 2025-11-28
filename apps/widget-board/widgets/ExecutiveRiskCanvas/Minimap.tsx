// Executive Risk Canvas - Minimap Component
// Shows overview of all clusters with current viewport

import React, { useMemo } from 'react';
import { ClusterNode, RiskCluster, ViewportState, RiskSeverity } from './types';

interface MinimapProps {
  nodes: ClusterNode[];
  clusters: RiskCluster[];
  viewport: ViewportState;
  canvasSize: { width: number; height: number };
  onNavigate: (position: { x: number; y: number }) => void;
}

const SEVERITY_COLORS: Record<RiskSeverity, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#10B981',
};

export const Minimap: React.FC<MinimapProps> = ({
  nodes,
  clusters,
  viewport,
  canvasSize,
  onNavigate,
}) => {
  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 140;

  // Calculate bounds of all content
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 2000, maxY: 1500 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.size.width);
      maxY = Math.max(maxY, node.position.y + node.size.height);
    });

    // Add padding
    const padding = 100;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [nodes]);

  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;
  const scale = Math.min(MINIMAP_WIDTH / contentWidth, MINIMAP_HEIGHT / contentHeight);

  // Calculate viewport rectangle
  const viewportRect = useMemo(() => {
    const viewWidth = canvasSize.width / viewport.zoom;
    const viewHeight = canvasSize.height / viewport.zoom;
    
    return {
      x: (-viewport.pan.x / viewport.zoom - bounds.minX) * scale,
      y: (-viewport.pan.y / viewport.zoom - bounds.minY) * scale,
      width: viewWidth * scale,
      height: viewHeight * scale,
    };
  }, [viewport, canvasSize, bounds, scale]);

  const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert minimap coordinates to canvas coordinates
    const canvasX = x / scale + bounds.minX;
    const canvasY = y / scale + bounds.minY;

    onNavigate({
      x: -canvasX * viewport.zoom + canvasSize.width / 2,
      y: -canvasY * viewport.zoom + canvasSize.height / 2,
    });
  };

  return (
    <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Navigator</span>
        <span className="text-[10px] text-white/40">
          {Math.round(viewport.zoom * 100)}%
        </span>
      </div>

      {/* Minimap SVG */}
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="cursor-crosshair"
        onClick={handleMinimapClick}
      >
        {/* Background */}
        <rect width="100%" height="100%" fill="#0F172A" />

        {/* Grid pattern */}
        <defs>
          <pattern id="minimap-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#minimap-grid)" />

        {/* Cluster regions */}
        {clusters.map(cluster => {
          const clusterNodes = nodes.filter(n => cluster.nodes.includes(n.id));
          if (clusterNodes.length === 0) {
            // Show placeholder for empty clusters
            return (
              <circle
                key={cluster.id}
                cx={(cluster.centerPosition.x - bounds.minX) * scale}
                cy={(cluster.centerPosition.y - bounds.minY) * scale}
                r={15}
                fill={SEVERITY_COLORS[cluster.severity]}
                fillOpacity={0.2}
                stroke={SEVERITY_COLORS[cluster.severity]}
                strokeWidth={1}
                strokeOpacity={0.5}
              />
            );
          }

          // Calculate bounding box of cluster nodes
          let cMinX = Infinity, cMinY = Infinity, cMaxX = -Infinity, cMaxY = -Infinity;
          clusterNodes.forEach(node => {
            cMinX = Math.min(cMinX, node.position.x);
            cMinY = Math.min(cMinY, node.position.y);
            cMaxX = Math.max(cMaxX, node.position.x + node.size.width);
            cMaxY = Math.max(cMaxY, node.position.y + node.size.height);
          });

          return (
            <rect
              key={cluster.id}
              x={(cMinX - bounds.minX - 20) * scale}
              y={(cMinY - bounds.minY - 20) * scale}
              width={(cMaxX - cMinX + 40) * scale}
              height={(cMaxY - cMinY + 40) * scale}
              fill={SEVERITY_COLORS[cluster.severity]}
              fillOpacity={0.1}
              stroke={SEVERITY_COLORS[cluster.severity]}
              strokeWidth={1}
              strokeOpacity={0.3}
              rx={4}
            />
          );
        })}

        {/* Node representations */}
        {nodes.map(node => {
          const x = (node.position.x - bounds.minX) * scale;
          const y = (node.position.y - bounds.minY) * scale;
          const w = node.size.width * scale;
          const h = node.size.height * scale;
          const color = SEVERITY_COLORS[node.severity || 'medium'];

          return (
            <rect
              key={node.id}
              x={x}
              y={y}
              width={Math.max(w, 4)}
              height={Math.max(h, 3)}
              fill={color}
              fillOpacity={node.collapsed ? 0.3 : 0.6}
              stroke={color}
              strokeWidth={0.5}
              rx={1}
            />
          );
        })}

        {/* Current viewport indicator */}
        <rect
          x={Math.max(0, viewportRect.x)}
          y={Math.max(0, viewportRect.y)}
          width={Math.min(viewportRect.width, MINIMAP_WIDTH - viewportRect.x)}
          height={Math.min(viewportRect.height, MINIMAP_HEIGHT - viewportRect.y)}
          fill="none"
          stroke="#00B5CB"
          strokeWidth={2}
          rx={2}
          className="pointer-events-none"
        />
      </svg>

      {/* Mode indicator */}
      <div className="px-3 py-1.5 border-t border-white/10 flex items-center justify-between">
        <span className={`text-[10px] px-2 py-0.5 rounded ${
          viewport.mode === 'crisis' 
            ? 'bg-rose-500/20 text-rose-400' 
            : 'bg-cyan-500/20 text-cyan-400'
        }`}>
          {viewport.mode === 'crisis' ? 'Crisis View' : 'Portfolio View'}
        </span>
        <span className="text-[10px] text-white/40">
          {nodes.length} nodes
        </span>
      </div>
    </div>
  );
};

export default Minimap;
