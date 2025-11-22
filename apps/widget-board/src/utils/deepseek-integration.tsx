/**
 * DeepSeek Integration Example for WidgetTDC
 * 
 * Dette eksempel viser hvordan du integrerer DeepSeek i dit projekt
 */

import { DeepSeekAPI } from './deepseek-stub';

// ============================================
// 1. Opsætning
// ============================================

const api = new DeepSeekAPI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'din-api-key-her',
  // Optional: baseURL hvis du bruger en custom endpoint
  // baseURL: 'https://api.deepseek.com/v1'
});

// ============================================
// 2. Basic Chat Completion
// ============================================

export async function basicChat(userMessage: string) {
  try {
    const response = await api.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
}

// ============================================
// 3. Chat med System Prompt
// ============================================

export async function chatWithSystem(
  systemPrompt: string,
  userMessage: string
) {
  const response = await api.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  });

  return response.choices[0].message.content;
}

// ============================================
// 4. Streaming Response
// ============================================

export async function streamingChat(
  userMessage: string,
  onChunk: (text: string) => void
) {
  const response = await api.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: userMessage }],
    stream: true
  });

  // Process stream
  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      onChunk(content);
    }
  }
}

// ============================================
// 5. Conversation History
// ============================================

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class DeepSeekConversation {
  private messages: Message[] = [];
  private api: DeepSeekAPI;

  constructor(systemPrompt?: string) {
    this.api = new DeepSeekAPI({
      apiKey: process.env.DEEPSEEK_API_KEY!
    });

    if (systemPrompt) {
      this.messages.push({ role: 'system', content: systemPrompt });
    }
  }

  async sendMessage(userMessage: string): Promise<string> {
    // Add user message
    this.messages.push({ role: 'user', content: userMessage });

    // Get response
    const response = await this.api.chat.completions.create({
      model: 'deepseek-chat',
      messages: this.messages,
      temperature: 0.7
    });

    const assistantMessage = response.choices[0].message.content;

    // Add assistant response to history
    this.messages.push({ role: 'assistant', content: assistantMessage });

    return assistantMessage;
  }

  getHistory(): Message[] {
    return [...this.messages];
  }

  clearHistory(keepSystem = true) {
    if (keepSystem && this.messages[0]?.role === 'system') {
      this.messages = [this.messages[0]];
    } else {
      this.messages = [];
    }
  }
}

// ============================================
// 6. React Hook til DeepSeek
// ============================================

import { useState, useCallback } from 'react';

export function useDeepSeek() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await basicChat(message);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading, error };
}

// ============================================
// 7. Eksempel Component (React)
// ============================================

export function DeepSeekChatWidget() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const { sendMessage, loading, error } = useDeepSeek();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const result = await sendMessage(input);
      setResponse(result);
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="deepseek-chat-widget">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Skriv din besked..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sender...' : 'Send'}
        </button>
      </form>

      {error && (
        <div className="error">
          Fejl: {error.message}
        </div>
      )}

      {response && (
        <div className="response">
          <strong>DeepSeek:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// 8. Test Functions
// ============================================

export async function testDeepSeekIntegration() {
  console.log('🧪 Testing DeepSeek Integration...\n');

  // Test 1: Basic Chat
  console.log('Test 1: Basic Chat');
  const response1 = await basicChat('Sig hej på dansk');
  console.log('Response:', response1);
  console.log('✅ Basic chat works!\n');

  // Test 2: System Prompt
  console.log('Test 2: System Prompt');
  const response2 = await chatWithSystem(
    'Du er en hjælpsom dansk assistent.',
    'Hvad er hovedstaden i Danmark?'
  );
  console.log('Response:', response2);
  console.log('✅ System prompt works!\n');

  // Test 3: Conversation
  console.log('Test 3: Conversation History');
  const conversation = new DeepSeekConversation(
    'Du er en dansk programmerings-assistent.'
  );

  const msg1 = await conversation.sendMessage('Hvad er TypeScript?');
  console.log('Q1:', msg1);

  const msg2 = await conversation.sendMessage('Kan du give et eksempel?');
  console.log('Q2:', msg2);
  console.log('✅ Conversation works!\n');

  console.log('🎉 All tests passed!');
}

// ============================================
// 9. Brug i Widget System
// ============================================

export interface DeepSeekWidgetConfig {
  apiKey: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export class DeepSeekWidget {
  private api: DeepSeekAPI;
  private config: DeepSeekWidgetConfig;
  private conversation: DeepSeekConversation;

  constructor(config: DeepSeekWidgetConfig) {
    this.config = config;
    this.api = new DeepSeekAPI({ apiKey: config.apiKey });
    this.conversation = new DeepSeekConversation(config.systemPrompt);
  }

  async processUserInput(input: string): Promise<string> {
    return this.conversation.sendMessage(input);
  }

  async analyzeData(data: any): Promise<string> {
    const prompt = `Analyser følgende data og giv insights:\n${JSON.stringify(data, null, 2)}`;
    return this.conversation.sendMessage(prompt);
  }

  reset() {
    this.conversation.clearHistory(true);
  }
}

// ============================================
// Eksport af alt
// ============================================

export default {
  basicChat,
  chatWithSystem,
  streamingChat,
  DeepSeekConversation,
  useDeepSeek,
  DeepSeekChatWidget,
  DeepSeekWidget,
  testDeepSeekIntegration
};
