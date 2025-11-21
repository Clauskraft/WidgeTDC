/**
 * DeepSeek Test Page
 * 
 * Simple test page to verify DeepSeek integration works
 * 
 * To run: npm run dev
 * Then visit: http://localhost:5173/deepseek-test
 */

import React, { useState } from 'react';
import { getLLMProvider } from '../src/utils/llm-provider';

export function DeepSeekTestPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testDeepSeek = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      console.log('🧪 Testing DeepSeek API...');
      console.log('📤 Prompt:', prompt);

      const provider = getLLMProvider();
      
      // Check if DeepSeek is configured
      if (!provider.isProviderConfigured('deepseek')) {
        throw new Error('DeepSeek API key not found. Check your .env file.');
      }

      const result = await provider.complete({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        maxTokens: 1000
      });

      console.log('✅ Response received!');
      console.log('📥 Content:', result.content);
      console.log('📊 Tokens:', result.usage);

      setResponse(result.content);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '50px auto',
      padding: '30px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
        🌊 DeepSeek API Test
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Test your DeepSeek integration
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Ask DeepSeek anything:
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Explain React hooks in simple terms"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            minHeight: '100px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <button
        onClick={testDeepSeek}
        disabled={loading || !prompt.trim()}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          background: loading ? '#ccc' : '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {loading ? '⏳ Thinking...' : '🚀 Test DeepSeek'}
      </button>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c00'
        }}>
          <strong>❌ Error:</strong> {error}
          <br />
          <br />
          <strong>💡 Check:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Is DEEPSEEK_API_KEY in your .env file?</li>
            <li>Did you restart the dev server after adding the key?</li>
            <li>Is your API key valid?</li>
          </ul>
        </div>
      )}

      {response && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0, color: '#0369a1' }}>
            ✅ DeepSeek Response:
          </h3>
          <div style={{
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            color: '#0c4a6e'
          }}>
            {response}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '40px',
        padding: '20px',
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>📋 Status:</h3>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>✅ DeepSeek SDK installed</li>
          <li>✅ API Key configured in .env</li>
          <li>✅ Provider integration ready</li>
        </ul>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
          <strong>💡 Tip:</strong> Check browser console (F12) for detailed logs
        </p>
      </div>
    </div>
  );
}

export default DeepSeekTestPage;
