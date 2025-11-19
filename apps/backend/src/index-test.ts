import express from 'express';
import cors from 'cors';
import { agentRouter } from './services/agent/agentController.js';
import { scRouter } from './services/sc/scController.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Only the new widget endpoints
app.use('/api/agent', agentRouter);
app.use('/api/commands/sc', scRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /api/agent/query',
      'GET /api/agent/health',
      'POST /api/commands/sc/analyze',
      'POST /api/commands/sc/spec-panel',
      'GET /api/commands/sc/health'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server (test) running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/agent/query`);
  console.log(`   POST http://localhost:${PORT}/api/commands/sc/analyze`);
  console.log(`   POST http://localhost:${PORT}/api/commands/sc/spec-panel`);
  console.log(`   GET  http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
