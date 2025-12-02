/**
 * GeminiService - WidgeTDC's Neural Core
 * =====================================
 * Native Google Gemini integration for Docker-compatible AI operations.
 * This replaces CLI-based AI calls with direct API access.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
export class GeminiService {
    constructor() {
        this.initialized = false;
        this.defaultConfig = {
            model: 'gemini-2.0-flash',
            temperature: 0.7,
            maxOutputTokens: 4096
        };
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not found - AI features will be disabled');
            this.initialized = false;
            return;
        }
        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: this.defaultConfig.model,
                generationConfig: {
                    temperature: this.defaultConfig.temperature,
                    maxOutputTokens: this.defaultConfig.maxOutputTokens
                }
            });
            this.initialized = true;
            console.log('🧠 Gemini Service Initialized (Model: gemini-2.0-flash)');
        }
        catch (error) {
            console.error('❌ Failed to initialize Gemini:', error);
            this.initialized = false;
        }
    }
    /**
     * Check if the service is ready
     */
    isReady() {
        return this.initialized;
    }
    /**
     * Generate a thought/response from Gemini
     */
    async generateThought(prompt) {
        if (!this.initialized) {
            return '[NEURAL OFFLINE]: Gemini service not initialized. Check GEMINI_API_KEY.';
        }
        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            return text;
        }
        catch (error) {
            console.error('🔴 Gemini Error:', error);
            return `[NEURAL FAILURE]: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    /**
     * Advanced thinking with context and system instructions
     */
    async think(request) {
        if (!this.initialized) {
            return '[NEURAL OFFLINE]: Gemini service not initialized.';
        }
        try {
            let fullPrompt = '';
            if (request.systemInstruction) {
                fullPrompt += `System: ${request.systemInstruction}\n\n`;
            }
            if (request.context) {
                fullPrompt += `Context:\n${request.context}\n\n`;
            }
            fullPrompt += `User: ${request.prompt}`;
            const result = await this.model.generateContent(fullPrompt);
            return result.response.text();
        }
        catch (error) {
            console.error('🔴 Gemini Think Error:', error);
            return `[NEURAL FAILURE]: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    /**
     * MCP Handler wrapper - allows Agents to call Gemini via MCP protocol
     */
    async handleMcpRequest(args) {
        console.log(`🤖 MCP AI Request: "${args.prompt.substring(0, 60)}..."`);
        const response = await this.think({
            prompt: args.prompt,
            context: args.context,
            systemInstruction: args.systemInstruction
        });
        return {
            success: !response.startsWith('[NEURAL'),
            response,
            model: this.defaultConfig.model
        };
    }
    /**
     * Analyze data with AI
     */
    async analyze(data, question) {
        const prompt = `
Analyze the following data and answer the question.

DATA:
${JSON.stringify(data, null, 2)}

QUESTION: ${question}

Provide a clear, concise analysis.
`;
        return this.generateThought(prompt);
    }
    /**
     * Summarize text content
     */
    async summarize(content, maxLength) {
        const lengthInstruction = maxLength
            ? `Keep the summary under ${maxLength} characters.`
            : 'Provide a comprehensive summary.';
        const prompt = `
Summarize the following content. ${lengthInstruction}

CONTENT:
${content}

SUMMARY:
`;
        return this.generateThought(prompt);
    }
    /**
     * Extract structured data from text
     */
    async extractStructured(text, schema) {
        const prompt = `
Extract structured data from the following text according to the schema.
Return ONLY valid JSON matching the schema.

SCHEMA:
${JSON.stringify(schema, null, 2)}

TEXT:
${text}

JSON OUTPUT:
`;
        return this.generateThought(prompt);
    }
}
// Export singleton instance
let geminiServiceInstance = null;
export function getGeminiService() {
    if (!geminiServiceInstance) {
        geminiServiceInstance = new GeminiService();
    }
    return geminiServiceInstance;
}
export const geminiService = new GeminiService();
