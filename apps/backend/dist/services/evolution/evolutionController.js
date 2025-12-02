import { Router } from 'express';
import { OmniHarvester } from './OmniHarvester.js';
import path from 'path';
const router = Router();
const harvester = new OmniHarvester(path.resolve(process.cwd(), '../../')); // Scan project root
router.get('/graph', async (req, res) => {
    try {
        // In a real implementation, this would query Neo4j.
        // For the prototype, we scan the file system live and return a tree structure
        // which the frontend can visualize as a graph.
        const nodes = await harvester.scan();
        // Flatten the tree for the 3D graph (simplified)
        // This maps the recursive structure to a flat node/link list
        const graphData = {
            nodes: [],
            links: []
        };
        let idCounter = 0;
        function processNode(node, parentId = null) {
            const currentId = idCounter++;
            const isDir = node.type === 'directory';
            graphData.nodes.push({
                id: currentId,
                name: node.name,
                type: node.type,
                val: isDir ? 5 : 1, // Size for visualizer
                color: isDir ? '#ff00ff' : '#00B5CB'
            });
            if (parentId !== null) {
                graphData.links.push({
                    source: parentId,
                    target: currentId
                });
            }
            if (node.children) {
                node.children.forEach((child) => processNode(child, currentId));
            }
        }
        // Only process first level depth for performance in this mocked version if it's huge
        nodes.forEach(node => processNode(node, null));
        res.json(graphData);
    }
    catch (error) {
        console.error("Evolution Graph Error:", error);
        res.status(500).json({ error: error.message });
    }
});
router.post('/evolve', async (req, res) => {
    // Placeholder for self-modification endpoint
    res.json({ message: "Evolution request received. Analysis started." });
});
export const evolutionRouter = router;
