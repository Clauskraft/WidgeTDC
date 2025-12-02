import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import {
  acknowledgeActivityEvent,
  fetchSecurityActivity,
  getActivityStreamUrl,
} from '../utils/securityApi';
import { Filter, Pause, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';

type EventSeverity = 'low' | 'medium' | 'high' | 'critical';
type EventCategory = 'ingestion' | 'alert' | 'automation' | 'audit';

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  severity: EventSeverity;
  source: string;
  rule: string;
  timestamp: string;
  acknowledged: boolean;
  channel: 'SSE' | 'Webhook' | 'Job';
}

const INITIAL_EVENTS: ActivityEvent[] = [
  {
    id: 'evt-1101',
    title: 'Critical credential dump ingested',
    description: 'Dark web feed normalized 1.2k new credentials.',
    category: 'alert',
    severity: 'critical',
    source: 'Feed Ingestion',
    rule: 'critical-credential-dump',
    timestamp: '2025-11-18T08:18:00Z',
    acknowledged: false,
    channel: 'SSE',
  },
  {
    id: 'evt-1098',
    title: 'Vendor advisory indexed',
    description: 'Vendor Radar pushed CVE-2025-1123 advisory.',
    category: 'ingestion',
    severity: 'high',
    source: 'Vendor Radar',
    rule: 'vendor-critical',
    timestamp: '2025-11-18T08:12:00Z',
    acknowledged: false,
    channel: 'Job',
  },
];

const severityStyles: Record<EventSeverity, string> = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const ActivityStreamWidget: React.FC<{ widgetId: string }> = () => {
  const [events, setEvents] = useState<ActivityEvent[]>(INITIAL_EVENTS);
  const [severityFilter, setSeverityFilter] = useState<EventSeverity | 'all'>('all');
  const [liveMode, setLiveMode] = useState(true);
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const queueRef = useRef<ActivityEvent[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (liveMode && queueRef.current.length > 0) {
        setEvents(prev => [queueRef.current.shift()!, ...prev].slice(0, 50));
      }
    }, 2000);
    setIsStreamConnected(true); // Mock connection
    return () => clearInterval(timer);
  }, [liveMode]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => severityFilter === 'all' || event.severity === severityFilter);
  }, [events, severityFilter]);

  const handleAcknowledge = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, acknowledged: true } : e));
  };

  return (
    <MatrixWidgetWrapper 
        title="Activity Stream" 
        controls={
            <div className="flex items-center gap-2">
                <select 
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as any)}
                    className="bg-black/20 border border-white/10 text-[10px] rounded px-1 py-0.5 text-gray-300 focus:outline-none"
                >
                    <option value="all">All Events</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                </select>
                <button 
                    onClick={() => setLiveMode(!liveMode)}
                    className={`p-1 rounded hover:bg-white/10 ${liveMode ? 'text-green-400' : 'text-gray-500'}`}
                >
                    {liveMode ? <Pause size={12} /> : <Play size={12} />}
                </button>
            </div>
        }
    >
      <div className="flex flex-col h-full gap-2">
        {/* Stream Status */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
            <span className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isStreamConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {isStreamConnected ? 'LIVE FEED ACTIVE' : 'FEED DISCONNECTED'}
            </span>
            <span>{filteredEvents.length} events</span>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {filteredEvents.map(event => (
                <div 
                    key={event.id} 
                    className={`p-3 rounded-lg border bg-white/5 hover:bg-white/10 transition-all ${event.acknowledged ? 'opacity-50 border-white/5' : 'border-white/10'}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-200">{event.title}</span>
                            <span className="text-[10px] text-gray-500">{new Date(event.timestamp).toLocaleTimeString()} • {event.source}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border ${severityStyles[event.severity]}`}>
                            {event.severity}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed mb-2">{event.description}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-600 font-mono">{event.rule}</span>
                        {!event.acknowledged && (
                            <button 
                                onClick={() => handleAcknowledge(event.id)}
                                className="text-[10px] flex items-center gap-1 text-[#00B5CB] hover:text-white transition-colors"
                            >
                                <CheckCircle size={10} /> Acknowledge
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {filteredEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-xs">
                    No events matching filter
                </div>
            )}
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default ActivityStreamWidget;
