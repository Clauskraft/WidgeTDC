import OpenAI from 'openai';
// DeepSeek uses OpenAI-compatible API, no separate stub needed
// Google Generative AI imported dynamically to avoid issues if package is missing
// CODEX SYMBIOSIS: The system's conscience
import { CODEX_SYSTEM_PROMPT, CODEX_VERSION } from '../../config/codex.js';
export class LlmService {
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
    getProvider(model) {
        if (model.startsWith('gpt-') || model.startsWith('o1-'))
            return 'openai';
        if (model.startsWith('gemini-'))
            return 'google';
        if (model.startsWith('deepseek-'))
            return 'deepseek';
        if (model.startsWith('claude-'))
            return 'anthropic';
        return 'openai'; // Default
    }
    /**
     * CODEX-ENHANCED COMPLETION
     * All LLM calls now pass through the Codex filter.
     * The system's conscience is injected as the FIRST system message.
     */
    async complete(options) {
        const provider = this.getProvider(options.model);
        // CODEX INJECTION: Prepend the system's conscience to all messages
        // This ensures every AI response adheres to our ethical framework
        const codexEnhancedMessages = this.injectCodex(options.messages);
        const enhancedOptions = {
            ...options,
            messages: codexEnhancedMessages
        };
        try {
            switch (provider) {
                case 'openai':
                    return await this.completeOpenAI(enhancedOptions);
                case 'deepseek':
                    return await this.completeDeepSeek(enhancedOptions);
                case 'google':
                    return await this.completeGoogle(enhancedOptions);
                default:
                    throw new Error(`Provider ${provider} not supported yet`);
            }
        }
        catch (error) {
            // Fallback to mock if key is missing or API fails
            if (error.message.includes('API key not configured') || error.message.includes('not configured')) {
                console.warn(`⚠️ LLM Provider ${provider} not configured. Using mock response.`);
                return this.completeMock(enhancedOptions);
            }
            throw error;
        }
    }
    /**
     * CODEX INJECTION
     * Injects the Codex system prompt as the FIRST message,
     * ensuring it has the highest priority in the AI's decision-making.
     */
    injectCodex(messages) {
        // Check if Codex is already injected (avoid double injection)
        const hasCodex = messages.some(m => m.role === 'system' && m.content.includes('CODEX SYMBIOSIS'));
        if (hasCodex) {
            return messages;
        }
        // Inject Codex as the FIRST system message
        console.log(`🧬 [CODEX v${CODEX_VERSION}] Injecting symbiosis protocol...`);
        return [
            { role: 'system', content: CODEX_SYSTEM_PROMPT },
            ...messages
        ];
    }
    completeMock(options) {
        const lastMsg = options.messages[options.messages.length - 1];
        return {
            content: `[MOCK RESPONSE] I received your message: "${lastMsg?.content || '...'}". \n\n(No LLM API key configured. Please set OPENAI_API_KEY, DEEPSEEK_API_KEY, or GOOGLE_API_KEY in .env)`,
            model: 'mock-model',
            usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
            }
        };
    }
    async completeOpenAI(options) {
        if (!this.openai)
            throw new Error('OpenAI API key not configured');
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
    async completeDeepSeek(options) {
        if (!this.deepseek)
            throw new Error('DeepSeek API key not configured');
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
    async completeGoogle(options) {
        if (!this.googleKey)
            throw new Error('Google API key not configured');
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
            history: history,
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
    async generateResponse(prompt) {
        const res = await this.complete({
            model: 'gpt-4o', // Default to a strong model
            messages: [{ role: 'user', content: prompt }]
        });
        return res.content;
    }
    async generateContextualResponse(systemContext, userQuery, additionalContext, model) {
        const messages = [{ role: 'system', content: systemContext }];
        if (additionalContext) {
            messages.push({ role: 'system', content: `Additional Context: ${additionalContext}` });
        }
        messages.push({ role: 'user', content: userQuery });
        const res = await this.complete({
            model: model || 'gpt-4o',
            messages
        });
        return res.content;
    }
    async transcribeAudio(audioData, mimeType) {
        // Mock implementation for now as we don't have audio setup
        console.log(`[LlmService] Transcribing audio (${audioData.length} bytes, ${mimeType})`);
        return "Audio transcription not yet implemented. This is a placeholder.";
    }
    async analyzeImage(imageData, mimeType, prompt) {
        if (this.googleKey) {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(this.googleKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const imagePart = {
                    inlineData: {
                        data: imageData.toString('base64'),
                        mimeType
                    }
                };
                const result = await model.generateContent([prompt, imagePart]);
                const response = await result.response;
                return response.text();
            }
            catch (e) {
                console.error('Gemini image analysis failed:', e);
            }
        }
        return `[Mock Image Analysis] I see an image of size ${imageData.length} bytes. (Configure GOOGLE_API_KEY for real analysis)`;
    }
}
// Singleton instance
let llmServiceInstance = null;
export function getLlmService() {
    if (!llmServiceInstance) {
        llmServiceInstance = new LlmService();
    }
    return llmServiceInstance;
}
