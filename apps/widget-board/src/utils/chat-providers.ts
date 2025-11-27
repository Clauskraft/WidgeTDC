/**
 * Open Source Chat Providers
 * 
 * Simpel, selvstændig løsning uden kommercielle SDKs.
 * Understøtter Ollama (lokale modeller), OpenAI-kompatible endpoints, og cloud APIs.
 */

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatProvider {
    id: string;
    name: string;
    type: 'ollama' | 'openai-compatible' | 'anthropic' | 'deepseek';
    baseUrl: string;
    requiresApiKey: boolean;
    models: ChatModel[];
}

export interface ChatModel {
    id: string;
    name: string;
    providerId: string;
    description: string;
    contextWindow: number;
    isLocal: boolean;
    isOpenSource: boolean;
}

export interface ChatRequest {
    model: string;
    messages: ChatMessage[];
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
}

export interface ChatResponse {
    content: string;
    model: string;
    finishReason?: string;
}

// ============================================
// PROVIDERS CONFIGURATION
// ============================================

export const CHAT_PROVIDERS: ChatProvider[] = [
    {
        id: 'ollama',
        name: 'Ollama (Lokal)',
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        requiresApiKey: false,
        models: [
            { id: 'llama3.2', name: 'Llama 3.2 (8B)', providerId: 'ollama', description: 'Metas nyeste open source model', contextWindow: 128000, isLocal: true, isOpenSource: true },
            { id: 'llama3.1', name: 'Llama 3.1 (8B)', providerId: 'ollama', description: 'Kraftfuld open source model', contextWindow: 128000, isLocal: true, isOpenSource: true },
            { id: 'mistral', name: 'Mistral 7B', providerId: 'ollama', description: 'Effektiv fransk open source model', contextWindow: 32000, isLocal: true, isOpenSource: true },
            { id: 'mixtral', name: 'Mixtral 8x7B', providerId: 'ollama', description: 'Mixture of Experts model', contextWindow: 32000, isLocal: true, isOpenSource: true },
            { id: 'codellama', name: 'Code Llama', providerId: 'ollama', description: 'Specialiseret til kode', contextWindow: 16000, isLocal: true, isOpenSource: true },
            { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2', providerId: 'ollama', description: 'Kinesisk open source coder', contextWindow: 128000, isLocal: true, isOpenSource: true },
            { id: 'qwen2.5', name: 'Qwen 2.5 (7B)', providerId: 'ollama', description: 'Alibabas open source model', contextWindow: 128000, isLocal: true, isOpenSource: true },
            { id: 'gemma2', name: 'Gemma 2 (9B)', providerId: 'ollama', description: 'Googles open source model', contextWindow: 8000, isLocal: true, isOpenSource: true },
            { id: 'phi3', name: 'Phi-3 (3.8B)', providerId: 'ollama', description: 'Microsofts lille men kraftfulde model', contextWindow: 128000, isLocal: true, isOpenSource: true },
        ]
    },
    {
        id: 'lmstudio',
        name: 'LM Studio (Lokal)',
        type: 'openai-compatible',
        baseUrl: 'http://localhost:1234/v1',
        requiresApiKey: false,
        models: [
            { id: 'local-model', name: 'Lokal Model', providerId: 'lmstudio', description: 'Model fra LM Studio', contextWindow: 4096, isLocal: true, isOpenSource: true },
        ]
    },
    {
        id: 'localai',
        name: 'LocalAI',
        type: 'openai-compatible',
        baseUrl: 'http://localhost:8080/v1',
        requiresApiKey: false,
        models: [
            { id: 'gpt4all-j', name: 'GPT4All-J', providerId: 'localai', description: 'Open source GPT4All', contextWindow: 2048, isLocal: true, isOpenSource: true },
        ]
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        type: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        requiresApiKey: true,
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', providerId: 'deepseek', description: 'Kinesisk LLM, meget billig', contextWindow: 64000, isLocal: false, isOpenSource: false },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', providerId: 'deepseek', description: 'Specialiseret til kode', contextWindow: 64000, isLocal: false, isOpenSource: false },
        ]
    },
    {
        id: 'openrouter',
        name: 'OpenRouter (Multi-model)',
        type: 'openai-compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        requiresApiKey: true,
        models: [
            { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Gratis)', providerId: 'openrouter', description: 'Gratis open source model', contextWindow: 128000, isLocal: false, isOpenSource: true },
            { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Gratis)', providerId: 'openrouter', description: 'Gratis Mistral model', contextWindow: 32000, isLocal: false, isOpenSource: true },
            { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Gratis)', providerId: 'openrouter', description: 'Gratis Google model', contextWindow: 8000, isLocal: false, isOpenSource: true },
        ]
    },
];

// ============================================
// CHAT COMPLETION FUNCTIONS
// ============================================

/**
 * Send chat til Ollama
 */
async function chatWithOllama(
    baseUrl: string,
    model: string,
    messages: ChatMessage[],
    stream: boolean = false
): Promise<ChatResponse> {
    const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages,
            stream,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama fejl: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
        content: data.message?.content || '',
        model: data.model,
        finishReason: data.done ? 'stop' : undefined,
    };
}

/**
 * Send chat til OpenAI-kompatibel endpoint (LM Studio, LocalAI, OpenRouter, etc.)
 */
async function chatWithOpenAICompatible(
    baseUrl: string,
    model: string,
    messages: ChatMessage[],
    apiKey?: string
): Promise<ChatResponse> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API fejl: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        finishReason: data.choices?.[0]?.finish_reason,
    };
}

/**
 * Send chat til DeepSeek
 */
async function chatWithDeepSeek(
    model: string,
    messages: ChatMessage[],
    apiKey: string
): Promise<ChatResponse> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek fejl: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        finishReason: data.choices?.[0]?.finish_reason,
    };
}

/**
 * Send chat til Anthropic (Claude)
 */
async function chatWithAnthropic(
    model: string,
    messages: ChatMessage[],
    apiKey: string
): Promise<ChatResponse> {
    // Konverter messages til Anthropic format
    const anthropicMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));
    
    const systemMessage = messages.find(m => m.role === 'system')?.content;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 4096,
            messages: anthropicMessages,
            ...(systemMessage && { system: systemMessage }),
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic fejl: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
        content: data.content?.[0]?.text || '',
        model: data.model,
        finishReason: data.stop_reason,
    };
}

// ============================================
// UNIFIED CHAT FUNCTION
// ============================================

export interface ChatConfig {
    providerId: string;
    modelId: string;
    apiKey?: string;
}

/**
 * Unified chat funktion der håndterer alle providers
 */
export async function sendChat(
    config: ChatConfig,
    messages: ChatMessage[]
): Promise<ChatResponse> {
    const provider = CHAT_PROVIDERS.find(p => p.id === config.providerId);
    
    if (!provider) {
        throw new Error(`Ukendt provider: ${config.providerId}`);
    }

    if (provider.requiresApiKey && !config.apiKey) {
        throw new Error(`${provider.name} kræver en API nøgle`);
    }

    switch (provider.type) {
        case 'ollama':
            return chatWithOllama(provider.baseUrl, config.modelId, messages);
        
        case 'openai-compatible':
            return chatWithOpenAICompatible(provider.baseUrl, config.modelId, messages, config.apiKey);
        
        case 'deepseek':
            return chatWithDeepSeek(config.modelId, messages, config.apiKey!);
        
        case 'anthropic':
            return chatWithAnthropic(config.modelId, messages, config.apiKey!);
        
        default:
            throw new Error(`Ukendt provider type: ${provider.type}`);
    }
}

/**
 * Check om Ollama kører lokalt
 */
export async function checkOllamaStatus(): Promise<{ running: boolean; models: string[] }> {
    try {
        const response = await fetch('http://localhost:11434/api/tags', {
            method: 'GET',
            signal: AbortSignal.timeout(2000),
        });
        
        if (response.ok) {
            const data = await response.json();
            const models = data.models?.map((m: any) => m.name) || [];
            return { running: true, models };
        }
        return { running: false, models: [] };
    } catch {
        return { running: false, models: [] };
    }
}

/**
 * Hent alle tilgængelige modeller
 */
export function getAllModels(): ChatModel[] {
    return CHAT_PROVIDERS.flatMap(p => p.models);
}

/**
 * Hent provider og model info
 */
export function getModelInfo(modelId: string): { provider: ChatProvider; model: ChatModel } | null {
    for (const provider of CHAT_PROVIDERS) {
        const model = provider.models.find(m => m.id === modelId);
        if (model) {
            return { provider, model };
        }
    }
    return null;
}

