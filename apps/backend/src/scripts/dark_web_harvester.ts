import 'dotenv/config';
import neo4j from 'neo4j-driver';
import * as path from 'path';
import { fileURLToPath } from 'url';

// SHIM: Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RANSOMWATCH_FEED = 'https://raw.githubusercontent.com/joshhighet/ransomwatch/main/posts.json';

async function harvestDarkWeb() {
    console.log('🌑 Operation Dark Sentry: Initializing...');
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
        console.error('❌ ERROR: Missing Neo4j credentials');
        process.exit(1);
    }

    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
        console.log('📡 Intercepting Ransomwatch feed...');
        const response = await fetch(RANSOMWATCH_FEED);
        if (!response.ok) throw new Error(`Failed to fetch feed: ${response.statusText}`);
        
        const allPosts = await response.json() as any[];
        console.log(`📦 Intercepted ${allPosts.length} leak posts.`);

        // Sort by date descending and take top 50
        const recentPosts = allPosts
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 50);

        console.log(`⚡ Processing ${recentPosts.length} most recent threats...`);

        let nodesCreated = 0;
        const groupCounts: Record<string, number> = {};

        for (const post of recentPosts) {
            // Data normalization
            const actorName = post.group_name || 'Unknown Actor';
            const victimTitle = post.post_title || 'Unknown Victim';
            const date = post.discovered || new Date().toISOString();
            
            groupCounts[actorName] = (groupCounts[actorName] || 0) + 1;

            await session.run(`
                MERGE (actor:ThreatActor {name: $actorName})
                ON CREATE SET actor.firstSeen = $date
                ON MATCH SET actor.lastSeen = $date
                
                MERGE (victim:Victim {name: $victimTitle})
                ON CREATE SET victim.discovered = $date
                
                MERGE (actor)-[r:TARGETED]->(victim)
                SET r.date = $date, r.source = 'ransomwatch'
            `, { actorName, victimTitle, date });
            
            nodesCreated++;
            if (nodesCreated % 10 === 0) process.stdout.write('.');
        }

        console.log(`\n✅ Intelligence Injection Complete. Processed ${nodesCreated} attacks.`);
        
        // Sort groups by activity
        const topGroups = Object.entries(groupCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
            
        console.log('\n📊 Top Active Threat Actors (Recent Sample):');
        topGroups.forEach(([group, count]) => console.log(`- ${group}: ${count} victims`));

    } catch (error) {
        console.error('💥 Sentry Failure:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

harvestDarkWeb();
