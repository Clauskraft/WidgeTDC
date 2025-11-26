const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Settings
    getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
    setBackendUrl: (url) => ipcRenderer.invoke('set-backend-url', url),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

    // Events
    onBackendUrl: (callback) => ipcRenderer.on('backend-url', callback),
    onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
    onShowAbout: (callback) => ipcRenderer.on('show-about', callback),

    // Platform info
    platform: process.platform,
    version: process.env.npm_package_version || '1.0.0',
});
