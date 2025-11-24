import React, { useState } from 'react';
import { useMcpEvent } from '../hooks/useMcpEvent';
import { MCPEventType } from '../../mcp/MCPTypes';

interface AgentChatWidgetProps {
  id: string;
  onClose?: () => void;
}

export const AgentChatWidget: React.FC<AgentChatWidgetProps> = ({ id, onClose }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useMcpEvent(MCPEventType.DATA_REQUEST, async (data) => {
    console.log('Received data request:', data);
    setMessages(prev => [...prev, { role: 'assistant', content: `Processing: ${data.query}` }]);
  });

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Simulate API call
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Response to: ${userMessage}` 
        }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="agent-chat-widget">
      <div className="chat-header">
        <h3>Agent Chat</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">Thinking...</div>}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
      
      <style jsx>{`
        .agent-chat-widget {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f5f5f5;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #2563eb;
          color: white;
        }
        
        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        
        .message {
          margin-bottom: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          background: white;
        }
        
        .message.assistant {
          background: #e3f2fd;
        }
        
        .loading {
          color: #666;
          font-style: italic;
        }
        
        .chat-input {
          display: flex;
          padding: 12px;
          background: white;
          border-top: 1px solid #ddd;
        }
        
        .chat-input input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-right: 8px;
        }
        
        .chat-input button {
          padding: 8px 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AgentChatWidget;