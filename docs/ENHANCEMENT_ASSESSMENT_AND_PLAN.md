# WidgetTDC Enhancement Assessment & Implementation Plan

**Dato**: 25. november 2025  
**Status**: VURDERING KOMPLET - INTEGRERET MED TIDLIGERE ANALYSE  
**Kritisk Begrænsning**: INGEN VÆSENTLIGE ÆNDRINGER TIL EKSISTERENDE KODE  
**Version**: 2.0 - Omfatter tidligere chat-analyse af autonome widgets og dokumentgeneratorer

---

## 📊 EXECUTIVE SUMMARY

Efter grundig analyse af:
- Den eksisterende WidgetTDC kodebase (38 widgets, 30+ MCP tools)
- "500% Enhancement Architecture" dokumentet
- **Tidligere chat-analyse af autonome OSINT/Cybersecurity widgets**
- **Dokumentgenerator-widgets (PowerPoint, Word, Excel)**
- **MCP PowerPoint Server integrations (PPTAgent, MultiAgentPPT, ChatPPT-MCP)**

Denne plan præsenterer en **realistisk, additiv** implementeringsstrategi der:

1. **Bevarer 100%** af eksisterende funktionalitet
2. **Tilføjer 3 kategorier af nye widgets**: OSINT, Cybersecurity, Document Generation
3. **Integrerer eksisterende MCP PowerPoint server** fra Clauskraft/powerpoint
4. **Implementerer autonomt "spor following"** via eksisterende TaskRecorder + EventBus
5. **Udnytter PPTAgent + MultiAgentPPT** arkitekturen for dokumentgenerering

### Vurdering af Samlede Forbedringer

| Aspekt | Vurdering | Risiko | Anbefaling |
|--------|-----------|--------|------------|
| 7 OSINT Widgets | ✅ REALISTISK | LAV | Implementér gradvist |
| Autonomous Threat Hunter | ✅ REALISTISK | LAV | Følger eksisterende patterns |
| "Spor Following" Engine | ✅ MULIGT | MEDIUM | Via TaskRecorder + EventBus |
| Dokumentgeneratorer (PPT/Word/Excel) | ✅ REALISTISK | LAV | Integrér eksisterende MCP server |
| PPTAgent Integration | ✅ ADDITIVT | MEDIUM | Docker-baseret, selvstændig |
| MultiAgentPPT Arkitektur | ⚠️ KOMPLEKST | MEDIUM | POC først |
| HuggingFace Integration | ⚠️ KOMPLEKST | MEDIUM | Start med 2-3 modeller |
| Klavis Integration | ⚠️ EXTERNAL | MEDIUM | POC først |

**Samlet Vurdering**: 75% af forslagene kan implementeres sikkert inden for 8 uger uden at ændre eksisterende arkitektur.

---

## 🆕 NYT FRA TIDLIGERE CHAT-ANALYSE

### Identificerede Ressourcer til Integration

| Ressource | Type | Key Features | Integration Værdi |
|-----------|------|--------------|-------------------|
| **Clauskraft/powerpoint** | MCP Server | python-pptx, FLUX images, 7 tools | ⭐⭐⭐⭐⭐ EKSISTERER |
| **PPTAgent (icip-cas)** | Python Framework | 2-stage generation, PPTEval, Zenodo10K | ⭐⭐⭐⭐⭐ GAME CHANGER |
| **MultiAgentPPT** | Multi-Agent System | A2A + MCP + ADK, parallel agents | ⭐⭐⭐⭐⭐ PERFEKT TIL WIDGETDC |
| **ChatPPT-MCP** | Commercial MCP | 18 APIs, HTTP streaming | ⭐⭐⭐⭐ Enterprise-ready |
| **Zenodo10K Dataset** | Training Data | 10,000+ .pptx files | ⭐⭐⭐⭐⭐ CRITICAL |

### Nye Widget-Kategorier fra Analyse

```
NYE WIDGETS (fra tidligere chat):
├─ AUTONOME OSINT (3 stk)
│  ├─ AutonomousOSINTEmailWidget      (31 KB, 954 linjer)
│  ├─ AutonomousThreatHunterWidget    (34 KB, 1000+ linjer)
│  └─ MasterOrchestratorWidget        (25 KB, 800+ linjer)
│
├─ DOKUMENTGENERATORER (3 stk)
│  ├─ AutonomousPowerPointMaster      (35 KB, 1113 linjer)
│  ├─ AutonomousWordArchitect         (47 KB, 1202 linjer)
│  └─ AutonomousExcelAnalyzer         (38 KB, 1230 linjer)
│
└─ TOTAL: 6 nye enterprise-grade widgets (210 KB, 5300+ linjer)

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

## 🔄 NYT: AUTONOM "SPOR FOLLOWING" ARKITEKTUR

### Hvordan Det Virker (fra tidligere chat)

Den autonome sporopfølgning bruger **eksisterende infrastruktur** med ny orkestrering:

```
                    USER INPUT (email/domain/IP)
                              │
                              ▼
                    ┌─────────────────────┐
                    │ INVESTIGATION ENGINE │
                    │ (Multi-threaded)     │
                    └─────────┬───────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   TIER 1      │   │   TIER 2      │   │   TIER 3      │
│ (No deps)     │   │ (Depends T1)  │   │ (Depends T2)  │
├───────────────┤   ├───────────────┤   ├───────────────┤
│• Email Valid  │   │• LinkedIn     │   │• Employment   │
│• Breach Check │   │• Twitter/X    │   │• Pattern      │
│• WHOIS        │   │• Dark Web     │   │• Deep Scan    │
│• DNS Enum     │   │• Social Media │   │• CVE Check    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  DATA CORRELATION   │
                    │ (UnifiedMemorySystem)│
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  UNIFIED FINDINGS   │
                    │  Export: JSON/PDF   │
                    └─────────────────────┘
```

### Integration med Eksisterende Systemer

| Eksisterende System | Rolle i Autonomt Investigation |
|---------------------|-------------------------------|
| `TaskRecorder` | Observerer alle threads, lærer patterns |
| `EventBus` | Thread-to-thread kommunikation |
| `UnifiedMemorySystem` | Korrelation via `findHolographicPatterns()` |
| `StateGraphRouter` | State-machine for investigation flow |
| `AgentTeam.coordinate()` | Multi-agent orchestration |

### Nøgle Interfaces (fra Widget Spec)

```typescript
// Investigation Thread Interface
interface InvestigationThread {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  findings: Finding[];
  dependencies: string[];  // Thread IDs this depends on
  priority: number;        // 1-5 (5 = highest)
  requiredTools?: string[];
}

// Finding Interface
interface Finding {
  id: string;
  threadId: string;
  source: string;
  type: 'email' | 'phone' | 'breach' | 'social' | 'darkweb' | 'domain';
  data: any;
  confidence: number;  // 0-100
  relatedFindings: string[];
  timestamp: number;
}

// Widget Config Interface
interface WidgetConfig {
  id: string;
  type: string;
  version: string;
  category: 'osint' | 'cybersecurity' | 'document-generation';
  gdprCompliant: boolean;
  dataRetentionDays: number;
}
```

---

## 📄 NYT: DOKUMENTGENERATOR INTEGRATION

### MCP PowerPoint Server (Clauskraft/powerpoint)

Din eksisterende MCP server har følgende tools:

| Tool | Beskrivelse | Integration Status |
|------|-------------|-------------------|
| `create-presentation` | Opretter ny præsentation | ✅ Klar |
| `add-slide-title-only` | Titel slide | ✅ Klar |
| `add-slide-section-header` | Section header | ✅ Klar |
| `add-slide-title-content` | Titel + indhold | ✅ Klar |
| `add-slide-title-with-table` | Slide med tabel | ✅ Klar |
| `add-slide-title-with-chart` | Slide med chart | ✅ Klar |
| `add-slide-picture-with-caption` | Billede slide | ✅ Klar |
| `generate-and-save-image` | FLUX image generation | ✅ Klar |

### Integration i WidgeTDC Backend

```typescript
// apps/backend/src/services/MCPPowerPointBackend.ts

export class MCPPowerPointBackend {
  private mcpClient: MCPClient;
  
  constructor() {
    this.mcpClient = new MCPClient({
      serverCommand: 'uv',
      serverArgs: [
        '--directory',
        process.env.POWERPOINT_MCP_PATH || 'C:\\Users\\claus\\Projects\\powerpoint',
        'run',
        'powerpoint',
        '--folder-path',
        process.env.PRESENTATIONS_PATH || './presentations'
      ]
    });
  }
  
  async createPresentation(name: string): Promise<string> {
    return this.mcpClient.callTool('create-presentation', { name });
  }
  
  async addSlide(presentationName: string, slideType: string, data: any): Promise<void> {
    const toolName = `add-slide-${slideType}`;
    await this.mcpClient.callTool(toolName, {
      presentation_name: presentationName,
      ...data
    });
  }
  
  async generateImage(prompt: string, fileName: string): Promise<string> {
    const result = await this.mcpClient.callTool('generate-and-save-image', {
      prompt,
      file_name: fileName
    });
    return result.image_path;
  }
  
  async savePresentation(presentationName: string): Promise<string> {
    const result = await this.mcpClient.callTool('save-presentation', {
      presentation_name: presentationName
    });
    return result.file_path;
  }
}
```

### PPTAgent Integration (2-Stage Generation)

```typescript
// apps/backend/src/services/PPTAgentService.ts

export class PPTAgentService {
  private apiBase = 'http://localhost:9297';
  
  /**
   * Stage 1: Analyze reference presentations
   */
  async analyzeReferences(referenceFiles: string[]): Promise<AnalysisResult> {
    const response = await fetch(`${this.apiBase}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ references: referenceFiles })
    });
    return response.json();
  }
  
  /**
   * Stage 2: Generate with learned patterns
   */
  async generatePresentation(input: GenerationInput): Promise<string> {
    const response = await fetch(`${this.apiBase}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: input.sourceDocument,
        outline: input.outline,
        style_patterns: input.learnedPatterns,
        language_model: 'Qwen2.5-72B-Instruct',
        vision_model: 'gpt-4o'
      })
    });
    return (await response.json()).presentation_path;
  }
  
  /**
   * Evaluate generated presentation
   */
  async evaluatePresentation(pptxPath: string): Promise<PPTEvalResult> {
    const response = await fetch(`${this.apiBase}/api/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presentation_path: pptxPath })
    });
    return response.json(); // { content: 8.5, design: 9.2, coherence: 8.8 }
  }
}

interface AnalysisResult {
  slide_roles: string[];
  structural_patterns: any;
  content_schemas: any;
}

interface GenerationInput {
  sourceDocument: string;
  outline: string;
  learnedPatterns: any;
}

interface PPTEvalResult {
  content: number;
  design: number;
  coherence: number;
  suggestions: string[];
}
```

---

## 🏗️ OPDATERET IMPLEMENTERINGSPLAN (8 UGER)

### PHASE 0: SETUP (Dag 1-3)

```bash
# 1. Clone PPTAgent
cd C:\Users\claus\Projects
git clone https://github.com/icip-cas/PPTAgent.git

# 2. Start PPTAgent Docker container
docker pull forceless/pptagent
docker run -dt --gpus all --name pptagent \
  -e OPENAI_API_KEY=$env:OPENAI_API_KEY \
  -p 9297:9297 -p 8088:8088 \
  -v $env:USERPROFILE:/root \
  forceless/pptagent

# 3. Clone MultiAgentPPT (for research)
git clone https://github.com/johnson7788/MultiAgentPPT.git

# 4. Download Zenodo10K templates (optional)
git lfs clone https://huggingface.co/datasets/Forceless/Zenodo10K
```

### PHASE 1: Quick Wins + Autonome Widgets (Uge 1-2)

| Task | Prioritet | Ansvarlig |
|------|-----------|-----------|
| Tilføj `widgets.invoke/discover/correlate` MCP tools | HØJ | Backend |
| Kopier 3 autonome OSINT widgets til projekt | HØJ | Frontend |
| Integrér MCP PowerPoint server | HØJ | Backend |
| Test widget-to-widget communication | MEDIUM | QA |
| Registrér nye widgets i registry | HØJ | Frontend |

### PHASE 2: Dokumentgeneratorer (Uge 3-4)

| Task | Prioritet | Ansvarlig |
|------|-----------|-----------|
| Kopier 3 dokumentgenerator widgets | HØJ | Frontend |
| Implementér `MCPPowerPointBackend.ts` | HØJ | Backend |
| Implementér `PPTAgentService.ts` | MEDIUM | Backend |
| FLUX image generation integration | MEDIUM | Backend |
| Test PPT generation end-to-end | HØJ | QA |

### PHASE 3: OSINT Backend + HuggingFace (Uge 4-5)

| Task | Prioritet | Ansvarlig |
|------|-----------|-----------|
| Implementér OSINT MCP handlers | HØJ | Backend |
| Tilføj HuggingFace embeddings | MEDIUM | Backend |
| Integrér med VirusTotal/Shodan API | MEDIUM | Backend |
| Test autonomous investigation flow | HØJ | QA |

### PHASE 4: MultiAgent Orchestration (Uge 5-6)

| Task | Prioritet | Ansvarlig |
|------|-----------|-----------|
| Implementér MultiAgentOrchestrator | MEDIUM | Backend |
| Parallel research agents | MEDIUM | Backend |
| Quality checker agent | LAV | Backend |
| Streaming WebSocket updates | HØJ | Frontend |

### PHASE 5: Correlation Engine (Uge 7-8)

| Task | Prioritet | Ansvarlig |
|------|-----------|-----------|
| Unified findings store (SQLite) | MEDIUM | Backend |
| Cross-widget correlation rules | MEDIUM | Backend |
| Dashboard for korrelerede findings | MEDIUM | Frontend |
| GDPR compliance audit | HØJ | Security |

---

## 📋 WIDGET REGISTRY OPDATERINGER

```javascript
// Tilføj til apps/widget-board/widgetRegistry.js

// === AUTONOME OSINT WIDGETS ===
'AutonomousOSINTEmailWidget': {
  id: 'AutonomousOSINTEmailWidget',
  name: 'Autonomous OSINT Email',
  category: 'security',
  path: './widgets/autonomous/autonomous-osint-email-widget',
  icon: 'Mail',
  defaultSize: { w: 12, h: 8 },
  description: 'Multi-threaded email OSINT with auto spor-following'
},
'AutonomousThreatHunterWidget': {
  id: 'AutonomousThreatHunterWidget',
  name: 'Autonomous Threat Hunter',
  category: 'security',
  path: './widgets/autonomous/autonomous-threat-hunter-widget',
  icon: 'Shield',
  defaultSize: { w: 12, h: 8 },
  description: 'Cybersecurity vulnerability assessment with CVE detection'
},
'MasterOrchestratorWidget': {
  id: 'MasterOrchestratorWidget',
  name: 'Master Orchestrator',
  category: 'security',
  path: './widgets/autonomous/master-orchestrator-widget',
  icon: 'Zap',
  defaultSize: { w: 12, h: 10 },
  description: 'Combined OSINT + Cybersecurity orchestration'
},

// === DOKUMENTGENERATORER ===
'AutonomousPowerPointMaster': {
  id: 'AutonomousPowerPointMaster',
  name: 'PowerPoint Master',
  category: 'productivity',
  path: './widgets/doc-generators/autonomous-powerpoint-master',
  icon: 'Presentation',
  defaultSize: { w: 12, h: 8 },
  description: 'AI-driven presentation generation with DALL-E images'
},
'AutonomousWordArchitect': {
  id: 'AutonomousWordArchitect',
  name: 'Word Architect',
  category: 'productivity',
  path: './widgets/doc-generators/autonomous-word-architect',
  icon: 'FileText',
  defaultSize: { w: 12, h: 8 },
  description: 'Intelligent document generation with knowledge mining'
},
'AutonomousExcelAnalyzer': {
  id: 'AutonomousExcelAnalyzer',
  name: 'Excel Analyzer',
  category: 'productivity',
  path: './widgets/doc-generators/autonomous-excel-analyzer',
  icon: 'Table',
  defaultSize: { w: 12, h: 8 },
  description: 'Data-to-insights Excel with auto charts and financial models'
},
```

---

## 📊 OPDATERET SUCCESS METRICS

| Metric | Mål | Måling |
|--------|-----|--------|
| Nye Widgets | +9 (6 autonome + 3 OSINT) | Widget count |
| Nye MCP Tools | +15 | Tool registry count |
| Cross-Widget Events | >200/dag | EventBus metrics |
| Investigation Threads | <60s for 10 threads | P95 latency |
| PPT Generation | <90s for 10-slide deck | P95 latency |
| HF Model Latency | <500ms | P95 latency |
| Zero Breaking Changes | 0 | Regression tests |
| GDPR Compliance | 30-day retention | Audit |

---

## 🔐 SIKKERHEDSOVERVEJELSER (UDVIDET)

### API Keys og Secrets
- `OPENAI_API_KEY` - For PPTAgent
- `TOGETHER_API_KEY` - For FLUX image generation
- `VIRUSTOTAL_API_KEY` - For threat intel
- `SHODAN_API_KEY` - For infrastructure scanning
- Alle via environment variables, aldrig hardcoded

### GDPR Compliance
- Automatisk data retention (30 dage default)
- PII anonymization i findings
- Audit logging af alle data access
- Right to be forgotten support

### Rate Limiting
```typescript
const apiLimits = {
  'hibp': { max: 10, window: 60000 },      // 10 req/min
  'virustotal': { max: 4, window: 60000 }, // 4 req/min
  'shodan': { max: 1, window: 1000 }       // 1 req/sec
};
```

---

## 📝 KONKLUSION

Dette dokument præsenterer en **omfattende, additiv** approach til at forbedre WidgetTDC med:

1. ✅ **6 nye autonome widgets** (OSINT + Dokumentgeneratorer)
2. ✅ **MCP PowerPoint Server integration** (Clauskraft/powerpoint)
3. ✅ **PPTAgent 2-stage generation** (icip-cas)
4. ✅ **Autonomt "spor following"** via TaskRecorder + EventBus
5. ✅ **MultiAgent arkitektur** for parallel research
6. ✅ **100% backwards compatibility** med eksisterende widgets

**Forventet Outcome**: 300% improvement i capabilities inden for 8 uger, med 0% breaking changes.

**Nøgleprincipper**:
- Byg ovenpå eksisterende MCP infrastructure
- Følg etablerede widget patterns
- Tilføj nye tools, fjern ikke eksisterende
- POC external integrations før commitment
- Bevar 100% backwards compatibility

---

**Document Owner**: Architecture Enhancement Initiative  
**Last Updated**: 25. november 2025  
**Version**: 2.0 - Integreret med tidligere chat-analyse  
**Status**: READY FOR IMPLEMENTATION
