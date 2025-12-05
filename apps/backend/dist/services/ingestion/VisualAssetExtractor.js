import * as cheerio from 'cheerio';
import { logger } from '../../utils/logger.js';
import { getNeo4jVectorStore } from '../../platform/vector/Neo4jVectorStoreAdapter.js';
import { getLlmService } from '../llm/llmService.js';
export class VisualAssetExtractor {
    /**
     * Extract visual assets from HTML content
     */
    async extractFromHtml(html, baseUrl) {
        const $ = cheerio.load(html);
        const assets = [];
        // Find images
        $('img').each((_, el) => {
            const src = $(el).attr('src');
            const alt = $(el).attr('alt') || '';
            if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('pixel')) {
                // Filter out small icons/tracking pixels based on keywords for now
                // In production, check image dimensions
                try {
                    const absoluteUrl = new URL(src, baseUrl).toString();
                    assets.push({
                        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        type: 'image',
                        sourceUrl: absoluteUrl,
                        description: alt,
                        tags: ['web-image'], // Initial tag
                        metadata: {
                            originalAlt: alt,
                            pageUrl: baseUrl
                        }
                    });
                }
                catch (e) {
                    // Invalid URL
                }
            }
        });
        // Find figures (often charts/diagrams)
        $('figure').each((_, el) => {
            const img = $(el).find('img').first();
            const caption = $(el).find('figcaption').text().trim();
            const src = img.attr('src');
            if (src) {
                try {
                    const absoluteUrl = new URL(src, baseUrl).toString();
                    assets.push({
                        id: `fig-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        type: 'figure',
                        sourceUrl: absoluteUrl,
                        description: caption || img.attr('alt') || 'Figure',
                        tags: ['figure', 'chart'],
                        metadata: {
                            caption,
                            pageUrl: baseUrl
                        }
                    });
                }
                catch (e) {
                    // Invalid URL
                }
            }
        });
        return assets;
    }
    /**
     * Placeholder for PDF extraction
     */
    async extractFromPdf(filePath) {
        // TODO: Implement PDF image extraction using 'pdf-lib' or similar
        logger.info(`Would extract images from PDF: ${filePath}`);
        return [];
    }
    /**
     * Placeholder for PPTX extraction
     */
    async extractFromPptx(filePath) {
        // TODO: Implement PPTX image extraction using 'jszip' (unzipping pptx structure)
        logger.info(`Would extract images from PPTX: ${filePath}`);
        return [];
    }
    /**
     * Analyze and label assets using Vision LLM
     */
    async analyzeAndLabel(assets) {
        const llm = getLlmService();
        for (const asset of assets) {
            try {
                // Skip if description is already detailed
                if (asset.description.length > 50)
                    continue;
                // In a real scenario, we would pass the image URL or binary to a Vision model
                // For now, we simulate based on existing metadata/alt text
                const prompt = `Analyze this image metadata and generate 3 relevant tags and a short description.
                Type: ${asset.type}
                Source: ${asset.sourceUrl}
                Current Description: ${asset.description}
                Metadata: ${JSON.stringify(asset.metadata)}`;
                const analysis = await llm.generateContextualResponse("You are an expert Image Analyst. Output JSON with { description: string, tags: string[] }.", prompt);
                try {
                    // Try to parse JSON response (LLM output might be messy)
                    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        asset.description = result.description || asset.description;
                        asset.tags = [...new Set([...asset.tags, ...(result.tags || [])])];
                    }
                }
                catch (e) {
                    // Fallback if JSON parse fails
                }
            }
            catch (error) {
                logger.warn(`Failed to analyze asset ${asset.id}`, error);
            }
        }
        return assets;
    }
    /**
     * Store assets in Vector DB for retrieval
     */
    async storeAssets(assets) {
        const vectorStore = getNeo4jVectorStore();
        await vectorStore.batchUpsert({
            records: assets.map(asset => ({
                id: asset.id,
                content: `${asset.description}\nTags: ${asset.tags.join(', ')}\nType: ${asset.type}`,
                metadata: {
                    ...asset.metadata,
                    type: 'visual_asset',
                    sourceUrl: asset.sourceUrl,
                    assetType: asset.type
                },
                namespace: 'assets' // Separate namespace for visuals
            })),
            namespace: 'assets'
        });
        logger.info(`🖼️ Stored ${assets.length} visual assets`);
    }
}
export const visualAssetExtractor = new VisualAssetExtractor();
