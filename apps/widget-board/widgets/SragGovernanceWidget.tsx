import React, { useState } from 'react';

interface SragResult {
  type: 'analytical' | 'semantic';
  result: any[];
  sqlQuery: string | null;
  metadata: {
    traceId: string;
    docIds?: number[];
  };
}

const SragGovernanceWidget: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SragResult | null>(null);
  const [error, setError] = useState('');
  const [sqlOnly, setSqlOnly] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/srag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: 'org-1',
          naturalLanguageQuery: query,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to query SRAG');
      }

      const data = await response.json();

      // Filter out if sqlOnly is checked and type is semantic
      if (sqlOnly && data.type === 'semantic') {
        setError('This query requires semantic search, but SQL-only mode is enabled');
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
        📊 SRAG Data Governance
      </h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Natural Language Query
          </label>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g., What is the total supplier spending? or Find meeting notes about architecture"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '10px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
              resize: 'vertical',
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            id="sqlOnly"
            checked={sqlOnly}
            onChange={e => setSqlOnly(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <label htmlFor="sqlOnly" style={{ fontSize: '14px', cursor: 'pointer' }}>
            SQL-based answers only (analytical queries)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#555' : '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Querying...' : 'Execute Query'}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#ff3333',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Results</h3>
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: result.type === 'analytical' ? '#3b82f6' : '#8b5cf6',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {result.type === 'analytical' ? '📈 SQL' : '🔍 Semantic'}
            </div>
          </div>

          {result.sqlQuery && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '13px', marginBottom: '5px', color: '#888' }}>SQL Query:</div>
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                }}
              >
                {result.sqlQuery}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '10px', fontSize: '13px', color: '#888' }}>
            Trace ID: {result.metadata.traceId}
            {result.metadata.docIds && result.metadata.docIds.length > 0 && (
              <span> • Documents: {result.metadata.docIds.join(', ')}</span>
            )}
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: '#2a2a2a',
              borderRadius: '4px',
              padding: '15px',
              overflowY: 'auto',
            }}
          >
            {result.result.length === 0 ? (
              <div style={{ color: '#888', fontSize: '14px' }}>No results found</div>
            ) : (
              <div style={{ fontSize: '13px' }}>
                {result.result.map((item: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '15px',
                      paddingBottom: '15px',
                      borderBottom: index < result.result.length - 1 ? '1px solid #444' : 'none',
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'inherit',
                      }}
                    >
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#888',
              textAlign: 'right',
            }}
          >
            {result.result.length} result{result.result.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default SragGovernanceWidget;
