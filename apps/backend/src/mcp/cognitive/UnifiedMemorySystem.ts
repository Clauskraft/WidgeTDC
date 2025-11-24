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
import { McpContext, QueryIntent } from '../autonomous/index.js';
import { hybridSearchEngine } from './HybridSearchEngine.js';
import { emotionAwareDecisionEngine } from './EmotionAwareDecisionEngine.js';

/** WorkingMemoryState – transient context for the current request */
export interface WorkingMemoryState {
    recentEvents: any[];
    recentFeatures: any[];
    // extend as needed
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
            this.workingMemory.set(key, { recentEvents: events, recentFeatures: features });
        }
        return this.workingMemory.get(key)!;
    }

    /** Persist result (e.g., tool output) into working memory for future context */
    async updateWorkingMemory(ctx: McpContext, result: any): Promise<void> {
        const key = `${ctx.orgId}:${ctx.userId}`;
        const state = this.workingMemory.get(key);
        if (state) {
            state.recentEvents = [...(state.recentEvents || []), result];
            this.workingMemory.set(key, state);
        }
    }

    /** Enrich an incoming MCPMessage with memory context */
    async enrichMCPRequest(message: any, ctx: McpContext): Promise<any> {
        const wm = await this.getWorkingMemory(ctx);
        return { ...message, memoryContext: { recentEvents: wm.recentEvents, recentFeatures: wm.recentFeatures } };
    }

    /** Example holographic pattern correlation across subsystems */
    async findHolographicPatterns(ctx: McpContext): Promise<any[]> {
        const [pal, cma, srag, evo] = await Promise.all([
            this.palRepo.getRecentEvents(ctx.userId, ctx.orgId, 50).catch(() => []),
            this.memoryRepo.searchEntities({ orgId: ctx.orgId, userId: ctx.userId, keywords: [], limit: 50 }).catch(() => []),
            this.sragRepo.searchDocuments(ctx.orgId, '').catch(() => []),
            this.evolutionRepo.getRecentGenerations(10).catch(() => []),
        ]);

        // Cross-correlate for "holographic" patterns
        return this.correlateAcrossSystems([pal, cma, srag, evo]);
    }

    /** Cross-correlate patterns across subsystems */
    private correlateAcrossSystems(systems: any[]): any[] {
        const patterns: any[] = [];

        // Simple correlation: find common keywords/topics across systems
        const allKeywords = new Map<string, number>();

        systems.forEach((system, idx) => {
            if (Array.isArray(system)) {
                system.forEach((item: any) => {
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
            const health = await this.cognitive.getSourceHealth(component);
            return {
                name: component,
                healthScore: health?.healthScore || 0.8,
                latency: health?.latencyP50 || 0,
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
