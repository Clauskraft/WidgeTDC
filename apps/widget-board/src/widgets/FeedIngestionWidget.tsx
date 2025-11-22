import React, { useEffect, useState } from 'react';
import { usePlatform } from '../platform/core/PlatformContext';

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
        <div style={{ padding: '16px', height: '100%', overflow: 'auto', background: '#1f2937', color: '#f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>🔄 Feed Ingestion</h3>
                <button
                    onClick={loadFeeds}
                    style={{
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                    Loading feeds...
                </div>
            ) : feeds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                    No feeds available
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {feeds.map((feed) => (
                        <div
                            key={feed.id}
                            style={{
                                background: '#374151',
                                borderRadius: '8px',
                                padding: '16px',
                                border: `2px solid ${getThreatLevelColor(feed.threatLevel)}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>{feed.name}</h4>
                                    {feed.tags && feed.tags.length > 0 && (
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {feed.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        fontSize: '11px',
                                                        padding: '2px 8px',
                                                        background: '#4b5563',
                                                        borderRadius: '12px',
                                                        color: '#d1d5db'
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {feed.threatLevel && (
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                padding: '4px 8px',
                                                background: getThreatLevelColor(feed.threatLevel),
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {feed.threatLevel}
                                        </span>
                                    )}
                                    <span
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: getStatusColor(feed.status)
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginTop: '12px' }}>
                                {feed.documentsPerHour !== undefined && (
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Docs/Hour</div>
                                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{feed.documentsPerHour}</div>
                                    </div>
                                )}
                                {feed.duplicatesPerHour !== undefined && (
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Dupes/Hour</div>
                                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{feed.duplicatesPerHour}</div>
                                    </div>
                                )}
                                {feed.backlogMinutes !== undefined && (
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Backlog</div>
                                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{feed.backlogMinutes}m</div>
                                    </div>
                                )}
                            </div>

                            {feed.regions && feed.regions.length > 0 && (
                                <div style={{ marginTop: '12px', fontSize: '12px', color: '#d1d5db' }}>
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
