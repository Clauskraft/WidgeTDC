/**
 * LLM Provider Configuration
 * 
 * Central configuration for all LLM providers in WidgetTDC
 */

export interface LLMModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  description: string;
  contextWindow: number;
  pricing?: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  capabilities: string[];
}

export const LLM_MODELS: LLMModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Most capable GPT-4 model for complex tasks',
    contextWindow: 128000,
    pricing: { input: 10, output: 30 },
    capabilities: ['chat', 'code', 'vision', 'function-calling']
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and efficient for simpler tasks',
    contextWindow: 16384,
    pricing: { input: 0.5, output: 1.5 },
    capabilities: ['chat', 'code', 'function-calling']
  },

  // Anthropic Models
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Most intelligent Claude model',
    contextWindow: 200000,
    pricing: { input: 3, output: 15 },
    capabilities: ['chat', 'code', 'vision', 'analysis']
  },
  {
    id: 'claude-sonnet-3-5-20241022',
    name: 'Claude Sonnet 3.5 (Thinking)',
    provider: 'anthropic',
    description: 'Claude with extended thinking capabilities',
    contextWindow: 200000,
    pricing: { input: 3, output: 15 },
    capabilities: ['chat', 'code', 'reasoning']
  },

  // Google Models
  {
    id: 'gemini-pro',
    name: 'Gemini 3 Pro (High)',
    provider: 'google',
    description: 'Google\'s most capable model',
    contextWindow: 1000000,
    pricing: { input: 1.25, output: 5 },
    capabilities: ['chat', 'code', 'vision', 'multimodal']
  },
  {
    id: 'gemini-pro-low',
    name: 'Gemini 3 Pro (Low)',
    provider: 'google',
    description: 'Cost-effective Gemini variant',
    contextWindow: 1000000,
    pricing: { input: 0.075, output: 0.3 },
    capabilities: ['chat', 'code']
  },

  // DeepSeek Models ⭐ NY!
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    description: 'High-performance Chinese LLM with excellent coding capabilities',
    contextWindow: 64000,
    pricing: { input: 0.27, output: 1.1 },
    capabilities: ['chat', 'code', 'reasoning', 'multilingual']
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'deepseek',
    description: 'Specialized model for code generation and analysis',
    contextWindow: 64000,
    pricing: { input: 0.27, output: 1.1 },
    capabilities: ['code', 'debugging', 'refactoring']
  }
];

/**
 * Get model by ID
 */
export function getModelById(id: string): LLMModel | undefined {
  return LLM_MODELS.find(m => m.id === id);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: string): LLMModel[] {
  return LLM_MODELS.filter(m => m.provider === provider);
}

/**
 * Get models by capability
 */
export function getModelsByCapability(capability: string): LLMModel[] {
  return LLM_MODELS.filter(m => m.capabilities.includes(capability));
}

/**
 * Get default model for provider
 */
export function getDefaultModel(provider: string): LLMModel | undefined {
  const models = getModelsByProvider(provider);
  return models[0]; // Return first model as default
}
