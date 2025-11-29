// Strategic Cockpit - Observation Card Component
// Floating glass cards on infinite canvas

import React, { useRef, useEffect, useState } from 'react';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Link2,
  ExternalLink,
  Tag,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  ObservationCard,
  CARD_CATEGORY_COLORS,
  PRIORITY_COLORS,
} from './types';

interface ObservationCardComponentProps {
  card: ObservationCard;
  isSelected: boolean;
  isHovered: boolean;
  isConnecting: boolean;
  zoom: number;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  onMove: (position: { x: number; y: number }) => void;
  onToggleCollapse: () => void;
  onStartConnect: () => void;
  onConnect: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'digital-sovereignty': '🇪🇺',
  'nis2-threats': '🛡️',
  'ai-security': '🤖',
  'privacy-chat': '🔒',
};

const CATEGORY_LABELS: Record<string, string> = {
  'digital-sovereignty': 'Digital Suverænitet',
  'nis2-threats': 'NIS2-trusler',
  'ai-security': 'AI-sikkerhed',
  'privacy-chat': 'Privatliv & Chat',
};

export const ObservationCardComponent: React.FC<ObservationCardComponentProps> = ({
  card,
  isSelected,
  isHovered,
  isConnecting,
  zoom,
  onSelect,
  onHover,
  onMove,
  onToggleCollapse,
  onStartConnect,
  onConnect,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const categoryColor = CARD_CATEGORY_COLORS[card.category];
  const priorityColor = PRIORITY_COLORS[card.priority];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX - dragOffset.x) / zoom;
      const newY = (e.clientY - dragOffset.y) / zoom;
      onMove({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, zoom, onMove]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      ref={cardRef}
      className={`absolute transition-all duration-200 ${
        isDragging ? 'cursor-grabbing z-50' : ''
      } ${isSelected ? 'z-40' : 'z-10'}`}
      style={{
        left: card.position.x,
        top: card.position.y,
        width: card.size.width,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => {
        if (isConnecting) {
          onConnect();
        } else {
          onSelect();
        }
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Glass card */}
      <div
        className={`relative rounded-xl overflow-hidden backdrop-blur-xl transition-all duration-200 ${
          isSelected
            ? 'ring-2 ring-offset-2 ring-offset-slate-950'
            : isHovered
            ? 'ring-1 ring-white/20'
            : ''
        } ${isConnecting ? 'cursor-pointer ring-2 ring-cyan-500/50 animate-pulse' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${categoryColor}15, ${categoryColor}05)`,
          borderColor: isSelected ? categoryColor : 'rgba(255,255,255,0.1)',
          borderWidth: '1px',
          borderStyle: 'solid',
          boxShadow: isSelected
            ? `0 0 30px ${categoryColor}30, 0 20px 40px rgba(0,0,0,0.3)`
            : '0 10px 30px rgba(0,0,0,0.2)',
          ...(isSelected && { ringColor: categoryColor }),
        }}
      >
        {/* Neon accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: categoryColor }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 drag-handle cursor-grab">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-white/30" />
            <span className="text-lg">{CATEGORY_ICONS[card.category]}</span>
            <div>
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: categoryColor }}
              >
                {CATEGORY_LABELS[card.category]}
              </span>
              <h3 className="text-sm font-semibold text-white -mt-0.5">{card.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
              style={{
                backgroundColor: `${priorityColor}20`,
                color: priorityColor,
              }}
            >
              {card.priority}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {card.isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronUp className="w-4 h-4 text-white/60" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {!card.isCollapsed && (
          <div className="p-4 space-y-3">
            <p className="text-sm text-white/80 leading-relaxed">{card.summary}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {card.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-3 text-[10px] text-white/40">
                {card.source && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {card.source}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(card.timestamp)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartConnect();
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors group"
                title="Connect to another card"
              >
                <Link2 className="w-3.5 h-3.5 text-white/40 group-hover:text-cyan-400 transition-colors" />
              </button>
            </div>

            {/* Connections indicator */}
            {card.connections.length > 0 && (
              <div className="text-[10px] text-white/30">
                {card.connections.length} connection{card.connections.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ObservationCardComponent;
