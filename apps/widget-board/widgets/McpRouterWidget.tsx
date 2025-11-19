import React, { useState, useEffect, useRef } from 'react';

interface MCPMessage {
  id: string;
  sourceId: string;
  targetId: string;
  tool: string;
  payload: any;
  createdAt: string;
  result?: any;
  success?: boolean;
}

const McpRouterWidget: React.FC = () => {
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [filterTool, setFilterTool] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterTarget, setFilterTarget] = useState('');
  const [testTool, setTestTool] = useState('cma.context');
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        orgId: 'org-1',
        userId: 'user-1',
        userQuery: 'Test query',
        keywords: ['test'],
      },
      null,
      2
    )
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTools = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/mcp/tools');
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
      }
    } catch (err) {
      console.error('Failed to load tools:', err);
    }
  };

  const sendTestMessage = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = JSON.parse(testPayload);

      const message: Partial<MCPMessage> = {
        id: `msg-${Date.now()}`,
        sourceId: 'mcp-inspector',
        targetId: testTool.split('.')[0],
        tool: testTool,
        payload,
        createdAt: new Date().toISOString(),
      };

      const response = await fetch('http://localhost:3001/api/mcp/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      const data = await response.json();

      const resultMessage: MCPMessage = {
        ...(message as MCPMessage),
        result: data.result,
        success: data.success,
      };

      setMessages([...messages, resultMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filterTool && msg.tool !== filterTool) return false;
    if (filterSource && msg.sourceId !== filterSource) return false;
    if (filterTarget && msg.targetId !== filterTarget) return false;
    return true;
  });

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
        🔌 MCP Inspector
      </h2>

      {/* Tools List */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
          Available Tools ({tools.length})
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {tools.map(tool => (
            <div
              key={tool}
              style={{
                padding: '4px 12px',
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                fontSize: '12px',
                border: '1px solid #444',
              }}
            >
              {tool}
            </div>
          ))}
        </div>
      </div>

      {/* Test Message */}
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Test Message</h3>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Tool</label>
          <select
            value={testTool}
            onChange={e => setTestTool(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '13px',
            }}
          >
            {tools.map(tool => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
            Payload (JSON)
          </label>
          <textarea
            value={testPayload}
            onChange={e => setTestPayload(e.target.value)}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '8px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '12px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>

        <button
          onClick={sendTestMessage}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#555' : '#8b5cf6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Sending...' : 'Send Test Message'}
        </button>

        {error && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: '#ff3333',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          marginBottom: '15px',
          display: 'flex',
          gap: '10px',
        }}
      >
        <input
          type="text"
          placeholder="Filter by tool..."
          value={filterTool}
          onChange={e => setFilterTool(e.target.value)}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '12px',
          }}
        />
        <input
          type="text"
          placeholder="Filter by source..."
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '12px',
          }}
        />
        <input
          type="text"
          placeholder="Filter by target..."
          value={filterTarget}
          onChange={e => setFilterTarget(e.target.value)}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '12px',
          }}
        />
      </div>

      {/* Message Stream */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
            Message Stream ({filteredMessages.length})
          </h3>
          <button
            onClick={() => setMessages([])}
            style={{
              padding: '4px 12px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            padding: '10px',
            overflowY: 'auto',
          }}
        >
          {filteredMessages.length === 0 ? (
            <div style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
              No messages yet. Send a test message to see it here.
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${msg.success ? '#10b981' : '#ef4444'}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#8b5cf6' }}>
                    {msg.tool}
                  </span>
                  <span style={{ fontSize: '11px', color: '#888' }}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>
                  {msg.sourceId} → {msg.targetId}
                </div>
                {msg.result && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      backgroundColor: '#0a0a0a',
                      padding: '8px',
                      borderRadius: '4px',
                      maxHeight: '150px',
                      overflowY: 'auto',
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(msg.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default McpRouterWidget;
