/**
 * LLM Chat Demo Component
 * 
 * Complete example showing how to use the Model Selector with DeepSeek and other providers
 */

import React, { useState } from 'react';
import { ModelSelector } from '../utils/ModelSelector';
import { getLLMProvider } from '../utils/llm-provider';
import type { LLMModel } from '../utils/llm-models';
import type { ChatMessage } from '../utils/llm-provider';
import './LLMChatDemo.css';

export function LLMChatDemo() {
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModelChange = (modelId: string, model: LLMModel) => {
    setSelectedModel(modelId);
    console.log('Selected model:', model);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const provider = getLLMProvider();
      
      const response = await provider.complete({
        model: selectedModel,
        messages: [...messages, userMessage],
        temperature: 0.7,
        maxTokens: 2000
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="llm-chat-demo">
      <div className="demo-header">
        <h1>🌊 Multi-LLM Chat Demo</h1>
        <p>Chat with DeepSeek, OpenAI, Claude, or Gemini</p>
      </div>

      <div className="demo-controls">
        <ModelSelector
          value={selectedModel}
          onChange={handleModelChange}
          onlyConfigured={true}
        />
        
        <button
          onClick={handleClear}
          className="clear-button"
          disabled={messages.length === 0}
        >
          🗑️ Clear Chat
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="chat-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Start a conversation</h3>
            <p>Select a model and type your message below</p>
          </div>
        ) : (
          <div className="messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                <div className="message-icon">
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-role">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="message-text">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message assistant loading">
                <div className="message-icon">🤖</div>
                <div className="message-content">
                  <div className="message-role">Assistant</div>
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          disabled={loading}
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="send-button"
        >
          {loading ? '⏳ Sending...' : '📤 Send'}
        </button>
      </div>

      <div className="demo-info">
        <strong>💡 Tips:</strong>
        <ul>
          <li>Add API keys to <code>.env</code> file</li>
          <li>DeepSeek is excellent for coding tasks</li>
          <li>Models with ⚠️ need API key configuration</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Simple Example - Minimal Implementation
 */
export function SimpleLLMExample() {
  const [model, setModel] = useState('deepseek-chat');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const provider = getLLMProvider();
      const result = await provider.complete({
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      setResponse(result.content);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Simple LLM Example</h2>
      
      <ModelSelector
        value={model}
        onChange={(id) => setModel(id)}
      />
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        style={{ width: '100%', marginTop: '16px', padding: '12px' }}
        rows={4}
      />
      
      <button
        onClick={handleSubmit}
        disabled={loading || !prompt.trim()}
        style={{ marginTop: '8px', padding: '10px 20px' }}
      >
        {loading ? 'Thinking...' : 'Submit'}
      </button>
      
      {response && (
        <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <strong>Response:</strong>
          <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{response}</p>
        </div>
      )}
    </div>
  );
}

export default LLMChatDemo;
