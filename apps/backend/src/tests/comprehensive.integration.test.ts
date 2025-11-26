/**
 * Comprehensive Test Suite
 * Tests all major system components
 */

import { neo4jService } from '../database/Neo4jService';
import { hitlSystem } from '../platform/HumanInTheLoop';
import { pluginManager } from '../platform/PluginSystem';
import { observabilitySystem } from '../mcp/cognitive/ObservabilitySystem';

describe('System Integration Tests', () => {
    beforeAll(async () => {
        // Setup test environment
        await neo4jService.connect();
    });

    afterAll(async () => {
        // Cleanup
        await neo4jService.disconnect();
    });

    describe('Neo4j Integration', () => {
        test('should connect to Neo4j', async () => {
            const healthy = await neo4jService.healthCheck();
            expect(healthy).toBe(true);
        });

        test('should create and retrieve node', async () => {
            const node = await neo4jService.createNode(['TestNode'], { name: 'Test' });
            expect(node.id).toBeDefined();

            const retrieved = await neo4jService.getNodeById(node.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.properties.name).toBe('Test');

            await neo4jService.deleteNode(node.id);
        });
    });

    describe('Human-in-the-Loop', () => {
        test('should classify task risk correctly', () => {
            const safeRisk = hitlSystem.classifyRisk('read_operation', {});
            expect(safeRisk).toBe('safe');

            const highRisk = hitlSystem.classifyRisk('data_deletion', { deletesData: true });
            expect(highRisk).toBe('critical');
        });

        test('should request and approve task', async () => {
            const approval = await hitlSystem.requestApproval(
                'test-task-1',
                'data_modification',
                'Test modification',
                'test-user'
            );

            expect(approval.status).toBe('pending');

            const approved = await hitlSystem.approve(approval.id, 'admin');
            expect(approved.status).toBe('approved');
        });

        test('should activate kill switch', () => {
            hitlSystem.activateKillSwitch('admin', 'Test');
            expect(hitlSystem.isKillSwitchActive()).toBe(true);

            hitlSystem.deactivateKillSwitch('admin');
            expect(hitlSystem.isKillSwitchActive()).toBe(false);
        });
    });

    describe('Plugin System', () => {
        test('should register and load plugin', async () => {
            const testPlugin = {
                metadata: {
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin',
                    author: 'Test',
                },
                hooks: {
                    onLoad: async () => {
                        console.log('Test plugin loaded');
                    },
                },
            };

            await pluginManager.registerPlugin(testPlugin);
            expect(pluginManager.isPluginLoaded('test-plugin')).toBe(true);

            await pluginManager.unloadPlugin('test-plugin');
            expect(pluginManager.isPluginLoaded('test-plugin')).toBe(false);
        });
    });

    describe('Observability', () => {
        test('should create and track spans', () => {
            const spanId = observabilitySystem.startSpan('test-operation');
            expect(spanId).toBeDefined();

            observabilitySystem.addTags(spanId, { test: true });
            observabilitySystem.addLog(spanId, 'Test log');
            observabilitySystem.endSpan(spanId, 'success');

            const dashboard = observabilitySystem.getDashboardData();
            expect(dashboard.totalTraces).toBeGreaterThan(0);
        });
    });

    describe('Health Checks', () => {
        test('should return healthy status', async () => {
            // Test database health
            const dbHealthy = await neo4jService.healthCheck();
            expect(dbHealthy).toBe(true);
        });
    });
});

describe('API Endpoint Tests', () => {
    test('should handle approval requests', async () => {
        // This would test actual API endpoints
        // For now, just verify the system works
        const approval = await hitlSystem.requestApproval(
            'api-test-1',
            'external_api_call',
            'Test API call',
            'api-user'
        );

        expect(approval).toBeDefined();
        expect(approval.riskLevel).toBe('high');
    });
});

describe('Performance Tests', () => {
    test('should handle concurrent operations', async () => {
        const operations = [];
        for (let i = 0; i < 10; i++) {
            operations.push(
                neo4jService.createNode(['PerfTest'], { index: i })
            );
        }

        const results = await Promise.all(operations);
        expect(results.length).toBe(10);

        // Cleanup
        for (const result of results) {
            await neo4jService.deleteNode(result.id);
        }
    });
});

export { };
