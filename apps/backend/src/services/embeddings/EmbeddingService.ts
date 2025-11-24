import { logger } from '../../utils/logger.js';

export interface EmbeddingProvider {
    name: string;
    dimensions: number;
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}

/**
 * HuggingFace Embeddings Provider
 * Uses HuggingFace Inference API
 */
class HuggingFaceEmbeddingsProvider implements EmbeddingProvider {
    name = 'huggingface';
    dimensions = 768;
    private apiKey: string;
    private model = 'sentence-transformers/all-MiniLM-L6-v2';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || '';
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.apiKey) {
            throw new Error('HuggingFace API key not configured');
        }

        const response = await fetch(
            `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: text }),
            }
        );

        if (!response.ok) {
            throw new Error(`HuggingFace API error: ${response.statusText}`);
        }

        const embedding = await response.json();
        return embedding;
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const embeddings = await Promise.all(texts.map(t => this.generateEmbedding(t)));
        return embeddings;
    }
}

/**
 * OpenAI Embeddings Provider
 * Uses OpenAI Embeddings API
 */
class OpenAIEmbeddingsProvider implements EmbeddingProvider {
    name = 'openai';
    dimensions = 1536;
    private apiKey: string;
    private model = 'text-embedding-3-small';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                input: text,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                input: texts,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data.map((item: any) => item.embedding);
    }
}

/**
 * Local Transformers.js Provider (Fallback)
 * Uses browser-compatible ML models
 */
class TransformersEmbeddingsProvider implements EmbeddingProvider {
    name = 'transformers';
    dimensions = 384;
    private isInitialized = false;
    private pipeline: any;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Dynamic import to avoid bundling issues
            const { pipeline } = await import('@xenova/transformers');
            this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            this.isInitialized = true;
            logger.info('✅ Local Transformers.js embeddings initialized');
        } catch (error: any) {
            logger.warn('⚠️  Transformers.js not available:', error.message);
            throw error;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const embeddings = await Promise.all(texts.map(t => this.generateEmbedding(t)));
        return embeddings;
    }
}

/**
 * Unified Embedding Service
 * Auto-selects best available provider
 */
export class EmbeddingService {
    private provider: EmbeddingProvider | null = null;
    private preferredProvider: string;

    constructor(preferredProvider?: string) {
        this.preferredProvider = preferredProvider || process.env.EMBEDDING_PROVIDER || 'auto';
    }

    async initialize(): Promise<void> {
        if (this.provider) return;

        // Try providers in order of preference
        const providers: Array<{ name: string; factory: () => EmbeddingProvider }> = [
            { name: 'openai', factory: () => new OpenAIEmbeddingsProvider() },
            { name: 'huggingface', factory: () => new HuggingFaceEmbeddingsProvider() },
            { name: 'transformers', factory: () => new TransformersEmbeddingsProvider() },
        ];

        // If specific provider requested, try it first
        if (this.preferredProvider !== 'auto') {
            const preferred = providers.find(p => p.name === this.preferredProvider);
            if (preferred) {
                providers.unshift(preferred);
            }
        }

        for (const { name, factory } of providers) {
            try {
                const provider = factory();

                // Test the provider
                if (provider instanceof TransformersEmbeddingsProvider) {
                    await provider.initialize();
                } else {
                    // Quick test with small text
                    await provider.generateEmbedding('test');
                }

                this.provider = provider;
                logger.info(`🧠 Embedding provider initialized: ${name} (${provider.dimensions}D)`);
                return;
            } catch (error: any) {
                logger.warn(`⚠️  ${name} embeddings not available: ${error.message}`);
            }
        }

        throw new Error('No embedding provider available. Please configure API keys or install @xenova/transformers.');
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.provider) {
            await this.initialize();
        }
        return this.provider!.generateEmbedding(text);
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        if (!this.provider) {
            await this.initialize();
        }
        return this.provider!.generateEmbeddings(texts);
    }

    getDimensions(): number {
        if (!this.provider) {
            throw new Error('Embedding service not initialized');
        }
        return this.provider.dimensions;
    }

    getProviderName(): string {
        if (!this.provider) {
            throw new Error('Embedding service not initialized');
        }
        return this.provider.name;
    }
}

// Singleton instance
let embeddingServiceInstance: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
    if (!embeddingServiceInstance) {
        embeddingServiceInstance = new EmbeddingService();
    }
    return embeddingServiceInstance;
}
