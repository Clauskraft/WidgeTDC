// Executive Risk Canvas - Main Widget Component
// SVP-level Risk & P&L Control Surface with zoom/pan infinite canvas

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Target,
  Presentation,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Shield,
} from 'lucide-react';
import { useCanvasStore, useViewport, useNodes, useConnections, useClusters } from './canvasStore';
import { ClusterNodeCard } from './ClusterNodeCard';
import { ConnectionLines } from './ConnectionLines';
import { Minimap } from './Minimap';
import { DEFAULT_EXECUTIVE_SUMMARY } from './defaultConfig';
import { staticWidgetRegistry } from '../../src/staticWidgetRegistry';
import { MatrixWidgetWrapper } from '../../src/components/MatrixWidgetWrapper';

interface ExecutiveRiskCanvasProps {
  widgetId?: string;
  config?: Record<string, unknown>;
}

const ExecutiveRiskCanvasWidget: React.FC<ExecutiveRiskCanvasProps> = ({ widgetId }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | undefined>();

  // Store selectors
  const viewport = useViewport();
  const nodes = useNodes();
  const connections = useConnections();
  const clusters = useClusters();
  
  // Store actions
  const {
    setZoom,
    setPan,
    setViewportMode,
    resetViewport,
    moveNode,
    toggleNodeCollapse,
    selectNode,
    hoverNode,
    removeNode,
    selectConnection,
    focusCluster,
    togglePresentationMode,
    toggleMinimap,
    resetToDefault,
    selectedNodeId,
    selectedConnectionId,
    hoveredNodeId,
    presentationMode,
    showMinimap,
  } = useCanvasStore();

  // Measure canvas size
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(viewport.zoom * delta);
  }, [viewport.zoom, setZoom]);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current?.firstChild) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.pan.x, y: e.clientY - viewport.pan.y });
    }
  }, [viewport.pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, setPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Click on canvas background to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current?.firstChild) {
      selectNode(undefined);
      selectConnection(undefined);
    }
  }, [selectNode, selectConnection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectNode(undefined);
        selectConnection(undefined);
      }
      if (e.key === '+' || e.key === '=') setZoom(viewport.zoom * 1.1);
      if (e.key === '-') setZoom(viewport.zoom * 0.9);
      if (e.key === '0') resetViewport();
      if (e.key === 'p' && e.ctrlKey) {
        e.preventDefault();
        togglePresentationMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewport.zoom, setZoom, resetViewport, selectNode, selectConnection, togglePresentationMode]);

  // Get widget component for node
  const getWidgetComponent = (widgetType?: string) => {
    if (!widgetType) return undefined;
    return staticWidgetRegistry[widgetType];
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} mio`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)} k`;
    return value.toString();
  };

  const summary = DEFAULT_EXECUTIVE_SUMMARY;

  const Controls = () => (
    <div className="flex items-center gap-2">
      {/* View Mode Toggle */}
      <div className="flex items-center bg-white/5 rounded-lg p-0.5">
        <button
          onClick={() => setViewportMode('portfolio')}
          className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
            viewport.mode === 'portfolio' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Portfolio
        </button>
        <button
          onClick={() => setViewportMode('crisis')}
          className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
            viewport.mode === 'crisis' ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Crisis
        </button>
      </div>

      <button onClick={() => setZoom(viewport.zoom * 0.8)} className="p-1 hover:text-[#00B5CB] text-gray-400"><ZoomOut size={14} /></button>
      <span className="text-[10px] text-gray-500 w-8 text-center">{Math.round(viewport.zoom * 100)}%</span>
      <button onClick={() => setZoom(viewport.zoom * 1.25)} className="p-1 hover:text-[#00B5CB] text-gray-400"><ZoomIn size={14} /></button>
      
      <div className="w-px h-4 bg-white/10 mx-1" />
      
      <button onClick={toggleMinimap} className={`p-1 ${showMinimap ? 'text-[#00B5CB]' : 'text-gray-400'}`}><Eye size={14} /></button>
      <button onClick={togglePresentationMode} className="p-1 hover:text-[#00B5CB] text-gray-400"><Presentation size={14} /></button>
      <button onClick={resetToDefault} className="p-1 hover:text-[#00B5CB] text-gray-400"><RefreshCw size={14} /></button>
    </div>
  );

  return (
    <MatrixWidgetWrapper title="Executive Risk Canvas" controls={<Controls />} className="relative">
      {/* Stats Overlay */}
      {!presentationMode && (
        <div className="absolute top-2 left-2 z-10 flex gap-2">
            <div className="bg-black/60 backdrop-blur-md border border-rose-500/30 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[80px]">
                <div className="text-lg font-bold text-rose-400 leading-none">{summary.criticalIncidents}</div>
                <div className="text-[9px] text-rose-500/70 uppercase font-bold tracking-wider">Critical</div>
            </div>
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[80px]">
                <div className="text-lg font-bold text-cyan-400 leading-none">{formatCurrency(summary.totalArrAtRisk)}</div>
                <div className="text-[9px] text-cyan-500/70 uppercase font-bold tracking-wider">Risk ARR</div>
            </div>
             <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[80px]">
                <div className="text-lg font-bold text-emerald-400 leading-none">{summary.complianceScore}%</div>
                <div className="text-[9px] text-emerald-500/70 uppercase font-bold tracking-wider">Compliance</div>
            </div>
        </div>
      )}

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={`w-full h-full relative overflow-hidden bg-[#050B14] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Infinite Canvas */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Grid Background */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: -5000,
              top: -5000,
              width: 10000,
              height: 10000,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Connection Lines */}
          <ConnectionLines
            connections={connections}
            nodes={nodes}
            selectedConnectionId={selectedConnectionId}
            hoveredConnectionId={hoveredConnectionId}
            onSelectConnection={selectConnection}
            zoom={viewport.zoom}
          />

          {/* Cluster Node Cards */}
          {nodes.map((node) => (
            <ClusterNodeCard
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              isHovered={node.id === hoveredNodeId}
              zoom={viewport.zoom}
              onSelect={() => selectNode(node.id)}
              onHover={(hovering) => hoverNode(hovering ? node.id : undefined)}
              onMove={(position) => moveNode(node.id, position)}
              onToggleCollapse={() => toggleNodeCollapse(node.id)}
              onRemove={() => removeNode(node.id)}
              widgetComponent={getWidgetComponent(node.widgetType)}
            />
          ))}
        </div>

        {/* Minimap */}
        {showMinimap && (
          <Minimap
            nodes={nodes}
            clusters={clusters}
            viewport={viewport}
            canvasSize={canvasSize}
            onNavigate={setPan}
          />
        )}

        {/* Selected Connection Details Panel */}
        {selectedConnectionId && (
          <SelectedConnectionPanel
            connectionId={selectedConnectionId}
            connections={connections}
            onClose={() => selectConnection(undefined)}
          />
        )}

        {/* Presentation Mode Overlay */}
        {presentationMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full px-6 py-2 flex items-center gap-4 border border-white/10">
            <span className="text-white/60 text-xs uppercase tracking-widest">Presentation Mode</span>
            <button
              onClick={togglePresentationMode}
              className="text-[#00B5CB] hover:text-white text-xs font-bold"
            >
              EXIT
            </button>
          </div>
        )}
      </div>
    </MatrixWidgetWrapper>
  );
};

// Selected Connection Details Panel
const SelectedConnectionPanel: React.FC<{
  connectionId: string;
  connections: any[];
  onClose: () => void;
}> = ({ connectionId, connections, onClose }) => {
  const connection = connections.find(c => c.id === connectionId);
  if (!connection) return null;

  return (
    <div className="absolute bottom-4 left-4 w-80 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden z-20">
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-white/5">
        <h3 className="text-xs font-bold text-white uppercase">Connection Link</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white text-lg">×</button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <span className="text-[9px] text-gray-500 uppercase tracking-wider">Label</span>
          <p className="text-sm text-white font-medium">{connection.label}</p>
        </div>
        {connection.svpBudskab && (
          <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <span className="text-[9px] text-cyan-400 uppercase block mb-1 font-bold">SVP Insight</span>
            <p className="text-xs text-cyan-100 italic">"{connection.svpBudskab}"</p>
          </div>
        )}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <span className={`px-2 py-0.5 text-[9px] rounded uppercase font-bold ${
            connection.connectionType === 'causal' ? 'bg-rose-500/20 text-rose-400' :
            connection.connectionType === 'regulatory' ? 'bg-amber-500/20 text-amber-400' :
            connection.connectionType === 'financial' ? 'bg-blue-500/20 text-blue-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {connection.connectionType}
          </span>
          <span className="text-[10px] text-gray-500 uppercase">{connection.style}</span>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveRiskCanvasWidget;