import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mocks to ensure they are available for vi.mock
const { mockSession, mockDriver } = vi.hoisted(() => {
    const mockRun = vi.fn();
    const mockCloseSession = vi.fn();
    const session = {
        run: mockRun,
        close: mockCloseSession
    };

    const mockVerifyConnectivity = vi.fn();
    const mockCloseDriver = vi.fn();
    const driver = {
        session: vi.fn().mockReturnValue(session),
        verifyConnectivity: mockVerifyConnectivity,
        close: mockCloseDriver
    };

    return { 
        mockSession: session, 
        mockDriver: driver 
    };
});

vi.mock('neo4j-driver', () => ({
    default: {
        driver: vi.fn(() => mockDriver),
        auth: {
            basic: vi.fn()
        },
        session: {
            READ: 'READ',
            WRITE: 'WRITE'
        },
        isInt: (val: any) => val && typeof val.toNumber === 'function',
        int: (val: number) => ({ toNumber: () => val })
    }
}));

// Import after mocking
import { Neo4jAdapter } from '../adapters/Neo4jAdapter';

describe('Neo4jAdapter (Immunforsvar)', () => {
    let adapter: Neo4jAdapter;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Reset singleton (using a dirty cast because it's private/static)
        (Neo4jAdapter as any).instance = null;
        
        // Re-instantiate
        adapter = Neo4jAdapter.getInstance();
        
        // Mock successful connection by default
        // We need to access the mocked functions directly
        mockDriver.verifyConnectivity.mockResolvedValue(undefined);
        mockSession.run.mockResolvedValue({ records: [] });
    });

    it('skal forbinde til Cloud Cortex ved start', async () => {
        // Connection is async in constructor, give it a microtask
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mockDriver.verifyConnectivity).toHaveBeenCalled();
    });

    it('skal execute query successfully', async () => {
        const mockRecord = {
            keys: ['n'],
            get: (key: string) => ({ labels: ['Test'], properties: { name: 'TestNode' }, identity: { toString: () => '1' } })
        };
        mockSession.run.mockResolvedValueOnce({ records: [mockRecord] });

        const result = await adapter.executeQuery('MATCH (n) RETURN n');
        
        expect(mockSession.run).toHaveBeenCalledWith('MATCH (n) RETURN n', {});
        expect(result).toHaveLength(1);
        expect(result[0].n).toBeDefined();
    });

    it('skal håndtere connection failure (Circuit Breaker)', async () => {
        // Force failure
        mockDriver.verifyConnectivity.mockRejectedValue(new Error('Connection failed'));
        
        // Re-init to trigger connect() again
        (Neo4jAdapter as any).instance = null;
        adapter = Neo4jAdapter.getInstance();
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(adapter.isHealthy()).toBe(false);
    });

    it('skal aktivere Circuit Breaker ved gentagne fejl', async () => {
         // Simulate 5 consecutive failures
        mockSession.run.mockRejectedValue(new Error('Database exploded'));

        // Run 5 queries that fail
        for (let i = 0; i < 5; i++) {
            try { await adapter.executeQuery('MATCH (n) RETURN n'); } catch (e) {}
        }

        // The 6th query should fail WITHOUT hitting the driver (Circuit Open)
        // The adapter checks the circuit breaker *before* ensuring connection/getting session
        try {
            await adapter.executeQuery('MATCH (n) RETURN n');
        } catch (error: any) {
            expect(error.message).toContain('circuit OPEN');
        }
    });
});