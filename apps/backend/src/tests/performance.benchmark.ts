import { neo4jService } from '../database/Neo4jService';
import { graphMemoryService } from '../memory/GraphMemoryService';

interface BenchmarkResult {
    operation: string;
    iterations: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    opsPerSecond: number;
}

async function benchmark(
    name: string,
    operation: () => Promise<void>,
    iterations: number = 100
): Promise<BenchmarkResult> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await operation();
        const end = performance.now();
        times.push(end - start);
    }

    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / avgTime;

    return {
        operation: name,
        iterations,
        totalTime,
        avgTime,
        minTime,
        maxTime,
        opsPerSecond,
    };
}

async function runPerformanceBenchmarks() {
    console.log('🚀 Running Performance Benchmarks...\n');

    await neo4jService.connect();

    const results: BenchmarkResult[] = [];

    // Benchmark 1: Create Entity
    console.log('📊 Benchmarking: Create Entity...');
    const createResult = await benchmark(
        'Create Entity',
        async () => {
            await graphMemoryService.createEntity('BenchmarkEntity', 'Test', { data: 'test' });
        },
        50
    );
    results.push(createResult);
    console.log(`   Avg: ${createResult.avgTime.toFixed(2)}ms | Ops/sec: ${createResult.opsPerSecond.toFixed(0)}`);

    // Create test data for other benchmarks
    const entities = [];
    for (let i = 0; i < 100; i++) {
        const entity = await graphMemoryService.createEntity(
            'BenchmarkEntity',
            `Entity ${i}`,
            { index: i }
        );
        entities.push(entity);
    }

    // Benchmark 2: Search Entities
    console.log('📊 Benchmarking: Search Entities...');
    const searchResult = await benchmark(
        'Search Entities',
        async () => {
            await graphMemoryService.searchEntities('Entity');
        },
        100
    );
    results.push(searchResult);
    console.log(`   Avg: ${searchResult.avgTime.toFixed(2)}ms | Ops/sec: ${searchResult.opsPerSecond.toFixed(0)}`);

    // Benchmark 3: Get Entity by ID
    console.log('📊 Benchmarking: Get Entity by ID...');
    const getResult = await benchmark(
        'Get Entity by ID',
        async () => {
            const randomEntity = entities[Math.floor(Math.random() * entities.length)];
            await neo4jService.getNodeById(randomEntity.id);
        },
        100
    );
    results.push(getResult);
    console.log(`   Avg: ${getResult.avgTime.toFixed(2)}ms | Ops/sec: ${getResult.opsPerSecond.toFixed(0)}`);

    // Benchmark 4: Create Relation
    console.log('📊 Benchmarking: Create Relation...');
    const relationResult = await benchmark(
        'Create Relation',
        async () => {
            const source = entities[Math.floor(Math.random() * entities.length)];
            const target = entities[Math.floor(Math.random() * entities.length)];
            if (source.id !== target.id) {
                await graphMemoryService.createRelation(source.id, target.id, 'BENCHMARK_REL');
            }
        },
        50
    );
    results.push(relationResult);
    console.log(`   Avg: ${relationResult.avgTime.toFixed(2)}ms | Ops/sec: ${relationResult.opsPerSecond.toFixed(0)}`);

    // Benchmark 5: Get Related Entities
    console.log('📊 Benchmarking: Get Related Entities...');
    const relatedResult = await benchmark(
        'Get Related Entities',
        async () => {
            const randomEntity = entities[Math.floor(Math.random() * entities.length)];
            await graphMemoryService.getRelatedEntities(randomEntity.id);
        },
        100
    );
    results.push(relatedResult);
    console.log(`   Avg: ${relatedResult.avgTime.toFixed(2)}ms | Ops/sec: ${relatedResult.opsPerSecond.toFixed(0)}`);

    // Benchmark 6: Graph Statistics
    console.log('📊 Benchmarking: Graph Statistics...');
    const statsResult = await benchmark(
        'Graph Statistics',
        async () => {
            await graphMemoryService.getStatistics();
        },
        20
    );
    results.push(statsResult);
    console.log(`   Avg: ${statsResult.avgTime.toFixed(2)}ms | Ops/sec: ${statsResult.opsPerSecond.toFixed(0)}`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await neo4jService.runQuery('MATCH (n:BenchmarkEntity) DETACH DELETE n');

    await neo4jService.disconnect();

    // Summary
    console.log('\n📊 Performance Benchmark Summary:');
    console.log('═'.repeat(80));
    console.log('Operation'.padEnd(30) + 'Avg Time'.padEnd(15) + 'Min/Max'.padEnd(20) + 'Ops/sec');
    console.log('─'.repeat(80));

    results.forEach(r => {
        console.log(
            r.operation.padEnd(30) +
            `${r.avgTime.toFixed(2)}ms`.padEnd(15) +
            `${r.minTime.toFixed(2)}/${r.maxTime.toFixed(2)}ms`.padEnd(20) +
            r.opsPerSecond.toFixed(0)
        );
    });

    console.log('═'.repeat(80));

    // Performance targets
    const targets = {
        'Create Entity': 100, // < 100ms
        'Search Entities': 50, // < 50ms
        'Get Entity by ID': 10, // < 10ms
        'Create Relation': 100, // < 100ms
        'Get Related Entities': 50, // < 50ms
        'Graph Statistics': 200, // < 200ms
    };

    console.log('\n🎯 Performance Target Analysis:');
    let allPassed = true;

    results.forEach(r => {
        const target = targets[r.operation as keyof typeof targets];
        const passed = r.avgTime < target;
        const status = passed ? '✅' : '❌';
        allPassed = allPassed && passed;

        console.log(`${status} ${r.operation}: ${r.avgTime.toFixed(2)}ms (target: <${target}ms)`);
    });

    if (allPassed) {
        console.log('\n🎉 All performance targets met!');
    } else {
        console.log('\n⚠️  Some performance targets not met. Consider optimization.');
    }

    return results;
}

// Run if executed directly
runPerformanceBenchmarks()
    .then(() => {
        console.log('\n✅ Benchmarks completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Benchmark failed:', error);
        process.exit(1);
    });

export { runPerformanceBenchmarks };
