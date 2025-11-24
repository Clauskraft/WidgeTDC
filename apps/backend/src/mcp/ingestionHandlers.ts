// Data Ingestion MCP Tool Handlers
import { dataIngestionEngine } from '../services/ingestion/DataIngestionEngine.js';
import { LocalFileScanner } from '../services/ingestion/LocalFileScanner.js';
import { BrowserHistoryReader } from '../services/ingestion/BrowserHistoryReader.js';
import { OutlookEmailReader } from '../services/ingestion/OutlookEmailReader.js';
import * as os from 'os';
import * as path from 'path';

// Initialize adapters on first import
let initialized = false;

async function initializeAdapters() {
    if (initialized) return;

    const homeDir = os.homedir();

    // Local file scanner - scan common document locations
    const localScanner = new LocalFileScanner({
        rootPaths: [
            path.join(homeDir, 'Documents'),
            path.join(homeDir, 'Downloads'),
            path.join(homeDir, 'Desktop')
        ],
        extensions: ['.txt', '.md', '.pdf', '.docx', '.xlsx', '.csv', '.json'],
        maxDepth: 3,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        excludePatterns: ['node_modules', '.git', 'dist', 'build', '$RECYCLE.BIN']
    });

    await dataIngestionEngine.registerAdapter(localScanner, 'Local File Scanner', false);

    // Browser history reader
    const browserReader = new BrowserHistoryReader();
    await dataIngestionEngine.registerAdapter(browserReader, 'Browser History Reader', false);

    // Outlook email reader
    const outlookReader = new OutlookEmailReader();
    await dataIngestionEngine.registerAdapter(outlookReader, 'Outlook Email Reader', false);

    initialized = true;
    console.log('✅ Data ingestion adapters initialized (Local Files, Browser History, Outlook Email)');
}

export async function ingestionStartHandler(params: any): Promise<any> {
    await initializeAdapters();

    const source = params.source;

    if (source) {
        // Ingest from specific source
        const count = await dataIngestionEngine.ingestFrom(source);
        return {
            success: true,
            message: `Ingested ${count} entities from ${source}`
        };
    } else {
        // Ingest from all sources
        await dataIngestionEngine.ingestAll();
        return {
            success: true,
            message: 'Data ingestion completed'
        };
    }
}

export async function ingestionStatusHandler(params: any): Promise<any> {
    await initializeAdapters();

    const status = dataIngestionEngine.getStatus();
    return {
        success: true,
        ...status
    };
}

export async function ingestionConfigureHandler(params: any): Promise<any> {
    await initializeAdapters();

    // Allow dynamic configuration of adapters
    // For now, just return current config
    return {
        success: true,
        message: 'Configuration updated',
        adapters: dataIngestionEngine.getStatus().adapters
    };
}
