
import { initializeDatabase, getDatabase } from './database/index.js';
import { initCognitiveMemory } from './mcp/memory/CognitiveMemory.js';
import { getSourceRegistry } from './mcp/SourceRegistry.js';
import { registerOutlookSource } from './mcp/autonomous/MCPIntegration.js';
import { AutonomousAgent } from './mcp/autonomous/AutonomousAgent.js';

async function testOutlookIntegration() {
    console.log('🚀 Starting Outlook Integration Test...');

    await initializeDatabase();
    const db = getDatabase();
    console.log('✅ Database initialized');

    const memory = initCognitiveMemory(db);
    console.log('✅ Memory initialized');

    await registerOutlookSource();
    const registry = getSourceRegistry();
    
    const outlookSource = registry.getSource('outlook-mail');
    if (outlookSource) {
        console.log('✅ Outlook source found in registry');
    } else {
        console.error('❌ Outlook source NOT found');
        process.exit(1);
    }

    const agent = new AutonomousAgent(memory, registry, null);
    console.log('✅ Autonomous Agent initialized');

    console.log('\n🔍 Testing Query: "Find emails about project status"');
    
    const result = await agent.executeAndLearn({
        type: 'email.search',
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
