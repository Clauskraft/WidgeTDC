/**
 * Unified LLM Provider
 * 
 * Single interface for all LLM providers (OpenAI, Anthropic, Google, DeepSeek)
 */

import { DeepSeekAPI } from './deepseek-stub';
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
 * Provides a single interface for all LLM providers
 */
export class UnifiedLLMProvider {
  private openaiApiKey?: string;
  private anthropicApiKey?: string;
  private googleApiKey?: string;
  private deepseekApiKey?: string;

  private deepseekClient?: DeepSeekAPI;

  constructor(config: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    googleApiKey?: string;
    deepseekApiKey?: string;
  }) {
    this.openaiApiKey = config.openaiApiKey;
    this.anthropicApiKey = config.anthropicApiKey;
    this.googleApiKey = config.googleApiKey;
    this.deepseekApiKey = config.deepseekApiKey;

    // Initialize DeepSeek client if API key is provided
    if (this.deepseekApiKey) {
      this.deepseekClient = new DeepSeekAPI({
        apiKey: this.deepseekApiKey
      });
    }
  }

  /**
   * Complete a chat using any provider
   */
  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const provider = this.getProviderFromModel(options.model);

    switch (provider) {
      case 'openai':
        return this.completeOpenAI(options);
      case 'anthropic':
        return this.completeAnthropic(options);
      case 'google':
        return this.completeGoogle(options);
      case 'deepseek':
        return this.completeDeepSeek(options);
      default:
        throw new Error(`Unsupported provider for model: ${options.model}`);
    }
  }

  /**
   * Complete using DeepSeek
   */
  private async completeDeepSeek(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.deepseekClient) {
      throw new Error('DeepSeek API key not configured');
    }

    try {
      const response = await this.deepseekClient.chat.completions.create({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        stream: false
      });

      return {
        content: response.choices[0].message.content,
        model: options.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0
        }
      };
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete using OpenAI (placeholder)
   */
  private async completeOpenAI(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // TODO: Implement OpenAI integration
    throw new Error('OpenAI integration not yet implemented');
  }

  /**
   * Complete using Anthropic (placeholder)
   */
  private async completeAnthropic(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // TODO: Implement Anthropic integration
    throw new Error('Anthropic integration not yet implemented');
  }

  /**
   * Complete using Google (placeholder)
   */
  private async completeGoogle(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.googleApiKey) {
      throw new Error('Google API key not configured');
    }

    // TODO: Implement Google integration
    throw new Error('Google integration not yet implemented');
  }

  /**
   * Get provider name from model ID
   */
  private getProviderFromModel(model: string): string {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('gemini-')) return 'google';
    if (model.startsWith('deepseek-')) return 'deepseek';

    throw new Error(`Unknown model: ${model}`);
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: string): boolean {
    switch (provider) {
      case 'openai':
        return !!this.openaiApiKey;
      case 'anthropic':
        return !!this.anthropicApiKey;
      case 'google':
        return !!this.googleApiKey;
      case 'deepseek':
        return !!this.deepseekApiKey;
      default:
        return false;
    }
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): string[] {
    const providers: string[] = [];
    if (this.openaiApiKey) providers.push('openai');
    if (this.anthropicApiKey) providers.push('anthropic');
    if (this.googleApiKey) providers.push('google');
    if (this.deepseekApiKey) providers.push('deepseek');
    return providers;
  }
}

/**
 * Create a global LLM provider instance
 */
export function createLLMProvider(): UnifiedLLMProvider {
  return new UnifiedLLMProvider({
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
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
