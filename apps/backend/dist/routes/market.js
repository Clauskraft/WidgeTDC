import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
// ESM Shim til stier
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Sti til rapporten (vi går op fra /dist/routes/ til roden)
// Juster afhængigt af hvor den gemmes (roden af repo eller backend root)
// Vi antager den ligger i repo-roden jf. scriptet
const REPORT_PATH = path.resolve(__dirname, '../../../../market_fit_report.json');
const SCRIPT_PATH = path.resolve(__dirname, '../scripts/market_fit_analysis.ts');
const router = Router();
const REPORT_MAX_AGE_MINUTES = parseInt(process.env.MARKET_REPORT_MAX_AGE_MINUTES || '15', 10);
const REPORT_MAX_AGE_MS = Math.max(REPORT_MAX_AGE_MINUTES, 1) * 60 * 1000;
const isReportStale = () => {
    try {
        const stats = fs.statSync(REPORT_PATH);
        return Date.now() - stats.mtimeMs > REPORT_MAX_AGE_MS;
    }
    catch {
        return true;
    }
};
router.get('/opportunities', async (req, res) => {
    try {
        // 1. Tjek om rapporten findes
        const reportMissing = !fs.existsSync(REPORT_PATH);
        const reportStale = !reportMissing && isReportStale();
        if (reportMissing || reportStale) {
            console.warn('[MarketAPI] Report missing or stale. Triggering analysis...');
            // 2. Self-Healing: Kør scriptet hvis filen mangler
            // Bemærk: Dette kan tage tid, så i prod ville vi bruge en cache/job queue
            // Vi bruger npx tsx til at køre scriptet
            try {
                // cwd skal være apps/backend for at tsx og stierne virker korrekt ift package.json scripts context
                // Men stien til scriptet er absolut.
                await execAsync(`npx tsx ${SCRIPT_PATH}`, { cwd: path.resolve(__dirname, '../../') });
            }
            catch (scriptError) {
                console.error('Failed to generate report:', scriptError);
                return res.status(500).json({ error: 'Could not generate market data' });
            }
        }
        // 3. Læs og returner data
        const reportData = fs.readFileSync(REPORT_PATH, 'utf-8');
        const json = JSON.parse(reportData);
        res.json(json);
    }
    catch (error) {
        console.error('[MarketAPI] Error serving opportunities:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
export default router;
