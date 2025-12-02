import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import neo4j from 'neo4j-driver';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

async function mapLibraries() {
    console.log('🗺️  The Cartographer: Mapping external dependencies...');
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    const session = driver.session();

    try {
        // 1. Fetch all TypeScript files
        console.log('📥 Fetching TypeScript nodes...');
        const result = await session.run(`
            MATCH (f:File) 
            WHERE f.language = 'TypeScript' OR f.extension = '.ts' OR f.extension = '.tsx'
            RETURN f.path as absolutePath, f.id as id
        `);

        const files = result.records.map(r => ({
            absolutePath: r.get('absolutePath'),
            id: r.get('id')
        }));

        console.log(`Found ${files.length} TS files. Scanning for libraries...`);

        let librariesMapped = 0;
        const libraryUsage: Record<string, number> = {};

        for (const file of files) {
            try {
                if (!existsSync(file.absolutePath)) {
                    continue;
                }

                const content = readFileSync(file.absolutePath, 'utf-8');
                // Regex to capture import sources
                const importRegex = /import\s+(?:[\s\S]*?from\s+)?['"](.*?)['"]/g;
                // Also capture dynamic imports and requires if possible, but stick to static imports for now as per weave_graph logic
                
                let match;
                while ((match = importRegex.exec(content)) !== null) {
                    const importPath = match[1];
                    
                    // Filter for libraries: NOT starting with . or / or absolute windows paths (C:\...)
                    // And usually libraries don't start with @widget-tdc (monorepo packages) unless we want to map those as libs too?
                    // The instruction says: "Hvis stien IKKE starter med . eller /, er det et Library"
                    
                    if (importPath.startsWith('.') || importPath.startsWith('/') || importPath.match(/^[a-zA-Z]:/)) {
                        continue; 
                    }

                    // Clean library name (e.g., 'neo4j-driver/lib/types' -> 'neo4j-driver')
                    // Handle scoped packages like '@scope/pkg/sub' -> '@scope/pkg'
                    let libName = importPath;
                    if (libName.startsWith('@')) {
                        const parts = libName.split('/');
                        if (parts.length >= 2) {
                            libName = `${parts[0]}/${parts[1]}`;
                        }
                    } else {
                        const parts = libName.split('/');
                        if (parts.length >= 1) {
                            libName = parts[0];
                        }
                    }

                    // Skip internal monorepo packages if desired, but "Supply Chain" usually implies everything external to the *file*.
                    // However, to distinguish 3rd party from internal packages, we might want to tag them differently.
                    // For now, treat everything that looks like a package as a Library.

                    // Neo4j Action
                    await session.run(`
                        MERGE (lib:Library {name: $libName})
                        WITH lib
                        MATCH (f:File {id: $fileId})
                        MERGE (f)-[r:USES]->(lib)
                    `, { libName, fileId: file.id });

                    librariesMapped++;
                    libraryUsage[libName] = (libraryUsage[libName] || 0) + 1;
                    
                    if (librariesMapped % 50 === 0) process.stdout.write('.');
                }
            } catch (err) {
                // console.error(`Error parsing ${file.absolutePath}:`, err);
            }
        }

        console.log(`\n✅ Mapping complete. Mapped ${librariesMapped} library usages.`);

        // Run The Bloat Report Query
        const bloatResult = await session.run(`
            MATCH (l:Library)<-[r:USES]-(f:File) 
            RETURN l.name as name, count(r) as UsageCount 
            ORDER BY UsageCount DESC
            LIMIT 10
        `);

        console.log('\n📊 Top 10 Libraries:');
        bloatResult.records.forEach(r => {
            console.log(`- ${r.get('name')}: ${r.get('UsageCount')}`);
        });

    } catch (error) {
        console.error('❌ Cartographer failed:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

mapLibraries();
