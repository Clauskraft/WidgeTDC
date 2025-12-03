const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');

const store = new Store();

// Default configurations
const DEFAULTS = {
    local: 'http://localhost:8888',
    prod: 'https://widgetdc.up.railway.app/'
};

let mainWindow;

function createWindow() {
    // Hent sidst brugte URL
    let lastUrl = store.get('lastUrl') || DEFAULTS.local;

    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        title: 'WidgeTDC Neural Command Center',
        backgroundColor: '#051e3c', // Matcher app-baggrunden
        frame: false, // MATRIX MODE: Ingen Windows-ramme
        titleBarStyle: 'hidden',
        show: false, // Venter med at vise til den er klar (undgår hvidt flash)
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Vis først når klar
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // Indlæs URL
    loadUrl(lastUrl);

    // Håndter eksterne links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // IPC Handlers for Custom Title Bar
    ipcMain.handle('window-minimize', () => mainWindow.minimize());
    ipcMain.handle('window-maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.handle('window-close', () => mainWindow.close());

    // buildMenu(); // Skjuler menuen helt for Matrix look (kan aktiveres via Alt hvis nødvendigt)
    Menu.setApplicationMenu(null); 
}

function loadUrl(url) {
    console.log(`Connecting to: ${url}`);
    
    // Gem URL hvis det ikke er fejlsiden
    if (!url.includes('error.html')) {
        store.set('lastUrl', url);
    }

    mainWindow.loadURL(url).catch(err => {
        console.error('Failed to load:', err);
        // Hvis dev server ikke kører, vent og prøv igen eller vis fejl
        setTimeout(() => {
             mainWindow.loadFile('error.html');
        }, 1000);
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});