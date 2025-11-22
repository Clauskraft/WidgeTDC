import React, { useEffect, useState, useRef } from 'react';

interface ActivityEvent {
    id: string;
    title: string;
    description: string;
    category: 'ingestion' | 'alert' | 'automation' | 'audit';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    channel: 'SSE' | 'Webhook' | 'Job';
    createdAt: string;
    acknowledged: boolean;
}

export const ActivityStreamWidget: React.FC = () => {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [paused, setPaused] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        loadInitialEvents();

        // Set up SSE connection for real-time updates
        if (!paused) {
            connectToStream();
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [paused, severityFilter, categoryFilter]);

    const loadInitialEvents = async () => {
        try {
            const params = new URLSearchParams();
            if (severityFilter !== 'all') params.append('severity', severityFilter);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);
            params.append('limit', '25');

            const response = await fetch(`/api/security/activity?${params}`);
            if (!response.ok) throw new Error('Failed to load events');

            const data = await response.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const connectToStream = () => {
        const params = new URLSearchParams();
        if (severityFilter !== 'all') params.append('severity', severityFilter);
        if (categoryFilter !== 'all') params.append('category', categoryFilter);

        const eventSource = new EventSource(`/api/security/activity/stream?${params}`);

        eventSource.onmessage = (event) => {
            try {
                const newEvent = JSON.parse(event.data);
                setEvents((prev) => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
            } catch (error) {
                console.error('Error parsing SSE event:', error);
            }
        };

        eventSource.onerror = () => {
            console.error('SSE connection error');
            eventSource.close();
        };

        eventSourceRef.current = eventSource;
    };

    const handleAcknowledge = async (eventId: string) => {
        try {
            const response = await fetch(`/api/security/activity/${eventId}/ack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acknowledged: true })
            });

            if (!response.ok) throw new Error('Failed to acknowledge');

            setEvents((prev) =>
                prev.map((e) => (e.id === eventId ? { ...e, acknowledged: true } : e))
            );
        } catch (error) {
            console.error('Error acknowledging event:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#ca8a04';
            case 'low': return '#16a34a';
            default: return '#6b7280';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'ingestion': return '📥';
            case 'alert': return '🚨';
            case 'automation': return '⚙️';
            case 'audit': return '📋';
            default: return '📌';
        }
    };

    return (
        <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', background: '#1f2937', color: '#f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>📡 Activity Stream</h3>
                <button
                    onClick={() => setPaused(!paused)}
                    style={{
                        padding: '6px 12px',
                        background: paused ? '#16a34a' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {paused ? 'Resume' : 'Pause'}
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        color: '#f3f4f6',
                        fontSize: '14px'
                    }}
                >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        color: '#f3f4f6',
                        fontSize: '14px'
                    }}
                >
                    <option value="all">All Categories</option>
                    <option value="ingestion">Ingestion</option>
                    <option value="alert">Alert</option>
                    <option value="automation">Automation</option>
                    <option value="audit">Audit</option>
                </select>
            </div>

            {/* Event Stream */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                        No events to display
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.map((event) => (
                            <div
                                key={event.id}
                                style={{
                                    background: event.acknowledged ? '#2d3748' : '#374151',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    borderLeft: `4px solid ${getSeverityColor(event.severity)}`,
                                    opacity: event.acknowledged ? 0.6 : 1
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '18px' }}>{getCategoryIcon(event.category)}</span>
                                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{event.title}</h4>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                padding: '3px 8px',
                                                background: getSeverityColor(event.severity),
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {event.severity}
                                        </span>
                                        {!event.acknowledged && (
                                            <button
                                                onClick={() => handleAcknowledge(event.id)}
                                                style={{
                                                    padding: '3px 8px',
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px'
                                                }}
                                            >
                                                ACK
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#d1d5db', lineHeight: '1.4' }}>
                                    {event.description}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
                                    <div>
                                        <strong>Source:</strong> {event.source} <span style={{ margin: '0 4px' }}>•</span>
                                        <strong>Channel:</strong> {event.channel}
                                    </div>
                                    <div>
                                        {new Date(event.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityStreamWidget;
