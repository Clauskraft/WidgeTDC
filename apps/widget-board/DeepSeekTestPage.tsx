/**
 * DeepSeek Test Page
 * 
 * Simple test page to verify DeepSeek integration works
 * 
 * To run: npm run dev
 * Then visit: http://localhost:5173/deepseek-test
 */

import React, { useState } from 'react';
import { getLLMProvider } from './src/utils/llm-provider';

import { MainLayout } from './src/components/MainLayout';

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
    <MainLayout title="DeepSeek API Test">
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '30px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e5e7eb' // Light gray text for dark mode
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#fff' }}>
          🌊 DeepSeek API Test
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '30px' }}>
          Test your DeepSeek integration
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#d1d5db'
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
              border: '1px solid #374151',
              minHeight: '100px',
              fontFamily: 'inherit',
              background: '#1f2937',
              color: '#fff'
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
            background: loading ? '#4b5563' : '#3b82f6',
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
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#fca5a5'
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
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0, color: '#60a5fa' }}>
              ✅ DeepSeek Response:
            </h3>
            <div style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              color: '#d1d5db'
            }}>
              {response}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '8px',
          color: '#fcd34d'
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
    </MainLayout>
  );
}

export default DeepSeekTestPage;
