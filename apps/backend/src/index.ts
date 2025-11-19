import { createServer } from 'http';
import { exec } from 'child_process';
import { mcpRegistry } from './mcp/mcpRegistry.js';
import { createApp, createMcpWebSocketServer } from './app.js';
import sysRouter from './routes/sys.js';
import { securityRouter } from './services/security/securityController.js';
import { agentRouter } from './services/agent/agentController.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

// Additional routes not in createApp
app.use('/api/security', securityRouter);
app.use('/api/agent', agentRouter);
app.use('/api/sys', sysRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    registeredTools: mcpRegistry.getRegisteredTools(),
  });
});

// Create HTTP server
const server = createServer(app);

// 🛠️ SYSTEM EXECUTOR FUNCTION
// Note: Currently unused but kept for future system command execution
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const executeSystemCommand = (commandIntent: string): string => {
    console.log(`⚡ EXECUTING: ${commandIntent}`);

    // Simple translation of "AI Intent" to system commands
    if (commandIntent.includes('KILL_CHROME')) {
        exec('taskkill /F /IM chrome.exe', (error, _stdout, _stderr) => {
            if (error) console.log('Error killing Chrome:', error);
        });
        return "Target neutralized: Google Chrome processes terminated.";
    }
    if (commandIntent.includes('OPEN_STEAM')) {
        exec('start steam://', (error, _stdout, _stderr) => {
            if (error) console.log('Error opening Steam:', error);
        });
        return "Launching entertainment subsystem...";
    }
    if (commandIntent.includes('FLUSH_DNS')) {
        exec('ipconfig /flushdns', (error, _stdout, _stderr) => {
            if (error) console.log('Error flushing DNS:', error);
        });
        return "Network cache cleared.";
    }
    if (commandIntent.includes('KILL_NODE')) {
        exec('taskkill /F /IM node.exe', (error, _stdout, _stderr) => {
            if (error) console.log('Error killing Node processes:', error);
        });
        return "All Node.js processes terminated.";
    }
    if (commandIntent.includes('RESTART_EXPLORER')) {
        exec('taskkill /F /IM explorer.exe && start explorer.exe', (error, _stdout, _stderr) => {
            if (error) console.log('Error restarting Explorer:', error);
        });
        return "Windows Explorer restarted.";
    }

    return `Command '${commandIntent}' not recognized in safety protocols.`;
};

// Initialize WebSocket server for MCP
createMcpWebSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`MCP WebSocket available at ws://localhost:${PORT}/mcp/ws`);
  console.log(`Registered MCP tools:`, mcpRegistry.getRegisteredTools());
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
