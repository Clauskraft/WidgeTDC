import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger.js';
import { eventBus } from '../../mcp/EventBus.js';
const execAsync = promisify(exec);
export class DevToolsService {
    constructor() {
        this.isScanning = false;
        this.brainPath = null;
        // Assuming DevTools-Monorepo is parallel to WidgeTDC root
        // WidgeTDC/apps/backend -> ../../../DevTools-Monorepo
        this.devToolsPath = path.resolve(process.cwd(), '../../../DevTools-Monorepo');
        this.findBrainPath();
    }
    static getInstance() {
        if (!DevToolsService.instance) {
            DevToolsService.instance = new DevToolsService();
        }
        return DevToolsService.instance;
    }
    async findBrainPath() {
        // Logic mirrors PowerShell script to find active brain
        const potentialPaths = [
            'G:\\My Drive\\WidgeTDC-Config',
            path.join(process.env.USERPROFILE || '', 'Google Drive', 'WidgeTDC-Config'),
            path.join(process.env.OneDrive || '', 'WidgeTDC-Config'),
            path.join(process.env.HOME || process.env.USERPROFILE || '', '.widget-tdc')
        ];
        for (const p of potentialPaths) {
            try {
                await fs.access(p);
                this.brainPath = path.join(p, 'brain.json');
                break;
            }
            catch {
                continue;
            }
        }
    }
    async getStatus() {
        let repoCount = 0;
        let lastScan = null;
        if (this.brainPath) {
            try {
                const data = await fs.readFile(this.brainPath, 'utf-8');
                const brain = JSON.parse(data);
                if (brain.templates) {
                    repoCount = Object.keys(brain.templates).length;
                    // Find most recent scan time
                    const dates = Object.values(brain.templates)
                        .map((t) => t.last_scanned ? new Date(t.last_scanned).getTime() : 0);
                    if (dates.length > 0) {
                        lastScan = new Date(Math.max(...dates)).toISOString();
                    }
                }
            }
            catch (error) {
                logger.error('Failed to read brain.json', error);
            }
        }
        return {
            lastScan,
            repoCount,
            brainPath: this.brainPath || 'Not Found',
            isScanning: this.isScanning,
            lastError: null
        };
    }
    async runScan() {
        if (this.isScanning)
            throw new Error('Scan already in progress');
        this.isScanning = true;
        eventBus.emit('devtools:scan:started', {});
        try {
            const script = path.join(this.devToolsPath, 'widget-agent.ps1');
            const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${script}" scan-github`;
            logger.info(`Running DevTools scan: ${command}`);
            const { stdout, stderr } = await execAsync(command);
            logger.info('DevTools scan completed', { stdout });
            if (stderr)
                logger.warn('DevTools scan stderr', { stderr });
            eventBus.emit('devtools:scan:completed', { output: stdout });
        }
        catch (error) {
            logger.error('DevTools scan failed', error);
            eventBus.emit('devtools:scan:failed', { error: String(error) });
            throw error;
        }
        finally {
            this.isScanning = false;
        }
    }
    async validateRepo(repoPath) {
        const script = path.join(this.devToolsPath, 'widget-agent.ps1');
        // We need to run validate in the context of the target repo
        const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${script}" validate`;
        try {
            const { stdout } = await execAsync(command, { cwd: repoPath });
            return stdout;
        }
        catch (error) {
            // PowerShell script returns exit code 1 on validation failure, which throws here
            if (error.stdout)
                return error.stdout; // Return the validation output even if it failed
            throw error;
        }
    }
}
export const devToolsService = DevToolsService.getInstance();
