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

const oneDriveAdapter = new OneDriveAdapter();
await dataIngestionEngine.registerAdapter(oneDriveAdapter, 'OneDrive adapter', true);

const teamsAdapter = new TeamsAdapter();
await dataIngestionEngine.registerAdapter(teamsAdapter, 'Teams adapter', true);

const sharePointAdapter = new SharePointAdapter();
await dataIngestionEngine.registerAdapter(sharePointAdapter, 'SharePoint adapter', true);

const twitterAdapter = new TwitterAdapter();
await dataIngestionEngine.registerAdapter(twitterAdapter, 'Twitter adapter', true);

const gmailAdapter = new GmailAdapter();
await dataIngestionEngine.registerAdapter(gmailAdapter, 'Gmail adapter', true);

const calendarAdapter = new GoogleCalendarAdapter();
await dataIngestionEngine.registerAdapter(calendarAdapter, 'Google Calendar adapter', true);

const keepAdapter = new GoogleKeepAdapter();
await dataIngestionEngine.registerAdapter(keepAdapter, 'Google Keep adapter', true);

const mapsAdapter = new GoogleMapsAdapter();
await dataIngestionEngine.registerAdapter(mapsAdapter, 'Google Maps adapter', true);

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
