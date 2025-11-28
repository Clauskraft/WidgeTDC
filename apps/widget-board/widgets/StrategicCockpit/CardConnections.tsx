// Strategic Cockpit - Card Connections Component
// SVG connections between observation cards

import React from 'react';
import { ObservationCard, CARD_CATEGORY_COLORS } from './types';

interface CardConnectionsProps {
  cards: ObservationCard[];
  connectionSource: string | null;
  cursorPosition?: { x: number; y: number };
  zoom: number;
  viewportOffset: { x: number; y: number };
}

export const CardConnections: React.FC<CardConnectionsProps> = ({
  cards,
  connectionSource,
  cursorPosition,
  zoom,
  viewportOffset,
}) => {
  // Get card center position
  const getCardCenter = (card: ObservationCard) => ({
    x: card.position.x + card.size.width / 2,
    y: card.position.y + (card.isCollapsed ? 30 : card.size.height / 2),
  });

  // Get card edge point towards target
  const getEdgePoint = (card: ObservationCard, targetX: number, targetY: number) => {
    const center = getCardCenter(card);
    const angle = Math.atan2(targetY - center.y, targetX - center.x);
    
    const width = card.size.width / 2;
    const height = (card.isCollapsed ? 60 : card.size.height) / 2;
    
    // Simple box edge calculation
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    let edgeX, edgeY;
    
    if (Math.abs(cos) * height > Math.abs(sin) * width) {
      // Intersects left or right edge
      const sign = cos > 0 ? 1 : -1;
      edgeX = center.x + sign * width;
      edgeY = center.y + sign * width * Math.tan(angle);
    } else {
      // Intersects top or bottom edge
      const sign = sin > 0 ? 1 : -1;
      edgeY = center.y + sign * height;
      edgeX = center.x + sign * height / Math.tan(angle);
    }
    
    return { x: edgeX, y: edgeY };
  };

  // Create curved path between two points
  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Control point offset - make curve based on distance
    const curvature = Math.min(distance * 0.3, 100);
    
    // Midpoint with perpendicular offset for curve
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Perpendicular direction
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    // Control point
    const ctrlX = midX + perpX * curvature * 0.3;
    const ctrlY = midY + perpY * curvature * 0.3;
    
    return `M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`;
  };

  // Collect all connections
  const connections: Array<{
    sourceCard: ObservationCard;
    targetCard: ObservationCard;
    id: string;
  }> = [];

  cards.forEach((sourceCard) => {
    sourceCard.connections.forEach((targetId) => {
      const targetCard = cards.find((c) => c.id === targetId);
      if (targetCard) {
        connections.push({
          sourceCard,
          targetCard,
          id: `${sourceCard.id}-${targetId}`,
        });
      }
    });
  });

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Arrow marker */}
        <marker
          id="connection-arrow"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(0,255,255,0.6)" />
        </marker>

        {/* Gradient definitions for each category */}
        {Object.entries(CARD_CATEGORY_COLORS).map(([category, color]) => (
          <linearGradient
            key={category}
            id={`gradient-${category}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="50%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        ))}
      </defs>

      {/* Existing connections */}
      {connections.map(({ sourceCard, targetCard, id }) => {
        const targetCenter = getCardCenter(targetCard);
        const sourceCenter = getCardCenter(sourceCard);
        
        const start = getEdgePoint(sourceCard, targetCenter.x, targetCenter.y);
        const end = getEdgePoint(targetCard, sourceCenter.x, sourceCenter.y);
        
        const path = createCurvedPath(start, end);
        const sourceColor = CARD_CATEGORY_COLORS[sourceCard.category];

        return (
          <g key={id}>
            {/* Background glow */}
            <path
              d={path}
              fill="none"
              stroke={sourceColor}
              strokeWidth="6"
              strokeOpacity="0.1"
              filter="url(#connection-glow)"
            />
            
            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke={sourceColor}
              strokeWidth="2"
              strokeOpacity="0.6"
              strokeLinecap="round"
              markerEnd="url(#connection-arrow)"
            />
            
            {/* Animated dash overlay */}
            <path
              d={path}
              fill="none"
              stroke={sourceColor}
              strokeWidth="2"
              strokeOpacity="0.3"
              strokeDasharray="8 12"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-40"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        );
      })}

      {/* Connection being drawn */}
      {connectionSource && cursorPosition && (
        <>
          {(() => {
            const sourceCard = cards.find((c) => c.id === connectionSource);
            if (!sourceCard) return null;

            const sourceCenter = getCardCenter(sourceCard);
            const start = getEdgePoint(
              sourceCard,
              cursorPosition.x / zoom - viewportOffset.x,
              cursorPosition.y / zoom - viewportOffset.y
            );
            const end = {
              x: cursorPosition.x / zoom - viewportOffset.x,
              y: cursorPosition.y / zoom - viewportOffset.y,
            };

            const path = createCurvedPath(start, end);

            return (
              <g>
                <path
                  d={path}
                  fill="none"
                  stroke="#00FFFF"
                  strokeWidth="2"
                  strokeOpacity="0.8"
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-24"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                </path>
                
                {/* Cursor endpoint */}
                <circle
                  cx={end.x}
                  cy={end.y}
                  r="6"
                  fill="#00FFFF"
                  fillOpacity="0.3"
                >
                  <animate
                    attributeName="r"
                    values="4;8;4"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })()}
        </>
      )}
    </svg>
  );
};

export default CardConnections;
