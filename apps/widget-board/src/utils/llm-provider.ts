/**
 * Unified LLM Provider
 * 
 * Single interface for all LLM providers (OpenAI, Anthropic, Google, DeepSeek)
 * NOW SECURED: Proxies all requests through the backend to avoid exposing API keys.
 */

import type { LLMModel } from './llm-models';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Unified LLM Provider Class
 * 
 * Provides a single interface for all LLM providers via Backend Proxy
 */
export class UnifiedLLMProvider {

  constructor(config?: any) {
    // Config is no longer needed as keys are in backend
  }

  /**
   * Complete a chat using any provider via Backend Proxy
   */
  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch('/api/ai/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('LLM Proxy Error:', error);
      throw error;
    }
  }

  /**
   * Check if a provider is configured
   * (Optimistically return true as backend handles configuration)
   */
  isProviderConfigured(provider: string): boolean {
    return true;
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): string[] {
    return ['openai', 'anthropic', 'google', 'deepseek'];
  }
}

/**
 * Create a global LLM provider instance
 */
export function createLLMProvider(): UnifiedLLMProvider {
  return new UnifiedLLMProvider();
}

// Singleton instance
let globalProvider: UnifiedLLMProvider | null = null;

/**
 * Get or create the global LLM provider
 */
export function getLLMProvider(): UnifiedLLMProvider {
  if (!globalProvider) {
    globalProvider = createLLMProvider();
  }
  return globalProvider;
}
