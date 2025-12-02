import neo4j from 'neo4j-driver';
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
const session = driver.session();
async function debug() {
    // Check DEPENDS_ON relations
    const result1 = await session.run("MATCH ()-[r:DEPENDS_ON]->() RETURN count(r) as count");
    console.log('=== DEPENDS_ON RELATIONS ===');
    const count = result1.records[0].get('count');
    console.log('Total:', typeof count.toNumber === 'function' ? count.toNumber() : count);
    // Sample some relations
    const result2 = await session.run("MATCH (a:File)-[r:DEPENDS_ON]->(b:File) RETURN a.name as from, b.name as to LIMIT 10");
    console.log('\n=== SAMPLE DEPENDENCIES ===');
    result2.records.forEach(r => console.log(r.get('from') + ' -> ' + r.get('to')));
    // All relation types
    const result3 = await session.run("MATCH ()-[r]->() RETURN type(r) as type, count(r) as cnt ORDER BY cnt DESC LIMIT 10");
    console.log('\n=== ALL RELATION TYPES ===');
    result3.records.forEach(r => {
        const cnt = r.get('cnt');
        console.log(r.get('type') + ': ' + (typeof cnt.toNumber === 'function' ? cnt.toNumber() : cnt));
    });
    await session.close();
    await driver.close();
}
debug();
