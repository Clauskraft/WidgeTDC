import { neo4jService } from '../database/Neo4jService';
import { getDatabase } from '../database/index';

export async function runSmokeTests() {
    console.log('🧪 Running Smoke Tests...\n');

    const results = {
        passed: 0,
        failed: 0,
        tests: [] as Array<{ name: string; status: 'PASS' | 'FAIL'; error?: string }>
    };

    // Test 1: Database Connectivity
    try {
        const db = getDatabase();
        const result = db.prepare('SELECT 1 as test').get() as any;
        if (result.test === 1) {
            console.log('✅ SQLite Database: Connected');
            results.passed++;
            results.tests.push({ name: 'SQLite Connection', status: 'PASS' });
        }
    } catch (error) {
        console.error('❌ SQLite Database: Failed', error);
        results.failed++;
        results.tests.push({ name: 'SQLite Connection', status: 'FAIL', error: String(error) });
    }

    // Test 2: Neo4j Connectivity
    try {
        await neo4jService.connect();
        const healthy = await neo4jService.healthCheck();
        if (healthy) {
            console.log('✅ Neo4j Database: Connected');
            results.passed++;
            results.tests.push({ name: 'Neo4j Connection', status: 'PASS' });
        } else {
            throw new Error('Health check failed');
        }
        await neo4jService.disconnect();
    } catch (error) {
        console.error('❌ Neo4j Database: Failed', error);
        results.failed++;
        results.tests.push({ name: 'Neo4j Connection', status: 'FAIL', error: String(error) });
    }

    // Test 3: Memory Tables Exist
    try {
        const db = getDatabase();
        const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'memory_%'
    `).all() as any[];

        const requiredTables = ['memory_entities', 'memory_relations', 'memory_tags'];
        const existingTables = tables.map(t => t.name);
        const allExist = requiredTables.every(t => existingTables.includes(t));

        if (allExist) {
            console.log('✅ Memory Tables: All present');
            results.passed++;
            results.tests.push({ name: 'Memory Tables', status: 'PASS' });
        } else {
            throw new Error(`Missing tables: ${requiredTables.filter(t => !existingTables.includes(t)).join(', ')}`);
        }
    } catch (error) {
        console.error('❌ Memory Tables: Failed', error);
        results.failed++;
        results.tests.push({ name: 'Memory Tables', status: 'FAIL', error: String(error) });
    }

    // Test 4: Environment Variables
    try {
        const requiredEnvVars = ['NODE_ENV'];
        const missing = requiredEnvVars.filter(v => !process.env[v]);

        if (missing.length === 0) {
            console.log('✅ Environment Variables: All set');
            results.passed++;
            results.tests.push({ name: 'Environment Variables', status: 'PASS' });
        } else {
            throw new Error(`Missing: ${missing.join(', ')}`);
        }
    } catch (error) {
        console.error('❌ Environment Variables: Failed', error);
        results.failed++;
        results.tests.push({ name: 'Environment Variables', status: 'FAIL', error: String(error) });
    }

    // Summary
    console.log('\n📊 Smoke Test Summary:');
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Total:  ${results.passed + results.failed}`);

    if (results.failed > 0) {
        console.log('\n❌ Some tests failed:');
        results.tests.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`   - ${t.name}: ${t.error}`);
        });
        process.exit(1);
    } else {
        console.log('\n🎉 All smoke tests passed!');
        process.exit(0);
    }
}

// Run if executed directly
runSmokeTests().catch(error => {
    console.error('Smoke tests crashed:', error);
    process.exit(1);
});
