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
    type: 'ollama' | 'openai-compatible' | 'anthropic' | 'deepseek' | 'google' | 'groq';
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
    isReasoning?: boolean;
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
        id: 'deepseek',
        name: 'DeepSeek (Primær)',
        type: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        requiresApiKey: true,
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', providerId: 'deepseek', description: '🏆 Kodning, debugging, teknisk', contextWindow: 64000, isLocal: false, isOpenSource: false },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', providerId: 'deepseek', description: 'Kompleks analyse, arkitektur', contextWindow: 64000, isLocal: false, isOpenSource: false, isReasoning: true },
        ]
    },
    {
        id: 'groq',
        name: 'Groq (Hurtig)',
        type: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        requiresApiKey: true,
        models: [
            { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', providerId: 'groq', description: 'Quick spørgsmål, hurtig feedback', contextWindow: 128000, isLocal: false, isOpenSource: true },
        ]
    },
    {
        id: 'google',
        name: 'Google Gemini',
        type: 'google',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        requiresApiKey: true,
        models: [
            { id: 'gemini-3-pro', name: 'Gemini 3 Pro', providerId: 'google', description: 'Google integration, multimodal', contextWindow: 1000000, isLocal: false, isOpenSource: false },
        ]
    },
    {
        id: 'ollama',
        name: 'Ollama (Backup/Offline)',
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        requiresApiKey: false,
        models: [
            { id: 'qwen2.5:3b', name: 'Qwen 2.5 (3B)', providerId: 'ollama', description: 'Nødsituation, fly/tog', contextWindow: 32000, isLocal: true, isOpenSource: true },
            // Beholder andre almindelige modeller som fallback hvis brugeren har dem
            { id: 'llama3.2', name: 'Llama 3.2 (8B)', providerId: 'ollama', description: 'Alternativ lokal model', contextWindow: 128000, isLocal: true, isOpenSource: true },
            { id: 'mistral', name: 'Mistral 7B', providerId: 'ollama', description: 'Alternativ lokal model', contextWindow: 32000, isLocal: true, isOpenSource: true },
        ]
    },
    {
        id: 'nexa',
        name: 'Nexa NPU (Eksperimentelt)',
        type: 'openai-compatible',
        baseUrl: 'http://localhost:8080/v1', // Placeholder for local NPU server
        requiresApiKey: false,
        models: [
            { id: 'nexa-npu', name: 'NPU Accelerated', providerId: 'nexa', description: '⏳ Afventer NPU-modenhed (6-12 mdr)', contextWindow: 4096, isLocal: true, isOpenSource: true },
        ]
    }
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
 * Send chat til OpenAI-kompatibel endpoint (Groq, LM Studio, etc.)
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
 * Send chat til Google Gemini (via REST API)
 */
async function chatWithGoogle(
    model: string,
    messages: ChatMessage[],
    apiKey: string
): Promise<ChatResponse> {
    // Konverter messages til Gemini format
    const contents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents,
            generationConfig: {
                maxOutputTokens: 4096,
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google fejl: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model: model,
        finishReason: data.candidates?.[0]?.finishReason,
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

    // Check API key for non-local providers
    if (provider.requiresApiKey && !config.apiKey) {
        throw new Error(`${provider.name} kræver en API nøgle`);
    }

    switch (provider.type) {
        case 'ollama':
            return chatWithOllama(provider.baseUrl, config.modelId, messages);
        
        case 'openai-compatible':
        case 'groq':
            return chatWithOpenAICompatible(provider.baseUrl, config.modelId, messages, config.apiKey);
        
        case 'deepseek':
            return chatWithDeepSeek(config.modelId, messages, config.apiKey!);
        
        case 'google':
            return chatWithGoogle(config.modelId, messages, config.apiKey!);
        
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
