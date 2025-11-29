import axios from 'axios';
import { logger } from '../../utils/logger.js';

export interface ThreatIntel {
    id: string;
    source: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    url?: string;
    indicators?: string[]; // IP, Hash, Domain
}

export class PublicThreatScraper {
    // CISA Known Exploited Vulnerabilities
    private readonly CISA_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
    
    // OpenPhish (Free feed) - Text format
    private readonly OPENPHISH_URL = 'https://openphish.com/feed.txt';

    async fetchThreats(): Promise<ThreatIntel[]> {
        const threats: ThreatIntel[] = [];
        
        // 1. Fetch CISA KEV
        try {
            const cisaRes = await axios.get(this.CISA_URL, { timeout: 5000 });
            if (cisaRes.data && cisaRes.data.vulnerabilities) {
                // Tag de 5 nyeste
                const latest = cisaRes.data.vulnerabilities.slice(0, 5);
                
                latest.forEach((vuln: any) => {
                    threats.push({
                        id: `cisa-${vuln.cveID}`,
                        source: 'CISA KEV',
                        title: `${vuln.cveID}: ${vuln.product} Vulnerability`,
                        description: vuln.shortDescription,
                        severity: 'high', // CISA KEV er altid alvorlige
                        timestamp: vuln.dateAdded,
                        url: `https://nvd.nist.gov/vuln/detail/${vuln.cveID}`
                    });
                });
                logger.info(`Fetched ${latest.length} threats from CISA`);
            }
        } catch (error) {
            logger.error('Failed to fetch CISA feed:', error);
        }

        // 2. Fetch OpenPhish (Simple list)
        try {
            const phishRes = await axios.get(this.OPENPHISH_URL, { timeout: 5000 });
            if (phishRes.data) {
                const lines = phishRes.data.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 5);
                
                lines.forEach((url: string, idx: number) => {
                    threats.push({
                        id: `phish-${Date.now()}-${idx}`,
                        source: 'OpenPhish',
                        title: 'Active Phishing Site Detected',
                        description: `Malicious URL detected: ${url}`,
                        severity: 'medium',
                        timestamp: new Date().toISOString(),
                        url: url,
                        indicators: [url]
                    });
                });
                logger.info(`Fetched ${lines.length} threats from OpenPhish`);
            }
        } catch (error) {
            logger.error('Failed to fetch OpenPhish feed:', error);
        }

        return threats;
    }
}

