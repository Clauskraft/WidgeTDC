import * as cheerio from 'cheerio';
import { URL } from 'url';
/**
 * Content Cleaner Service
 *
 * Strips noise (ads, nav, footer) from HTML content to prepare it for Vector DB ingestion.
 * Inspired by 'css-stripper-pro-hardened' robust crawling logic.
 */
export class ContentCleaner {
    constructor() {
        this.noiseSelectors = [
            'nav', 'header', 'footer', 'aside',
            '.ads', '.ad-container', '.advertisement',
            '#cookie-banner', '.cookie-consent',
            '.social-share', '.comments',
            'script', 'style', 'noscript', 'iframe'
        ];
    }
    /**
     * Clean HTML content and return plain text
     */
    clean(html, baseUrl) {
        if (!html)
            return '';
        const $ = cheerio.load(html);
        // Remove noise
        this.noiseSelectors.forEach(selector => {
            $(selector).remove();
        });
        // Resolve relative URLs if base URL provided
        if (baseUrl) {
            $('a').each((_, el) => {
                const href = $(el).attr('href');
                if (href) {
                    try {
                        $(el).attr('href', new URL(href, baseUrl).toString());
                    }
                    catch {
                        // Ignore invalid URLs
                    }
                }
            });
            $('img').each((_, el) => {
                const src = $(el).attr('src');
                if (src) {
                    try {
                        $(el).attr('src', new URL(src, baseUrl).toString());
                    }
                    catch {
                        // Ignore
                    }
                }
            });
        }
        // Extract main text
        // We prefer 'main', 'article', or '#content' if available
        let mainContent = $('main, article, #content, .content, .post-body').first();
        if (mainContent.length === 0) {
            // Fallback to body
            mainContent = $('body');
        }
        // Convert to text, collapsing whitespace
        let text = mainContent.text()
            .replace(/\s+/g, ' ')
            .trim();
        return text;
    }
    /**
     * Extract metadata (title, description, og:image)
     */
    extractMetadata(html) {
        const $ = cheerio.load(html);
        return {
            title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
            description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
            image: $('meta[property="og:image"]').attr('content') || ''
        };
    }
}
// Singleton
export const contentCleaner = new ContentCleaner();
