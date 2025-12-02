import 'dotenv/config';
import neo4j from 'neo4j-driver';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findZombies() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !password) {
    console.error('❌ FEJL: Mangler Neo4j credentials');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    const query = `
      MATCH (f:File)
      WHERE f.path ENDS WITH '.ts' 
      AND NOT ()-[:DEPENDS_ON]->(f)
      AND NOT f.name ENDS WITH 'index.ts'
      AND NOT f.name ENDS WITH 'server.ts'
      AND NOT f.name ENDS WITH '.d.ts'
      AND NOT f.name ENDS WITH '.test.ts' 
      AND NOT f.name ENDS WITH '.spec.ts'
      AND NOT f.path CONTAINS 'node_modules'
      RETURN f.path as path, f.name as name
      ORDER BY f.path
    `;

    const result = await session.run(query);
    const zombies = result.records.map(r => r.get('path'));

    console.log(`🧟 Found ${zombies.length} potential zombies.`);
    
    const reportPath = path.resolve(__dirname, '../../../../docs/ZOMBIE_CODE_REPORT.md');
    const reportContent = `# 🧟 Zombie Code Report
Generated: ${new Date().toISOString()}
Total: ${zombies.length}

## Potential Dead Code
${zombies.map(z => `- ${z}`).join('\n')}
`;

    fs.writeFileSync(reportPath, reportContent);
    console.log(`📝 Report saved to: ${reportPath}`);
    
    // Output top 10 for CLI
    zombies.slice(0, 10).forEach(z => console.log(`- ${z}`));
    if (zombies.length > 10) console.log(`... and ${zombies.length - 10} more.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

findZombies();
