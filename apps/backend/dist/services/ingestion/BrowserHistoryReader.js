// BrowserHistoryReader – Reads browser history from Chrome/Edge SQLite databases
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import initSqlJs from 'sql.js';
export class BrowserHistoryReader {
    constructor() {
        this.name = 'Browser History';
        this.type = 'browser_history';
        this.historyPaths = [];
        // Detect browser history locations
        const homeDir = os.homedir();
        // Chrome/Edge on Windows
        if (process.platform === 'win32') {
            this.historyPaths = [
                path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'History'),
                path.join(homeDir, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'History')
            ];
        }
        // Chrome on macOS/Linux
        else if (process.platform === 'darwin') {
            this.historyPaths = [
                path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'History')
            ];
        }
        else {
            this.historyPaths = [
                path.join(homeDir, '.config', 'google-chrome', 'Default', 'History')
            ];
        }
    }
    async isAvailable() {
        // Check if any history file exists
        for (const historyPath of this.historyPaths) {
            try {
                await fs.access(historyPath);
                return true;
            }
            catch {
                continue;
            }
        }
        return false;
    }
    async fetch() {
        const allHistory = [];
        for (const historyPath of this.historyPaths) {
            try {
                // Check if file exists
                await fs.access(historyPath);
                // Copy to temp location (browsers lock the original file)
                const tempPath = path.join(os.tmpdir(), `history_${Date.now()}.db`);
                await fs.copyFile(historyPath, tempPath);
                // Read with sql.js
                const SQL = await initSqlJs();
                const fileBuffer = await fs.readFile(tempPath);
                const db = new SQL.Database(fileBuffer);
                // Query history (last 1000 entries)
                const result = db.exec(`
                    SELECT url, title, visit_count, last_visit_time
                    FROM urls
                    ORDER BY last_visit_time DESC
                    LIMIT 1000
                `);
                if (result && result.length > 0) {
                    const columns = result[0].columns;
                    const values = result[0].values;
                    for (const row of values) {
                        const obj = {};
                        columns.forEach((col, idx) => {
                            obj[col] = row[idx];
                        });
                        allHistory.push({
                            ...obj,
                            source: path.basename(path.dirname(historyPath)) // Chrome/Edge
                        });
                    }
                }
                db.close();
                // Clean up temp file
                await fs.unlink(tempPath).catch(() => { });
                console.log(`  → Read ${result?.[0]?.values?.length || 0} entries from ${path.basename(path.dirname(historyPath))}`);
            }
            catch (error) {
                console.warn(`Failed to read browser history from ${historyPath}:`, error.message);
            }
        }
        return allHistory;
    }
    async transform(historyEntries) {
        return historyEntries.map(entry => {
            // Chrome stores time as microseconds since 1601-01-01
            // Convert to JavaScript Date
            let visitDate;
            try {
                const microseconds = entry.last_visit_time;
                const epochStart = new Date('1601-01-01T00:00:00Z').getTime();
                const milliseconds = epochStart + (microseconds / 1000);
                visitDate = new Date(milliseconds);
            }
            catch {
                visitDate = new Date();
            }
            return {
                id: `${entry.url}-${entry.last_visit_time}`,
                type: 'browser_history',
                source: entry.source || 'Browser',
                title: entry.title || entry.url,
                content: entry.url,
                metadata: {
                    url: entry.url,
                    visitCount: entry.visit_count,
                    lastVisit: visitDate.toISOString(),
                    browser: entry.source
                },
                timestamp: visitDate
            };
        });
    }
}
