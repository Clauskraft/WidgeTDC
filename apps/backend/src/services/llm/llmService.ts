import OpenAI from 'openai';
import { DeepSeekAPI } from '../../utils/deepseek-stub.js'; // We might need to create this or use the sdk if available
// import { GoogleGenerativeAI } from '@google/generative-ai'; // Using dynamic import or assuming it's available

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

export class LlmService {
  private openai?: OpenAI;
  private deepseek?: any; // DeepSeekAPI
  private googleKey?: string;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.DEEPSEEK_API_KEY) {
      // Initialize DeepSeek if SDK is available, otherwise we might need a fetch implementation
      // For now, we'll assume the simple OpenAI-compatible usage or the stub
      this.deepseek = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com'
      });
    }
    this.googleKey = process.env.GOOGLE_API_KEY;
  }

  private getProvider(model: string): 'openai' | 'google' | 'deepseek' | 'anthropic' {
    if (model.startsWith('gpt-') || model.startsWith('o1-')) return 'openai';
    if (model.startsWith('gemini-')) return 'google';
    if (model.startsWith('deepseek-')) return 'deepseek';
    if (model.startsWith('claude-')) return 'anthropic';
    return 'openai'; // Default
  }

  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const provider = this.getProvider(options.model);

    switch (provider) {
      case 'openai':
        return this.completeOpenAI(options);
      case 'deepseek':
        return this.completeDeepSeek(options);
      case 'google':
        return this.completeGoogle(options);
      default:
        throw new Error(`Provider ${provider} not supported yet`);
    }
  }

  private async completeOpenAI(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.openai) throw new Error('OpenAI API key not configured');

    const response = await this.openai.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  }

  private async completeDeepSeek(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.deepseek) throw new Error('DeepSeek API key not configured');

    // DeepSeek is OpenAI compatible
    const response = await this.deepseek.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  }

  private async completeGoogle(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.googleKey) throw new Error('Google API key not configured');

    // Validate messages array is not empty
    if (!options.messages || options.messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    // Dynamic import to avoid issues if package is missing
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.googleKey);
    const model = genAI.getGenerativeModel({ model: options.model });

    // Convert messages to Google format
    // Note: Google's history format is slightly different, simplified here
    const lastMessage = options.messages[options.messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      throw new Error('Last message must have content');
    }

    const history = options.messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({
      history: history as any,
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
      },
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      model: options.model,
      usage: {
        promptTokens: 0, // Google doesn't always return usage in simple call
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  // Legacy method support for existing code
  async generateResponse(prompt: string): Promise<string> {
    const res = await this.complete({
      model: 'gpt-4o', // Default to a strong model
      messages: [{ role: 'user', content: prompt }]
    });
    return res.content;
  }

  async generateContextualResponse(systemContext: string, userQuery: string, additionalContext?: string): Promise<string> {
    const messages: ChatMessage[] = [{ role: 'system', content: systemContext }];
    if (additionalContext) {
      messages.push({ role: 'system', content: `Additional Context: ${additionalContext}` });
    }
    messages.push({ role: 'user', content: userQuery });

    const res = await this.complete({
      model: 'gpt-4o',
      messages
    });
    return res.content;
  }
}

// Singleton instance
let llmServiceInstance: LlmService | null = null;

export function getLlmService(): LlmService {
  if (!llmServiceInstance) {
    llmServiceInstance = new LlmService();
  }
  return llmServiceInstance;
}
