import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';
import neo4j from 'neo4j-driver';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
async function huntZombies() {
    console.log('🧟 Operation Zombie Hunter starting...');
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (f:File)
            WHERE (f.language = 'TypeScript' OR f.extension = '.ts' OR f.extension = '.tsx')
              AND NOT ()-[:DEPENDS_ON]->(f)
              AND NOT f.name ENDS WITH '.test.ts'
              AND NOT f.name ENDS WITH '.spec.ts'
              AND NOT f.name = 'index.ts'
              AND NOT f.name = 'main.tsx'
              AND NOT f.name = 'App.tsx'
              AND NOT f.name STARTS WITH 'vite'
              AND NOT f.name STARTS WITH 'eslint'
              AND NOT f.name STARTS WITH 'playwright'
              AND NOT f.name STARTS WITH 'vitest'
              AND NOT f.relativePath CONTAINS 'scripts'
              AND NOT f.relativePath CONTAINS 'tests'
              AND NOT f.relativePath CONTAINS 'config'
            RETURN f.relativePath as path, f.name as name, f.size as size
            ORDER BY f.relativePath
        `);
        const zombies = result.records.map(r => {
            const s = r.get('size');
            const size = neo4j.isInt(s) ? s.toNumber() : Number(s);
            return {
                path: r.get('path'),
                name: r.get('name'),
                size: isNaN(size) ? 0 : size
            };
        });
        console.log(`Found ${zombies.length} potential zombie files.`);
        let report = '# 🧟 Zombie Code Report\n\n';
        report += `**Date:** ${new Date().toISOString()}\n`;
        report += `**Total Potential Zombies:** ${zombies.length}\n\n`;
        report += '> These files are not imported by any other TypeScript file in the project (based on static analysis).\n';
        report += '> **Verify manually** before deleting.\n\n';
        report += '| File Path | Size (Bytes) |\n';
        report += '|-----------|--------------|\n';
        for (const z of zombies) {
            report += '| `' + z.path + '` | ' + z.size + ' |\n';
        }
        const reportPath = resolve(__dirname, '../../../../docs/ZOMBIE_CODE_REPORT.md');
        writeFileSync(reportPath, report);
        console.log(`📝 Report generated at: ${reportPath}`);
    }
    catch (error) {
        console.error('❌ Zombie Hunter failed:', error.message);
    }
    finally {
        await session.close();
        await driver.close();
    }
}
huntZombies();
