// UnifiedMemorySystem – Phase 1 foundation
// Provides Working, Procedural, Semantic, and Episodic memory layers
// Integrates existing repositories (CMA, SRAG, PAL, Evolution, ProjectMemory)

import { getCognitiveMemory, initCognitiveMemory, CognitiveMemory } from '../memory/CognitiveMemory.js';
import { getDatabase } from '../../database/index.js';
import { MemoryRepository } from '../../services/memory/memoryRepository.js';
import { SragRepository } from '../../services/srag/sragRepository.js';
import { PalRepository } from '../../services/pal/palRepository.js';
import { EvolutionRepository } from '../../services/evolution/evolutionRepository.js';
import { projectMemory } from '../../services/project/ProjectMemory.js';
import { McpContext } from '@widget-tdc/mcp-types';
import { QueryIntent } from '../autonomous/DecisionEngine.js';
import { hybridSearchEngine } from './HybridSearchEngine.js';
import { emotionAwareDecisionEngine } from './EmotionAwareDecisionEngine.js';

/** WorkingMemoryState – transient context for the current request */
export interface WorkingMemoryState {
    recentEvents: any[];
    recentFeatures: any[];
    recentPatterns?: any[];
    widgetStates: Record<string, any>; // Live data fra widgets
    userMood: {
        sentiment: 'positive' | 'neutral' | 'negative' | 'stressed';
        arousal: number; // 0-1 (Hvor aktiv er brugeren?)
        lastUpdated: number;
    };
    suggestedLayout?: {
        mode: 'focus' | 'discovery' | 'alert';
        activeWidgets: string[]; // ID på widgets der bør være fremme
        theme?: string;
    };
}

/** ProductionRuleEngine – simple procedural memory placeholder */
class ProductionRuleEngine {
    constructor(private cognitive: CognitiveMemory) { }
    // TODO: implement rule extraction from cognitive patterns
    async findRules(_opts: any): Promise<any[]> { return []; }
}

export class UnifiedMemorySystem {
    // Existing repositories
    private cognitive: CognitiveMemory;
    private memoryRepo: MemoryRepository;
    private sragRepo: SragRepository;
    private palRepo: PalRepository;
    private evolutionRepo: EvolutionRepository;

    // New memory layers
    private workingMemory: Map<string, WorkingMemoryState> = new Map();
    private proceduralMemory: ProductionRuleEngine;

    constructor() {
        // Initialize repositories
        this.memoryRepo = new MemoryRepository();
        this.sragRepo = new SragRepository();
        this.palRepo = new PalRepository();
        this.evolutionRepo = new EvolutionRepository();

        // Initialize cognitive memory lazily or assume initialized
        // We cannot call getDatabase() here because it might not be ready
        // The cognitive memory should be passed in or retrieved lazily
        this.cognitive = {} as any; // Placeholder, will be set in init() or getter
        this.proceduralMemory = new ProductionRuleEngine(this.cognitive);
    }

    // New init method to be called after DB is ready
    public init() {
        const db = getDatabase();
        initCognitiveMemory(db);
        this.cognitive = getCognitiveMemory();
        this.proceduralMemory = new ProductionRuleEngine(this.cognitive);
    }

    /** Retrieve or create working memory for a user/org context */
    async getWorkingMemory(ctx: McpContext): Promise<WorkingMemoryState> {
        const key = `${ctx.orgId}:${ctx.userId}`;
        if (!this.workingMemory.has(key)) {
            const events = projectMemory.getLifecycleEvents(20);
            const features = projectMemory.getFeatures();
            this.workingMemory.set(key, { 
                recentEvents: events, 
                recentFeatures: features,
                widgetStates: {},
                userMood: { sentiment: 'neutral', arousal: 0.5, lastUpdated: Date.now() }
            });
        }
        return this.workingMemory.get(key)!;
    }

    /** Opdater widget state og kør adaptiv analyse */
    async updateWidgetState(ctx: McpContext, widgetId: string, state: any): Promise<void> {
        const wm = await this.getWorkingMemory(ctx);
        wm.widgetStates[widgetId] = { ...state, lastUpdated: Date.now() };
        
        // Trigger holographic analysis when state changes
        const patterns = await this.findHolographicPatterns(ctx);
        
        // Opdater adaptivt layout baseret på mønstre
        this.updateAdaptiveLayout(wm, patterns);
    }

    /** Persist result (e.g., tool output) into working memory for future context */
    async updateWorkingMemory(ctx: McpContext, result: any): Promise<void> {
        const key = `${ctx.orgId}:${ctx.userId}`;
        const state = this.workingMemory.get(key);
        if (state) {
            state.recentEvents = [...(state.recentEvents || []), result];
            
            // Simuleret humør-analyse baseret på interaktion
            // Hvis resultatet er en fejl -> stress op
            if (result?.error) {
                state.userMood.sentiment = 'stressed';
                state.userMood.arousal = Math.min(1, state.userMood.arousal + 0.2);
            } else {
                // Reset langsomt mod neutral
                state.userMood.arousal = Math.max(0.2, state.userMood.arousal - 0.05);
            }
            
            this.workingMemory.set(key, state);
        }
    }

    /** Enrich an incoming MCPMessage with memory context */
    async enrichMCPRequest(message: any, ctx: McpContext): Promise<any> {
        const wm = await this.getWorkingMemory(ctx);
        return { 
            ...message, 
            memoryContext: { 
                recentEvents: wm.recentEvents, 
                recentFeatures: wm.recentFeatures,
                activeWidgets: wm.widgetStates,
                systemSuggestion: wm.suggestedLayout
            } 
        };
    }

    /** Example holographic pattern correlation across subsystems */
    async findHolographicPatterns(ctx: McpContext): Promise<any[]> {
        const wm = await this.getWorkingMemory(ctx);
        const widgetData = Object.values(wm.widgetStates);

        const [pal, cma, srag] = await Promise.all([
            Promise.resolve(this.palRepo.getRecentEvents(ctx.userId, ctx.orgId, 50)).catch(() => []),
            Promise.resolve(this.memoryRepo.searchEntities({ orgId: ctx.orgId, userId: ctx.userId, keywords: [], limit: 50 })).catch(() => []),
            Promise.resolve(this.sragRepo.searchDocuments(ctx.orgId, '')).catch(() => []),
        ]);

        // Inkluder widget data i korrelationen
        return this.correlateAcrossSystems([pal, cma, srag, widgetData]);
    }

    /** Opdater layout forslag baseret på mønstre og humør */
    private updateAdaptiveLayout(wm: WorkingMemoryState, patterns: any[]) {
        // 1. Tjek for kritiske mønstre (Sikkerhed)
        const securityPattern = patterns.find(p => 
            ['threat', 'attack', 'breach', 'password', 'alert'].includes(p.keyword) && p.frequency > 2
        );

        if (securityPattern) {
            wm.suggestedLayout = {
                mode: 'alert',
                activeWidgets: ['DarkWebMonitorWidget', 'NetworkSpyWidget', 'CybersecurityOverwatchWidget'],
                theme: 'red-alert'
            };
            return;
        }

        // 2. Tjek brugerens humør (Emotion Aware)
        if (wm.userMood.sentiment === 'stressed' || wm.userMood.arousal > 0.8) {
            wm.suggestedLayout = {
                mode: 'focus',
                activeWidgets: ['StatusWidget', 'IntelligentNotesWidget'], // Kun det mest nødvendige
                theme: 'calm-blue'
            };
            return;
        }

        // 3. Default: Discovery mode hvis mange data-kilder er aktive
        if (patterns.length > 5) {
            wm.suggestedLayout = {
                mode: 'discovery',
                activeWidgets: ['VisualizerWidget', 'SearchInterfaceWidget', 'KnowledgeGraphWidget'],
                theme: 'default'
            };
        }
    }

    /** Cross-correlate patterns across subsystems */
    private correlateAcrossSystems(systems: any[]): any[] {
        const patterns: any[] = [];

        // Simple correlation: find common keywords/topics across systems
        const allKeywords = new Map<string, number>();

        if (!Array.isArray(systems)) return [];

        systems.forEach((system, idx) => {
            if (Array.isArray(system)) {
                system.forEach((item: any) => {
                    if (!item) return;
                    const text = JSON.stringify(item).toLowerCase();
                    const words = text.match(/\b\w{4,}\b/g) || [];
                    words.forEach(word => {
                        allKeywords.set(word, (allKeywords.get(word) || 0) + 1);
                    });
                });
            }
        });

        // Find keywords that appear in multiple systems (holographic pattern)
        Array.from(allKeywords.entries())
            .filter(([_, count]) => count >= 2)
            .forEach(([keyword, count]) => {
                patterns.push({
                    keyword,
                    frequency: count,
                    systems: systems.length,
                    type: 'holographic_pattern'
                });
            });

        return patterns;
    }

    /** Whole-part system health analysis */
    async analyzeSystemHealth(): Promise<SystemHealthReport> {
        const wholeSystem = {
            globalHealth: await this.calculateGlobalHealth(),
            emergentPatterns: await this.detectEmergentBehaviors(),
            systemRhythms: await this.detectTemporalCycles()
        };

        const parts = await Promise.all([
            this.componentHealth('pal'),
            this.componentHealth('cma'),
            this.componentHealth('srag'),
            this.componentHealth('evolution'),
            this.componentHealth('autonomous-agent')
        ]);

        return this.modelWholePartRelationships(wholeSystem, parts);
    }

    private async calculateGlobalHealth(): Promise<number> {
        try {
            const health = await this.cognitive.getSourceHealth('system');
            return health?.healthScore || 0.8; // Default to 80% if no data
        } catch {
            return 0.8;
        }
    }

    private async detectEmergentBehaviors(): Promise<any[]> {
        // Placeholder: detect patterns that emerge from system interactions
        return [];
    }

    private async detectTemporalCycles(): Promise<any[]> {
        // Placeholder: detect recurring patterns over time
        return [];
    }

    private async componentHealth(component: string): Promise<ComponentHealth> {
        try {
            if (!this.cognitive || !this.cognitive.getSourceHealth) {
                 return {
                    name: component,
                    healthScore: 0.8, // Default optimistic
                    latency: 0,
                    successRate: 0.9
                };
            }
            const health = await this.cognitive.getSourceHealth(component);
            return {
                name: component,
                healthScore: health?.healthScore || 0.8,
                latency: health?.latency?.p50 || 0,
                successRate: health?.successRate || 0.9
            };
        } catch {
            return {
                name: component,
                healthScore: 0.8,
                latency: 0,
                successRate: 0.9
            };
        }
    }

    private modelWholePartRelationships(whole: any, parts: ComponentHealth[]): SystemHealthReport {
        const avgPartHealth = parts.reduce((sum, p) => sum + p.healthScore, 0) / parts.length;
        const wholeHealth = whole.globalHealth;

        return {
            globalHealth: wholeHealth,
            componentHealth: parts,
            emergentPatterns: whole.emergentPatterns,
            systemRhythms: whole.systemRhythms,
            wholePartRatio: wholeHealth / Math.max(avgPartHealth, 0.1), // How whole relates to parts
            healthVariance: this.calculateVariance(parts.map(p => p.healthScore))
        };
    }

    private calculateVariance(values: number[]): number {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }
}

interface ComponentHealth {
    name: string;
    healthScore: number;
    latency: number;
    successRate: number;
}

interface SystemHealthReport {
    globalHealth: number;
    componentHealth: ComponentHealth[];
    emergentPatterns: any[];
    systemRhythms: any[];
    wholePartRatio: number;
    healthVariance: number;
}

export const unifiedMemorySystem = new UnifiedMemorySystem();
