import { neo4jService } from '../services/Neo4jService';

async function inspectData() {
  console.log('🕵️ Inspecting Neo4j Data...');
  
  try {
    // Check Node Counts
    const counts = await neo4jService.query(`
      MATCH (n) 
      RETURN labels(n) as label, count(n) as count
    `);
    console.log('📊 Node Counts:', counts);

    // Inspect Tenders
    const tenders = await neo4jService.query(`
      MATCH (t:Tender) 
      RETURN t.title, t.keywords, keys(t) as properties 
      LIMIT 5
    `);
    console.log('📄 Tender Samples:', JSON.stringify(tenders, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await neo4jService.disconnect();
  }
}

inspectData();
