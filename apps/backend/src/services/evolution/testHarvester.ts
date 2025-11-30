/**
 * 🧪 OMNI-HARVESTER TEST RUNNER
 * 
 * Run: npx ts-node src/services/evolution/testHarvester.ts
 */

import { OmniHarvester } from './OmniHarvester';
import path from 'path';

async function main() {
  console.log('🧪 Starting OmniHarvester V2 Test...\n');
  
  // Test with the harvested folder specifically
  const testPath = path.resolve(__dirname, '../../../harvested');
  
  console.log(`📂 Testing path: ${testPath}\n`);
  
  const harvester = new OmniHarvester(testPath, {
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'password'
  });
  
  try {
    // Run the harvest
    const result = await harvester.harvest();
    
    console.log('\n📊 HARVEST RESULTS:');
    console.log(JSON.stringify(result, null, 2));
    
    // Get final graph stats
    console.log('\n📈 FINAL GRAPH STATS:');
    const stats = await harvester.getStats();
    console.log(JSON.stringify(stats, null, 2));
    
  } catch (error) {
    console.error('❌ Harvest failed:', error);
  } finally {
    await harvester.close();
  }
}

main().catch(console.error);
