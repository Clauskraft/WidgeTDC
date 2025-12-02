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
        width: 1400,
        height: 900,
        title: 'WidgeTDC Neural Command Center',
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // Vi skal bruge preload til at injicere status bar
        }
    });

    // Indlæs URL
    loadUrl(lastUrl);

    // Håndter eksterne links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    buildMenu();
}

function loadUrl(url) {
    console.log(`Connecting to: ${url}`);
    
    // Opdater titel baseret på miljø
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    const envName = isLocal ? '🟢 LOCAL (DEV)' : '🔴 PRODUCTION';
    
    mainWindow.setTitle(`WidgeTDC - ${envName}`);
    
    // Gem URL hvis det ikke er fejlsiden
    if (!url.includes('error.html')) {
        store.set('lastUrl', url);
    }

    mainWindow.loadURL(url).then(() => {
        // Inject CSS for at vise status overlay
        const color = isLocal ? '#00ff00' : '#ff0000';
        const css = `
            const div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.width = '100%';
            div.style.height = '4px';
            div.style.backgroundColor = '${color}';
            div.style.zIndex = '99999';
            div.style.pointerEvents = 'none';
            document.body.appendChild(div);
        `;
        mainWindow.webContents.executeJavaScript(css).catch(() => {});
    }).catch(err => {
        console.error('Failed to load:', err);
        mainWindow.loadFile('error.html');
    });
}

function buildMenu() {
    const template = [
        {
            label: 'Neural Network',
            submenu: [
                {
                    label: '🟢 Connect to LOCAL (Dev)',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => loadUrl(DEFAULTS.local)
                },
                {
                    label: '🔴 Connect to PRODUCTION',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => loadUrl(DEFAULTS.prod)
                },
                { type: 'separator' },
                {
                    label: '⚙️ Configure Production URL...',
                    click: () => configureProdUrl()
                },
                { type: 'separator' },
                { role: 'reload', label: '🔄 Refresh Signal' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'togglefullscreen' },
                { role: 'toggledevtools' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

async function configureProdUrl() {
    // På Windows virker prompt() ikke godt i Electron.
    // Vi bruger en lille workaround: Vi antager brugeren vil indtaste det i konsollen eller config filen,
    // ELLER vi åbner en lille input dialog html.
    
    // Simpel løsning: Clipboard
    const { clipboard } = require('electron');
    const text = clipboard.readText();
    
    const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Use Clipboard URL', 'Cancel', 'Clear Config'],
        title: 'Production Configuration',
        message: 'Please copy your Production URL to clipboard and click "Use Clipboard URL".',
        detail: `Current Clipboard: ${text}\n\nCurrent Config: ${store.get('prodUrl') || 'Not Set'}`
    });

    if (response === 0) {
        if (text.startsWith('http')) {
            store.set('prodUrl', text);
            loadUrl(text);
        } else {
            dialog.showErrorBox('Invalid URL', 'The clipboard text does not look like a valid URL (must start with http/https).');
        }
    } else if (response === 2) {
        store.delete('prodUrl');
    }
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
