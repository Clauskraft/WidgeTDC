import { devToolsService } from '../services/devtools/DevToolsService.js';
export async function handleDevToolsRequest(message) {
    const { tool, payload } = message;
    switch (tool) {
        case 'devtools-status':
            return await devToolsService.getStatus();
        case 'devtools-scan':
            await devToolsService.runScan();
            return { status: 'started', message: 'GitHub scan started in background' };
        case 'devtools-validate':
            const repoPath = payload?.path || process.cwd();
            const result = await devToolsService.validateRepo(repoPath);
            return { output: result };
        default:
            throw new Error(`Unknown DevTools tool: ${tool}`);
    }
}
