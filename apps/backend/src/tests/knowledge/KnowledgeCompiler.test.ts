/**
 * KnowledgeCompiler Test Suite
 * Tests for the system state aggregation service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../adapters/Neo4jAdapter.js', () => ({
    neo4jAdapter: {
        runQuery: vi.fn().mockResolvedValue([]),
        healthCheck: vi.fn().mockResolvedValue(true)
    }
}));

vi.mock('../../services/HyperLog.js', () => ({
    hyperLog: {
        log: vi.fn(),
        getEvents: vi.fn().mockReturnValue([]),
        getRecentEvents: vi.fn().mockReturnValue([]),
        exportForAnalysis: vi.fn().mockReturnValue({ events: [], summary: {} }),
        getHealingHistory: vi.fn().mockReturnValue([])
    }
}));

vi.mock('../../services/SelfHealingAdapter.js', () => ({
    selfHealing: {
        getSystemStatus: vi.fn().mockReturnValue({
            overallHealth: 'HEALTHY',
            services: [],
            uptime: 0,
            lastIncident: null
        }),
        getHealingStats: vi.fn().mockReturnValue({
            attempts: 0,
            successes: 0,
            failures: 0
        })
    }
}));

describe('KnowledgeCompiler', () => {
    let knowledgeCompiler: any;
    let neo4jAdapter: any;
    let hyperLog: any;
    let selfHealing: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Import mocked modules
        const neo4jModule = await import('../../adapters/Neo4jAdapter.js');
        const hyperLogModule = await import('../../services/HyperLog.js');
        const selfHealingModule = await import('../../services/SelfHealingAdapter.js');
        
        neo4jAdapter = neo4jModule.neo4jAdapter;
        hyperLog = hyperLogModule.hyperLog;
        selfHealing = selfHealingModule.selfHealing;

        // Import the actual service
        const module = await import('../../services/Knowledge/KnowledgeCompiler.js');
        knowledgeCompiler = module.knowledgeCompiler;
    });

    afterEach(() => {
        knowledgeCompiler.stopAutoCompilation();
    });

    describe('compile()', () => {
        it('should return valid SystemStateSummary structure', async () => {
            const result = await knowledgeCompiler.compile();

            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('health');
            expect(result).toHaveProperty('activity');
            expect(result).toHaveProperty('insights');
            expect(result).toHaveProperty('recommendations');
            expect(result).toHaveProperty('recentEvents');
            expect(result).toHaveProperty('graphStats');
        });

        it('should calculate health score correctly for HEALTHY status', async () => {
            selfHealing.getSystemStatus.mockReturnValue({
                overallHealth: 'HEALTHY',
                services: [
                    { name: 'Neo4j', status: 'healthy' },
                    { name: 'SQLite', status: 'healthy' }
                ],
                uptime: 1000,
                lastIncident: null
            });
            selfHealing.getHealingStats.mockReturnValue({
                attempts: 0,
                successes: 0,
                failures: 0
            });

            const result = await knowledgeCompiler.compile();

            expect(result.health.overall).toBe('HEALTHY');
            expect(result.health.score).toBeGreaterThanOrEqual(90);
        });

        it('should calculate health score correctly for DEGRADED status', async () => {
            selfHealing.getSystemStatus.mockReturnValue({
                overallHealth: 'DEGRADED',
                services: [
                    { name: 'Neo4j', status: 'healthy' },
                    { name: 'Redis', status: 'unhealthy' }
                ],
                uptime: 900,
                lastIncident: new Date().toISOString()
            });
            selfHealing.getHealingStats.mockReturnValue({
                attempts: 5,
                successes: 3,
                failures: 2
            });

            const result = await knowledgeCompiler.compile();

            expect(result.health.overall).toBe('DEGRADED');
            expect(result.health.score).toBeLessThan(100);
        });

        it('should generate insights when errors exceed threshold', async () => {
            const errorEvents = Array(15).fill(null).map((_, i) => ({
                id: `evt-${i}`,
                eventType: 'ERROR_OCCURRED',
                timestamp: Date.now() - (i * 1000),
                data: { message: `Error ${i}` }
            }));
            
            hyperLog.getRecentEvents.mockReturnValue(errorEvents);

            const result = await knowledgeCompiler.compile();

            const errorInsight = result.insights.find((i: any) => 
                i.type === 'anomaly' && i.title.includes('Error')
            );
            expect(errorInsight).toBeDefined();
        });
    });

    describe('getSystemSummary()', () => {
        it('should use cache when available and not forcing refresh', async () => {
            // First call compiles
            await knowledgeCompiler.getSystemSummary(false);
            
            // Second call should use cache
            const compileSpy = vi.spyOn(knowledgeCompiler, 'compile');
            await knowledgeCompiler.getSystemSummary(false);
            
            expect(compileSpy).not.toHaveBeenCalled();
        });

        it('should force recompilation when refresh=true', async () => {
            await knowledgeCompiler.getSystemSummary(false);

            const result1 = await knowledgeCompiler.getSystemSummary(true);
            await new Promise(resolve => setTimeout(resolve, 5));
            const result2 = await knowledgeCompiler.getSystemSummary(true);

            expect(result1.timestamp).not.toBeUndefined();
            expect(result2.timestamp).not.toBeUndefined();
            expect(new Date(result2.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(result1.timestamp).getTime());
        });
    });

    describe('Neo4j failure handling', () => {
        it('should handle Neo4j connection failure gracefully', async () => {
            neo4jAdapter.runQuery.mockRejectedValue(new Error('Neo4j unavailable'));

            const result = await knowledgeCompiler.compile();

            expect(result).toBeDefined();
            expect(result.graphStats.totalNodes).toBe(0);
            expect(result.graphStats.totalRelationships).toBe(0);
        });
    });

    describe('auto-compilation', () => {
        it('should start and stop auto-compilation', async () => {
            knowledgeCompiler.startAutoCompilation(1000);
            expect(knowledgeCompiler.isAutoCompiling()).toBe(true);

            knowledgeCompiler.stopAutoCompilation();
            expect(knowledgeCompiler.isAutoCompiling()).toBe(false);
        });
    });
});
