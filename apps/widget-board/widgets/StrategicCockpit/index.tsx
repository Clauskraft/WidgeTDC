// Strategic Cockpit - Main Widget Component
// Glass, Neon & The Graph Theme

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Radar,
  Network,
  Sparkles,
  Map,
  Settings,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react';
import { useCockpitStore } from './cockpitStore';
import { AgentCouncil } from './AgentCouncil';
import { ObservationCardComponent } from './ObservationCard';
import { NeuralStreamPanel } from './NeuralStreamPanel';
import { CardConnections } from './CardConnections';
import { MindmapOverlay } from './MindmapOverlay';
import { NEON_COLORS } from './types';

interface StrategicCockpitWidgetProps {
  widgetId?: string;
  config?: {
    showAgentCouncil?: boolean;
    showNeuralStream?: boolean;
    initialCard?: string;
  };
}

export const StrategicCockpitWidget: React.FC<StrategicCockpitWidgetProps> = ({
  widgetId = 'strategic-cockpit',
  config,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | undefined>();
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [agentCouncilExpanded, setAgentCouncilExpanded] = useState(false);

  // Zustand store
  const {
    viewport,
    cards,
    selectedCardId,
    hoveredCardId,
    agents,
    neuralStream,
    activeNeuralSection,
    mindmap,
    showMindmap,
    mindmapMode,
    showAgentCouncil,
    showNeuralStream,
    isConnecting,
    connectionSource,
    wsConnected,
    lastUpdate,
    // Actions
    setViewport,
    setZoom,
    pan,
    resetViewport,
    selectCard,
    hoverCard,
    moveCard,
    toggleCardCollapse,
    connectCards,
    startConnecting,
    cancelConnecting,
    toggleAgentCouncil,
    setActiveNeuralSection,
    toggleNeuralStream,
    toggleMindmap,
    setMindmapMode,
    selectGraphNode,
    moveGraphNode,
    setMindmapViewport,
    resetToDefault,
  } = useCockpitStore();

  // Handle mouse wheel zoom
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

  // Handle canvas panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      if (isConnecting) {
        cancelConnecting();
      } else {
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
        selectCard(null);
      }
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

  // Track cursor for connection drawing
  useEffect(() => {
    if (!isConnecting) {
      setCursorPosition(undefined);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isConnecting]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isConnecting) cancelConnecting();
        else if (showMindmap) toggleMindmap();
        else selectCard(null);
      }
      if (e.key === '+' || e.key === '=') setZoom(viewport.zoom + 0.2);
      if (e.key === '-') setZoom(viewport.zoom - 0.2);
      if (e.key === '0') resetViewport();
      if (e.key === 'm' && e.ctrlKey) toggleMindmap();
      if (e.key === 'n' && e.ctrlKey) toggleNeuralStream();
      if (e.key === 'a' && e.ctrlKey) toggleAgentCouncil();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isConnecting,
    showMindmap,
    viewport.zoom,
    cancelConnecting,
    toggleMindmap,
    selectCard,
    setZoom,
    resetViewport,
    toggleNeuralStream,
    toggleAgentCouncil,
  ]);

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                <Radar className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Strategic Cockpit</h1>
                <p className="text-[10px] text-white/40">Glass, Neon & The Graph</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden lg:flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs text-white/60">
                  {cards.filter((c) => c.priority === 'critical').length} Critical
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-white/60">
                  {agents.filter((a) => a.status === 'active').length} Active Agents
                </span>
              </div>
            </div>
          </div>

          {/* Right section - Controls */}
          <div className="flex items-center gap-2">
            {/* View toggles */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
              <button
                onClick={toggleMindmap}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                  showMindmap
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Mindmap
              </button>
              <button
                onClick={toggleNeuralStream}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                  showNeuralStream
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Neural Stream
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
              <button
                onClick={() => setZoom(viewport.zoom - 0.2)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5 text-white/60" />
              </button>
              <span className="text-xs text-white/50 w-12 text-center">
                {Math.round(viewport.zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(viewport.zoom + 0.2)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>

            <button
              onClick={resetToDefault}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Reset to default"
            >
              <RefreshCw className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 top-14 overflow-hidden"
        style={{
          cursor: isPanning ? 'grabbing' : isConnecting ? 'crosshair' : 'grab',
          paddingBottom: showAgentCouncil ? (agentCouncilExpanded ? '128px' : '48px') : '0',
          paddingRight: showNeuralStream ? '384px' : '0',
        }}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 canvas-bg"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.03) 0%, transparent 50%),
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 50px 50px, 50px 50px',
            backgroundPosition: `center, ${viewport.x}px ${viewport.y}px, ${viewport.x}px ${viewport.y}px`,
          }}
        />

        {/* Canvas content */}
        <div
          className="absolute"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Card connections */}
          <CardConnections
            cards={cards}
            connectionSource={connectionSource}
            cursorPosition={cursorPosition}
            zoom={viewport.zoom}
            viewportOffset={{ x: viewport.x, y: viewport.y }}
          />

          {/* Observation cards */}
          {cards.map((card) => (
            <ObservationCardComponent
              key={card.id}
              card={card}
              isSelected={card.id === selectedCardId}
              isHovered={card.id === hoveredCardId}
              isConnecting={isConnecting && connectionSource !== card.id}
              zoom={viewport.zoom}
              onSelect={() => selectCard(card.id)}
              onHover={(hovered) => hoverCard(hovered ? card.id : null)}
              onMove={(pos) => moveCard(card.id, pos)}
              onToggleCollapse={() => toggleCardCollapse(card.id)}
              onStartConnect={() => startConnecting(card.id)}
              onConnect={() => {
                if (connectionSource && connectionSource !== card.id) {
                  connectCards(connectionSource, card.id);
                }
              }}
            />
          ))}
        </div>

        {/* Connection mode indicator */}
        {isConnecting && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-500/20 backdrop-blur-md rounded-full border border-cyan-500/50">
            <span className="text-sm text-cyan-400">
              Click another card to connect · Press ESC to cancel
            </span>
          </div>
        )}
      </div>

      {/* Neural Stream Panel */}
      {showNeuralStream && (
        <NeuralStreamPanel
          context={neuralStream}
          activeSection={activeNeuralSection}
          onSectionChange={setActiveNeuralSection}
          onClose={toggleNeuralStream}
          selectedCardTitle={selectedCard?.title}
        />
      )}

      {/* Mindmap Overlay */}
      {showMindmap && (
        <MindmapOverlay
          nodes={mindmap.nodes}
          edges={mindmap.edges}
          viewport={mindmap.viewport}
          selectedNodeId={mindmap.selectedNodeId}
          mode={mindmapMode}
          onClose={toggleMindmap}
          onNodeSelect={selectGraphNode}
          onNodeMove={moveGraphNode}
          onViewportChange={setMindmapViewport}
        />
      )}

      {/* Agent Council */}
      {showAgentCouncil && (
        <AgentCouncil
          agents={agents}
          isExpanded={agentCouncilExpanded}
          onToggle={() => setAgentCouncilExpanded(!agentCouncilExpanded)}
        />
      )}

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/60 border-t border-white/10 flex items-center justify-between px-4 text-[10px] text-white/40"
        style={{ marginBottom: showAgentCouncil ? (agentCouncilExpanded ? '128px' : '48px') : '0' }}
      >
        <div className="flex items-center gap-4">
          <span>{cards.length} observation cards</span>
          <span>{cards.reduce((sum, c) => sum + c.connections.length, 0)} connections</span>
          <span>{mindmap.nodes.length} graph nodes</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Keyboard: + - 0 Esc Ctrl+M Ctrl+N</span>
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {wsConnected ? 'WebSocket Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StrategicCockpitWidget;
