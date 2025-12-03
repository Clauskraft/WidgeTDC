// Strategic Cockpit - Main Widget Component
// Glass, Neon & The Graph Theme

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Radar, Network, Sparkles, Map, Settings, RefreshCw,
  ZoomIn, ZoomOut, Eye, EyeOff, Plus, Target
} from 'lucide-react';
import { useCockpitStore } from './cockpitStore';
import { AgentCouncil } from './AgentCouncil';
import { ObservationCardComponent } from './ObservationCard';
import { NeuralStreamPanel } from './NeuralStreamPanel';
import { CardConnections } from './CardConnections';
import { MindmapOverlay } from './MindmapOverlay';
import { MarketRadarPanel } from './MarketRadarPanel';
import { MatrixWidgetWrapper } from '../../src/components/MatrixWidgetWrapper';

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
    showMarketRadar,
    isConnecting,
    connectionSource,
    wsConnected,
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
    toggleMarketRadar,
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
    <MatrixWidgetWrapper title="Strategic Cockpit" controls={
      <Controls 
        showMindmap={showMindmap}
        showNeuralStream={showNeuralStream}
        showMarketRadar={showMarketRadar}
        viewport={viewport}
        onToggleMindmap={toggleMindmap}
        onToggleNeuralStream={toggleNeuralStream}
        onToggleMarketRadar={toggleMarketRadar}
        setZoom={setZoom}
        resetToDefault={resetToDefault}
      />
    } className="relative">
      <div
        ref={canvasRef}
        className="absolute inset-0 top-0 overflow-hidden bg-[#020617]"
        style={{
          cursor: isPanning ? 'grabbing' : isConnecting ? 'crosshair' : 'grab',
          // paddingRight: showNeuralStream || showMarketRadar ? '384px' : '0', 
        }}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 canvas-bg pointer-events-none"
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-500/20 backdrop-blur-md rounded-full border border-cyan-500/50 z-20">
            <span className="text-sm text-cyan-400">
              Click another card to connect · Press ESC to cancel
            </span>
          </div>
        )}
      </div>

      {/* Conditionally render panels */}
      {showNeuralStream && (
        <div className="absolute right-0 top-0 bottom-0 w-96 border-l border-white/10 bg-black/80 backdrop-blur-xl z-20">
            <NeuralStreamPanel
            context={neuralStream}
            activeSection={activeNeuralSection}
            onSectionChange={setActiveNeuralSection}
            onClose={toggleNeuralStream}
            selectedCardTitle={selectedCard?.title}
            />
        </div>
      )}
      {showMarketRadar && (
          <div className="absolute right-0 top-0 bottom-0 w-96 border-l border-white/10 bg-black/80 backdrop-blur-xl z-20">
            <MarketRadarPanel onClose={toggleMarketRadar} />
          </div>
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
            <AgentCouncil
            agents={agents}
            isExpanded={agentCouncilExpanded}
            onToggle={() => setAgentCouncilExpanded(!agentCouncilExpanded)}
            />
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/80 border-t border-white/10 flex items-center justify-between px-4 text-[10px] text-white/40 z-10">
        <div className="flex items-center gap-4">
          <span>{cards.length} active cards</span>
          <span>{mindmap.nodes.length} graph nodes</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {wsConnected ? 'WS Connected' : 'WS Offline'}
          </span>
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default StrategicCockpitWidget;

const Controls: React.FC<{
    showMindmap: boolean;
    showNeuralStream: boolean;
    showMarketRadar: boolean;
    viewport: { zoom: number };
    onToggleMindmap: () => void;
    onToggleNeuralStream: () => void;
    onToggleMarketRadar: () => void;
    setZoom: (zoom: number) => void;
    resetToDefault: () => void;
}> = ({
    showMindmap,
    showNeuralStream,
    showMarketRadar,
    viewport,
    onToggleMindmap,
    onToggleNeuralStream,
    onToggleMarketRadar,
    setZoom,
    resetToDefault
}) => (
    <div className="flex items-center gap-2">
        <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            <button onClick={onToggleMindmap} className={`p-1 rounded transition-colors ${showMindmap ? 'text-purple-400 bg-purple-500/20' : 'text-gray-400 hover:text-white'}`} title="Mindmap"><Network size={14} /></button>
            <button onClick={onToggleNeuralStream} className={`p-1 rounded transition-colors ${showNeuralStream ? 'text-cyan-400 bg-cyan-500/20' : 'text-gray-400 hover:text-white'}`} title="Neural Stream"><Sparkles size={14} /></button>
            <button onClick={onToggleMarketRadar} className={`p-1 rounded transition-colors ${showMarketRadar ? 'text-amber-400 bg-amber-500/20' : 'text-gray-400 hover:text-white'}`} title="Market Radar"><Target size={14} /></button>
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button onClick={() => setZoom(viewport.zoom - 0.2)} className="p-1 hover:text-[#00B5CB] text-gray-400"><ZoomOut size={14} /></button>
        <button onClick={() => setZoom(viewport.zoom + 0.2)} className="p-1 hover:text-[#00B5CB] text-gray-400"><ZoomIn size={14} /></button>
        <button onClick={resetToDefault} className="p-1 hover:text-[#00B5CB] text-gray-400"><RefreshCw size={14} /></button>
    </div>
);
