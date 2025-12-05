import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GraphData, GraphNode, GraphLink } from '../types';

interface GraphVisualizationProps {
  data: GraphData;
  theme: 'dark' | 'light';
  onNodeClick?: (node: GraphNode) => void;
}

// Color mapping for node types
const nodeColors: Record<string, string> = {
  InfoItem: '#06b6d4',      // cyan
  Person: '#a855f7',        // purple
  Project: '#22c55e',       // green
  Task: '#f59e0b',          // amber
  Document: '#3b82f6',      // blue
  Idea: '#ec4899',          // pink
  Note: '#64748b',          // slate
  Contact: '#14b8a6',       // teal
  Agent: '#ef4444',         // red
  Channel: '#8b5cf6',       // violet
  default: '#6b7280',       // gray
};

// Link colors by type
const linkColors: Record<string, string> = {
  RELATES_TO: '#64748b',
  CREATED_BY: '#a855f7',
  ASSIGNED_TO: '#f59e0b',
  CONTAINS: '#22c55e',
  DEPENDS_ON: '#ef4444',
  default: '#4b5563',
};

export function GraphVisualization({ data, theme, onNodeClick }: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<GraphNode | null>(null);
  const [simulation, setSimulation] = useState<GraphNode[]>([]);

  // Initialize node positions with force-directed layout
  useEffect(() => {
    if (data.nodes.length === 0) return;

    const nodes = data.nodes.map((node, i) => ({
      ...node,
      x: node.x ?? dimensions.width / 2 + Math.cos(i * 2 * Math.PI / data.nodes.length) * 200,
      y: node.y ?? dimensions.height / 2 + Math.sin(i * 2 * Math.PI / data.nodes.length) * 200,
      vx: 0,
      vy: 0,
    }));

    // Simple force simulation
    const simulate = () => {
      const alpha = 0.1;
      const repulsion = 500;
      const attraction = 0.01;
      const centerForce = 0.02;

      for (let iter = 0; iter < 100; iter++) {
        // Repulsion between nodes
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x! - nodes[i].x!;
            const dy = nodes[j].y! - nodes[i].y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repulsion / (dist * dist);
            const fx = (dx / dist) * force * alpha;
            const fy = (dy / dist) * force * alpha;
            nodes[i].x! -= fx;
            nodes[i].y! -= fy;
            nodes[j].x! += fx;
            nodes[j].y! += fy;
          }
        }

        // Attraction along links
        data.links.forEach((link) => {
          const source = nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id));
          const target = nodes.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target.id));
          if (source && target) {
            const dx = target.x! - source.x!;
            const dy = target.y! - source.y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = dist * attraction * alpha;
            source.x! += (dx / dist) * force;
            source.y! += (dy / dist) * force;
            target.x! -= (dx / dist) * force;
            target.y! -= (dy / dist) * force;
          }
        });

        // Center force
        nodes.forEach(node => {
          node.x! += (dimensions.width / 2 - node.x!) * centerForce;
          node.y! += (dimensions.height / 2 - node.y!) * centerForce;
        });
      }

      setSimulation(nodes);
    };

    simulate();
  }, [data, dimensions]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw the graph
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || simulation.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = theme === 'dark' ? '#111827' : '#f9fafb';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Apply transform
    ctx.save();
    ctx.translate(transform.x + dimensions.width / 2, transform.y + dimensions.height / 2);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-dimensions.width / 2, -dimensions.height / 2);

    // Draw links
    data.links.forEach((link) => {
      const source = simulation.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id));
      const target = simulation.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target.id));
      
      if (source && target && source.x && source.y && target.x && target.y) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = linkColors[link.type] || linkColors.default;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowX = target.x - Math.cos(angle) * 25;
        const arrowY = target.y - Math.sin(angle) * 25;
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - 8 * Math.cos(angle - Math.PI / 6),
          arrowY - 8 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - 8 * Math.cos(angle + Math.PI / 6),
          arrowY - 8 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = linkColors[link.type] || linkColors.default;
        ctx.fill();

        // Draw link label
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = theme === 'dark' ? '#9ca3af' : '#4b5563';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(link.type, midX, midY - 5);
      }
    });

    // Draw nodes
    simulation.forEach((node) => {
      if (!node.x || !node.y) return;

      const color = nodeColors[node.type] || nodeColors.default;
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const radius = isHovered || isSelected ? 22 : 18;

      // Glow effect
      if (isHovered || isSelected) {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 2);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#111827';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const label = node.label.length > 12 ? node.label.substring(0, 10) + '...' : node.label;
      ctx.fillText(label, node.x, node.y + radius + 14);

      // Type badge
      ctx.fillStyle = theme === 'dark' ? '#374151' : '#e5e7eb';
      const typeWidth = ctx.measureText(node.type).width + 8;
      ctx.fillRect(node.x - typeWidth / 2, node.y - radius - 20, typeWidth, 14);
      ctx.fillStyle = color;
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(node.type, node.x, node.y - radius - 13);
    });

    ctx.restore();

    // Draw info panel for hovered node
    if (hoveredNode) {
      const panelWidth = 200;
      const panelHeight = 80;
      const panelX = 10;
      const panelY = dimensions.height - panelHeight - 10;

      ctx.fillStyle = theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = theme === 'dark' ? '#374151' : '#d1d5db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#111827';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(hoveredNode.label, panelX + 10, panelY + 20);
      
      ctx.fillStyle = theme === 'dark' ? '#9ca3af' : '#6b7280';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`Type: ${hoveredNode.type}`, panelX + 10, panelY + 38);
      ctx.fillText(`ID: ${hoveredNode.id.substring(0, 20)}...`, panelX + 10, panelY + 54);
    }

  }, [simulation, data.links, theme, transform, hoveredNode, selectedNode, dimensions]);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  // Mouse handlers
  const getNodeAtPosition = (x: number, y: number): GraphNode | null => {
    const canvasX = (x - transform.x - dimensions.width / 2) / transform.scale + dimensions.width / 2;
    const canvasY = (y - transform.y - dimensions.height / 2) / transform.scale + dimensions.height / 2;

    for (const node of simulation) {
      if (!node.x || !node.y) continue;
      const dist = Math.sqrt((canvasX - node.x) ** 2 + (canvasY - node.y) ** 2);
      if (dist <= 22) return node;
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragNode && isDragging) {
      const canvasX = (x - transform.x - dimensions.width / 2) / transform.scale + dimensions.width / 2;
      const canvasY = (y - transform.y - dimensions.height / 2) / transform.scale + dimensions.height / 2;
      
      setSimulation(prev => prev.map(n => 
        n.id === dragNode.id ? { ...n, x: canvasX, y: canvasY } : n
      ));
    } else {
      setHoveredNode(getNodeAtPosition(x, y));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);

    if (node) {
      setDragNode(node);
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    if (dragNode && !isDragging) {
      setSelectedNode(dragNode);
      onNodeClick?.(dragNode);
    }
    setDragNode(null);
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);

    if (node) {
      setSelectedNode(node);
      onNodeClick?.(node);
    } else {
      setSelectedNode(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale * scaleFactor)),
    }));
  };

  return (
    <div ref={containerRef} className="w-full h-full relative rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 1.2 }))}
          className="w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 0.8 }))}
          className="w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center justify-center"
        >
          -
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center justify-center text-xs"
        >
          ⌂
        </button>
      </div>

      {/* Legend */}
      <div className={`absolute bottom-4 left-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'}`}>
        <div className="text-xs font-semibold mb-2">Node typer</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {Object.entries(nodeColors).filter(([k]) => k !== 'default').slice(0, 8).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <span style={{ color }} className="text-lg">●</span>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className={`absolute top-4 left-4 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} text-sm`}>
        <span className="font-semibold">{simulation.length}</span> noder · 
        <span className="font-semibold ml-1">{data.links.length}</span> relationer
      </div>
    </div>
  );
}
