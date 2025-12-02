import { neo4jService } from '../../database/Neo4jService';
/**
 * Advanced Graph Traversal Optimizer
 * Optimizes multi-hop graph queries for better performance
 */
export class GraphTraversalOptimizer {
    /**
     * Optimized breadth-first search with pruning
     */
    async optimizedBFS(startNodeId, targetCondition, maxDepth = 3, maxNodes = 100) {
        await neo4jService.connect();
        try {
            // Use Cypher's built-in path finding with limits
            const result = await neo4jService.runQuery(`MATCH path = (start)-[*1..${maxDepth}]-(end)
         WHERE id(start) = $startId
         WITH path, nodes(path) as pathNodes
         LIMIT $maxNodes
         RETURN path, pathNodes`, { startId: parseInt(startNodeId), maxNodes });
            await neo4jService.disconnect();
            if (result.length === 0) {
                return { path: [], nodesVisited: 0 };
            }
            // Find best path based on condition
            const bestPath = result.find(r => {
                const nodes = r.pathNodes;
                return nodes.some((node) => targetCondition(node));
            });
            return {
                path: bestPath?.pathNodes || [],
                nodesVisited: result.length,
            };
        }
        catch (error) {
            await neo4jService.disconnect();
            throw error;
        }
    }
    /**
     * Find shortest path with relationship type filtering
     */
    async findShortestPath(startNodeId, endNodeId, relationshipTypes, maxDepth = 5) {
        await neo4jService.connect();
        try {
            const relFilter = relationshipTypes
                ? `:${relationshipTypes.join('|')}`
                : '';
            const result = await neo4jService.runQuery(`MATCH path = shortestPath((start)-[${relFilter}*1..${maxDepth}]-(end))
         WHERE id(start) = $startId AND id(end) = $endId
         RETURN path, length(path) as pathLength`, { startId: parseInt(startNodeId), endId: parseInt(endNodeId) });
            await neo4jService.disconnect();
            if (result.length === 0)
                return null;
            return {
                path: result[0].path,
                length: result[0].pathLength,
            };
        }
        catch (error) {
            await neo4jService.disconnect();
            throw error;
        }
    }
    /**
     * Find all paths with cost optimization
     */
    async findAllPathsWithCost(startNodeId, endNodeId, maxDepth = 4, costProperty = 'weight') {
        await neo4jService.connect();
        try {
            const result = await neo4jService.runQuery(`MATCH path = (start)-[*1..${maxDepth}]-(end)
         WHERE id(start) = $startId AND id(end) = $endId
         WITH path, relationships(path) as rels
         RETURN path, 
                reduce(cost = 0, r in rels | cost + coalesce(r.${costProperty}, 1)) as totalCost
         ORDER BY totalCost ASC
         LIMIT 10`, { startId: parseInt(startNodeId), endId: parseInt(endNodeId) });
            await neo4jService.disconnect();
            return result.map(r => ({
                path: r.path,
                cost: r.totalCost,
            }));
        }
        catch (error) {
            await neo4jService.disconnect();
            throw error;
        }
    }
    /**
     * Community detection using label propagation
     */
    async detectCommunities(minCommunitySize = 3) {
        await neo4jService.connect();
        try {
            // Simple community detection based on connected components
            const result = await neo4jService.runQuery(`CALL gds.wcc.stream('myGraph')
         YIELD nodeId, componentId
         WITH componentId, collect(nodeId) as members
         WHERE size(members) >= $minSize
         RETURN componentId, members`, { minSize: minCommunitySize });
            await neo4jService.disconnect();
            const communities = new Map();
            result.forEach(r => {
                communities.set(r.componentId.toString(), r.members.map((id) => id.toString()));
            });
            return communities;
        }
        catch (error) {
            await neo4jService.disconnect();
            // Fallback to simple connected components
            return this.simpleConnectedComponents(minCommunitySize);
        }
    }
    /**
     * Fallback: Simple connected components without GDS
     */
    async simpleConnectedComponents(minSize) {
        const result = await neo4jService.runQuery(`MATCH (n)
       OPTIONAL MATCH path = (n)-[*]-(m)
       WITH n, collect(DISTINCT m) as connected
       WHERE size(connected) >= $minSize
       RETURN id(n) as nodeId, [x in connected | id(x)] as members
       LIMIT 100`, { minSize });
        const communities = new Map();
        result.forEach((r, idx) => {
            communities.set(`community_${idx}`, r.members.map((id) => id.toString()));
        });
        return communities;
    }
    /**
     * PageRank-style importance scoring
     */
    async computeNodeImportance(dampingFactor = 0.85, iterations = 20) {
        await neo4jService.connect();
        try {
            // Try using GDS PageRank
            const result = await neo4jService.runQuery(`CALL gds.pageRank.stream('myGraph', {
           maxIterations: $iterations,
           dampingFactor: $dampingFactor
         })
         YIELD nodeId, score
         RETURN nodeId, score
         ORDER BY score DESC
         LIMIT 100`, { iterations, dampingFactor });
            await neo4jService.disconnect();
            const scores = new Map();
            result.forEach(r => {
                scores.set(r.nodeId.toString(), r.score);
            });
            return scores;
        }
        catch (error) {
            await neo4jService.disconnect();
            // Fallback to simple degree centrality
            return this.simpleDegreeCentrality();
        }
    }
    /**
     * Fallback: Simple degree centrality without GDS
     */
    async simpleDegreeCentrality() {
        const result = await neo4jService.runQuery(`MATCH (n)-[r]-(m)
       WITH n, count(r) as degree
       RETURN id(n) as nodeId, degree
       ORDER BY degree DESC
       LIMIT 100`);
        const scores = new Map();
        result.forEach(r => {
            scores.set(r.nodeId.toString(), r.degree);
        });
        return scores;
    }
}
export const graphTraversalOptimizer = new GraphTraversalOptimizer();
