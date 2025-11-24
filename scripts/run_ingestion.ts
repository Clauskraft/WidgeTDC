import { dataIngestionEngine } from '../apps/backend/src/services/ingestion/DataIngestionEngine.js';
import { dataSourceConfig } from '../apps/backend/src/services/ingestion/DataSourceConfigManager.js';
import { LocalFileScanner } from '../apps/backend/src/services/ingestion/LocalFileScanner.js';
import { BrowserHistoryReader } from '../apps/backend/src/services/ingestion/BrowserHistoryReader.js';
import { OutlookEmailReader } from '../apps/backend/src/services/ingestion/OutlookEmailReader.js';

async function main() {
    // Load config
    await dataSourceConfig.load();

    // Register adapters (if not already registered)
    const homeDir = require('os').homedir();
    const localScanner = new LocalFileScanner({
        rootPaths: [
            `${homeDir}\\Documents`,
            `${homeDir}\\Downloads`,
            `${homeDir}\\Desktop`
        ],
        extensions: ['.txt', '.md', '.pdf', '.docx', '.xlsx', '.csv', '.json'],
        maxDepth: 3,
        maxFileSize: 10 * 1024 * 1024,
        excludePatterns: ['node_modules', '.git', 'dist', 'build', '$RECYCLE.BIN']
    });
    await dataIngestionEngine.registerAdapter(localScanner, 'Local file system scanner', false);

    const browserReader = new BrowserHistoryReader();
    await dataIngestionEngine.registerAdapter(browserReader, 'Browser history reader', false);

    const outlookReader = new OutlookEmailReader();
    await dataIngestionEngine.registerAdapter(outlookReader, 'Outlook email reader', true);

    // Advise about pending approvals
    const pending = dataSourceConfig.getPendingApprovals();
    if (pending.length > 0) {
        console.log('⚠️ Pending data source approvals:');
        pending.forEach(p => console.log(` - ${p.name}: ${p.description || 'No description'}`));
        // Auto-approve for demo purposes
        for (const p of pending) {
            await dataSourceConfig.approve(p.name);
        }
    }

    // Start ingestion
    await dataIngestionEngine.ingestAll();
    console.log('✅ Ingestion run completed');
}

main().catch(err => {
    console.error('❌ Ingestion script failed:', err);
    process.exit(1);
});
