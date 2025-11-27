const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

// Default backend URL (for API calls from the frontend)
const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
    const fs = require('fs');
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    const iconConfig = fs.existsSync(iconPath) ? { icon: iconPath } : {};

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 768,  // Support tablet-sized screens (responsive)
        minHeight: 600, // Reduced for better flexibility
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: !isDev, // Disable web security in dev for local API calls
        },
        ...iconConfig,
        title: 'WidgeTDC - Enterprise AI Dashboard',
        backgroundColor: '#051e3c', // Match the app's background color
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        frame: true,
        show: false, // Don't show until ready to prevent flash
    });

    // Show window when ready to prevent white flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Get backend URL from settings or use default
    const backendUrl = store.get('backendUrl', DEFAULT_BACKEND_URL);

    if (isDev) {
        // In development, load from Vite dev server
        const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:8888';
        console.log('Loading from dev server:', devUrl);
        mainWindow.loadURL(devUrl);
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built React app
        // First check if the built files exist in the app's resources
        const prodPath = path.join(__dirname, 'renderer', 'dist', 'index.html');
        const fallbackPath = path.join(__dirname, '..', 'dist', 'index.html');

        if (fs.existsSync(prodPath)) {
            console.log('Loading production build from:', prodPath);
            mainWindow.loadFile(prodPath);
        } else if (fs.existsSync(fallbackPath)) {
            console.log('Loading production build from:', fallbackPath);
            mainWindow.loadFile(fallbackPath);
        } else {
            // Final fallback: load the welcome screen
            console.log('Built files not found, loading welcome screen');
            mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
        }
    }

    // Set backend URL in renderer once loaded
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('backend-url', backendUrl);
        // Also set it in the window for the React app to use
        mainWindow.webContents.executeJavaScript(`
            window.ELECTRON_BACKEND_URL = "${backendUrl}";
        `);
    });

    // Handle navigation
    mainWindow.webContents.on('will-navigate', (event, url) => {
        // Allow navigation within the app
        const allowedOrigins = ['http://localhost:8888', 'http://localhost:3001', 'file://'];
        const isAllowed = allowedOrigins.some(origin => url.startsWith(origin));
        if (!isAllowed && !url.startsWith('file://')) {
            console.log('Blocked navigation to:', url);
            event.preventDefault();
        }
    });

    // Create menu
    createMenu();

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Settings',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        mainWindow.webContents.send('open-settings');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'close' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Documentation',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal('https://docs.widgetdc.com');
                    },
                },
                {
                    label: 'About',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About WidgeTDC',
                            message: 'WidgeTDC Desktop',
                            detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}\n\nEnterprise-grade AI-powered dashboard platform.`,
                        });
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('get-backend-url', () => {
    return store.get('backendUrl', DEFAULT_BACKEND_URL);
});

ipcMain.handle('set-backend-url', (event, url) => {
    store.set('backendUrl', url);
    return true;
});

ipcMain.handle('get-settings', () => {
    return {
        backendUrl: store.get('backendUrl', DEFAULT_BACKEND_URL),
        theme: store.get('theme', 'dark'),
        notifications: store.get('notifications', true),
    };
});

ipcMain.handle('save-settings', (event, settings) => {
    Object.keys(settings).forEach(key => {
        store.set(key, settings[key]);
    });
    return true;
});

ipcMain.handle('get-app-info', () => {
    return {
        version: app.getVersion(),
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        platform: process.platform,
        isDev: isDev,
    };
});

// App lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle app startup
app.on('ready', () => {
    console.log('WidgeTDC Desktop App Ready');
    console.log('Mode:', isDev ? 'Development' : 'Production');
    console.log('Backend URL:', store.get('backendUrl', DEFAULT_BACKEND_URL));
});

// Security: Handle certificate errors in development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
        // In development, allow self-signed certificates
        event.preventDefault();
        callback(true);
    } else {
        callback(false);
    }
});
