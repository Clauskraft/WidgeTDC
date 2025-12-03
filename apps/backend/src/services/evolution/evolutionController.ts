import { Request, Response, Router } from 'express';
import { OmniHarvester } from './OmniHarvester.js';
import { knowledgeAcquisition } from '../KnowledgeAcquisitionService.js';
import path from 'path';

const router = Router();
const harvester = new OmniHarvester(path.resolve(process.cwd(), '../../')); // Scan project root

// --- HARVEST CONTROL STATE ---
let isHarvesting = false;
let currentHarvestId: string | null = null;
let harvestStats = {
    projectFiles: 0,
    intelFiles: 0,
    startTime: 0
};

// 1. Harvest Status
router.get('/harvest/status', (req, res) => {
    res.json({
        isRunning: isHarvesting,
        harvestId: currentHarvestId,
        canAbort: isHarvesting,
        duration: isHarvesting ? Date.now() - harvestStats.startTime : 0
    });
});

// 2. Harvest Summary
router.get('/harvest/summary', async (req, res) => {
    // In a real scenario, query Neo4j for accurate counts.
    // For now, return tracking stats.
    try {
        const vectorStats = await knowledgeAcquisition.getVectorStats();
        
        res.json({
            project: { 
                totalFiles: harvestStats.projectFiles, 
                byStrategy: { 'code': harvestStats.projectFiles } 
            },
            intel: { 
                totalFiles: vectorStats.totalRecords || harvestStats.intelFiles, 
                byStrategy: { 'web': vectorStats.totalRecords || 0 } 
            },
            totalFiles: harvestStats.projectFiles + (vectorStats.totalRecords || 0)
        });
    } catch (err) {
        res.json({
            project: { totalFiles: 0, byStrategy: {} },
            intel: { totalFiles: 0, byStrategy: {} },
            totalFiles: 0
        });
    }
});

// 3. Start Harvest (Project)
router.post('/harvest', async (req, res) => {
    if (isHarvesting) return res.status(409).json({ error: 'Harvest already in progress' });
    
    isHarvesting = true;
    currentHarvestId = `h-${Date.now()}`;
    harvestStats.startTime = Date.now();

    // Start async process
    (async () => {
        try {
            // Use OmniHarvester to scan file system
            const nodes = await harvester.scan(); 
            // TODO: Actually ingest these nodes into KnowledgeAcquisition
            harvestStats.projectFiles = nodes.length; // Simplified count
        } catch (e) {
            console.error("Harvest failed:", e);
        } finally {
            isHarvesting = false;
            currentHarvestId = null;
        }
    })();

    res.json({ message: 'Project harvest started', harvestId: currentHarvestId });
});

// 4. Start Harvest (Intel / Targets)
router.post('/harvest/intel', async (req, res) => {
    if (isHarvesting) return res.status(409).json({ error: 'Harvest already in progress' });

    isHarvesting = true;
    currentHarvestId = `i-${Date.now()}`;
    harvestStats.startTime = Date.now();

    (async () => {
        try {
            const results = await knowledgeAcquisition.acquireFromTargets();
            harvestStats.intelFiles += results.filter(r => r.success).length;
        } catch (e) {
            console.error("Intel harvest failed:", e);
        } finally {
            isHarvesting = false;
            currentHarvestId = null;
        }
    })();

    res.json({ message: 'Intel harvest started', harvestId: currentHarvestId });
});

// 5. Full Sweep
router.post('/harvest/all', async (req, res) => {
    if (isHarvesting) return res.status(409).json({ error: 'Harvest already in progress' });

    isHarvesting = true;
    currentHarvestId = `f-${Date.now()}`;
    
    (async () => {
        try {
            // 1. Project
            const nodes = await harvester.scan();
            harvestStats.projectFiles = nodes.length;
            
            // 2. Intel
            const results = await knowledgeAcquisition.acquireFromTargets();
            harvestStats.intelFiles += results.filter(r => r.success).length;
        } finally {
            isHarvesting = false;
            currentHarvestId = null;
        }
    })();

    res.json({ message: 'Full sweep started', harvestId: currentHarvestId });
});

// 6. Abort / Nødstop
router.post('/harvest/abort', (req, res) => {
    if (!isHarvesting) return res.status(400).json({ message: 'No active harvest to abort' });
    
    // Logic to kill the async process would go here (requires AbortController implementation in services)
    isHarvesting = false;
    currentHarvestId = null;
    
    res.json({ success: true, message: 'Harvest aborted immediately' });
});


router.get('/graph', async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would query Neo4j.
    // For the prototype, we scan the file system live and return a tree structure
    // which the frontend can visualize as a graph.
    const nodes = await harvester.scan();
    
    // Flatten the tree for the 3D graph (simplified)
    // This maps the recursive structure to a flat node/link list
    const graphData = {
        nodes: [] as any[],
        links: [] as any[]
    };

    let idCounter = 0;
    function processNode(node: any, parentId: number | null = null) {
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
            node.children.forEach((child: any) => processNode(child, currentId));
        }
    }

    // Only process first level depth for performance in this mocked version if it's huge
    nodes.forEach(node => processNode(node, null));

    res.json(graphData);
  } catch (error: any) {
    console.error("Evolution Graph Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/evolve', async (req: Request, res: Response) => {
    // Placeholder for self-modification endpoint
    res.json({ message: "Evolution request received. Analysis started." });
});

export const evolutionRouter = router;