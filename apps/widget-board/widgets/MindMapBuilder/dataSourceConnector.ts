// MindMap Builder - Data Source Connector
// Connects to existing WidgeTDC data pipelines

import { MindMapNode, MindMapEdge, SearchResult, ExpansionResult, NODE_COLORS } from './types';

// API endpoint base URL
const API_BASE = 'http://localhost:3000/api';
const WS_BASE = 'ws://localhost:3001/mcp/ws';

// Search result from backend
interface VectorSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  similarity: number;
}

// Aggregated data sources
export type DataSourceType = 
  | 'vidensarkiv'      // Main knowledge archive (PgVector)
  | 'local_files'      // LocalFileScanner data
  | 'browser_history'  // BrowserHistoryReader data
  | 'outlook_emails'   // OutlookEmailReader data
  | 'web_search'       // External web search
  | 'wikipedia'        // Wikipedia MCP
  | 'pubmed'           // PubMed MCP
  | 'google_drive';    // Google Drive MCP

interface DataSourceConfig {
  type: DataSourceType;
  enabled: boolean;
  label: string;
  color: string;
  icon: string;
}

// Available data sources configuration
export const DATA_SOURCES: DataSourceConfig[] = [
  { type: 'vidensarkiv', enabled: true, label: 'Vidensarkiv', color: '#8B5CF6', icon: '🧠' },
  { type: 'local_files', enabled: true, label: 'Lokale Filer', color: '#10B981', icon: '📁' },
  { type: 'browser_history', enabled: true, label: 'Browser Historik', color: '#3B82F6', icon: '🌐' },
  { type: 'outlook_emails', enabled: true, label: 'Outlook Emails', color: '#F59E0B', icon: '📧' },
  { type: 'web_search', enabled: true, label: 'Web Søgning', color: '#06B6D4', icon: '🔍' },
  { type: 'wikipedia', enabled: true, label: 'Wikipedia', color: '#6B7280', icon: '📚' },
  { type: 'pubmed', enabled: true, label: 'PubMed', color: '#EF4444', icon: '🔬' },
  { type: 'google_drive', enabled: false, label: 'Google Drive', color: '#4285F4', icon: '📄' },
];

/**
 * Search the Vidensarkiv (main knowledge archive)
 */
export async function searchVidensarkiv(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_BASE}/vector/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: query,
        namespace: 'vidensarkiv',
        limit,
      }),
    });

    if (!response.ok) {
      console.warn('[DataSource] Vidensarkiv search failed:', response.statusText);
      return [];
    }

    const results: VectorSearchResult[] = await response.json();
    
    return results.map((r) => ({
      id: r.id,
      title: extractTitle(r.content),
      snippet: r.content.slice(0, 200),
      source: (r.metadata?.source as 'web' | 'drive' | 'pubmed' | 'wikipedia') || 'web',
      url: r.metadata?.url,
      relevance: r.similarity,
    }));
  } catch (error) {
    console.error('[DataSource] Vidensarkiv error:', error);
    return [];
  }
}

/**
 * Search local files via backend
 */
export async function searchLocalFiles(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_BASE}/ingestion/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        source: 'local_file_scanner',
        limit,
      }),
    });

    if (!response.ok) return [];

    const results = await response.json();
    return results.map((r: any) => ({
      id: r.id,
      title: r.title || r.filename || 'Fil',
      snippet: r.content?.slice(0, 200) || '',
      source: 'drive' as const,
      url: r.path,
      relevance: r.score || 0.5,
    }));
  } catch (error) {
    console.error('[DataSource] Local files error:', error);
    return [];
  }
}

/**
 * Search browser history
 */
export async function searchBrowserHistory(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_BASE}/ingestion/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        source: 'browser_history',
        limit,
      }),
    });

    if (!response.ok) return [];

    const results = await response.json();
    return results.map((r: any) => ({
      id: r.id,
      title: r.title || r.url || 'Side',
      snippet: r.content?.slice(0, 200) || r.url || '',
      source: 'web' as const,
      url: r.url,
      relevance: r.score || 0.5,
    }));
  } catch (error) {
    console.error('[DataSource] Browser history error:', error);
    return [];
  }
}

/**
 * Search Outlook emails
 */
export async function searchOutlookEmails(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_BASE}/ingestion/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        source: 'outlook_email',
        limit,
      }),
    });

    if (!response.ok) return [];

    const results = await response.json();
    return results.map((r: any) => ({
      id: r.id,
      title: r.subject || r.title || 'Email',
      snippet: r.body?.slice(0, 200) || r.content?.slice(0, 200) || '',
      source: 'drive' as const,
      url: r.mailId,
      relevance: r.score || 0.5,
    }));
  } catch (error) {
    console.error('[DataSource] Outlook error:', error);
    return [];
  }
}

/**
 * Search via MCP WebSocket (for external sources)
 */
export async function searchViaMCP(
  query: string,
  tool: string,
  params: Record<string, any> = {}
): Promise<SearchResult[]> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_BASE);
      const timeout = setTimeout(() => {
        ws.close();
        resolve([]);
      }, 10000);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'tool_call',
          tool,
          params: { query, ...params },
        }));
      };

      ws.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(event.data);
          if (response.type === 'tool_result' && response.result) {
            const results = Array.isArray(response.result) ? response.result : [response.result];
            resolve(results.map((r: any, i: number) => ({
              id: r.id || `mcp-${tool}-${i}`,
              title: r.title || r.name || query,
              snippet: r.snippet || r.description || r.content?.slice(0, 200) || '',
              source: tool.includes('wiki') ? 'wikipedia' : tool.includes('pubmed') ? 'pubmed' : 'web',
              url: r.url || r.link,
              relevance: r.relevance || 0.7,
            })));
          } else {
            resolve([]);
          }
        } catch (e) {
          resolve([]);
        }
        ws.close();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve([]);
      };
    } catch (error) {
      console.error('[DataSource] MCP error:', error);
      resolve([]);
    }
  });
}

/**
 * Unified search across all enabled data sources
 */
export async function unifiedSearch(
  query: string,
  enabledSources: DataSourceType[] = ['vidensarkiv', 'local_files'],
  limit: number = 5
): Promise<SearchResult[]> {
  const searches: Promise<SearchResult[]>[] = [];

  if (enabledSources.includes('vidensarkiv')) {
    searches.push(searchVidensarkiv(query, limit));
  }
  if (enabledSources.includes('local_files')) {
    searches.push(searchLocalFiles(query, limit));
  }
  if (enabledSources.includes('browser_history')) {
    searches.push(searchBrowserHistory(query, limit));
  }
  if (enabledSources.includes('outlook_emails')) {
    searches.push(searchOutlookEmails(query, limit));
  }
  if (enabledSources.includes('web_search')) {
    searches.push(searchViaMCP(query, 'web_search', { limit }));
  }
  if (enabledSources.includes('wikipedia')) {
    searches.push(searchViaMCP(query, 'mediawiki-mcp-server:search-page', { query, limit }));
  }
  if (enabledSources.includes('pubmed')) {
    searches.push(searchViaMCP(query, 'pubmed-mcp-server:search_pubmed_key_words', { key_words: query, num_results: limit }));
  }

  const allResults = await Promise.allSettled(searches);
  
  // Flatten and sort by relevance
  const results: SearchResult[] = [];
  allResults.forEach((r) => {
    if (r.status === 'fulfilled') {
      results.push(...r.value);
    }
  });

  // Sort by relevance and dedupe by title similarity
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit * 2); // Return more results for variety
}

/**
 * AI-powered node expansion using backend LLM
 */
export async function expandNodeWithAI(
  node: MindMapNode,
  enabledSources: DataSourceType[] = ['vidensarkiv', 'web_search']
): Promise<ExpansionResult> {
  try {
    // First, search for related content
    const searchResults = await unifiedSearch(node.label, enabledSources, 5);

    // Then, ask LLM to identify key concepts
    const response = await fetch(`${API_BASE}/llm/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Baseret på emnet "${node.label}" og følgende søgeresultater, identificer 3-5 relaterede nøglebegreber der ville være relevante at udforske:

Søgeresultater:
${searchResults.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

Svar i JSON format:
{
  "concepts": [
    { "label": "Koncept navn", "relation": "relates_to|causes|part_of|leads_to", "description": "Kort beskrivelse" }
  ]
}`,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      // Fallback to search-based expansion
      return fallbackExpansion(node, searchResults);
    }

    const llmResult = await response.json();
    let concepts: any[];

    try {
      const parsed = JSON.parse(llmResult.text || llmResult.content || '{}');
      concepts = parsed.concepts || [];
    } catch {
      return fallbackExpansion(node, searchResults);
    }

    // Convert to nodes and edges
    const nodes: Omit<MindMapNode, 'position'>[] = concepts.map((c: any) => ({
      id: '', // Will be assigned by store
      label: c.label,
      description: c.description,
      type: 'expanded' as const,
      source: determineSource(searchResults, c.label),
      size: 35,
      color: NODE_COLORS.expanded,
      createdAt: new Date().toISOString(),
    }));

    const edges: Omit<MindMapEdge, 'id'>[] = concepts.map((c: any) => ({
      sourceId: node.id,
      targetId: '', // Will be assigned
      label: c.relation,
      type: (c.relation as any) || 'relates_to',
      weight: 0.7,
      animated: true,
    }));

    return {
      nodes,
      edges,
      suggestions: searchResults.slice(0, 3).map(r => r.title),
    };
  } catch (error) {
    console.error('[DataSource] AI expansion error:', error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Fallback expansion when LLM is unavailable
 */
function fallbackExpansion(node: MindMapNode, searchResults: SearchResult[]): ExpansionResult {
  // Use top search results as nodes
  const nodes: Omit<MindMapNode, 'position'>[] = searchResults.slice(0, 3).map((r) => ({
    id: '',
    label: r.title.slice(0, 30),
    description: r.snippet,
    type: 'expanded' as const,
    source: r.source,
    sourceUrl: r.url,
    size: 35,
    color: NODE_COLORS.expanded,
    createdAt: new Date().toISOString(),
  }));

  const edges: Omit<MindMapEdge, 'id'>[] = nodes.map(() => ({
    sourceId: node.id,
    targetId: '',
    type: 'relates_to' as const,
    weight: 0.6,
    animated: true,
  }));

  return { nodes, edges };
}

/**
 * Determine source type from search results
 */
function determineSource(
  results: SearchResult[],
  label: string
): 'web' | 'drive' | 'pubmed' | 'wikipedia' {
  const match = results.find(r => 
    r.title.toLowerCase().includes(label.toLowerCase()) ||
    label.toLowerCase().includes(r.title.toLowerCase())
  );
  return match?.source || 'web';
}

/**
 * Extract title from content
 */
function extractTitle(content: string): string {
  // Try to extract from "Title: xxx" format
  const titleMatch = content.match(/Title:\s*(.+?)(?:\n|$)/);
  if (titleMatch) return titleMatch[1].trim();

  // Otherwise use first line
  const firstLine = content.split('\n')[0];
  return firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : '');
}

/**
 * Auto-tracking: Monitor for new data about tracked nodes
 */
export function setupAutoTracking(
  trackedLabels: string[],
  onNewData: (nodeLabel: string, results: SearchResult[]) => void,
  intervalMs: number = 30000
): () => void {
  const intervalId = setInterval(async () => {
    for (const label of trackedLabels) {
      const results = await unifiedSearch(label, ['vidensarkiv'], 3);
      if (results.length > 0) {
        onNewData(label, results);
      }
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

export default {
  DATA_SOURCES,
  unifiedSearch,
  searchVidensarkiv,
  searchLocalFiles,
  searchBrowserHistory,
  searchOutlookEmails,
  searchViaMCP,
  expandNodeWithAI,
  setupAutoTracking,
};
