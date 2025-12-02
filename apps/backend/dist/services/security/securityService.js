import { randomUUID } from 'crypto';
import { getOpenSearchClient } from './openSearchClient.js';
import { getMinioClient, getMinioBucket } from './minioClient.js';
import { getSecurityTemplates, recordSearchHistory, getSearchHistory, listActivityEvents, } from './securityRepository.js';
import { ingestRegistryEvent } from './activityStream.js';
export const DEFAULT_FEEDS = [
    {
        id: 'openphish',
        name: 'OpenPhish',
        status: 'healthy',
        lastFetched: new Date().toISOString(),
        tags: ['phishing', 'url'],
        threatLevel: 'high',
        documentsPerHour: 150,
        duplicatesPerHour: 5,
        backlogMinutes: 0,
        regions: ['Global'],
    },
    {
        id: 'feed-darkweb',
        name: 'Dark Web Credential Markets',
        tags: ['dark-web', 'credentials', 'leak'],
        threatLevel: 'critical',
        status: 'healthy',
        lastFetched: new Date().toISOString(),
        documentsPerHour: 420,
        duplicatesPerHour: 11,
        backlogMinutes: 2,
        regions: ['EU-West', 'US-East'],
    },
    {
        id: 'feed-cert',
        name: 'CERT-EU Advisories',
        tags: ['gov', 'advisory'],
        threatLevel: 'high',
        status: 'healthy',
        lastFetched: new Date().toISOString(),
        documentsPerHour: 96,
        duplicatesPerHour: 2,
        backlogMinutes: 0,
        regions: ['EU-West'],
    },
];
const DEFAULT_PIPELINE = [
    { id: 'ingest', name: 'Ingest', service: 'RSS Poller', status: 'healthy', latencyMs: 120 },
    { id: 'normalize', name: 'Normalize', service: 'Feed Normalizer', status: 'healthy', latencyMs: 150 },
    { id: 'classify', name: 'Classify', service: 'Threat Classifier', status: 'warning', latencyMs: 210 },
    { id: 'index', name: 'Index', service: 'OpenSearch Writer', status: 'healthy', latencyMs: 80 },
    { id: 'archive', name: 'Archive', service: 'MinIO Bucket', status: 'healthy', latencyMs: 65 },
];
const DEFAULT_DOCUMENTS = [
    {
        id: 'ti-90311',
        feedId: 'feed-darkweb',
        title: 'APT41 credential bundle targeting Nordic finance leadership',
        severity: 'critical',
        summary: 'Fresh dump with 1.2k employee accounts and MFA reset instructions.',
        tags: ['APT41', 'credential', 'darkweb'],
        dedupeHits: 3,
        ingestedAt: new Date().toISOString(),
    },
];
const DEFAULT_METRICS = {
    documentsIndexed: 98231,
    ingestionLatency: 380,
    dedupeRate: 0.89,
    backlogMinutes: 6,
};
const DEFAULT_ARCHIVE = {
    sizeBytes: 1900000000000,
    retentionDays: 60,
    objectCount: 18240,
};
export async function getFeedOverview() {
    const client = getOpenSearchClient();
    const feeds = [...DEFAULT_FEEDS];
    const pipelineStages = [...DEFAULT_PIPELINE];
    const normalizedDocuments = [...DEFAULT_DOCUMENTS];
    let metrics = { ...DEFAULT_METRICS };
    let archive = { ...DEFAULT_ARCHIVE };
    let openSearchConnected = false;
    let minioConnected = false;
    if (client) {
        openSearchConnected = true;
        const index = 'feeds';
        const osStart = Date.now();
        try {
            const searchResult = await client.search({
                index,
                size: 5,
                body: {
                    sort: [{ ingestedAt: 'desc' }],
                    query: { match_all: {} },
                    aggs: {
                        feeds: { terms: { field: 'feedId.keyword' } }, // Use .keyword for terms agg
                        pipeline: { terms: { field: 'pipeline.keyword' } },
                        status: { terms: { field: 'status.keyword' } }
                    }
                }
            });
            if (searchResult) {
                const hits = searchResult.body.hits.hits;
                normalizedDocuments.splice(0, normalizedDocuments.length, ...hits.map((hit) => {
                    const source = hit._source;
                    return {
                        id: source.id ?? hit._id,
                        feedId: source.feedId ?? 'unknown',
                        title: source.title ?? 'Untitled',
                        summary: source.summary ?? '',
                        severity: source.severity ?? 'medium',
                        tags: source.tags ?? [],
                        dedupeHits: source.dedupeHits,
                        ingestedAt: source.ingestedAt ?? new Date().toISOString(),
                    };
                }));
                metrics = {
                    documentsIndexed: searchResult.body.hits.total ? Number(searchResult.body.hits.total.value || searchResult.body.hits.total) : DEFAULT_METRICS.documentsIndexed,
                    ingestionLatency: Math.round(Date.now() - osStart),
                    dedupeRate: DEFAULT_METRICS.dedupeRate,
                    backlogMinutes: DEFAULT_METRICS.backlogMinutes,
                };
                // Update feeds with aggregation data
                const feedsAgg = searchResult.body.aggregations?.feeds?.buckets || [];
                feeds.forEach(feed => {
                    const bucket = feedsAgg.find((b) => b.key === feed.id);
                    if (bucket) {
                        feed.documentsPerHour = Math.round(bucket.doc_count / 24); // Rough estimate
                    }
                });
            }
        }
        catch (e) {
            console.error('OpenSearch feed overview error:', e);
        }
    }
    const minioClient = getMinioClient();
    if (minioClient) {
        minioConnected = true;
        try {
            const bucket = getMinioBucket();
            let totalSize = 0;
            let count = 0;
            const stream = minioClient.listObjectsV2(bucket, '', true);
            await new Promise((resolve, reject) => {
                stream.on('data', obj => {
                    totalSize += obj.size ?? 0;
                    count += 1;
                });
                stream.on('error', err => reject(err));
                stream.on('end', () => resolve());
            });
            archive = {
                sizeBytes: totalSize || DEFAULT_ARCHIVE.sizeBytes,
                retentionDays: DEFAULT_ARCHIVE.retentionDays,
                objectCount: count || DEFAULT_ARCHIVE.objectCount,
            };
        }
        catch (error) {
            console.warn('⚠️  MinIO listing failed:', error);
        }
    }
    return {
        feeds,
        pipelineStages,
        normalizedDocuments,
        metrics,
        archive,
        environment: {
            openSearchConnected,
            minioConnected,
        },
    };
}
const TIMEFRAME_TO_WINDOW = {
    '1h': 1,
    '6h': 6,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
};
function computeTimeFilter(timeframe) {
    const date = new Date();
    if (timeframe === '7d') {
        date.setDate(date.getDate() - 7);
        return date.toISOString();
    }
    if (timeframe === '30d') {
        date.setDate(date.getDate() - 30);
        return date.toISOString();
    }
    const hours = TIMEFRAME_TO_WINDOW[timeframe];
    if (!hours)
        return null;
    date.setHours(date.getHours() - hours);
    return date.toISOString();
}
export async function executeSecuritySearch(params) {
    const client = getOpenSearchClient();
    const startedAt = Date.now();
    let results = [...DEFAULT_DOCUMENTS].map(doc => ({
        id: doc.id,
        title: doc.title,
        summary: doc.summary,
        source: 'Feed Ingestion',
        severity: doc.severity,
        timestamp: doc.ingestedAt,
        tags: doc.tags,
        score: 0.9,
    }));
    let totalDocs = results.length;
    if (client) {
        const must = [];
        if (params.query) {
            must.push({
                multi_match: {
                    query: params.query,
                    fields: ['title^3', 'summary', 'tags', 'payload'],
                    fuzziness: 'AUTO',
                },
            });
        }
        if (params.severity && params.severity !== 'all') {
            must.push({ term: { severity: params.severity } });
        }
        if (params.sources?.length) {
            must.push({ terms: { source: params.sources } });
        }
        const rangeGte = computeTimeFilter(params.timeframe);
        const filter = [];
        if (rangeGte) {
            filter.push({ range: { ingestedAt: { gte: rangeGte } } });
        }
        const query = {
            bool: {
                must,
                filter,
            },
        };
        try {
            const response = await client.search({
                index: 'feeds',
                size: 20,
                body: {
                    query,
                    sort: [{ ingestedAt: 'desc' }],
                }
            });
            if (response) {
                totalDocs = response.body.hits.total ? Number(response.body.hits.total.value || response.body.hits.total) : 0;
                results = response.body.hits.hits.map((hit) => {
                    const source = hit._source;
                    return {
                        id: source.id ?? hit._id,
                        title: source.title ?? 'Untitled document',
                        summary: source.summary ?? '',
                        source: source.source ?? 'Feed Ingestion',
                        severity: source.severity ?? 'medium',
                        timestamp: source.ingestedAt ?? new Date().toISOString(),
                        tags: source.tags ?? [],
                        score: Number(hit._score || 0),
                    };
                });
            }
        }
        catch (e) {
            console.error('OpenSearch search error:', e);
        }
    }
    const latencyMs = Math.round(Date.now() - startedAt);
    const metrics = {
        latencyMs,
        totalDocs,
        coverage: params.sources?.length ? Math.min(1, params.sources.length / 5) : 0.9,
    };
    const historyEntry = recordSearchHistory({
        id: `search-${randomUUID()}`,
        query: params.query || '(blank query)',
        severity: params.severity,
        timeframe: params.timeframe,
        sources: params.sources,
        results: results.length,
        latencyMs,
    });
    return {
        results,
        metrics,
        auditEntry: historyEntry,
    };
}
export const securityTemplates = {
    list() {
        return getSecurityTemplates();
    },
};
export const securityHistory = {
    list(limit) {
        return getSearchHistory(limit);
    },
};
export const securityActivity = {
    list(severity, category, limit) {
        return listActivityEvents({ severity, category, limit });
    },
    publish(event) {
        return ingestRegistryEvent(event);
    },
};
