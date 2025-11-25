# WidgetTDC Enhancement Assessment & Implementation Plan

**Dato**: 25. november 2025  
**Status**: VURDERING KOMPLET  
**Kritisk Begrænsning**: INGEN VÆSENTLIGE ÆNDRINGER TIL EKSISTERENDE KODE

---

## 📊 EXECUTIVE SUMMARY

Efter grundig analyse af den eksisterende WidgetTDC kodebase og det foreslåede "500% Enhancement Architecture" dokument, præsenterer dette dokument en **realistisk vurdering** og **prioriteret implementeringsplan** der:

1. **Bevarer 100%** af eksisterende funktionalitet
2. **Udnytter eksisterende infrastruktur** (MCP router, cognitive systems, repositories)
3. **Tilføjer additive forbedringer** uden breaking changes
4. **Prioriterer quick wins** over store omstruktureringer

### Vurdering af "500% Enhancement" Forslaget

| Aspekt | Vurdering | Risiko | Anbefaling |
|--------|-----------|--------|------------|
| 7 OSINT Widgets | ✅ REALISTISK | LAV | Implementér gradvist |
| HuggingFace Integration | ⚠️ KOMPLEKST | MEDIUM | Start med 2-3 modeller |
| Widget Orchestration Layer | ✅ ADDITIVT | LAV | Bygger på eksisterende MCP |
| Data Correlation Pipeline | ⚠️ KOMPLEKST | MEDIUM | Simplificer først |
| "Spor Following" Engine | ❌ OVERKILL | HØJ | Udskyd til Phase 3+ |
| Klavis Integration | ⚠️ EXTERNAL DEPENDENCY | MEDIUM | POC først |

**Samlet Vurdering**: 60% af forslaget kan implementeres sikkert inden for 4-6 uger uden at ændre eksisterende arkitektur.

---

## 🔍 EKSISTERENDE STATE (Verificeret fra kodebase)

### Aktuelle Widgets (35 stk i widgetRegistry.js)

```
KATEGORIER (verificeret):
├─ agents (6): AgentMonitor, AgentBuilder, AgentChat, AgentStatusDashboard, 
│              PersonaCoordinator, PersonalAgent, EvolutionAgent
├─ security (4): CybersecurityOverwatch, DarkWebMonitor, LocalScan, NetworkSpy
├─ monitoring (4): ActivityStream, PerformanceMonitor, StatusWidget, SystemMonitor
├─ integration (3): MCPConnector, MCPEmailRAG, McpRouter
├─ media (3): ImageAnalyzer, AudioTranscriber, VideoAnalyzer
├─ productivity (4): IntelligentNotes, Kanban, Phase1CFastTrack, SearchInterface
├─ communication (2): AgentChat, LiveConversation
├─ development (2): CodeAnalysis, NexusTerminal
├─ ai (2): AiPal, PromptLibrary
├─ analytics (2): CmaDecision, ProcurementIntelligence
├─ compliance (1): SragGovernance
├─ data (1): FeedIngestion
├─ settings (1): SystemSettings
└─ system (1): WidgetImporter
```

### MCP Infrastruktur (SOLID FOUNDATION)

```typescript
// Eksisterende - apps/backend/src/mcp/
├─ mcpRouter.ts          // HTTP POST /route + GET /tools + GET /resources
├─ mcpRegistry.ts        // Tool registration + routing + server management
├─ mcpWebsocketServer.ts // WebSocket on /mcp/ws with broadcast
├─ toolHandlers.ts       // 30+ tool handlers (CMA, SRAG, PAL, Evolution, etc.)
└─ EventBus.ts           // Event-driven communication
```

### Cognitive Services (ALLEREDE IMPLEMENTERET)

| Service | Status | Lokation |
|---------|--------|----------|
| UnifiedMemorySystem | ✅ AKTIV | `mcp/cognitive/UnifiedMemorySystem.ts` |
| TaskRecorder | ✅ AKTIV | `mcp/cognitive/TaskRecorder.ts` |
| PatternEvolutionEngine | ✅ AKTIV | `mcp/cognitive/PatternEvolutionEngine.ts` |
| StateGraphRouter | ✅ AKTIV | `mcp/cognitive/StateGraphRouter.ts` |
| HybridSearchEngine | ✅ AKTIV | `mcp/cognitive/HybridSearchEngine.ts` |
| UnifiedGraphRAG | ✅ AKTIV | `mcp/cognitive/UnifiedGraphRAG.ts` |
| AgentTeam | ✅ AKTIV | `mcp/cognitive/AgentTeam.ts` |

### Eksisterende MCP Tools (30+ handlers)

```typescript
// Verificeret i toolHandlers.ts:
CMA: cma.context, cma.ingest, cma.memory.store, cma.memory.retrieve
SRAG: srag.query, srag.governance.check
Evolution: evolution.report, evolution.get.prompt, evolution.analyze.prompts
PAL: pal.event, pal.board.action, pal.optimize.workflow, pal.analyze.sentiment
Notes: notes.list, notes.create, notes.update, notes.delete, notes.get
Autonomous: autonomous.graph-rag, autonomous.state-graph, autonomous.evolution, 
            autonomous.agent-team, autonomous.agent-team.coordinate
Vidensarkiv: vidensarkiv.search, vidensarkiv.add, vidensarkiv.batch-add, 
             vidensarkiv.get-related, vidensarkiv.list, vidensarkiv.stats
TaskRecorder: taskrecorder.get-suggestions, taskrecorder.approve, 
              taskrecorder.reject, taskrecorder.execute, taskrecorder.get-patterns
Email: email.rag
Agentic: agentic.run
```

---

## ⚠️ KRITISKE ERKENDELSER

### Hvad "500% Enhancement" Forslaget OVERSER

1. **Widget-to-Widget Communication Eksisterer Allerede**
   - EventBus (`mcp/EventBus.ts`) håndterer cross-widget events
   - WebSocket broadcast sender til alle connected clients
   - TaskRecorder observerer alle tool executions

2. **Autonomous Capabilities Er Allerede Tilstede**
   - `StateGraphRouter` implementerer state-machine baseret routing
   - `PatternEvolutionEngine` håndterer pattern learning
   - `AgentTeam.coordinate()` orchestrerer multi-agent tasks

3. **Memory/Correlation Findes**
   - `UnifiedMemorySystem.findHolographicPatterns()` korrelerer på tværs af subsystems
   - `HybridSearchEngine` kombinerer multiple search strategies
   - `UnifiedGraphRAG` implementerer graph-based retrieval

### Hvad Der FAKTISK Mangler

| Område | Nuværende State | Foreslået Løsning |
|--------|-----------------|-------------------|
| OSINT Widgets | Dark Web + Search + Feed | Tilføj 5-7 specialiserede widgets |
| ML/AI Models | Kun LLM via llmService | Tilføj HuggingFace embedding + classification |
| Widget Discovery | Hardcoded i constants.ts | Dynamic registry med capabilities |
| Cross-Widget Data | Ingen shared findings | Unified findings store |
| External Services | OAuth i OutlookJsonAdapter | Udnyt Klavis for flere services |

---

## 🎯 ANBEFALET IMPLEMENTERINGSPLAN

### Princip: ADDITIV UDVIKLING

```
                         EKSISTERENDE KODE
                         (100% bevaret)
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              NYE MCP TOOLS          NYE WIDGETS
              (additive)             (følger pattern)
                    │                     │
                    └──────────┬──────────┘
                               ▼
                      ENHANCEMENT LAYER
                      (ovenpå eksisterende)
```

---

## PHASE 1: QUICK WINS (Uge 1-2)

### 1.1 Widget Orchestration Tools (Additive MCP)

**Lokation**: `apps/backend/src/mcp/toolHandlers.ts` (tilføj til eksisterende)

```typescript
// NYE MCP TOOLS - tilføjes til eksisterende toolHandlers.ts

/**
 * widgets.invoke - Trigger another widget with data
 */
export async function widgetsInvokeHandler(payload: any, ctx: McpContext): Promise<any> {
  const { targetWidget, action, data } = payload;
  
  // Emit event for target widget
  eventBus.emit(`widget.${targetWidget}.${action}`, {
    ...data,
    sourceContext: ctx,
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    targetWidget,
    action,
    message: `Event emitted to ${targetWidget}`
  };
}

/**
 * widgets.discover - Get widget capabilities
 */
export async function widgetsDiscoverHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { filter } = payload;
  
  // Use existing WIDGET_REGISTRY from widgetRegistry.js
  const { WIDGET_REGISTRY, WIDGET_CATEGORIES } = await import('../../../widget-board/widgetRegistry.js');
  
  let widgets = Object.values(WIDGET_REGISTRY);
  
  if (filter?.category) {
    widgets = widgets.filter((w: any) => w.category === filter.category);
  }
  
  return {
    success: true,
    widgets: widgets.map((w: any) => ({
      id: w.id,
      name: w.name,
      category: w.category,
      description: w.description
    })),
    categories: Object.keys(WIDGET_CATEGORIES),
    count: widgets.length
  };
}

/**
 * widgets.correlate - Share findings across widgets
 */
export async function widgetsCorrelateHandler(payload: any, ctx: McpContext): Promise<any> {
  const { sourceWidget, findings, tags } = payload;
  
  // Store in unified memory
  await unifiedMemorySystem.updateWorkingMemory(ctx, {
    type: 'widget_findings',
    sourceWidget,
    findings,
    tags,
    timestamp: new Date().toISOString()
  });
  
  // Broadcast to all widgets
  eventBus.emit('widgets.findings.new', {
    sourceWidget,
    findings,
    tags,
    orgId: ctx.orgId,
    userId: ctx.userId
  });
  
  return {
    success: true,
    message: `Findings from ${sourceWidget} shared`,
    findingsCount: findings.length,
    tags
  };
}
```

**Registrering** (tilføj til index.ts):

```typescript
mcpRegistry.registerTool('widgets.invoke', widgetsInvokeHandler);
mcpRegistry.registerTool('widgets.discover', widgetsDiscoverHandler);
mcpRegistry.registerTool('widgets.correlate', widgetsCorrelateHandler);
```

### 1.2 Dynamic Widget Registry Enhancement

**Lokation**: Ny fil `apps/widget-board/src/services/WidgetDiscoveryService.ts`

```typescript
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from '../../widgetRegistry.js';

export interface WidgetCapability {
  id: string;
  name: string;
  category: string;
  capabilities: string[];
  mcpTools?: string[];
  autonomyLevel: 'MANUAL' | 'SEMI' | 'FULL';
}

export class WidgetDiscoveryService {
  private static instance: WidgetDiscoveryService;
  private capabilities: Map<string, WidgetCapability> = new Map();
  
  static getInstance(): WidgetDiscoveryService {
    if (!this.instance) {
      this.instance = new WidgetDiscoveryService();
    }
    return this.instance;
  }
  
  constructor() {
    this.initializeFromRegistry();
  }
  
  private initializeFromRegistry(): void {
    Object.entries(WIDGET_REGISTRY).forEach(([id, widget]: [string, any]) => {
      this.capabilities.set(id, {
        id,
        name: widget.name,
        category: widget.category,
        capabilities: this.inferCapabilities(widget),
        mcpTools: this.inferMcpTools(id),
        autonomyLevel: this.inferAutonomyLevel(widget.category)
      });
    });
  }
  
  private inferCapabilities(widget: any): string[] {
    const caps: string[] = [];
    const desc = (widget.description || '').toLowerCase();
    
    if (desc.includes('search') || desc.includes('query')) caps.push('search');
    if (desc.includes('monitor') || desc.includes('track')) caps.push('monitoring');
    if (desc.includes('analysis') || desc.includes('analyze')) caps.push('analysis');
    if (desc.includes('ai') || desc.includes('intelligence')) caps.push('ai-powered');
    if (desc.includes('security') || desc.includes('threat')) caps.push('security');
    
    return caps;
  }
  
  private inferMcpTools(widgetId: string): string[] {
    const toolMap: Record<string, string[]> = {
      'SearchInterfaceWidget': ['srag.query', 'vidensarkiv.search'],
      'DarkWebMonitorWidget': ['srag.query', 'widgets.correlate'],
      'FeedIngestionWidget': ['srag.query', 'cma.ingest'],
      'AgentChatWidget': ['cma.context', 'pal.analyze.sentiment'],
      'CmaDecisionWidget': ['cma.context', 'cma.memory.retrieve'],
      // Add more mappings as needed
    };
    return toolMap[widgetId] || [];
  }
  
  private inferAutonomyLevel(category: string): 'MANUAL' | 'SEMI' | 'FULL' {
    if (category === 'agents') return 'FULL';
    if (category === 'monitoring' || category === 'security') return 'SEMI';
    return 'MANUAL';
  }
  
  getByCapability(capability: string): WidgetCapability[] {
    return Array.from(this.capabilities.values())
      .filter(w => w.capabilities.includes(capability));
  }
  
  getByCategory(category: string): WidgetCapability[] {
    return Array.from(this.capabilities.values())
      .filter(w => w.category === category);
  }
  
  getAll(): WidgetCapability[] {
    return Array.from(this.capabilities.values());
  }
}

export const widgetDiscovery = WidgetDiscoveryService.getInstance();
```

---

## PHASE 2: OSINT WIDGET FOUNDATION (Uge 2-3)

### 2.1 Base OSINT Widget Pattern

**Princip**: Følg eksisterende widget pattern fra `apps/widget-board/widgets/`

```typescript
// apps/widget-board/widgets/DomainIntelligenceWidget.tsx

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useMcpClient } from '../hooks/useMcpClient';
import { Globe, Shield, Server, AlertTriangle } from 'lucide-react';

interface DomainResult {
  domain: string;
  whois?: { registrar: string; created: string; expires: string };
  dns?: { a: string[]; mx: string[]; ns: string[] };
  ssl?: { issuer: string; validUntil: string; grade: string };
  threats?: { score: number; issues: string[] };
}

export const DomainIntelligenceWidget: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<DomainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { invoke } = useMcpClient();
  
  const handleLookup = useCallback(async () => {
    if (!domain.trim()) return;
    
    setLoading(true);
    try {
      // Use MCP tool for domain lookup
      const response = await invoke('osint.domain.lookup', { domain });
      setResult(response);
      
      // Share findings with other widgets
      await invoke('widgets.correlate', {
        sourceWidget: 'DomainIntelligenceWidget',
        findings: [{ type: 'DOMAIN_INTEL', data: response }],
        tags: ['domain', 'osint', domain]
      });
    } catch (error) {
      console.error('Domain lookup failed:', error);
    } finally {
      setLoading(false);
    }
  }, [domain, invoke]);
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domain Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter domain (e.g., example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
          />
          <Button onClick={handleLookup} disabled={loading}>
            {loading ? 'Scanning...' : 'Lookup'}
          </Button>
        </div>
        
        {result && (
          <div className="space-y-4">
            {/* WHOIS Section */}
            {result.whois && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <Server className="h-4 w-4" /> WHOIS
                </h4>
                <div className="text-sm mt-2 space-y-1">
                  <div>Registrar: {result.whois.registrar}</div>
                  <div>Created: {result.whois.created}</div>
                  <div>Expires: {result.whois.expires}</div>
                </div>
              </div>
            )}
            
            {/* DNS Section */}
            {result.dns && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" /> DNS Records
                </h4>
                <div className="text-sm mt-2 space-y-1">
                  <div>A: {result.dns.a?.join(', ') || 'N/A'}</div>
                  <div>MX: {result.dns.mx?.join(', ') || 'N/A'}</div>
                  <div>NS: {result.dns.ns?.join(', ') || 'N/A'}</div>
                </div>
              </div>
            )}
            
            {/* Threat Score */}
            {result.threats && (
              <div className={`p-3 rounded-lg ${
                result.threats.score > 70 ? 'bg-red-100 dark:bg-red-900/20' :
                result.threats.score > 30 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                'bg-green-100 dark:bg-green-900/20'
              }`}>
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Threat Score
                </h4>
                <div className="text-2xl font-bold">{result.threats.score}/100</div>
                {result.threats.issues.length > 0 && (
                  <ul className="text-sm mt-2">
                    {result.threats.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DomainIntelligenceWidget;
```

### 2.2 OSINT MCP Tool Handler

**Lokation**: `apps/backend/src/mcp/osintHandlers.ts` (ny fil)

```typescript
import { McpContext } from '@widget-tdc/mcp-types';

// Domain Intelligence Handler
export async function osintDomainLookupHandler(payload: any, ctx: McpContext): Promise<any> {
  const { domain } = payload;
  
  if (!domain) {
    throw new Error('Domain is required');
  }
  
  // Basic domain analysis (expand with real APIs later)
  const result = {
    domain,
    timestamp: new Date().toISOString(),
    whois: await fetchWhoisData(domain),
    dns: await fetchDnsRecords(domain),
    ssl: await checkSslCertificate(domain),
    threats: await checkThreatIntel(domain)
  };
  
  return result;
}

// Helper functions (placeholder - implement with real services)
async function fetchWhoisData(domain: string): Promise<any> {
  // TODO: Integrate with WHOIS API (e.g., WhoisXML, SecurityTrails)
  return {
    registrar: 'Placeholder Registrar',
    created: '2020-01-01',
    expires: '2025-01-01'
  };
}

async function fetchDnsRecords(domain: string): Promise<any> {
  // TODO: Integrate with DNS resolution
  return {
    a: ['1.2.3.4'],
    mx: ['mail.' + domain],
    ns: ['ns1.' + domain, 'ns2.' + domain]
  };
}

async function checkSslCertificate(domain: string): Promise<any> {
  // TODO: Integrate with SSL checker
  return {
    issuer: 'Let\'s Encrypt',
    validUntil: '2025-06-01',
    grade: 'A'
  };
}

async function checkThreatIntel(domain: string): Promise<any> {
  // TODO: Integrate with VirusTotal, Shodan, etc.
  return {
    score: 15,
    issues: []
  };
}

// Email Intelligence Handler
export async function osintEmailLookupHandler(payload: any, ctx: McpContext): Promise<any> {
  const { email } = payload;
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  return {
    email,
    timestamp: new Date().toISOString(),
    valid: email.includes('@'),
    domain: email.split('@')[1],
    breachCheck: {
      breached: false,
      breaches: []
    },
    reputation: {
      score: 85,
      issues: []
    }
  };
}

// IP Intelligence Handler
export async function osintIpLookupHandler(payload: any, ctx: McpContext): Promise<any> {
  const { ip } = payload;
  
  if (!ip) {
    throw new Error('IP address is required');
  }
  
  return {
    ip,
    timestamp: new Date().toISOString(),
    geolocation: {
      country: 'DK',
      city: 'Copenhagen',
      lat: 55.6761,
      lon: 12.5683
    },
    asn: {
      number: 3292,
      name: 'TDC NET'
    },
    threats: {
      score: 10,
      issues: []
    }
  };
}
```

### 2.3 Widget Registry Update

**Tilføj til**: `apps/widget-board/widgetRegistry.js`

```javascript
// Tilføj til WIDGET_REGISTRY:

'DomainIntelligenceWidget': {
    id: 'DomainIntelligenceWidget',
    name: 'Domain Intelligence',
    category: 'security',
    path: './widgets/DomainIntelligenceWidget',
    icon: 'Globe',
    defaultSize: { w: 6, h: 3 },
    description: 'Domain WHOIS, DNS, SSL and threat analysis'
},
'EmailIntelligenceWidget': {
    id: 'EmailIntelligenceWidget',
    name: 'Email Intelligence',
    category: 'security',
    path: './widgets/EmailIntelligenceWidget',
    icon: 'Mail',
    defaultSize: { w: 6, h: 2 },
    description: 'Email validation, breach checking, and reputation analysis'
},
'IPIntelligenceWidget': {
    id: 'IPIntelligenceWidget',
    name: 'IP Intelligence',
    category: 'security',
    path: './widgets/IPIntelligenceWidget',
    icon: 'Wifi',
    defaultSize: { w: 6, h: 3 },
    description: 'IP geolocation, ASN lookup, and threat analysis'
},
'GithubIntelligenceWidget': {
    id: 'GithubIntelligenceWidget',
    name: 'GitHub Intelligence',
    category: 'security',
    path: './widgets/GithubIntelligenceWidget',
    icon: 'Github',
    defaultSize: { w: 6, h: 3 },
    description: 'Repository mining, secret scanning, and committer profiling'
},
'PasteMonitorWidget': {
    id: 'PasteMonitorWidget',
    name: 'Paste Monitor',
    category: 'security',
    path: './widgets/PasteMonitorWidget',
    icon: 'FileText',
    defaultSize: { w: 6, h: 2 },
    description: 'Monitor paste sites for credential leaks and sensitive data'
},
```

---

## PHASE 3: HUGGINGFACE INTEGRATION (Uge 3-4)

### 3.1 Embedding Service Enhancement

**Lokation**: Udvid `apps/backend/src/services/embeddings/EmbeddingService.ts`

```typescript
// Tilføj HuggingFace model support

import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js
env.cacheDir = './.cache/models';
env.allowLocalModels = true;

export class HuggingFaceEmbeddings {
  private embeddingPipeline: any = null;
  private classificationPipeline: any = null;
  private nerPipeline: any = null;
  
  async initEmbeddings(): Promise<void> {
    if (!this.embeddingPipeline) {
      // Use sentence-transformers for embeddings
      this.embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }
  }
  
  async initClassification(): Promise<void> {
    if (!this.classificationPipeline) {
      // Use for threat classification
      this.classificationPipeline = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
    }
  }
  
  async initNER(): Promise<void> {
    if (!this.nerPipeline) {
      // Use for entity extraction
      this.nerPipeline = await pipeline(
        'token-classification',
        'Xenova/bert-base-NER'
      );
    }
  }
  
  async embed(text: string): Promise<number[]> {
    await this.initEmbeddings();
    const result = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  }
  
  async classify(text: string): Promise<{ label: string; score: number }> {
    await this.initClassification();
    const result = await this.classificationPipeline(text);
    return result[0];
  }
  
  async extractEntities(text: string): Promise<Array<{ entity: string; word: string; score: number }>> {
    await this.initNER();
    const result = await this.nerPipeline(text);
    return result;
  }
}

export const hfEmbeddings = new HuggingFaceEmbeddings();
```

### 3.2 MCP Tool for HuggingFace

**Tilføj til toolHandlers.ts**:

```typescript
// HuggingFace AI Tools

export async function hfEmbedHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { text } = payload;
  if (!text) throw new Error('Text is required');
  
  const embedding = await hfEmbeddings.embed(text);
  return { embedding, dimensions: embedding.length };
}

export async function hfClassifyHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { text } = payload;
  if (!text) throw new Error('Text is required');
  
  const result = await hfEmbeddings.classify(text);
  return result;
}

export async function hfNerHandler(payload: any, _ctx: McpContext): Promise<any> {
  const { text } = payload;
  if (!text) throw new Error('Text is required');
  
  const entities = await hfEmbeddings.extractEntities(text);
  return { entities };
}
```

---

## PHASE 4: KLAVIS INTEGRATION POC (Uge 4-5)

### 4.1 Vurdering af Klavis

| Aspekt | Fordel | Ulempe | Anbefaling |
|--------|--------|--------|------------|
| Progressive Discovery | Løser tool overload | External dependency | ✅ POC |
| 50+ OAuth Services | Instant integrations | Vendor lock-in | ⚠️ Evaluer |
| Enterprise Security | SOC 2, GDPR ready | Cost | ✅ Matcher krav |
| Self-hosting | Docker support | Maintenance overhead | ✅ Acceptabel |

### 4.2 Klavis POC Implementation

**Lokation**: `apps/backend/src/services/klavis/KlavisAdapter.ts`

```typescript
// Minimal Klavis integration for POC

export class KlavisAdapter {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.KLAVIS_API_KEY || '';
    this.baseUrl = process.env.KLAVIS_BASE_URL || 'https://api.klavis.ai';
  }
  
  async createStrataServer(userId: string, servers: string[]): Promise<any> {
    if (!this.apiKey) {
      return { error: 'Klavis API key not configured', fallback: true };
    }
    
    // POC: Use Klavis for external service discovery
    const response = await fetch(`${this.baseUrl}/v1/strata/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        servers
      })
    });
    
    return response.json();
  }
  
  async discoverTools(intent: string): Promise<any> {
    // Progressive discovery for tool selection
    // Fallback to local widget discovery if Klavis unavailable
    if (!this.apiKey) {
      // Use local WidgetDiscoveryService
      const { widgetDiscovery } = await import('../../../widget-board/src/services/WidgetDiscoveryService');
      return widgetDiscovery.getAll();
    }
    
    // Use Klavis progressive discovery
    const response = await fetch(`${this.baseUrl}/v1/discover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ intent })
    });
    
    return response.json();
  }
}

export const klavisAdapter = new KlavisAdapter();
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Quick Wins (Uge 1-2)
- [ ] Tilføj `widgets.invoke` MCP tool
- [ ] Tilføj `widgets.discover` MCP tool  
- [ ] Tilføj `widgets.correlate` MCP tool
- [ ] Opret `WidgetDiscoveryService.ts`
- [ ] Test widget-to-widget communication
- [ ] Dokumentation

### Phase 2: OSINT Widgets (Uge 2-3)
- [ ] `DomainIntelligenceWidget.tsx`
- [ ] `EmailIntelligenceWidget.tsx`
- [ ] `IPIntelligenceWidget.tsx`
- [ ] `GithubIntelligenceWidget.tsx`
- [ ] `PasteMonitorWidget.tsx`
- [ ] OSINT MCP handlers
- [ ] Widget registry updates
- [ ] Integration tests

### Phase 3: HuggingFace (Uge 3-4)
- [ ] Installer `@xenova/transformers`
- [ ] `HuggingFaceEmbeddings` service
- [ ] `hf.embed` MCP tool
- [ ] `hf.classify` MCP tool
- [ ] `hf.ner` MCP tool
- [ ] Integrér med eksisterende vidensarkiv

### Phase 4: Klavis POC (Uge 4-5)
- [ ] `KlavisAdapter.ts`
- [ ] Environment variables setup
- [ ] Progressive discovery integration
- [ ] Fallback til local widgets
- [ ] Evaluering af værdi

### Phase 5: Correlation Engine (Uge 5-6)
- [ ] Unified findings store (SQLite table)
- [ ] Correlation rules engine
- [ ] Auto-correlation på tværs af widgets
- [ ] Dashboard for korrelerede findings

---

## ⚠️ HVAD VI IKKE IMPLEMENTERER (ENDNU)

### Udskudt til Later Phases

1. **"Spor Following" Engine**
   - Risiko: For komplekst, kan destabilisere
   - Alternativ: TaskRecorder + EventBus giver 80% af værdien

2. **Full Neo4j Knowledge Graph**
   - Risiko: Stor infrastruktur overhead
   - Alternativ: SQLite + UnifiedGraphRAG er sufficient

3. **Custom HuggingFace Training**
   - Risiko: Kræver ML expertise, GPU resources
   - Alternativ: Pre-trained models er fine for POC

4. **Widget Marketplace**
   - Risiko: Security concerns, complexity
   - Alternativ: Static registry med dynamic discovery

---

## 📊 SUCCESS METRICS

| Metric | Mål | Måling |
|--------|-----|--------|
| Nye Widgets | +5 OSINT | Widget count |
| Nye MCP Tools | +10 | Tool registry count |
| Cross-Widget Events | >100/dag | EventBus metrics |
| HF Model Latency | <500ms | P95 latency |
| Klavis Uptime | >99% | Health checks |
| Zero Breaking Changes | 0 | Regression tests |

---

## 🔐 SECURITY CONSIDERATIONS

1. **API Keys**: Alle external services (Klavis, HuggingFace) via environment variables
2. **GDPR**: Ingen PII i correlation store uden consent
3. **Rate Limiting**: Implementér for OSINT API calls
4. **Audit Trail**: TaskRecorder logger alle tool executions

---

## 📝 KONKLUSION

Dette dokument præsenterer en **realistisk, additiv** approach til at forbedre WidgetTDC uden at ændre eksisterende arkitektur. 

**Nøgleprincipper**:
1. ✅ Byg ovenpå eksisterende MCP infrastructure
2. ✅ Følg etablerede widget patterns
3. ✅ Tilføj nye tools, fjern ikke eksisterende
4. ✅ POC external integrations før commitment
5. ✅ Bevar 100% backwards compatibility

**Forventet Outcome**: 150-200% improvement i capabilities inden for 6 uger, med 0% breaking changes.

---

**Document Owner**: Architecture Enhancement Initiative  
**Last Updated**: 25. november 2025  
**Status**: READY FOR REVIEW
