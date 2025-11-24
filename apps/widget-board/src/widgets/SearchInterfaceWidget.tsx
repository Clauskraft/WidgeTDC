import React, { useState } from 'react';
import { usePlatform } from '../platform/core/PlatformContext';
import { Search, AlertCircle, Clock, Database } from 'lucide-react';
import './SearchInterfaceWidget.css';

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
    const { securityOverwatch } = usePlatform();
    const [query, setQuery] = useState('');
    const [severity, setSeverity] = useState('all');
    const [timeframe, setTimeframe] = useState('24h');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<{ latencyMs: number; totalDocs: number } | null>(null);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await securityOverwatch.searchSecurity({
                query,
                severity,
                timeframe,
                sources: []
            });

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
        <div className="search-widget-container">
            <h3 className="search-widget-header">
                <Search size={20} /> Security Search
            </h3>

            {/* Search Form */}
            <div className="search-form">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search threat intelligence..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />

                <div className="search-controls">
                    <select
                        className="search-select"
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                    >
                        <option value="all">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <select
                        className="search-select"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                    >
                        <option value="1h">Last Hour</option>
                        <option value="6h">Last 6 Hours</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>

                    <button
                        className="search-button"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Metrics */}
            {metrics && (
                <div className="search-metrics">
                    <div>
                        <span className="metric-label">Results:</span>
                        <strong>{metrics.totalDocs}</strong>
                    </div>
                    <div>
                        <span className="metric-label">Latency:</span>
                        <strong>{metrics.latencyMs}ms</strong>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="search-results">
                {results.length === 0 && !loading && (
                    <div className="no-results">
                        No results. Try a search query.
                    </div>
                )}

                {results.map((result) => (
                    <div
                        key={result.id}
                        className="result-item"
                        style={{ borderLeftColor: getSeverityColor(result.severity) }}
                    >
                        <div className="result-header">
                            <h4 className="result-title">{result.title}</h4>
                            <span
                                className="result-severity"
                                style={{ background: getSeverityColor(result.severity) }}
                            >
                                {result.severity}
                            </span>
                        </div>

                        <p className="result-summary">
                            {result.summary}
                        </p>

                        <div className="result-meta">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Database size={12} /> {result.source}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {new Date(result.timestamp).toLocaleString()}
                            </div>
                        </div>

                        {result.tags && result.tags.length > 0 && (
                            <div className="result-tags">
                                {result.tags.map((tag, idx) => (
                                    <span key={idx} className="result-tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchInterfaceWidget;
