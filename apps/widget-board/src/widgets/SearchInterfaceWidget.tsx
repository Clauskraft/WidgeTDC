import React, { useState } from 'react';

interface SearchResult {
    id: string;
    title: string;
    summary: string;
    source: string;
    severity: string;
    timestamp: string;
    tags: string[];
    score: number;
}

export const SearchInterfaceWidget: React.FC = () => {
    const [query, setQuery] = useState('');
    const [severity, setSeverity] = useState('all');
    const [timeframe, setTimeframe] = useState('24h');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<{ latencyMs: number; totalDocs: number } | null>(null);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/security/search/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    severity,
                    timeframe,
                    sources: []
                })
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data.results || []);
            setMetrics(data.metrics || null);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#ca8a04';
            case 'low': return '#16a34a';
            default: return '#6b7280';
        }
    };

    return (
        <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', background: '#1f2937', color: '#f3f4f6' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>🔍 Security Search</h3>

            {/* Search Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <input
                    type="text"
                    placeholder="Search threat intelligence..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    style={{
                        padding: '10px',
                        background: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        color: '#f3f4f6',
                        fontSize: '14px'
                    }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
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
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
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
                        <option value="1h">Last Hour</option>
                        <option value="6h">Last 6 Hours</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>

                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            background: loading ? '#4b5563' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 600
                        }}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Metrics */}
            {metrics && (
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '12px',
                    background: '#374151',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '13px'
                }}>
                    <div>
                        <span style={{ color: '#9ca3af' }}>Results:</span>{' '}
                        <strong>{metrics.totalDocs}</strong>
                    </div>
                    <div>
                        <span style={{ color: '#9ca3af' }}>Latency:</span>{' '}
                        <strong>{metrics.latencyMs}ms</strong>
                    </div>
                </div>
            )}

            {/* Results */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {results.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                        No results. Try a search query.
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.map((result) => (
                        <div
                            key={result.id}
                            style={{
                                background: '#374151',
                                borderRadius: '6px',
                                padding: '12px',
                                borderLeft: `4px solid ${getSeverityColor(result.severity)}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{result.title}</h4>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        padding: '3px 8px',
                                        background: getSeverityColor(result.severity),
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {result.severity}
                                </span>
                            </div>

                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#d1d5db', lineHeight: '1.4' }}>
                                {result.summary}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#9ca3af' }}>
                                <div>
                                    <strong>Source:</strong> {result.source}
                                </div>
                                <div>
                                    {new Date(result.timestamp).toLocaleString()}
                                </div>
                            </div>

                            {result.tags && result.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                                    {result.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                background: '#4b5563',
                                                borderRadius: '10px',
                                                color: '#d1d5db'
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchInterfaceWidget;
