const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

// Default backend URL (Railway production)
const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || 'https://your-railway-app.railway.app';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        title: 'WidgeTDC - Enterprise AI Dashboard',
        backgroundColor: '#1a1a1a',
    });

    // Get backend URL from settings or use default
    const backendUrl = store.get('backendUrl', DEFAULT_BACKEND_URL);

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        // In development, load from Vite dev server
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load built files
        mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    }

    // Set backend URL in renderer
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('backend-url', backendUrl);
    });

    // Create menu
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Settings',
                    click: () => {
                        mainWindow.webContents.send('open-settings');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Exit',
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
                        mainWindow.webContents.send('show-about');
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

// Handle app updates
app.on('ready', () => {
    // Check for updates (implement auto-updater if needed)
    console.log('WidgeTDC Desktop App Ready');
    console.log('Backend URL:', store.get('backendUrl', DEFAULT_BACKEND_URL));
});
