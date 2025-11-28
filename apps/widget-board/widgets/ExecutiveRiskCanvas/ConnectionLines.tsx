// Executive Risk Canvas - Connection Lines Component
// SVG-based connection lines with labels and argumentationskæde

import React, { useMemo } from 'react';
import { NodeConnection, ClusterNode, ConnectionType } from './types';

interface ConnectionLinesProps {
  connections: NodeConnection[];
  nodes: ClusterNode[];
  selectedConnectionId?: string;
  hoveredConnectionId?: string;
  onSelectConnection: (id: string) => void;
  zoom: number;
}

const CONNECTION_COLORS: Record<ConnectionType, string> = {
  causal: '#EF4444',      // Red - direct causation
  regulatory: '#F59E0B',  // Amber - regulatory binding
  financial: '#3B82F6',   // Blue - financial impact
  operational: '#8B5CF6', // Purple - operational link
};

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  connections,
  nodes,
  selectedConnectionId,
  hoveredConnectionId,
  onSelectConnection,
  zoom,
}) => {
  // Calculate connection paths
  const connectionPaths = useMemo(() => {
    return connections.map((conn) => {
      const sourceNode = nodes.find((n) => n.id === conn.sourceId);
      const targetNode = nodes.find((n) => n.id === conn.targetId);

      if (!sourceNode || !targetNode) return null;

      // Calculate center points of nodes
      const sourceCenter = {
        x: sourceNode.position.x + sourceNode.size.width / 2,
        y: sourceNode.position.y + sourceNode.size.height / 2,
      };
      const targetCenter = {
        x: targetNode.position.x + targetNode.size.width / 2,
        y: targetNode.position.y + targetNode.size.height / 2,
      };

      // Calculate edge intersection points
      const sourceEdge = getEdgePoint(sourceNode, targetCenter);
      const targetEdge = getEdgePoint(targetNode, sourceCenter);

      // Calculate control points for curved line
      const midX = (sourceEdge.x + targetEdge.x) / 2;
      const midY = (sourceEdge.y + targetEdge.y) / 2;
      
      // Add slight curve offset
      const dx = targetEdge.x - sourceEdge.x;
      const dy = targetEdge.y - sourceEdge.y;
      const curveOffset = Math.min(50, Math.sqrt(dx * dx + dy * dy) * 0.2);
      
      const controlX = midX + (dy > 0 ? curveOffset : -curveOffset);
      const controlY = midY + (dx > 0 ? -curveOffset : curveOffset);

      const color = conn.color || CONNECTION_COLORS[conn.connectionType];
      const isSelected = conn.id === selectedConnectionId;
      const isHovered = conn.id === hoveredConnectionId;

      return {
        ...conn,
        sourceEdge,
        targetEdge,
        controlX,
        controlY,
        midX,
        midY,
        color,
        isSelected,
        isHovered,
      };
    }).filter(Boolean);
  }, [connections, nodes, selectedConnectionId, hoveredConnectionId]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        {/* Arrow marker */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
        
        {/* Glow filter for selected */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Animated dash pattern */}
        <pattern id="animated-dash" patternUnits="userSpaceOnUse" width="20" height="1">
          <line x1="0" y1="0" x2="10" y2="0" stroke="currentColor" strokeWidth="2">
            <animate attributeName="x1" from="0" to="20" dur="1s" repeatCount="indefinite" />
            <animate attributeName="x2" from="10" to="30" dur="1s" repeatCount="indefinite" />
          </line>
        </pattern>
      </defs>

      {connectionPaths.map((path) => {
        if (!path) return null;

        const strokeWidth = path.isSelected ? 3 : path.isHovered ? 2.5 : 2;
        const opacity = path.isSelected || path.isHovered ? 1 : 0.7;

        return (
          <g key={path.id} className="pointer-events-auto cursor-pointer">
            {/* Invisible wider path for easier clicking */}
            <path
              d={`M ${path.sourceEdge.x} ${path.sourceEdge.y} Q ${path.controlX} ${path.controlY} ${path.targetEdge.x} ${path.targetEdge.y}`}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              onClick={() => onSelectConnection(path.id)}
            />

            {/* Visible connection line */}
            <path
              d={`M ${path.sourceEdge.x} ${path.sourceEdge.y} Q ${path.controlX} ${path.controlY} ${path.targetEdge.x} ${path.targetEdge.y}`}
              fill="none"
              stroke={path.color}
              strokeWidth={strokeWidth}
              strokeDasharray={path.style === 'dashed' ? '8,4' : path.style === 'animated' ? '8,4' : 'none'}
              opacity={opacity}
              markerEnd="url(#arrowhead)"
              style={{
                filter: path.isSelected ? 'url(#glow)' : undefined,
                color: path.color,
              }}
            >
              {path.style === 'animated' && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="24"
                  dur="1s"
                  repeatCount="indefinite"
                />
              )}
            </path>

            {/* Connection label */}
            <g transform={`translate(${path.midX}, ${path.midY})`}>
              {/* Label background */}
              <rect
                x={-60}
                y={-12}
                width={120}
                height={24}
                rx={4}
                fill="rgba(15, 23, 42, 0.9)"
                stroke={path.color}
                strokeWidth={1}
                opacity={path.isSelected || path.isHovered ? 1 : 0.8}
              />
              {/* Label text */}
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10 / zoom}
                fill="white"
                className="select-none"
              >
                {path.label.length > 25 ? path.label.substring(0, 22) + '...' : path.label}
              </text>
            </g>

            {/* SVP Budskab tooltip on hover/select */}
            {(path.isSelected || path.isHovered) && path.svpBudskab && (
              <g transform={`translate(${path.midX}, ${path.midY + 30})`}>
                <rect
                  x={-150}
                  y={0}
                  width={300}
                  height={50}
                  rx={6}
                  fill="rgba(15, 23, 42, 0.95)"
                  stroke={path.color}
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11 / zoom}
                  fill="#94A3B8"
                  y={15}
                >
                  <tspan x="0" dy="0">SVP Budskab:</tspan>
                </text>
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10 / zoom}
                  fill="white"
                  y={35}
                >
                  {path.svpBudskab.substring(0, 60)}...
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// Helper function to calculate edge intersection point
function getEdgePoint(
  node: ClusterNode,
  targetPoint: { x: number; y: number }
): { x: number; y: number } {
  const centerX = node.position.x + node.size.width / 2;
  const centerY = node.position.y + node.size.height / 2;

  const dx = targetPoint.x - centerX;
  const dy = targetPoint.y - centerY;

  const halfWidth = node.size.width / 2;
  const halfHeight = node.size.height / 2;

  // Calculate intersection with rectangle edges
  const scaleX = Math.abs(dx) > 0 ? halfWidth / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0 ? halfHeight / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale,
  };
}

export default ConnectionLines;
