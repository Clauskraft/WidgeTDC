// Executive Risk Canvas - Main Widget Component
// SVP-level Risk & P&L Control Surface with zoom/pan infinite canvas

import React, { useRef, useState, useCallback, useEffect, Suspense } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Target,
  Layers,
  Plus,
  Settings,
  Download,
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -m-4">
      {/* Header Bar */}
      {!presentationMode && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Executive Risk Canvas
              </h2>
              <p className="text-xs text-white/50">SVP AI Cloud & Cyber · Risk & P&L Control Surface</p>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 ml-6 pl-6 border-l border-white/10">
              <div className="text-center">
                <div className="flex items-center gap-1 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xl font-bold">{summary.criticalIncidents}</span>
                </div>
                <span className="text-[10px] text-white/40 uppercase">Critical</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xl font-bold">{summary.pendingDecisions}</span>
                </div>
                <span className="text-[10px] text-white/40 uppercase">Pending</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-cyan-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xl font-bold">{formatCurrency(summary.totalArrAtRisk)}</span>
                </div>
                <span className="text-[10px] text-white/40 uppercase">ARR at Risk</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-emerald-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-xl font-bold">{summary.complianceScore}%</span>
                </div>
                <span className="text-[10px] text-white/40 uppercase">Compliance</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setViewportMode('portfolio')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewport.mode === 'portfolio'
                    ? 'bg-cyan-500 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setViewportMode('crisis')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewport.mode === 'crisis'
                    ? 'bg-rose-500 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Crisis
              </button>
            </div>

            {/* Cluster Quick Nav */}
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
              onChange={(e) => e.target.value && focusCluster(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Jump to Cluster...</option>
              {clusters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.severity})
                </option>
              ))}
            </select>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
              <button
                onClick={() => setZoom(viewport.zoom * 0.8)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <ZoomOut className="w-4 h-4 text-white/60" />
              </button>
              <span className="text-xs text-white/60 w-12 text-center">
                {Math.round(viewport.zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(viewport.zoom * 1.25)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <ZoomIn className="w-4 h-4 text-white/60" />
              </button>
              <button
                onClick={resetViewport}
                className="p-1 hover:bg-white/10 rounded ml-1"
                title="Reset View"
              >
                <Maximize className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={toggleMinimap}
              className={`p-2 rounded-lg transition-colors ${
                showMinimap ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
              title="Toggle Minimap"
            >
              {showMinimap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={togglePresentationMode}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
              title="Presentation Mode (Ctrl+P)"
            >
              <Presentation className="w-4 h-4" />
            </button>

            <button
              onClick={resetToDefault}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
              title="Reset to Default"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full px-6 py-2 flex items-center gap-4">
            <span className="text-white/60 text-sm">Presentation Mode</span>
            <button
              onClick={togglePresentationMode}
              className="text-white/80 hover:text-white text-sm font-medium"
            >
              Exit (Ctrl+P)
            </button>
          </div>
        )}
      </div>
    </div>
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
    <div className="absolute bottom-4 left-4 w-96 bg-slate-900/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white">Argumentationskæde</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white">×</button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <span className="text-xs text-white/40 uppercase">Forbindelse</span>
          <p className="text-sm text-white font-medium">{connection.label}</p>
        </div>
        {connection.svpBudskab && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <span className="text-xs text-cyan-400 uppercase block mb-1">SVP Budskab</span>
            <p className="text-sm text-white/80 italic">"{connection.svpBudskab}"</p>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className={`px-2 py-0.5 rounded ${
            connection.connectionType === 'causal' ? 'bg-rose-500/20 text-rose-400' :
            connection.connectionType === 'regulatory' ? 'bg-amber-500/20 text-amber-400' :
            connection.connectionType === 'financial' ? 'bg-blue-500/20 text-blue-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {connection.connectionType}
          </span>
          <span>{connection.style}</span>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveRiskCanvasWidget;
