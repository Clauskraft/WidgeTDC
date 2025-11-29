
import { initializeDatabase, getDatabase } from './apps/backend/src/database/index.js';
import { initCognitiveMemory } from './apps/backend/src/mcp/memory/CognitiveMemory.js';
import { getSourceRegistry } from './apps/backend/src/mcp/SourceRegistry.js';
import { registerOutlookSource } from './apps/backend/src/mcp/autonomous/MCPIntegration.js';
import { AutonomousAgent } from './apps/backend/src/mcp/autonomous/AutonomousAgent.js';

async function testOutlookIntegration() {
    console.log('🚀 Starting Outlook Integration Test...');

    // 1. Init Database
    await initializeDatabase();
    const db = getDatabase();
    console.log('✅ Database initialized');

    // 2. Init Memory
    const memory = initCognitiveMemory(db);
    console.log('✅ Memory initialized');

    // 3. Register Source
    await registerOutlookSource();
    const registry = getSourceRegistry();
    
    const outlookSource = registry.getSource('outlook-mail');
    if (outlookSource) {
        console.log('✅ Outlook source found in registry');
    } else {
        console.error('❌ Outlook source NOT found');
        process.exit(1);
    }

    // 4. Init Agent
    const agent = new AutonomousAgent(memory, registry, null);
    console.log('✅ Autonomous Agent initialized');

    // 5. Test Query
    console.log('\n🔍 Testing Query: "Find emails about project status"');
    
    const result = await agent.executeAndLearn({
        type: 'email.search', // Matches capability
        operation: 'search',
        params: { query: 'status' },
        priority: 'normal'
    }, async (source) => {
        if (source.query) {
            return await source.query('search', { query: 'status' });
        }
        throw new Error('Source does not support query');
    });

    console.log('\n📊 Result:', JSON.stringify(result, null, 2));

    if (result.source === 'outlook-mail' && Array.isArray(result.data) && result.data.length > 0) {
        console.log('\n✅ SUCCESS: Retrieved emails from Outlook source via Autonomous Agent');
    } else {
        console.error('\n❌ FAILURE: Did not retrieve expected data');
    }
}

testOutlookIntegration().catch(console.error);
