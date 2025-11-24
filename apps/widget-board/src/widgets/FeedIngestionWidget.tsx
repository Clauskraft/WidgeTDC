import React, { useEffect, useState } from 'react';
import { usePlatform } from '../platform/core/PlatformContext';
import { RefreshCw, Database, Globe, AlertTriangle, FileText, Copy, Clock } from 'lucide-react';
import './FeedIngestionWidget.css';

interface Feed {
    id: string;
    name: string;
    status: string;
    threatLevel?: string;
    documentsPerHour?: number;
    duplicatesPerHour?: number;
    backlogMinutes?: number;
    regions?: string[];
    tags?: string[];
}

export const FeedIngestionWidget: React.FC = () => {
    const { feedIngestion } = usePlatform();
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeeds();
    }, []);

    const loadFeeds = async () => {
        setLoading(true);
        try {
            const data = await feedIngestion.getFeeds();
            setFeeds(data);
        } catch (error) {
            console.error('Error loading feeds:', error);
        } finally {
            setLoading(false);
        }
    };

    const getThreatLevelColor = (level?: string) => {
        switch (level) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#ca8a04';
            case 'low': return '#16a34a';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return '#16a34a';
            case 'warning': return '#ca8a04';
            case 'error': return '#dc2626';
            default: return '#6b7280';
        }
    };

    return (
        <div className="feed-widget-container">
            <div className="feed-header">
                <h3 className="feed-title">
                    <Database size={20} /> Feed Ingestion
                </h3>
                <button
                    onClick={loadFeeds}
                    disabled={loading}
                    className="refresh-button"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="feed-loading">
                    Loading feeds...
                </div>
            ) : feeds.length === 0 ? (
                <div className="feed-empty">
                    No feeds available
                </div>
            ) : (
                <div className="feed-list">
                    {feeds.map((feed) => (
                        <div
                            key={feed.id}
                            className="feed-item"
                            style={{ borderColor: getThreatLevelColor(feed.threatLevel) }}
                        >
                            <div className="feed-item-header">
                                <div>
                                    <h4 className="feed-name">{feed.name}</h4>
                                    {feed.tags && feed.tags.length > 0 && (
                                        <div className="feed-tags">
                                            {feed.tags.map((tag, idx) => (
                                                <span key={idx} className="feed-tag">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="feed-status-group">
                                    {feed.threatLevel && (
                                        <span
                                            className="threat-badge"
                                            style={{ background: getThreatLevelColor(feed.threatLevel) }}
                                        >
                                            {feed.threatLevel}
                                        </span>
                                    )}
                                    <span
                                        className="status-indicator"
                                        style={{ background: getStatusColor(feed.status) }}
                                        title={`Status: ${feed.status}`}
                                    />
                                </div>
                            </div>

                            <div className="feed-metrics">
                                {feed.documentsPerHour !== undefined && (
                                    <div>
                                        <div className="metric-label"><FileText size={10} style={{ display: 'inline', marginRight: '4px' }} />Docs/Hour</div>
                                        <div className="metric-value">{feed.documentsPerHour}</div>
                                    </div>
                                )}
                                {feed.duplicatesPerHour !== undefined && (
                                    <div>
                                        <div className="metric-label"><Copy size={10} style={{ display: 'inline', marginRight: '4px' }} />Dupes/Hour</div>
                                        <div className="metric-value">{feed.duplicatesPerHour}</div>
                                    </div>
                                )}
                                {feed.backlogMinutes !== undefined && (
                                    <div>
                                        <div className="metric-label"><Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />Backlog</div>
                                        <div className="metric-value">{feed.backlogMinutes}m</div>
                                    </div>
                                )}
                            </div>

                            {feed.regions && feed.regions.length > 0 && (
                                <div className="feed-regions">
                                    <Globe size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    <strong>Regions:</strong> {feed.regions.join(', ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeedIngestionWidget;
