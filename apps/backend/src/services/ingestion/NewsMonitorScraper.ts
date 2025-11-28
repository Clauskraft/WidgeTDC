import axios from 'axios';
import { parseStringPromise } from 'xml2js'; // Kræver installation
import { logger } from '../../utils/logger.js';

export interface NewsItem {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    source: string;
    category: string;
    snippet: string;
}

export class NewsMonitorScraper {
    private topics = [
        { query: 'Claus Kraft', category: 'personal' },
        { query: 'TDC Erhverv', category: 'company' },
        { query: 'Teleindustrien Danmark', category: 'industry' },
        { query: 'Cybersecurity Danmark', category: 'security' },
        { query: 'NIS2 direktiv', category: 'compliance' }
    ];

    private BASE_URL = 'https://news.google.com/rss/search?q=';

    async fetchNews(): Promise<NewsItem[]> {
        const allNews: NewsItem[] = [];

        for (const topic of this.topics) {
            try {
                const url = `${this.BASE_URL}${encodeURIComponent(topic.query + ' location:dk')}&hl=da&gl=DK&ceid=DK:da`;
                const response = await axios.get(url);
                const result = await parseStringPromise(response.data);

                if (result.rss && result.rss.channel && result.rss.channel[0].item) {
                    const items = result.rss.channel[0].item.slice(0, 5); // Top 5 per emne
                    
                    items.forEach((item: any) => {
                        allNews.push({
                            id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            title: item.title[0],
                            link: item.link[0],
                            pubDate: item.pubDate[0],
                            source: item.source?.[0]?._ || 'Google News',
                            category: topic.category,
                            snippet: item.description ? item.description[0].replace(/<[^>]*>?/gm, '') : '' // Strip HTML
                        });
                    });
                }
            } catch (error) {
                logger.error(`Failed to fetch news for topic: ${topic.query}`, error);
            }
        }

        logger.info(`🗞️ Fetched ${allNews.length} news items.`);
        return allNews;
    }
}

