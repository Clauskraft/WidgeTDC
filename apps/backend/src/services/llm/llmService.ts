import OpenAI from 'openai';

export interface LlmServiceConfig {
  apiKey: string;
  model?: string;
}

export class LlmService {
  private client: OpenAI;
  private model: string;

  constructor(config: LlmServiceConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'gpt-5.1-preview';
  }

  async generateResponse(prompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide clear, concise, and accurate responses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  }

  async generateContextualResponse(
    systemContext: string,
    userQuery: string,
    additionalContext?: string
  ): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemContext,
      },
    ];

    if (additionalContext) {
      messages.push({
        role: 'system',
        content: `Additional context:\n${additionalContext}`,
      });
    }

    messages.push({
      role: 'user',
      content: userQuery,
    });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  }
}

// Singleton instance
let llmServiceInstance: LlmService | null = null;

export function getLlmService(): LlmService {
  if (!llmServiceInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    llmServiceInstance = new LlmService({
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-5.1-preview',
    });
  }
  return llmServiceInstance;
}
