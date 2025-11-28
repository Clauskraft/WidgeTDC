// Executive Risk Canvas - Cluster Node Component
// Individual node cards that can embed existing widgets

import React, { Suspense, useRef, useCallback } from 'react';
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  Scale, 
  Settings,
  Maximize2,
  Minimize2,
  GripVertical,
  ExternalLink,
  X
} from 'lucide-react';
import { ClusterNode, RiskSeverity, ClusterType } from './types';

interface ClusterNodeCardProps {
  node: ClusterNode;
  isSelected: boolean;
  isHovered: boolean;
  zoom: number;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
  onMove: (position: { x: number; y: number }) => void;
  onToggleCollapse: () => void;
  onRemove: () => void;
  widgetComponent?: React.LazyExoticComponent<any>;
}

const SEVERITY_COLORS: Record<RiskSeverity, { bg: string; border: string; badge: string }> = {
  critical: { bg: 'bg-rose-950/40', border: 'border-rose-500/50', badge: 'bg-rose-500' },
  high: { bg: 'bg-orange-950/40', border: 'border-orange-500/50', badge: 'bg-orange-500' },
  medium: { bg: 'bg-amber-950/40', border: 'border-amber-500/50', badge: 'bg-amber-500' },
  low: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', badge: 'bg-emerald-500' },
};

const TYPE_ICONS: Record<ClusterType, React.ReactNode> = {
  threat: <Shield className="w-4 h-4" />,
  contract: <FileText className="w-4 h-4" />,
  decision: <AlertTriangle className="w-4 h-4" />,
  policy: <Scale className="w-4 h-4" />,
  widget: <Settings className="w-4 h-4" />,
};

const TYPE_LABELS: Record<ClusterType, string> = {
  threat: 'Threat Hunt',
  contract: 'Contract View',
  decision: 'Decision Card',
  policy: 'Policy',
  widget: 'Widget',
};

export const ClusterNodeCard: React.FC<ClusterNodeCardProps> = ({
  node,
  isSelected,
  isHovered,
  zoom,
  onSelect,
  onHover,
  onMove,
  onToggleCollapse,
  onRemove,
  widgetComponent: WidgetComponent,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);

  const severity = node.severity || 'medium';
  const colors = SEVERITY_COLORS[severity];

  // Drag handling
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.position.x,
      nodeY: node.position.y,
    };

    const handleDragMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      
      const dx = (moveEvent.clientX - dragRef.current.startX) / zoom;
      const dy = (moveEvent.clientY - dragRef.current.startY) / zoom;
      
      onMove({
        x: dragRef.current.nodeX + dx,
        y: dragRef.current.nodeY + dy,
      });
    };

    const handleDragEnd = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }, [node.position, zoom, onMove]);

  // Extract metadata for header badge
  const headerBadge = node.metadata?.headerBadge as string | undefined;

  return (
    <div
      ref={cardRef}
      className={`
        absolute rounded-xl backdrop-blur-md shadow-2xl overflow-hidden
        transition-all duration-200 ease-out
        ${colors.bg} ${colors.border} border-2
        ${isSelected ? 'ring-2 ring-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : ''}
        ${isHovered ? 'shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''}
        ${node.collapsed ? 'cursor-pointer' : ''}
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.collapsed ? 280 : node.size.width,
        height: node.collapsed ? 60 : node.size.height,
        transform: `scale(${isSelected ? 1.02 : 1})`,
        zIndex: isSelected ? 100 : isHovered ? 50 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
        if (node.collapsed) onToggleCollapse();
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-black/20 border-b border-white/10 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
          <div className={`p-1 rounded ${colors.badge} flex-shrink-0`}>
            {TYPE_ICONS[node.type]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
                {TYPE_LABELS[node.type]}
              </span>
              {headerBadge && (
                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/60 truncate max-w-[120px]">
                  {headerBadge}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white truncate">
              {node.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Severity badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${colors.badge} text-white`}>
            {severity}
          </span>
          
          {/* Collapse/Expand button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            {node.collapsed ? (
              <Maximize2 className="w-3.5 h-3.5 text-white/60" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5 text-white/60" />
            )}
          </button>

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/60 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!node.collapsed && (
        <div className="flex-1 overflow-hidden" style={{ height: node.size.height - 52 }}>
          {WidgetComponent ? (
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center text-white/40">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading widget...</span>
                  </div>
                </div>
              }
            >
              <WidgetComponent
                widgetId={node.id}
                config={node.metadata}
                compact={true}
              />
            </Suspense>
          ) : (
            <NodeContentPreview node={node} />
          )}
        </div>
      )}

      {/* Subtitle bar when collapsed */}
      {node.collapsed && node.subtitle && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-1 text-xs text-white/50 truncate">
          {node.subtitle}
        </div>
      )}
    </div>
  );
};

// Fallback content preview when no widget component is available
const NodeContentPreview: React.FC<{ node: ClusterNode }> = ({ node }) => {
  const metadata = node.metadata || {};

  if (node.type === 'threat') {
    return (
      <div className="p-3 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-white/60">Risk Score</span>
          <span className="font-bold text-rose-400">{metadata.riskScore || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">ARR Exposure</span>
          <span className="font-bold text-white">
            {metadata.arrExposure 
              ? `${(metadata.arrExposure as number / 1000000).toFixed(1)} mio DKK` 
              : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Status</span>
          <span className={`font-medium ${
            metadata.status === 'escalated' ? 'text-rose-400' : 
            metadata.status === 'investigating' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {metadata.status || 'Unknown'}
          </span>
        </div>
        {metadata.graphNodes && Array.isArray(metadata.graphNodes) && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <span className="text-xs text-white/40 uppercase">Attack Graph Nodes</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {(metadata.graphNodes as any[]).slice(0, 4).map((gn, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-white/10 rounded">
                  {gn.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (node.type === 'contract') {
    return (
      <div className="p-3 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-white/60">ARR Value</span>
          <span className="font-bold text-white">
            {metadata.arrValue 
              ? `${(metadata.arrValue as number / 1000000).toFixed(1)} mio ${metadata.currency || 'DKK'}` 
              : 'N/A'}
          </span>
        </div>
        {metadata.keyClause && (
          <div className="p-2 bg-white/5 rounded border border-white/10">
            <span className="text-xs text-white/40 block mb-1">{metadata.clauseReference || 'Key Clause'}</span>
            <p className="text-xs text-white/80 italic line-clamp-3">
              "{metadata.keyClause}"
            </p>
          </div>
        )}
        {metadata.regulatoryFrameworks && Array.isArray(metadata.regulatoryFrameworks) && (
          <div className="flex flex-wrap gap-1">
            {(metadata.regulatoryFrameworks as any[]).map((rf, i) => (
              <span 
                key={i} 
                className={`text-xs px-2 py-0.5 rounded ${
                  rf.status === 'compliant' ? 'bg-emerald-500/20 text-emerald-400' :
                  rf.status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}
              >
                {rf.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (node.type === 'decision') {
    return (
      <div className="p-3 space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-white/60">Owner</span>
          <span className="font-medium text-cyan-400">{metadata.owner || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Status</span>
          <span className={`font-bold uppercase text-xs px-2 py-0.5 rounded ${
            metadata.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
            metadata.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
            metadata.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {metadata.status || 'Unknown'}
          </span>
        </div>
        {metadata.actions && Array.isArray(metadata.actions) && (
          <div className="space-y-1.5 mt-2 pt-2 border-t border-white/10">
            <span className="text-xs text-white/40 uppercase">Required Actions</span>
            {(metadata.actions as any[]).slice(0, 3).map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  action.status === 'completed' ? 'bg-emerald-500' :
                  action.status === 'in_progress' ? 'bg-amber-500' :
                  'bg-white/20'
                }`}>
                  {action.priority}
                </span>
                <span className="text-white/70 line-clamp-2">{action.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default preview
  return (
    <div className="p-3 h-full flex items-center justify-center text-white/40">
      <div className="text-center">
        <ExternalLink className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">Widget content preview</p>
      </div>
    </div>
  );
};

export default ClusterNodeCard;
