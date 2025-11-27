import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'WidgeTDC Backend is running'
    });
});

// MCP tools
app.get('/api/mcp/tools', (req, res) => {
    res.json({ tools: [] });
});

// MCP route
app.post('/api/mcp/route', (req, res) => {
    res.json({ result: 'OK', data: [] });
});

// Approvals
app.get('/api/approvals', (req, res) => {
    res.json({ approvals: [] });
});

// Autonomous sources
app.get('/api/mcp/autonomous/sources', (req, res) => {
    res.json({ sources: [] });
});

// Autonomous stats
app.get('/api/mcp/autonomous/stats', (req, res) => {
    res.json({ stats: { total: 0 } });
});

// Autonomous health
app.get('/api/mcp/autonomous/health', (req, res) => {
    res.json({ healthy: true });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'WidgeTDC Backend',
        version: '1.0.0',
        status: 'running'
    });
});

// Catch-all for missing endpoints
app.use((req, res) => {
    console.log(`⚠️  Missing endpoint: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

app.listen(PORT, () => {
    console.log(`🚀 Simple backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Mock endpoints ready for frontend testing`);
});
