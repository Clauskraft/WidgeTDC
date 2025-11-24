import React, { useEffect, useState, useRef } from 'react';
import { usePlatform } from '../platform/core/PlatformContext';
import { Activity, Pause, Play, AlertTriangle, CheckCircle, Settings, FileText, Database, Clock, Radio } from 'lucide-react';
import './ActivityStreamWidget.css';

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
    const { securityOverwatch } = usePlatform();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [paused, setPaused] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Use setTimeout to avoid synchronous setState
        setTimeout(() => {
            loadInitialEvents();

            // Set up SSE connection for real-time updates
            if (!paused) {
                connectToStream();
            }
        }, 0);

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [paused, severityFilter, categoryFilter]);

    const loadInitialEvents = async () => {
        try {
            const data = await securityOverwatch.getActivities({
                severity: severityFilter,
                category: categoryFilter,
                limit: 25
            });
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const connectToStream = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        eventSourceRef.current = securityOverwatch.connectToActivityStream(
            { severity: severityFilter, category: categoryFilter },
            (newEvent) => {
                setEvents((prev) => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
            },
            () => {
                console.error('SSE connection error');
                // Optional: Implement reconnection logic or show error state
            }
        );
    };

    const handleAcknowledge = async (eventId: string) => {
        try {
            const success = await securityOverwatch.acknowledgeActivity(eventId);
            if (success) {
                setEvents((prev) =>
                    prev.map((e) => (e.id === eventId ? { ...e, acknowledged: true } : e))
                );
            }
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
            case 'ingestion': return <Database size={16} />;
            case 'alert': return <AlertTriangle size={16} />;
            case 'automation': return <Settings size={16} />;
            case 'audit': return <FileText size={16} />;
            default: return <Activity size={16} />;
        }
    };

    return (
        <div className="activity-widget-container">
            <div className="activity-header">
                <h3 className="activity-title">
                    <Radio size={20} className={paused ? "text-gray-400" : "text-green-500 animate-pulse"} />
                    Activity Stream
                </h3>
                <button
                    onClick={() => setPaused(!paused)}
                    className={`pause-button ${paused ? 'paused' : 'active'}`}
                >
                    {paused ? <Play size={14} /> : <Pause size={14} />}
                    {paused ? 'Resume' : 'Pause'}
                </button>
            </div>

            {/* Filters */}
            <div className="filter-container">
                <select
                    className="filter-select"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    <option value="ingestion">Ingestion</option>
                    <option value="alert">Alert</option>
                    <option value="automation">Automation</option>
                    <option value="audit">Audit</option>
                </select>
            </div>

            {/* Event Stream */}
            <div className="activity-list">
                {events.length === 0 ? (
                    <div className="no-events">
                        No events to display
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className={`activity-item ${event.acknowledged ? 'acknowledged' : ''}`}
                                style={{ borderLeftColor: getSeverityColor(event.severity) }}
                            >
                                <div className="item-header">
                                    <div className="item-title-group">
                                        <span className="item-icon">{getCategoryIcon(event.category)}</span>
                                        <h4 className="item-title">{event.title}</h4>
                                    </div>
                                    <div className="item-meta-group">
                                        <span
                                            className="severity-badge"
                                            style={{ background: getSeverityColor(event.severity) }}
                                        >
                                            {event.severity}
                                        </span>
                                        {!event.acknowledged && (
                                            <button
                                                className="ack-button"
                                                onClick={() => handleAcknowledge(event.id)}
                                                title="Acknowledge"
                                            >
                                                <CheckCircle size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="item-description">
                                    {event.description}
                                </p>

                                <div className="item-footer">
                                    <div className="item-source">
                                        <strong>Source:</strong> {event.source} <span style={{ margin: '0 4px' }}>•</span>
                                        <strong>Channel:</strong> {event.channel}
                                    </div>
                                    <div className="item-time">
                                        <Clock size={12} />
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
