/**
 * Transformers.js Embeddings Service
 *
 * Uses @xenova/transformers to generate embeddings locally without HuggingFace API.
 * Supports sentence-transformers models for semantic similarity.
 */
import { pipeline } from '@xenova/transformers';
export class TransformersEmbeddings {
    constructor(modelName = 'Xenova/all-MiniLM-L6-v2') {
        this.extractor = null; // Pipeline type from @xenova/transformers
        this.initialized = false;
        this.modelName = modelName;
    }
    /**
     * Initialize the embedding model
     */
    async initialize() {
        if (this.initialized && this.extractor) {
            return;
        }
        try {
            console.log(`🔄 Loading embedding model: ${this.modelName}`);
            this.extractor = await pipeline('feature-extraction', this.modelName, {
                quantized: true, // Use quantized model for faster loading
            });
            this.initialized = true;
            console.log(`✅ Embedding model loaded: ${this.modelName}`);
        }
        catch (error) {
            console.error('❌ Failed to load embedding model:', error);
            throw error;
        }
    }
    /**
     * Generate embedding for a single text
     */
    async embed(text, options) {
        if (!this.extractor) {
            await this.initialize();
        }
        if (!this.extractor) {
            throw new Error('Embedding model not initialized');
        }
        try {
            const output = await this.extractor(text, {
                pooling: 'mean',
                normalize: options?.normalize ?? true,
            });
            // Convert tensor to array
            const embedding = Array.from(output.data);
            return embedding;
        }
        catch (error) {
            console.error('❌ Failed to generate embedding:', error);
            throw error;
        }
    }
    /**
     * Generate embeddings for multiple texts
     */
    async embedBatch(texts, options) {
        if (!this.extractor) {
            await this.initialize();
        }
        if (!this.extractor) {
            throw new Error('Embedding model not initialized');
        }
        try {
            const embeddings = [];
            // Process in batches to avoid memory issues
            const batchSize = 10;
            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const batchEmbeddings = await Promise.all(batch.map(text => this.embed(text, options)));
                embeddings.push(...batchEmbeddings);
            }
            return embeddings;
        }
        catch (error) {
            console.error('❌ Failed to generate batch embeddings:', error);
            throw error;
        }
    }
    /**
     * Calculate cosine similarity between two embeddings
     */
    cosineSimilarity(embedding1, embedding2) {
        if (embedding1.length !== embedding2.length) {
            throw new Error('Embeddings must have the same dimension');
        }
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }
        const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        return similarity;
    }
    /**
     * Find most similar embedding in a collection
     */
    findMostSimilar(queryEmbedding, candidateEmbeddings, topK = 5) {
        const similarities = candidateEmbeddings.map((embedding, index) => ({
            index,
            similarity: this.cosineSimilarity(queryEmbedding, embedding),
        }));
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }
    /**
     * Get embedding dimension
     */
    getDimension() {
        // all-MiniLM-L6-v2 has 384 dimensions
        return 384;
    }
    /**
     * Check if model is initialized
     */
    isInitialized() {
        return this.initialized && this.extractor !== null;
    }
}
// Singleton instance
let transformersEmbeddingsInstance = null;
export function getTransformersEmbeddings() {
    if (!transformersEmbeddingsInstance) {
        transformersEmbeddingsInstance = new TransformersEmbeddings();
    }
    return transformersEmbeddingsInstance;
}
