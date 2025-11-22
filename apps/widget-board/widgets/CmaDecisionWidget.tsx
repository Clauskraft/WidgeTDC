import React, { useState } from 'react';

interface Memory {
  id: number;
  content: string;
  importance: number;
}

const CmaDecisionWidget: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [widgetData, setWidgetData] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use MCP tool: cma.context
      const response = await fetch('/api/mcp/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'cma.context',
          payload: {
            userQuery: question,
            widgetData: widgetData,
            keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          },
          context: {
            orgId: 'org-1',
            userId: 'user-1',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get contextual prompt');
      }

      const data = await response.json();
      setPrompt(data.response);
      setMemories(data.memories || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
        🧠 CMA Decision Assistant
      </h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Decision Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What decision do you need help with?"
            style={{
              width: '100%',
              minHeight: '60px',
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

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Additional Context (Optional)
          </label>
          <input
            type="text"
            value={widgetData}
            onChange={(e) => setWidgetData(e.target.value)}
            placeholder="Any additional context..."
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="decision, architecture, budget..."
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#555' : '#0070f3',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Get Contextual Recommendations'}
        </button>
      </form>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ff3333',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {memories.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', fontWeight: '600' }}>
            📚 Related Memories ({memories.length})
          </h3>
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            padding: '10px',
          }}>
            {memories.map((memory) => (
              <div
                key={memory.id}
                style={{
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #444',
                }}
              >
                <div style={{ fontSize: '13px', color: '#ccc' }}>
                  {memory.content}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                  Importance: {'⭐'.repeat(memory.importance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prompt && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', fontWeight: '600' }}>
            💡 Contextual Prompt
          </h3>
          <div style={{
            flex: 1,
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            padding: '15px',
            fontSize: '13px',
            lineHeight: '1.6',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {prompt}
          </div>
        </div>
      )}
    </div>
  );
};

export default CmaDecisionWidget;
