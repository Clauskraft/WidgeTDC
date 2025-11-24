// UnifiedMemorySystem – Phase 1 foundation
// Provides Working, Procedural, Semantic, and Episodic memory layers
// Integrates existing repositories (CMA, SRAG, PAL, Evolution, ProjectMemory)

import { CognitiveMemory } from '../memory/CognitiveMemory.js';
import { MemoryRepository } from '../../services/memory/memoryRepository.js';
import { SragRepository } from '../../services/srag/sragRepository.js';
import { PalRepository } from '../../services/pal/palRepository.js';
import { EvolutionRepository } from '../../services/evolution/evolutionRepository.js';
import { projectMemory } from '../../services/project/ProjectMemory.js';
import { McpContext, QueryIntent } from '../autonomous/index.js';

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
        // Lazy load singletons when needed
        const { initCognitiveMemory } = require('../memory/CognitiveMemory.js');
        const { getDatabase } = require('../../database/index.js');
        const db = getDatabase();
        initCognitiveMemory(db);
        this.cognitive = require('../memory/CognitiveMemory.js').cognitiveMemory;
        this.memoryRepo = new MemoryRepository();
        this.sragRepo = new SragRepository();
        this.palRepo = new PalRepository();
        this.evolutionRepo = new EvolutionRepository();
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
            this.palRepo.getRecentEvents(ctx.userId, ctx.orgId, 50),
            this.memoryRepo.searchEntities({ orgId: ctx.orgId, userId: ctx.userId, keywords: [], limit: 50 }),
            this.sragRepo.searchDocuments(ctx.orgId, ''),
            this.evolutionRepo.getRecentGenerations(10),
        ]);
        return [{ pal, cma, srag, evo }];
    }
}

export const unifiedMemorySystem = new UnifiedMemorySystem();
